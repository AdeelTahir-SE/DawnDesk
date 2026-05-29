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

    conn.execute(
        "CREATE TABLE IF NOT EXISTS chart_of_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT NOT NULL,
            name TEXT NOT NULL,
            account_type TEXT NOT NULL,
            balance REAL NOT NULL
        )",
        [],
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS journal_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            reference TEXT NOT NULL,
            description TEXT NOT NULL,
            total_debit REAL NOT NULL,
            total_credit REAL NOT NULL,
            status TEXT NOT NULL,
            lines_json TEXT NOT NULL
        )",
        [],
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS vendor_bills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vendor_name TEXT NOT NULL,
            bill_number TEXT NOT NULL,
            date TEXT NOT NULL,
            due_date TEXT NOT NULL,
            total_amount REAL NOT NULL,
            status TEXT NOT NULL,
            items_json TEXT NOT NULL
        )",
        [],
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS fixed_assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            purchase_date TEXT NOT NULL,
            purchase_price REAL NOT NULL,
            useful_life_years INTEGER NOT NULL,
            salvage_value REAL NOT NULL,
            status TEXT NOT NULL
        )",
        [],
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS purchase_orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vendor_name TEXT NOT NULL,
            date TEXT NOT NULL,
            total_amount REAL NOT NULL,
            status TEXT NOT NULL,
            items_json TEXT NOT NULL
        )",
        [],
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS inventory_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sku TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            unit_cost REAL NOT NULL,
            unit_price REAL NOT NULL
        )",
        [],
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS tax_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT NOT NULL,
            description TEXT NOT NULL,
            rate_percent REAL NOT NULL,
            active BOOLEAN NOT NULL
        )",
        [],
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            user TEXT NOT NULL,
            action TEXT NOT NULL,
            description TEXT NOT NULL
        )",
        [],
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS compliance_roles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT NOT NULL,
            permissions_json TEXT NOT NULL,
            is_system BOOLEAN NOT NULL DEFAULT 1
        )",
        [],
    ).map_err(|e| e.to_string())?;

    let role_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM compliance_roles", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    if role_count == 0 {
        let default_roles = [
            (
                "Controller",
                "Owns the general ledger, period close, and financial reporting workflow.",
                r#"["chart_of_accounts:manage","journal_entries:approve","period_close:manage","reports:export"]"#,
            ),
            (
                "CFO",
                "Reviews strategic finance outputs, treasury position, and board reporting.",
                r#"["dashboard:view","cash:view","reports:export","compliance:evidence_export"]"#,
            ),
            (
                "AP Clerk",
                "Creates vendor bills, purchase orders, and payment preparation records.",
                r#"["vendors:manage","purchase_orders:create","vendor_bills:create","vendor_bills:view"]"#,
            ),
            (
                "Auditor",
                "Read-only reviewer for audit logs, tax records, close tasks, and evidence exports.",
                r#"["audit_logs:view","tax_codes:view","period_close:view","compliance:evidence_export"]"#,
            ),
        ];

        for (name, description, permissions_json) in default_roles {
            conn.execute(
                "INSERT INTO compliance_roles (name, description, permissions_json, is_system) VALUES (?1, ?2, ?3, 1)",
                params![name, description, permissions_json],
            )
            .map_err(|e| e.to_string())?;
        }
    }

    conn.execute(
        "CREATE TABLE IF NOT EXISTS period_closes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            period TEXT NOT NULL,
            task TEXT NOT NULL,
            assigned_to TEXT NOT NULL,
            status TEXT NOT NULL
        )",
        [],
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS exchange_rates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pair TEXT NOT NULL,
            rate REAL NOT NULL,
            date TEXT NOT NULL
        )",
        [],
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS ar_recurring_billing (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_name TEXT NOT NULL,
            plan_name TEXT NOT NULL,
            amount REAL NOT NULL,
            next_billing_date TEXT NOT NULL,
            status TEXT NOT NULL
        )",
        [],
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS ar_dunning_campaigns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            trigger_days_overdue INTEGER NOT NULL,
            email_subject TEXT NOT NULL,
            is_active BOOLEAN NOT NULL
        )",
        [],
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS ar_revrec_schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_name TEXT NOT NULL,
            total_amount REAL NOT NULL,
            recognized_amount REAL NOT NULL,
            deferred_amount REAL NOT NULL,
            months INTEGER NOT NULL
        )",
        [],
    ).map_err(|e| e.to_string())?;

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

