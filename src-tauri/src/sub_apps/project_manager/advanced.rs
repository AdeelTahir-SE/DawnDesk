use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use super::db_connection;

// =============================================================================
// VERSIONS
// =============================================================================

#[derive(Serialize, Deserialize)]
pub struct Version {
    pub id: i64,
    pub project_id: i64,
    pub name: String,
    pub release_date: Option<String>,
    pub released: bool,
}

#[tauri::command]
pub fn create_version(app: AppHandle, project_id: i64, name: String, release_date: Option<String>) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute(
        "INSERT INTO versions (project_id, name, release_date, released) VALUES (?1, ?2, ?3, 0)",
        params![project_id, name, release_date],
    ).map_err(|e| e.to_string())?;
    Ok("Version created".to_string())
}

#[tauri::command]
pub fn get_versions(app: AppHandle, project_id: i64) -> Result<Vec<Version>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare("SELECT id, project_id, name, release_date, released FROM versions WHERE project_id = ?1").map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![project_id], |row| {
        Ok(Version {
            id: row.get(0)?,
            project_id: row.get(1)?,
            name: row.get(2)?,
            release_date: row.get(3)?,
            released: row.get(4)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut res = Vec::new();
    for row in rows { res.push(row.map_err(|e| e.to_string())?); }
    Ok(res)
}

#[tauri::command]
pub fn update_version(app: AppHandle, id: i64, name: String, release_date: Option<String>, released: bool) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute(
        "UPDATE versions SET name = ?1, release_date = ?2, released = ?3 WHERE id = ?4",
        params![name, release_date, released, id],
    ).map_err(|e| e.to_string())?;
    Ok("Version updated".to_string())
}

#[tauri::command]
pub fn delete_version(app: AppHandle, id: i64) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute("DELETE FROM versions WHERE id = ?1", params![id]).map_err(|e| e.to_string())?;
    Ok("Version deleted".to_string())
}

// =============================================================================
// ISSUE HISTORY
// =============================================================================

#[derive(Serialize, Deserialize)]
pub struct IssueHistory {
    pub id: i64,
    pub issue_id: i64,
    pub field_name: String,
    pub old_value: Option<String>,
    pub new_value: Option<String>,
    pub created_at: String,
}

#[tauri::command]
pub fn create_issue_history(app: AppHandle, issue_id: i64, field_name: String, old_value: Option<String>, new_value: Option<String>, created_at: String) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute(
        "INSERT INTO issue_history (issue_id, field_name, old_value, new_value, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![issue_id, field_name, old_value, new_value, created_at],
    ).map_err(|e| e.to_string())?;
    Ok("History added".to_string())
}

