use rusqlite::{params, Connection};
use serde::Deserialize;
use tauri::AppHandle;

use super::utils::storage_root;

#[derive(serde::Serialize, Deserialize)]
pub struct AccountItem {
    pub id: i64,
    pub name: String,
    pub type_: String,
    pub balance: f64,
    pub currency: String,
}

#[derive(Deserialize)]
pub struct CreateAccountInput {
    pub name: String,
    pub type_: String,
    pub initial_balance: f64,
    pub currency: String,
}

#[derive(serde::Serialize, Deserialize)]
pub struct TransactionItem {
    pub id: i64,
    pub account_id: Option<i64>,
    pub amount: f64,
    pub type_: String,
    pub category: String,
    pub description: String,
    pub date: String,
    pub status: String,
    pub notes: String,
    pub receipt_path: String,
    pub is_recurring: bool,
    pub created_at: String,
}

#[derive(Deserialize)]
pub struct CreateTransactionInput {
    pub account_id: Option<i64>,
    pub amount: f64,
    pub type_: String,
    pub category: String,
    pub description: Option<String>,
    pub date: String,
    pub status: String,
    pub notes: Option<String>,
    pub receipt_path: Option<String>,
    pub is_recurring: bool,
}

// Batch 2 Structs
#[derive(serde::Serialize, Deserialize)]
pub struct BudgetItem {
    pub id: i64,
    pub category: String,
    pub limit_amount: f64,
    pub period: String,
}
#[derive(Deserialize)]
pub struct CreateBudgetInput {
    pub category: String,
    pub limit_amount: f64,
    pub period: String,
}

#[derive(serde::Serialize, Deserialize)]
pub struct GoalItem {
    pub id: i64,
    pub name: String,
    pub target_amount: f64,
    pub current_amount: f64,
    pub deadline: String,
    pub auto_allocate_percent: f64,
}
#[derive(Deserialize)]
pub struct CreateGoalInput {
    pub name: String,
    pub target_amount: f64,
    pub current_amount: f64,
    pub deadline: String,
    pub auto_allocate_percent: f64,
}

#[derive(serde::Serialize, Deserialize)]
pub struct SubscriptionItem {
    pub id: i64,
    pub name: String,
    pub amount: f64,
    pub billing_cycle: String,
    pub next_date: String,
}
#[derive(Deserialize)]
pub struct CreateSubscriptionInput {
    pub name: String,
    pub amount: f64,
    pub billing_cycle: String,
    pub next_date: String,
}

fn db_connection(app: &AppHandle) -> Result<Connection, String> {
    let base = storage_root(app)?;
    let db_path = base.join("finance_v2.db");

    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type_ TEXT NOT NULL,
            balance REAL NOT NULL,
            currency TEXT NOT NULL
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id INTEGER,
            amount REAL NOT NULL,
            type_ TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            date TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'confirmed',
            notes TEXT NOT NULL DEFAULT '',
            receipt_path TEXT NOT NULL DEFAULT '',
            is_recurring BOOLEAN NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY(account_id) REFERENCES accounts(id)
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS budgets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            limit_amount REAL NOT NULL,
            period TEXT NOT NULL
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            target_amount REAL NOT NULL,
            current_amount REAL NOT NULL,
            deadline TEXT NOT NULL,
            auto_allocate_percent REAL NOT NULL
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            amount REAL NOT NULL,
            billing_cycle TEXT NOT NULL,
            next_date TEXT NOT NULL
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS debts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            amount REAL NOT NULL,
            type_ TEXT NOT NULL,
            due_date TEXT NOT NULL,
            paid_amount REAL NOT NULL DEFAULT 0
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_name TEXT NOT NULL,
            total_amount REAL NOT NULL,
            status TEXT NOT NULL,
            due_date TEXT NOT NULL,
            items_json TEXT NOT NULL
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    Ok(conn)
}

#[tauri::command]
pub fn create_account(app: AppHandle, input: CreateAccountInput) -> Result<String, String> {
    let conn = db_connection(&app)?;

    conn.execute(
        "INSERT INTO accounts (name, type_, balance, currency) VALUES (?1, ?2, ?3, ?4)",
        params![input.name, input.type_, input.initial_balance, input.currency],
    )
    .map_err(|e| e.to_string())?;

    Ok("Account created successfully".to_string())
}

