use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use tauri::AppHandle;

use crate::sub_apps::utils::storage_root;

fn db_connection(app: &AppHandle) -> Result<Connection, String> {
    let mut db_path = storage_root(app)?;
    db_path.push("projects_v2.db");

    if let Some(parent) = db_path.parent() {
        let p: &Path = parent;
        if !p.exists() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
    }

    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            color_tag TEXT NOT NULL,
            created_at TEXT NOT NULL
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL,
            priority TEXT NOT NULL,
            due_date TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    Ok(conn)
}

// -----------------------------------------------------------------------------
// PROJECTS
// -----------------------------------------------------------------------------

#[derive(Serialize, Deserialize)]
pub struct Project {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub color_tag: String,
    pub created_at: String,
}

#[derive(Deserialize)]
pub struct CreateProjectInput {
    pub name: String,
    pub description: Option<String>,
    pub color_tag: String,
    pub created_at: String,
}

#[derive(Deserialize)]
pub struct UpdateProjectInput {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub color_tag: String,
}

#[tauri::command]
pub fn create_project(app: AppHandle, input: CreateProjectInput) -> Result<String, String> {
    let conn = db_connection(&app)?;
    
    conn.execute(
        "INSERT INTO projects (name, description, color_tag, created_at) VALUES (?1, ?2, ?3, ?4)",
        params![input.name, input.description, input.color_tag, input.created_at],
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Project created".to_string())
}

#[tauri::command]
pub fn get_projects(app: AppHandle) -> Result<Vec<Project>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare("SELECT id, name, description, color_tag, created_at FROM projects ORDER BY id DESC").map_err(|e| e.to_string())?;
    
    let rows = stmt.query_map([], |row| {
        Ok(Project {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            color_tag: row.get(3)?,
            created_at: row.get(4)?,
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
    
    conn.execute(
        "UPDATE projects SET name = ?1, description = ?2, color_tag = ?3 WHERE id = ?4",
        params![input.name, input.description, input.color_tag, input.id],
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Project updated".to_string())
}

#[tauri::command]
pub fn delete_project(app: AppHandle, id: i64) -> Result<String, String> {
    let mut conn = db_connection(&app)?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    
    // foreign key cascade isn't on by default in sqlite without PRAGMA foreign_keys = ON; 
    // manually delete tasks
    tx.execute("DELETE FROM tasks WHERE project_id = ?1", params![id]).map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM projects WHERE id = ?1", params![id]).map_err(|e| e.to_string())?;
    
    tx.commit().map_err(|e| e.to_string())?;
    Ok("Project deleted".to_string())
}

// -----------------------------------------------------------------------------
// TASKS (Todo Manager)
// -----------------------------------------------------------------------------

#[derive(Serialize, Deserialize)]
pub struct Task {
    pub id: i64,
    pub project_id: i64,
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub priority: String,
    pub due_date: Option<String>,
    pub created_at: String,
}

#[derive(Deserialize)]
pub struct CreateTaskInput {
    pub project_id: i64,
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub priority: String,
    pub due_date: Option<String>,
    pub created_at: String,
}

#[derive(Deserialize)]
pub struct UpdateTaskInput {
    pub id: i64,
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub priority: String,
    pub due_date: Option<String>,
}

#[tauri::command]
pub fn create_task(app: AppHandle, input: CreateTaskInput) -> Result<String, String> {
    let conn = db_connection(&app)?;
    
    conn.execute(
        "INSERT INTO tasks (project_id, title, description, status, priority, due_date, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![input.project_id, input.title, input.description, input.status, input.priority, input.due_date, input.created_at],
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Task created".to_string())
}

#[tauri::command]
pub fn get_tasks(app: AppHandle, project_id: i64) -> Result<Vec<Task>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare("SELECT id, project_id, title, description, status, priority, due_date, created_at FROM tasks WHERE project_id = ?1 ORDER BY id DESC").map_err(|e| e.to_string())?;
    
    let rows = stmt.query_map(params![project_id], |row| {
        Ok(Task {
            id: row.get(0)?,
            project_id: row.get(1)?,
            title: row.get(2)?,
            description: row.get(3)?,
            status: row.get(4)?,
            priority: row.get(5)?,
            due_date: row.get(6)?,
            created_at: row.get(7)?,
        })
    }).map_err(|e| e.to_string())?;
    
    let mut tasks = Vec::new();
    for row in rows {
        tasks.push(row.map_err(|e| e.to_string())?);
    }
    
    Ok(tasks)
}

#[tauri::command]
pub fn update_task(app: AppHandle, input: UpdateTaskInput) -> Result<String, String> {
    let conn = db_connection(&app)?;
    
    conn.execute(
        "UPDATE tasks SET title = ?1, description = ?2, status = ?3, priority = ?4, due_date = ?5 WHERE id = ?6",
        params![input.title, input.description, input.status, input.priority, input.due_date, input.id],
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Task updated".to_string())
}

#[tauri::command]
pub fn delete_task(app: AppHandle, id: i64) -> Result<String, String> {
    let conn = db_connection(&app)?;
    
    conn.execute(
        "DELETE FROM tasks WHERE id = ?1",
        params![id],
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Task deleted".to_string())
}
