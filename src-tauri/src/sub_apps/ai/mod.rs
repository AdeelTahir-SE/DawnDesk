use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

pub mod download;
pub mod quantization;
pub mod run;

/// Returns the shared models directory for all AI pipeline stages.
///
/// Structure:
/// - models/original
/// - models/gguf
/// - models/quantized
pub(crate) fn models_root(app: &AppHandle) -> Result<PathBuf, String> {
    let app_local_dir = app.path().app_local_data_dir().map_err(|e| e.to_string())?;
    let models_dir = app_local_dir.join("models");
    fs::create_dir_all(&models_dir).map_err(|e| e.to_string())?;
    Ok(models_dir)
}

/// Sanitizes model names to keep filesystem paths safe and predictable.
pub(crate) fn sanitize_model_name(model_name: &str) -> String {
    model_name
        .chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() || c == '-' || c == '_' || c == '.' {
                c
            } else {
                '_'
            }
        })
        .collect()
}

/// Path helper for raw source model files.
pub(crate) fn original_file_path(app: &AppHandle, model_name: &str) -> Result<PathBuf, String> {
    Ok(models_root(app)?
        .join("original")
        .join(sanitize_model_name(model_name)))
}

/// Path helper for converted GGUF files.
pub(crate) fn gguf_file_path(app: &AppHandle, model_name: &str) -> Result<PathBuf, String> {
    Ok(models_root(app)?
        .join("gguf")
        .join(format!("{}.gguf", sanitize_model_name(model_name))))
}

/// Path helper for quantized GGUF files.
pub(crate) fn quantized_file_path(app: &AppHandle, model_name: &str) -> Result<PathBuf, String> {
    Ok(models_root(app)?
        .join("quantized")
        .join(format!("{}.Q4_K_M.gguf", sanitize_model_name(model_name))))
}

/// Ensures all required model stage directories exist.
pub(crate) fn ensure_model_layout(app: &AppHandle) -> Result<(), String> {
    let root = models_root(app)?;
    fs::create_dir_all(root.join("original")).map_err(|e| e.to_string())?;
    fs::create_dir_all(root.join("gguf")).map_err(|e| e.to_string())?;
    fs::create_dir_all(root.join("quantized")).map_err(|e| e.to_string())?;
    Ok(())
}

/// Checks whether an original model file exists.
pub(crate) fn check_model_exists(app: &AppHandle, model_name: &str) -> Result<bool, String> {
    Ok(original_file_path(app, model_name)?.exists())
}

/// Checks whether a GGUF file exists.
pub(crate) fn check_gguf_model_exists(app: &AppHandle, model_name: &str) -> Result<bool, String> {
    Ok(gguf_file_path(app, model_name)?.exists())
}

/// Checks whether a quantized model file exists.
pub(crate) fn check_quantized_model_exists(app: &AppHandle, model_name: &str) -> Result<bool, String> {
    Ok(quantized_file_path(app, model_name)?.exists())
}

/// Attempts to infer extension from URL path.
pub(crate) fn extension_from_url(url: &str) -> Option<String> {
    let path_no_query = url.split('?').next().unwrap_or(url);
    Path::new(path_no_query)
        .extension()
        .and_then(|v| v.to_str())
        .map(|s| s.to_lowercase())
}
