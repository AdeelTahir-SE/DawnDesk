use super::utils::storage_root;
use std::fs;
use tauri::AppHandle;

pub mod creation;
pub mod deletion;

#[derive(serde::Serialize)]
pub struct StorageData {
    pub name: String,
    pub data_type: String,
    pub icon: String,
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
