import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Clock,
  Flag,
  Layers3,
  Loader2,
  Target,
  TrendingUp,
} from "lucide-react";
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

  const stats = useMemo(() => {
    const todo = tasks.filter((task) => task.status === "todo");
    const doing = tasks.filter((task) => task.status === "in_progress");
    const done = tasks.filter((task) => task.status === "done");
    const high = tasks.filter((task) => task.priority === "high" && task.status !== "done");
    const dueSoon = tasks.filter((task) => {
      if (!task.due_date || task.status === "done") return false;
      const diff = new Date(task.due_date).getTime() - Date.now();
      return diff <= 1000 * 60 * 60 * 24 * 7;
    });
    const progress = tasks.length === 0 ? 0 : Math.round((done.length / tasks.length) * 100);
    const velocity = Math.max(0, done.length * 2 + doing.length - high.length);
    return { doing, done, dueSoon, high, progress, todo, velocity };
  }, [tasks]);

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-white/45" /></div>;
  }

  const recentTasks = tasks.slice(0, 6);

  return (
    <div className="custom-scrollbar flex h-full flex-col gap-6 overflow-y-auto animate-in fade-in zoom-in-95 duration-300">
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.8fr]">
        <div className="rounded-2xl border border-neutral-800 bg-gradient-to-r from-neutral-900 to-neutral-950 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-yellow-400">Project command center</p>
              <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Delivery Overview</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">
                Progress, priority pressure, and current execution load for this workspace.
              </p>
            </div>
            <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-5 py-4 text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-yellow-300">Complete</p>
              <p className="text-4xl font-bold text-yellow-400">{stats.progress}%</p>
            </div>
          </div>
          <div className="mt-6 h-3 overflow-hidden rounded-full bg-neutral-800">
            <div className="h-full rounded-full bg-yellow-400 transition-all duration-700" style={{ width: `${stats.progress}%` }} />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile icon={<CircleDashed />} label="To Do" value={stats.todo.length} />
            <StatTile icon={<Clock />} label="In Progress" value={stats.doing.length} tone="yellow" />
            <StatTile icon={<CheckCircle2 />} label="Done" value={stats.done.length} tone="green" />
            <StatTile icon={<TrendingUp />} label="Velocity" value={stats.velocity} />
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Risk Radar</h3>
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="space-y-3">
            <RadarRow icon={<Flag className="h-4 w-4" />} label="High priority open" value={stats.high.length.toString()} />
            <RadarRow icon={<Clock className="h-4 w-4" />} label="Due within 7 days" value={stats.dueSoon.length.toString()} />
            <RadarRow icon={<Layers3 className="h-4 w-4" />} label="Total task load" value={tasks.length.toString()} />
            <RadarRow icon={<Target className="h-4 w-4" />} label="Focus lane" value={stats.doing[0]?.title ?? "Pick next task"} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5">
          <h3 className="mb-5 text-lg font-semibold text-white">Priority Matrix</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(["high", "med", "low"] as const).map((priority) => {
              const priorityTasks = tasks.filter((task) => task.priority === priority && task.status !== "done");
              return (
                <div key={priority} className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/50">{priority} priority</p>
                  <p className="mt-2 text-2xl font-bold text-white">{priorityTasks.length}</p>
                  <p className="mt-1 truncate text-xs text-white/45">{priorityTasks[0]?.title ?? "No open items"}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5">
          <h3 className="mb-5 text-lg font-semibold text-white">Recent Activity</h3>
          {recentTasks.length === 0 ? (
            <div className="grid h-40 place-items-center rounded-xl border border-dashed border-neutral-800 text-sm font-medium text-white/45">
              No tasks created yet. Open the Tasks tab to plan the first sprint.
            </div>
          ) : (
            <div className="space-y-2">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between gap-4 rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{task.title}</p>
                    <p className="mt-1 text-xs capitalize text-white/45">{task.status.replace("_", " ")} - {task.priority}</p>
                  </div>
                  <span className="shrink-0 text-xs text-white/45">{new Date(task.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatTile({ icon, label, value, tone = "default" }: { icon: ReactNode; label: string; value: number; tone?: "default" | "yellow" | "green" }) {
  const toneClass = tone === "yellow" ? "text-yellow-400" : tone === "green" ? "text-emerald-400" : "text-white";
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-950/40 ${toneClass}`}>{icon}</div>
      <p className="text-xs font-semibold uppercase tracking-wider text-white/50">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

function RadarRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-neutral-950/40 text-yellow-400">{icon}</span>
        <span className="truncate text-sm font-semibold text-white/60">{label}</span>
      </div>
      <span className="max-w-[180px] truncate text-right text-sm font-bold text-white">{value}</span>
    </div>
  );
}
