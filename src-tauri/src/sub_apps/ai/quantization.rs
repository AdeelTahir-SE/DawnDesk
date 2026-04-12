use std::io::{Read, Write};

use super::{
    check_gguf_model_exists, check_model_exists, ensure_model_layout, gguf_file_path,
    original_file_path, quantized_file_path,
};
use serde::Serialize;
use tauri::{AppHandle, Emitter};

#[derive(Serialize, Clone)]
pub struct PipelineProgress {
    pub model_name: String,
    pub stage: String,
    pub percent: f64,
}

fn copy_with_progress(
    app: &AppHandle,
    model_name: &str,
    stage: &str,
    source: &std::path::Path,
    target: &std::path::Path,
) -> Result<(), String> {
    let mut src = std::fs::File::open(source).map_err(|e| e.to_string())?;
    let mut dst = std::fs::File::create(target).map_err(|e| e.to_string())?;
    let total = src.metadata().map_err(|e| e.to_string())?.len();
    let mut copied = 0u64;
    let mut buf = vec![0u8; 256 * 1024];

    loop {
        let n = src.read(&mut buf).map_err(|e| e.to_string())?;
        if n == 0 {
            break;
        }
        dst.write_all(&buf[..n]).map_err(|e| e.to_string())?;
        copied += n as u64;
        let percent = if total == 0 { 100.0 } else { ((copied as f64 / total as f64) * 100.0).clamp(0.0, 100.0) };
        let _ = app.emit(
            "ai://pipeline-progress",
            PipelineProgress {
                model_name: model_name.to_string(),
                stage: stage.to_string(),
                percent,
            },
        );
    }

    Ok(())
}

/// Creates a GGUF artifact from the downloaded original model.
///
/// In this pure Rust baseline implementation, we prepare a GGUF-staged file by copying
/// the original artifact into `models/gguf/`.
pub fn convert_to_gguf_with_progress(app: &AppHandle, model_name: &str) -> Result<String, String> {
    if model_name.trim().is_empty() {
        return Err("Model name cannot be empty".to_string());
    }
    ensure_model_layout(app)?;

    if !check_model_exists(app, model_name)? {
        return Err(format!("Original model '{}' not found", model_name));
    }

    let source = original_file_path(app, model_name)?;
    let target = gguf_file_path(app, model_name)?;
    copy_with_progress(app, model_name, "convert", &source, &target)?;
    Ok(target.to_string_lossy().to_string())
}

pub fn convert_to_gguf(app: &AppHandle, model_name: &str) -> Result<String, String> {
    convert_to_gguf_with_progress(app, model_name)
}

/// Produces a quantized model file from the GGUF artifact.
///
/// This baseline version copies GGUF to `models/quantized/` using a quantized filename.
pub fn quantize_model_with_progress(app: &AppHandle, model_name: &str) -> Result<String, String> {
    if model_name.trim().is_empty() {
        return Err("Model name cannot be empty".to_string());
    }
    ensure_model_layout(app)?;

    if !check_gguf_model_exists(app, model_name)? {
        let _ = convert_to_gguf_with_progress(app, model_name)?;
    }

    let source = gguf_file_path(app, model_name)?;
    let target = quantized_file_path(app, model_name)?;
    copy_with_progress(app, model_name, "quantize", &source, &target)?;
    Ok(target.to_string_lossy().to_string())
}

pub fn quantize_model(app: &AppHandle, model_name: &str) -> Result<String, String> {
    quantize_model_with_progress(app, model_name)
}

/// Tauri command wrapper for GGUF conversion.
#[tauri::command]
pub fn ai_convert_to_gguf(app: AppHandle, model_name: String) -> Result<String, String> {
    convert_to_gguf_with_progress(&app, &model_name)
}

/// Tauri command wrapper for quantization.
#[tauri::command]
pub fn ai_quantize_model(app: AppHandle, model_name: String) -> Result<String, String> {
    quantize_model_with_progress(&app, &model_name)
}

