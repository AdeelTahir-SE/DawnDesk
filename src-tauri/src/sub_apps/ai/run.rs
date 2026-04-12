use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use std::num::NonZeroU32;
use std::sync::{Mutex, OnceLock};

use llama_cpp_4::{
    context::params::LlamaContextParams,
    llama_backend::LlamaBackend,
    llama_batch::LlamaBatch,
    model::{params::LlamaModelParams, AddBos, LlamaModel, Special},
    sampling::LlamaSampler,
};

use super::{
    check_gguf_model_exists, check_model_exists, check_quantized_model_exists, gguf_file_path,
    models_root, original_file_path, quantized_file_path,
};

/// Resolves the best available model artifact path.
/// Priority: quantized -> gguf -> original.
pub fn load_the_model_with_app(app: &AppHandle, model_name: &str) -> Result<String, String> {
    if model_name.trim().is_empty() {
        return Err("Model name cannot be empty".to_string());
    }

    if check_quantized_model_exists(app, model_name)? {
        return Ok(quantized_file_path(app, model_name)?.to_string_lossy().to_string());
    }
    if check_gguf_model_exists(app, model_name)? {
        return Ok(gguf_file_path(app, model_name)?.to_string_lossy().to_string());
    }
    if check_model_exists(app, model_name)? {
        return Ok(original_file_path(app, model_name)?.to_string_lossy().to_string());
    }

    Err(format!(
        "Model '{}' not found in models/original|gguf|quantized",
        model_name
    ))
}

/// Runs chat against the selected local model runtime.
/// Uses embedded llama.cpp bindings via the `llama_cpp` crate (no external process).
pub fn chat_with_model_with_app(
    app: &AppHandle,
    model_name: &str,
    prompt: &str,
) -> Result<String, String> {
    if prompt.trim().is_empty() {
        return Err("Prompt cannot be empty".to_string());
    }

    let model_path = load_the_model_with_app(app, model_name)?;

    // llama.cpp backend can only be initialized once at a time.
    static INFER_LOCK: OnceLock<Mutex<()>> = OnceLock::new();
    let infer_lock = INFER_LOCK.get_or_init(|| Mutex::new(()));
    let _guard = infer_lock
        .lock()
        .map_err(|_| "Inference lock was poisoned".to_string())?;

    let mut backend = LlamaBackend::init()
        .map_err(|e| format!("Failed to initialize llama backend: {e}"))?;
    backend.void_logs();

    let model = LlamaModel::load_from_file(&backend, &model_path, &LlamaModelParams::default())
        .map_err(|e| format!("Failed to load GGUF model via llama_cpp_4: {e}"))?;

    let ctx_params = LlamaContextParams::default()
        .with_n_ctx(NonZeroU32::new(2048))
        .with_n_batch(512)
        .with_n_threads(8);

    let mut ctx = model
        .new_context(&backend, ctx_params)
        .map_err(|e| format!("Failed to create llama context: {e}"))?;

    let formatted_prompt = format!(
        "<|system|>You are a concise and helpful assistant.</s><|user|>{}</s><|assistant|>",
        prompt.trim()
    );

    let tokens = model
        .str_to_token(&formatted_prompt, AddBos::Always)
        .map_err(|e| format!("Failed to tokenize prompt: {e}"))?;
    if tokens.is_empty() {
        return Err("Tokenized prompt is empty".to_string());
    }

    let mut batch = LlamaBatch::new(tokens.len() + 256, 1);
    for (i, &token) in tokens.iter().enumerate() {
        let is_last = i == tokens.len() - 1;
        batch
            .add(token, i as i32, &[0], is_last)
            .map_err(|e| format!("Failed to add prompt token to batch: {e}"))?;
    }
    ctx.decode(&mut batch)
        .map_err(|e| format!("Failed to decode prompt: {e}"))?;

    let mut sampler = LlamaSampler::chain_simple([
        LlamaSampler::top_k(40),
        LlamaSampler::top_p(0.95, 1),
        LlamaSampler::temp(0.8),
        LlamaSampler::dist(0),
    ]);

    let mut output = String::new();
    let mut pos = tokens.len() as i32;

    for _ in 0..256 {
        let token = sampler.sample(&ctx, 0);
        if model.is_eog_token(token) {
            break;
        }

        let bytes = model
            .token_to_bytes(token, Special::Plaintext)
            .map_err(|e| format!("Failed to decode token to text: {e}"))?;
        output.push_str(&String::from_utf8_lossy(&bytes));

        batch.clear();
        batch
            .add(token, pos, &[0], true)
            .map_err(|e| format!("Failed to add generated token to batch: {e}"))?;
        ctx.decode(&mut batch)
            .map_err(|e| format!("Failed to decode generated token: {e}"))?;
        sampler.accept(token);
        pos += 1;

        if output.len() >= 8000 {
            break;
        }
    }

    let final_output = output.trim().to_string();
    if final_output.is_empty() {
        return Err("Model returned an empty response".to_string());
    }

    Ok(final_output)
}

