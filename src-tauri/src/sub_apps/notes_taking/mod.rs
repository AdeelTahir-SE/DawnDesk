use rusqlite::{params, Connection};
use serde::Deserialize;
use tauri::AppHandle;

use super::utils::storage_root;

// ─── Data Structs ────────────────────────────────────────────────────────────

#[derive(serde::Serialize, Deserialize, Clone)]
pub struct NoteItem {
    pub id: i64,
    pub title: String,
    pub content: String,
    pub notebook_id: Option<i64>,
    pub is_pinned: bool,
    pub is_favorite: bool,
    pub is_archived: bool,
    pub is_deleted: bool,
    pub deleted_at: Option<String>,
    pub color: String,
    pub word_count: i64,
    pub char_count: i64,
    pub reading_time_minutes: f64,
    pub is_daily_note: bool,
    pub daily_date: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Deserialize)]
pub struct CreateNoteInput {
    pub title: String,
    pub content: Option<String>,
    pub notebook_id: Option<i64>,
    pub is_daily_note: Option<bool>,
    pub daily_date: Option<String>,
}

#[derive(Deserialize)]
pub struct UpdateNoteInput {
    pub id: i64,
    pub title: Option<String>,
    pub content: Option<String>,
    pub notebook_id: Option<i64>,
    pub is_pinned: Option<bool>,
    pub is_favorite: Option<bool>,
    pub is_archived: Option<bool>,
    pub is_deleted: Option<bool>,
    pub color: Option<String>,
    pub word_count: Option<i64>,
    pub char_count: Option<i64>,
    pub reading_time_minutes: Option<f64>,
}

#[derive(serde::Serialize, Deserialize, Clone)]
pub struct NotebookItem {
    pub id: i64,
    pub name: String,
    pub parent_id: Option<i64>,
    pub color: String,
    pub icon: String,
    pub sort_order: i64,
    pub created_at: String,
}

#[derive(Deserialize)]
pub struct CreateNotebookInput {
    pub name: String,
    pub parent_id: Option<i64>,
    pub color: Option<String>,
    pub icon: Option<String>,
}

#[derive(Deserialize)]
pub struct UpdateNotebookInput {
    pub id: i64,
    pub name: Option<String>,
    pub parent_id: Option<i64>,
    pub color: Option<String>,
    pub icon: Option<String>,
    pub sort_order: Option<i64>,
}

#[derive(serde::Serialize, Deserialize, Clone)]
pub struct TagItem {
    pub id: i64,
    pub name: String,
    pub parent_id: Option<i64>,
    pub color: String,
}

#[derive(Deserialize)]
pub struct CreateTagInput {
    pub name: String,
    pub parent_id: Option<i64>,
    pub color: Option<String>,
}

#[derive(Deserialize)]
pub struct UpdateTagInput {
    pub id: i64,
    pub name: Option<String>,
    pub parent_id: Option<i64>,
    pub color: Option<String>,
}

#[derive(serde::Serialize, Deserialize, Clone)]
pub struct NoteTagItem {
    pub note_id: i64,
    pub tag_id: i64,
}

#[derive(serde::Serialize, Deserialize, Clone)]
pub struct NoteLinkItem {
    pub id: i64,
    pub source_note_id: i64,
    pub target_note_id: i64,
    pub created_at: String,
}

#[derive(Deserialize)]
pub struct CreateNoteLinkInput {
    pub source_note_id: i64,
    pub target_note_id: i64,
}

#[derive(serde::Serialize, Deserialize, Clone)]
pub struct NoteVersionItem {
    pub id: i64,
    pub note_id: i64,
    pub title: String,
    pub content: String,
    pub word_count: i64,
    pub created_at: String,
}

#[derive(Deserialize)]
pub struct CreateNoteVersionInput {
    pub note_id: i64,
    pub title: String,
    pub content: String,
    pub word_count: Option<i64>,
}

#[derive(serde::Serialize, Deserialize, Clone)]
pub struct NoteTemplateItem {
    pub id: i64,
    pub name: String,
    pub category: String,
    pub content: String,
    pub icon: String,
    pub created_at: String,
}

