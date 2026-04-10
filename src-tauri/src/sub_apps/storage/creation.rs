use std::fs::{self, File};

use tauri::AppHandle;

use super::storage_root;

#[derive(serde::Deserialize)]
pub struct CreateFilePayload {
    pub name: String,
    #[allow(dead_code)]
    pub r#type: Option<String>,
}

fn validate_name(name: &str) -> Result<(), String> {
    if name.trim().is_empty() {
        return Err("Name cannot be empty".to_string());
    }

    if name.contains('/') || name.contains('\\') {
        return Err("Name cannot contain path separators".to_string());
    }

    Ok(())
}



#[tauri::command]
pub fn create_file(app: AppHandle, file: CreateFilePayload) -> Result<String, String> {
    validate_name(&file.name)?;
    let base = storage_root(&app)?;
    let target = base.join(&file.name);
    let file_exists = fs::exists(&target).map_err(|e| e.to_string())?;
    
    
    match file_exists {
        true => Ok(format!("File '{}' already exists!", file.name)),
        false => {
            File::create(&target).map_err(|e| e.to_string())?;
            Ok(format!("File '{}' created successfully!", file.name))
        }
    }
 
}


#[tauri::command]
pub fn create_folder(app: AppHandle, path: &str) -> Result<String, String> {
    validate_name(path)?;
    let base = storage_root(&app)?;
    let target = base.join(path);
    let folder_exists = fs::exists(&target).map_err(|e| e.to_string())?;
    
    match folder_exists {
        true => Ok(format!("Folder '{}' already exists!", path)),
        false => {
            fs::create_dir(&target).map_err(|e| e.to_string())?;
            Ok(format!("Folder '{}' created successfully!", path))
        }
    }
}