// ERP Phase 1 Structs & Commands
#[derive(serde::Serialize, Deserialize)]
pub struct ChartOfAccount {
    pub id: i64,
    pub code: String,
    pub name: String,
    pub account_type: String,
    pub balance: f64,
}
#[derive(Deserialize)]
pub struct CreateChartOfAccountInput {
    pub code: String,
    pub name: String,
    pub account_type: String,
    pub initial_balance: f64,
}

#[tauri::command]
pub fn create_chart_of_account(app: AppHandle, input: CreateChartOfAccountInput) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute(
        "INSERT INTO chart_of_accounts (code, name, account_type, balance) VALUES (?1, ?2, ?3, ?4)",
        params![input.code, input.name, input.account_type, input.initial_balance],
    ).map_err(|e| e.to_string())?;
    Ok("Account created".to_string())
}

#[tauri::command]
pub fn get_chart_of_accounts(app: AppHandle) -> Result<Vec<ChartOfAccount>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare("SELECT id, code, name, account_type, balance FROM chart_of_accounts ORDER BY code ASC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(ChartOfAccount {
            id: row.get(0)?,
            code: row.get(1)?,
            name: row.get(2)?,
            account_type: row.get(3)?,
            balance: row.get(4)?,
        })
    }).map_err(|e| e.to_string())?;
    
    let mut items = Vec::new();
    for row in rows {
        items.push(row.map_err(|e| e.to_string())?);
    }
    Ok(items)
}

#[derive(serde::Serialize, Deserialize)]
pub struct JournalEntry {
    pub id: i64,
    pub date: String,
    pub reference: String,
    pub description: String,
    pub total_debit: f64,
    pub total_credit: f64,
    pub status: String,
    pub lines_json: String,
}
#[derive(Deserialize)]
pub struct CreateJournalEntryInput {
    pub date: String,
    pub reference: String,
    pub description: String,
    pub total_debit: f64,
    pub total_credit: f64,
    pub status: String,
    pub lines_json: String,
}

#[tauri::command]
pub fn create_journal_entry(app: AppHandle, input: CreateJournalEntryInput) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute(
        "INSERT INTO journal_entries (date, reference, description, total_debit, total_credit, status, lines_json) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![input.date, input.reference, input.description, input.total_debit, input.total_credit, input.status, input.lines_json],
    ).map_err(|e| e.to_string())?;
    Ok("Journal entry created".to_string())
}

#[tauri::command]
pub fn get_journal_entries(app: AppHandle) -> Result<Vec<JournalEntry>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare("SELECT id, date, reference, description, total_debit, total_credit, status, lines_json FROM journal_entries ORDER BY date DESC, id DESC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(JournalEntry {
            id: row.get(0)?,
            date: row.get(1)?,
            reference: row.get(2)?,
            description: row.get(3)?,
            total_debit: row.get(4)?,
            total_credit: row.get(5)?,
            status: row.get(6)?,
            lines_json: row.get(7)?,
        })
    }).map_err(|e| e.to_string())?;
    
    let mut items = Vec::new();
    for row in rows {
        items.push(row.map_err(|e| e.to_string())?);
    }
    Ok(items)
}

#[derive(serde::Serialize, Deserialize)]
pub struct VendorBill {
    pub id: i64,
    pub vendor_name: String,
    pub bill_number: String,
    pub date: String,
    pub due_date: String,
    pub total_amount: f64,
    pub status: String,
    pub items_json: String,
}
#[derive(Deserialize)]
pub struct CreateVendorBillInput {
    pub vendor_name: String,
    pub bill_number: String,
    pub date: String,
    pub due_date: String,
    pub total_amount: f64,
    pub status: String,
    pub items_json: String,
}

#[tauri::command]
pub fn create_vendor_bill(app: AppHandle, input: CreateVendorBillInput) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute(
        "INSERT INTO vendor_bills (vendor_name, bill_number, date, due_date, total_amount, status, items_json) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![input.vendor_name, input.bill_number, input.date, input.due_date, input.total_amount, input.status, input.items_json],
    ).map_err(|e| e.to_string())?;
    Ok("Vendor bill created".to_string())
}

