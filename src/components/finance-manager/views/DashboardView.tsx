import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Banknote, ArrowUpCircle, ArrowDownCircle, Target, TrendingUp, PieChart } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

interface Transaction {
  amount: number;
  type_: string;
  category: string;
  date: string;
}

interface Account {
  balance: number;
}

export default function DashboardView() {
  const [netWorth, setNetWorth] = useState(0);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [categoryData, setCategoryData] = useState<{name: string, value: number}[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  
  const COLORS = ['#facc15', '#ffffff', '#a3a3a3', '#525252', '#262626']; // Theme colors

  useEffect(() => {
    const fetchData = async () => {
      try {
        const txs = await invoke<Transaction[]>("get_transactions");
        const accs = await invoke<Account[]>("get_accounts");
        
        const totalNetWorth = accs.reduce((sum, a) => sum + a.balance, 0);
        setNetWorth(totalNetWorth);

        let totalInc = 0;
        let totalExp = 0;
        const catMap = new Map<string, number>();
        const dateMap = new Map<string, {income: number, expense: number}>();

        txs.forEach(tx => {
          if (tx.type_ === 'income') {
            totalInc += tx.amount;
          } else {
            totalExp += tx.amount;
            catMap.set(tx.category, (catMap.get(tx.category) || 0) + tx.amount);
          }

          const dateObj = dateMap.get(tx.date) || { income: 0, expense: 0 };
          if (tx.type_ === 'income') dateObj.income += tx.amount;
          else dateObj.expense += tx.amount;
          dateMap.set(tx.date, dateObj);
        });

        setIncome(totalInc);
        setExpense(totalExp);

        const catArr = Array.from(catMap.entries())
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);
        setCategoryData(catArr);

        const sortedDates = Array.from(dateMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-7);
        const trendArr = sortedDates.map(([date, vals]) => ({
          name: date.split('-').slice(1).join('/'),
          income: vals.income,
          expense: vals.expense
        }));
        setTrendData(trendArr);

      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, []);

  const savingsRate = income > 0 ? ((income - expense) / income * 100).toFixed(1) : "0.0";
  const topSpend = categoryData.length > 0 ? categoryData[0].name : "N/A";

  return (
    <div className="p-8 flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-extrabold tracking-tight text-white">Overview</h2>
        <p className="text-white/50 text-sm">Your financial summary at a glance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-neutral-900/50 p-6 relative overflow-hidden group hover:border-white/20 transition-colors">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-2 text-white/50 text-sm font-medium">
            <Banknote className="w-4 h-4" /> Net Worth
          </div>
          <div className="text-4xl font-black text-white">${netWorth.toFixed(2)}</div>
        </div>
        
        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-neutral-900/50 p-6 relative overflow-hidden group hover:border-white/30 transition-colors">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
            <ArrowUpCircle className="w-4 h-4" /> Total Income
          </div>
          <div className="text-3xl font-bold text-white">${income.toFixed(2)}</div>
        </div>
        
        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-neutral-900/50 p-6 relative overflow-hidden group hover:border-white/20 transition-colors">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-black/50 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-2 text-white/40 text-sm font-medium">
            <ArrowDownCircle className="w-4 h-4" /> Total Expenses
          </div>
          <div className="text-3xl font-bold text-white/60">${expense.toFixed(2)}</div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-neutral-900/50 p-6 relative overflow-hidden group hover:border-yellow-400/30 transition-colors">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-yellow-400/10 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-2 text-yellow-400/80 text-sm font-medium">
            <Target className="w-4 h-4" /> Savings Rate
          </div>
          <div className="text-3xl font-bold text-yellow-400">{savingsRate}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 rounded-2xl border border-white/10 bg-neutral-900/50 p-6 flex flex-col shadow-xl">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-6"><TrendingUp className="w-5 h-5 text-white/50" /> Cash Flow Trend</h3>
          <div className="flex-1 min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#737373" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#737373" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip contentStyle={{ backgroundColor: '#171717', border: '1px solid #ffffff20', borderRadius: '12px', color: '#fff' }} />
                <Area type="monotone" dataKey="income" stroke="#ffffff" strokeWidth={3} fillOpacity={1} fill="url(#colorInc)" />
                <Area type="monotone" dataKey="expense" stroke="#737373" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-1 rounded-2xl border border-white/10 bg-neutral-900/50 p-6 flex flex-col shadow-xl">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><PieChart className="w-5 h-5 text-yellow-400" /> Spending Breakdown</h3>
          <div className="flex-1 min-h-[200px] w-full relative flex items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#171717', border: '1px solid #ffffff20', borderRadius: '12px', color: '#fff' }} />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-white/30 text-sm">No expenses yet</div>
            )}
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-white/50 uppercase tracking-wider font-bold mb-1">Top Spend</span>
              <span className="text-lg font-bold text-white truncate max-w-[100px] text-center">{topSpend}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
