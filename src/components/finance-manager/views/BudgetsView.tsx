import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Plus, RefreshCw, X } from "lucide-react";

interface Budget {
  id: number;
  category: string;
  limit_amount: number;
  period: string;
}

interface Transaction {
  amount: number;
  type_: string;
  category: string;
}

export default function BudgetsView() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expensesByCategory, setExpensesByCategory] = useState<Map<string, number>>(new Map());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBudget, setNewBudget] = useState({ category: "", limit_amount: 0, period: "monthly" });

  const fetchData = async () => {
    try {
      const bData = await invoke<Budget[]>("get_budgets");
      setBudgets(bData);

      const txs = await invoke<Transaction[]>("get_transactions");
      const expMap = new Map<string, number>();
      txs.forEach(tx => {
        if (tx.type_ === 'expense') {
          expMap.set(tx.category, (expMap.get(tx.category) || 0) + tx.amount);
        }
      });
      setExpensesByCategory(expMap);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await invoke("create_budget", { input: { ...newBudget, limit_amount: Number(newBudget.limit_amount) } });
      setShowAddModal(false);
      setNewBudget({ category: "", limit_amount: 0, period: "monthly" });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.limit_amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (expensesByCategory.get(b.category) || 0), 0);
  const overallProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div className="p-8 flex flex-col gap-8 h-full animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Budgets</h2>
          <p className="text-white/50 text-sm">Control spending with category limits.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-bold text-black hover:bg-yellow-300 transition-transform active:scale-95 shadow-[0_0_20px_rgba(250,204,21,0.25)]">
          <Plus className="w-5 h-5" /> New Budget
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="rounded-2xl border border-white/10 bg-neutral-900/50 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-2 w-full md:w-1/3">
            <span className="text-white/50 text-sm font-medium uppercase tracking-wider">Total Monthly Budget</span>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-white">${totalSpent.toFixed(2)}</span>
              <span className="text-white/40 mb-1">/ ${totalBudget.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex-1 w-full">
            <div className="h-4 w-full bg-black/50 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-white rounded-full" style={{ width: `${Math.min(overallProgress, 100)}%` }}></div>
            </div>
            <div className="flex justify-between mt-2 text-xs font-medium">
              <span className="text-white">{overallProgress.toFixed(1)}% Used</span>
              <span className="text-white/50">{Math.max(100 - overallProgress, 0).toFixed(1)}% Remaining</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {budgets.map(b => {
            const spent = expensesByCategory.get(b.category) || 0;
            const limit = b.limit_amount;
            const progress = Math.min((spent / limit) * 100, 100);
            const isOver = spent >= limit;
            const isWarning = progress >= 80 && !isOver;

            let bgColor = "bg-white";
            let textColor = "text-white";
            let borderColor = "border-white/10";
            let bgWrapper = "bg-neutral-900/50";
            
            if (isOver) {
              bgColor = "bg-white/80";
              textColor = "text-white/80";
              borderColor = "border-white/30";
              bgWrapper = "bg-white/5";
            } else if (isWarning) {
              bgColor = "bg-yellow-400";
              textColor = "text-yellow-400";
              borderColor = "border-yellow-400/30";
              bgWrapper = "bg-yellow-400/5";
            }

            return (
              <div key={b.id} className={`rounded-2xl border ${borderColor} ${bgWrapper} p-6 relative`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-white flex items-center gap-2">{b.category}</h3>
                  <span className={`${textColor} font-bold`}>${spent.toFixed(2)} / ${limit.toFixed(2)}</span>
                </div>
                <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden mb-2">
                  <div className={`h-full ${bgColor} rounded-full`} style={{ width: `${progress}%` }}></div>
                </div>
                <div className="flex justify-between text-[11px] text-white/50">
                  <span className={`${textColor} font-medium`}>
                    {isOver ? `$${(spent - limit).toFixed(2)} Over Budget` : `$${(limit - spent).toFixed(2)} Remaining`}
                  </span>
                  <span className="flex items-center gap-1 text-white/40"><RefreshCw className="w-3 h-3" /> {b.period}</span>
                </div>
              </div>
            );
          })}
          
          {budgets.length === 0 && (
            <div className="col-span-full py-8 text-center text-white/50 border border-dashed border-white/10 rounded-2xl">
              No budgets created yet.
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">Add New Budget</h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/50 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddBudget} className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-white/70 font-medium">Category</label>
                <input type="text" required value={newBudget.category} onChange={e => setNewBudget({...newBudget, category: e.target.value})} className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400/50" placeholder="e.g. Groceries" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-white/70 font-medium">Limit Amount ($)</label>
                <input type="number" step="0.01" required value={newBudget.limit_amount} onChange={e => setNewBudget({...newBudget, limit_amount: Number(e.target.value)})} className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400/50" placeholder="500.00" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-white/70 font-medium">Period</label>
                <select value={newBudget.period} onChange={e => setNewBudget({...newBudget, period: e.target.value})} className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400/50">
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-xl text-white/70 hover:bg-white/5 font-medium transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-yellow-400 text-black font-bold hover:bg-yellow-300 transition-colors">Create Budget</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
