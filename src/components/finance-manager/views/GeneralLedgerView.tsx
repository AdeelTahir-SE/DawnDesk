import { useState } from "react";
import { Plus, Search, BookOpen, Layers, ArrowRightLeft, DollarSign, CheckCircle2, MoreHorizontal, Settings, Globe, CheckSquare } from "lucide-react";

export default function GeneralLedgerView() {
  const [activeTab, setActiveTab] = useState("journal");

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in zoom-in-95 duration-300">
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-lg shadow-black/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-400">Core Financials</p>
            <h2 className="mt-2 font-heading text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-yellow-400" />
              General Ledger
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/60">
              Manage chart of accounts, post journal entries, track period-end closes, and multi-currency.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                placeholder="Search ledger..."
                className="w-full sm:w-64 rounded-xl border border-neutral-800 bg-neutral-950 px-9 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-yellow-400/60"
              />
            </div>
            <button className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-yellow-300">
              <Plus className="h-4 w-4" />
              New Entry
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-6 border-b border-neutral-800">
          <button
            onClick={() => setActiveTab("journal")}
            className={`pb-3 text-sm font-bold transition-colors ${
              activeTab === "journal"
                ? "border-b-2 border-yellow-400 text-yellow-400"
                : "border-b-2 border-transparent text-white/50 hover:text-white"
            }`}
          >
            Journal Entries
          </button>
          <button
            onClick={() => setActiveTab("accounts")}
            className={`pb-3 text-sm font-bold transition-colors ${
              activeTab === "accounts"
                ? "border-b-2 border-yellow-400 text-yellow-400"
                : "border-b-2 border-transparent text-white/50 hover:text-white"
            }`}
          >
            Chart of Accounts
          </button>
          <button
            onClick={() => setActiveTab("close")}
            className={`pb-3 text-sm font-bold transition-colors ${
              activeTab === "close"
                ? "border-b-2 border-yellow-400 text-yellow-400"
                : "border-b-2 border-transparent text-white/50 hover:text-white"
            }`}
          >
            Period-End Close
          </button>
          <button
            onClick={() => setActiveTab("currency")}
            className={`pb-3 text-sm font-bold transition-colors ${
              activeTab === "currency"
                ? "border-b-2 border-yellow-400 text-yellow-400"
                : "border-b-2 border-transparent text-white/50 hover:text-white"
            }`}
          >
            Multi-Currency
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`pb-3 text-sm font-bold transition-colors ${
              activeTab === "settings"
                ? "border-b-2 border-yellow-400 text-yellow-400"
                : "border-b-2 border-transparent text-white/50 hover:text-white"
            }`}
          >
            GL Settings
          </button>
        </div>

        <div className="mt-6">
          {activeTab === "journal" && <JournalEntriesTable />}
          {activeTab === "accounts" && <ChartOfAccountsTable />}
          {activeTab === "close" && <PeriodCloseTable />}
          {activeTab === "currency" && <MultiCurrencyTable />}
          {activeTab === "settings" && <GLSettings />}
        </div>
      </section>
    </div>
  );
}

