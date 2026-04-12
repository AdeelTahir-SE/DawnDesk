use std::fs;

use super::{
    check_gguf_model_exists, check_model_exists, ensure_model_layout, gguf_file_path,
    original_file_path, quantized_file_path,
};

/// Creates a GGUF artifact from the downloaded original model.
///
/// In this pure Rust baseline implementation, we prepare a GGUF-staged file by copying
/// the original artifact into `models/gguf/`.
pub fn convert_to_gguf(model_name: &str) -> Result<String, String> {
    if model_name.trim().is_empty() {
        return Err("Model name cannot be empty".to_string());
    }
    ensure_model_layout()?;

    if !check_model_exists(model_name) {
        return Err(format!("Original model '{}' not found", model_name));
    }

    let source = original_file_path(model_name);
    let target = gguf_file_path(model_name);
    fs::copy(source, &target).map_err(|e| e.to_string())?;
    Ok(target.to_string_lossy().to_string())
}

/// Produces a quantized model file from the GGUF artifact.
///
/// This baseline version copies GGUF to `models/quantized/` using a quantized filename.
pub fn quantize_model(model_name: &str) -> Result<String, String> {
    if model_name.trim().is_empty() {
        return Err("Model name cannot be empty".to_string());
    }
    ensure_model_layout()?;

    if !check_gguf_model_exists(model_name) {
        let _ = convert_to_gguf(model_name)?;
    }

    let source = gguf_file_path(model_name);
    let target = quantized_file_path(model_name);
    fs::copy(source, &target).map_err(|e| e.to_string())?;
    Ok(target.to_string_lossy().to_string())
}

/// Tauri command wrapper for GGUF conversion.
#[tauri::command]
pub fn ai_convert_to_gguf(model_name: String) -> Result<String, String> {
    convert_to_gguf(&model_name)
}

/// Tauri command wrapper for quantization.
#[tauri::command]
pub fn ai_quantize_model(model_name: String) -> Result<String, String> {
    quantize_model(&model_name)
}

