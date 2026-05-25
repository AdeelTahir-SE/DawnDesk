import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Search, Plus, Filter, Paperclip, Repeat, X, ArrowDown, ArrowUp } from "lucide-react";

interface Transaction {
  id: number;
  account_id: number | null;
  amount: number;
  type_: string;
  category: string;
  description: string;
  date: string;
  status: string;
  notes: string;
  receipt_path: string;
  is_recurring: boolean;
  created_at: string;
}

interface Account {
  id: number;
  name: string;
}

export default function TransactionsView() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [newTx, setNewTx] = useState({
    account_id: "",
    amount: 0,
    type_: "expense",
    category: "Food",
    description: "",
    date: new Date().toISOString().split('T')[0],
    status: "confirmed",
    notes: "",
    receipt_path: "",
    is_recurring: false
  });

  const fetchData = async () => {
    try {
      const txs = await invoke<Transaction[]>("get_transactions");
      setTransactions(txs);
      const accs = await invoke<Account[]>("get_accounts");
      setAccounts(accs);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddTx = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await invoke("create_transaction", { 
        input: { 
          ...newTx, 
          amount: Number(newTx.amount),
          account_id: newTx.account_id ? Number(newTx.account_id) : null 
        } 
      });
      setShowAddModal(false);
      setNewTx({ ...newTx, amount: 0, description: "", notes: "" });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await invoke("delete_transaction", { id });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  }

  const getAccountName = (id: number | null) => {
    if (!id) return "Cash / Unknown";
    const acc = accounts.find(a => a.id === id);
    return acc ? acc.name : "Unknown";
  };

  return (
    <div className="p-8 flex flex-col gap-8 h-full animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Transactions</h2>
          <p className="text-white/50 text-sm">Manage, filter, and track your cash flow.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-bold text-black hover:bg-yellow-300 transition-transform active:scale-95 shadow-[0_0_20px_rgba(250,204,21,0.25)]">
          <Plus className="w-5 h-5" /> Add Transaction
        </button>
      </div>

      <div className="flex gap-4 p-4 bg-neutral-900/50 border border-white/10 rounded-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input type="text" placeholder="Search by name, category, or amount..." className="w-full bg-black/40 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-yellow-400/50" />
        </div>
        <button className="px-4 py-2 bg-black/40 border border-white/5 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-white/5 transition-colors">
          <Filter className="w-4 h-4" /> Filters
        </button>
      </div>

      <div className="flex-1 overflow-auto rounded-2xl border border-white/10 bg-neutral-900/50">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/40 text-white/50 sticky top-0 backdrop-blur-md">
            <tr>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium">Description</th>
              <th className="px-6 py-4 font-medium">Category</th>
              <th className="px-6 py-4 font-medium">Account</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Amount</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {transactions.map(tx => (
              <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4 text-white/70">{tx.date}</td>
                <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                  <div className={`p-1.5 rounded-md ${tx.type_ === 'income' ? 'bg-white/10 text-white' : 'bg-white/5 text-white/50'}`}>
                    {tx.type_ === 'income' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  </div>
                  {tx.description}
                  {tx.receipt_path && <Paperclip className="w-3 h-3 text-white/30" />}
                  {tx.is_recurring && <Repeat className="w-3 h-3 text-white/30" />}
                </td>
                <td className="px-6 py-4"><span className="px-2.5 py-1 rounded-md bg-white/10 text-white/70 text-xs font-medium">{tx.category}</span></td>
                <td className="px-6 py-4 text-white/70">{getAccountName(tx.account_id)}</td>
                <td className="px-6 py-4">
                  <span className={`flex items-center gap-1.5 text-xs font-medium ${tx.status === 'pending' ? 'text-yellow-400' : 'text-white/50'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${tx.status === 'pending' ? 'bg-yellow-400' : 'bg-white/50'}`}></div>
                    <span className="capitalize">{tx.status}</span>
                  </span>
                </td>
                <td className={`px-6 py-4 text-right font-mono font-bold ${tx.type_ === 'income' ? 'text-white' : 'text-white/60'}`}>
                  {tx.type_ === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(tx.id)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 text-white/50 hover:text-white rounded-md transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            
            {transactions.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-white/50">No transactions recorded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">Add Transaction</h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/50 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddTx} className="p-6 flex flex-col gap-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
              
              <div className="flex gap-2 p-1 bg-black/40 border border-white/5 rounded-xl">
                <button type="button" onClick={() => setNewTx({...newTx, type_: 'expense'})} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${newTx.type_ === 'expense' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}>Expense</button>
                <button type="button" onClick={() => setNewTx({...newTx, type_: 'income'})} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${newTx.type_ === 'income' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}>Income</button>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm text-white/70 font-medium">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 font-bold">$</span>
                  <input type="number" step="0.01" required value={newTx.amount} onChange={e => setNewTx({...newTx, amount: Number(e.target.value)})} className="w-full bg-black/50 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white outline-none focus:border-yellow-400/50" placeholder="0.00" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-white/70 font-medium">Description</label>
                  <input type="text" required value={newTx.description} onChange={e => setNewTx({...newTx, description: e.target.value})} className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400/50" placeholder="Coffee" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-white/70 font-medium">Category</label>
                  <input type="text" required value={newTx.category} onChange={e => setNewTx({...newTx, category: e.target.value})} className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400/50" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-white/70 font-medium">Date</label>
                  <input type="date" required value={newTx.date} onChange={e => setNewTx({...newTx, date: e.target.value})} className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400/50" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-white/70 font-medium">Account</label>
                  <select value={newTx.account_id} onChange={e => setNewTx({...newTx, account_id: e.target.value})} className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400/50">
                    <option value="">No Account</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-6 mt-2">
                <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                  <input type="checkbox" checked={newTx.status === 'pending'} onChange={e => setNewTx({...newTx, status: e.target.checked ? 'pending' : 'confirmed'})} className="rounded bg-black/50 border-white/10 text-yellow-400 focus:ring-yellow-400/50" />
                  Mark as Pending
                </label>
                <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                  <input type="checkbox" checked={newTx.is_recurring} onChange={e => setNewTx({...newTx, is_recurring: e.target.checked})} className="rounded bg-black/50 border-white/10 text-yellow-400 focus:ring-yellow-400/50" />
                  Recurring
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-xl text-white/70 hover:bg-white/5 font-medium transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-yellow-400 text-black font-bold hover:bg-yellow-300 transition-colors">Add Transaction</button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
