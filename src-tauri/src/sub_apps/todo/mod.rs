use rusqlite::{params, Connection};
use serde::Deserialize;
use tauri::AppHandle;

use super::utils::storage_root;

#[derive(serde::Serialize, Deserialize)]
pub struct TodoItem {
    pub id: i64,
    pub title: String,
    pub completed: bool,
    pub created_at: String,
    pub completed_at: String,
}

#[derive(Deserialize)]
pub struct CreateTodoInput {
    pub title: String,
}

#[derive(Deserialize)]
pub struct UpdateTodoInput {
    pub title: Option<String>,
    pub completed: Option<bool>,
}

fn db_connection(app: &AppHandle) -> Result<Connection, String> {
    let base = storage_root(app)?;
    let db_path = base.join("todo.db");

    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            completed INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            completed_at TEXT NOT NULL DEFAULT ('NOT COMPLETED')
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    Ok(conn)
}

#[tauri::command]
pub fn create_todo(app: AppHandle, input: CreateTodoInput) -> Result<String, String> {
    let title = input.title.trim();
    if title.is_empty() {
        return Err("Title cannot be empty".to_string());
    }

    let conn = db_connection(&app)?;
    conn.execute(
        "INSERT INTO todos (title, completed) VALUES (?1, 0)",
        params![title],
    )
    .map_err(|e| e.to_string())?;

    Ok("Todo created successfully".to_string())
}

#[tauri::command]
pub fn get_todo(app: AppHandle) -> Result<Vec<TodoItem>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn
        .prepare(
            "SELECT id, title, completed, created_at, completed_at FROM todos ORDER BY id DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(TodoItem {
                id: row.get(0)?,
                title: row.get(1)?,
                completed: row.get::<_, i64>(2)? != 0,
                created_at: row.get(3)?,
                completed_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut todos = Vec::new();
    for row in rows {
        todos.push(row.map_err(|e| e.to_string())?);
    }

    Ok(todos)
}

#[tauri::command]
pub fn update_todo(app: AppHandle, id: i64, updated: UpdateTodoInput) -> Result<String, String> {
    let conn = db_connection(&app)?;

    if let Some(title) = updated.title {
        let trimmed = title.trim();
        if trimmed.is_empty() {
            return Err("Title cannot be empty".to_string());
        }
        conn.execute(
            "UPDATE todos SET title = ?1 WHERE id = ?2",
            params![trimmed, id],
        )
        .map_err(|e| e.to_string())?;
    }

    if let Some(completed) = updated.completed {
        let completed_at = if completed {
            "NOT COMPLETED"
        } else {
            "NOT COMPLETED"
        };
        conn.execute(
            "UPDATE todos SET completed = ?1, completed_at = ?2 WHERE id = ?3",
            params![if completed { 1 } else { 0 }, completed_at, id],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok("Todo updated successfully".to_string())
}

#[tauri::command]
pub fn get_pending_todos(app: AppHandle) -> Result<Vec<TodoItem>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn
    .prepare("SELECT id, title, completed, created_at, completed_at FROM todos WHERE completed = 0 ORDER BY id DESC")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(TodoItem {
                id: row.get(0)?,
                title: row.get(1)?,
                completed: row.get::<_, i64>(2)? != 0,
                created_at: row.get(3)?,
                completed_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut todos = Vec::new();
    for row in rows {
        todos.push(row.map_err(|e| e.to_string())?);
    }

    Ok(todos)
}

#[tauri::command]
pub fn delete_todo(app: AppHandle, id: i64) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute("DELETE FROM todos WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok("Todo deleted successfully".to_string())
}
