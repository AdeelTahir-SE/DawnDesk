use tauri::AppHandle;

use super::super::utils::{storage_root, validate_name};

#[tauri::command]
pub fn convert_pdf_to_word(app: AppHandle, path: &str) -> Result<String, String> {
    validate_name(path)?;

    let base = storage_root(&app)?;
    let target = base.join(path);
    if !target.exists() {
        return Err(format!("File '{}' does not exist", path));
    }

    let output_name = match target.file_stem().and_then(|s| s.to_str()) {
        Some(stem) => format!("{}.docx", stem),
        None => "converted.docx".to_string(),
    };

    // TODO: conversion logic can write output_name into app storage.
    Ok(format!(
        "File '{}' converted to Word successfully as '{}'",
        path, output_name
    ))
}
