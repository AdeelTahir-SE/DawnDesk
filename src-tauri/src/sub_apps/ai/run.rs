use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};

use super::{
    check_gguf_model_exists, check_model_exists, check_quantized_model_exists, gguf_file_path,
    original_file_path, quantized_file_path, models_root,
};

/// Resolves the best available model artifact path.
///
/// Priority: quantized -> gguf -> original.
pub fn load_the_model(model_name: &str) -> Result<String, String> {
    if model_name.trim().is_empty() {
        return Err("Model name cannot be empty".to_string());
    }

    if check_quantized_model_exists(model_name) {
        return Ok(quantized_file_path(model_name).to_string_lossy().to_string());
    }
    if check_gguf_model_exists(model_name) {
        return Ok(gguf_file_path(model_name).to_string_lossy().to_string());
    }
    if check_model_exists(model_name) {
        return Ok(original_file_path(model_name).to_string_lossy().to_string());
    }

    Err(format!("Model '{}' not found in models/original|gguf|quantized", model_name))
}

/// Runs a simple chat flow against the selected model.
///
/// This pure Rust baseline returns a deterministic assistant response and includes
/// which local model artifact was selected by the runtime.
pub fn chat_with_model(model_name: &str, prompt: &str) -> Result<String, String> {
    if prompt.trim().is_empty() {
        return Err("Prompt cannot be empty".to_string());
    }

    let model_path = load_the_model(model_name)?;
    // Try a local llama.cpp runtime first (actual model chat), then fallback to a baseline message.
    let runtime_output = std::process::Command::new("llama-cli")
        .arg("-m")
        .arg(&model_path)
        .arg("-p")
        .arg(prompt.trim())
        .arg("-n")
        .arg("256")
        .output();

    match runtime_output {
        Ok(output) if output.status.success() => {
            Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
        }
        Ok(output) => {
            let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
            Err(format!("llama-cli failed: {stderr}"))
        }
        Err(_) => {
            // Fallback keeps app usable when local runtime is not installed.
            Ok(format!(
                "Model: {}\nUsing file: {}\n\nYou said: {}\n\nRuntime fallback active (install llama-cli for full local inference).",
                model_name,
                model_path,
                prompt.trim()
            ))
        }
    }
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

fn ai_db() -> Result<Connection, String> {
    let root = models_root();
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
pub fn ai_create_chat(input: CreateChatInput) -> Result<i64, String> {
    let title = input.title.trim();
    let model_name = input.model_name.trim();
    if title.is_empty() {
        return Err("Chat title cannot be empty".to_string());
    }
    if model_name.is_empty() {
        return Err("Model name cannot be empty".to_string());
    }

    let conn = ai_db()?;
    conn.execute(
        "INSERT INTO chats (title, model_name) VALUES (?1, ?2)",
        params![title, model_name],
    )
    .map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid())
}

#[tauri::command]
pub fn ai_list_chats() -> Result<Vec<ChatThread>, String> {
    let conn = ai_db()?;
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
pub fn ai_get_chat_messages(chat_id: i64) -> Result<Vec<ChatMessage>, String> {
    let conn = ai_db()?;
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
pub async fn ai_send_chat_message(chat_id: i64, model_name: String, prompt: String) -> Result<String, String> {
    let model_name = model_name.trim().to_string();
    let prompt = prompt.trim().to_string();
    if prompt.is_empty() {
        return Err("Prompt cannot be empty".to_string());
    }

    let conn = ai_db()?;
    conn.execute(
        "INSERT INTO messages (chat_id, role, content) VALUES (?1, 'user', ?2)",
        params![chat_id, prompt],
    )
    .map_err(|e| e.to_string())?;

    let model_for_infer = model_name.clone();
    let prompt_for_infer = prompt.clone();
    let response = tauri::async_runtime::spawn_blocking(move || {
        chat_with_model(&model_for_infer, &prompt_for_infer)
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
    let response: String = stmt
        .query_row(params![chat_id], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    Ok(response)
}

/// Tauri command wrapper to inspect resolved model path.
#[tauri::command]
pub fn ai_load_model(model_name: String) -> Result<String, String> {
    load_the_model(&model_name)
}

/// Tauri command wrapper for chat.
#[tauri::command]
pub fn ai_chat_with_model(model_name: String, prompt: String) -> Result<String, String> {
    chat_with_model(&model_name, &prompt)
}


