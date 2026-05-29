use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use tauri::AppHandle;

pub mod advanced;
pub use advanced::*;

pub mod jql;
pub use jql::*;

use crate::sub_apps::utils::storage_root;

fn db_connection(app: &AppHandle) -> Result<Connection, String> {
    let mut db_path = storage_root(app)?;
    db_path.push("projects_v3.db");

    if let Some(parent) = db_path.parent() {
        let p: &Path = parent;
        if !p.exists() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
    }

    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

    // Enable foreign keys
    conn.execute("PRAGMA foreign_keys = ON;", []).map_err(|e| e.to_string())?;

    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            key TEXT NOT NULL,
            description TEXT,
            color_tag TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sprints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            status TEXT NOT NULL,
            start_date TEXT,
            end_date TEXT,
            FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS issues (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            sprint_id INTEGER,
            parent_id INTEGER,
            issue_type TEXT NOT NULL,
            key TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL,
            priority TEXT NOT NULL,
            story_points INTEGER,
            time_spent_minutes INTEGER DEFAULT 0,
            due_date TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY(sprint_id) REFERENCES sprints(id) ON DELETE SET NULL,
            FOREIGN KEY(parent_id) REFERENCES issues(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS labels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            color TEXT NOT NULL,
            FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS issue_labels (
            issue_id INTEGER NOT NULL,
            label_id INTEGER NOT NULL,
            PRIMARY KEY(issue_id, label_id),
            FOREIGN KEY(issue_id) REFERENCES issues(id) ON DELETE CASCADE,
            FOREIGN KEY(label_id) REFERENCES labels(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            issue_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY(issue_id) REFERENCES issues(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS issue_links (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            link_type TEXT NOT NULL,
            source_issue_id INTEGER NOT NULL,
            target_issue_id INTEGER NOT NULL,
            FOREIGN KEY(source_issue_id) REFERENCES issues(id) ON DELETE CASCADE,
            FOREIGN KEY(target_issue_id) REFERENCES issues(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS worklogs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            issue_id INTEGER NOT NULL,
            minutes INTEGER NOT NULL,
            description TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY(issue_id) REFERENCES issues(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS versions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            release_date TEXT,
            released BOOLEAN NOT NULL DEFAULT 0,
            FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS issue_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            issue_id INTEGER NOT NULL,
            field_name TEXT NOT NULL,
            old_value TEXT,
            new_value TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY(issue_id) REFERENCES issues(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS attachments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            issue_id INTEGER NOT NULL,
            file_name TEXT NOT NULL,
            local_path TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY(issue_id) REFERENCES issues(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS saved_filters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            jql_query TEXT NOT NULL,
            FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS custom_fields (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            field_type TEXT NOT NULL,
            FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS custom_field_values (
            issue_id INTEGER NOT NULL,
            field_id INTEGER NOT NULL,
            value TEXT NOT NULL,
            PRIMARY KEY(issue_id, field_id),
            FOREIGN KEY(issue_id) REFERENCES issues(id) ON DELETE CASCADE,
            FOREIGN KEY(field_id) REFERENCES custom_fields(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS automation_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            trigger_type TEXT NOT NULL,
            conditions_json TEXT NOT NULL,
            actions_json TEXT NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT 1,
            FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS workflow_statuses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            position INTEGER NOT NULL DEFAULT 0,
            wip_limit INTEGER,
            FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS strategies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            markdown TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
        );
        "
    ).map_err(|e| e.to_string())?;

    // Safe schema alter using explicit connection methods because execute_batch errors out if column already exists
    let _ = conn.execute("ALTER TABLE issues ADD COLUMN original_estimate_minutes INTEGER", []);
    let _ = conn.execute("ALTER TABLE issues ADD COLUMN rank REAL DEFAULT 0.0", []);
    let _ = conn.execute("ALTER TABLE issues ADD COLUMN pinned BOOLEAN DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE issues ADD COLUMN archived BOOLEAN DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE projects ADD COLUMN project_type TEXT DEFAULT 'Scrum'", []);
    let _ = conn.execute("ALTER TABLE workflow_statuses ADD COLUMN wip_limit INTEGER", []);

    Ok(conn)
}

pub(super) fn ensure_default_workflow_statuses(
    conn: &Connection,
    project_id: i64,
) -> Result<(), String> {
    let count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM workflow_statuses WHERE project_id = ?1",
            params![project_id],
            |row| row.get(0),
        )
        .unwrap_or(0);

    if count > 0 {
        return Ok(());
    }

    for (position, (name, category)) in [
        ("To Do", "To Do"),
        ("In Progress", "In Progress"),
        ("In Review", "In Review"),
        ("Done", "Done"),
    ]
    .iter()
    .enumerate()
    {
        conn.execute(
            "INSERT INTO workflow_statuses (project_id, name, category, position, wip_limit) VALUES (?1, ?2, ?3, ?4, NULL)",
            params![project_id, name, category, position as i64],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

fn ensure_active_sprint(conn: &Connection, project_id: i64) -> Result<(), String> {
    let total_sprints: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM sprints WHERE project_id = ?1",
            params![project_id],
            |row| row.get(0),
        )
        .unwrap_or(0);

    if total_sprints == 0 {
        conn.execute(
            "INSERT INTO sprints (project_id, name, status, start_date, end_date) VALUES (?1, 'Sprint 1', 'active', NULL, NULL)",
            params![project_id],
        )
        .map_err(|e| e.to_string())?;
        return Ok(());
    }

    let active_sprints: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM sprints WHERE project_id = ?1 AND status = 'active'",
            params![project_id],
            |row| row.get(0),
        )
        .unwrap_or(0);

    if active_sprints == 0 {
        let next_sprint_id: Option<i64> = conn
            .query_row(
                "SELECT id FROM sprints WHERE project_id = ?1 AND status = 'planned' ORDER BY id ASC LIMIT 1",
                params![project_id],
                |row| row.get(0),
            )
            .ok();

        if let Some(id) = next_sprint_id {
            conn.execute(
                "UPDATE sprints SET status = 'active' WHERE id = ?1",
                params![id],
            )
            .map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}

// =============================================================================
// PROJECTS
// =============================================================================

#[derive(Serialize, Deserialize)]
pub struct Project {
    pub id: i64,
    pub name: String,
    pub key: String,
    pub description: Option<String>,
    pub color_tag: String,
    pub created_at: String,
    pub project_type: Option<String>,
}

#[derive(Deserialize)]
pub struct CreateProjectInput {
    pub name: String,
    pub key: String,
    pub description: Option<String>,
    pub color_tag: String,
    pub created_at: String,
    pub project_type: Option<String>,
}

#[derive(Deserialize)]
pub struct UpdateProjectInput {
    pub id: i64,
    pub name: String,
    pub key: String,
    pub description: Option<String>,
    pub color_tag: String,
    pub project_type: Option<String>,
}

#[tauri::command]
pub fn create_project(app: AppHandle, input: CreateProjectInput) -> Result<String, String> {
    let conn = db_connection(&app)?;
    let p_type = input.project_type.unwrap_or_else(|| "Scrum".to_string());
    conn.execute(
        "INSERT INTO projects (name, key, description, color_tag, created_at, project_type) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![input.name, input.key, input.description, input.color_tag, input.created_at, p_type],
    )
    .map_err(|e| e.to_string())?;
    let project_id = conn.last_insert_rowid();
    ensure_default_workflow_statuses(&conn, project_id)?;
    ensure_active_sprint(&conn, project_id)?;
    Ok("Project created".to_string())
}

#[tauri::command]
pub fn get_projects(app: AppHandle) -> Result<Vec<Project>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare("SELECT id, name, key, description, color_tag, created_at, project_type FROM projects ORDER BY id DESC").map_err(|e| e.to_string())?;

    let rows = stmt.query_map([], |row| {
        Ok(Project {
            id: row.get(0)?,
            name: row.get(1)?,
            key: row.get(2)?,
            description: row.get(3)?,
            color_tag: row.get(4)?,
            created_at: row.get(5)?,
            project_type: row.get(6)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut projects = Vec::new();
    for row in rows {
        projects.push(row.map_err(|e| e.to_string())?);
    }

    Ok(projects)
}

#[tauri::command]
pub fn update_project(app: AppHandle, input: UpdateProjectInput) -> Result<String, String> {
    let conn = db_connection(&app)?;
    let p_type = input.project_type.unwrap_or_else(|| "Scrum".to_string());
    conn.execute(
        "UPDATE projects SET name = ?1, key = ?2, description = ?3, color_tag = ?4, project_type = ?5 WHERE id = ?6",
        params![input.name, input.key, input.description, input.color_tag, p_type, input.id],
    )
    .map_err(|e| e.to_string())?;
    Ok("Project updated".to_string())
}

#[tauri::command]
pub fn delete_project(app: AppHandle, id: i64) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute("DELETE FROM projects WHERE id = ?1", params![id]).map_err(|e| e.to_string())?;
    Ok("Project deleted".to_string())
}

// =============================================================================
// SPRINTS
// =============================================================================

#[derive(Serialize, Deserialize)]
pub struct Sprint {
    pub id: i64,
    pub project_id: i64,
    pub name: String,
    pub status: String,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
}

#[derive(Deserialize)]
pub struct CreateSprintInput {
    pub project_id: i64,
    pub name: String,
    pub status: String,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
}

#[tauri::command]
pub fn create_sprint(app: AppHandle, input: CreateSprintInput) -> Result<String, String> {
    let conn = db_connection(&app)?;
    if input.status == "active" {
        conn.execute(
            "UPDATE sprints SET status = 'planned' WHERE project_id = ?1 AND status = 'active'",
            params![input.project_id],
        )
        .map_err(|e| e.to_string())?;
    }
    conn.execute(
        "INSERT INTO sprints (project_id, name, status, start_date, end_date) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![input.project_id, input.name, input.status, input.start_date, input.end_date],
    )
    .map_err(|e| e.to_string())?;
    Ok("Sprint created".to_string())
}

#[tauri::command]
pub fn get_sprints(app: AppHandle, project_id: i64) -> Result<Vec<Sprint>, String> {
    let conn = db_connection(&app)?;
    ensure_active_sprint(&conn, project_id)?;
    let mut stmt = conn.prepare("SELECT id, project_id, name, status, start_date, end_date FROM sprints WHERE project_id = ?1 ORDER BY id DESC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![project_id], |row| {
        Ok(Sprint {
            id: row.get(0)?,
            project_id: row.get(1)?,
            name: row.get(2)?,
            status: row.get(3)?,
            start_date: row.get(4)?,
            end_date: row.get(5)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut items = Vec::new();
    for row in rows {
        items.push(row.map_err(|e| e.to_string())?);
    }
    Ok(items)
}

#[tauri::command]
pub fn update_sprint(app: AppHandle, id: i64, name: String, status: String, start_date: Option<String>, end_date: Option<String>) -> Result<String, String> {
    let conn = db_connection(&app)?;
    if status == "active" {
        let project_id: i64 = conn
            .query_row(
                "SELECT project_id FROM sprints WHERE id = ?1",
                params![id],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?;
        conn.execute(
            "UPDATE sprints SET status = 'planned' WHERE project_id = ?1 AND status = 'active' AND id != ?2",
            params![project_id, id],
        )
        .map_err(|e| e.to_string())?;
    }
    conn.execute(
        "UPDATE sprints SET name = ?1, status = ?2, start_date = ?3, end_date = ?4 WHERE id = ?5",
        params![name, status, start_date, end_date, id],
    )
    .map_err(|e| e.to_string())?;
    Ok("Sprint updated".to_string())
}

#[tauri::command]
pub fn delete_sprint(app: AppHandle, id: i64) -> Result<String, String> {
    let conn = db_connection(&app)?;
    // Unassign issues from this sprint
    conn.execute("UPDATE issues SET sprint_id = NULL WHERE sprint_id = ?1", params![id]).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM sprints WHERE id = ?1", params![id]).map_err(|e| e.to_string())?;
    Ok("Sprint deleted".to_string())
}

// =============================================================================
// ISSUES
// =============================================================================

#[derive(Serialize, Deserialize)]
pub struct Issue {
    pub id: i64,
    pub project_id: i64,
    pub sprint_id: Option<i64>,
    pub parent_id: Option<i64>,
    pub issue_type: String,
    pub key: String,
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub priority: String,
    pub story_points: Option<i64>,
    pub time_spent_minutes: i64,
    pub original_estimate_minutes: Option<i64>,
    pub rank: f64,
    pub pinned: bool,
    pub archived: bool,
    pub due_date: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Deserialize)]
pub struct CreateIssueInput {
    pub project_id: i64,
    pub sprint_id: Option<i64>,
    pub parent_id: Option<i64>,
    pub issue_type: String,
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub priority: String,
    pub story_points: Option<i64>,
    pub original_estimate_minutes: Option<i64>,
    pub due_date: Option<String>,
    pub created_at: String,
}

#[tauri::command]
pub fn create_issue(app: AppHandle, input: CreateIssueInput) -> Result<String, String> {
    let conn = db_connection(&app)?;

    // Auto-generate key: GET max ID for project + 1
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM issues WHERE project_id = ?1",
        params![input.project_id],
        |row| row.get(0),
    ).unwrap_or(0);

    let proj_key: String = conn.query_row(
        "SELECT key FROM projects WHERE id = ?1",
        params![input.project_id],
        |row| row.get(0),
    ).map_err(|e| e.to_string())?;

    let new_key = format!("{}-{}", proj_key, count + 1);

    conn.execute(
        "INSERT INTO issues (project_id, sprint_id, parent_id, issue_type, key, title, description, status, priority, story_points, time_spent_minutes, original_estimate_minutes, rank, pinned, due_date, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, 0, ?11, 0.0, 0, ?12, ?13, ?14)",
        params![input.project_id, input.sprint_id, input.parent_id, input.issue_type, new_key, input.title, input.description, input.status, input.priority, input.story_points, input.original_estimate_minutes, input.due_date, input.created_at, input.created_at],
    )
    .map_err(|e| e.to_string())?;
    Ok("Issue created".to_string())
}

#[tauri::command]
pub fn get_issues(app: AppHandle, project_id: i64) -> Result<Vec<Issue>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare("SELECT id, project_id, sprint_id, parent_id, issue_type, key, title, description, status, priority, story_points, time_spent_minutes, due_date, created_at, updated_at, original_estimate_minutes, rank, pinned, COALESCE(archived, 0) FROM issues WHERE project_id = ?1 AND COALESCE(archived, 0) = 0 ORDER BY pinned DESC, created_at DESC").map_err(|e| e.to_string())?;

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
            archived: row.get(18)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut items = Vec::new();
    for row in rows {
        items.push(row.map_err(|e| e.to_string())?);
    }
    Ok(items)
}

#[derive(Deserialize)]
pub struct UpdateIssueInput {
    pub id: i64,
    pub sprint_id: Option<i64>,
    pub issue_type: String,
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub priority: String,
    pub story_points: Option<i64>,
    pub time_spent_minutes: i64,
    pub original_estimate_minutes: Option<i64>,
    pub rank: f64,
    pub pinned: bool,
    pub archived: Option<bool>,
    pub due_date: Option<String>,
    pub updated_at: String,
}

#[tauri::command]
pub fn update_issue(app: AppHandle, input: UpdateIssueInput) -> Result<String, String> {
    let conn = db_connection(&app)?;
    let previous = conn
        .query_row(
            "SELECT title, description, status, priority, issue_type, story_points, due_date, original_estimate_minutes, pinned, COALESCE(archived, 0) FROM issues WHERE id = ?1",
            params![input.id],
            |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, Option<String>>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, String>(3)?,
                    row.get::<_, String>(4)?,
                    row.get::<_, Option<i64>>(5)?,
                    row.get::<_, Option<String>>(6)?,
                    row.get::<_, Option<i64>>(7)?,
                    row.get::<_, bool>(8)?,
                    row.get::<_, bool>(9)?,
                ))
            },
        )
        .ok();
    let archived = input.archived.unwrap_or_else(|| previous.as_ref().map(|p| p.9).unwrap_or(false));
    conn.execute(
        "UPDATE issues SET sprint_id = ?1, issue_type = ?2, title = ?3, description = ?4, status = ?5, priority = ?6, story_points = ?7, time_spent_minutes = ?8, due_date = ?9, updated_at = ?10, original_estimate_minutes = ?11, rank = ?12, pinned = ?13, archived = ?14 WHERE id = ?15",
        params![input.sprint_id, input.issue_type, input.title, input.description, input.status, input.priority, input.story_points, input.time_spent_minutes, input.due_date, input.updated_at, input.original_estimate_minutes, input.rank, input.pinned, archived, input.id],
    )
    .map_err(|e| e.to_string())?;

    if let Some(prev) = previous {
        let changes = [
            ("title", Some(prev.0), Some(input.title.clone())),
            ("description", prev.1, input.description.clone()),
            ("status", Some(prev.2), Some(input.status.clone())),
            ("priority", Some(prev.3), Some(input.priority.clone())),
            ("issue_type", Some(prev.4), Some(input.issue_type.clone())),
            ("story_points", prev.5.map(|v| v.to_string()), input.story_points.map(|v| v.to_string())),
            ("due_date", prev.6, input.due_date.clone()),
            ("estimate", prev.7.map(|v| v.to_string()), input.original_estimate_minutes.map(|v| v.to_string())),
            ("pinned", Some(prev.8.to_string()), Some(input.pinned.to_string())),
            ("archived", Some(prev.9.to_string()), Some(archived.to_string())),
        ];

        for (field, old_value, new_value) in changes {
            if old_value != new_value {
                conn.execute(
                    "INSERT INTO issue_history (issue_id, field_name, old_value, new_value, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
                    params![input.id, field, old_value, new_value, input.updated_at],
                )
                .map_err(|e| e.to_string())?;
            }
        }
    }
    Ok("Issue updated".to_string())
}

#[tauri::command]
pub fn clone_issue(app: AppHandle, id: i64, created_at: String) -> Result<String, String> {
    let conn = db_connection(&app)?;
    let source = conn
        .query_row(
            "SELECT project_id, sprint_id, parent_id, issue_type, title, description, status, priority, story_points, original_estimate_minutes, rank, due_date FROM issues WHERE id = ?1",
            params![id],
            |row| {
                Ok((
                    row.get::<_, i64>(0)?,
                    row.get::<_, Option<i64>>(1)?,
                    row.get::<_, Option<i64>>(2)?,
                    row.get::<_, String>(3)?,
                    row.get::<_, String>(4)?,
                    row.get::<_, Option<String>>(5)?,
                    row.get::<_, String>(6)?,
                    row.get::<_, String>(7)?,
                    row.get::<_, Option<i64>>(8)?,
                    row.get::<_, Option<i64>>(9)?,
                    row.get::<_, f64>(10)?,
                    row.get::<_, Option<String>>(11)?,
                ))
            },
        )
        .map_err(|e| e.to_string())?;
    let count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM issues WHERE project_id = ?1",
            params![source.0],
            |row| row.get(0),
        )
        .unwrap_or(0);
    let proj_key: String = conn
        .query_row("SELECT key FROM projects WHERE id = ?1", params![source.0], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    let new_key = format!("{}-{}", proj_key, count + 1);

    conn.execute(
        "INSERT INTO issues (project_id, sprint_id, parent_id, issue_type, key, title, description, status, priority, story_points, time_spent_minutes, original_estimate_minutes, rank, pinned, due_date, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, 0, ?11, ?12, 0, ?13, ?14, ?15)",
        params![source.0, source.1, source.2, source.3, new_key, format!("{} (Copy)", source.4), source.5, source.6, source.7, source.8, source.9, source.10 + 1.0, source.11, created_at, created_at],
    )
    .map_err(|e| e.to_string())?;
    Ok("Issue cloned".to_string())
}

#[tauri::command]
pub fn delete_issue(app: AppHandle, id: i64) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute("DELETE FROM issues WHERE id = ?1", params![id]).map_err(|e| e.to_string())?;
    Ok("Issue deleted".to_string())
}

// =============================================================================
// COMMENTS
// =============================================================================

#[derive(Serialize, Deserialize)]
pub struct Comment {
    pub id: i64,
    pub issue_id: i64,
    pub content: String,
    pub created_at: String,
}

#[tauri::command]
pub fn create_comment(app: AppHandle, issue_id: i64, content: String, created_at: String) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute(
        "INSERT INTO comments (issue_id, content, created_at) VALUES (?1, ?2, ?3)",
        params![issue_id, content, created_at],
    )
    .map_err(|e| e.to_string())?;
    Ok("Comment created".to_string())
}

#[tauri::command]
pub fn get_comments(app: AppHandle, issue_id: i64) -> Result<Vec<Comment>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare("SELECT id, issue_id, content, created_at FROM comments WHERE issue_id = ?1 ORDER BY created_at ASC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![issue_id], |row| {
        Ok(Comment {
            id: row.get(0)?,
            issue_id: row.get(1)?,
            content: row.get(2)?,
            created_at: row.get(3)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut items = Vec::new();
    for row in rows {
        items.push(row.map_err(|e| e.to_string())?);
    }
    Ok(items)
}

#[tauri::command]
pub fn delete_comment(app: AppHandle, id: i64) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute("DELETE FROM comments WHERE id = ?1", params![id]).map_err(|e| e.to_string())?;
    Ok("Comment deleted".to_string())
}

// =============================================================================
// LABELS
// =============================================================================

#[derive(Serialize, Deserialize)]
pub struct Label {
    pub id: i64,
    pub project_id: i64,
    pub name: String,
    pub color: String,
}

#[tauri::command]
pub fn create_label(app: AppHandle, project_id: i64, name: String, color: String) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute(
        "INSERT INTO labels (project_id, name, color) VALUES (?1, ?2, ?3)",
        params![project_id, name, color],
    )
    .map_err(|e| e.to_string())?;
    Ok("Label created".to_string())
}

#[tauri::command]
pub fn get_labels(app: AppHandle, project_id: i64) -> Result<Vec<Label>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare("SELECT id, project_id, name, color FROM labels WHERE project_id = ?1 ORDER BY name ASC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![project_id], |row| {
        Ok(Label {
            id: row.get(0)?,
            project_id: row.get(1)?,
            name: row.get(2)?,
            color: row.get(3)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut items = Vec::new();
    for row in rows {
        items.push(row.map_err(|e| e.to_string())?);
    }
    Ok(items)
}

#[tauri::command]
pub fn delete_label(app: AppHandle, id: i64) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute("DELETE FROM labels WHERE id = ?1", params![id]).map_err(|e| e.to_string())?;
    Ok("Label deleted".to_string())
}

// =============================================================================
// STRATEGIES
// =============================================================================

#[derive(Serialize, Deserialize)]
pub struct Strategy {
    pub id: i64,
    pub project_id: i64,
    pub name: String,
    pub category: String,
    pub markdown: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Deserialize)]
pub struct CreateStrategyInput {
    pub project_id: i64,
    pub name: String,
    pub category: String,
    pub markdown: String,
    pub created_at: String,
}

#[derive(Deserialize)]
pub struct UpdateStrategyInput {
    pub id: i64,
    pub name: String,
    pub category: String,
    pub markdown: String,
    pub updated_at: String,
}

#[tauri::command]
pub fn create_strategy(app: AppHandle, input: CreateStrategyInput) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute(
        "INSERT INTO strategies (project_id, name, category, markdown, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![input.project_id, input.name, input.category, input.markdown, input.created_at, input.created_at],
    )
    .map_err(|e| e.to_string())?;
    Ok("Strategy created".to_string())
}

#[tauri::command]
pub fn get_strategies(app: AppHandle, project_id: i64) -> Result<Vec<Strategy>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn
        .prepare(
            "SELECT id, project_id, name, category, markdown, created_at, updated_at FROM strategies WHERE project_id = ?1 ORDER BY updated_at DESC, id DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![project_id], |row| {
            Ok(Strategy {
                id: row.get(0)?,
                project_id: row.get(1)?,
                name: row.get(2)?,
                category: row.get(3)?,
                markdown: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut items = Vec::new();
    for row in rows {
        items.push(row.map_err(|e| e.to_string())?);
    }
    Ok(items)
}

#[tauri::command]
pub fn update_strategy(app: AppHandle, input: UpdateStrategyInput) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute(
        "UPDATE strategies SET name = ?1, category = ?2, markdown = ?3, updated_at = ?4 WHERE id = ?5",
        params![input.name, input.category, input.markdown, input.updated_at, input.id],
    )
    .map_err(|e| e.to_string())?;
    Ok("Strategy updated".to_string())
}

#[tauri::command]
pub fn delete_strategy(app: AppHandle, id: i64) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute("DELETE FROM strategies WHERE id = ?1", params![id]).map_err(|e| e.to_string())?;
    Ok("Strategy deleted".to_string())
}

#[tauri::command]
pub fn toggle_issue_label(app: AppHandle, issue_id: i64, label_id: i64) -> Result<String, String> {
    let conn = db_connection(&app)?;
    let exists: bool = conn.query_row(
        "SELECT COUNT(*) FROM issue_labels WHERE issue_id = ?1 AND label_id = ?2",
        params![issue_id, label_id],
        |row| row.get::<_, i64>(0),
    ).unwrap_or(0) > 0;

    if exists {
        conn.execute("DELETE FROM issue_labels WHERE issue_id = ?1 AND label_id = ?2", params![issue_id, label_id]).map_err(|e| e.to_string())?;
    } else {
        conn.execute("INSERT INTO issue_labels (issue_id, label_id) VALUES (?1, ?2)", params![issue_id, label_id]).map_err(|e| e.to_string())?;
    }
    Ok("Toggled".to_string())
}

#[tauri::command]
pub fn get_issue_labels(app: AppHandle, issue_id: i64) -> Result<Vec<Label>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare("SELECT l.id, l.project_id, l.name, l.color FROM labels l INNER JOIN issue_labels il ON l.id = il.label_id WHERE il.issue_id = ?1 ORDER BY l.name ASC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![issue_id], |row| {
        Ok(Label {
            id: row.get(0)?,
            project_id: row.get(1)?,
            name: row.get(2)?,
            color: row.get(3)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut items = Vec::new();
    for row in rows {
        items.push(row.map_err(|e| e.to_string())?);
    }
    Ok(items)
}

// =============================================================================
// ISSUE LINKS
// =============================================================================

#[derive(Serialize, Deserialize)]
pub struct IssueLink {
    pub id: i64,
    pub link_type: String,
    pub source_issue_id: i64,
    pub target_issue_id: i64,
    pub target_key: String,
    pub target_title: String,
}

#[tauri::command]
pub fn create_issue_link(app: AppHandle, link_type: String, source_issue_id: i64, target_issue_id: i64) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute(
        "INSERT INTO issue_links (link_type, source_issue_id, target_issue_id) VALUES (?1, ?2, ?3)",
        params![link_type, source_issue_id, target_issue_id],
    )
    .map_err(|e| e.to_string())?;
    Ok("Link created".to_string())
}

#[tauri::command]
pub fn get_issue_links(app: AppHandle, issue_id: i64) -> Result<Vec<IssueLink>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare(
        "SELECT il.id, il.link_type, il.source_issue_id, il.target_issue_id, i.key, i.title
         FROM issue_links il
         INNER JOIN issues i ON i.id = il.target_issue_id
         WHERE il.source_issue_id = ?1
         UNION ALL
         SELECT il.id, il.link_type, il.source_issue_id, il.target_issue_id, i.key, i.title
         FROM issue_links il
         INNER JOIN issues i ON i.id = il.source_issue_id
         WHERE il.target_issue_id = ?1
         ORDER BY id DESC"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map(params![issue_id], |row| {
        Ok(IssueLink {
            id: row.get(0)?,
            link_type: row.get(1)?,
            source_issue_id: row.get(2)?,
            target_issue_id: row.get(3)?,
            target_key: row.get(4)?,
            target_title: row.get(5)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut items = Vec::new();
    for row in rows {
        items.push(row.map_err(|e| e.to_string())?);
    }
    Ok(items)
}

#[tauri::command]
pub fn delete_issue_link(app: AppHandle, id: i64) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute("DELETE FROM issue_links WHERE id = ?1", params![id]).map_err(|e| e.to_string())?;
    Ok("Link deleted".to_string())
}

// =============================================================================
// WORKLOGS
// =============================================================================

#[derive(Serialize, Deserialize)]
pub struct Worklog {
    pub id: i64,
    pub issue_id: i64,
    pub minutes: i64,
    pub description: Option<String>,
    pub created_at: String,
}

#[tauri::command]
pub fn create_worklog(app: AppHandle, issue_id: i64, minutes: i64, description: Option<String>, created_at: String) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute(
        "INSERT INTO worklogs (issue_id, minutes, description, created_at) VALUES (?1, ?2, ?3, ?4)",
        params![issue_id, minutes, description, created_at],
    )
    .map_err(|e| e.to_string())?;
    // Also update the total time_spent_minutes on the issue
    conn.execute(
        "UPDATE issues SET time_spent_minutes = time_spent_minutes + ?1 WHERE id = ?2",
        params![minutes, issue_id],
    )
    .map_err(|e| e.to_string())?;
    Ok("Worklog created".to_string())
}

#[tauri::command]
pub fn get_worklogs(app: AppHandle, issue_id: i64) -> Result<Vec<Worklog>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare("SELECT id, issue_id, minutes, description, created_at FROM worklogs WHERE issue_id = ?1 ORDER BY created_at DESC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![issue_id], |row| {
        Ok(Worklog {
            id: row.get(0)?,
            issue_id: row.get(1)?,
            minutes: row.get(2)?,
            description: row.get(3)?,
            created_at: row.get(4)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut items = Vec::new();
    for row in rows {
        items.push(row.map_err(|e| e.to_string())?);
    }
    Ok(items)
}
