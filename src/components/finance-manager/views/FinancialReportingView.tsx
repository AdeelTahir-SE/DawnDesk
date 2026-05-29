import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Download, FileBarChart, PieChart, Calendar, Filter, Loader2 } from "lucide-react";
import { exportTextFile, toJsonExport } from "../../../utils/exportFile";

type Account = { id: number; name: string; type_: string; balance: number; currency: string };
type Invoice = { id: number; client_name: string; total_amount: number; status: string; due_date: string };
type VendorBill = { id: number; vendor_name: string; total_amount: number; status: string; due_date: string };
type TransactionItem = { id: number; amount: number; type_: string; category: string; date: string; status: string };
type JournalEntry = { id: number; date: string; reference: string; description: string; total_debit: number; total_credit: number; status: string };
type PeriodClose = { id: number; period: string; task: string; assigned_to: string; status: string };

export default function FinancialReportingView() {
  const [activeTab, setActiveTab] = useState("statements");
  const [dateFilter, setDateFilter] = useState("This month");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [bills, setBills] = useState<VendorBill[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [periodCloses, setPeriodCloses] = useState<PeriodClose[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportStatus, setExportStatus] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [accountRows, invoiceRows, billRows, txRows, journalRows, closeRows] = await Promise.all([
          invoke<Account[]>("get_accounts"),
          invoke<Invoice[]>("get_invoices"),
          invoke<VendorBill[]>("get_vendor_bills"),
          invoke<TransactionItem[]>("get_transactions"),
          invoke<JournalEntry[]>("get_journal_entries"),
          invoke<PeriodClose[]>("get_period_closes"),
        ]);
        setAccounts(accountRows);
        setInvoices(invoiceRows);
        setBills(billRows);
        setTransactions(txRows);
        setJournalEntries(journalRows);
        setPeriodCloses(closeRows);
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    };

    loadData();
  }, []);

  const summary = useMemo(() => buildSummary(accounts, invoices, bills, transactions, journalEntries), [accounts, invoices, bills, transactions, journalEntries]);

  const exportBoardDeck = async () => {
    const payload = {
      generated_at: new Date().toISOString(),
      date_filter: dateFilter,
      summary,
      accounts,
      open_invoices: invoices.filter((invoice) => invoice.status.toLowerCase() !== "paid"),
      open_vendor_bills: bills.filter((bill) => bill.status.toLowerCase() !== "paid"),
      recent_journal_entries: journalEntries.slice(0, 25),
      period_close_tasks: periodCloses,
    };
    const path = await exportTextFile({
      title: "Export Financial Reporting Package",
      defaultPath: "dawndesk-financial-reporting-package.json",
      contents: toJsonExport(payload),
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    setExportStatus(path ? `Exported to ${path}` : "");
  };

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
              Financial statements, KPI dashboards, and board-ready reporting from local finance records.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white">
              <Filter className="h-4 w-4" />
              <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="bg-transparent text-sm text-white outline-none">
                <option className="bg-neutral-950">This month</option>
                <option className="bg-neutral-950">Last month</option>
                <option className="bg-neutral-950">Quarter to date</option>
                <option className="bg-neutral-950">Year to date</option>
              </select>
            </label>
            <button onClick={exportBoardDeck} className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-yellow-300">
              <Download className="h-4 w-4" /> Export Package
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-6 border-b border-neutral-800">
          <button onClick={() => setActiveTab("statements")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "statements" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Financial Statements</button>
          <button onClick={() => setActiveTab("dashboards")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "dashboards" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Custom Dashboards</button>
          <button onClick={() => setActiveTab("close")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "close" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Month-End Close</button>
        </div>
        {exportStatus && <div className="mt-4 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm font-semibold text-green-300">{exportStatus}</div>}

        <div className="mt-6">
          {loading ? (
            <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-yellow-400 animate-spin" /></div>
          ) : (
            <>
              {activeTab === "statements" && <StatementsList summary={summary} />}
              {activeTab === "dashboards" && <DashboardsView summary={summary} />}
              {activeTab === "close" && <MonthEndCloseView tasks={periodCloses} />}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function buildSummary(accounts: Account[], invoices: Invoice[], bills: VendorBill[], transactions: TransactionItem[], journals: JournalEntry[]) {
  const income = transactions.filter((tx) => tx.type_.toLowerCase() === "income").reduce((sum, tx) => sum + tx.amount, 0);
  const expenses = transactions.filter((tx) => tx.type_.toLowerCase() === "expense").reduce((sum, tx) => sum + tx.amount, 0);
  const assets = accounts.reduce((sum, account) => sum + account.balance, 0);
  const ar = invoices.filter((invoice) => invoice.status.toLowerCase() !== "paid").reduce((sum, invoice) => sum + invoice.total_amount, 0);
  const ap = bills.filter((bill) => bill.status.toLowerCase() !== "paid").reduce((sum, bill) => sum + bill.total_amount, 0);
  const unbalancedJournals = journals.filter((entry) => Math.abs(entry.total_debit - entry.total_credit) > 0.005).length;
  return { income, expenses, netIncome: income - expenses, assets, ar, ap, equity: assets + ar - ap, unbalancedJournals };
}

function StatementsList({ summary }: { summary: ReturnType<typeof buildSummary> }) {
  const reports = [
    { title: "Income Statement", value: `$${summary.netIncome.toFixed(2)}`, desc: `Income $${summary.income.toFixed(2)} less expenses $${summary.expenses.toFixed(2)}.` },
    { title: "Balance Sheet", value: `$${summary.equity.toFixed(2)}`, desc: `Assets plus receivables less payables.` },
    { title: "Cash Flow", value: `$${(summary.income - summary.expenses).toFixed(2)}`, desc: "Net cash movement from posted transactions." },
    { title: "Trial Balance", value: summary.unbalancedJournals.toString(), desc: "Unbalanced journal entries requiring review." },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {reports.map((report) => (
        <div key={report.title} className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-5">
          <FileBarChart className="h-5 w-5 text-yellow-400" />
          <h4 className="mt-4 font-bold text-white">{report.title}</h4>
          <p className="mt-2 text-2xl font-black text-white">{report.value}</p>
          <p className="mt-2 text-xs text-white/40">{report.desc}</p>
        </div>
      ))}
    </div>
  );
}

function DashboardsView({ summary }: { summary: ReturnType<typeof buildSummary> }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-6">
      <div className="flex items-center gap-2">
        <PieChart className="h-5 w-5 text-yellow-400" />
        <h3 className="text-lg font-bold text-white">KPI Dashboard</h3>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
        <ReportMetric label="A/R Open" value={`$${summary.ar.toFixed(2)}`} />
        <ReportMetric label="A/P Open" value={`$${summary.ap.toFixed(2)}`} />
        <ReportMetric label="Net Income" value={`$${summary.netIncome.toFixed(2)}`} />
        <ReportMetric label="Equity View" value={`$${summary.equity.toFixed(2)}`} />
      </div>
    </div>
  );
}

function MonthEndCloseView({ tasks }: { tasks: PeriodClose[] }) {
  const openTasks = tasks.filter((task) => !["closed", "complete"].includes(task.status.toLowerCase()));
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-6">
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-yellow-400" />
        <h3 className="text-lg font-bold text-white">Month-End Close Checklist</h3>
      </div>
      <div className="mt-5 space-y-2">
        {tasks.length === 0 && <div className="py-8 text-center text-sm text-white/40">No close tasks configured in General Ledger.</div>}
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/50 px-4 py-3">
            <div>
              <p className="font-bold text-white">{task.task}</p>
              <p className="text-xs text-white/40">{task.period} - {task.assigned_to}</p>
            </div>
            <span className="text-sm font-bold text-yellow-300">{task.status}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-white/50">{openTasks.length} open close tasks.</p>
    </div>
  );
}

function ReportMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-2 text-xl font-black text-white">{value}</p>
    </div>
  );
}
