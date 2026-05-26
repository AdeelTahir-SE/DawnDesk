import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Plus, PieChart, BarChart3, Building, Loader2, X, TrendingUp } from "lucide-react";

export type BudgetItem = {
  id: number;
  category: string;
  limit_amount: number;
  period: string;
};

export default function BudgetingForecastingView() {
  const [activeTab, setActiveTab] = useState("budgets");
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await invoke<BudgetItem[]>("get_budgets");
      setBudgets(res);
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
              {activeTab === "budgets" && <BudgetsTable budgets={budgets} />}
              {activeTab === "variance" && <VarianceAnalysis />}
              {activeTab === "scenarios" && <ScenarioModeling />}
            </>
          )}
        </div>
      </section>

      {showModal && <CreateBudgetModal onClose={() => setShowModal(false)} onSaved={loadData} />}
    </div>
  );
}

function BudgetsTable({ budgets }: { budgets: BudgetItem[] }) {
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
            const actual = 0; // Mock actual spend for now
            const remaining = b.limit_amount - actual;
            const pct = (actual / b.limit_amount) * 100;
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

function VarianceAnalysis() {
  return (
    <div className="text-center py-16 rounded-xl border border-neutral-800 bg-neutral-950/50">
      <BarChart3 className="h-10 w-10 text-white/20 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-white">Budget vs Actual (BvA)</h3>
      <p className="text-sm text-white/50 max-w-md mx-auto mt-2">Compare real-time GL actuals against forecasted budget limits.</p>
      <button className="mt-6 rounded-xl bg-neutral-800 px-4 py-2 text-sm font-bold text-white hover:bg-neutral-700">Generate BvA Report</button>
    </div>
  );
}

function ScenarioModeling() {
  return (
    <div className="text-center py-16 rounded-xl border border-neutral-800 bg-neutral-950/50">
      <TrendingUp className="h-10 w-10 text-white/20 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-white">What-If Scenarios</h3>
      <p className="text-sm text-white/50 max-w-md mx-auto mt-2">Model hiring plans, market downturns, and pricing changes to see EBITDA impact.</p>
      <button className="mt-6 rounded-xl bg-neutral-800 px-4 py-2 text-sm font-bold text-white hover:bg-neutral-700">Create New Scenario</button>
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
