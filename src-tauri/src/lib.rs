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
        .invoke_handler(tauri::generate_handler![
            greet,
            sub_apps::storage::get_storage_data,
            sub_apps::storage::creation::create_file,
            sub_apps::storage::creation::create_folder,
            sub_apps::storage::deletion::delete_file,
            sub_apps::storage::deletion::delete_folder,
            sub_apps::todo::get_todo,
            sub_apps::todo::create_todo,
            sub_apps::todo::update_todo,
            sub_apps::todo::delete_todo,
            sub_apps::todo::get_pending_todos,
            sub_apps::ai::generate_response,

            sub_apps::pdf_tools::pdf_to_word::convert_pdf_to_word,
            sub_apps::photo_editor::photo_export_file,

        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