#[derive(Deserialize)]
pub struct CreateNoteTemplateInput {
    pub name: String,
    pub category: Option<String>,
    pub content: String,
    pub icon: Option<String>,
}

// ─── Database ────────────────────────────────────────────────────────────────

fn db_connection(app: &AppHandle) -> Result<Connection, String> {
    let base = storage_root(app)?;
    let db_path = base.join("notes.db");
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    // Enable WAL mode for better concurrent read performance
    conn.execute_batch("PRAGMA journal_mode=WAL;")
        .map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS notebooks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            parent_id INTEGER,
            color TEXT NOT NULL DEFAULT '',
            icon TEXT NOT NULL DEFAULT '',
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY(parent_id) REFERENCES notebooks(id) ON DELETE SET NULL
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL DEFAULT 'Untitled',
            content TEXT NOT NULL DEFAULT '',
            notebook_id INTEGER,
            is_pinned BOOLEAN NOT NULL DEFAULT 0,
            is_favorite BOOLEAN NOT NULL DEFAULT 0,
            is_archived BOOLEAN NOT NULL DEFAULT 0,
            is_deleted BOOLEAN NOT NULL DEFAULT 0,
            deleted_at TEXT,
            color TEXT NOT NULL DEFAULT '',
            word_count INTEGER NOT NULL DEFAULT 0,
            char_count INTEGER NOT NULL DEFAULT 0,
            reading_time_minutes REAL NOT NULL DEFAULT 0,
            is_daily_note BOOLEAN NOT NULL DEFAULT 0,
            daily_date TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY(notebook_id) REFERENCES notebooks(id) ON DELETE SET NULL
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            parent_id INTEGER,
            color TEXT NOT NULL DEFAULT '',
            FOREIGN KEY(parent_id) REFERENCES tags(id) ON DELETE SET NULL
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS note_tags (
            note_id INTEGER NOT NULL,
            tag_id INTEGER NOT NULL,
            PRIMARY KEY (note_id, tag_id),
            FOREIGN KEY(note_id) REFERENCES notes(id) ON DELETE CASCADE,
            FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS note_links (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_note_id INTEGER NOT NULL,
            target_note_id INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY(source_note_id) REFERENCES notes(id) ON DELETE CASCADE,
            FOREIGN KEY(target_note_id) REFERENCES notes(id) ON DELETE CASCADE,
            UNIQUE(source_note_id, target_note_id)
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS note_versions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            note_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            word_count INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY(note_id) REFERENCES notes(id) ON DELETE CASCADE
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS note_templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT 'General',
            content TEXT NOT NULL DEFAULT '',
            icon TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    // Create indices for performance
    conn.execute_batch(
        "CREATE INDEX IF NOT EXISTS idx_notes_notebook ON notes(notebook_id);
         CREATE INDEX IF NOT EXISTS idx_notes_daily ON notes(is_daily_note, daily_date);
         CREATE INDEX IF NOT EXISTS idx_notes_deleted ON notes(is_deleted);
         CREATE INDEX IF NOT EXISTS idx_notes_archived ON notes(is_archived);
         CREATE INDEX IF NOT EXISTS idx_notes_favorite ON notes(is_favorite);
         CREATE INDEX IF NOT EXISTS idx_note_tags_note ON note_tags(note_id);
         CREATE INDEX IF NOT EXISTS idx_note_tags_tag ON note_tags(tag_id);
         CREATE INDEX IF NOT EXISTS idx_note_links_source ON note_links(source_note_id);
         CREATE INDEX IF NOT EXISTS idx_note_links_target ON note_links(target_note_id);
         CREATE INDEX IF NOT EXISTS idx_note_versions_note ON note_versions(note_id);",
    )
    .map_err(|e| e.to_string())?;

    Ok(conn)
}

// ─── Notes CRUD ──────────────────────────────────────────────────────────────

#[tauri::command]
pub fn notes_create_note(app: AppHandle, input: CreateNoteInput) -> Result<NoteItem, String> {
    let conn = db_connection(&app)?;
    let content = input.content.unwrap_or_default();
    let is_daily = input.is_daily_note.unwrap_or(false);

    conn.execute(
        "INSERT INTO notes (title, content, notebook_id, is_daily_note, daily_date) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![input.title, content, input.notebook_id, is_daily, input.daily_date],
    ).map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    let mut stmt = conn.prepare(
        "SELECT id, title, content, notebook_id, is_pinned, is_favorite, is_archived, is_deleted, deleted_at, color, word_count, char_count, reading_time_minutes, is_daily_note, daily_date, created_at, updated_at FROM notes WHERE id = ?1"
    ).map_err(|e| e.to_string())?;

    let note = stmt
        .query_row(params![id], |row| {
            Ok(NoteItem {
                id: row.get(0)?,
                title: row.get(1)?,
                content: row.get(2)?,
                notebook_id: row.get(3)?,
                is_pinned: row.get(4)?,
                is_favorite: row.get(5)?,
                is_archived: row.get(6)?,
                is_deleted: row.get(7)?,
                deleted_at: row.get(8)?,
                color: row.get(9)?,
                word_count: row.get(10)?,
                char_count: row.get(11)?,
                reading_time_minutes: row.get(12)?,
                is_daily_note: row.get(13)?,
                daily_date: row.get(14)?,
                created_at: row.get(15)?,
                updated_at: row.get(16)?,
            })
        })
        .map_err(|e| e.to_string())?;

    Ok(note)
}

#[tauri::command]
pub fn notes_get_notes(app: AppHandle) -> Result<Vec<NoteItem>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare(
        "SELECT id, title, content, notebook_id, is_pinned, is_favorite, is_archived, is_deleted, deleted_at, color, word_count, char_count, reading_time_minutes, is_daily_note, daily_date, created_at, updated_at FROM notes ORDER BY is_pinned DESC, updated_at DESC"
    ).map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(NoteItem {
                id: row.get(0)?,
                title: row.get(1)?,
                content: row.get(2)?,
                notebook_id: row.get(3)?,
                is_pinned: row.get(4)?,
                is_favorite: row.get(5)?,
                is_archived: row.get(6)?,
                is_deleted: row.get(7)?,
                deleted_at: row.get(8)?,
                color: row.get(9)?,
                word_count: row.get(10)?,
                char_count: row.get(11)?,
                reading_time_minutes: row.get(12)?,
                is_daily_note: row.get(13)?,
                daily_date: row.get(14)?,
                created_at: row.get(15)?,
                updated_at: row.get(16)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut notes = Vec::new();
    for row in rows {
        notes.push(row.map_err(|e| e.to_string())?);
    }
    Ok(notes)
}

#[tauri::command]
pub fn notes_update_note(app: AppHandle, input: UpdateNoteInput) -> Result<String, String> {
    let conn = db_connection(&app)?;

    // Build dynamic update
    let mut sets = Vec::new();
    let mut values: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(ref title) = input.title {
        sets.push("title = ?");
        values.push(Box::new(title.clone()));
    }
    if let Some(ref content) = input.content {
        sets.push("content = ?");
        values.push(Box::new(content.clone()));
    }
    if let Some(notebook_id) = input.notebook_id {
        sets.push("notebook_id = ?");
        values.push(Box::new(notebook_id));
    }
    if let Some(is_pinned) = input.is_pinned {
        sets.push("is_pinned = ?");
        values.push(Box::new(is_pinned));
    }
    if let Some(is_favorite) = input.is_favorite {
        sets.push("is_favorite = ?");
        values.push(Box::new(is_favorite));
    }
    if let Some(is_archived) = input.is_archived {
        sets.push("is_archived = ?");
        values.push(Box::new(is_archived));
    }
    if let Some(is_deleted) = input.is_deleted {
        sets.push("is_deleted = ?");
        values.push(Box::new(is_deleted));
        if is_deleted {
            sets.push("deleted_at = datetime('now')");
        } else {
            sets.push("deleted_at = NULL");
        }
    }
    if let Some(ref color) = input.color {
        sets.push("color = ?");
        values.push(Box::new(color.clone()));
    }
    if let Some(wc) = input.word_count {
        sets.push("word_count = ?");
        values.push(Box::new(wc));
    }
    if let Some(cc) = input.char_count {
        sets.push("char_count = ?");
        values.push(Box::new(cc));
    }
    if let Some(rt) = input.reading_time_minutes {
        sets.push("reading_time_minutes = ?");
        values.push(Box::new(rt));
    }

    sets.push("updated_at = datetime('now')");

    if sets.is_empty() {
        return Ok("Nothing to update".to_string());
    }

    let sql = format!("UPDATE notes SET {} WHERE id = ?", sets.join(", "));
    values.push(Box::new(input.id));

    let params_refs: Vec<&dyn rusqlite::types::ToSql> = values.iter().map(|v| v.as_ref()).collect();
    conn.execute(&sql, params_refs.as_slice())
        .map_err(|e| e.to_string())?;

    Ok("Note updated".to_string())
}

#[tauri::command]
pub fn notes_delete_note(app: AppHandle, id: i64) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute("DELETE FROM notes WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok("Note permanently deleted".to_string())
}

#[tauri::command]
pub fn notes_search_notes(app: AppHandle, query: String) -> Result<Vec<NoteItem>, String> {
    let conn = db_connection(&app)?;
    let pattern = format!("%{}%", query);
    let mut stmt = conn.prepare(
        "SELECT id, title, content, notebook_id, is_pinned, is_favorite, is_archived, is_deleted, deleted_at, color, word_count, char_count, reading_time_minutes, is_daily_note, daily_date, created_at, updated_at FROM notes WHERE is_deleted = 0 AND (title LIKE ?1 OR content LIKE ?1) ORDER BY updated_at DESC"
    ).map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![pattern], |row| {
            Ok(NoteItem {
                id: row.get(0)?,
                title: row.get(1)?,
                content: row.get(2)?,
                notebook_id: row.get(3)?,
                is_pinned: row.get(4)?,
                is_favorite: row.get(5)?,
                is_archived: row.get(6)?,
                is_deleted: row.get(7)?,
                deleted_at: row.get(8)?,
                color: row.get(9)?,
                word_count: row.get(10)?,
                char_count: row.get(11)?,
                reading_time_minutes: row.get(12)?,
                is_daily_note: row.get(13)?,
                daily_date: row.get(14)?,
                created_at: row.get(15)?,
                updated_at: row.get(16)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut notes = Vec::new();
    for row in rows {
        notes.push(row.map_err(|e| e.to_string())?);
    }
    Ok(notes)
}

// ─── Notebooks CRUD ──────────────────────────────────────────────────────────

#[tauri::command]
pub fn notes_create_notebook(
    app: AppHandle,
    input: CreateNotebookInput,
) -> Result<NotebookItem, String> {
    let conn = db_connection(&app)?;
    let color = input.color.unwrap_or_default();
    let icon = input.icon.unwrap_or_default();

    conn.execute(
        "INSERT INTO notebooks (name, parent_id, color, icon) VALUES (?1, ?2, ?3, ?4)",
        params![input.name, input.parent_id, color, icon],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    let mut stmt = conn.prepare(
        "SELECT id, name, parent_id, color, icon, sort_order, created_at FROM notebooks WHERE id = ?1"
    ).map_err(|e| e.to_string())?;

    let nb = stmt
        .query_row(params![id], |row| {
            Ok(NotebookItem {
                id: row.get(0)?,
                name: row.get(1)?,
                parent_id: row.get(2)?,
                color: row.get(3)?,
                icon: row.get(4)?,
                sort_order: row.get(5)?,
                created_at: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;

    Ok(nb)
}

#[tauri::command]
pub fn notes_get_notebooks(app: AppHandle) -> Result<Vec<NotebookItem>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare(
        "SELECT id, name, parent_id, color, icon, sort_order, created_at FROM notebooks ORDER BY sort_order ASC, name ASC"
    ).map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(NotebookItem {
                id: row.get(0)?,
                name: row.get(1)?,
                parent_id: row.get(2)?,
                color: row.get(3)?,
                icon: row.get(4)?,
                sort_order: row.get(5)?,
                created_at: row.get(6)?,
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
pub fn notes_update_notebook(app: AppHandle, input: UpdateNotebookInput) -> Result<String, String> {
    let conn = db_connection(&app)?;
    let mut sets = Vec::new();
    let mut values: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(ref name) = input.name {
        sets.push("name = ?");
        values.push(Box::new(name.clone()));
    }
    if let Some(parent_id) = input.parent_id {
        sets.push("parent_id = ?");
        values.push(Box::new(parent_id));
    }
    if let Some(ref color) = input.color {
        sets.push("color = ?");
        values.push(Box::new(color.clone()));
    }
    if let Some(ref icon) = input.icon {
        sets.push("icon = ?");
        values.push(Box::new(icon.clone()));
    }
    if let Some(sort_order) = input.sort_order {
        sets.push("sort_order = ?");
        values.push(Box::new(sort_order));
    }

    if sets.is_empty() {
        return Ok("Nothing to update".to_string());
    }

    let sql = format!("UPDATE notebooks SET {} WHERE id = ?", sets.join(", "));
    values.push(Box::new(input.id));
    let params_refs: Vec<&dyn rusqlite::types::ToSql> = values.iter().map(|v| v.as_ref()).collect();
    conn.execute(&sql, params_refs.as_slice())
        .map_err(|e| e.to_string())?;

    Ok("Notebook updated".to_string())
}

#[tauri::command]
pub fn notes_delete_notebook(app: AppHandle, id: i64) -> Result<String, String> {
    let conn = db_connection(&app)?;
    // Set notes in this notebook to null
    conn.execute(
        "UPDATE notes SET notebook_id = NULL WHERE notebook_id = ?1",
        params![id],
    )
    .map_err(|e| e.to_string())?;
    // Set child notebooks parent to null
    conn.execute(
        "UPDATE notebooks SET parent_id = NULL WHERE parent_id = ?1",
        params![id],
    )
    .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM notebooks WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok("Notebook deleted".to_string())
}

// ─── Tags CRUD ───────────────────────────────────────────────────────────────

#[tauri::command]
pub fn notes_create_tag(app: AppHandle, input: CreateTagInput) -> Result<TagItem, String> {
    let conn = db_connection(&app)?;
    let color = input.color.unwrap_or_default();

    conn.execute(
        "INSERT INTO tags (name, parent_id, color) VALUES (?1, ?2, ?3)",
        params![input.name, input.parent_id, color],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    Ok(TagItem {
        id,
        name: input.name,
        parent_id: input.parent_id,
        color,
    })
}

#[tauri::command]
pub fn notes_get_tags(app: AppHandle) -> Result<Vec<TagItem>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn
        .prepare("SELECT id, name, parent_id, color FROM tags ORDER BY name ASC")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(TagItem {
                id: row.get(0)?,
                name: row.get(1)?,
                parent_id: row.get(2)?,
                color: row.get(3)?,
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
pub fn notes_update_tag(app: AppHandle, input: UpdateTagInput) -> Result<String, String> {
    let conn = db_connection(&app)?;
    let mut sets = Vec::new();
    let mut values: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(ref name) = input.name {
        sets.push("name = ?");
        values.push(Box::new(name.clone()));
    }
    if let Some(parent_id) = input.parent_id {
        sets.push("parent_id = ?");
        values.push(Box::new(parent_id));
    }
    if let Some(ref color) = input.color {
        sets.push("color = ?");
        values.push(Box::new(color.clone()));
    }

    if sets.is_empty() {
        return Ok("Nothing to update".to_string());
    }

    let sql = format!("UPDATE tags SET {} WHERE id = ?", sets.join(", "));
    values.push(Box::new(input.id));
    let params_refs: Vec<&dyn rusqlite::types::ToSql> = values.iter().map(|v| v.as_ref()).collect();
    conn.execute(&sql, params_refs.as_slice())
        .map_err(|e| e.to_string())?;

    Ok("Tag updated".to_string())
}

#[tauri::command]
pub fn notes_delete_tag(app: AppHandle, id: i64) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute("DELETE FROM note_tags WHERE tag_id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM tags WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok("Tag deleted".to_string())
}

// ─── Note Tags (junction) ────────────────────────────────────────────────────

#[tauri::command]
pub fn notes_add_tag_to_note(app: AppHandle, note_id: i64, tag_id: i64) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute(
        "INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?1, ?2)",
        params![note_id, tag_id],
    )
    .map_err(|e| e.to_string())?;
    Ok("Tag added to note".to_string())
}

#[tauri::command]
pub fn notes_remove_tag_from_note(
    app: AppHandle,
    note_id: i64,
    tag_id: i64,
) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute(
        "DELETE FROM note_tags WHERE note_id = ?1 AND tag_id = ?2",
        params![note_id, tag_id],
    )
    .map_err(|e| e.to_string())?;
    Ok("Tag removed from note".to_string())
}

#[tauri::command]
pub fn notes_get_note_tags(app: AppHandle, note_id: i64) -> Result<Vec<TagItem>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare(
        "SELECT t.id, t.name, t.parent_id, t.color FROM tags t INNER JOIN note_tags nt ON t.id = nt.tag_id WHERE nt.note_id = ?1 ORDER BY t.name ASC"
    ).map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![note_id], |row| {
            Ok(TagItem {
                id: row.get(0)?,
                name: row.get(1)?,
                parent_id: row.get(2)?,
                color: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut items = Vec::new();
    for row in rows {
        items.push(row.map_err(|e| e.to_string())?);
    }
    Ok(items)
}

// ─── Note Links ──────────────────────────────────────────────────────────────

#[tauri::command]
pub fn notes_create_link(app: AppHandle, input: CreateNoteLinkInput) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute(
        "INSERT OR IGNORE INTO note_links (source_note_id, target_note_id) VALUES (?1, ?2)",
        params![input.source_note_id, input.target_note_id],
    )
    .map_err(|e| e.to_string())?;
    Ok("Link created".to_string())
}

#[tauri::command]
pub fn notes_get_links(app: AppHandle, note_id: i64) -> Result<Vec<NoteLinkItem>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare(
        "SELECT id, source_note_id, target_note_id, created_at FROM note_links WHERE source_note_id = ?1 OR target_note_id = ?1"
    ).map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![note_id], |row| {
            Ok(NoteLinkItem {
                id: row.get(0)?,
                source_note_id: row.get(1)?,
                target_note_id: row.get(2)?,
                created_at: row.get(3)?,
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
pub fn notes_delete_link(app: AppHandle, id: i64) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute("DELETE FROM note_links WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok("Link deleted".to_string())
}

#[tauri::command]
pub fn notes_get_backlinks(app: AppHandle, note_id: i64) -> Result<Vec<NoteItem>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare(
        "SELECT n.id, n.title, n.content, n.notebook_id, n.is_pinned, n.is_favorite, n.is_archived, n.is_deleted, n.deleted_at, n.color, n.word_count, n.char_count, n.reading_time_minutes, n.is_daily_note, n.daily_date, n.created_at, n.updated_at FROM notes n INNER JOIN note_links nl ON n.id = nl.source_note_id WHERE nl.target_note_id = ?1 AND n.is_deleted = 0"
    ).map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![note_id], |row| {
            Ok(NoteItem {
                id: row.get(0)?,
                title: row.get(1)?,
                content: row.get(2)?,
                notebook_id: row.get(3)?,
                is_pinned: row.get(4)?,
                is_favorite: row.get(5)?,
                is_archived: row.get(6)?,
                is_deleted: row.get(7)?,
                deleted_at: row.get(8)?,
                color: row.get(9)?,
                word_count: row.get(10)?,
                char_count: row.get(11)?,
                reading_time_minutes: row.get(12)?,
                is_daily_note: row.get(13)?,
                daily_date: row.get(14)?,
                created_at: row.get(15)?,
                updated_at: row.get(16)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut items = Vec::new();
    for row in rows {
        items.push(row.map_err(|e| e.to_string())?);
    }
    Ok(items)
}

// ─── Note Versions ───────────────────────────────────────────────────────────

#[tauri::command]
pub fn notes_create_version(
    app: AppHandle,
    input: CreateNoteVersionInput,
) -> Result<String, String> {
    let conn = db_connection(&app)?;
    let wc = input.word_count.unwrap_or(0);
    conn.execute(
        "INSERT INTO note_versions (note_id, title, content, word_count) VALUES (?1, ?2, ?3, ?4)",
        params![input.note_id, input.title, input.content, wc],
    )
    .map_err(|e| e.to_string())?;

    // Keep only last 50 versions per note
    conn.execute(
        "DELETE FROM note_versions WHERE note_id = ?1 AND id NOT IN (SELECT id FROM note_versions WHERE note_id = ?1 ORDER BY created_at DESC LIMIT 50)",
        params![input.note_id],
    ).map_err(|e| e.to_string())?;

    Ok("Version saved".to_string())
}

#[tauri::command]
pub fn notes_get_versions(app: AppHandle, note_id: i64) -> Result<Vec<NoteVersionItem>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare(
        "SELECT id, note_id, title, content, word_count, created_at FROM note_versions WHERE note_id = ?1 ORDER BY created_at DESC"
    ).map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![note_id], |row| {
            Ok(NoteVersionItem {
                id: row.get(0)?,
                note_id: row.get(1)?,
                title: row.get(2)?,
                content: row.get(3)?,
                word_count: row.get(4)?,
                created_at: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut items = Vec::new();
    for row in rows {
        items.push(row.map_err(|e| e.to_string())?);
    }
    Ok(items)
}

// ─── Templates CRUD ──────────────────────────────────────────────────────────

#[tauri::command]
pub fn notes_create_template(
    app: AppHandle,
    input: CreateNoteTemplateInput,
) -> Result<NoteTemplateItem, String> {
    let conn = db_connection(&app)?;
    let category = input.category.unwrap_or_else(|| "General".to_string());
    let icon = input.icon.unwrap_or_default();

    conn.execute(
        "INSERT INTO note_templates (name, category, content, icon) VALUES (?1, ?2, ?3, ?4)",
        params![input.name, category, input.content, icon],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    let mut stmt = conn.prepare(
        "SELECT id, name, category, content, icon, created_at FROM note_templates WHERE id = ?1"
    ).map_err(|e| e.to_string())?;

    let item = stmt
        .query_row(params![id], |row| {
            Ok(NoteTemplateItem {
                id: row.get(0)?,
                name: row.get(1)?,
                category: row.get(2)?,
                content: row.get(3)?,
                icon: row.get(4)?,
                created_at: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?;

    Ok(item)
}

#[tauri::command]
pub fn notes_get_templates(app: AppHandle) -> Result<Vec<NoteTemplateItem>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare(
        "SELECT id, name, category, content, icon, created_at FROM note_templates ORDER BY category ASC, name ASC"
    ).map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(NoteTemplateItem {
                id: row.get(0)?,
                name: row.get(1)?,
                category: row.get(2)?,
                content: row.get(3)?,
                icon: row.get(4)?,
                created_at: row.get(5)?,
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
pub fn notes_delete_template(app: AppHandle, id: i64) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute("DELETE FROM note_templates WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok("Template deleted".to_string())
}

// ─── All Links (for graph view) ──────────────────────────────────────────────

#[tauri::command]
pub fn notes_get_all_links(app: AppHandle) -> Result<Vec<NoteLinkItem>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare(
        "SELECT nl.id, nl.source_note_id, nl.target_note_id, nl.created_at FROM note_links nl INNER JOIN notes n1 ON nl.source_note_id = n1.id INNER JOIN notes n2 ON nl.target_note_id = n2.id WHERE n1.is_deleted = 0 AND n2.is_deleted = 0"
    ).map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(NoteLinkItem {
                id: row.get(0)?,
                source_note_id: row.get(1)?,
                target_note_id: row.get(2)?,
                created_at: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut items = Vec::new();
    for row in rows {
        items.push(row.map_err(|e| e.to_string())?);
    }
    Ok(items)
}
