use rusqlite::{params, Connection};
use serde::Deserialize;
use tauri::AppHandle;

use super::utils::storage_root;

#[derive(serde::Serialize, Deserialize)]
pub struct TransactionItem {
    pub id: i64,
    pub amount: f64,
    pub type_: String,
    pub category: String,
    pub description: String,
    pub date: String,
    pub created_at: String,
}

#[derive(Deserialize)]
pub struct CreateTransactionInput {
    pub amount: f64,
    pub type_: String,
    pub category: String,
    pub description: Option<String>,
    pub date: String,
}

fn db_connection(app: &AppHandle) -> Result<Connection, String> {
    let base = storage_root(app)?;
    let db_path = base.join("finance.db");

    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL NOT NULL,
            type_ TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            date TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    Ok(conn)
}

#[tauri::command]
pub fn create_transaction(app: AppHandle, input: CreateTransactionInput) -> Result<String, String> {
    let conn = db_connection(&app)?;
    let description = input.description.unwrap_or_default();

    conn.execute(
        "INSERT INTO transactions (amount, type_, category, description, date) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![input.amount, input.type_, input.category, description, input.date],
    )
    .map_err(|e| e.to_string())?;

    Ok("Transaction created successfully".to_string())
}

#[tauri::command]
pub fn get_transactions(app: AppHandle) -> Result<Vec<TransactionItem>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn
        .prepare(
            "SELECT id, amount, type_, category, description, date, created_at FROM transactions ORDER BY date DESC, id DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(TransactionItem {
                id: row.get(0)?,
                amount: row.get(1)?,
                type_: row.get(2)?,
                category: row.get(3)?,
                description: row.get(4)?,
                date: row.get(5)?,
                created_at: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut transactions = Vec::new();
    for row in rows {
        transactions.push(row.map_err(|e| e.to_string())?);
    }

    Ok(transactions)
}

#[tauri::command]
pub fn delete_transaction(app: AppHandle, id: i64) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute("DELETE FROM transactions WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok("Transaction deleted successfully".to_string())
}
