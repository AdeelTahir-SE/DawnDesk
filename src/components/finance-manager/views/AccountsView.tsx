import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Plus, ArrowRightLeft, CreditCard, Landmark, Wallet, MoreVertical, X } from "lucide-react";
import { useAppLogger } from "../../../utils/LoggerContext";

interface Account {
  id: number;
  name: string;
  type_: string;
  balance: number;
  currency: string;
}

export default function AccountsView() {
  const { logSuccess, logError } = useAppLogger();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAccount, setNewAccount] = useState({ name: "", type_: "checking", initial_balance: 0, currency: "USD" });

  const fetchAccounts = async () => {
    try {
      const data = await invoke<Account[]>("get_accounts");
      setAccounts(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await invoke("create_account", { input: { ...newAccount, initial_balance: Number(newAccount.initial_balance) } });
      setShowAddModal(false);
      logSuccess("Finance account created", newAccount.name, { source: "finance" });
      setNewAccount({ name: "", type_: "checking", initial_balance: 0, currency: "USD" });
      fetchAccounts();
    } catch (e) {
      console.error(e);
      logError("Finance account create failed", String(e), { source: "finance" });
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case "credit": return <CreditCard className="w-6 h-6" />;
      case "cash": return <Wallet className="w-6 h-6" />;
      default: return <Landmark className="w-6 h-6" />;
    }
  };

  return (
    <div className="p-8 flex flex-col gap-8 h-full animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-heading font-extrabold tracking-tight text-brand-text">Accounts & Wallets</h2>
          <p className="text-brand-text-muted text-sm">Manage your balances and transfer funds.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-brand-elevated border border-brand-border px-5 py-2.5 text-sm font-bold text-brand-text hover:bg-brand-border/30 transition-colors shadow-sm">
            <ArrowRightLeft className="w-4 h-4" /> Transfer
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-xl bg-brand-accent px-5 py-2.5 text-sm font-bold text-brand-base hover:bg-brand-accent-hover transition-transform active:scale-95 shadow-[0_0_20px_rgba(247,201,72,0.25)]">
            <Plus className="w-5 h-5" /> Add Account
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map(acc => (
          <div key={acc.id} className="rounded-2xl border border-brand-border bg-brand-elevated p-6 relative overflow-hidden group hover:border-brand-text-muted transition-all duration-300 hover:-translate-y-1 hover:shadow-lg shadow-brand-base/50">
            <div className="absolute right-0 top-0 w-32 h-32 bg-brand-text/5 blur-3xl rounded-full group-hover:bg-brand-text/10 transition-colors"></div>
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-brand-base text-brand-text flex items-center justify-center border border-brand-border shadow-sm">
                {getIcon(acc.type_)}
              </div>
              <button className="text-brand-text-muted hover:text-brand-text transition-colors"><MoreVertical className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-col gap-1 relative z-10">
              <span className="text-brand-text-secondary text-sm font-medium">{acc.name}</span>
              <span className={`text-3xl font-black ${acc.balance < 0 ? 'text-brand-error' : 'text-brand-text'}`}>
                {acc.balance < 0 ? '-' : ''}${Math.abs(acc.balance).toFixed(2)}
              </span>
            </div>
            <div className="mt-6 flex justify-between items-center text-xs text-brand-text-muted border-t border-brand-border/50 pt-4">
              <span className="capitalize">{acc.type_} Account</span>
              <span className="text-brand-text-muted uppercase tracking-widest">{acc.currency}</span>
            </div>
          </div>
        ))}

        {accounts.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center border border-dashed border-brand-border rounded-2xl">
            <Landmark className="w-12 h-12 text-brand-text-muted mb-4" />
            <h3 className="text-lg font-bold text-brand-text mb-2">No accounts found</h3>
            <p className="text-sm text-brand-text-muted mb-6 text-center max-w-sm">Create your first account to start tracking your finances across multiple sources.</p>
            <button onClick={() => setShowAddModal(true)} className="px-6 py-2.5 bg-brand-accent text-brand-base text-sm font-bold rounded-xl hover:bg-brand-accent-hover transition-colors">
              Create Account
            </button>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-brand-base/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-elevated border border-brand-border rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-brand-border">
              <h3 className="text-xl font-heading font-bold text-brand-text">Add New Account</h3>
              <button onClick={() => setShowAddModal(false)} className="text-brand-text-muted hover:text-brand-text transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddAccount} className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-brand-text-secondary font-medium">Account Name</label>
                <input 
                  type="text" required
                  value={newAccount.name}
                  onChange={e => setNewAccount({...newAccount, name: e.target.value})}
                  className="bg-brand-base border border-brand-border rounded-xl px-4 py-3 text-brand-text outline-none focus:border-brand-accent/50 transition-colors" 
                  placeholder="e.g. Chase Checking" 
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-brand-text-secondary font-medium">Account Type</label>
                <select 
                  value={newAccount.type_}
                  onChange={e => setNewAccount({...newAccount, type_: e.target.value})}
                  className="bg-brand-base border border-brand-border rounded-xl px-4 py-3 text-brand-text outline-none focus:border-brand-accent/50 transition-colors"
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="credit">Credit Card</option>
                  <option value="cash">Cash Wallet</option>
                  <option value="investment">Investment</option>
                </select>
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-sm text-brand-text-secondary font-medium">Initial Balance</label>
                  <input 
                    type="number" step="0.01" required
                    value={newAccount.initial_balance}
                    onChange={e => setNewAccount({...newAccount, initial_balance: Number(e.target.value)})}
                    className="bg-brand-base border border-brand-border rounded-xl px-4 py-3 text-brand-text outline-none focus:border-brand-accent/50 transition-colors" 
                    placeholder="0.00" 
                  />
                </div>
                <div className="flex flex-col gap-2 w-1/3">
                  <label className="text-sm text-brand-text-secondary font-medium">Currency</label>
                  <select 
                    value={newAccount.currency}
                    onChange={e => setNewAccount({...newAccount, currency: e.target.value})}
                    className="bg-brand-base border border-brand-border rounded-xl px-4 py-3 text-brand-text outline-none focus:border-brand-accent/50 transition-colors"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-xl text-brand-text-secondary hover:bg-brand-border/30 font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-brand-accent text-brand-base font-bold hover:bg-brand-accent-hover transition-colors">
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
