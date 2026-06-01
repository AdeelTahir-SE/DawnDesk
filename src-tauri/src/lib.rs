// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
pub mod sub_apps;

use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::{env, fs, path::PathBuf};

const STARTUP_SCRIPT_NAME: &str = "DawnDesk.cmd";
const NATIVE_SETTINGS_FILE: &str = "native-settings.json";
const AI_SETTINGS_FILE: &str = "ai-settings.json";
const OPENAI_BASE_URL: &str = "https://api.openai.com/v1";
const ANTHROPIC_BASE_URL: &str = "https://api.anthropic.com/v1";
const OLLAMA_LOCAL_BASE_URL: &str = "http://localhost:11434/api";
const OLLAMA_CLOUD_BASE_URL: &str = "https://ollama.com/api";

#[derive(Default, Deserialize, Serialize)]
struct NativeSettings {
    hardware_acceleration: Option<bool>,
}

#[derive(Default, Deserialize, Serialize)]
struct AiProviderSettings {
    api_key: Option<String>,
    model: Option<String>,
    image_model: Option<String>,
    video_model: Option<String>,
    ollama_mode: Option<String>,
}

#[derive(Default, Deserialize, Serialize)]
struct AiSettings {
    default_provider: Option<String>,
    openai: AiProviderSettings,
    anthropic: AiProviderSettings,
    ollama: AiProviderSettings,
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

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
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
    Ok(startup_script_path()?.exists())
}

#[tauri::command]
fn set_auto_launch(enabled: bool) -> Result<bool, String> {
    let path = startup_script_path()?;
    if enabled {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).map_err(|error| error.to_string())?;
        }
        let exe = env::current_exe().map_err(|error| error.to_string())?;
        let script = format!("@echo off\r\nstart \"\" \"{}\"\r\n", exe.display());
        fs::write(&path, script).map_err(|error| error.to_string())?;
    } else if path.exists() {
        fs::remove_file(&path).map_err(|error| error.to_string())?;
    }
    Ok(enabled)
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
        _ => "openai".to_string(),
    }
}

fn ai_provider_settings<'a>(settings: &'a AiSettings, provider: &str) -> &'a AiProviderSettings {
    match provider {
        "anthropic" => &settings.anthropic,
        "ollama" => &settings.ollama,
        _ => &settings.openai,
    }
}

fn ai_provider_label(provider: &str) -> &'static str {
    match provider {
        "anthropic" => "Claude",
        "ollama" => "Ollama",
        _ => "ChatGPT",
    }
}

fn ai_default_model(provider: &str, settings: &AiProviderSettings) -> String {
    settings.model.clone().unwrap_or_else(|| match provider {
        "anthropic" => "claude-3-5-haiku-latest".to_string(),
        "ollama" => "gpt-oss:120b".to_string(),
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
        let mut messages = Vec::new();
        if let Some(system) = request.system.clone() {
            messages.push(json!({ "role": "system", "content": system }));
        }
        messages.push(json!({ "role": "user", "content": request.prompt }));
        let data = post_json(
            &format!("{}/chat/completions", OPENAI_BASE_URL),
            vec![("Authorization", format!("Bearer {}", require_ai_key(&provider, &provider_settings.api_key)?))],
            json!({ "model": model, "temperature": temperature, "max_tokens": max_tokens, "messages": messages }),
        )?;
        let text = data.pointer("/choices/0/message/content").and_then(Value::as_str).unwrap_or("").trim().to_string();
        return Ok(AiGenerateResponse {
            text,
            provider,
            model,
            prompt_tokens: data.pointer("/usage/prompt_tokens").and_then(Value::as_u64).unwrap_or(0),
            completion_tokens: data.pointer("/usage/completion_tokens").and_then(Value::as_u64).unwrap_or(0),
        });
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    apply_hardware_acceleration_from_settings();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_auto_launch,
            set_auto_launch,
            get_hardware_acceleration,
            set_hardware_acceleration,
            get_ai_settings,
            set_ai_settings,
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