#[derive(Serialize)]
pub struct ChatThread {
    pub id: i64,
    pub title: String,
    pub model_name: String,
    pub updated_at: String,
}

#[derive(Serialize)]
pub struct ChatMessage {
    pub id: i64,
    pub chat_id: i64,
    pub role: String,
    pub content: String,
    pub created_at: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateChatInput {
    pub title: String,
    pub model_name: String,
}

fn ai_db(app: &AppHandle) -> Result<Connection, String> {
    let root = models_root(app)?;
    std::fs::create_dir_all(&root).map_err(|e| e.to_string())?;
    let conn = Connection::open(root.join("ai_chats.db")).map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS chats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            model_name TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chat_id INTEGER NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY(chat_id) REFERENCES chats(id) ON DELETE CASCADE
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    Ok(conn)
}

#[tauri::command]
pub fn ai_create_chat(app: AppHandle, input: CreateChatInput) -> Result<i64, String> {
    let title = input.title.trim();
    let model_name = input.model_name.trim();
    if title.is_empty() {
        return Err("Chat title cannot be empty".to_string());
    }
    if model_name.is_empty() {
        return Err("Model name cannot be empty".to_string());
    }

    let conn = ai_db(&app)?;
    conn.execute(
        "INSERT INTO chats (title, model_name) VALUES (?1, ?2)",
        params![title, model_name],
    )
    .map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid())
}

#[tauri::command]
pub fn ai_list_chats(app: AppHandle) -> Result<Vec<ChatThread>, String> {
    let conn = ai_db(&app)?;
    let mut stmt = conn
        .prepare("SELECT id, title, model_name, updated_at FROM chats ORDER BY updated_at DESC")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(ChatThread {
                id: row.get(0)?,
                title: row.get(1)?,
                model_name: row.get(2)?,
                updated_at: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut chats = Vec::new();
    for row in rows {
        chats.push(row.map_err(|e| e.to_string())?);
    }
    Ok(chats)
}

#[tauri::command]
pub fn ai_get_chat_messages(app: AppHandle, chat_id: i64) -> Result<Vec<ChatMessage>, String> {
    let conn = ai_db(&app)?;
    let mut stmt = conn
        .prepare(
            "SELECT id, chat_id, role, content, created_at
             FROM messages WHERE chat_id = ?1 ORDER BY id ASC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![chat_id], |row| {
            Ok(ChatMessage {
                id: row.get(0)?,
                chat_id: row.get(1)?,
                role: row.get(2)?,
                content: row.get(3)?,
                created_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut msgs = Vec::new();
    for row in rows {
        msgs.push(row.map_err(|e| e.to_string())?);
    }
    Ok(msgs)
}

#[tauri::command]
pub async fn ai_send_chat_message(
    app: AppHandle,
    chat_id: i64,
    model_name: String,
    prompt: String,
) -> Result<String, String> {
    let model_name = model_name.trim().to_string();
    let prompt = prompt.trim().to_string();
    if prompt.is_empty() {
        return Err("Prompt cannot be empty".to_string());
    }

    let conn = ai_db(&app)?;
    conn.execute(
        "INSERT INTO messages (chat_id, role, content) VALUES (?1, 'user', ?2)",
        params![chat_id, prompt],
    )
    .map_err(|e| e.to_string())?;

    let app_for_infer = app.clone();
    let model_for_infer = model_name.clone();
    let prompt_for_infer = prompt.clone();
    let response = tauri::async_runtime::spawn_blocking(move || {
        chat_with_model_with_app(&app_for_infer, &model_for_infer, &prompt_for_infer)
    })
    .await
    .map_err(|e| e.to_string())??;

    conn.execute(
        "INSERT INTO messages (chat_id, role, content) VALUES (?1, 'assistant', ?2)",
        params![chat_id, response],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE chats SET updated_at = datetime('now') WHERE id = ?1",
        params![chat_id],
    )
    .map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT content FROM messages WHERE chat_id = ?1 AND role = 'assistant' ORDER BY id DESC LIMIT 1",
        )
        .map_err(|e| e.to_string())?;

    let latest_response: String = stmt
        .query_row(params![chat_id], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    Ok(latest_response)
}

#[tauri::command]
pub fn ai_load_model(app: AppHandle, model_name: String) -> Result<String, String> {
    load_the_model_with_app(&app, &model_name)
}

#[tauri::command]
pub fn ai_chat_with_model(app: AppHandle, model_name: String, prompt: String) -> Result<String, String> {
    chat_with_model_with_app(&app, &model_name, &prompt)
}
