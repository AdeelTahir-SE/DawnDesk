// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
pub mod sub_apps;

use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::{env, fs, path::PathBuf};
use tauri::{Emitter, Manager};
use tauri_plugin_deep_link::DeepLinkExt;

const STARTUP_SCRIPT_NAME: &str = "DawnDesk.cmd";
const NATIVE_SETTINGS_FILE: &str = "native-settings.json";
const AI_SETTINGS_FILE: &str = "ai-settings.json";
const OPENAI_BASE_URL: &str = "https://api.openai.com/v1";
const ANTHROPIC_BASE_URL: &str = "https://api.anthropic.com/v1";
const GEMINI_BASE_URL: &str = "https://generativelanguage.googleapis.com/v1beta";
const DEEPSEEK_BASE_URL: &str = "https://api.deepseek.com/v1";
const OLLAMA_LOCAL_BASE_URL: &str = "http://localhost:11434/api";
const OLLAMA_CLOUD_BASE_URL: &str = "https://ollama.com/api";
const AUTH_DEEP_LINK_EVENT: &str = "dawndesk-auth-deep-link";
const AUTH_DEEP_LINK_PREFIX: &str = "dawndesk://auth/callback";

#[derive(Default, Deserialize, Serialize)]
#[serde(default)]
struct NativeSettings {
    hardware_acceleration: Option<bool>,
}

#[derive(Default, Deserialize, Serialize)]
#[serde(default)]
struct AiProviderSettings {
    api_key: Option<String>,
    model: Option<String>,
    image_model: Option<String>,
    video_model: Option<String>,
    ollama_mode: Option<String>,
}