#[tauri::command]
pub fn get_issue_history(app: AppHandle, issue_id: i64) -> Result<Vec<IssueHistory>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare("SELECT id, issue_id, field_name, old_value, new_value, created_at FROM issue_history WHERE issue_id = ?1 ORDER BY id DESC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![issue_id], |row| {
        Ok(IssueHistory {
            id: row.get(0)?,
            issue_id: row.get(1)?,
            field_name: row.get(2)?,
            old_value: row.get(3)?,
            new_value: row.get(4)?,
            created_at: row.get(5)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut res = Vec::new();
    for row in rows { res.push(row.map_err(|e| e.to_string())?); }
    Ok(res)
}

// =============================================================================
// WORKFLOW STATUSES
// =============================================================================

#[derive(Serialize, Deserialize)]
pub struct WorkflowStatus {
    pub id: i64,
    pub project_id: i64,
    pub name: String,
    pub category: String,
    pub position: i64,
    pub wip_limit: Option<i64>,
}

#[tauri::command]
pub fn get_workflow_statuses(app: AppHandle, project_id: i64) -> Result<Vec<WorkflowStatus>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare("SELECT id, project_id, name, category, position, wip_limit FROM workflow_statuses WHERE project_id = ?1 ORDER BY position ASC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![project_id], |row| {
        Ok(WorkflowStatus {
            id: row.get(0)?,
            project_id: row.get(1)?,
            name: row.get(2)?,
            category: row.get(3)?,
            position: row.get(4)?,
            wip_limit: row.get(5)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut res = Vec::new();
    for row in rows { res.push(row.map_err(|e| e.to_string())?); }
    Ok(res)
}

#[tauri::command]
pub fn create_workflow_status(app: AppHandle, project_id: i64, name: String, category: String, position: i64, wip_limit: Option<i64>) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute(
        "INSERT INTO workflow_statuses (project_id, name, category, position, wip_limit) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![project_id, name, category, position, wip_limit],
    ).map_err(|e| e.to_string())?;
    Ok("Workflow status created".to_string())
}

#[tauri::command]
pub fn delete_workflow_status(app: AppHandle, id: i64) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute("DELETE FROM workflow_statuses WHERE id = ?1", params![id]).map_err(|e| e.to_string())?;
    Ok("Workflow status deleted".to_string())
}

// =============================================================================
// SAVED FILTERS
// =============================================================================

#[derive(Serialize, Deserialize)]
pub struct SavedFilter {
    pub id: i64,
    pub project_id: i64,
    pub name: String,
    pub jql_query: String,
}

#[tauri::command]
pub fn create_saved_filter(app: AppHandle, project_id: i64, name: String, jql_query: String) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute(
        "INSERT INTO saved_filters (project_id, name, jql_query) VALUES (?1, ?2, ?3)",
        params![project_id, name, jql_query],
    ).map_err(|e| e.to_string())?;
    Ok("Saved filter created".to_string())
}

#[tauri::command]
pub fn get_saved_filters(app: AppHandle, project_id: i64) -> Result<Vec<SavedFilter>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare("SELECT id, project_id, name, jql_query FROM saved_filters WHERE project_id = ?1").map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![project_id], |row| {
        Ok(SavedFilter {
            id: row.get(0)?,
            project_id: row.get(1)?,
            name: row.get(2)?,
            jql_query: row.get(3)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut res = Vec::new();
    for row in rows { res.push(row.map_err(|e| e.to_string())?); }
    Ok(res)
}

#[tauri::command]
pub fn delete_saved_filter(app: AppHandle, id: i64) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute("DELETE FROM saved_filters WHERE id = ?1", params![id]).map_err(|e| e.to_string())?;
    Ok("Saved filter deleted".to_string())
}

// =============================================================================
// ATTACHMENTS
// =============================================================================

#[derive(Serialize, Deserialize)]
pub struct Attachment {
    pub id: i64,
    pub issue_id: i64,
    pub file_name: String,
    pub local_path: String,
    pub created_at: String,
}

use std::fs;
use crate::sub_apps::utils::storage_root;

#[tauri::command]
pub fn upload_attachment(app: AppHandle, issue_id: i64, file_name: String, base64_data: String, created_at: String) -> Result<String, String> {
    let mut root = storage_root(&app)?;
    root.push("attachments");
    
    if !root.exists() {
        fs::create_dir_all(&root).map_err(|e| e.to_string())?;
    }
    
    // Create a unique filename
    let unique_name = format!("{}_{}", issue_id, file_name);
    root.push(&unique_name);
    
    fs::write(&root, base64_data).map_err(|e| e.to_string())?;
    
    let local_path = root.to_string_lossy().to_string();

    let conn = db_connection(&app)?;
    conn.execute(
        "INSERT INTO attachments (issue_id, file_name, local_path, created_at) VALUES (?1, ?2, ?3, ?4)",
        params![issue_id, file_name, local_path, created_at],
    ).map_err(|e| e.to_string())?;
    Ok("Attachment uploaded".to_string())
}

#[tauri::command]
pub fn read_attachment(_app: AppHandle, local_path: String) -> Result<String, String> {
    fs::read_to_string(&local_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_attachments(app: AppHandle, issue_id: i64) -> Result<Vec<Attachment>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare("SELECT id, issue_id, file_name, local_path, created_at FROM attachments WHERE issue_id = ?1").map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![issue_id], |row| {
        Ok(Attachment {
            id: row.get(0)?,
            issue_id: row.get(1)?,
            file_name: row.get(2)?,
            local_path: row.get(3)?,
            created_at: row.get(4)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut res = Vec::new();
    for row in rows { res.push(row.map_err(|e| e.to_string())?); }
    Ok(res)
}

#[tauri::command]
pub fn delete_attachment(app: AppHandle, id: i64) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute("DELETE FROM attachments WHERE id = ?1", params![id]).map_err(|e| e.to_string())?;
    Ok("Attachment deleted".to_string())
}

// =============================================================================
// CUSTOM FIELDS
// =============================================================================

#[derive(Serialize, Deserialize)]
pub struct CustomField {
    pub id: i64,
    pub project_id: i64,
    pub name: String,
    pub field_type: String,
}

#[tauri::command]
pub fn create_custom_field(app: AppHandle, project_id: i64, name: String, field_type: String) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute(
        "INSERT INTO custom_fields (project_id, name, field_type) VALUES (?1, ?2, ?3)",
        params![project_id, name, field_type],
    ).map_err(|e| e.to_string())?;
    Ok("Custom field created".to_string())
}

#[tauri::command]
pub fn get_custom_fields(app: AppHandle, project_id: i64) -> Result<Vec<CustomField>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare("SELECT id, project_id, name, field_type FROM custom_fields WHERE project_id = ?1").map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![project_id], |row| {
        Ok(CustomField {
            id: row.get(0)?,
            project_id: row.get(1)?,
            name: row.get(2)?,
            field_type: row.get(3)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut res = Vec::new();
    for row in rows { res.push(row.map_err(|e| e.to_string())?); }
    Ok(res)
}

#[derive(Serialize, Deserialize)]
pub struct CustomFieldValue {
    pub issue_id: i64,
    pub field_id: i64,
    pub value: String,
}

#[tauri::command]
pub fn get_issue_custom_fields(app: AppHandle, issue_id: i64) -> Result<Vec<CustomFieldValue>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare("SELECT issue_id, field_id, value FROM custom_field_values WHERE issue_id = ?1").map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![issue_id], |row| {
        Ok(CustomFieldValue {
            issue_id: row.get(0)?,
            field_id: row.get(1)?,
            value: row.get(2)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut res = Vec::new();
    for row in rows { res.push(row.map_err(|e| e.to_string())?); }
    Ok(res)
}

#[tauri::command]
pub fn set_custom_field_value(app: AppHandle, issue_id: i64, field_id: i64, value: String) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute(
        "INSERT INTO custom_field_values (issue_id, field_id, value) VALUES (?1, ?2, ?3)
         ON CONFLICT(issue_id, field_id) DO UPDATE SET value = excluded.value",
        params![issue_id, field_id, value],
    ).map_err(|e| e.to_string())?;
    Ok("Custom field value updated".to_string())
}

// =============================================================================
// AUTOMATION RULES
// =============================================================================

#[derive(Serialize, Deserialize)]
pub struct AutomationRule {
    pub id: i64,
    pub project_id: i64,
    pub name: String,
    pub trigger_type: String,
    pub conditions_json: String,
    pub actions_json: String,
    pub is_active: bool,
}

#[tauri::command]
pub fn create_automation_rule(app: AppHandle, project_id: i64, name: String, trigger_type: String, conditions_json: String, actions_json: String) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute(
        "INSERT INTO automation_rules (project_id, name, trigger_type, conditions_json, actions_json, is_active) VALUES (?1, ?2, ?3, ?4, ?5, 1)",
        params![project_id, name, trigger_type, conditions_json, actions_json],
    ).map_err(|e| e.to_string())?;
    Ok("Rule created".to_string())
}

#[tauri::command]
pub fn get_automation_rules(app: AppHandle, project_id: i64) -> Result<Vec<AutomationRule>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare("SELECT id, project_id, name, trigger_type, conditions_json, actions_json, is_active FROM automation_rules WHERE project_id = ?1").map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![project_id], |row| {
        Ok(AutomationRule {
            id: row.get(0)?,
            project_id: row.get(1)?,
            name: row.get(2)?,
            trigger_type: row.get(3)?,
            conditions_json: row.get(4)?,
            actions_json: row.get(5)?,
            is_active: row.get(6)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut res = Vec::new();
    for row in rows { res.push(row.map_err(|e| e.to_string())?); }
    Ok(res)
}

#[tauri::command]
pub fn delete_automation_rule(app: AppHandle, id: i64) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute("DELETE FROM automation_rules WHERE id = ?1", params![id]).map_err(|e| e.to_string())?;
    Ok("Rule deleted".to_string())
}