#[tauri::command]
pub fn get_vendor_bills(app: AppHandle) -> Result<Vec<VendorBill>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare("SELECT id, vendor_name, bill_number, date, due_date, total_amount, status, items_json FROM vendor_bills ORDER BY date DESC, id DESC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(VendorBill {
            id: row.get(0)?,
            vendor_name: row.get(1)?,
            bill_number: row.get(2)?,
            date: row.get(3)?,
            due_date: row.get(4)?,
            total_amount: row.get(5)?,
            status: row.get(6)?,
            items_json: row.get(7)?,
        })
    }).map_err(|e| e.to_string())?;
    
    let mut items = Vec::new();
    for row in rows {
        items.push(row.map_err(|e| e.to_string())?);
    }
    Ok(items)
}

// Phases 2, 3, 4 Structs & Commands

#[derive(serde::Serialize, Deserialize)]
pub struct FixedAsset {
    pub id: i64,
    pub name: String,
    pub description: String,
    pub purchase_date: String,
    pub purchase_price: f64,
    pub useful_life_years: i64,
    pub salvage_value: f64,
    pub status: String,
}
#[derive(Deserialize)]
pub struct CreateFixedAssetInput {
    pub name: String,
    pub description: String,
    pub purchase_date: String,
    pub purchase_price: f64,
    pub useful_life_years: i64,
    pub salvage_value: f64,
    pub status: String,
}

#[tauri::command]
pub fn create_fixed_asset(app: AppHandle, input: CreateFixedAssetInput) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute(
        "INSERT INTO fixed_assets (name, description, purchase_date, purchase_price, useful_life_years, salvage_value, status) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![input.name, input.description, input.purchase_date, input.purchase_price, input.useful_life_years, input.salvage_value, input.status],
    ).map_err(|e| e.to_string())?;
    Ok("Asset created".to_string())
}

#[tauri::command]
pub fn get_fixed_assets(app: AppHandle) -> Result<Vec<FixedAsset>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare("SELECT id, name, description, purchase_date, purchase_price, useful_life_years, salvage_value, status FROM fixed_assets ORDER BY id DESC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(FixedAsset {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            purchase_date: row.get(3)?,
            purchase_price: row.get(4)?,
            useful_life_years: row.get(5)?,
            salvage_value: row.get(6)?,
            status: row.get(7)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut items = Vec::new();
    for row in rows { items.push(row.map_err(|e| e.to_string())?); }
    Ok(items)
}

#[derive(serde::Serialize, Deserialize)]
pub struct PurchaseOrder {
    pub id: i64,
    pub vendor_name: String,
    pub date: String,
    pub total_amount: f64,
    pub status: String,
    pub items_json: String,
}
#[derive(Deserialize)]
pub struct CreatePurchaseOrderInput {
    pub vendor_name: String,
    pub date: String,
    pub total_amount: f64,
    pub status: String,
    pub items_json: String,
}

#[tauri::command]
pub fn create_purchase_order(app: AppHandle, input: CreatePurchaseOrderInput) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute(
        "INSERT INTO purchase_orders (vendor_name, date, total_amount, status, items_json) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![input.vendor_name, input.date, input.total_amount, input.status, input.items_json],
    ).map_err(|e| e.to_string())?;
    Ok("PO created".to_string())
}

#[tauri::command]
pub fn get_purchase_orders(app: AppHandle) -> Result<Vec<PurchaseOrder>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare("SELECT id, vendor_name, date, total_amount, status, items_json FROM purchase_orders ORDER BY id DESC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(PurchaseOrder {
            id: row.get(0)?,
            vendor_name: row.get(1)?,
            date: row.get(2)?,
            total_amount: row.get(3)?,
            status: row.get(4)?,
            items_json: row.get(5)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut items = Vec::new();
    for row in rows { items.push(row.map_err(|e| e.to_string())?); }
    Ok(items)
}

#[derive(serde::Serialize, Deserialize)]
pub struct InventoryItem {
    pub id: i64,
    pub sku: String,
    pub name: String,
    pub description: String,
    pub quantity: i64,
    pub unit_cost: f64,
    pub unit_price: f64,
}
#[derive(Deserialize)]
pub struct CreateInventoryItemInput {
    pub sku: String,
    pub name: String,
    pub description: String,
    pub quantity: i64,
    pub unit_cost: f64,
    pub unit_price: f64,
}

