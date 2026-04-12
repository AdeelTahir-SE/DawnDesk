use std::fs::{self, File};
use std::io::{copy, Read, Write};
use std::time::Instant;

use reqwest::blocking::Client;
use serde::Serialize;
use tauri::{AppHandle, Emitter};

use super::{
    ensure_model_layout, extension_from_url, models_root, original_file_path, sanitize_model_name,
};
use super::quantization::{convert_to_gguf, quantize_model};

#[derive(Serialize, Clone)]
pub struct DownloadProgress {
    pub model_name: String,
    pub downloaded_bytes: u64,
    pub total_bytes: Option<u64>,
    pub percent: Option<f64>,
}

#[derive(Serialize, Clone)]
pub struct RecommendedModel {
    pub model_name: String,
    pub file_url: String,
    pub note: String,
}

/// Downloads a model artifact into `models/original/`.
///
/// The caller provides a source URL and logical model name. The model is persisted
/// locally as `models/original/<sanitized_model_name>[.<ext>]`.
#[allow(dead_code)]
pub fn download_model(model_link: &str, model_name: &str) -> Result<String, String> {
    if model_link.trim().is_empty() {
        return Err("Model link cannot be empty".to_string());
    }
    if model_name.trim().is_empty() {
        return Err("Model name cannot be empty".to_string());
    }

    ensure_model_layout()?;

    let sanitized = sanitize_model_name(model_name.trim());
    let ext = extension_from_url(model_link)
        .filter(|v| !v.is_empty())
        .unwrap_or_else(|| "bin".to_string());
    let final_name = format!("{}.{}", sanitized, ext);
    let target_path = models_root().join("original").join(final_name);

    let client = Client::builder().build().map_err(|e| e.to_string())?;
    let mut response = client
        .get(model_link.trim())
        .send()
        .map_err(|e| e.to_string())?;
    if !response.status().is_success() {
        return Err(format!("Download failed: HTTP {}", response.status()));
    }

    let mut file = File::create(&target_path).map_err(|e| e.to_string())?;
    copy(&mut response, &mut file).map_err(|e| e.to_string())?;
    file.flush().map_err(|e| e.to_string())?;

    // Also keep a canonical file without extension for simpler internal lookup.
    let canonical = original_file_path(model_name.trim());
    fs::copy(&target_path, &canonical).map_err(|e| e.to_string())?;

    Ok(canonical.to_string_lossy().to_string())
}

/// Tauri command wrapper around model download.
#[tauri::command]
pub async fn ai_download_model(
    app: AppHandle,
    model_link: String,
    model_name: String,
) -> Result<String, String> {
    let app_handle = app.clone();
    tauri::async_runtime::spawn_blocking(move || {
        if model_link.trim().is_empty() {
            return Err("Model link cannot be empty".to_string());
        }
        if model_name.trim().is_empty() {
            return Err("Model name cannot be empty".to_string());
        }

        ensure_model_layout()?;

        let sanitized = sanitize_model_name(model_name.trim());
        let ext = extension_from_url(&model_link)
            .filter(|v| !v.is_empty())
            .unwrap_or_else(|| "bin".to_string());
        let final_name = format!("{}.{}", sanitized, ext);
        let target_path = models_root().join("original").join(final_name);

        let client = Client::builder().build().map_err(|e| e.to_string())?;
        let mut response = client
            .get(model_link.trim())
            .send()
            .map_err(|e| e.to_string())?;
        if !response.status().is_success() {
            return Err(format!("Download failed: HTTP {}", response.status()));
        }

        let total_bytes = response.content_length();
        let mut downloaded_bytes: u64 = 0;
        let mut last_emitted_bytes: u64 = 0;
        let mut last_emit_at = Instant::now();
        let mut file = File::create(&target_path).map_err(|e| e.to_string())?;

        let mut buffer = vec![0u8; 64 * 1024];
        loop {
            let bytes_read = response.read(&mut buffer).map_err(|e| e.to_string())?;
            if bytes_read == 0 {
                break;
            }

            file.write_all(&buffer[..bytes_read]).map_err(|e| e.to_string())?;
            downloaded_bytes += bytes_read as u64;

            // Throttle UI updates to avoid flooding the event bus during large downloads.
            let should_emit = downloaded_bytes.saturating_sub(last_emitted_bytes) >= 1_048_576
                || last_emit_at.elapsed().as_millis() >= 300;
            if should_emit {
                let percent = total_bytes.map(|total| {
                    if total == 0 {
                        0.0
                    } else {
                        ((downloaded_bytes as f64 / total as f64) * 100.0).clamp(0.0, 100.0)
                    }
                });

                let _ = app_handle.emit(
                    "ai://download-progress",
                    DownloadProgress {
                        model_name: model_name.clone(),
                        downloaded_bytes,
                        total_bytes,
                        percent,
                    },
                );
                last_emitted_bytes = downloaded_bytes;
                last_emit_at = Instant::now();
            }
        }
        file.flush().map_err(|e| e.to_string())?;

        let canonical = original_file_path(model_name.trim());
        fs::copy(&target_path, &canonical).map_err(|e| e.to_string())?;

        // Auto-run the rest of the pipeline so model is ready to use after download.
        let _gguf_path = convert_to_gguf(&model_name)?;
        let _quantized_path = quantize_model(&model_name)?;

        let _ = app_handle.emit(
            "ai://download-complete",
            DownloadProgress {
                model_name: model_name.clone(),
                downloaded_bytes,
                total_bytes,
                percent: Some(100.0),
            },
        );

        Ok(canonical.to_string_lossy().to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

/// Lists available model identifiers from `models/original/`.
#[tauri::command]
pub fn ai_list_models() -> Result<Vec<String>, String> {
    ensure_model_layout()?;
    let mut items = Vec::new();
    for entry in fs::read_dir(models_root().join("original")).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        if entry.path().is_file() {
            let name = entry.file_name().to_string_lossy().to_string();
            let canonical = if name.contains('.') {
                name.split('.').next().unwrap_or(&name).to_string()
            } else {
                name
            };
            items.push(canonical);
        }
    }
    items.sort();
    items.dedup();
    Ok(items)
}

/// Provides a curated list of model artifacts the app can download and run.
#[tauri::command]
pub fn ai_recommended_models() -> Vec<RecommendedModel> {
    vec![
        RecommendedModel {
            model_name: "tinyllama-1.1b-chat-q4".to_string(),
            file_url: "https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf".to_string(),
            note: "Fast and lightweight".to_string(),
        },
        RecommendedModel {
            model_name: "phi-2-q4".to_string(),
            file_url: "https://huggingface.co/TheBloke/phi-2-GGUF/resolve/main/phi-2.Q4_K_M.gguf".to_string(),
            note: "Good quality for size".to_string(),
        },
        RecommendedModel {
            model_name: "mistral-7b-instruct-q4".to_string(),
            file_url: "https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf".to_string(),
            note: "Stronger reasoning, larger model".to_string(),
        },
    ]
}

