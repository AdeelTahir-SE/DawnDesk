import { useState } from "react";
import { Package, Plus, Search, Tag, ArrowRightLeft, Layers, MoreHorizontal, AlertCircle } from "lucide-react";

export default function InventoryCogsView() {
  const [activeTab, setActiveTab] = useState("inventory");

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in zoom-in-95 duration-300">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg">
          <p className="text-xs font-semibold text-white/50">Total Inventory Value (FIFO)</p>
          <p className="mt-2 text-3xl font-black text-white">$124,500</p>
          <p className="mt-1 text-xs text-white/40">Across 3 warehouses</p>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg">
          <p className="text-xs font-semibold text-white/50">Low Stock Alerts</p>
          <p className="mt-2 text-3xl font-black text-orange-400">4</p>
          <p className="mt-1 text-xs text-orange-400/80">Items below reorder point</p>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg">
          <p className="text-xs font-semibold text-white/50">COGS (YTD)</p>
          <p className="mt-2 text-3xl font-black text-white">$45,200</p>
          <p className="mt-1 text-xs text-green-400">12% margin improvement</p>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-lg shadow-black/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Package className="h-6 w-6 text-yellow-400" />
              Inventory & COGS
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                placeholder="Search items, SKUs..."
                className="w-full sm:w-64 rounded-xl border border-neutral-800 bg-neutral-950 px-9 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-yellow-400/60"
              />
            </div>
            <button className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-yellow-300">
              <Plus className="h-4 w-4" />
              Add Item
            </button>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-6 border-b border-neutral-800">
          <button
            onClick={() => setActiveTab("inventory")}
            className={`pb-3 text-sm font-bold transition-colors ${
              activeTab === "inventory"
                ? "border-b-2 border-yellow-400 text-yellow-400"
                : "border-b-2 border-transparent text-white/50 hover:text-white"
            }`}
          >
            Stock Levels
          </button>
          <button
            onClick={() => setActiveTab("adjustments")}
            className={`pb-3 text-sm font-bold transition-colors ${
              activeTab === "adjustments"
                ? "border-b-2 border-yellow-400 text-yellow-400"
                : "border-b-2 border-transparent text-white/50 hover:text-white"
            }`}
          >
            Adjustments
          </button>
        </div>

        <div className="mt-6">
          {activeTab === "inventory" ? <InventoryTable /> : <AdjustmentsTable />}
        </div>
      </section>
    </div>
  );
}

function InventoryTable() {
  const items = [
    { sku: "SKU-9901", name: "Premium Widget V2", qty: "450", cost: "$12.50", total: "$5,625.00", status: "In Stock" },
    { sku: "SKU-9902", name: "Standard Gadget", qty: "12", cost: "$8.00", total: "$96.00", status: "Low Stock" },
    { sku: "SKU-9903", name: "Enterprise Server Unit", qty: "4", cost: "$4,500.00", total: "$18,000.00", status: "In Stock" },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-6 py-4 font-semibold">SKU</th>
            <th className="px-6 py-4 font-semibold">Item Name</th>
            <th className="px-6 py-4 font-semibold text-right">Quantity</th>
            <th className="px-6 py-4 font-semibold text-right">Unit Cost</th>
            <th className="px-6 py-4 font-semibold text-right">Total Value</th>
            <th className="px-6 py-4 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {items.map((item, i) => (
            <tr key={i} className="transition-colors hover:bg-neutral-800/30">
              <td className="px-6 py-4 font-mono text-white/50">{item.sku}</td>
              <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                <Tag className="h-4 w-4 text-white/40" />
                {item.name}
              </td>
              <td className="px-6 py-4 text-right font-mono font-bold text-white">{item.qty}</td>
              <td className="px-6 py-4 text-right font-mono">{item.cost}</td>
              <td className="px-6 py-4 text-right font-mono font-bold">{item.total}</td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full ${item.status === 'Low Stock' ? 'bg-orange-500/10 text-orange-400' : 'bg-green-500/10 text-green-400'}`}>
                  {item.status === 'Low Stock' && <AlertCircle className="h-3 w-3" />}
                  {item.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdjustmentsTable() {
  const adjustments = [
    { date: "2026-05-25", reason: "Damage Write-off", account: "5100 - COGS Write-offs", amount: "-$125.00" },
    { date: "2026-05-20", reason: "Physical Count Variance", account: "5110 - Inventory Shrinkage", amount: "+$45.00" },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-6 py-4 font-semibold">Date</th>
            <th className="px-6 py-4 font-semibold">Reason</th>
            <th className="px-6 py-4 font-semibold">Offset GL Account</th>
            <th className="px-6 py-4 font-semibold text-right">Adjustment Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {adjustments.map((a, i) => (
            <tr key={i} className="transition-colors hover:bg-neutral-800/30">
              <td className="px-6 py-4 text-white/60">{a.date}</td>
              <td className="px-6 py-4 font-bold text-white">{a.reason}</td>
              <td className="px-6 py-4 text-white/60">{a.account}</td>
              <td className={`px-6 py-4 text-right font-mono font-bold ${a.amount.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>
                {a.amount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
