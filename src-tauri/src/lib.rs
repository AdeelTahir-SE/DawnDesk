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
            sub_apps::project_manager::create_project,
            sub_apps::project_manager::get_projects,
            sub_apps::project_manager::update_project,
            sub_apps::project_manager::delete_project,
            sub_apps::project_manager::create_task,
            sub_apps::project_manager::get_tasks,
            sub_apps::project_manager::update_task,
            sub_apps::project_manager::delete_task,

            sub_apps::photo_editor::photo_export_file,

            sub_apps::finance_manager::get_transactions,
            sub_apps::finance_manager::create_transaction,
            sub_apps::finance_manager::delete_transaction,
            sub_apps::finance_manager::create_account,
            sub_apps::finance_manager::get_accounts,
            sub_apps::finance_manager::create_budget,
            sub_apps::finance_manager::get_budgets,
            sub_apps::finance_manager::create_goal,
            sub_apps::finance_manager::get_goals,
            sub_apps::finance_manager::create_subscription,
            sub_apps::finance_manager::get_subscriptions,
            sub_apps::finance_manager::create_debt,
            sub_apps::finance_manager::get_debts,
            sub_apps::finance_manager::create_invoice,
            sub_apps::finance_manager::get_invoices,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
