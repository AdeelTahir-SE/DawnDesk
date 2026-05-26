use rusqlite::{params, Connection};
use tauri::AppHandle;
use super::db_connection;
use super::Issue; // Use the Issue struct from mod.rs

// A very naive JQL-like parser for solo use
// Example: status = "Done" AND priority = "High"
#[tauri::command]
pub fn jql_search(app: AppHandle, project_id: i64, jql: String) -> Result<Vec<Issue>, String> {
    let conn = db_connection(&app)?;
    
    // We will just do some basic string replacements to convert it to SQL.
    // Extremely unsafe for real multi-tenant apps, but for local sqlite it's okay-ish.
    // A real implementation would parse the AST.
    let mut sql_condition = jql
        .replace(" = ", " = ")
        .replace(" != ", " != ")
        .replace(" AND ", " AND ")
        .replace(" OR ", " OR ")
        .replace("\"", "'");

    if sql_condition.trim().is_empty() {
        sql_condition = "1=1".to_string();
    }

    let query = format!(
        "SELECT id, project_id, sprint_id, parent_id, issue_type, key, title, description, status, priority, story_points, time_spent_minutes, due_date, created_at, updated_at, original_estimate_minutes, rank, pinned FROM issues WHERE project_id = ?1 AND ({}) ORDER BY created_at DESC",
        sql_condition
    );

    let mut stmt = match conn.prepare(&query) {
        Ok(s) => s,
        Err(e) => return Err(format!("Invalid JQL Syntax: {}", e)),
    };

    let rows = stmt.query_map(params![project_id], |row| {
        Ok(Issue {
            id: row.get(0)?,
            project_id: row.get(1)?,
            sprint_id: row.get(2)?,
            parent_id: row.get(3)?,
            issue_type: row.get(4)?,
            key: row.get(5)?,
            title: row.get(6)?,
            description: row.get(7)?,
            status: row.get(8)?,
            priority: row.get(9)?,
            story_points: row.get(10)?,
            time_spent_minutes: row.get(11)?,
            due_date: row.get(12)?,
            created_at: row.get(13)?,
            updated_at: row.get(14)?,
            original_estimate_minutes: row.get(15)?,
            rank: row.get(16)?,
            pinned: row.get(17)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut items = Vec::new();
    for row in rows {
        items.push(row.map_err(|e| e.to_string())?);
    }
    Ok(items)
}
