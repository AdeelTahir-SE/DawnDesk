import { useState, useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Plus, PieChart, Building, Loader2, X, TrendingUp } from "lucide-react";

export type BudgetItem = {
  id: number;
  category: string;
  limit_amount: number;
  period: string;
};

type TransactionItem = {
  id: number;
  amount: number;
  type_: string;
  category: string;
  date: string;
  status: string;
};

export default function BudgetingForecastingView() {
  const [activeTab, setActiveTab] = useState("budgets");
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [budgetRows, txRows] = await Promise.all([
        invoke<BudgetItem[]>("get_budgets"),
        invoke<TransactionItem[]>("get_transactions"),
      ]);
      setBudgets(budgetRows);
      setTransactions(txRows);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in zoom-in-95 duration-300">
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-lg shadow-black/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-400">Operations</p>
            <h2 className="mt-2 font-heading text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <PieChart className="h-6 w-6 text-yellow-400" />
              Budgeting & Forecasting
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/60">
              Departmental budgets, variance analysis, what-if scenario modeling, and rolling forecasts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-yellow-300">
              <Plus className="h-4 w-4" /> New Budget
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-6 border-b border-neutral-800">
          <button onClick={() => setActiveTab("budgets")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "budgets" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Department Budgets</button>
          <button onClick={() => setActiveTab("variance")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "variance" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Variance Analysis</button>
          <button onClick={() => setActiveTab("scenarios")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "scenarios" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Scenario Modeling</button>
        </div>

        <div className="mt-6">
          {loading ? (
             <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-yellow-400 animate-spin" /></div>
          ) : (
            <>
              {activeTab === "budgets" && <BudgetsTable budgets={budgets} transactions={transactions} />}
              {activeTab === "variance" && <VarianceAnalysis budgets={budgets} transactions={transactions} />}
              {activeTab === "scenarios" && <ScenarioModeling budgets={budgets} transactions={transactions} />}
            </>
          )}
        </div>
      </section>

      {showModal && <CreateBudgetModal onClose={() => setShowModal(false)} onSaved={loadData} />}
    </div>
  );
}

function getBudgetActual(budget: BudgetItem, transactions: TransactionItem[]) {
  return transactions
    .filter((tx) => tx.status.toLowerCase() !== "void")
    .filter((tx) => tx.type_.toLowerCase() === "expense")
    .filter((tx) => tx.category.toLowerCase() === budget.category.toLowerCase())
    .reduce((sum, tx) => sum + tx.amount, 0);
}

function BudgetsTable({ budgets, transactions }: { budgets: BudgetItem[]; transactions: TransactionItem[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-6 py-4 font-semibold">Category / Dept</th>
            <th className="px-6 py-4 font-semibold">Period</th>
            <th className="px-6 py-4 font-semibold text-right">Limit Amount</th>
            <th className="px-6 py-4 font-semibold text-right">Actual Spend</th>
            <th className="px-6 py-4 font-semibold">Remaining</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {budgets.length === 0 && (
            <tr><td colSpan={5} className="px-6 py-8 text-center text-white/40">No budgets found.</td></tr>
          )}
          {budgets.map((b) => {
            const actual = getBudgetActual(b, transactions);
            const remaining = b.limit_amount - actual;
            const pct = b.limit_amount > 0 ? Math.min(100, (actual / b.limit_amount) * 100) : 0;
            return (
              <tr key={b.id} className="transition-colors hover:bg-neutral-800/30">
                <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                  <Building className="h-4 w-4 text-white/40" />
                  {b.category}
                </td>
                <td className="px-6 py-4 text-white/60">{b.period}</td>
                <td className="px-6 py-4 text-right font-mono">${b.limit_amount.toFixed(2)}</td>
                <td className="px-6 py-4 text-right font-mono">${actual.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-full max-w-[100px] rounded-full bg-neutral-900 overflow-hidden">
                      <div className={`h-full rounded-full ${pct > 90 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${pct}%` }}></div>
                    </div>
                    <span className="font-mono text-xs">${remaining.toFixed(2)}</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function VarianceAnalysis({ budgets, transactions }: { budgets: BudgetItem[]; transactions: TransactionItem[] }) {
  const rows = useMemo(() => budgets.map((budget) => {
    const actual = getBudgetActual(budget, transactions);
    return {
      budget,
      actual,
      variance: budget.limit_amount - actual,
      percentUsed: budget.limit_amount > 0 ? (actual / budget.limit_amount) * 100 : 0,
    };
  }), [budgets, transactions]);

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-6 py-4 font-semibold">Budget</th>
            <th className="px-6 py-4 font-semibold text-right">Limit</th>
            <th className="px-6 py-4 font-semibold text-right">Actual</th>
            <th className="px-6 py-4 font-semibold text-right">Variance</th>
            <th className="px-6 py-4 font-semibold">Use</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {rows.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-white/40">Create budgets and expense transactions to see variance analysis.</td></tr>}
          {rows.map(({ budget, actual, variance, percentUsed }) => (
            <tr key={budget.id}>
              <td className="px-6 py-4 font-bold text-white">{budget.category}</td>
              <td className="px-6 py-4 text-right font-mono">${budget.limit_amount.toFixed(2)}</td>
              <td className="px-6 py-4 text-right font-mono">${actual.toFixed(2)}</td>
              <td className={`px-6 py-4 text-right font-mono ${variance < 0 ? "text-red-300" : "text-green-300"}`}>${variance.toFixed(2)}</td>
              <td className="px-6 py-4">{percentUsed.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScenarioModeling({ budgets, transactions }: { budgets: BudgetItem[]; transactions: TransactionItem[] }) {
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.limit_amount, 0);
  const totalActual = budgets.reduce((sum, budget) => sum + getBudgetActual(budget, transactions), 0);
  const burnChange = totalActual * 0.1;

  return (
    <div className="text-center py-16 rounded-xl border border-neutral-800 bg-neutral-950/50">
      <TrendingUp className="h-10 w-10 text-white/20 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-white">What-If Scenarios</h3>
      <p className="text-sm text-white/50 max-w-md mx-auto mt-2">This scenario uses current budgets and expense transactions instead of a saved template.</p>
      <div className="mx-auto mt-6 grid max-w-2xl gap-3 md:grid-cols-3">
        <ScenarioMetric label="Base Budget" value={`$${totalBudget.toFixed(2)}`} />
        <ScenarioMetric label="Actual Spend" value={`$${totalActual.toFixed(2)}`} />
        <ScenarioMetric label="+10% Spend Case" value={`$${(totalActual + burnChange).toFixed(2)}`} />
      </div>
    </div>
  );
}

function ScenarioMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-2 text-xl font-black text-white">{value}</p>
    </div>
  );
}

function CreateBudgetModal({ onClose, onSaved }: { onClose: () => void, onSaved: () => void }) {
  const [category, setCategory] = useState("");
  const [period, setPeriod] = useState("FY2026");
  const [amount, setAmount] = useState("0");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await invoke("create_budget", {
        input: { category, limit_amount: parseFloat(amount) || 0, period }
      });
      onSaved();
      onClose();
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">New Budget</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase">Category / Department</label>
            <input required value={category} onChange={e => setCategory(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" placeholder="e.g. Engineering" />
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase">Period</label>
            <input required value={period} onChange={e => setPeriod(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" placeholder="e.g. FY2026 Q3" />
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase">Limit Amount</label>
            <input type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" />
          </div>
          <button disabled={saving} type="submit" className="w-full mt-4 rounded-xl bg-yellow-400 py-3 font-bold text-black hover:bg-yellow-300 transition-colors">
            {saving ? "Saving..." : "Create Budget"}
          </button>
        </form>
      </div>
    </div>
  );
}
