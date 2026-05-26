import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Loader2, Map } from "lucide-react";
import type { LocalIssue } from "./types";

const STATUS_BAR_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  "To Do": { bg: "bg-neutral-600", border: "border-neutral-500", text: "text-neutral-300" },
  "In Progress": { bg: "bg-yellow-400", border: "border-yellow-300", text: "text-black" },
  Done: { bg: "bg-green-400", border: "border-green-300", text: "text-black" },
};

function getStatusStyle(status: string) {
  return STATUS_BAR_COLORS[status] ?? STATUS_BAR_COLORS["To Do"];
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, n: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function formatMonth(date: Date): string {
  return date.toLocaleDateString("default", { month: "short", year: "numeric" });
}

interface EpicBar {
  id: number;
  key: string;
  title: string;
  status: string;
  start: Date;
  end: Date;
}

export default function Roadmap({ projectId }: { projectId: number | null }) {
  const [issues, setIssues] = useState<LocalIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId === null) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await invoke<LocalIssue[]>("get_issues", { projectId });
        setIssues(data);
      } catch (e) {
        console.error("Failed to fetch issues for roadmap:", e);
      }
      setLoading(false);
    };
    fetchData();
  }, [projectId]);

  const epics: EpicBar[] = useMemo(() => {
    return issues
      .filter((issue) => issue.issue_type === "Epic")
      .map((issue) => {
        const start = new Date(issue.created_at);
        const end = issue.due_date ? new Date(issue.due_date) : addDays(start, 14);
        return {
          id: issue.id,
          key: issue.key,
          title: issue.title,
          status: issue.status,
          start,
          end: end > start ? end : addDays(start, 14),
        };
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [issues]);

  // Compute the timeline range
  const { timelineStart, timelineEnd, months, totalDays } = useMemo(() => {
    if (epics.length === 0) {
      const now = new Date();
      const s = startOfMonth(now);
      const e = addMonths(s, 3);
      return { timelineStart: s, timelineEnd: e, months: [] as Date[], totalDays: daysBetween(s, e) };
    }

    let earliest = epics[0].start;
    let latest = epics[0].end;
    for (const epic of epics) {
      if (epic.start < earliest) earliest = epic.start;
      if (epic.end > latest) latest = epic.end;
    }

    // Add padding: 1 month before, 1 month after
    const s = startOfMonth(addMonths(earliest, -1));
    const e = addMonths(startOfMonth(latest), 2);
    const total = daysBetween(s, e);

    // Generate month markers
    const monthsList: Date[] = [];
    let cursor = new Date(s);
    while (cursor < e) {
      monthsList.push(new Date(cursor));
      cursor = addMonths(cursor, 1);
    }

    return { timelineStart: s, timelineEnd: e, months: monthsList, totalDays: total };
  }, [epics]);

  if (projectId === null) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-white/40">Select a project to view the roadmap.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/45" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">Roadmap</h2>
          <p className="text-sm text-white/50 mt-1">Timeline view of your Epics and major milestones.</p>
        </div>
        {epics.length > 0 && (
          <div className="flex items-center gap-4">
            {Object.entries(STATUS_BAR_COLORS).map(([status, style]) => (
              <div key={status} className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${style.bg}`} />
                <span className="text-xs text-white/50">{status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {epics.length === 0 ? (
        <div className="flex flex-1 items-center justify-center bg-neutral-900/40 rounded-xl border border-neutral-800 p-6">
          <div className="text-center">
            <Map className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white/60">No Epics on the roadmap</h3>
            <p className="text-sm text-white/40 mt-2 max-w-md">
              Create Epics with due dates to see them mapped on the timeline. Epics represent major features or milestones in your project.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 rounded-2xl border border-neutral-800 bg-neutral-900/40 overflow-hidden flex flex-col min-h-0">
          {/* Scrollable container */}
          <div className="overflow-auto custom-scrollbar flex-1">
            <div className="min-w-[800px]">
              {/* Month Headers */}
              <div className="flex border-b border-neutral-800 sticky top-0 z-10 bg-neutral-900/95 backdrop-blur-sm">
                {/* Left label column */}
                <div className="w-[260px] shrink-0 px-5 py-3 border-r border-neutral-800">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/40">Epic</span>
                </div>
                {/* Month columns */}
                <div className="flex-1 relative">
                  <div className="flex h-full">
                    {months.map((month, i) => {
                      const monthDays = daysBetween(month, i < months.length - 1 ? months[i + 1] : timelineEnd);
                      const widthPct = (monthDays / totalDays) * 100;
                      return (
                        <div
                          key={month.toISOString()}
                          className="border-r border-neutral-800/60 px-3 py-3 shrink-0"
                          style={{ width: `${widthPct}%` }}
                        >
                          <span className="text-xs font-semibold text-white/50">{formatMonth(month)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Epic Rows */}
              {epics.map((epic) => {
                const style = getStatusStyle(epic.status);
                const offsetDays = Math.max(0, daysBetween(timelineStart, epic.start));
                const durationDays = Math.max(1, daysBetween(epic.start, epic.end));
                const leftPct = (offsetDays / totalDays) * 100;
                const widthPct = Math.min((durationDays / totalDays) * 100, 100 - leftPct);

                return (
                  <div
                    key={epic.id}
                    className="flex border-b border-neutral-800/50 hover:bg-neutral-800/20 transition-colors group"
                  >
                    {/* Epic label */}
                    <div className="w-[260px] shrink-0 px-5 py-4 border-r border-neutral-800/50 flex items-center gap-3 min-h-[56px]">
                      <span className="text-xs font-mono font-bold text-yellow-400/80 shrink-0">{epic.key}</span>
                      <span className="text-sm text-white/80 truncate">{epic.title}</span>
                    </div>
                    {/* Timeline bar area */}
                    <div className="flex-1 relative py-3 px-1">
                      {/* Month grid lines */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {months.map((month, i) => {
                          const monthDays = daysBetween(month, i < months.length - 1 ? months[i + 1] : timelineEnd);
                          const mWidthPct = (monthDays / totalDays) * 100;
                          return (
                            <div
                              key={month.toISOString()}
                              className="border-r border-neutral-800/30 shrink-0 h-full"
                              style={{ width: `${mWidthPct}%` }}
                            />
                          );
                        })}
                      </div>
                      {/* The bar */}
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 h-7 rounded-md ${style.bg} border ${style.border} shadow-sm flex items-center px-2 overflow-hidden transition-all group-hover:shadow-md group-hover:shadow-black/30`}
                        style={{
                          left: `${leftPct}%`,
                          width: `${Math.max(widthPct, 1.5)}%`,
                        }}
                        title={`${epic.key}: ${epic.title}\n${epic.start.toLocaleDateString()} → ${epic.end.toLocaleDateString()}\nStatus: ${epic.status}`}
                      >
                        <span className={`text-[10px] font-bold truncate ${style.text}`}>
                          {epic.key}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Today marker overlay — rendered in the timeline area */}
              {(() => {
                const today = new Date();
                if (today >= timelineStart && today <= timelineEnd) {
                  const todayOffset = daysBetween(timelineStart, today);
                  const todayPct = (todayOffset / totalDays) * 100;
                  return (
                    <div
                      className="absolute top-0 bottom-0 w-px bg-yellow-400/50 pointer-events-none z-20"
                      style={{
                        left: `calc(260px + (100% - 260px) * ${todayPct / 100})`,
                      }}
                    >
                      <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-yellow-400" />
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
