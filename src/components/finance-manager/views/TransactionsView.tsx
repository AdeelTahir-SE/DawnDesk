import { useState, useEffect } from "react";
import { invoke } from "../../../lib/financeSupabaseInvoke";
import { Search, Plus, Paperclip, Repeat, X, ArrowDown, ArrowUp, SlidersHorizontal } from "lucide-react";
import { useAppLogger } from "../../../utils/LoggerContext";

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
  const { logSuccess, logError, logWarning } = useAppLogger();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
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
      logSuccess("Finance transaction added", newTx.description || newTx.category, { source: "finance" });
      setNewTx({ ...newTx, amount: 0, description: "", notes: "" });
      fetchData();
    } catch (e) {
      console.error(e);
      logError("Finance transaction add failed", String(e), { source: "finance" });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await invoke("delete_transaction", { id });
      fetchData();
      logWarning("Finance transaction deleted", `Transaction #${id}`, { source: "finance" });
    } catch (e) {
      console.error(e);
      logError("Finance transaction delete failed", String(e), { source: "finance" });
    }
  }

  const getAccountName = (id: number | null) => {
    if (!id) return "Cash / Unknown";
    const acc = accounts.find(a => a.id === id);
    return acc ? acc.name : "Unknown";
  };

  const filteredTransactions = transactions.filter(tx => {
    const haystack = `${tx.description} ${tx.category} ${getAccountName(tx.account_id)} ${tx.amount}`.toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    const matchesType = typeFilter === "all" || tx.type_ === typeFilter;
    const matchesStatus = statusFilter === "all" || tx.status === statusFilter;
    return matchesQuery && matchesType && matchesStatus;
  });

  const totalIncome = filteredTransactions.filter(tx => tx.type_ === "income").reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpense = filteredTransactions.filter(tx => tx.type_ !== "income").reduce((sum, tx) => sum + tx.amount, 0);
  const pendingCount = filteredTransactions.filter(tx => tx.status === "pending").length;

  return (
    <div className="p-8 flex flex-col gap-8 h-full animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-heading font-extrabold tracking-tight text-brand-text">Transactions</h2>
          <p className="text-brand-text-muted text-sm">Manage, filter, and track your cash flow.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 rounded-xl bg-brand-accent px-5 py-2.5 text-sm font-bold text-brand-base hover:bg-brand-accent-hover transition-transform active:scale-95 shadow-[0_0_20px_rgba(247,201,72,0.25)]">
          <Plus className="w-5 h-5" /> Add Transaction
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-brand-border bg-brand-elevated p-5">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-brand-text-muted">Filtered Income</span>
          <div className="mt-2 text-3xl font-black text-brand-success">${totalIncome.toFixed(2)}</div>
        </div>
        <div className="rounded-2xl border border-brand-border bg-brand-elevated p-5">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-brand-text-muted">Filtered Expense</span>
          <div className="mt-2 text-3xl font-black text-brand-text">${totalExpense.toFixed(2)}</div>
        </div>
        <div className="rounded-2xl border border-brand-border bg-brand-elevated p-5">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-brand-text-muted">Pending Items</span>
          <div className="mt-2 text-3xl font-black text-brand-warning">{pendingCount}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 p-4 bg-brand-elevated border border-brand-border rounded-2xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, category, account, or amount..."
            className="w-full min-w-[260px] bg-brand-base border border-brand-border/50 rounded-xl pl-10 pr-4 py-2 text-sm text-brand-text outline-none focus:border-brand-accent/50 transition-colors"
          />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-brand-base border border-brand-border/50 rounded-xl px-4 py-2 text-sm text-brand-text outline-none focus:border-brand-accent/50">
          <option value="all">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-brand-base border border-brand-border/50 rounded-xl px-4 py-2 text-sm text-brand-text outline-none focus:border-brand-accent/50">
          <option value="all">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
        </select>
        <button className="px-4 py-2 bg-brand-base border border-brand-border/50 rounded-xl text-sm font-medium flex items-center gap-2 text-brand-text hover:bg-brand-border/30 transition-colors">
          <SlidersHorizontal className="w-4 h-4" /> Rules
        </button>
      </div>

      <div className="flex-1 overflow-auto rounded-2xl border border-brand-border bg-brand-elevated shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-base/80 text-brand-text-muted sticky top-0 backdrop-blur-md z-10 border-b border-brand-border">
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
          <tbody className="divide-y divide-brand-border/50">
            {filteredTransactions.map(tx => (
              <tr key={tx.id} className="hover:bg-brand-border/30 transition-colors group">
                <td className="px-6 py-4 text-brand-text-secondary">{tx.date}</td>
                <td className="px-6 py-4 font-medium text-brand-text flex items-center gap-2">
                  <div className={`p-1.5 rounded-md ${tx.type_ === 'income' ? 'bg-brand-success/10 text-brand-success' : 'bg-brand-error/10 text-brand-error'}`}>
                    {tx.type_ === 'income' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  </div>
                  {tx.description}
                  {tx.receipt_path && <Paperclip className="w-3 h-3 text-brand-text-muted" />}
                  {tx.is_recurring && <Repeat className="w-3 h-3 text-brand-text-muted" />}
                </td>
                <td className="px-6 py-4"><span className="px-2.5 py-1 rounded-md bg-brand-base text-brand-text-secondary text-xs font-medium border border-brand-border">{tx.category}</span></td>
                <td className="px-6 py-4 text-brand-text-secondary">{getAccountName(tx.account_id)}</td>
                <td className="px-6 py-4">
                  <span className={`flex items-center gap-1.5 text-xs font-medium ${tx.status === 'pending' ? 'text-brand-warning' : 'text-brand-text-muted'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${tx.status === 'pending' ? 'bg-brand-warning' : 'bg-brand-border'}`}></div>
                    <span className="capitalize">{tx.status}</span>
                  </span>
                </td>
                <td className={`px-6 py-4 text-right font-mono font-bold ${tx.type_ === 'income' ? 'text-brand-success' : 'text-brand-text'}`}>
                  {tx.type_ === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(tx.id)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-brand-error/20 text-brand-text-muted hover:text-brand-error rounded-md transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-brand-text-muted">
                  {transactions.length === 0 ? "No transactions recorded yet." : "No transactions match your filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-brand-base/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-elevated border border-brand-border rounded-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-brand-border">
              <h3 className="text-xl font-heading font-bold text-brand-text">Add Transaction</h3>
              <button onClick={() => setShowAddModal(false)} className="text-brand-text-muted hover:text-brand-text transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddTx} className="p-6 flex flex-col gap-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
              
              <div className="flex gap-2 p-1 bg-brand-base border border-brand-border/50 rounded-xl">
                <button type="button" onClick={() => setNewTx({...newTx, type_: 'expense'})} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${newTx.type_ === 'expense' ? 'bg-brand-elevated border border-brand-border shadow-sm text-brand-text' : 'text-brand-text-muted hover:text-brand-text'}`}>Expense</button>
                <button type="button" onClick={() => setNewTx({...newTx, type_: 'income'})} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${newTx.type_ === 'income' ? 'bg-brand-elevated border border-brand-border shadow-sm text-brand-text' : 'text-brand-text-muted hover:text-brand-text'}`}>Income</button>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm text-brand-text-secondary font-medium">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-muted font-bold">$</span>
                  <input type="number" step="0.01" required value={newTx.amount} onChange={e => setNewTx({...newTx, amount: Number(e.target.value)})} className="w-full bg-brand-base border border-brand-border rounded-xl pl-8 pr-4 py-3 text-brand-text outline-none focus:border-brand-accent/50 transition-colors" placeholder="0.00" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-brand-text-secondary font-medium">Description</label>
                  <input type="text" required value={newTx.description} onChange={e => setNewTx({...newTx, description: e.target.value})} className="bg-brand-base border border-brand-border rounded-xl px-4 py-3 text-brand-text outline-none focus:border-brand-accent/50 transition-colors" placeholder="Coffee" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-brand-text-secondary font-medium">Category</label>
                  <input type="text" required value={newTx.category} onChange={e => setNewTx({...newTx, category: e.target.value})} className="bg-brand-base border border-brand-border rounded-xl px-4 py-3 text-brand-text outline-none focus:border-brand-accent/50 transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-brand-text-secondary font-medium">Date</label>
                  <input type="date" required value={newTx.date} onChange={e => setNewTx({...newTx, date: e.target.value})} className="bg-brand-base border border-brand-border rounded-xl px-4 py-3 text-brand-text outline-none focus:border-brand-accent/50 transition-colors" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-brand-text-secondary font-medium">Account</label>
                  <select value={newTx.account_id} onChange={e => setNewTx({...newTx, account_id: e.target.value})} className="bg-brand-base border border-brand-border rounded-xl px-4 py-3 text-brand-text outline-none focus:border-brand-accent/50 transition-colors">
                    <option value="">No Account</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-6 mt-2">
                <label className="flex items-center gap-2 text-sm text-brand-text-secondary cursor-pointer">
                  <input type="checkbox" checked={newTx.status === 'pending'} onChange={e => setNewTx({...newTx, status: e.target.checked ? 'pending' : 'confirmed'})} className="rounded bg-brand-base border-brand-border text-brand-accent focus:ring-brand-accent/50" />
                  Mark as Pending
                </label>
                <label className="flex items-center gap-2 text-sm text-brand-text-secondary cursor-pointer">
                  <input type="checkbox" checked={newTx.is_recurring} onChange={e => setNewTx({...newTx, is_recurring: e.target.checked})} className="rounded bg-brand-base border-brand-border text-brand-accent focus:ring-brand-accent/50" />
                  Recurring
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-brand-border">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-xl text-brand-text-secondary hover:bg-brand-border/30 font-medium transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-brand-accent text-brand-base font-bold hover:bg-brand-accent-hover transition-colors">Add Transaction</button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
