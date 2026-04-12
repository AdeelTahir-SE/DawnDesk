use std::fs;
use std::path::{Path, PathBuf};

pub mod download;
pub mod quantization;
pub mod run;

/// Returns the shared models directory for all AI pipeline stages.
///
/// Structure:
/// - models/original
/// - models/gguf
/// - models/quantized
pub(crate) fn models_root() -> PathBuf {
    PathBuf::from("models")
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
pub(crate) fn original_file_path(model_name: &str) -> PathBuf {
    models_root()
        .join("original")
        .join(sanitize_model_name(model_name))
}

/// Path helper for converted GGUF files.
pub(crate) fn gguf_file_path(model_name: &str) -> PathBuf {
    models_root()
        .join("gguf")
        .join(format!("{}.gguf", sanitize_model_name(model_name)))
}

/// Path helper for quantized GGUF files.
pub(crate) fn quantized_file_path(model_name: &str) -> PathBuf {
    models_root()
        .join("quantized")
        .join(format!("{}.Q4_K_M.gguf", sanitize_model_name(model_name)))
}

/// Ensures all required model stage directories exist.
pub(crate) fn ensure_model_layout() -> Result<(), String> {
    let root = models_root();
    fs::create_dir_all(root.join("original")).map_err(|e| e.to_string())?;
    fs::create_dir_all(root.join("gguf")).map_err(|e| e.to_string())?;
    fs::create_dir_all(root.join("quantized")).map_err(|e| e.to_string())?;
    Ok(())
}

/// Checks whether an original model file exists.
pub(crate) fn check_model_exists(model_name: &str) -> bool {
    original_file_path(model_name).exists()
}

/// Checks whether a GGUF file exists.
pub(crate) fn check_gguf_model_exists(model_name: &str) -> bool {
    gguf_file_path(model_name).exists()
}

/// Checks whether a quantized model file exists.
pub(crate) fn check_quantized_model_exists(model_name: &str) -> bool {
    quantized_file_path(model_name).exists()
}

/// Attempts to infer extension from URL path.
pub(crate) fn extension_from_url(url: &str) -> Option<String> {
    let path_no_query = url.split('?').next().unwrap_or(url);
    Path::new(path_no_query)
        .extension()
        .and_then(|v| v.to_str())
        .map(|s| s.to_lowercase())
}
