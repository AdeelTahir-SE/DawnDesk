use std::fs::{self};
use super::super::utils::{storage_root, validate_name};
use tauri::AppHandle;


#[tauri::command]
pub fn delete_file(app:AppHandle, path: &str) -> Result<String, String> {
    validate_name(path)?;
    let base = storage_root(&app)?;
    let target = base.join(path);
    let file_exists = fs::exists(&target).map_err(|e| e.to_string())?;
    
    
    match file_exists {
        true => {
            fs::remove_file(&target).map_err(|e| e.to_string())?;
            Ok(format!("File '{}' deleted successfully!", path))
        }
        false => Err(format!("File '{}' does not exist!", path)),
    }
}

#[tauri::command]
pub fn delete_folder(app:AppHandle, path: &str) -> Result<String, String> {
    validate_name(path)?;
    let base = storage_root(&app)?;
    let target = base.join(path);
    let folder_exists = fs::exists(&target).map_err(|e| e.to_string())?;

    match folder_exists {
        true => {
            fs::remove_dir(&target).map_err(|e| e.to_string())?;
            Ok(format!("Folder '{}' deleted successfully!", path))
        }
        false => Err(format!("Folder '{}' does not exist!", path)),
    }
}