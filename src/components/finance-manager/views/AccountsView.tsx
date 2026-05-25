import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Plus, ArrowRightLeft, CreditCard, Landmark, Wallet, MoreVertical, X } from "lucide-react";

interface Account {
  id: number;
  name: String;
  type_: String;
  balance: number;
  currency: String;
}

export default function AccountsView() {
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
      setNewAccount({ name: "", type_: "checking", initial_balance: 0, currency: "USD" });
      fetchAccounts();
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type: String) => {
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
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Accounts & Wallets</h2>
          <p className="text-white/50 text-sm">Manage your balances and transfer funds.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10 transition-colors">
            <ArrowRightLeft className="w-4 h-4" /> Transfer
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-bold text-black hover:bg-yellow-300 transition-transform active:scale-95 shadow-[0_0_20px_rgba(250,204,21,0.25)]">
            <Plus className="w-5 h-5" /> Add Account
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map(acc => (
          <div key={acc.id} className="rounded-2xl border border-white/10 bg-gradient-to-br from-neutral-900 to-neutral-950 p-6 relative overflow-hidden group hover:border-white/20 transition-colors">
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 blur-3xl rounded-full"></div>
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-white/5 text-white flex items-center justify-center border border-white/10">
                {getIcon(acc.type_)}
              </div>
              <button className="text-white/30 hover:text-white"><MoreVertical className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-col gap-1 relative z-10">
              <span className="text-white/50 text-sm font-medium">{acc.name}</span>
              <span className={`text-3xl font-black ${acc.balance < 0 ? 'text-white/60' : 'text-white'}`}>
                {acc.balance < 0 ? '-' : ''}${Math.abs(acc.balance).toFixed(2)}
              </span>
            </div>
            <div className="mt-6 flex justify-between items-center text-xs text-white/40 border-t border-white/5 pt-4">
              <span className="capitalize">{acc.type_} Account</span>
              <span className="text-white/30 uppercase tracking-widest">{acc.currency}</span>
            </div>
          </div>
        ))}

        {accounts.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl">
            <Landmark className="w-12 h-12 text-white/20 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No accounts found</h3>
            <p className="text-sm text-white/50 mb-6 text-center max-w-sm">Create your first account to start tracking your finances across multiple sources.</p>
            <button onClick={() => setShowAddModal(true)} className="px-6 py-2.5 bg-yellow-400 text-black text-sm font-bold rounded-xl hover:bg-yellow-300">
              Create Account
            </button>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">Add New Account</h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/50 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddAccount} className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-white/70 font-medium">Account Name</label>
                <input 
                  type="text" required
                  value={newAccount.name}
                  onChange={e => setNewAccount({...newAccount, name: e.target.value})}
                  className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400/50" 
                  placeholder="e.g. Chase Checking" 
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-white/70 font-medium">Account Type</label>
                <select 
                  value={newAccount.type_}
                  onChange={e => setNewAccount({...newAccount, type_: e.target.value})}
                  className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400/50"
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
                  <label className="text-sm text-white/70 font-medium">Initial Balance</label>
                  <input 
                    type="number" step="0.01" required
                    value={newAccount.initial_balance}
                    onChange={e => setNewAccount({...newAccount, initial_balance: Number(e.target.value)})}
                    className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400/50" 
                    placeholder="0.00" 
                  />
                </div>
                <div className="flex flex-col gap-2 w-1/3">
                  <label className="text-sm text-white/70 font-medium">Currency</label>
                  <select 
                    value={newAccount.currency}
                    onChange={e => setNewAccount({...newAccount, currency: e.target.value})}
                    className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400/50"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-xl text-white/70 hover:bg-white/5 font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-yellow-400 text-black font-bold hover:bg-yellow-300 transition-colors">
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
