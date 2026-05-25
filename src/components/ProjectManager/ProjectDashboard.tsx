import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { CheckCircle2, CircleDashed, Clock, Loader2, LayoutDashboard } from "lucide-react";
import { LocalTask } from "./KanbanBoard";

export default function ProjectDashboard({ projectId }: { projectId: number }) {
  const [tasks, setTasks] = useState<LocalTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const data = await invoke<LocalTask[]>("get_tasks", { projectId });
        setTasks(data);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchTasks();
  }, [projectId]);

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 text-white/30 animate-spin" /></div>;
  }

  const todoCount = tasks.filter(t => t.status === 'todo').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const doneCount = tasks.filter(t => t.status === 'done').length;
  const totalCount = tasks.length;
  const progress = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  const recentTasks = tasks.slice(0, 5); // Assuming they come back sorted DESC by ID

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-300">
      
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Progress Card */}
        <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 flex items-center justify-between col-span-1 md:col-span-2 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-48 h-48 bg-yellow-400/5 blur-3xl rounded-full group-hover:bg-yellow-400/10 transition-colors" />
          <div className="flex flex-col gap-2 z-10">
            <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 text-white" /> Project Progress
            </h3>
            <div className="flex items-end gap-3 mt-2">
              <span className="text-5xl font-black text-white">{progress}%</span>
              <span className="text-sm text-white/50 mb-1">completed</span>
            </div>
          </div>
          <div className="w-24 h-24 rounded-full border-8 border-white/5 flex items-center justify-center relative z-10">
             <div className="absolute inset-0 rounded-full border-8 border-yellow-400 border-l-transparent border-b-transparent transform rotate-45" style={{ opacity: progress > 0 ? 1 : 0 }} />
             <span className="text-xl font-bold text-white">{doneCount}/{totalCount}</span>
          </div>
        </div>

        {/* Status Cards */}
        <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-white/50 mb-4">
            <CircleDashed className="w-5 h-5 text-white/30" />
            <h3 className="text-sm font-bold uppercase tracking-wider">To Do</h3>
          </div>
          <span className="text-4xl font-black text-white">{todoCount}</span>
        </div>

        <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-white/50 mb-4">
            <Clock className="w-5 h-5 text-yellow-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Doing</h3>
          </div>
          <span className="text-4xl font-black text-white">{inProgressCount}</span>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 flex-1">
        <h3 className="text-lg font-bold text-white mb-6">Recent Tasks</h3>
        {recentTasks.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-xl">
            <span className="text-sm font-medium text-white/30">No tasks created yet. Head over to the Tasks tab.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {recentTasks.map(t => (
              <div key={t.id} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-black/40 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-4">
                  {t.status === 'done' ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : t.status === 'in_progress' ? (
                    <Clock className="w-5 h-5 text-yellow-400" />
                  ) : (
                    <CircleDashed className="w-5 h-5 text-white/30" />
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white leading-none">{t.title}</span>
                    <span className="text-xs text-white/40 mt-1 capitalize">{t.status.replace('_', ' ')}</span>
                  </div>
                </div>
                <div className="text-xs text-white/30">
                  {new Date(t.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
