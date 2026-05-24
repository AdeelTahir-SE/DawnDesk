use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

pub(crate) fn storage_root(app: &AppHandle) -> Result<PathBuf, String> {
    let app_local_dir = app.path().app_local_data_dir().map_err(|e| e.to_string())?;

    let storage_dir = app_local_dir.join("storage");
    fs::create_dir_all(&storage_dir).map_err(|e| e.to_string())?;

    Ok(storage_dir)
}