#[tauri::command]
pub fn create_inventory_item(app: AppHandle, input: CreateInventoryItemInput) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute(
        "INSERT INTO inventory_items (sku, name, description, quantity, unit_cost, unit_price) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![input.sku, input.name, input.description, input.quantity, input.unit_cost, input.unit_price],
    ).map_err(|e| e.to_string())?;
    Ok("Item created".to_string())
}

#[tauri::command]
pub fn get_inventory_items(app: AppHandle) -> Result<Vec<InventoryItem>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare("SELECT id, sku, name, description, quantity, unit_cost, unit_price FROM inventory_items ORDER BY name ASC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(InventoryItem {
            id: row.get(0)?,
            sku: row.get(1)?,
            name: row.get(2)?,
            description: row.get(3)?,
            quantity: row.get(4)?,
            unit_cost: row.get(5)?,
            unit_price: row.get(6)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut items = Vec::new();
    for row in rows { items.push(row.map_err(|e| e.to_string())?); }
    Ok(items)
}

#[derive(serde::Serialize, Deserialize)]
pub struct TaxCode {
    pub id: i64,
    pub code: String,
    pub description: String,
    pub rate_percent: f64,
    pub active: bool,
}
#[derive(Deserialize)]
pub struct CreateTaxCodeInput {
    pub code: String,
    pub description: String,
    pub rate_percent: f64,
    pub active: bool,
}

#[tauri::command]
pub fn create_tax_code(app: AppHandle, input: CreateTaxCodeInput) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute(
        "INSERT INTO tax_codes (code, description, rate_percent, active) VALUES (?1, ?2, ?3, ?4)",
        params![input.code, input.description, input.rate_percent, input.active],
    ).map_err(|e| e.to_string())?;
    Ok("Tax code created".to_string())
}

#[tauri::command]
pub fn get_tax_codes(app: AppHandle) -> Result<Vec<TaxCode>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare("SELECT id, code, description, rate_percent, active FROM tax_codes").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(TaxCode {
            id: row.get(0)?,
            code: row.get(1)?,
            description: row.get(2)?,
            rate_percent: row.get(3)?,
            active: row.get(4)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut items = Vec::new();
    for row in rows { items.push(row.map_err(|e| e.to_string())?); }
    Ok(items)
}

#[derive(serde::Serialize, Deserialize)]
pub struct AuditLog {
    pub id: i64,
    pub timestamp: String,
    pub user: String,
    pub action: String,
    pub description: String,
}
#[derive(Deserialize)]
pub struct CreateAuditLogInput {
    pub timestamp: String,
    pub user: String,
    pub action: String,
    pub description: String,
}

#[derive(serde::Serialize, Deserialize)]
pub struct ComplianceRole {
    pub id: i64,
    pub name: String,
    pub description: String,
    pub permissions_json: String,
    pub is_system: bool,
}

#[derive(serde::Serialize)]
pub struct ComplianceEvidenceSummary {
    pub audit_log_count: usize,
    pub role_count: usize,
    pub tax_code_count: usize,
    pub open_period_close_count: usize,
}

#[derive(serde::Serialize)]
pub struct ComplianceEvidencePackage {
    pub generated_at: String,
    pub summary: ComplianceEvidenceSummary,
    pub audit_logs: Vec<AuditLog>,
    pub roles: Vec<ComplianceRole>,
    pub tax_codes: Vec<TaxCode>,
    pub period_closes: Vec<PeriodClose>,
}

#[tauri::command]
pub fn create_audit_log(app: AppHandle, input: CreateAuditLogInput) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute(
        "INSERT INTO audit_logs (timestamp, user, action, description) VALUES (?1, ?2, ?3, ?4)",
        params![input.timestamp, input.user, input.action, input.description],
    ).map_err(|e| e.to_string())?;
    Ok("Audit log created".to_string())
}

#[tauri::command]
pub fn get_audit_logs(app: AppHandle) -> Result<Vec<AuditLog>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare("SELECT id, timestamp, user, action, description FROM audit_logs ORDER BY id DESC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(AuditLog {
            id: row.get(0)?,
            timestamp: row.get(1)?,
            user: row.get(2)?,
            action: row.get(3)?,
            description: row.get(4)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut items = Vec::new();
    for row in rows { items.push(row.map_err(|e| e.to_string())?); }
    Ok(items)
}

