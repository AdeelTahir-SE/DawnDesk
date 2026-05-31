import { useState, useEffect } from "react";
import { invoke } from "../../../lib/financeSupabaseInvoke";
import { Plus, CheckCircle2, X } from "lucide-react";
import { useAppLogger } from "../../../utils/LoggerContext";

interface Goal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  auto_allocate_percent: number;
}

export default function GoalsView() {
  const { logSuccess, logError } = useAppLogger();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: "", target_amount: 0, current_amount: 0, deadline: "", auto_allocate_percent: 0 });

  const fetchGoals = async () => {
    try {
      const data = await invoke<Goal[]>("get_goals");
      setGoals(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await invoke("create_goal", { 
        input: { 
          ...newGoal, 
          target_amount: Number(newGoal.target_amount),
          current_amount: Number(newGoal.current_amount),
          auto_allocate_percent: Number(newGoal.auto_allocate_percent)
        } 
      });
      setShowAddModal(false);
      logSuccess("Finance goal created", newGoal.name, { source: "finance" });
      setNewGoal({ name: "", target_amount: 0, current_amount: 0, deadline: "", auto_allocate_percent: 0 });
      fetchGoals();
    } catch (e) {
      console.error(e);
      logError("Finance goal create failed", String(e), { source: "finance" });
    }
  };

  return (
    <div className="p-8 flex flex-col gap-8 h-full animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-heading font-extrabold tracking-tight text-brand-text">Goals & Savings</h2>
          <p className="text-brand-text-muted text-sm">Track your progress towards financial freedom.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 rounded-xl bg-brand-accent px-5 py-2.5 text-sm font-bold text-brand-base hover:bg-brand-accent-hover transition-transform active:scale-95 shadow-[0_0_20px_rgba(247,201,72,0.25)]">
          <Plus className="w-5 h-5" /> New Goal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map(g => {
          const progress = Math.min((g.current_amount / g.target_amount) * 100, 100);
          const isDone = progress >= 100;
          const strokeDashoffset = 440 - (440 * progress) / 100;

          return (
            <div key={g.id} className={`rounded-2xl border ${isDone ? 'border-brand-accent/30' : 'border-brand-border'} bg-brand-elevated p-6 flex flex-col items-center relative overflow-hidden group shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all`}>
              <div className={`absolute inset-0 bg-gradient-to-b ${isDone ? 'from-brand-accent/5' : 'from-brand-text/5'} to-transparent opacity-50`}></div>
              
              <div className={`flex items-center gap-2 ${isDone ? 'text-brand-accent' : 'text-brand-text'} font-bold z-10 mb-6 text-lg text-center`}>
                {isDone && <CheckCircle2 className="w-5 h-5" />} {g.name}
              </div>
              
              <div className="relative w-40 h-40 flex items-center justify-center z-10 mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="80" cy="80" r="70" stroke="#2A3647" strokeWidth="8" fill="none" />
                  <circle 
                    cx="80" cy="80" r="70" 
                    stroke={isDone ? "#F7C948" : "#F3F7FF"} 
                    strokeWidth="8" fill="none" 
                    strokeDasharray="440" 
                    strokeDashoffset={strokeDashoffset} 
                    strokeLinecap="round" 
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-black ${isDone ? 'text-brand-accent' : 'text-brand-text'}`}>{progress.toFixed(0)}%</span>
                  <span className={`text-xs ${isDone ? 'text-brand-accent/50' : 'text-brand-text-muted'}`}>${g.current_amount.toFixed(0)} / ${g.target_amount.toFixed(0)}</span>
                </div>
              </div>
              
              <div className="w-full flex flex-col gap-2 z-10 mb-4">
                <div className="flex justify-between text-xs">
                  <span className="text-brand-text-muted">Target Date:</span>
                  <span className="text-brand-text font-medium">{g.deadline}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-brand-text-muted">Auto-allocate:</span>
                  <span className={g.auto_allocate_percent > 0 ? "text-brand-accent font-medium" : "text-brand-text-secondary font-medium"}>
                    {g.auto_allocate_percent > 0 ? `${g.auto_allocate_percent}% of Income` : 'Off'}
                  </span>
                </div>
              </div>

              {isDone ? (
                <button className="w-full py-2.5 bg-brand-accent/10 text-brand-accent hover:bg-brand-accent/20 rounded-xl text-sm font-medium transition-colors z-10 border border-brand-accent/20">
                  Goal Achieved
                </button>
              ) : (
                <button className="w-full py-2.5 bg-brand-base border border-brand-border hover:bg-brand-border/30 text-brand-text rounded-xl text-sm font-medium transition-colors z-10">
                  Contribute Manually
                </button>
              )}
            </div>
          );
        })}

        {goals.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center border border-dashed border-brand-border rounded-2xl">
            <h3 className="text-lg font-bold text-brand-text mb-2">No goals found</h3>
            <p className="text-sm text-brand-text-muted mb-6 text-center max-w-sm">Create a savings goal to start tracking your financial targets.</p>
            <button onClick={() => setShowAddModal(true)} className="px-6 py-2.5 bg-brand-accent text-brand-base text-sm font-bold rounded-xl hover:bg-brand-accent-hover transition-colors">
              Create Goal
            </button>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-brand-base/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-elevated border border-brand-border rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-brand-border">
              <h3 className="text-xl font-heading font-bold text-brand-text">Add New Goal</h3>
              <button onClick={() => setShowAddModal(false)} className="text-brand-text-muted hover:text-brand-text transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddGoal} className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-brand-text-secondary font-medium">Goal Name</label>
                <input type="text" required value={newGoal.name} onChange={e => setNewGoal({...newGoal, name: e.target.value})} className="bg-brand-base border border-brand-border rounded-xl px-4 py-3 text-brand-text outline-none focus:border-brand-accent/50 transition-colors" placeholder="e.g. New Car Down Payment" />
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-sm text-brand-text-secondary font-medium">Target Amount ($)</label>
                  <input type="number" step="0.01" required value={newGoal.target_amount} onChange={e => setNewGoal({...newGoal, target_amount: Number(e.target.value)})} className="bg-brand-base border border-brand-border rounded-xl px-4 py-3 text-brand-text outline-none focus:border-brand-accent/50 transition-colors" placeholder="10000.00" />
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-sm text-brand-text-secondary font-medium">Current Amount ($)</label>
                  <input type="number" step="0.01" required value={newGoal.current_amount} onChange={e => setNewGoal({...newGoal, current_amount: Number(e.target.value)})} className="bg-brand-base border border-brand-border rounded-xl px-4 py-3 text-brand-text outline-none focus:border-brand-accent/50 transition-colors" placeholder="0.00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-brand-text-secondary font-medium">Target Date</label>
                  <input type="date" required value={newGoal.deadline} onChange={e => setNewGoal({...newGoal, deadline: e.target.value})} className="bg-brand-base border border-brand-border rounded-xl px-4 py-3 text-brand-text outline-none focus:border-brand-accent/50 transition-colors" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-brand-text-secondary font-medium">Auto-allocate (%)</label>
                  <input type="number" step="1" min="0" max="100" value={newGoal.auto_allocate_percent} onChange={e => setNewGoal({...newGoal, auto_allocate_percent: Number(e.target.value)})} className="bg-brand-base border border-brand-border rounded-xl px-4 py-3 text-brand-text outline-none focus:border-brand-accent/50 transition-colors" placeholder="0" />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-xl text-brand-text-secondary hover:bg-brand-border/30 font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-brand-accent text-brand-base font-bold hover:bg-brand-accent-hover transition-colors">
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
