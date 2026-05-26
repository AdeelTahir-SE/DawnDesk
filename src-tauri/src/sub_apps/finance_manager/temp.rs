
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