function JournalEntriesTable() {
  const entries = [
    { id: "JE-1042", date: "2026-05-25", memo: "Monthly Rent Allocation", type: "Standard", status: "Posted", amount: "$5,000.00" },
    { id: "JE-1043", date: "2026-05-24", memo: "Depreciation Expense", type: "Standard", status: "Draft", amount: "$1,250.00" },
    { id: "JE-1044", date: "2026-05-20", memo: "Prepaid Ins Amortization", type: "Reversing", status: "Posted", amount: "$800.00" },
    { id: "JE-1045", date: "2026-05-18", memo: "Inter-company Transfer", type: "Elimination", status: "Posted", amount: "$24,500.00" },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-6 py-4 font-semibold">Entry ID</th>
            <th className="px-6 py-4 font-semibold">Date</th>
            <th className="px-6 py-4 font-semibold">Memo</th>
            <th className="px-6 py-4 font-semibold">Type</th>
            <th className="px-6 py-4 font-semibold text-right">Total Amount</th>
            <th className="px-6 py-4 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {entries.map((entry) => (
            <tr key={entry.id} className="transition-colors hover:bg-neutral-800/30">
              <td className="px-6 py-4 font-mono text-yellow-400">{entry.id}</td>
              <td className="px-6 py-4">{entry.date}</td>
              <td className="px-6 py-4">{entry.memo}</td>
              <td className="px-6 py-4">{entry.type}</td>
              <td className="px-6 py-4 text-right font-mono">{entry.amount}</td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${entry.status === "Posted" ? "bg-green-500/10 text-green-400" : "bg-neutral-500/10 text-neutral-400"}`}>
                  {entry.status === "Posted" && <CheckCircle2 className="h-3 w-3" />}
                  {entry.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChartOfAccountsTable() {
  const accounts = [
    { id: "1000", name: "Operating Bank Account", type: "Asset", isStat: false, balance: "$124,500.00" },
    { id: "2000", name: "Accounts Payable", type: "Liability", isStat: false, balance: "$18,400.00" },
    { id: "3000", name: "Retained Earnings", type: "Equity", isStat: false, balance: "$85,000.00" },
    { id: "9000", name: "Headcount (Employees)", type: "Statistical", isStat: true, balance: "42" },
    { id: "9010", name: "Square Footage", type: "Statistical", isStat: true, balance: "12,500" },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-6 py-4 font-semibold">Account Code</th>
            <th className="px-6 py-4 font-semibold">Account Name</th>
            <th className="px-6 py-4 font-semibold">Type</th>
            <th className="px-6 py-4 font-semibold text-right">Current Balance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {accounts.map((acc) => (
            <tr key={acc.id} className="transition-colors hover:bg-neutral-800/30">
              <td className="px-6 py-4 font-mono text-white/60">{acc.id}</td>
              <td className="px-6 py-4 font-bold text-white">{acc.name}</td>
              <td className="px-6 py-4">
                <span className={`rounded-lg border px-2 py-1 text-xs ${acc.isStat ? 'border-blue-500/30 bg-blue-500/10 text-blue-400' : 'border-neutral-800 bg-neutral-900'}`}>
                  {acc.type}
                </span>
              </td>
              <td className="px-6 py-4 text-right font-mono">{acc.balance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PeriodCloseTable() {
  const checklists = [
    { period: "May 2026", task: "Reconcile Bank Accounts", assigned: "Sarah Jenkins", status: "Pending" },
    { period: "May 2026", task: "Post Depreciation", assigned: "Mike Ross", status: "Pending" },
    { period: "April 2026", task: "Lock Accounting Period", assigned: "System", status: "Completed" },
    { period: "April 2026", task: "Run Inter-company Eliminations", assigned: "System", status: "Completed" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-white text-lg flex items-center gap-2"><CheckSquare className="h-5 w-5 text-yellow-400" /> Close Checklist</h3>
        <button className="text-sm text-yellow-400 font-bold hover:text-yellow-300">Manage Checklists</button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
        <table className="w-full text-left text-sm text-white/80">
          <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
            <tr>
              <th className="px-6 py-4 font-semibold">Period</th>
              <th className="px-6 py-4 font-semibold">Task</th>
              <th className="px-6 py-4 font-semibold">Assigned To</th>
              <th className="px-6 py-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {checklists.map((c, i) => (
              <tr key={i} className="transition-colors hover:bg-neutral-800/30">
                <td className="px-6 py-4 font-bold">{c.period}</td>
                <td className="px-6 py-4">{c.task}</td>
                <td className="px-6 py-4 text-white/60">{c.assigned}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${c.status === "Completed" ? "bg-green-500/10 text-green-400" : "bg-orange-500/10 text-orange-400"}`}>
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MultiCurrencyTable() {
  const rates = [
    { pair: "USD / EUR", rate: "0.9245", date: "2026-05-26", source: "Auto-sync (OANDA)" },
    { pair: "USD / GBP", rate: "0.7820", date: "2026-05-26", source: "Auto-sync (OANDA)" },
    { pair: "USD / CAD", rate: "1.3610", date: "2026-05-26", source: "Auto-sync (OANDA)" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-white text-lg flex items-center gap-2"><Globe className="h-5 w-5 text-yellow-400" /> Exchange Rates</h3>
        <button className="text-sm text-yellow-400 font-bold hover:text-yellow-300">Force Sync</button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
        <table className="w-full text-left text-sm text-white/80">
          <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
            <tr>
              <th className="px-6 py-4 font-semibold">Currency Pair</th>
              <th className="px-6 py-4 font-semibold">Exchange Rate</th>
              <th className="px-6 py-4 font-semibold">Last Updated</th>
              <th className="px-6 py-4 font-semibold">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {rates.map((r, i) => (
              <tr key={i} className="transition-colors hover:bg-neutral-800/30">
                <td className="px-6 py-4 font-bold text-white">{r.pair}</td>
                <td className="px-6 py-4 font-mono text-green-400 font-bold">{r.rate}</td>
                <td className="px-6 py-4 text-white/60">{r.date}</td>
                <td className="px-6 py-4 text-white/50">{r.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GLSettings() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-6">
        <h3 className="font-bold text-white text-lg flex items-center gap-2 mb-4"><Settings className="h-5 w-5 text-yellow-400" /> GL Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-2">Fiscal Year Start</label>
            <select className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none">
              <option>January 1st</option>
              <option>April 1st</option>
              <option>July 1st</option>
              <option>October 1st</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-2">Base Currency</label>
            <select className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none">
              <option>USD - US Dollar</option>
              <option>EUR - Euro</option>
              <option>GBP - British Pound</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
