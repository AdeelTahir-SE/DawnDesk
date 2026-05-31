import {
  createFinanceRow,
  deleteFinanceRow,
  getFinancePreference,
  listFinanceRows,
  saveFinancePreference,
  type FinanceTableRow,
} from "./workspaceSync";

let activeFinanceWorkspaceId: string | null = null;

export function setActiveFinanceWorkspaceId(workspaceId: string | null) {
  activeFinanceWorkspaceId = workspaceId;
}

function requireWorkspaceId() {
  if (!activeFinanceWorkspaceId) {
    throw new Error("Select a finance project before using this finance module.");
  }
  return activeFinanceWorkspaceId;
}

const getCommandTable: Record<string, string> = {
  get_accounts: "finance_accounts",
  get_transactions: "finance_transactions",
  get_budgets: "finance_budgets",
  get_goals: "finance_goals",
  get_subscriptions: "finance_subscriptions",
  get_debts: "finance_debts",
  get_invoices: "finance_invoices",
  get_chart_of_accounts: "finance_chart_of_accounts",
  get_journal_entries: "finance_journal_entries",
  get_vendor_bills: "finance_vendor_bills",
  get_fixed_assets: "finance_fixed_assets",
  get_purchase_orders: "finance_purchase_orders",
  get_inventory_items: "finance_inventory_items",
  get_tax_codes: "finance_tax_codes",
  get_audit_logs: "finance_audit_logs",
  get_compliance_roles: "finance_compliance_roles",
  get_period_closes: "finance_period_closes",
  get_exchange_rates: "finance_exchange_rates",
  get_ar_recurring_billing: "finance_ar_recurring_billing",
  get_ar_dunning_campaigns: "finance_ar_dunning_campaigns",
  get_ar_revrec_schedules: "finance_ar_revrec_schedules",
};

const createCommandTable: Record<string, string> = {
  create_account: "finance_accounts",
  create_transaction: "finance_transactions",
  create_budget: "finance_budgets",
  create_goal: "finance_goals",
  create_subscription: "finance_subscriptions",
  create_debt: "finance_debts",
  create_invoice: "finance_invoices",
  create_chart_of_account: "finance_chart_of_accounts",
  create_journal_entry: "finance_journal_entries",
  create_vendor_bill: "finance_vendor_bills",
  create_fixed_asset: "finance_fixed_assets",
  create_purchase_order: "finance_purchase_orders",
  create_inventory_item: "finance_inventory_items",
  create_tax_code: "finance_tax_codes",
  create_audit_log: "finance_audit_logs",
  create_compliance_role: "finance_compliance_roles",
  create_period_close: "finance_period_closes",
  create_exchange_rate: "finance_exchange_rates",
  create_ar_recurring_billing: "finance_ar_recurring_billing",
  create_ar_dunning_campaign: "finance_ar_dunning_campaigns",
  create_ar_revrec_schedule: "finance_ar_revrec_schedules",
};

const deleteCommandTable: Record<string, string> = {
  delete_transaction: "finance_transactions",
  delete_account: "finance_accounts",
  delete_budget: "finance_budgets",
  delete_invoice: "finance_invoices",
  delete_vendor_bill: "finance_vendor_bills",
  delete_purchase_order: "finance_purchase_orders",
  delete_inventory_item: "finance_inventory_items",
  delete_tax_code: "finance_tax_codes",
};

export async function invoke<T = unknown>(command: string, args?: Record<string, any>): Promise<T> {
  const workspaceId = requireWorkspaceId();

  if (command === "get_finance_preference") {
    return await getFinancePreference(workspaceId, String(args?.key ?? ""), args?.defaultValue) as T;
  }

  if (command === "save_finance_preference") {
    await saveFinancePreference(workspaceId, String(args?.key ?? ""), args?.value ?? null);
    return undefined as T;
  }

  if (command === "get_compliance_evidence") {
    const [auditLogs, roles, taxCodes, periodCloses] = await Promise.all([
      listFinanceRows("finance_audit_logs", workspaceId),
      listFinanceRows("finance_compliance_roles", workspaceId),
      listFinanceRows("finance_tax_codes", workspaceId),
      listFinanceRows("finance_period_closes", workspaceId),
    ]);

    return {
      generated_at: new Date().toISOString(),
      summary: {
        audit_log_count: auditLogs.length,
        role_count: roles.length,
        tax_code_count: taxCodes.length,
        open_period_close_count: periodCloses.filter((row) => {
          const status = String(row.status ?? "").toLowerCase();
          return status !== "closed" && status !== "complete";
        }).length,
      },
      audit_logs: auditLogs,
      roles,
      tax_codes: taxCodes,
      period_closes: periodCloses,
    } as T;
  }

  const getTable = getCommandTable[command];
  if (getTable) {
    const rows = await listFinanceRows(getTable, workspaceId);
    return rows.map(normalizeRowForLegacyUi) as T;
  }

  const createTable = createCommandTable[command];
  if (createTable) {
    await createFinanceRow(createTable, workspaceId, normalizeInputForSupabase(command, args?.input ?? args ?? {}));
    return undefined as T;
  }

  const deleteTable = deleteCommandTable[command];
  if (deleteTable) {
    await deleteFinanceRow(deleteTable, String(args?.id));
    return undefined as T;
  }

  throw new Error(`Unsupported finance command: ${command}`);
}

function normalizeInputForSupabase(command: string, input: Record<string, any>) {
  const output = { ...input };

  if (command === "create_account") {
    output.balance = Number(output.initial_balance ?? output.balance ?? 0);
    delete output.initial_balance;
  }

  if (command === "create_invoice") {
    output.items_json = output.items_json ?? output.items ?? [];
    delete output.items;
  }

  if (command === "create_vendor_bill" || command === "create_purchase_order") {
    output.items_json = output.items_json ?? output.items ?? [];
    delete output.items;
  }

  if (command === "create_journal_entry") {
    output.lines_json = output.lines_json ?? output.lines ?? [];
    delete output.lines;
  }

  if (command === "create_tax_code") {
    output.active = output.active ?? true;
  }

  return output;
}

function normalizeRowForLegacyUi(row: FinanceTableRow) {
  return {
    ...row,
    id: row.id,
    account_id: row.account_id ?? null,
    receipt_path: row.receipt_path ?? row.receipt_storage_path ?? "",
    items: row.items ?? row.items_json ?? [],
    lines: row.lines ?? row.lines_json ?? [],
    timestamp: row.timestamp ?? row.created_at,
  };
}