#[tauri::command]
pub fn get_compliance_roles(app: AppHandle) -> Result<Vec<ComplianceRole>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn
        .prepare("SELECT id, name, description, permissions_json, is_system FROM compliance_roles ORDER BY name ASC")
        .map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(ComplianceRole {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            permissions_json: row.get(3)?,
            is_system: row.get(4)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut roles = Vec::new();
    for row in rows { roles.push(row.map_err(|e| e.to_string())?); }
    Ok(roles)
}

#[tauri::command]
pub fn get_compliance_evidence(app: AppHandle) -> Result<ComplianceEvidencePackage, String> {
    let audit_logs = get_audit_logs(app.clone())?;
    let roles = get_compliance_roles(app.clone())?;
    let tax_codes = get_tax_codes(app.clone())?;
    let period_closes = get_period_closes(app)?;
    let open_period_close_count = period_closes
        .iter()
        .filter(|task| task.status.to_lowercase() != "closed" && task.status.to_lowercase() != "complete")
        .count();

    Ok(ComplianceEvidencePackage {
        generated_at: chrono_like_timestamp(),
        summary: ComplianceEvidenceSummary {
            audit_log_count: audit_logs.len(),
            role_count: roles.len(),
            tax_code_count: tax_codes.len(),
            open_period_close_count,
        },
        audit_logs,
        roles,
        tax_codes,
        period_closes,
    })
}

fn chrono_like_timestamp() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};

    let seconds = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs())
        .unwrap_or_default();
    format!("unix:{seconds}")
}

#[derive(serde::Serialize, Deserialize)]
pub struct PeriodClose {
    pub id: i64,
    pub period: String,
    pub task: String,
    pub assigned_to: String,
    pub status: String,
}
#[derive(Deserialize)]
pub struct CreatePeriodCloseInput {
    pub period: String,
    pub task: String,
    pub assigned_to: String,
    pub status: String,
}

#[tauri::command]
pub fn create_period_close(app: AppHandle, input: CreatePeriodCloseInput) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute(
        "INSERT INTO period_closes (period, task, assigned_to, status) VALUES (?1, ?2, ?3, ?4)",
        params![input.period, input.task, input.assigned_to, input.status],
    ).map_err(|e| e.to_string())?;
    Ok("Period close task created".to_string())
}

#[tauri::command]
pub fn get_period_closes(app: AppHandle) -> Result<Vec<PeriodClose>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare("SELECT id, period, task, assigned_to, status FROM period_closes").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(PeriodClose {
            id: row.get(0)?,
            period: row.get(1)?,
            task: row.get(2)?,
            assigned_to: row.get(3)?,
            status: row.get(4)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut items = Vec::new();
    for row in rows { items.push(row.map_err(|e| e.to_string())?); }
    Ok(items)
}

#[derive(serde::Serialize, Deserialize)]
pub struct ExchangeRate {
    pub id: i64,
    pub pair: String,
    pub rate: f64,
    pub date: String,
}
#[derive(Deserialize)]
pub struct CreateExchangeRateInput {
    pub pair: String,
    pub rate: f64,
    pub date: String,
}

#[tauri::command]
pub fn create_exchange_rate(app: AppHandle, input: CreateExchangeRateInput) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute(
        "INSERT INTO exchange_rates (pair, rate, date) VALUES (?1, ?2, ?3)",
        params![input.pair, input.rate, input.date],
    ).map_err(|e| e.to_string())?;
    Ok("Exchange rate created".to_string())
}

#[tauri::command]
pub fn get_exchange_rates(app: AppHandle) -> Result<Vec<ExchangeRate>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare("SELECT id, pair, rate, date FROM exchange_rates ORDER BY id DESC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(ExchangeRate {
            id: row.get(0)?,
            pair: row.get(1)?,
            rate: row.get(2)?,
            date: row.get(3)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut items = Vec::new();
    for row in rows { items.push(row.map_err(|e| e.to_string())?); }
    Ok(items)
}

#[derive(serde::Serialize, Deserialize)]
pub struct ArRecurringBilling {
    pub id: i64,
    pub client_name: String,
    pub plan_name: String,
    pub amount: f64,
    pub next_billing_date: String,
    pub status: String,
}
#[derive(Deserialize)]
pub struct CreateArRecurringBillingInput {
    pub client_name: String,
    pub plan_name: String,
    pub amount: f64,
    pub next_billing_date: String,
    pub status: String,
}

