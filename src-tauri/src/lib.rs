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
            sub_apps::ai::download::ai_download_model,
            sub_apps::ai::download::ai_resume_model_download,
            sub_apps::ai::download::ai_stop_model_download,
            sub_apps::ai::download::ai_delete_model,
            sub_apps::ai::download::ai_list_models,
            sub_apps::ai::download::ai_recommended_models,
            sub_apps::ai::quantization::ai_convert_to_gguf,
            sub_apps::ai::quantization::ai_quantize_model,
            sub_apps::ai::run::ai_load_model,
            sub_apps::ai::run::ai_chat_with_model,
            sub_apps::ai::run::ai_create_chat,
            sub_apps::ai::run::ai_list_chats,
            sub_apps::ai::run::ai_get_chat_messages,
            sub_apps::ai::run::ai_send_chat_message,
            sub_apps::pdf_tools::pdf_to_word::convert_pdf_to_word,

        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
