#[tauri::command]
pub fn delete_file(name: &str) -> String {
    // Placeholder logic for file deletion
    format!("File '{}' deleted successfully!", name)
}

#[tauri::command]
pub fn delete_folder(name: &str) -> String { 
    // Placeholder logic for folder deletion
    format!("Folder '{}' deleted successfully!", name)
}