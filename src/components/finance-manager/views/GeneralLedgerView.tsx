import { useState } from "react";
import { Plus, Search, BookOpen, Layers, ArrowRightLeft, DollarSign, CheckCircle2, MoreHorizontal } from "lucide-react";

export default function GeneralLedgerView() {
  const [activeTab, setActiveTab] = useState("journal");

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in zoom-in-95 duration-300">
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-lg shadow-black/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-400">Core Financials</p>
            <h2 className="mt-2 font-heading text-3xl font-black tracking-tight text-white">General Ledger</h2>
            <p className="mt-2 max-w-2xl text-sm text-white/60">
              Manage chart of accounts, post journal entries, and track period-end closes.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                placeholder="Search entries..."
                className="w-full sm:w-64 rounded-xl border border-neutral-800 bg-neutral-950 px-9 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-yellow-400/60"
              />
            </div>
            <button className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-yellow-300">
              <Plus className="h-4 w-4" />
              New Entry
            </button>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-6 border-b border-neutral-800">
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
        </div>

        <div className="mt-6">
          {activeTab === "journal" ? <JournalEntriesTable /> : <ChartOfAccountsTable />}
        </div>
      </section>
    </div>
  );
}

function JournalEntriesTable() {
  const entries = [
    { id: "JE-1042", date: "2026-05-25", memo: "Monthly Rent Allocation", status: "Posted", amount: "$5,000.00" },
    { id: "JE-1043", date: "2026-05-24", memo: "Depreciation Expense - IT Equipment", status: "Draft", amount: "$1,250.00" },
    { id: "JE-1044", date: "2026-05-20", memo: "Prepaid Insurance Amortization", status: "Posted", amount: "$800.00" },
    { id: "JE-1045", date: "2026-05-18", memo: "Payroll Accrual - May", status: "Posted", amount: "$24,500.00" },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-6 py-4 font-semibold">Entry ID</th>
            <th className="px-6 py-4 font-semibold">Date</th>
            <th className="px-6 py-4 font-semibold">Memo</th>
            <th className="px-6 py-4 font-semibold text-right">Total Amount</th>
            <th className="px-6 py-4 font-semibold">Status</th>
            <th className="px-6 py-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {entries.map((entry) => (
            <tr key={entry.id} className="transition-colors hover:bg-neutral-800/30">
              <td className="px-6 py-4 font-mono text-yellow-400">{entry.id}</td>
              <td className="px-6 py-4">{entry.date}</td>
              <td className="px-6 py-4">{entry.memo}</td>
              <td className="px-6 py-4 text-right font-mono">{entry.amount}</td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                    entry.status === "Posted"
                      ? "bg-green-500/10 text-green-400"
                      : "bg-neutral-500/10 text-neutral-400"
                  }`}
                >
                  {entry.status === "Posted" && <CheckCircle2 className="h-3 w-3" />}
                  {entry.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <button className="text-white/40 hover:text-white transition-colors">
                  <MoreHorizontal className="h-5 w-5 ml-auto" />
                </button>
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
    { id: "1000", name: "Operating Bank Account", type: "Asset", balance: "$124,500.00" },
    { id: "1200", name: "Accounts Receivable", type: "Asset", balance: "$45,200.00" },
    { id: "2000", name: "Accounts Payable", type: "Liability", balance: "$18,400.00" },
    { id: "3000", name: "Retained Earnings", type: "Equity", balance: "$85,000.00" },
    { id: "4000", name: "Software Revenue", type: "Revenue", balance: "$150,000.00" },
    { id: "5000", name: "Salaries Expense", type: "Expense", balance: "$83,700.00" },
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
            <th className="px-6 py-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {accounts.map((acc) => (
            <tr key={acc.id} className="transition-colors hover:bg-neutral-800/30">
              <td className="px-6 py-4 font-mono text-white/60">{acc.id}</td>
              <td className="px-6 py-4 font-bold text-white">{acc.name}</td>
              <td className="px-6 py-4">
                <span className="rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1 text-xs">
                  {acc.type}
                </span>
              </td>
              <td className="px-6 py-4 text-right font-mono">{acc.balance}</td>
              <td className="px-6 py-4 text-right">
                <button className="text-white/40 hover:text-white transition-colors">
                  <MoreHorizontal className="h-5 w-5 ml-auto" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
