use std::fs;
use std::path::PathBuf;

use tauri::{AppHandle, Manager};

pub mod creation;
pub mod deletion;

#[derive(serde::Serialize)]
pub struct StorageData {
    pub name: String,
    pub data_type: String,
    pub icon: String,
}

pub(crate) fn storage_root(app: &AppHandle) -> Result<PathBuf, String> {
    let app_local_dir = app.path().app_local_data_dir().map_err(|e| e.to_string())?;

    let storage_dir = app_local_dir.join("storage");
    fs::create_dir_all(&storage_dir).map_err(|e| e.to_string())?;

    Ok(storage_dir)
}

#[tauri::command]
pub fn get_storage_data(app: AppHandle) -> Result<Vec<StorageData>, String> {
    let storage_dir = storage_root(&app)?;
    let entries = fs::read_dir(storage_dir).map_err(|e| e.to_string())?;
    let mut storage_data = Vec::new();

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        let metadata = entry.metadata().map_err(|e| e.to_string())?;

        if metadata.is_file() {
            storage_data.push(StorageData {
                name: path
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .into_owned(),
                data_type: "File".into(),
                icon: "📄".into(),
            });
        }
    }

    Ok(storage_data)
}