#[tauri::command]
pub fn get_accounts(app: AppHandle) -> Result<Vec<AccountItem>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn
        .prepare("SELECT id, name, type_, balance, currency FROM accounts")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(AccountItem {
                id: row.get(0)?,
                name: row.get(1)?,
                type_: row.get(2)?,
                balance: row.get(3)?,
                currency: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut accounts = Vec::new();
    for row in rows {
        accounts.push(row.map_err(|e| e.to_string())?);
    }

    Ok(accounts)
}

#[tauri::command]
pub fn create_transaction(app: AppHandle, input: CreateTransactionInput) -> Result<String, String> {
    let mut conn = db_connection(&app)?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let description = input.description.unwrap_or_default();
    let notes = input.notes.unwrap_or_default();
    let receipt_path = input.receipt_path.unwrap_or_default();

    tx.execute(
        "INSERT INTO transactions (account_id, amount, type_, category, description, date, status, notes, receipt_path, is_recurring) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        params![
            input.account_id, input.amount, input.type_, input.category, 
            description, input.date, input.status, notes, receipt_path, input.is_recurring
        ],
    )
    .map_err(|e| e.to_string())?;

    // Update account balance
    if let Some(acc_id) = input.account_id {
        if input.type_ == "income" {
            tx.execute("UPDATE accounts SET balance = balance + ?1 WHERE id = ?2", params![input.amount, acc_id])
                .map_err(|e| e.to_string())?;
        } else if input.type_ == "expense" {
            tx.execute("UPDATE accounts SET balance = balance - ?1 WHERE id = ?2", params![input.amount, acc_id])
                .map_err(|e| e.to_string())?;
        }
    }

    tx.commit().map_err(|e| e.to_string())?;

    Ok("Transaction created successfully".to_string())
}

#[tauri::command]
pub fn get_transactions(app: AppHandle) -> Result<Vec<TransactionItem>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn
        .prepare(
            "SELECT id, account_id, amount, type_, category, description, date, status, notes, receipt_path, is_recurring, created_at FROM transactions ORDER BY date DESC, id DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(TransactionItem {
                id: row.get(0)?,
                account_id: row.get(1)?,
                amount: row.get(2)?,
                type_: row.get(3)?,
                category: row.get(4)?,
                description: row.get(5)?,
                date: row.get(6)?,
                status: row.get(7)?,
                notes: row.get(8)?,
                receipt_path: row.get(9)?,
                is_recurring: row.get(10)?,
                created_at: row.get(11)?,
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
    let mut conn = db_connection(&app)?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let tx_data: Option<(Option<i64>, f64, String)> = {
        let mut stmt = tx.prepare("SELECT account_id, amount, type_ FROM transactions WHERE id = ?1").map_err(|e| e.to_string())?;
        let mut rows = stmt.query(params![id]).map_err(|e| e.to_string())?;

        if let Some(row) = rows.next().map_err(|e| e.to_string())? {
            let account_id: Option<i64> = row.get(0).map_err(|e| e.to_string())?;
            let amount: f64 = row.get(1).map_err(|e| e.to_string())?;
            let type_: String = row.get(2).map_err(|e| e.to_string())?;
            Some((account_id, amount, type_))
        } else {
            None
        }
    };

    if let Some((account_id, amount, type_)) = tx_data {
        if let Some(acc_id) = account_id {
            if type_ == "income" {
                tx.execute("UPDATE accounts SET balance = balance - ?1 WHERE id = ?2", params![amount, acc_id]).map_err(|e| e.to_string())?;
            } else if type_ == "expense" {
                tx.execute("UPDATE accounts SET balance = balance + ?1 WHERE id = ?2", params![amount, acc_id]).map_err(|e| e.to_string())?;
            }
        }
    }

    tx.execute("DELETE FROM transactions WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;

    Ok("Transaction deleted successfully".to_string())
}

// Batch 2 Commands
#[tauri::command]
pub fn create_budget(app: AppHandle, input: CreateBudgetInput) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute(
        "INSERT INTO budgets (category, limit_amount, period) VALUES (?1, ?2, ?3)",
        params![input.category, input.limit_amount, input.period],
    ).map_err(|e| e.to_string())?;
    Ok("Budget created".to_string())
}

#[tauri::command]
pub fn get_budgets(app: AppHandle) -> Result<Vec<BudgetItem>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare("SELECT id, category, limit_amount, period FROM budgets").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(BudgetItem {
            id: row.get(0)?,
            category: row.get(1)?,
            limit_amount: row.get(2)?,
            period: row.get(3)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut budgets = Vec::new();
    for row in rows {
        budgets.push(row.map_err(|e| e.to_string())?);
    }
    Ok(budgets)
}

#[tauri::command]
pub fn create_goal(app: AppHandle, input: CreateGoalInput) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute(
        "INSERT INTO goals (name, target_amount, current_amount, deadline, auto_allocate_percent) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![input.name, input.target_amount, input.current_amount, input.deadline, input.auto_allocate_percent],
    ).map_err(|e| e.to_string())?;
    Ok("Goal created".to_string())
}

