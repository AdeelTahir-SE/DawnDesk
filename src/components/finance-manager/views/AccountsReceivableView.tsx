import { useState } from "react";
import { Plus, Search, ArrowDownRight, FileText, CheckCircle2, AlertTriangle, MoreHorizontal, DownloadCloud } from "lucide-react";

export default function AccountsReceivableView() {
  const [activeTab, setActiveTab] = useState("invoices");

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in zoom-in-95 duration-300">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg">
          <p className="text-xs font-semibold text-white/50">Total Outstanding</p>
          <p className="mt-2 text-3xl font-black text-white">$45,200.00</p>
          <p className="mt-1 text-xs text-yellow-400">across 12 open invoices</p>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg">
          <p className="text-xs font-semibold text-white/50">Overdue (1-30 Days)</p>
          <p className="mt-2 text-3xl font-black text-white">$8,450.00</p>
          <p className="mt-1 text-xs text-red-400">3 invoices need follow-up</p>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg">
          <p className="text-xs font-semibold text-white/50">Collected This Month</p>
          <p className="mt-2 text-3xl font-black text-green-400">$124,500.00</p>
          <p className="mt-1 text-xs text-white/40">+15% vs last month</p>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-lg shadow-black/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <ArrowDownRight className="h-6 w-6 text-yellow-400" />
              Accounts Receivable
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                placeholder="Search invoices, clients..."
                className="w-full sm:w-64 rounded-xl border border-neutral-800 bg-neutral-950 px-9 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-yellow-400/60"
              />
            </div>
            <button className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-yellow-300">
              <Plus className="h-4 w-4" />
              Create Invoice
            </button>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-6 border-b border-neutral-800">
          <button
            onClick={() => setActiveTab("invoices")}
            className={`pb-3 text-sm font-bold transition-colors ${
              activeTab === "invoices"
                ? "border-b-2 border-yellow-400 text-yellow-400"
                : "border-b-2 border-transparent text-white/50 hover:text-white"
            }`}
          >
            All Invoices
          </button>
          <button
            onClick={() => setActiveTab("aging")}
            className={`pb-3 text-sm font-bold transition-colors ${
              activeTab === "aging"
                ? "border-b-2 border-yellow-400 text-yellow-400"
                : "border-b-2 border-transparent text-white/50 hover:text-white"
            }`}
          >
            Aging Report
          </button>
        </div>

        <div className="mt-6">
          {activeTab === "invoices" ? <InvoicesTable /> : <AgingReportTable />}
        </div>
      </section>
    </div>
  );
}

function InvoicesTable() {
  const invoices = [
    { id: "INV-2026-001", client: "Acme Corp", date: "2026-05-01", due: "2026-05-31", amount: "$15,000.00", status: "Open" },
    { id: "INV-2026-002", client: "Stark Industries", date: "2026-04-15", due: "2026-05-15", amount: "$8,450.00", status: "Overdue" },
    { id: "INV-2026-003", client: "Wayne Enterprises", date: "2026-05-10", due: "2026-06-10", amount: "$22,500.00", status: "Open" },
    { id: "INV-2026-004", client: "Oscorp", date: "2026-05-20", due: "Due on Receipt", amount: "$4,200.00", status: "Paid" },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-6 py-4 font-semibold">Invoice #</th>
            <th className="px-6 py-4 font-semibold">Client</th>
            <th className="px-6 py-4 font-semibold">Issue Date</th>
            <th className="px-6 py-4 font-semibold">Due Date</th>
            <th className="px-6 py-4 font-semibold text-right">Amount</th>
            <th className="px-6 py-4 font-semibold">Status</th>
            <th className="px-6 py-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {invoices.map((inv) => (
            <tr key={inv.id} className="transition-colors hover:bg-neutral-800/30">
              <td className="px-6 py-4 font-mono text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-white/40" />
                {inv.id}
              </td>
              <td className="px-6 py-4 font-bold">{inv.client}</td>
              <td className="px-6 py-4 text-white/60">{inv.date}</td>
              <td className="px-6 py-4 text-white/60">{inv.due}</td>
              <td className="px-6 py-4 text-right font-mono text-white">{inv.amount}</td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                    inv.status === "Paid"
                      ? "bg-green-500/10 text-green-400"
                      : inv.status === "Overdue"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-yellow-500/10 text-yellow-400"
                  }`}
                >
                  {inv.status === "Paid" && <CheckCircle2 className="h-3 w-3" />}
                  {inv.status === "Overdue" && <AlertTriangle className="h-3 w-3" />}
                  {inv.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                <button className="p-1.5 rounded-lg border border-neutral-700 bg-neutral-800 text-white/60 hover:text-white transition-colors">
                  <DownloadCloud className="h-4 w-4" />
                </button>
                <button className="text-white/40 hover:text-white transition-colors">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AgingReportTable() {
  const clients = [
    { name: "Stark Industries", current: "$0.00", "1-30": "$8,450.00", "31-60": "$0.00", "61-90": "$0.00", "90+": "$0.00", total: "$8,450.00" },
    { name: "Acme Corp", current: "$15,000.00", "1-30": "$0.00", "31-60": "$0.00", "61-90": "$0.00", "90+": "$0.00", total: "$15,000.00" },
    { name: "Wayne Enterprises", current: "$22,500.00", "1-30": "$0.00", "31-60": "$0.00", "61-90": "$0.00", "90+": "$0.00", total: "$22,500.00" },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-6 py-4 font-semibold">Client</th>
            <th className="px-6 py-4 font-semibold text-right">Current</th>
            <th className="px-6 py-4 font-semibold text-right text-yellow-400">1-30 Days</th>
            <th className="px-6 py-4 font-semibold text-right text-orange-400">31-60 Days</th>
            <th className="px-6 py-4 font-semibold text-right text-red-400">61-90 Days</th>
            <th className="px-6 py-4 font-semibold text-right text-red-500">90+ Days</th>
            <th className="px-6 py-4 font-semibold text-right font-bold text-white">Total Balance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {clients.map((c, i) => (
            <tr key={i} className="transition-colors hover:bg-neutral-800/30 font-mono">
              <td className="px-6 py-4 font-sans font-bold text-white">{c.name}</td>
              <td className="px-6 py-4 text-right text-white/60">{c.current}</td>
              <td className="px-6 py-4 text-right text-yellow-400/80">{c["1-30"]}</td>
              <td className="px-6 py-4 text-right text-orange-400/80">{c["31-60"]}</td>
              <td className="px-6 py-4 text-right text-red-400/80">{c["61-90"]}</td>
              <td className="px-6 py-4 text-right text-red-500/80">{c["90+"]}</td>
              <td className="px-6 py-4 text-right font-bold text-white">{c.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