#[tauri::command]
pub fn create_ar_recurring_billing(app: AppHandle, input: CreateArRecurringBillingInput) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute(
        "INSERT INTO ar_recurring_billing (client_name, plan_name, amount, next_billing_date, status) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![input.client_name, input.plan_name, input.amount, input.next_billing_date, input.status],
    ).map_err(|e| e.to_string())?;
    Ok("Recurring billing created".to_string())
}

#[tauri::command]
pub fn get_ar_recurring_billing(app: AppHandle) -> Result<Vec<ArRecurringBilling>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare("SELECT id, client_name, plan_name, amount, next_billing_date, status FROM ar_recurring_billing ORDER BY id DESC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(ArRecurringBilling {
            id: row.get(0)?,
            client_name: row.get(1)?,
            plan_name: row.get(2)?,
            amount: row.get(3)?,
            next_billing_date: row.get(4)?,
            status: row.get(5)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut items = Vec::new();
    for row in rows { items.push(row.map_err(|e| e.to_string())?); }
    Ok(items)
}

#[derive(serde::Serialize, Deserialize)]
pub struct ArDunningCampaign {
    pub id: i64,
    pub name: String,
    pub trigger_days_overdue: i64,
    pub email_subject: String,
    pub is_active: bool,
}
#[derive(Deserialize)]
pub struct CreateArDunningCampaignInput {
    pub name: String,
    pub trigger_days_overdue: i64,
    pub email_subject: String,
    pub is_active: bool,
}

#[tauri::command]
pub fn create_ar_dunning_campaign(app: AppHandle, input: CreateArDunningCampaignInput) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute(
        "INSERT INTO ar_dunning_campaigns (name, trigger_days_overdue, email_subject, is_active) VALUES (?1, ?2, ?3, ?4)",
        params![input.name, input.trigger_days_overdue, input.email_subject, input.is_active],
    ).map_err(|e| e.to_string())?;
    Ok("Dunning campaign created".to_string())
}

#[tauri::command]
pub fn get_ar_dunning_campaigns(app: AppHandle) -> Result<Vec<ArDunningCampaign>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare("SELECT id, name, trigger_days_overdue, email_subject, is_active FROM ar_dunning_campaigns ORDER BY id DESC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(ArDunningCampaign {
            id: row.get(0)?,
            name: row.get(1)?,
            trigger_days_overdue: row.get(2)?,
            email_subject: row.get(3)?,
            is_active: row.get(4)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut items = Vec::new();
    for row in rows { items.push(row.map_err(|e| e.to_string())?); }
    Ok(items)
}

#[derive(serde::Serialize, Deserialize)]
pub struct ArRevrecSchedule {
    pub id: i64,
    pub client_name: String,
    pub total_amount: f64,
    pub recognized_amount: f64,
    pub deferred_amount: f64,
    pub months: i64,
}
#[derive(Deserialize)]
pub struct CreateArRevrecScheduleInput {
    pub client_name: String,
    pub total_amount: f64,
    pub recognized_amount: f64,
    pub deferred_amount: f64,
    pub months: i64,
}

#[tauri::command]
pub fn create_ar_revrec_schedule(app: AppHandle, input: CreateArRevrecScheduleInput) -> Result<String, String> {
    let conn = db_connection(&app)?;
    conn.execute(
        "INSERT INTO ar_revrec_schedules (client_name, total_amount, recognized_amount, deferred_amount, months) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![input.client_name, input.total_amount, input.recognized_amount, input.deferred_amount, input.months],
    ).map_err(|e| e.to_string())?;
    Ok("Revrec schedule created".to_string())
}

#[tauri::command]
pub fn get_ar_revrec_schedules(app: AppHandle) -> Result<Vec<ArRevrecSchedule>, String> {
    let conn = db_connection(&app)?;
    let mut stmt = conn.prepare("SELECT id, client_name, total_amount, recognized_amount, deferred_amount, months FROM ar_revrec_schedules ORDER BY id DESC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(ArRevrecSchedule {
            id: row.get(0)?,
            client_name: row.get(1)?,
            total_amount: row.get(2)?,
            recognized_amount: row.get(3)?,
            deferred_amount: row.get(4)?,
            months: row.get(5)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut items = Vec::new();
    for row in rows { items.push(row.map_err(|e| e.to_string())?); }
    Ok(items)
}
