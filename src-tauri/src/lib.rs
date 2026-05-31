// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
pub mod sub_apps;

use serde::{Deserialize, Serialize};
use std::{env, fs, path::PathBuf};

const STARTUP_SCRIPT_NAME: &str = "DawnDesk.cmd";
const NATIVE_SETTINGS_FILE: &str = "native-settings.json";

#[derive(Default, Deserialize, Serialize)]
struct NativeSettings {
    hardware_acceleration: Option<bool>,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn app_config_dir() -> Result<PathBuf, String> {
    let base = env::var_os("APPDATA")
        .map(PathBuf::from)
        .or_else(|| env::var_os("XDG_CONFIG_HOME").map(PathBuf::from))
        .or_else(|| env::var_os("HOME").map(|home| PathBuf::from(home).join(".config")))
        .ok_or_else(|| "Could not resolve app config directory.".to_string())?;
    Ok(base.join("dawndesk"))
}

fn native_settings_path() -> Result<PathBuf, String> {
    Ok(app_config_dir()?.join(NATIVE_SETTINGS_FILE))
}

fn read_native_settings() -> NativeSettings {
    let Ok(path) = native_settings_path() else {
        return NativeSettings::default();
    };
    let Ok(contents) = fs::read_to_string(path) else {
        return NativeSettings::default();
    };
    serde_json::from_str(&contents).unwrap_or_default()
}

fn write_native_settings(settings: &NativeSettings) -> Result<(), String> {
    let path = native_settings_path()?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    let contents = serde_json::to_string_pretty(settings).map_err(|error| error.to_string())?;
    fs::write(path, contents).map_err(|error| error.to_string())
}

fn startup_script_path() -> Result<PathBuf, String> {
    let appdata = env::var_os("APPDATA").ok_or_else(|| "Windows APPDATA directory is not available.".to_string())?;
    Ok(PathBuf::from(appdata)
        .join("Microsoft")
        .join("Windows")
        .join("Start Menu")
        .join("Programs")
        .join("Startup")
        .join(STARTUP_SCRIPT_NAME))
}

#[tauri::command]
fn get_auto_launch() -> Result<bool, String> {
    Ok(startup_script_path()?.exists())
}

#[tauri::command]
fn set_auto_launch(enabled: bool) -> Result<bool, String> {
    let path = startup_script_path()?;
    if enabled {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).map_err(|error| error.to_string())?;
        }
        let exe = env::current_exe().map_err(|error| error.to_string())?;
        let script = format!("@echo off\r\nstart \"\" \"{}\"\r\n", exe.display());
        fs::write(&path, script).map_err(|error| error.to_string())?;
    } else if path.exists() {
        fs::remove_file(&path).map_err(|error| error.to_string())?;
    }
    Ok(enabled)
}

#[tauri::command]
fn get_hardware_acceleration() -> Result<bool, String> {
    Ok(read_native_settings().hardware_acceleration.unwrap_or(true))
}

#[tauri::command]
fn set_hardware_acceleration(enabled: bool) -> Result<bool, String> {
    let mut settings = read_native_settings();
    settings.hardware_acceleration = Some(enabled);
    write_native_settings(&settings)?;
    Ok(enabled)
}

