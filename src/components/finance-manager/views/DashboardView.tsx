import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Transaction {
  id: number;
  amount: number;
  type_: string;
  category: string;
  description: string;
  date: string;
}

interface Account {
  id: number;
  name: string;
  type_: string;
  balance: number;
}

interface Budget {
  category: string;
  limit_amount: number;
}

interface Goal {
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
}

interface Subscription {
  name: string;
  amount: number;
  billing_cycle: string;
  next_date: string;
}

export default function DashboardView() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [txs, accs, budgetData, goalData, subData] = await Promise.all([
          invoke<Transaction[]>("get_transactions"),
          invoke<Account[]>("get_accounts"),
          invoke<Budget[]>("get_budgets"),
          invoke<Goal[]>("get_goals"),
          invoke<Subscription[]>("get_subscriptions"),
        ]);
        setTransactions(txs);
        setAccounts(accs);
        setBudgets(budgetData);
        setGoals(goalData);
        setSubscriptions(subData);
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, []);

  const metrics = useMemo(() => {
    const netWorth = accounts.reduce((sum, account) => sum + account.balance, 0);
    const income = transactions.filter((tx) => tx.type_ === "income").reduce((sum, tx) => sum + tx.amount, 0);
    const expense = transactions.filter((tx) => tx.type_ !== "income").reduce((sum, tx) => sum + tx.amount, 0);
    const monthlyBurn = subscriptions.reduce((sum, sub) => {
      if (sub.billing_cycle === "yearly") return sum + sub.amount / 12;
      if (sub.billing_cycle === "weekly") return sum + sub.amount * 4;
      return sum + sub.amount;
    }, 0);
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;
    const runway = expense > 0 ? Math.max(0, netWorth / Math.max(expense / 3, 1)) : 0;

    const categoryMap = new Map<string, number>();
    const dateMap = new Map<string, { income: number; expense: number }>();
    transactions.forEach((tx) => {
      const bucket = dateMap.get(tx.date) ?? { income: 0, expense: 0 };
      if (tx.type_ === "income") {
        bucket.income += tx.amount;
      } else {
        bucket.expense += tx.amount;
        categoryMap.set(tx.category, (categoryMap.get(tx.category) ?? 0) + tx.amount);
      }
      dateMap.set(tx.date, bucket);
    });

    const categoryData = Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const trendData = Array.from(dateMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-10)
      .map(([date, values]) => ({
        name: date.split("-").slice(1).join("/"),
        income: values.income,
        expense: values.expense,
        cashflow: values.income - values.expense,
      }));

    const budgetRows = budgets.slice(0, 4).map((budget) => {
      const spent = categoryMap.get(budget.category) ?? 0;
      const progress = budget.limit_amount > 0 ? (spent / budget.limit_amount) * 100 : 0;
      return { ...budget, spent, progress };
    });

    const healthScore = Math.max(
      10,
      Math.min(96, Math.round(55 + Math.max(savingsRate, -20) * 0.6 + Math.min(accounts.length, 5) * 4 - monthlyBurn / 80)),
    );

    return {
      budgetRows,
      categoryData,
      expense,
      healthScore,
      income,
      monthlyBurn,
      netWorth,
      runway,
      savingsRate,
      trendData,
    };
  }, [accounts, budgets, subscriptions, transactions]);

  const COLORS = ["#F7C948", "#2FBF71", "#3B82F6", "#A9B6C8", "#F59E0B"];
  const upcomingSub = subscriptions
    .filter((sub) => sub.next_date)
    .sort((a, b) => a.next_date.localeCompare(b.next_date))[0];
  const primaryGoal = goals
    .filter((goal) => goal.target_amount > 0)
    .sort((a, b) => b.current_amount / b.target_amount - a.current_amount / a.target_amount)[0];
  const recentTransactions = transactions.slice(0, 6);

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in zoom-in-95 duration-300">
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_0.9fr]">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-lg shadow-black/20">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-400">Command center</p>
              <h2 className="mt-2 font-heading text-3xl font-black tracking-tight text-white">Financial Control Room</h2>
              <p className="mt-2 max-w-2xl text-sm text-white/60">
                Live balances, spending pressure, renewal exposure, and savings momentum in one workspace.
              </p>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-right">
              <p className="text-xs text-white/50">Health score</p>
              <p className="text-3xl font-black text-yellow-400">{metrics.healthScore}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard icon={<Banknote />} label="Net Worth" value={`$${metrics.netWorth.toFixed(2)}`} />
            <MetricCard icon={<ArrowUpCircle />} label="Income" value={`$${metrics.income.toFixed(2)}`} tone="success" />
            <MetricCard icon={<ArrowDownCircle />} label="Expenses" value={`$${metrics.expense.toFixed(2)}`} tone="error" />
            <MetricCard icon={<Target />} label="Savings Rate" value={`${metrics.savingsRate.toFixed(1)}%`} tone="accent" />
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Today needs attention</h3>
            <AlertTriangle className="h-5 w-5 text-yellow-300" />
          </div>
          <div className="mt-5 space-y-4">
            <InsightRow
              icon={<CreditCard className="h-4 w-4" />}
              label="Subscription burn"
              value={`$${metrics.monthlyBurn.toFixed(2)}/mo`}
            />
            <InsightRow
              icon={<CalendarClock className="h-4 w-4" />}
              label={upcomingSub ? `${upcomingSub.name} renews` : "No renewals tracked"}
              value={upcomingSub?.next_date ?? "Add subscriptions"}
            />
            <InsightRow
              icon={<CheckCircle2 className="h-4 w-4" />}
              label={primaryGoal ? `${primaryGoal.name} progress` : "No savings goal"}
              value={primaryGoal ? `${Math.round((primaryGoal.current_amount / primaryGoal.target_amount) * 100)}%` : "Create goal"}
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-lg shadow-black/20">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-bold text-white">
              <TrendingUp className="h-5 w-5 text-yellow-400" />
              Cash Flow Trend
            </h3>
            <span className="rounded-full border border-neutral-800 bg-neutral-950 px-3 py-1 text-xs font-semibold text-white/50">
              last 10 active days
            </span>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2FBF71" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2FBF71" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#2A3647" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="#7F8DA1" fontSize={12} />
                <YAxis axisLine={false} tickLine={false} stroke="#7F8DA1" fontSize={12} tickFormatter={(value) => `$${value}`} />
                <Tooltip contentStyle={{ backgroundColor: "#171F2B", border: "1px solid #2A3647", borderRadius: 12, color: "#F3F7FF" }} />
                <Area type="monotone" dataKey="income" stroke="#2FBF71" strokeWidth={3} fill="url(#incomeFill)" />
                <Area type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={3} fill="url(#expenseFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-lg shadow-black/20">
          <h3 className="mb-5 text-lg font-bold text-white">Spending Mix</h3>
          <div className="h-[220px]">
            {metrics.categoryData.length > 0 ? (
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
              <div className="grid h-full place-items-center text-sm text-white/50">No expense categories yet</div>
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

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.2fr]">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
          <h3 className="mb-4 text-lg font-bold text-white">Budget Pressure</h3>
          <div className="h-[210px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.budgetRows}>
                <CartesianGrid stroke="#2A3647" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="category" axisLine={false} tickLine={false} stroke="#7F8DA1" fontSize={12} />
                <YAxis axisLine={false} tickLine={false} stroke="#7F8DA1" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "#171F2B", border: "1px solid #2A3647", borderRadius: 12, color: "#F3F7FF" }} />
                <Bar dataKey="spent" radius={[6, 6, 0, 0]} fill="#F7C948" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
          <h3 className="mb-4 text-lg font-bold text-white">Recent Ledger</h3>
          <div className="space-y-2">
            {recentTransactions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-800 p-8 text-center text-sm text-white/50">
                Add transactions to unlock the live ledger.
              </div>
            ) : (
              recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between rounded-xl border border-neutral-800/60 bg-neutral-950/70 px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-white">{tx.description || tx.category}</p>
                    <p className="text-xs text-white/50">{tx.category} - {tx.date}</p>
                  </div>
                  <span className={`font-mono text-sm font-black ${tx.type_ === "income" ? "text-green-400" : "text-white"}`}>
                    {tx.type_ === "income" ? "+" : "-"}${tx.amount.toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
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
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
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
