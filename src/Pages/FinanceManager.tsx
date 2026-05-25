import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import OnboardingWrapper from "../components/OnboardingWrapper";
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Banknote, Calendar } from "lucide-react";

export interface Transaction {
  id: number;
  amount: number;
  type_: string;
  category: string;
  description: string;
  date: string;
  created_at: string;
}

export default function FinanceManager() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const loadTransactions = async () => {
    try {
      const res: Transaction[] = await invoke("get_transactions");
      setTransactions(res);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;
    
    try {
      await invoke("create_transaction", {
        input: {
          amount: Number(amount),
          type_: type,
          category: category || "Uncategorized",
          description,
          date,
        }
      });
      setIsAdding(false);
      setAmount("");
      setDescription("");
      setCategory("");
      loadTransactions();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await invoke("delete_transaction", { id });
      loadTransactions();
    } catch (e) {
      console.error(e);
    }
  };

  const totalIncome = transactions.filter(t => t.type_ === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type_ === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <OnboardingWrapper appKey="finance" title="Finance Manager" description="Track your income, expenses, and manage your budget securely offline.">
      <div className="flex h-full w-full flex-col bg-[#0a0a0a] overflow-y-auto custom-scrollbar">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-8 pb-24 animate-fadeIn">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Finance Dashboard</h1>
              <p className="text-sm text-white/50">Your local-first financial overview.</p>
            </div>
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-bold text-black hover:bg-yellow-300 transition-colors shadow-[0_0_15px_rgba(250,204,21,0.2)]"
            >
              <Plus className="w-4 h-4" /> Add Transaction
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="flex flex-col gap-2 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
              <div className="flex items-center gap-2 text-white/50 text-sm font-medium">
                <Banknote className="w-4 h-4" /> Total Balance
              </div>
              <div className={`text-3xl font-bold ${balance >= 0 ? 'text-white' : 'text-red-400'}`}>
                ${balance.toFixed(2)}
              </div>
            </div>
            <div className="flex flex-col gap-2 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
              <div className="flex items-center gap-2 text-green-400/70 text-sm font-medium">
                <ArrowUpCircle className="w-4 h-4" /> Total Income
              </div>
              <div className="text-3xl font-bold text-green-400">
                ${totalIncome.toFixed(2)}
              </div>
            </div>
            <div className="flex flex-col gap-2 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
              <div className="flex items-center gap-2 text-red-400/70 text-sm font-medium">
                <ArrowDownCircle className="w-4 h-4" /> Total Expenses
              </div>
              <div className="text-3xl font-bold text-red-400">
                ${totalExpense.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Add Form */}
          {isAdding && (
            <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-6 backdrop-blur-sm animate-in slide-in-from-top-4">
              <h2 className="text-lg font-bold text-white mb-4">New Transaction</h2>
              <form onSubmit={handleAdd} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="flex flex-col gap-1.5 lg:col-span-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">Type</label>
                  <select 
                    value={type} onChange={(e) => setType(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400/50 transition-colors"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5 lg:col-span-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">Amount</label>
                  <input 
                    type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400/50 transition-colors placeholder-white/20"
                  />
                </div>
                <div className="flex flex-col gap-1.5 lg:col-span-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">Category</label>
                  <input 
                    type="text" required value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Groceries"
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400/50 transition-colors placeholder-white/20"
                  />
                </div>
                <div className="flex flex-col gap-1.5 lg:col-span-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">Date</label>
                  <input 
                    type="date" required value={date} onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400/50 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5 lg:col-span-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">Description</label>
                  <input 
                    type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional"
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400/50 transition-colors placeholder-white/20"
                  />
                </div>
                <div className="lg:col-span-5 flex justify-end gap-3 mt-4">
                  <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm font-medium text-white/50 hover:text-white transition-colors">Cancel</button>
                  <button type="submit" className="rounded-lg bg-yellow-400 px-6 py-2 text-sm font-bold text-black hover:bg-yellow-300 transition-colors">Save Transaction</button>
                </div>
              </form>
            </div>
          )}

          {/* Transactions List */}
          <div className="flex flex-col rounded-2xl border border-neutral-800 bg-neutral-900/40 overflow-hidden shadow-xl">
            <div className="border-b border-neutral-800 px-6 py-5 bg-neutral-950/30">
              <h2 className="text-lg font-bold text-white tracking-wide">Recent Transactions</h2>
            </div>
            
            {transactions.length === 0 ? (
              <div className="p-16 text-center text-white/30 text-sm flex flex-col items-center gap-4">
                <Banknote className="w-12 h-12 opacity-20" />
                No transactions yet. Add your first income or expense!
              </div>
            ) : (
              <div className="divide-y divide-neutral-800/50 bg-neutral-900/20">
                {transactions.map(t => (
                  <div key={t.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 px-6 hover:bg-neutral-800/50 transition-all duration-200">
                    <div className="flex items-center gap-4 mb-2 sm:mb-0">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${t.type_ === 'income' ? 'bg-green-500/10 border-green-500/20 text-green-400 shadow-[0_0_10px_rgba(74,222,128,0.1)]' : 'bg-red-500/10 border-red-500/20 text-red-400 shadow-[0_0_10px_rgba(248,113,113,0.1)]'}`}>
                        {t.type_ === 'income' ? <ArrowUpCircle className="w-5 h-5" strokeWidth={2.5} /> : <ArrowDownCircle className="w-5 h-5" strokeWidth={2.5} />}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-white/90 text-base">{t.category}</span>
                        <span className="text-xs text-white/40">{t.description || "No description"}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pl-15 sm:pl-0">
                      <div className="flex flex-col items-end">
                        <span className={`font-bold text-lg ${t.type_ === 'income' ? 'text-green-400' : 'text-white'}`}>
                          {t.type_ === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-white/30 uppercase tracking-wider font-mono">
                          <Calendar className="w-3 h-3" /> {t.date}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleDelete(t.id)}
                        className="opacity-100 sm:opacity-0 group-hover:opacity-100 p-2 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                        aria-label="Delete transaction"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </OnboardingWrapper>
  );
}