#[derive(Default, Deserialize, Serialize)]
#[serde(default)]
struct AiSettings {
    default_provider: Option<String>,
    openai: AiProviderSettings,
    anthropic: AiProviderSettings,
    ollama: AiProviderSettings,
    gemini: AiProviderSettings,
    deepseek: AiProviderSettings,
    seedream: AiProviderSettings,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct AiGenerateRequest {
    provider: Option<String>,
    prompt: String,
    system: Option<String>,
    model: Option<String>,
    temperature: Option<f64>,
    max_tokens: Option<u32>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AiGenerateResponse {
    text: String,
    provider: String,
    model: String,
    prompt_tokens: u64,
    completion_tokens: u64,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct AiGenerateImageRequest {
    prompt: String,
    size: Option<String>,
    count: Option<u8>,
    model: Option<String>,
    input_image: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AiGeneratedImage {
    data_url: String,
}

#[derive(Clone)]
struct PdfLine {
    x: f32,
    y: f32,
    font: &'static str,
    size: f32,
    text: String,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn strip_markdown_inline(value: &str) -> String {
    value
        .replace("**", "")
        .replace("__", "")
        .replace('*', "")
        .replace('_', "")
        .replace('`', "")
}

fn wrap_pdf_text(text: &str, size: f32, max_width: f32) -> Vec<String> {
    let max_chars = ((max_width / (size * 0.52)).floor() as usize).max(12);
    let mut lines = Vec::new();
    let mut current = String::new();

    for word in text.split_whitespace() {
        let separator = if current.is_empty() { 0 } else { 1 };
        if !current.is_empty() && current.len() + separator + word.len() > max_chars {
            lines.push(current);
            current = String::new();
        }

        if word.len() > max_chars {
            if !current.is_empty() {
                lines.push(current);
                current = String::new();
            }
            let mut start = 0;
            while start < word.len() {
                let end = (start + max_chars).min(word.len());
                lines.push(word[start..end].to_string());
                start = end;
            }
            continue;
        }

        if !current.is_empty() {
            current.push(' ');
        }
        current.push_str(word);
    }

    if !current.is_empty() {
        lines.push(current);
    }
    if lines.is_empty() {
        lines.push(String::new());
    }
    lines
}

fn push_pdf_line(
    pages: &mut Vec<Vec<PdfLine>>,
    y: &mut f32,
    x: f32,
    font: &'static str,
    size: f32,
    leading: f32,
    text: String,
) {
    const PAGE_HEIGHT: f32 = 842.0;
    const MARGIN: f32 = 54.0;
    const BOTTOM_MARGIN: f32 = 54.0;

    if *y < BOTTOM_MARGIN + leading {
        pages.push(Vec::new());
        *y = PAGE_HEIGHT - MARGIN;
    }

    if let Some(page) = pages.last_mut() {
        page.push(PdfLine { x, y: *y, font, size, text });
    }
    *y -= leading;
}

fn push_pdf_block(
    pages: &mut Vec<Vec<PdfLine>>,
    y: &mut f32,
    x: f32,
    max_width: f32,
    font: &'static str,
    size: f32,
    leading: f32,
    after: f32,
    text: &str,
) {
    for line in wrap_pdf_text(text, size, max_width) {
        push_pdf_line(pages, y, x, font, size, leading, line);
    }
    *y -= after;
}

fn escape_pdf_text(value: &str) -> String {
    value
        .replace('\\', "\\\\")
        .replace('(', "\\(")
        .replace(')', "\\)")
        .replace('\r', " ")
        .replace('\n', " ")
}

fn pdf_stream_for_page(lines: &[PdfLine]) -> String {
    let mut stream = String::from("BT\n");
    for line in lines {
        stream.push_str(&format!(
            "/{} {} Tf\n1 0 0 1 {:.2} {:.2} Tm\n({}) Tj\n",
            line.font,
            line.size,
            line.x,
            line.y,
            escape_pdf_text(&line.text)
        ));
    }
    stream.push_str("ET\n");
    stream
}

fn build_markdown_pdf(markdown: &str) -> Vec<u8> {
    const PAGE_WIDTH: f32 = 595.0;
    const PAGE_HEIGHT: f32 = 842.0;
    const MARGIN: f32 = 54.0;

    let mut pages = vec![Vec::new()];
    let mut y = PAGE_HEIGHT - MARGIN;
    let body_width = PAGE_WIDTH - (MARGIN * 2.0);

    for block in markdown.split("\n\n") {
        let trimmed = block.trim();
        if trimmed.is_empty() {
            continue;
        }

        if let Some(text) = trimmed.strip_prefix("# ") {
            push_pdf_block(&mut pages, &mut y, MARGIN, body_width, "F2", 24.0, 30.0, 12.0, &strip_markdown_inline(text));
        } else if let Some(text) = trimmed.strip_prefix("## ") {
            push_pdf_block(&mut pages, &mut y, MARGIN, body_width, "F2", 18.0, 24.0, 8.0, &strip_markdown_inline(text));
        } else if let Some(text) = trimmed.strip_prefix("### ") {
            push_pdf_block(&mut pages, &mut y, MARGIN, body_width, "F2", 14.0, 20.0, 6.0, &strip_markdown_inline(text));
        } else if trimmed.lines().all(|line| line.trim_start().starts_with("- ")) {
            for line in trimmed.lines() {
                let item = line.trim_start().trim_start_matches("- ").trim();
                push_pdf_block(
                    &mut pages,
                    &mut y,
                    MARGIN + 18.0,
                    body_width - 18.0,
                    "F1",
                    11.0,
                    16.0,
                    2.0,
                    &format!("- {}", strip_markdown_inline(item)),
                );
            }
            y -= 6.0;
        } else {
            let paragraph = strip_markdown_inline(&trimmed.replace('\n', " "));
            push_pdf_block(&mut pages, &mut y, MARGIN, body_width, "F1", 11.0, 17.0, 8.0, &paragraph);
        }
    }

    if pages.last().is_some_and(|page| page.is_empty()) && pages.len() > 1 {
        pages.pop();
    }

    let mut objects = vec![
        "<< /Type /Catalog /Pages 2 0 R >>".to_string(),
        String::new(),
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>".to_string(),
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>".to_string(),
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>".to_string(),
    ];
    let mut page_object_ids = Vec::new();

    for page in &pages {
        let stream = pdf_stream_for_page(page);
        let content_id = objects.len() + 1;
        objects.push(format!("<< /Length {} >>\nstream\n{}endstream", stream.as_bytes().len(), stream));
        let page_id = objects.len() + 1;
        page_object_ids.push(page_id);
        objects.push(format!(
            "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {:.0} {:.0}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents {} 0 R >>",
            PAGE_WIDTH, PAGE_HEIGHT, content_id
        ));
    }

    let kids = page_object_ids
        .iter()
        .map(|id| format!("{} 0 R", id))
        .collect::<Vec<_>>()
        .join(" ");
    objects[1] = format!("<< /Type /Pages /Kids [{}] /Count {} >>", kids, page_object_ids.len());

    let mut pdf = String::from("%PDF-1.4\n");
    let mut offsets = Vec::new();
    for (index, object) in objects.iter().enumerate() {
        offsets.push(pdf.len());
        pdf.push_str(&format!("{} 0 obj\n{}\nendobj\n", index + 1, object));
    }

    let xref_start = pdf.len();
    pdf.push_str(&format!("xref\n0 {}\n0000000000 65535 f \n", objects.len() + 1));
    for offset in offsets {
        pdf.push_str(&format!("{:010} 00000 n \n", offset));
    }
    pdf.push_str(&format!(
        "trailer\n<< /Size {} /Root 1 0 R >>\nstartxref\n{}\n%%EOF",
        objects.len() + 1,
        xref_start
    ));
    pdf.into_bytes()
}

#[tauri::command]
fn export_markdown_pdf(markdown: String, path: String) -> Result<String, String> {
    let path = PathBuf::from(path);
    if path.extension().and_then(|extension| extension.to_str()) != Some("pdf") {
        return Err("Choose a .pdf output path.".to_string());
    }
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    fs::write(&path, build_markdown_pdf(&markdown)).map_err(|error| error.to_string())?;
    Ok(path.to_string_lossy().to_string())
}

fn auth_deep_link_from_args(args: impl IntoIterator<Item = String>) -> Option<String> {
    args.into_iter()
        .find(|arg| arg.starts_with(AUTH_DEEP_LINK_PREFIX))
}

#[tauri::command]
fn get_auth_deep_link_arg() -> Option<String> {
    auth_deep_link_from_args(env::args())
}

fn app_config_dir() -> Result<PathBuf, String> {
    let base = env::var_os("APPDATA")
        .map(PathBuf::from)
        .or_else(|| env::var_os("XDG_CONFIG_HOME").map(PathBuf::from))
        .or_else(|| env::var_os("HOME").map(|home| PathBuf::from(home).join(".config")))
        .ok_or_else(|| "Could not resolve app config directory.".to_string())?;
    Ok(base.join("dawndesk"))
}

fn native_settings_path() -> Result<PathBuf, String> {
    Ok(app_config_dir()?.join(NATIVE_SETTINGS_FILE))
}

fn ai_settings_path() -> Result<PathBuf, String> {
    Ok(app_config_dir()?.join(AI_SETTINGS_FILE))
}

fn read_native_settings() -> NativeSettings {
    let Ok(path) = native_settings_path() else {
        return NativeSettings::default();
    };
    let Ok(contents) = fs::read_to_string(path) else {
        return NativeSettings::default();
    };
    serde_json::from_str(&contents).unwrap_or_default()
}

fn read_ai_settings_from_disk() -> AiSettings {
    let Ok(path) = ai_settings_path() else {
        return AiSettings::default();
    };
    let Ok(contents) = fs::read_to_string(path) else {
        return AiSettings::default();
    };
    serde_json::from_str(&contents).unwrap_or_default()
}

fn write_ai_settings(settings: &AiSettings) -> Result<(), String> {
    let path = ai_settings_path()?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    let contents = serde_json::to_string_pretty(settings).map_err(|error| error.to_string())?;
    fs::write(path, contents).map_err(|error| error.to_string())
}

fn write_native_settings(settings: &NativeSettings) -> Result<(), String> {
    let path = native_settings_path()?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    let contents = serde_json::to_string_pretty(settings).map_err(|error| error.to_string())?;
    fs::write(path, contents).map_err(|error| error.to_string())
}

fn startup_script_path() -> Result<PathBuf, String> {
    let appdata = env::var_os("APPDATA")
        .ok_or_else(|| "Windows APPDATA directory is not available.".to_string())?;
    Ok(PathBuf::from(appdata)
        .join("Microsoft")
        .join("Windows")
        .join("Start Menu")
        .join("Programs")
        .join("Startup")
        .join(STARTUP_SCRIPT_NAME))
}

#[tauri::command]
fn get_auto_launch() -> Result<bool, String> {
    remove_startup_script()?;
    Ok(false)
}

#[tauri::command]
fn set_auto_launch(_enabled: bool) -> Result<bool, String> {
    remove_startup_script()?;
    Ok(false)
}

fn remove_startup_script() -> Result<(), String> {
    let path = startup_script_path()?;
    if path.exists() {
        fs::remove_file(&path).map_err(|error| error.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn get_hardware_acceleration() -> Result<bool, String> {
    Ok(read_native_settings().hardware_acceleration.unwrap_or(true))
}

#[tauri::command]
fn set_hardware_acceleration(enabled: bool) -> Result<bool, String> {
    let mut settings = read_native_settings();
    settings.hardware_acceleration = Some(enabled);
    write_native_settings(&settings)?;
    Ok(enabled)
}

#[tauri::command]
fn get_ai_settings() -> Result<AiSettings, String> {
    Ok(read_ai_settings_from_disk())
}

#[tauri::command]
fn set_ai_settings(settings: AiSettings) -> Result<AiSettings, String> {
    write_ai_settings(&settings)?;
    Ok(settings)
}

fn normalize_ai_provider(provider: Option<&String>) -> String {
    match provider.map(|value| value.as_str()) {
        Some("anthropic") => "anthropic".to_string(),
        Some("ollama") => "ollama".to_string(),
        Some("gemini") => "gemini".to_string(),
        Some("deepseek") => "deepseek".to_string(),
        Some("seedream") => "seedream".to_string(),
        _ => "openai".to_string(),
    }
}

fn ai_provider_settings<'a>(settings: &'a AiSettings, provider: &str) -> &'a AiProviderSettings {
    match provider {
        "anthropic" => &settings.anthropic,
        "ollama" => &settings.ollama,
        "gemini" => &settings.gemini,
        "deepseek" => &settings.deepseek,
        "seedream" => &settings.seedream,
        _ => &settings.openai,
    }
}

fn ai_provider_label(provider: &str) -> &'static str {
    match provider {
        "anthropic" => "Claude",
        "ollama" => "Ollama",
        "gemini" => "Gemini",
        "deepseek" => "DeepSeek",
        "seedream" => "Seedream",
        _ => "ChatGPT",
    }
}

fn ai_default_model(provider: &str, settings: &AiProviderSettings) -> String {
    settings.model.clone().unwrap_or_else(|| match provider {
        "anthropic" => "claude-3-5-haiku-latest".to_string(),
        "ollama" => "gpt-oss:120b".to_string(),
        "gemini" => "gemini-2.5-flash".to_string(),
        "deepseek" => "deepseek-chat".to_string(),
        "seedream" => "seedream-4.0".to_string(),
        _ => "gpt-4.1-mini".to_string(),
    })
}

fn require_ai_key(provider: &str, key: &Option<String>) -> Result<String, String> {
    key.as_ref()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
        .ok_or_else(|| format!("{} API key is missing. Add it in Settings > AI Providers.", ai_provider_label(provider)))
}

fn ollama_base_url(settings: &AiSettings) -> &'static str {
    if settings.ollama.ollama_mode.as_deref() == Some("local") {
        OLLAMA_LOCAL_BASE_URL
    } else {
        OLLAMA_CLOUD_BASE_URL
    }
}

fn post_json(url: &str, headers: Vec<(&str, String)>, body: Value) -> Result<Value, String> {
    let client = reqwest::blocking::Client::new();
    let mut request = client
        .post(url)
        .header("Content-Type", "application/json")
        .body(body.to_string());
    for (key, value) in headers {
        request = request.header(key, value);
    }
    let response = request.send().map_err(|error| error.to_string())?;
    let status = response.status();
    let text = response.text().map_err(|error| error.to_string())?;
    let data: Value = serde_json::from_str(&text).unwrap_or_else(|_| json!({ "message": text }));
    if !status.is_success() {
        return Err(data
            .pointer("/error/message")
            .and_then(Value::as_str)
            .or_else(|| data.get("message").and_then(Value::as_str))
            .unwrap_or("AI request failed.")
            .to_string());
    }
    Ok(data)
}

fn get_json(url: &str, headers: Vec<(&str, String)>) -> Result<Value, String> {
    let client = reqwest::blocking::Client::new();
    let mut request = client.get(url);
    for (key, value) in headers {
        request = request.header(key, value);
    }
    let response = request.send().map_err(|error| error.to_string())?;
    let status = response.status();
    let text = response.text().map_err(|error| error.to_string())?;
    let data: Value = serde_json::from_str(&text).unwrap_or_else(|_| json!({ "message": text }));
    if !status.is_success() {
        return Err(data
            .pointer("/error/message")
            .and_then(Value::as_str)
            .or_else(|| data.get("message").and_then(Value::as_str))
            .unwrap_or("AI request failed.")
            .to_string());
    }
    Ok(data)
}

fn openai_compatible_chat(
    base_url: &str,
    provider: &str,
    provider_settings: &AiProviderSettings,
    model: &str,
    prompt: String,
    system: Option<String>,
    temperature: f64,
    max_tokens: u32,
) -> Result<AiGenerateResponse, String> {
    let mut messages = Vec::new();
    if let Some(system) = system {
        messages.push(json!({ "role": "system", "content": system }));
    }
    messages.push(json!({ "role": "user", "content": prompt }));
    let data = post_json(
        &format!("{}/chat/completions", base_url),
        vec![("Authorization", format!("Bearer {}", require_ai_key(provider, &provider_settings.api_key)?))],
        json!({ "model": model, "temperature": temperature, "max_tokens": max_tokens, "messages": messages }),
    )?;
    let text = data.pointer("/choices/0/message/content").and_then(Value::as_str).unwrap_or("").trim().to_string();
    Ok(AiGenerateResponse {
        text,
        provider: provider.to_string(),
        model: model.to_string(),
        prompt_tokens: data.pointer("/usage/prompt_tokens").and_then(Value::as_u64).unwrap_or(0),
        completion_tokens: data.pointer("/usage/completion_tokens").and_then(Value::as_u64).unwrap_or(0),
    })
}

#[tauri::command]
fn ai_list_ollama_models(settings: AiSettings) -> Result<Vec<String>, String> {
    let mut headers = Vec::new();
    if settings.ollama.ollama_mode.as_deref() != Some("local") {
        headers.push(("Authorization", format!("Bearer {}", require_ai_key("ollama", &settings.ollama.api_key)?)));
    }
    let data = get_json(&format!("{}/tags", ollama_base_url(&settings)), headers)?;
    Ok(data
        .get("models")
        .and_then(Value::as_array)
        .map(|models| {
            models
                .iter()
                .filter_map(|model| model.get("name").and_then(Value::as_str).map(str::to_string))
                .collect()
        })
        .unwrap_or_default())
}

#[tauri::command]
fn ai_verify_provider(provider: String, settings: AiSettings) -> Result<String, String> {
    let provider = normalize_ai_provider(Some(&provider));
    let provider_settings = ai_provider_settings(&settings, &provider);
    let model = ai_default_model(&provider, provider_settings);

    if provider == "openai" {
        get_json(
            &format!("{}/models/{}", OPENAI_BASE_URL, model),
            vec![("Authorization", format!("Bearer {}", require_ai_key(&provider, &provider_settings.api_key)?))],
        )?;
        return Ok(format!("{} is configured for {}.", ai_provider_label(&provider), model));
    }

    if provider == "deepseek" {
        openai_compatible_chat(
            DEEPSEEK_BASE_URL,
            &provider,
            provider_settings,
            &model,
            "Reply with ok.".to_string(),
            None,
            0.2,
            1,
        )?;
        return Ok(format!("{} is configured for {}.", ai_provider_label(&provider), model));
    }

    if provider == "gemini" {
        post_json(
            &format!("{}/models/{}:generateContent?key={}", GEMINI_BASE_URL, model, require_ai_key(&provider, &provider_settings.api_key)?),
            vec![],
            json!({
                "contents": [{ "parts": [{ "text": "Reply with ok." }] }],
                "generationConfig": { "maxOutputTokens": 1, "temperature": 0.2 }
            }),
        )?;
        return Ok(format!("{} is configured for {}.", ai_provider_label(&provider), model));
    }

    if provider == "seedream" {
        require_ai_key(&provider, &provider_settings.api_key)?;
        return Ok(format!("{} is configured for {}.", ai_provider_label(&provider), model));
    }

    if provider == "anthropic" {
        post_json(
            &format!("{}/messages", ANTHROPIC_BASE_URL),
            vec![
                ("x-api-key", require_ai_key(&provider, &provider_settings.api_key)?),
                ("anthropic-version", "2023-06-01".to_string()),
            ],
            json!({
                "model": model,
                "max_tokens": 1,
                "messages": [{ "role": "user", "content": "Reply with ok." }]
            }),
        )?;
        return Ok(format!("{} is configured for {}.", ai_provider_label(&provider), model));
    }

    let mode_label = if provider_settings.ollama_mode.as_deref() == Some("local") { "local" } else { "cloud" };
    let models = ai_list_ollama_models(settings)?;
    if !models.iter().any(|installed| installed == &model || installed.starts_with(&format!("{}:", model))) {
        return Err(format!("Ollama is reachable, but {} is not available.", model));
    }
    Ok(format!("Ollama {} is configured for {}.", mode_label, model))
}

#[tauri::command]
fn ai_generate_text(request: AiGenerateRequest) -> Result<AiGenerateResponse, String> {
    let settings = read_ai_settings_from_disk();
    let provider = normalize_ai_provider(request.provider.as_ref().or(settings.default_provider.as_ref()));
    let provider_settings = ai_provider_settings(&settings, &provider);
    let model = request.model.clone().unwrap_or_else(|| ai_default_model(&provider, provider_settings));
    let max_tokens = request.max_tokens.unwrap_or(1200);
    let temperature = request.temperature.unwrap_or(0.7);

    if provider == "openai" {
        return openai_compatible_chat(
            OPENAI_BASE_URL,
            &provider,
            provider_settings,
            &model,
            request.prompt,
            request.system,
            temperature,
            max_tokens,
        );
    }

    if provider == "deepseek" {
        return openai_compatible_chat(
            DEEPSEEK_BASE_URL,
            &provider,
            provider_settings,
            &model,
            request.prompt,
            request.system,
            temperature,
            max_tokens,
        );
    }

    if provider == "gemini" {
        let mut parts = Vec::new();
        if let Some(system) = request.system.clone().filter(|value| !value.trim().is_empty()) {
            parts.push(json!({ "text": format!("System instructions:\n{}\n\nUser request:\n{}", system, request.prompt) }));
        } else {
            parts.push(json!({ "text": request.prompt }));
        }
        let data = post_json(
            &format!("{}/models/{}:generateContent?key={}", GEMINI_BASE_URL, model, require_ai_key(&provider, &provider_settings.api_key)?),
            vec![],
            json!({
                "contents": [{ "role": "user", "parts": parts }],
                "generationConfig": { "temperature": temperature, "maxOutputTokens": max_tokens }
            }),
        )?;
        let text = data.pointer("/candidates/0/content/parts/0/text").and_then(Value::as_str).unwrap_or("").trim().to_string();
        return Ok(AiGenerateResponse {
            text,
            provider,
            model,
            prompt_tokens: data.pointer("/usageMetadata/promptTokenCount").and_then(Value::as_u64).unwrap_or(0),
            completion_tokens: data.pointer("/usageMetadata/candidatesTokenCount").and_then(Value::as_u64).unwrap_or(0),
        });
    }

    if provider == "seedream" {
        return Err("Seedream is configured for image generation, not text generation.".to_string());
    }

    if provider == "anthropic" {
        let data = post_json(
            &format!("{}/messages", ANTHROPIC_BASE_URL),
            vec![
                ("x-api-key", require_ai_key(&provider, &provider_settings.api_key)?),
                ("anthropic-version", "2023-06-01".to_string()),
            ],
            json!({
                "model": model,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "system": request.system,
                "messages": [{ "role": "user", "content": request.prompt }]
            }),
        )?;
        let text = data.get("content")
            .and_then(Value::as_array)
            .map(|parts| parts.iter().filter_map(|part| part.get("text").and_then(Value::as_str)).collect::<Vec<_>>().join(""))
            .unwrap_or_default()
            .trim()
            .to_string();
        return Ok(AiGenerateResponse {
            text,
            provider,
            model,
            prompt_tokens: data.pointer("/usage/input_tokens").and_then(Value::as_u64).unwrap_or(0),
            completion_tokens: data.pointer("/usage/output_tokens").and_then(Value::as_u64).unwrap_or(0),
        });
    }

    let mut headers = Vec::new();
    if settings.ollama.ollama_mode.as_deref() != Some("local") {
        headers.push(("Authorization", format!("Bearer {}", require_ai_key("ollama", &settings.ollama.api_key)?)));
    }
    let mut messages = Vec::new();
    if let Some(system) = request.system.clone() {
        messages.push(json!({ "role": "system", "content": system }));
    }
    messages.push(json!({ "role": "user", "content": request.prompt }));
    let data = post_json(
        &format!("{}/chat", ollama_base_url(&settings)),
        headers,
        json!({ "model": model, "stream": false, "messages": messages, "options": { "temperature": temperature, "num_predict": max_tokens } }),
    )?;
    let text = data.pointer("/message/content")
        .and_then(Value::as_str)
        .or_else(|| data.get("response").and_then(Value::as_str))
        .unwrap_or("")
        .trim()
        .to_string();
    Ok(AiGenerateResponse {
        text,
        provider,
        model,
        prompt_tokens: data.get("prompt_eval_count").and_then(Value::as_u64).unwrap_or(0),
        completion_tokens: data.get("eval_count").and_then(Value::as_u64).unwrap_or(0),
    })
}

#[tauri::command]
fn ai_generate_images(request: AiGenerateImageRequest) -> Result<Vec<AiGeneratedImage>, String> {
    let settings = read_ai_settings_from_disk();
    let model = request.model.clone().or_else(|| settings
        .openai
        .image_model
        .clone())
        .unwrap_or_else(|| "gpt-image-1.5".to_string());
    let count = request.count.unwrap_or(1).clamp(1, 4);
    let size = request.size.unwrap_or_else(|| "1024x1024".to_string());
    let prompt = if let Some(input_image) = request.input_image.as_ref().filter(|value| !value.trim().is_empty()) {
        format!(
            "{}\n\nUse the supplied reference image as visual context. Reference image data URL: {}",
            request.prompt,
            input_image
        )
    } else {
        request.prompt
    };
    let data = post_json(
        &format!("{}/images/generations", OPENAI_BASE_URL),
        vec![("Authorization", format!("Bearer {}", require_ai_key("openai", &settings.openai.api_key)?))],
        json!({
            "model": model,
            "prompt": prompt,
            "size": size,
            "n": count,
            "response_format": "b64_json"
        }),
    )?;
    let images = data
        .get("data")
        .and_then(Value::as_array)
        .map(|items| {
            items
                .iter()
                .filter_map(|item| {
                    item.get("b64_json")
                        .and_then(Value::as_str)
                        .map(|b64| AiGeneratedImage { data_url: format!("data:image/png;base64,{}", b64) })
                        .or_else(|| item.get("url").and_then(Value::as_str).map(|url| AiGeneratedImage { data_url: url.to_string() }))
                })
                .collect::<Vec<_>>()
        })
        .unwrap_or_default();
    if images.is_empty() {
        return Err("Image generation finished without returning an image.".to_string());
    }
    Ok(images)
}

fn apply_hardware_acceleration_from_settings() {
    if read_native_settings().hardware_acceleration.unwrap_or(true) {
        return;
    }

    let mut args = env::var("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS").unwrap_or_default();
    if !args.contains("--disable-gpu") {
        if !args.trim().is_empty() {
            args.push(' ');
        }
        args.push_str("--disable-gpu --disable-software-rasterizer");
        env::set_var("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", args);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn auth_deep_link_from_args_returns_first_dawndesk_auth_callback() {
        let args = vec![
            "dawndesk.exe".to_string(),
            "--flag".to_string(),
            "https://example.com/ignored".to_string(),
            "dawndesk://auth/callback?code=abc123".to_string(),
            "dawndesk://auth/callback?code=second".to_string(),
        ];

        assert_eq!(
            auth_deep_link_from_args(args),
            Some("dawndesk://auth/callback?code=abc123".to_string())
        );
    }

    #[test]
    fn auth_deep_link_from_args_ignores_non_auth_urls() {
        let args = vec![
            "dawndesk.exe".to_string(),
            "dawndesk://settings".to_string(),
            "https://example.com".to_string(),
        ];

        assert_eq!(auth_deep_link_from_args(args), None);
    }

    #[test]
    fn markdown_pdf_builder_outputs_pdf_with_expected_markers() {
        let pdf = build_markdown_pdf(
            "# Release Notes\n\n## Highlights\n\n- Added updater\n- Fixed exports\n\nPlain text paragraph.",
        );
        let text = String::from_utf8_lossy(&pdf);

        assert!(text.starts_with("%PDF-1.4"));
        assert!(text.contains("/Type /Catalog"));
        assert!(text.contains("/Type /Pages"));
        assert!(text.contains("xref"));
        assert!(text.ends_with("%%EOF"));
    }

    #[test]
    fn markdown_inline_stripper_removes_common_formatting_marks() {
        assert_eq!(
            strip_markdown_inline("**bold** __strong__ *em* _i_ `code`"),
            "bold strong em i code"
        );
    }

    #[test]
    fn wrap_pdf_text_breaks_long_paragraphs_and_keeps_empty_input_visible() {
        let wrapped = wrap_pdf_text(
            "DawnDesk keeps release notes, updater metadata, and native commands tidy.",
            11.0,
            80.0,
        );

        assert!(wrapped.len() > 1);
        assert_eq!(wrap_pdf_text("", 11.0, 80.0), vec![String::new()]);
    }

    #[test]
    fn ai_provider_normalization_and_defaults_are_stable() {
        let settings = AiProviderSettings::default();

        assert_eq!(normalize_ai_provider(None), "openai");
        assert_eq!(normalize_ai_provider(Some(&"gemini".to_string())), "gemini");
        assert_eq!(normalize_ai_provider(Some(&"unknown".to_string())), "openai");
        assert_eq!(ai_default_model("openai", &settings), "gpt-4.1-mini");
        assert_eq!(ai_default_model("gemini", &settings), "gemini-2.5-flash");
        assert_eq!(ai_default_model("anthropic", &settings), "claude-3-5-haiku-latest");
    }

    #[test]
    fn require_ai_key_rejects_missing_or_blank_keys() {
        assert!(require_ai_key("openai", &None).is_err());
        assert!(require_ai_key("openai", &Some("   ".to_string())).is_err());
        assert_eq!(
            require_ai_key("openai", &Some(" sk-test ".to_string())).expect("key should trim"),
            "sk-test"
        );
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    apply_hardware_acceleration_from_settings();

    tauri::Builder::default()
        .setup(|app| {
            #[cfg(target_os = "windows")]
            {
                if let Err(error) = app.deep_link().register_all() {
                    eprintln!("Failed to register deep links: {error}");
                }
            }
            Ok(())
        })
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            if let Some(url) = auth_deep_link_from_args(argv) {
                let _ = app.emit(AUTH_DEEP_LINK_EVENT, url);
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.set_focus();
                }
            }
        }))
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_auth_deep_link_arg,
            get_auto_launch,
            set_auto_launch,
            get_hardware_acceleration,
            set_hardware_acceleration,
            get_ai_settings,
            set_ai_settings,
            export_markdown_pdf,
            ai_list_ollama_models,
            ai_verify_provider,
            ai_generate_text,
            ai_generate_images,
            sub_apps::video_editor::ve_probe_media,
            sub_apps::video_editor::ve_generate_thumbnail,
            sub_apps::video_editor::ve_generate_waveform,
            sub_apps::video_editor::ve_import_media,
            sub_apps::video_editor::ve_export_project,
            sub_apps::video_editor::ve_get_export_progress,
            sub_apps::video_editor::ve_cancel_export,
            sub_apps::video_editor::ve_save_project,
            sub_apps::video_editor::ve_load_project,
            sub_apps::video_editor::ve_check_ffmpeg,
            sub_apps::photo_editor::photo_export_file,
            // Notes Taking
            sub_apps::notes_taking::notes_create_note,
            sub_apps::notes_taking::notes_get_notes,
            sub_apps::notes_taking::notes_update_note,
            sub_apps::notes_taking::notes_delete_note,
            sub_apps::notes_taking::notes_search_notes,
            sub_apps::notes_taking::notes_create_notebook,
            sub_apps::notes_taking::notes_get_notebooks,
            sub_apps::notes_taking::notes_update_notebook,
            sub_apps::notes_taking::notes_delete_notebook,
            sub_apps::notes_taking::notes_create_tag,
            sub_apps::notes_taking::notes_get_tags,
            sub_apps::notes_taking::notes_update_tag,
            sub_apps::notes_taking::notes_delete_tag,
            sub_apps::notes_taking::notes_add_tag_to_note,
            sub_apps::notes_taking::notes_remove_tag_from_note,
            sub_apps::notes_taking::notes_get_note_tags,
            sub_apps::notes_taking::notes_create_link,
            sub_apps::notes_taking::notes_get_links,
            sub_apps::notes_taking::notes_delete_link,
            sub_apps::notes_taking::notes_get_backlinks,
            sub_apps::notes_taking::notes_get_all_links,
            sub_apps::notes_taking::notes_create_version,
            sub_apps::notes_taking::notes_get_versions,
            sub_apps::notes_taking::notes_create_template,
            sub_apps::notes_taking::notes_get_templates,
            sub_apps::notes_taking::notes_delete_template,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
