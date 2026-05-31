import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  Clock,
  Flag,
  Layers3,
  Loader2,
  Target,
  TrendingUp,
} from "lucide-react";
import type { LocalIssue, LocalSprint } from "./types";
import { listProjectIssues, listProjectSprints } from "../../lib/workspaceSync";

function isOpen(issue: LocalIssue) {
  return issue.status !== "Done";
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function ProjectDashboard({ projectId }: { projectId: string }) {
  const [issues, setIssues] = useState<LocalIssue[]>([]);
  const [sprints, setSprints] = useState<LocalSprint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [issueData, sprintData] = await Promise.all([
          listProjectIssues(projectId),
          listProjectSprints(projectId),
        ]);
        setIssues(issueData);
        setSprints(sprintData);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchData();
  }, [projectId]);

  const stats = useMemo(() => {
    const todo = issues.filter((issue) => issue.status === "To Do");
    const doing = issues.filter((issue) => issue.status === "In Progress");
    const review = issues.filter((issue) => issue.status === "In Review");
    const done = issues.filter((issue) => issue.status === "Done");
    const high = issues.filter((issue) => ["Highest", "High"].includes(issue.priority) && isOpen(issue));
    const overdue = issues.filter((issue) => issue.due_date && isOpen(issue) && new Date(issue.due_date) < new Date());
    const dueSoon = issues.filter((issue) => {
      if (!issue.due_date || !isOpen(issue)) return false;
      const diff = new Date(issue.due_date).getTime() - Date.now();
      return diff >= 0 && diff <= 1000 * 60 * 60 * 24 * 7;
    });
    const totalPoints = issues.reduce((sum, issue) => sum + (issue.story_points ?? 0), 0);
    const donePoints = done.reduce((sum, issue) => sum + (issue.story_points ?? 0), 0);
    const progress = issues.length === 0 ? 0 : Math.round((done.length / issues.length) * 100);
    const pointProgress = totalPoints === 0 ? 0 : Math.round((donePoints / totalPoints) * 100);
    const velocity = sprints
      .filter((sprint) => sprint.status === "closed")
      .map((sprint) =>
        issues
          .filter((issue) => issue.sprint_id === sprint.id && issue.status === "Done")
          .reduce((sum, issue) => sum + (issue.story_points ?? 0), 0)
      );
    const averageVelocity =
      velocity.length === 0
        ? donePoints
        : Math.round(velocity.reduce((sum, value) => sum + value, 0) / velocity.length);

    return {
      averageVelocity,
      done,
      doing,
      dueSoon,
      high,
      overdue,
      pointProgress,
      progress,
      review,
      todo,
      totalPoints,
    };
  }, [issues, sprints]);

  const activeSprint = sprints.find((sprint) => sprint.status === "active");
  const recentIssues = [...issues]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 6);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/45" />
      </div>
    );
  }

  return (
    <div className="custom-scrollbar flex h-full flex-col gap-6 overflow-y-auto animate-in fade-in zoom-in-95 duration-300">
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.8fr]">
        <div className="rounded-2xl border border-neutral-800 bg-gradient-to-r from-neutral-900 to-neutral-950 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-yellow-400">
                Project command center
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                Delivery Overview
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">
                Track sprint focus, delivery progress, upcoming dates, and priority pressure.
              </p>
            </div>
            <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-5 py-4 text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-yellow-300">
                Complete
              </p>
              <p className="text-4xl font-bold text-yellow-400">{stats.progress}%</p>
            </div>
          </div>

          <div className="mt-6 h-3 overflow-hidden rounded-full bg-neutral-800">
            <div
              className="h-full rounded-full bg-yellow-400 transition-all duration-700"
              style={{ width: `${stats.progress}%` }}
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile icon={<CircleDashed />} label="To Do" value={stats.todo.length} />
            <StatTile icon={<Clock />} label="In Progress" value={stats.doing.length} tone="yellow" />
            <StatTile icon={<CheckCircle2 />} label="Done" value={stats.done.length} tone="green" />
            <StatTile icon={<TrendingUp />} label="Velocity" value={stats.averageVelocity} />
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Risk Radar</h3>
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="space-y-3">
            <RadarRow icon={<Flag className="h-4 w-4" />} label="High priority open" value={stats.high.length.toString()} />
            <RadarRow icon={<CalendarClock className="h-4 w-4" />} label="Overdue issues" value={stats.overdue.length.toString()} />
            <RadarRow icon={<Layers3 className="h-4 w-4" />} label="Story point progress" value={`${stats.pointProgress}% of ${stats.totalPoints || 0}`} />
            <RadarRow icon={<Target className="h-4 w-4" />} label="Active sprint" value={activeSprint?.name ?? "No active sprint"} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5">
          <h3 className="mb-5 text-lg font-semibold text-white">Status Load</h3>
          <div className="space-y-3">
            {[
              ["To Do", stats.todo.length, "bg-neutral-500"],
              ["In Progress", stats.doing.length, "bg-yellow-400"],
              ["In Review", stats.review.length, "bg-indigo-400"],
              ["Done", stats.done.length, "bg-green-400"],
            ].map(([label, value, color]) => (
              <div key={label} className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-3">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-white/60">
                  <span>{label}</span>
                  <span>{value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-neutral-800">
                  <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: `${issues.length === 0 ? 0 : (Number(value) / issues.length) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5">
          <h3 className="mb-5 text-lg font-semibold text-white">Recent Activity</h3>
          {recentIssues.length === 0 ? (
            <div className="grid h-40 place-items-center rounded-xl border border-dashed border-neutral-800 text-sm font-medium text-white/45">
              No issues created yet. Open the Backlog to create the first item.
            </div>
          ) : (
            <div className="space-y-2">
              {recentIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="shrink-0 text-xs font-bold text-yellow-400">{issue.key}</span>
                      <p className="truncate text-sm font-semibold text-white">{issue.title}</p>
                    </div>
                    <p className="mt-1 text-xs text-white/45">
                      {issue.status} - {issue.priority}
                      {issue.due_date ? ` - due ${formatDate(issue.due_date)}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-white/45">
                    {formatDate(issue.updated_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {stats.dueSoon.length > 0 && (
        <section className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5">
          <h3 className="mb-4 text-lg font-semibold text-white">Due This Week</h3>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {stats.dueSoon.slice(0, 6).map((issue) => (
              <div key={issue.id} className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
                <p className="text-xs font-bold text-yellow-400">{issue.key}</p>
                <p className="mt-2 truncate text-sm font-semibold text-white">{issue.title}</p>
                <p className="mt-1 text-xs text-white/45">Due {formatDate(issue.due_date!)}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone?: "default" | "yellow" | "green";
}) {
  const toneClass =
    tone === "yellow" ? "text-yellow-400" : tone === "green" ? "text-emerald-400" : "text-white";
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-950/40 ${toneClass}`}>
        {icon}
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-white/50">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

function RadarRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-neutral-950/40 text-yellow-400">
          {icon}
        </span>
        <span className="truncate text-sm font-semibold text-white/60">{label}</span>
      </div>
      <span className="max-w-[180px] truncate text-right text-sm font-bold text-white">{value}</span>
    </div>
  );
}
