import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { invoke } from "../../../lib/financeSupabaseInvoke";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  FileText,
  CreditCard,
  Building,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Account {
  id: number;
  name: string;
  type_: string;
  balance: number;
}

interface Invoice {
  id: number;
  client_name: string;
  total_amount: number;
  status: string;
  due_date: string;
}

interface VendorBill {
  id: number;
  vendor_name: string;
  total_amount: number;
  status: string;
  due_date: string;
}

interface JournalEntry {
  id: number;
  date: string;
  reference: string;
  description: string;
  total_debit: number;
  total_credit: number;
  status: string;
}

interface TransactionItem {
  id: number;
  account_id: number | null;
  amount: number;
  type_: string;
  category: string;
  description: string;
  date: string;
  status: string;
}

interface PeriodClose {
  id: number;
  period: string;
  task: string;
  assigned_to: string;
  status: string;
}

export default function DashboardView() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [bills, setBills] = useState<VendorBill[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [periodCloses, setPeriodCloses] = useState<PeriodClose[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accs, invs, vendorBills, jes, txs, closeTasks] = await Promise.all([
          invoke<Account[]>("get_accounts"),
          invoke<Invoice[]>("get_invoices"),
          invoke<VendorBill[]>("get_vendor_bills"),
          invoke<JournalEntry[]>("get_journal_entries"),
          invoke<TransactionItem[]>("get_transactions"),
          invoke<PeriodClose[]>("get_period_closes"),
        ]);
        setAccounts(accs);
        setInvoices(invs);
        setBills(vendorBills);
        setJournalEntries(jes);
        setTransactions(txs);
        setPeriodCloses(closeTasks);
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, []);

  const metrics = useMemo(() => {
    const cashTypes = ["cash", "bank", "checking", "savings", "treasury"];
    const totalCash = accounts
      .filter((account) => cashTypes.some((type) => account.type_.toLowerCase().includes(type)))
      .reduce((sum, account) => sum + account.balance, 0);
    const totalAR = invoices
      .filter((inv) => inv.status.toLowerCase() !== "paid")
      .reduce((sum, inv) => sum + inv.total_amount, 0);
    const totalAP = bills
      .filter((bill) => bill.status.toLowerCase() !== "paid")
      .reduce((sum, bill) => sum + bill.total_amount, 0);
    const netPosition = totalCash + totalAR - totalAP;

    const monthKeys = buildRecentMonthKeys(6);
    const trendData = monthKeys.map(({ key, name }) => {
      const cash = transactions
        .filter((tx) => tx.status.toLowerCase() !== "void" && tx.date.startsWith(key))
        .reduce((sum, tx) => sum + (tx.type_.toLowerCase() === "income" ? tx.amount : -tx.amount), 0);
      const ar = invoices
        .filter((invoice) => invoice.status.toLowerCase() !== "paid" && invoice.due_date.startsWith(key))
        .reduce((sum, invoice) => sum + invoice.total_amount, 0);
      const ap = bills
        .filter((bill) => bill.status.toLowerCase() !== "paid" && bill.due_date.startsWith(key))
        .reduce((sum, bill) => sum + bill.total_amount, 0);

      return { name, cash, ar, ap };
    });

    const categoryData = [
      { name: "Cash Equivalents", value: totalCash },
      { name: "Accounts Receivable", value: totalAR },
    ].filter((item) => item.value > 0);

    const upcomingBills = bills
      .filter((b) => b.status !== "Paid")
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      .slice(0, 3);

    const today = new Date();
    const overdueInvoices = invoices.filter((invoice) => invoice.status.toLowerCase() !== "paid" && new Date(invoice.due_date) < today).length;
    const overdueBills = bills.filter((bill) => bill.status.toLowerCase() !== "paid" && new Date(bill.due_date) < today).length;
    const unbalancedJournals = journalEntries.filter((entry) => Math.abs(entry.total_debit - entry.total_credit) > 0.005).length;
    const openCloseTasks = periodCloses.filter((task) => {
      const status = task.status.toLowerCase();
      return status !== "closed" && status !== "complete";
    }).length;
    const healthDeductions = overdueInvoices * 8 + overdueBills * 6 + unbalancedJournals * 12 + openCloseTasks * 3;

    return {
      totalCash,
      totalAR,
      totalAP,
      netPosition,
      trendData,
      categoryData,
      upcomingBills,
      healthScore: Math.max(0, Math.min(100, 100 - healthDeductions)),
    };
  }, [accounts, invoices, bills, journalEntries, periodCloses, transactions]);

  const COLORS = ["#2FBF71", "#3B82F6", "#F7C948", "#EF4444", "#F59E0B"];

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in zoom-in-95 duration-300">
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_0.9fr]">
        <div className="dd-card-elevated shadow-lg shadow-black/20">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="dd-label">Command center</p>
              <h2 className="mt-2 dd-page-title">Financial Control Room</h2>
              <p className="mt-2 max-w-2xl dd-body">
                Live cash position, accounts receivable aging, and pending vendor bills.
              </p>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-right">
              <p className="dd-subtext">Data Health</p>
              <p className="text-3xl font-black text-green-400">{metrics.healthScore}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard icon={<Banknote />} label="Total Cash" value={`$${metrics.totalCash.toFixed(2)}`} />
            <MetricCard icon={<ArrowUpCircle />} label="Total A/R" value={`$${metrics.totalAR.toFixed(2)}`} tone="success" />
            <MetricCard icon={<ArrowDownCircle />} label="Total A/P" value={`$${metrics.totalAP.toFixed(2)}`} tone="error" />
            <MetricCard icon={<Building />} label="Net Position" value={`$${metrics.netPosition.toFixed(2)}`} tone="accent" />
          </div>
        </div>

        <div className="dd-card-elevated shadow-lg shadow-black/20">
          <div className="flex items-center justify-between">
            <h3 className="dd-card-title">Upcoming Payables</h3>
            <AlertTriangle className="h-5 w-5 text-yellow-300" />
          </div>
          <div className="mt-5 space-y-4">
            {metrics.upcomingBills.length > 0 ? (
              metrics.upcomingBills.map((bill, i) => (
                <InsightRow
                  key={i}
                  icon={<CreditCard className="h-4 w-4" />}
                  label={`Bill to ${bill.vendor_name}`}
                  value={`$${bill.total_amount.toFixed(2)} by ${bill.due_date}`}
                />
              ))
            ) : (
              <div className="dd-empty py-4">No pending bills.</div>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="dd-card-elevated shadow-lg shadow-black/20">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="flex items-center gap-2 dd-section-title">
              <TrendingUp className="h-5 w-5 text-yellow-400" />
              Liquidity Trend
            </h3>
            <span className="rounded-full border border-neutral-800 bg-neutral-950 px-3 py-1 text-xs font-semibold text-white/50">
              Last 6 Months
            </span>
          </div>
          <div className="h-[320px]">
            {metrics.trendData.some((point) => point.cash !== 0 || point.ar !== 0 || point.ap !== 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cashFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F7C948" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#F7C948" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#2A3647" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="#7F8DA1" fontSize={12} />
                  <YAxis axisLine={false} tickLine={false} stroke="#7F8DA1" fontSize={12} tickFormatter={(value) => `$${value}`} />
                  <Tooltip contentStyle={{ backgroundColor: "#171F2B", border: "1px solid #2A3647", borderRadius: 12, color: "#F3F7FF" }} />
                  <Area type="monotone" dataKey="cash" stroke="#F7C948" strokeWidth={3} fill="url(#cashFill)" />
                  <Area type="monotone" dataKey="ar" stroke="#3B82F6" strokeWidth={3} fill="none" />
                  <Area type="monotone" dataKey="ap" stroke="#EF4444" strokeWidth={3} fill="none" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center dd-empty p-0 border-0">No transaction, receivable, or payable activity yet</div>
            )}
          </div>
        </div>

        <div className="dd-card-elevated shadow-lg shadow-black/20">
          <h3 className="mb-5 dd-section-title">Asset Mix</h3>
          <div className="h-[220px]">
            {metrics.categoryData.length > 0 && metrics.categoryData[0].value > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie data={metrics.categoryData} dataKey="value" innerRadius={62} outerRadius={88} paddingAngle={4} stroke="none">
                    {metrics.categoryData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#171F2B", border: "1px solid #2A3647", borderRadius: 12, color: "#F3F7FF" }} />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center dd-empty p-0 border-0">No asset data yet</div>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {metrics.categoryData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-white/60">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  {item.name}
                </span>
                <span className="font-bold text-white">${item.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4">
        <div className="dd-card-elevated">
          <h3 className="mb-4 dd-section-title">Recent Journal Entries</h3>
          <div className="space-y-2">
            {journalEntries.length === 0 ? (
              <div className="dd-empty">
                No recent journal entries to display.
              </div>
            ) : (
              journalEntries.slice(0, 5).map((je) => (
                <div key={je.id} className="dd-list-item">
                  <div className="flex items-center gap-4">
                     <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900">
                        <FileText className="h-5 w-5 text-white/60" />
                     </div>
                    <div>
                      <p className="dd-card-title">{je.description || "General Journal"}</p>
                      <p className="dd-subtext">{je.reference} - {je.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm font-black text-white">
                      ${je.total_debit.toFixed(2)}
                    </span>
                    <p className="text-xs text-white/40">{je.status}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function buildRecentMonthKeys(count: number) {
  const months: { key: string; name: string }[] = [];
  const cursor = new Date();
  cursor.setDate(1);

  for (let index = count - 1; index >= 0; index -= 1) {
    const month = new Date(cursor.getFullYear(), cursor.getMonth() - index, 1);
    const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
    const name = month.toLocaleString(undefined, { month: "short" });
    months.push({ key, name });
  }

  return months;
}

function MetricCard({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: "default" | "success" | "error" | "accent";
}) {
  const toneClass = {
    default: "text-white",
    success: "text-green-400",
    error: "text-red-400",
    accent: "text-yellow-400",
  }[tone];

  return (
    <div className="dd-card-inset">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900/60 ${toneClass}`}>
        {icon}
      </div>
      <p className="text-xs font-semibold text-white/50">{label}</p>
      <p className={`mt-1 text-2xl font-black ${toneClass}`}>{value}</p>
    </div>
  );
}

function InsightRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-neutral-900/60 text-yellow-400">{icon}</span>
        <span className="truncate text-sm font-semibold text-white">{label}</span>
      </div>
      <span className="shrink-0 text-xs font-bold text-white/50">{value}</span>
    </div>
  );
}