#[tauri::command]
pub fn get_goals(app: AppHandle) -> Result<Vec<GoalItem>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare("SELECT id, name, target_amount, current_amount, deadline, auto_allocate_percent FROM goals").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(GoalItem {
            id: row.get(0)?,
            name: row.get(1)?,
            target_amount: row.get(2)?,
            current_amount: row.get(3)?,
            deadline: row.get(4)?,
            auto_allocate_percent: row.get(5)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut goals = Vec::new();
    for row in rows {
        goals.push(row.map_err(|e| e.to_string())?);
    }
    Ok(goals)
}

#[tauri::command]
pub fn create_subscription(app: AppHandle, input: CreateSubscriptionInput) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute(
        "INSERT INTO subscriptions (name, amount, billing_cycle, next_date) VALUES (?1, ?2, ?3, ?4)",
        params![input.name, input.amount, input.billing_cycle, input.next_date],
    ).map_err(|e| e.to_string())?;
    Ok("Subscription created".to_string())
}

#[tauri::command]
pub fn get_subscriptions(app: AppHandle) -> Result<Vec<SubscriptionItem>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare("SELECT id, name, amount, billing_cycle, next_date FROM subscriptions").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(SubscriptionItem {
            id: row.get(0)?,
            name: row.get(1)?,
            amount: row.get(2)?,
            billing_cycle: row.get(3)?,
            next_date: row.get(4)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut subs = Vec::new();
    for row in rows {
        subs.push(row.map_err(|e| e.to_string())?);
    }
    Ok(subs)
}

// Batch 3 Structs & Commands
#[derive(serde::Serialize, Deserialize)]
pub struct DebtItem {
    pub id: i64,
    pub name: String,
    pub amount: f64,
    pub type_: String,
    pub due_date: String,
    pub paid_amount: f64,
}

#[derive(Deserialize)]
pub struct CreateDebtInput {
    pub name: String,
    pub amount: f64,
    pub type_: String,
    pub due_date: String,
}

#[derive(serde::Serialize, Deserialize)]
pub struct InvoiceItem {
    pub id: i64,
    pub client_name: String,
    pub total_amount: f64,
    pub status: String,
    pub due_date: String,
    pub items_json: String,
}

#[derive(Deserialize)]
pub struct CreateInvoiceInput {
    pub client_name: String,
    pub total_amount: f64,
    pub status: String,
    pub due_date: String,
    pub items_json: String,
}

#[tauri::command]
pub fn create_debt(app: AppHandle, input: CreateDebtInput) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute(
        "INSERT INTO debts (name, amount, type_, due_date) VALUES (?1, ?2, ?3, ?4)",
        params![input.name, input.amount, input.type_, input.due_date],
    ).map_err(|e| e.to_string())?;
    Ok("Debt created".to_string())
}

#[tauri::command]
pub fn get_debts(app: AppHandle) -> Result<Vec<DebtItem>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare("SELECT id, name, amount, type_, due_date, paid_amount FROM debts").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(DebtItem {
            id: row.get(0)?,
            name: row.get(1)?,
            amount: row.get(2)?,
            type_: row.get(3)?,
            due_date: row.get(4)?,
            paid_amount: row.get(5)?,
        })
    }).map_err(|e| e.to_string())?;
    
    let mut debts = Vec::new();
    for row in rows {
        debts.push(row.map_err(|e| e.to_string())?);
    }
    Ok(debts)
}

#[tauri::command]
pub fn create_invoice(app: AppHandle, input: CreateInvoiceInput) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute(
        "INSERT INTO invoices (client_name, total_amount, status, due_date, items_json) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![input.client_name, input.total_amount, input.status, input.due_date, input.items_json],
    ).map_err(|e| e.to_string())?;
    Ok("Invoice created".to_string())
}

#[tauri::command]
pub fn get_invoices(app: AppHandle) -> Result<Vec<InvoiceItem>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare("SELECT id, client_name, total_amount, status, due_date, items_json FROM invoices").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(InvoiceItem {
            id: row.get(0)?,
            client_name: row.get(1)?,
            total_amount: row.get(2)?,
            status: row.get(3)?,
            due_date: row.get(4)?,
            items_json: row.get(5)?,
        })
    }).map_err(|e| e.to_string())?;
    
    let mut invs = Vec::new();
    for row in rows {
        invs.push(row.map_err(|e| e.to_string())?);
    }
    Ok(invs)
}
