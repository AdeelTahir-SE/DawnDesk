import { useState, useEffect } from "react";
import { invoke } from "../../../lib/financeSupabaseInvoke";
import { Save, Shield, Bell, Moon, Globe, Download, Database } from "lucide-react";
import { exportTextFile } from "../../../utils/exportFile";
import { useAppLogger } from "../../../utils/LoggerContext";

type TransactionItem = {
  id: number;
  account_id: number | null;
  amount: number;
  type_: string;
  category: string;
  description: string;
  date: string;
  status: string;
};

const defaultFinanceSettings = {
  currency: "USD",
  weekStart: "monday",
  theme: "dark",
  notifications: true,
  pinLock: false,
};

export default function SettingsView() {
  const { logSuccess, logError } = useAppLogger();
  const [settings, setSettings] = useState(defaultFinanceSettings);
  const [exportStatus, setExportStatus] = useState("");

  useEffect(() => {
    let isMounted = true;
    invoke<typeof defaultFinanceSettings>("get_finance_preference", {
      key: "settings",
      defaultValue: defaultFinanceSettings,
    })
      .then((savedSettings) => {
        if (isMounted) setSettings({ ...defaultFinanceSettings, ...savedSettings });
      })
      .catch((error) => {
        logError("Finance settings load failed", String(error), { source: "finance" });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async () => {
    try {
      await invoke("save_finance_preference", { key: "settings", value: settings });
      logSuccess("Finance settings saved", "Finance Manager preferences were updated in Supabase.", { source: "finance" });
    } catch (error) {
      logError("Finance settings save failed", String(error), { source: "finance" });
    }
  };

  const exportTransactionsCsv = async () => {
    try {
      const transactions = await invoke<TransactionItem[]>("get_transactions");
      const header = ["id", "account_id", "date", "type", "category", "description", "amount", "status"];
      const rows = transactions.map((tx) => [
        tx.id,
        tx.account_id ?? "",
        tx.date,
        tx.type_,
        tx.category,
        tx.description,
        tx.amount,
        tx.status,
      ]);
      const csv = [header, ...rows]
        .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
        .join("\n");

      const path = await exportTextFile({
        title: "Export Finance Transactions CSV",
        defaultPath: "dawndesk-finance-transactions.csv",
        contents: csv,
        filters: [{ name: "CSV", extensions: ["csv"] }],
      });

      setExportStatus(path ? `Exported to ${path}` : "");
      if (path) logSuccess("Finance export complete", path, { source: "finance" });
    } catch (error) {
      logError("Finance export failed", String(error), { source: "finance" });
    }
  };

  return (
    <div className="p-8 flex flex-col gap-8 h-full animate-in fade-in zoom-in-95 duration-300 overflow-y-auto custom-scrollbar">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-heading font-extrabold tracking-tight text-brand-text">Settings</h2>
          <p className="text-brand-text-muted text-sm">Customize your finance manager experience.</p>
        </div>
        <button onClick={handleSave} className="flex items-center gap-2 rounded-xl bg-brand-accent px-5 py-2.5 text-sm font-bold text-brand-base hover:bg-brand-accent-hover transition-transform active:scale-95 shadow-[0_0_20px_rgba(247,201,72,0.25)]">
          <Save className="w-5 h-5" /> Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* General Settings */}
        <div className="flex flex-col gap-6">
          <h3 className="text-lg font-bold text-brand-text flex items-center gap-2 border-b border-brand-border/50 pb-4">
            <Globe className="w-5 h-5 text-brand-text-muted" /> Preferences
          </h3>
          
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-brand-text-secondary">Base Currency</label>
              <select 
                value={settings.currency}
                onChange={e => setSettings({...settings, currency: e.target.value})}
                className="bg-brand-base border border-brand-border rounded-xl px-4 py-3 text-brand-text outline-none focus:border-brand-accent/50 transition-colors"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-brand-text-secondary">Start of Week</label>
              <select 
                value={settings.weekStart}
                onChange={e => setSettings({...settings, weekStart: e.target.value})}
                className="bg-brand-base border border-brand-border rounded-xl px-4 py-3 text-brand-text outline-none focus:border-brand-accent/50 transition-colors"
              >
                <option value="monday">Monday</option>
                <option value="sunday">Sunday</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-brand-border bg-brand-elevated shadow-sm">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-brand-text-muted" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-brand-text">Dark Mode</span>
                  <span className="text-xs text-brand-text-muted">App appearance</span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked disabled />
                <div className="w-11 h-6 bg-brand-border/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-brand-base after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-brand-text after:border-brand-text-secondary after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-accent"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Security & Data */}
        <div className="flex flex-col gap-6">
          <h3 className="text-lg font-bold text-brand-text flex items-center gap-2 border-b border-brand-border/50 pb-4">
            <Shield className="w-5 h-5 text-brand-text-muted" /> Security & Alerts
          </h3>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-4 rounded-xl border border-brand-border bg-brand-elevated shadow-sm">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-brand-text-muted" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-brand-text">App PIN Lock</span>
                  <span className="text-xs text-brand-text-muted">Require PIN to open finance manager</span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.pinLock} onChange={e => setSettings({...settings, pinLock: e.target.checked})} />
                <div className="w-11 h-6 bg-brand-border/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-brand-base after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-brand-text after:border-brand-text-secondary after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-accent"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-brand-border bg-brand-elevated shadow-sm">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-brand-text-muted" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-brand-text">Push Notifications</span>
                  <span className="text-xs text-brand-text-muted">Alerts for bills and budgets</span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.notifications} onChange={e => setSettings({...settings, notifications: e.target.checked})} />
                <div className="w-11 h-6 bg-brand-border/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-brand-base after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-brand-text after:border-brand-text-secondary after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-accent"></div>
              </label>
            </div>

            <h3 className="text-lg font-bold text-brand-text flex items-center gap-2 border-b border-brand-border/50 pb-4 mt-4">
              <Database className="w-5 h-5 text-brand-text-muted" /> Data Management
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={exportTransactionsCsv} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-brand-border bg-brand-elevated hover:border-brand-text-muted transition-colors shadow-sm">
                <Download className="w-5 h-5 text-brand-text-secondary" />
                <span className="text-sm font-medium text-brand-text">Export to CSV</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-brand-error/30 bg-brand-error/5 hover:bg-brand-error/10 transition-colors group shadow-sm">
                <Shield className="w-5 h-5 text-brand-error/70 group-hover:text-brand-error" />
                <span className="text-sm font-medium text-brand-error">Reset All Data</span>
              </button>
            </div>
            {exportStatus && <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm font-semibold text-green-300">{exportStatus}</div>}

          </div>
        </div>
      </div>
    </div>
  );
}
