import { useState } from "react";
import { Plus, Search, Landmark, RefreshCw, TrendingUp, DownloadCloud, MoreHorizontal, Link } from "lucide-react";

export default function CashTreasuryView() {
  const [activeTab, setActiveTab] = useState("accounts");

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in zoom-in-95 duration-300">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg">
          <p className="text-xs font-semibold text-white/50">Total Cash Position</p>
          <p className="mt-2 text-3xl font-black text-white">$452,100.00</p>
          <p className="mt-1 text-xs text-yellow-400">across 4 linked accounts</p>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg">
          <p className="text-xs font-semibold text-white/50">30-Day Forecast</p>
          <p className="mt-2 text-3xl font-black text-green-400">+$24,500.00</p>
          <p className="mt-1 text-xs text-white/40">Expected net inflow</p>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg">
          <p className="text-xs font-semibold text-white/50">Pending Reconciliations</p>
          <p className="mt-2 text-3xl font-black text-white">12</p>
          <p className="mt-1 text-xs text-orange-400">Requires manual review</p>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-lg shadow-black/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Landmark className="h-6 w-6 text-yellow-400" />
              Cash & Treasury
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2.5 rounded-xl border border-neutral-800 bg-neutral-950 text-white/50 hover:text-white transition-colors">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-yellow-300">
              <Link className="h-4 w-4" />
              Link Bank
            </button>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-6 border-b border-neutral-800">
          <button
            onClick={() => setActiveTab("accounts")}
            className={`pb-3 text-sm font-bold transition-colors ${
              activeTab === "accounts"
                ? "border-b-2 border-yellow-400 text-yellow-400"
                : "border-b-2 border-transparent text-white/50 hover:text-white"
            }`}
          >
            Bank Accounts
          </button>
          <button
            onClick={() => setActiveTab("reconciliation")}
            className={`pb-3 text-sm font-bold transition-colors ${
              activeTab === "reconciliation"
                ? "border-b-2 border-yellow-400 text-yellow-400"
                : "border-b-2 border-transparent text-white/50 hover:text-white"
            }`}
          >
            Reconciliation
          </button>
        </div>

        <div className="mt-6">
          {activeTab === "accounts" ? <BankAccountsTable /> : <ReconciliationTable />}
        </div>
      </section>
    </div>
  );
}

function BankAccountsTable() {
  const accounts = [
    { name: "Chase Corporate Checking", type: "Checking", number: "**** 4521", balance: "$324,500.00", lastSync: "2 mins ago" },
    { name: "Silicon Valley Bank", type: "Savings", number: "**** 9012", balance: "$115,200.00", lastSync: "1 hour ago" },
    { name: "Stripe Holding", type: "Merchant", number: "N/A", balance: "$12,400.00", lastSync: "5 mins ago" },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-6 py-4 font-semibold">Account Name</th>
            <th className="px-6 py-4 font-semibold">Type</th>
            <th className="px-6 py-4 font-semibold">Account Number</th>
            <th className="px-6 py-4 font-semibold">Last Sync</th>
            <th className="px-6 py-4 font-semibold text-right">Balance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {accounts.map((acc, i) => (
            <tr key={i} className="transition-colors hover:bg-neutral-800/30">
              <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                <Landmark className="h-4 w-4 text-white/40" />
                {acc.name}
              </td>
              <td className="px-6 py-4 text-white/60">{acc.type}</td>
              <td className="px-6 py-4 font-mono text-white/50">{acc.number}</td>
              <td className="px-6 py-4 text-white/40">{acc.lastSync}</td>
              <td className="px-6 py-4 text-right font-mono font-bold text-white">{acc.balance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReconciliationTable() {
  const transactions = [
    { date: "2026-05-25", description: "Stripe Payout", amount: "+$4,500.00", status: "Auto-Matched" },
    { date: "2026-05-24", description: "AWS Amazon Web Services", amount: "-$3,450.00", status: "Unmatched" },
    { date: "2026-05-22", description: "Gusto Payroll", amount: "-$24,500.00", status: "Auto-Matched" },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-6 py-4 font-semibold">Date</th>
            <th className="px-6 py-4 font-semibold">Bank Description</th>
            <th className="px-6 py-4 font-semibold text-right">Amount</th>
            <th className="px-6 py-4 font-semibold">Status</th>
            <th className="px-6 py-4 font-semibold text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {transactions.map((t, i) => (
            <tr key={i} className="transition-colors hover:bg-neutral-800/30">
              <td className="px-6 py-4">{t.date}</td>
              <td className="px-6 py-4 font-mono">{t.description}</td>
              <td className={`px-6 py-4 text-right font-mono font-bold ${t.amount.startsWith('+') ? 'text-green-400' : 'text-white'}`}>
                {t.amount}
              </td>
              <td className="px-6 py-4">
                <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${t.status === 'Auto-Matched' ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'}`}>
                  {t.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                {t.status === 'Unmatched' ? (
                  <button className="text-yellow-400 hover:text-yellow-300 font-semibold text-xs">Review</button>
                ) : (
                  <button className="text-white/40 hover:text-white transition-colors"><MoreHorizontal className="h-5 w-5 ml-auto" /></button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
