import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Plus, CheckCircle2, X } from "lucide-react";

interface Goal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  auto_allocate_percent: number;
}

export default function GoalsView() {
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
      setNewGoal({ name: "", target_amount: 0, current_amount: 0, deadline: "", auto_allocate_percent: 0 });
      fetchGoals();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-8 flex flex-col gap-8 h-full animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Goals & Savings</h2>
          <p className="text-white/50 text-sm">Track your progress towards financial freedom.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-bold text-black hover:bg-yellow-300 transition-transform active:scale-95 shadow-[0_0_20px_rgba(250,204,21,0.25)]">
          <Plus className="w-5 h-5" /> New Goal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map(g => {
          const progress = Math.min((g.current_amount / g.target_amount) * 100, 100);
          const isDone = progress >= 100;
          const strokeDashoffset = 440 - (440 * progress) / 100;

          return (
            <div key={g.id} className={`rounded-2xl border ${isDone ? 'border-yellow-400/30' : 'border-white/10'} bg-neutral-900/50 p-6 flex flex-col items-center relative overflow-hidden group`}>
              <div className={`absolute inset-0 bg-gradient-to-b ${isDone ? 'from-yellow-400/5' : 'from-white/5'} to-transparent`}></div>
              
              <div className={`flex items-center gap-2 ${isDone ? 'text-yellow-400' : 'text-white'} font-bold z-10 mb-6 text-lg text-center`}>
                {isDone && <CheckCircle2 className="w-5 h-5" />} {g.name}
              </div>
              
              <div className="relative w-40 h-40 flex items-center justify-center z-10 mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />
                  <circle 
                    cx="80" cy="80" r="70" 
                    stroke={isDone ? "#facc15" : "#ffffff"} 
                    strokeWidth="8" fill="none" 
                    strokeDasharray="440" 
                    strokeDashoffset={strokeDashoffset} 
                    strokeLinecap="round" 
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-black ${isDone ? 'text-yellow-400' : 'text-white'}`}>{progress.toFixed(0)}%</span>
                  <span className={`text-xs ${isDone ? 'text-yellow-400/50' : 'text-white/50'}`}>${g.current_amount.toFixed(0)} / ${g.target_amount.toFixed(0)}</span>
                </div>
              </div>
              
              <div className="w-full flex flex-col gap-2 z-10 mb-4">
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">Target Date:</span>
                  <span className="text-white font-medium">{g.deadline}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">Auto-allocate:</span>
                  <span className={g.auto_allocate_percent > 0 ? "text-yellow-400 font-medium" : "text-white/30 font-medium"}>
                    {g.auto_allocate_percent > 0 ? `${g.auto_allocate_percent}% of Income` : 'Off'}
                  </span>
                </div>
              </div>

              {isDone ? (
                <button className="w-full py-2.5 bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20 rounded-xl text-sm font-medium transition-colors z-10">
                  Goal Achieved
                </button>
              ) : (
                <button className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-colors z-10">
                  Contribute Manually
                </button>
              )}
            </div>
          );
        })}

        {goals.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-2">No goals found</h3>
            <p className="text-sm text-white/50 mb-6 text-center max-w-sm">Create a savings goal to start tracking your financial targets.</p>
            <button onClick={() => setShowAddModal(true)} className="px-6 py-2.5 bg-yellow-400 text-black text-sm font-bold rounded-xl hover:bg-yellow-300">
              Create Goal
            </button>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">Add New Goal</h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/50 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddGoal} className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-white/70 font-medium">Goal Name</label>
                <input type="text" required value={newGoal.name} onChange={e => setNewGoal({...newGoal, name: e.target.value})} className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400/50" placeholder="e.g. New Car Down Payment" />
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-sm text-white/70 font-medium">Target Amount ($)</label>
                  <input type="number" step="0.01" required value={newGoal.target_amount} onChange={e => setNewGoal({...newGoal, target_amount: Number(e.target.value)})} className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400/50" placeholder="10000" />
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-sm text-white/70 font-medium">Current Amount ($)</label>
                  <input type="number" step="0.01" required value={newGoal.current_amount} onChange={e => setNewGoal({...newGoal, current_amount: Number(e.target.value)})} className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400/50" placeholder="0" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-white/70 font-medium">Target Deadline</label>
                <input type="date" required value={newGoal.deadline} onChange={e => setNewGoal({...newGoal, deadline: e.target.value})} className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400/50" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-white/70 font-medium">Auto-allocate (% of Income)</label>
                <input type="number" min="0" max="100" step="1" required value={newGoal.auto_allocate_percent} onChange={e => setNewGoal({...newGoal, auto_allocate_percent: Number(e.target.value)})} className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400/50" placeholder="0" />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-xl text-white/70 hover:bg-white/5 font-medium transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-yellow-400 text-black font-bold hover:bg-yellow-300 transition-colors">Create Goal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
