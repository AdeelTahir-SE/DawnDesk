import { useState } from "react";
import { Download, FileBarChart, PieChart, Calendar, Filter } from "lucide-react";

export default function FinancialReportingView() {
  const [activeTab, setActiveTab] = useState("statements");

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in zoom-in-95 duration-300">
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-lg shadow-black/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-400">Reporting</p>
            <h2 className="mt-2 font-heading text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <FileBarChart className="h-6 w-6 text-yellow-400" />
              Financial Reporting
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/60">
              Generate GAAP-compliant financial statements, custom dashboards, and board-ready reporting packages.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800/80">
              <Filter className="h-4 w-4" /> Filter Date
            </button>
            <button className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-yellow-300">
              <Download className="h-4 w-4" /> Export Board Deck
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-6 border-b border-neutral-800">
          <button onClick={() => setActiveTab("statements")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "statements" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Financial Statements</button>
          <button onClick={() => setActiveTab("dashboards")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "dashboards" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Custom Dashboards</button>
          <button onClick={() => setActiveTab("close")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "close" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Month-End Close</button>
        </div>

        <div className="mt-6">
          {activeTab === "statements" && <StatementsList />}
          {activeTab === "dashboards" && <DashboardsView />}
          {activeTab === "close" && <MonthEndCloseView />}
        </div>
      </section>
    </div>
  );
}

function StatementsList() {
  const reports = [
    { title: "Income Statement (P&L)", desc: "Revenues, expenses, and net income over a specific period." },
    { title: "Balance Sheet", desc: "A snapshot of your company's assets, liabilities, and equity." },
    { title: "Cash Flow Statement", desc: "Detailed breakdown of operating, investing, and financing cash flows." },
    { title: "Trial Balance", desc: "Listing of all GL accounts and their closing balances." },
    { title: "General Ledger Details", desc: "Every transaction posted within a specified date range." },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {reports.map((r, i) => (
        <div key={i} className="flex flex-col justify-between rounded-xl border border-neutral-800 bg-neutral-950/50 p-5 hover:bg-neutral-900/50 transition-colors group cursor-pointer">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 mb-4 group-hover:bg-yellow-400/10 transition-colors">
              <FileBarChart className="h-5 w-5 text-white/60 group-hover:text-yellow-400" />
            </div>
            <h4 className="font-bold text-white mb-2">{r.title}</h4>
            <p className="text-xs text-white/40">{r.desc}</p>
          </div>
          <button className="mt-6 w-full rounded-lg bg-neutral-800 py-2 text-xs font-bold text-white hover:bg-neutral-700 transition-colors">
            Generate Report
          </button>
        </div>
      ))}
    </div>
  );
}

function DashboardsView() {
  return (
    <div className="text-center py-16 rounded-xl border border-neutral-800 bg-neutral-950/50">
      <PieChart className="h-10 w-10 text-white/20 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-white">Custom KPI Dashboards</h3>
      <p className="text-sm text-white/50 max-w-md mx-auto mt-2">Build custom visual dashboards to track ARR, MRR, Burn Rate, and Runway.</p>
      <button className="mt-6 rounded-xl bg-neutral-800 px-4 py-2 text-sm font-bold text-white hover:bg-neutral-700">Create Dashboard</button>
    </div>
  );
}

function MonthEndCloseView() {
  return (
    <div className="text-center py-16 rounded-xl border border-neutral-800 bg-neutral-950/50">
      <Calendar className="h-10 w-10 text-white/20 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-white">Month-End Close Checklist</h3>
      <p className="text-sm text-white/50 max-w-md mx-auto mt-2">Manage accounting periods, lock ledgers, and track close tasks.</p>
      <button className="mt-6 rounded-xl bg-neutral-800 px-4 py-2 text-sm font-bold text-white hover:bg-neutral-700">Start Close Process</button>
    </div>
  );
}
