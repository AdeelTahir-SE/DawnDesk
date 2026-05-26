import { useState } from "react";
import { Plus, Search, PieChart, TrendingUp, BarChart3, MoreHorizontal } from "lucide-react";

export default function BudgetingForecastingView() {
  const [activeTab, setActiveTab] = useState("budgets");

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in zoom-in-95 duration-300">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg">
          <p className="text-xs font-semibold text-white/50">Total Budget (FY26)</p>
          <p className="mt-2 text-3xl font-black text-white">$1,200,000</p>
          <p className="mt-1 text-xs text-white/40">Operating Expenses</p>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg">
          <p className="text-xs font-semibold text-white/50">YTD Actuals</p>
          <p className="mt-2 text-3xl font-black text-white">$485,200</p>
          <p className="mt-1 text-xs text-green-400">12% under budget</p>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg">
          <p className="text-xs font-semibold text-white/50">Active Scenarios</p>
          <p className="mt-2 text-3xl font-black text-yellow-400">3</p>
          <p className="mt-1 text-xs text-white/40">Base, Best Case, Worst Case</p>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-lg shadow-black/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <PieChart className="h-6 w-6 text-yellow-400" />
              Budgeting & Forecasting
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-yellow-300">
              <Plus className="h-4 w-4" />
              New Budget
            </button>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-6 border-b border-neutral-800">
          <button
            onClick={() => setActiveTab("budgets")}
            className={`pb-3 text-sm font-bold transition-colors ${
              activeTab === "budgets"
                ? "border-b-2 border-yellow-400 text-yellow-400"
                : "border-b-2 border-transparent text-white/50 hover:text-white"
            }`}
          >
            Department Budgets
          </button>
          <button
            onClick={() => setActiveTab("scenarios")}
            className={`pb-3 text-sm font-bold transition-colors ${
              activeTab === "scenarios"
                ? "border-b-2 border-yellow-400 text-yellow-400"
                : "border-b-2 border-transparent text-white/50 hover:text-white"
            }`}
          >
            Scenario Planning
          </button>
        </div>

        <div className="mt-6">
          {activeTab === "budgets" ? <BudgetsTable /> : <ScenariosTable />}
        </div>
      </section>
    </div>
  );
}

function BudgetsTable() {
  const budgets = [
    { dept: "Engineering", allocated: "$450,000", spent: "$210,000", remaining: "$240,000", percent: 46 },
    { dept: "Marketing", allocated: "$300,000", spent: "$180,000", remaining: "$120,000", percent: 60 },
    { dept: "Sales", allocated: "$250,000", spent: "$85,000", remaining: "$165,000", percent: 34 },
    { dept: "G&A", allocated: "$200,000", spent: "$110,000", remaining: "$90,000", percent: 55 },
  ];

  return (
    <div className="space-y-4">
      {budgets.map((b, i) => (
        <div key={i} className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="w-48">
            <p className="font-bold text-white text-lg">{b.dept}</p>
            <p className="text-xs text-white/50">FY26 Operating Budget</p>
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-xs font-semibold text-white/60">
              <span>{b.percent}% Spent ({b.spent})</span>
              <span>{b.allocated} Total</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-neutral-800 overflow-hidden">
              <div 
                className={`h-full rounded-full ${b.percent > 75 ? 'bg-red-400' : 'bg-yellow-400'}`} 
                style={{ width: `${b.percent}%` }}
              />
            </div>
          </div>

          <div className="w-32 text-right">
            <p className="font-mono text-lg font-bold text-white">{b.remaining}</p>
            <p className="text-xs text-white/50">Remaining</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ScenariosTable() {
  const scenarios = [
    { name: "Base Case FY26", growth: "15%", headcount: "45", burn: "$100k/mo", status: "Active" },
    { name: "Best Case (Aggressive)", growth: "35%", headcount: "60", burn: "$140k/mo", status: "Draft" },
    { name: "Worst Case (Recession)", growth: "5%", headcount: "40", burn: "$85k/mo", status: "Draft" },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-6 py-4 font-semibold">Scenario Name</th>
            <th className="px-6 py-4 font-semibold">Proj. Growth</th>
            <th className="px-6 py-4 font-semibold">Headcount</th>
            <th className="px-6 py-4 font-semibold">Avg Burn</th>
            <th className="px-6 py-4 font-semibold">Status</th>
            <th className="px-6 py-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {scenarios.map((s, i) => (
            <tr key={i} className="transition-colors hover:bg-neutral-800/30">
              <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-white/40" />
                {s.name}
              </td>
              <td className="px-6 py-4 text-green-400 font-bold">{s.growth}</td>
              <td className="px-6 py-4 text-white">{s.headcount}</td>
              <td className="px-6 py-4 font-mono text-white/60">{s.burn}</td>
              <td className="px-6 py-4">
                <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${s.status === 'Active' ? 'bg-green-500/10 text-green-400' : 'bg-neutral-500/10 text-neutral-400'}`}>
                  {s.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <button className="text-white/40 hover:text-white transition-colors"><MoreHorizontal className="h-5 w-5 ml-auto" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
