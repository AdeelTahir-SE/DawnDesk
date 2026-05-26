import { useState } from "react";
import { ShoppingCart, Plus, Search, CheckCircle2, AlertTriangle, Clock, MoreHorizontal } from "lucide-react";

export default function ProcurementView() {
  const [activeTab, setActiveTab] = useState("po");

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in zoom-in-95 duration-300">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg">
          <p className="text-xs font-semibold text-white/50">Open Purchase Orders</p>
          <p className="mt-2 text-3xl font-black text-white">$45,200</p>
          <p className="mt-1 text-xs text-yellow-400">14 active POs</p>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg">
          <p className="text-xs font-semibold text-white/50">Pending Approvals</p>
          <p className="mt-2 text-3xl font-black text-white">5</p>
          <p className="mt-1 text-xs text-orange-400">Requires your review</p>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg">
          <p className="text-xs font-semibold text-white/50">Total Spend YTD</p>
          <p className="mt-2 text-3xl font-black text-white">$214,500</p>
          <p className="mt-1 text-xs text-white/40">Across 32 vendors</p>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-lg shadow-black/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-yellow-400" />
              Procurement
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                placeholder="Search POs..."
                className="w-full sm:w-64 rounded-xl border border-neutral-800 bg-neutral-950 px-9 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-yellow-400/60"
              />
            </div>
            <button className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-yellow-300">
              <Plus className="h-4 w-4" />
              Create PO
            </button>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-6 border-b border-neutral-800">
          <button
            onClick={() => setActiveTab("po")}
            className={`pb-3 text-sm font-bold transition-colors ${
              activeTab === "po"
                ? "border-b-2 border-yellow-400 text-yellow-400"
                : "border-b-2 border-transparent text-white/50 hover:text-white"
            }`}
          >
            Purchase Orders
          </button>
          <button
            onClick={() => setActiveTab("vendors")}
            className={`pb-3 text-sm font-bold transition-colors ${
              activeTab === "vendors"
                ? "border-b-2 border-yellow-400 text-yellow-400"
                : "border-b-2 border-transparent text-white/50 hover:text-white"
            }`}
          >
            Vendor Directory
          </button>
        </div>

        <div className="mt-6">
          {activeTab === "po" ? <PurchaseOrdersTable /> : <VendorsTable />}
        </div>
      </section>
    </div>
  );
}

function PurchaseOrdersTable() {
  const pos = [
    { id: "PO-1042", vendor: "Dell Technologies", date: "2026-05-20", amount: "$12,500.00", status: "Pending Approval" },
    { id: "PO-1041", vendor: "WeWork Office", date: "2026-05-18", amount: "$5,000.00", status: "Approved" },
    { id: "PO-1040", vendor: "Staples Office Supply", date: "2026-05-15", amount: "$850.00", status: "Received" },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-6 py-4 font-semibold">PO Number</th>
            <th className="px-6 py-4 font-semibold">Vendor</th>
            <th className="px-6 py-4 font-semibold">Request Date</th>
            <th className="px-6 py-4 font-semibold text-right">Amount</th>
            <th className="px-6 py-4 font-semibold">Status</th>
            <th className="px-6 py-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {pos.map((po, i) => (
            <tr key={i} className="transition-colors hover:bg-neutral-800/30">
              <td className="px-6 py-4 font-mono font-bold text-white">{po.id}</td>
              <td className="px-6 py-4 font-bold">{po.vendor}</td>
              <td className="px-6 py-4 text-white/60">{po.date}</td>
              <td className="px-6 py-4 text-right font-mono text-white">{po.amount}</td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full ${po.status === 'Received' ? 'bg-blue-500/10 text-blue-400' : po.status === 'Approved' ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'}`}>
                  {po.status === 'Received' ? <CheckCircle2 className="h-3 w-3" /> : po.status === 'Approved' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  {po.status}
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

function VendorsTable() {
  const vendors = [
    { name: "Dell Technologies", category: "Hardware", terms: "Net 30", contact: "sales@dell.com", rating: "Excellent" },
    { name: "AWS Web Services", category: "Software", terms: "Due on Receipt", contact: "billing@aws.amazon.com", rating: "Excellent" },
    { name: "Staples Office Supply", category: "Supplies", terms: "Net 15", contact: "corp@staples.com", rating: "Good" },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-6 py-4 font-semibold">Vendor Name</th>
            <th className="px-6 py-4 font-semibold">Category</th>
            <th className="px-6 py-4 font-semibold">Payment Terms</th>
            <th className="px-6 py-4 font-semibold">Contact Email</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {vendors.map((v, i) => (
            <tr key={i} className="transition-colors hover:bg-neutral-800/30">
              <td className="px-6 py-4 font-bold text-white">{v.name}</td>
              <td className="px-6 py-4 text-white/60">{v.category}</td>
              <td className="px-6 py-4 text-white">{v.terms}</td>
              <td className="px-6 py-4 text-white/60">{v.contact}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
