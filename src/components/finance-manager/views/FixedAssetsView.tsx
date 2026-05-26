import { useState } from "react";
import { Building, Plus, Search, Layers, Activity, FileCheck, MoreHorizontal } from "lucide-react";

export default function FixedAssetsView() {
  const [activeTab, setActiveTab] = useState("register");

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in zoom-in-95 duration-300">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg">
          <p className="text-xs font-semibold text-white/50">Total Asset Value (NBV)</p>
          <p className="mt-2 text-3xl font-black text-white">$845,200</p>
          <p className="mt-1 text-xs text-white/40">Across 24 active assets</p>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg">
          <p className="text-xs font-semibold text-white/50">Accumulated Depreciation</p>
          <p className="mt-2 text-3xl font-black text-orange-400">$124,500</p>
          <p className="mt-1 text-xs text-white/40">YTD Depreciation: $14,200</p>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg">
          <p className="text-xs font-semibold text-white/50">Upcoming Disposals</p>
          <p className="mt-2 text-3xl font-black text-white">2</p>
          <p className="mt-1 text-xs text-red-400">Assets reaching end of life</p>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-lg shadow-black/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Building className="h-6 w-6 text-yellow-400" />
              Fixed Assets
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                placeholder="Search assets..."
                className="w-full sm:w-64 rounded-xl border border-neutral-800 bg-neutral-950 px-9 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-yellow-400/60"
              />
            </div>
            <button className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-yellow-300">
              <Plus className="h-4 w-4" />
              Capitalize Asset
            </button>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-6 border-b border-neutral-800">
          <button
            onClick={() => setActiveTab("register")}
            className={`pb-3 text-sm font-bold transition-colors ${
              activeTab === "register"
                ? "border-b-2 border-yellow-400 text-yellow-400"
                : "border-b-2 border-transparent text-white/50 hover:text-white"
            }`}
          >
            Asset Register
          </button>
          <button
            onClick={() => setActiveTab("depreciation")}
            className={`pb-3 text-sm font-bold transition-colors ${
              activeTab === "depreciation"
                ? "border-b-2 border-yellow-400 text-yellow-400"
                : "border-b-2 border-transparent text-white/50 hover:text-white"
            }`}
          >
            Depreciation Schedules
          </button>
        </div>

        <div className="mt-6">
          {activeTab === "register" ? <AssetRegisterTable /> : <DepreciationTable />}
        </div>
      </section>
    </div>
  );
}

function AssetRegisterTable() {
  const assets = [
    { id: "AST-001", name: "HQ Office Renovation", class: "Leasehold", date: "2024-01-15", cost: "$450,000", nbv: "$315,000", status: "Active" },
    { id: "AST-002", name: "MacBook Pro Fleet (20x)", class: "IT Equipment", date: "2025-06-01", cost: "$50,000", nbv: "$33,333", status: "Active" },
    { id: "AST-003", name: "Office Furniture", class: "F&F", date: "2024-03-10", cost: "$25,000", nbv: "$15,000", status: "Active" },
    { id: "AST-004", name: "Old Server Rack", class: "IT Equipment", date: "2021-01-01", cost: "$12,000", nbv: "$0", status: "Disposed" },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-6 py-4 font-semibold">Asset ID</th>
            <th className="px-6 py-4 font-semibold">Name & Description</th>
            <th className="px-6 py-4 font-semibold">Asset Class</th>
            <th className="px-6 py-4 font-semibold text-right">Original Cost</th>
            <th className="px-6 py-4 font-semibold text-right">Net Book Value</th>
            <th className="px-6 py-4 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {assets.map((a, i) => (
            <tr key={i} className="transition-colors hover:bg-neutral-800/30">
              <td className="px-6 py-4 font-mono text-white/50">{a.id}</td>
              <td className="px-6 py-4 font-bold text-white">{a.name}</td>
              <td className="px-6 py-4 text-white/60">{a.class}</td>
              <td className="px-6 py-4 text-right font-mono">{a.cost}</td>
              <td className="px-6 py-4 text-right font-mono font-bold text-white">{a.nbv}</td>
              <td className="px-6 py-4">
                <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${a.status === 'Active' ? 'bg-green-500/10 text-green-400' : 'bg-neutral-500/10 text-neutral-400'}`}>
                  {a.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DepreciationTable() {
  const assets = [
    { name: "HQ Office Renovation", method: "Straight Line", life: "10 Years", monthly: "$3,750.00" },
    { name: "MacBook Pro Fleet (20x)", method: "Straight Line", life: "3 Years", monthly: "$1,388.89" },
    { name: "Office Furniture", method: "Double Declining", life: "5 Years", monthly: "$416.67" },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-6 py-4 font-semibold">Asset Name</th>
            <th className="px-6 py-4 font-semibold">Depreciation Method</th>
            <th className="px-6 py-4 font-semibold">Useful Life</th>
            <th className="px-6 py-4 font-semibold text-right">Monthly Depr. Expense</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {assets.map((a, i) => (
            <tr key={i} className="transition-colors hover:bg-neutral-800/30">
              <td className="px-6 py-4 font-bold text-white">{a.name}</td>
              <td className="px-6 py-4 text-white/60">{a.method}</td>
              <td className="px-6 py-4 text-white/60">{a.life}</td>
              <td className="px-6 py-4 text-right font-mono font-bold text-orange-400">{a.monthly}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