fn apply_hardware_acceleration_from_settings() {
    if read_native_settings().hardware_acceleration.unwrap_or(true) {
        return;
    }

    let mut args = env::var("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS").unwrap_or_default();
    if !args.contains("--disable-gpu") {
        if !args.trim().is_empty() {
            args.push(' ');
        }
        args.push_str("--disable-gpu --disable-software-rasterizer");
        env::set_var("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", args);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    apply_hardware_acceleration_from_settings();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_auto_launch,
            set_auto_launch,
            get_hardware_acceleration,
            set_hardware_acceleration,
            sub_apps::project_manager::create_project,
            sub_apps::project_manager::get_projects,
            sub_apps::project_manager::update_project,
            sub_apps::project_manager::delete_project,
            sub_apps::project_manager::create_sprint,
            sub_apps::project_manager::get_sprints,
            sub_apps::project_manager::update_sprint,
            sub_apps::project_manager::delete_sprint,
            sub_apps::project_manager::create_issue,
            sub_apps::project_manager::get_issues,
            sub_apps::project_manager::update_issue,
            sub_apps::project_manager::clone_issue,
            sub_apps::project_manager::delete_issue,
            sub_apps::project_manager::create_comment,
            sub_apps::project_manager::get_comments,
            sub_apps::project_manager::delete_comment,
            sub_apps::project_manager::create_label,
            sub_apps::project_manager::get_labels,
            sub_apps::project_manager::delete_label,
            sub_apps::project_manager::create_strategy,
            sub_apps::project_manager::get_strategies,
            sub_apps::project_manager::update_strategy,
            sub_apps::project_manager::delete_strategy,
            sub_apps::project_manager::toggle_issue_label,
            sub_apps::project_manager::get_issue_labels,
            sub_apps::project_manager::create_issue_link,
            sub_apps::project_manager::get_issue_links,
            sub_apps::project_manager::delete_issue_link,
            sub_apps::project_manager::create_worklog,
            sub_apps::project_manager::get_worklogs,

            // Advanced Project Manager
            sub_apps::project_manager::create_version,
            sub_apps::project_manager::get_versions,
            sub_apps::project_manager::update_version,
            sub_apps::project_manager::delete_version,
            sub_apps::project_manager::create_issue_history,
            sub_apps::project_manager::get_issue_history,
            sub_apps::project_manager::get_workflow_statuses,
            sub_apps::project_manager::create_workflow_status,
            sub_apps::project_manager::delete_workflow_status,
            sub_apps::project_manager::create_saved_filter,
            sub_apps::project_manager::get_saved_filters,
            sub_apps::project_manager::delete_saved_filter,
            sub_apps::project_manager::jql_search,
            sub_apps::project_manager::upload_attachment,
            sub_apps::project_manager::read_attachment,
            sub_apps::project_manager::get_attachments,
            sub_apps::project_manager::delete_attachment,
            sub_apps::project_manager::create_custom_field,
            sub_apps::project_manager::get_custom_fields,
            sub_apps::project_manager::delete_custom_field,
            sub_apps::project_manager::get_issue_custom_fields,
            sub_apps::project_manager::set_custom_field_value,
            sub_apps::project_manager::create_automation_rule,
            sub_apps::project_manager::get_automation_rules,
            sub_apps::project_manager::delete_automation_rule,

            sub_apps::video_editor::ve_probe_media,
            sub_apps::video_editor::ve_generate_thumbnail,
            sub_apps::video_editor::ve_generate_waveform,
            sub_apps::video_editor::ve_import_media,
            sub_apps::video_editor::ve_export_project,
            sub_apps::video_editor::ve_get_export_progress,
            sub_apps::video_editor::ve_cancel_export,
            sub_apps::video_editor::ve_save_project,
            sub_apps::video_editor::ve_load_project,
            sub_apps::video_editor::ve_check_ffmpeg,

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
            sub_apps::finance_manager::create_chart_of_account,
            sub_apps::finance_manager::get_chart_of_accounts,
            sub_apps::finance_manager::create_journal_entry,
            sub_apps::finance_manager::get_journal_entries,
            sub_apps::finance_manager::create_vendor_bill,
            sub_apps::finance_manager::get_vendor_bills,
            sub_apps::finance_manager::create_fixed_asset,
            sub_apps::finance_manager::get_fixed_assets,
            sub_apps::finance_manager::create_purchase_order,
            sub_apps::finance_manager::get_purchase_orders,
            sub_apps::finance_manager::create_inventory_item,
            sub_apps::finance_manager::get_inventory_items,
            sub_apps::finance_manager::create_tax_code,
            sub_apps::finance_manager::get_tax_codes,
            sub_apps::finance_manager::create_audit_log,
            sub_apps::finance_manager::get_audit_logs,
            sub_apps::finance_manager::get_compliance_roles,
            sub_apps::finance_manager::get_compliance_evidence,
            sub_apps::finance_manager::create_period_close,
            sub_apps::finance_manager::get_period_closes,
            sub_apps::finance_manager::create_exchange_rate,
            sub_apps::finance_manager::get_exchange_rates,
            sub_apps::finance_manager::create_ar_recurring_billing,
            sub_apps::finance_manager::get_ar_recurring_billing,
            sub_apps::finance_manager::create_ar_dunning_campaign,
            sub_apps::finance_manager::get_ar_dunning_campaigns,
            sub_apps::finance_manager::create_ar_revrec_schedule,
            sub_apps::finance_manager::get_ar_revrec_schedules,

            // Notes Taking
            sub_apps::notes_taking::notes_create_note,
            sub_apps::notes_taking::notes_get_notes,
            sub_apps::notes_taking::notes_update_note,
            sub_apps::notes_taking::notes_delete_note,
            sub_apps::notes_taking::notes_search_notes,
            sub_apps::notes_taking::notes_create_notebook,
            sub_apps::notes_taking::notes_get_notebooks,
            sub_apps::notes_taking::notes_update_notebook,
            sub_apps::notes_taking::notes_delete_notebook,
            sub_apps::notes_taking::notes_create_tag,
            sub_apps::notes_taking::notes_get_tags,
            sub_apps::notes_taking::notes_update_tag,
            sub_apps::notes_taking::notes_delete_tag,
            sub_apps::notes_taking::notes_add_tag_to_note,
            sub_apps::notes_taking::notes_remove_tag_from_note,
            sub_apps::notes_taking::notes_get_note_tags,
            sub_apps::notes_taking::notes_create_link,
            sub_apps::notes_taking::notes_get_links,
            sub_apps::notes_taking::notes_delete_link,
            sub_apps::notes_taking::notes_get_backlinks,
            sub_apps::notes_taking::notes_get_all_links,
            sub_apps::notes_taking::notes_create_version,
            sub_apps::notes_taking::notes_get_versions,
            sub_apps::notes_taking::notes_create_template,
            sub_apps::notes_taking::notes_get_templates,
            sub_apps::notes_taking::notes_delete_template,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
