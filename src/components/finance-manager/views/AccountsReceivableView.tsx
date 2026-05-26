import { useState } from "react";
import { Plus, Search, ArrowDownRight, FileText, CheckCircle2, AlertTriangle, MoreHorizontal, DownloadCloud, Repeat, Mail, DollarSign, Calendar } from "lucide-react";

export default function AccountsReceivableView() {
  const [activeTab, setActiveTab] = useState("invoices");

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in zoom-in-95 duration-300">
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg">
          <p className="text-xs font-semibold text-white/50">Total Outstanding</p>
          <p className="mt-2 text-2xl font-black text-white">$45,200.00</p>
          <p className="mt-1 text-xs text-yellow-400">across 12 open invoices</p>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg">
          <p className="text-xs font-semibold text-white/50">Overdue (1-30 Days)</p>
          <p className="mt-2 text-2xl font-black text-white">$8,450.00</p>
          <p className="mt-1 text-xs text-red-400">3 invoices in Dunning</p>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg">
          <p className="text-xs font-semibold text-white/50">Unapplied Cash</p>
          <p className="mt-2 text-2xl font-black text-orange-400">$2,400.00</p>
          <p className="mt-1 text-xs text-white/40">Requires cash application</p>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg">
          <p className="text-xs font-semibold text-white/50">Recurring MRR</p>
          <p className="mt-2 text-2xl font-black text-green-400">$12,500.00</p>
          <p className="mt-1 text-xs text-white/40">From 8 subscriptions</p>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-lg shadow-black/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <ArrowDownRight className="h-6 w-6 text-yellow-400" />
              Accounts Receivable
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/60">
              Invoicing, recurring billing, dunning, cash application, and revenue recognition.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                placeholder="Search AR..."
                className="w-full sm:w-64 rounded-xl border border-neutral-800 bg-neutral-950 px-9 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-yellow-400/60"
              />
            </div>
            <button className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-yellow-300">
              <Plus className="h-4 w-4" />
              Create Invoice
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-6 border-b border-neutral-800">
          <button onClick={() => setActiveTab("invoices")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "invoices" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Invoices & Credits</button>
          <button onClick={() => setActiveTab("aging")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "aging" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Aging Report</button>
          <button onClick={() => setActiveTab("recurring")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "recurring" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Recurring Billing</button>
          <button onClick={() => setActiveTab("dunning")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "dunning" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Dunning & Statements</button>
          <button onClick={() => setActiveTab("cash")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "cash" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Cash Application</button>
          <button onClick={() => setActiveTab("revrec")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "revrec" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Revenue Rec (ASC 606)</button>
        </div>

        <div className="mt-6">
          {activeTab === "invoices" && <InvoicesTable />}
          {activeTab === "aging" && <AgingReportTable />}
          {activeTab === "recurring" && <RecurringBillingTable />}
          {activeTab === "dunning" && <DunningTable />}
          {activeTab === "cash" && <CashApplicationTable />}
          {activeTab === "revrec" && <RevRecTable />}
        </div>
      </section>
    </div>
  );
}

function InvoicesTable() {
  const invoices = [
    { id: "INV-2026-001", type: "Invoice", client: "Acme Corp", due: "2026-05-31", amount: "$15,000.00", status: "Open" },
    { id: "INV-2026-002", type: "Invoice", client: "Stark Industries", due: "2026-05-15", amount: "$8,450.00", status: "Overdue" },
    { id: "CR-2026-001", type: "Credit Memo", client: "Stark Industries", due: "N/A", amount: "-$500.00", status: "Applied" },
    { id: "INV-2026-004", type: "Invoice", client: "Oscorp", due: "Due on Receipt", amount: "$4,200.00", status: "Paid" },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-6 py-4 font-semibold">Document #</th>
            <th className="px-6 py-4 font-semibold">Type</th>
            <th className="px-6 py-4 font-semibold">Client</th>
            <th className="px-6 py-4 font-semibold">Terms / Due Date</th>
            <th className="px-6 py-4 font-semibold text-right">Amount</th>
            <th className="px-6 py-4 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {invoices.map((inv, i) => (
            <tr key={i} className="transition-colors hover:bg-neutral-800/30">
              <td className="px-6 py-4 font-mono text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-white/40" />
                {inv.id}
              </td>
              <td className="px-6 py-4 text-white/60">{inv.type}</td>
              <td className="px-6 py-4 font-bold">{inv.client}</td>
              <td className="px-6 py-4 text-white/60">{inv.due}</td>
              <td className="px-6 py-4 text-right font-mono text-white">{inv.amount}</td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${inv.status === "Paid" || inv.status === "Applied" ? "bg-green-500/10 text-green-400" : inv.status === "Overdue" ? "bg-red-500/10 text-red-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                  {inv.status}
                </span>
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
  ];
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-6 py-4 font-semibold">Client</th>
            <th className="px-6 py-4 font-semibold text-right">Current</th>
            <th className="px-6 py-4 font-semibold text-right text-yellow-400">1-30 Days</th>
            <th className="px-6 py-4 font-semibold text-right text-red-400">31-60 Days</th>
            <th className="px-6 py-4 font-semibold text-right font-bold text-white">Total Balance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {clients.map((c, i) => (
            <tr key={i} className="transition-colors hover:bg-neutral-800/30 font-mono">
              <td className="px-6 py-4 font-sans font-bold text-white">{c.name}</td>
              <td className="px-6 py-4 text-right text-white/60">{c.current}</td>
              <td className="px-6 py-4 text-right text-yellow-400/80">{c["1-30"]}</td>
              <td className="px-6 py-4 text-right text-red-400/80">{c["31-60"]}</td>
              <td className="px-6 py-4 text-right font-bold text-white">{c.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RecurringBillingTable() {
  const subscriptions = [
    { client: "Wayne Enterprises", plan: "Enterprise SaaS", frequency: "Monthly", nextBilling: "2026-06-01", amount: "$5,000.00" },
    { client: "Oscorp", plan: "Pro SaaS", frequency: "Annually", nextBilling: "2027-01-01", amount: "$12,000.00" },
  ];
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-6 py-4 font-semibold">Client</th>
            <th className="px-6 py-4 font-semibold">Plan/Item</th>
            <th className="px-6 py-4 font-semibold">Frequency</th>
            <th className="px-6 py-4 font-semibold">Next Billing Date</th>
            <th className="px-6 py-4 font-semibold text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {subscriptions.map((s, i) => (
            <tr key={i} className="transition-colors hover:bg-neutral-800/30">
              <td className="px-6 py-4 font-bold">{s.client}</td>
              <td className="px-6 py-4">{s.plan}</td>
              <td className="px-6 py-4"><span className="rounded-full bg-neutral-800 px-2 py-1 text-xs">{s.frequency}</span></td>
              <td className="px-6 py-4 text-white/60">{s.nextBilling}</td>
              <td className="px-6 py-4 text-right font-mono font-bold text-white">{s.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DunningTable() {
  const logs = [
    { client: "Stark Industries", invoice: "INV-2026-002", daysOverdue: 11, action: "Sent Reminder 2", date: "2026-05-26" },
  ];
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-white text-lg flex items-center gap-2"><Mail className="h-5 w-5 text-yellow-400" /> Automated Dunning Activity</h3>
        <button className="text-sm text-yellow-400 font-bold hover:text-yellow-300">Generate Statements</button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
        <table className="w-full text-left text-sm text-white/80">
          <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
            <tr>
              <th className="px-6 py-4 font-semibold">Client</th>
              <th className="px-6 py-4 font-semibold">Invoice Ref</th>
              <th className="px-6 py-4 font-semibold">Days Overdue</th>
              <th className="px-6 py-4 font-semibold">Automated Action</th>
              <th className="px-6 py-4 font-semibold">Date Sent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {logs.map((l, i) => (
              <tr key={i} className="transition-colors hover:bg-neutral-800/30">
                <td className="px-6 py-4 font-bold">{l.client}</td>
                <td className="px-6 py-4 font-mono text-white/60">{l.invoice}</td>
                <td className="px-6 py-4 text-red-400 font-bold">{l.daysOverdue} Days</td>
                <td className="px-6 py-4">{l.action}</td>
                <td className="px-6 py-4">{l.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CashApplicationTable() {
  return (
    <div className="text-center py-16 rounded-xl border border-neutral-800 bg-neutral-950/50">
      <DollarSign className="h-10 w-10 text-white/20 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-white">Unapplied Cash Receipts</h3>
      <p className="text-sm text-white/50 max-w-md mx-auto mt-2">There is a $2,400 incoming wire from Unknown Client. Apply this cash to an open invoice to close it out.</p>
      <button className="mt-6 rounded-xl bg-neutral-800 px-4 py-2 text-sm font-bold text-white hover:bg-neutral-700">Apply Cash Manually</button>
    </div>
  );
}

function RevRecTable() {
  const schedules = [
    { client: "Oscorp", total: "$12,000", term: "12 Months", recognized: "$5,000", deferred: "$7,000" },
  ];
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-6 py-4 font-semibold">Client</th>
            <th className="px-6 py-4 font-semibold">Total Contract Value</th>
            <th className="px-6 py-4 font-semibold">Amortization Term</th>
            <th className="px-6 py-4 font-semibold text-green-400">Recognized Revenue</th>
            <th className="px-6 py-4 font-semibold text-yellow-400">Deferred Revenue</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {schedules.map((s, i) => (
            <tr key={i} className="transition-colors hover:bg-neutral-800/30">
              <td className="px-6 py-4 font-bold text-white">{s.client}</td>
              <td className="px-6 py-4 font-mono">{s.total}</td>
              <td className="px-6 py-4">{s.term}</td>
              <td className="px-6 py-4 font-mono text-green-400">{s.recognized}</td>
              <td className="px-6 py-4 font-mono text-yellow-400">{s.deferred}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
