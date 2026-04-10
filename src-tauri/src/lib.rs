// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod sub_apps;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, sub_apps::storage::get_storage_data,sub_apps::storage::creation::create_file, sub_apps::storage::creation::create_folder, sub_apps::storage::deletion::delete_file, sub_apps::storage::deletion::delete_folder])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
