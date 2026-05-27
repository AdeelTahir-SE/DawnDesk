import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Loader2, LineChart, BarChart3, Clock, PieChartIcon, TrendingUp, Activity, Layers } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  LineChart as RechartsLineChart,
  Line,
  Legend,
} from "recharts";
import type { LocalIssue, LocalSprint } from "./types";

const STATUS_COLORS: Record<string, string> = {
  "To Do": "#a1a1aa",
  "In Progress": "#facc15",
  "In Review": "#818cf8",
  Done: "#4ade80",
};

const PRIORITY_COLORS: Record<string, string> = {
  Highest: "#f87171",
  High: "#fb923c",
  Medium: "#facc15",
  Low: "#60a5fa",
  Lowest: "#94a3b8",
};

const PRIORITY_ORDER = ["Highest", "High", "Medium", "Low", "Lowest"];

function getWeekLabel(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  const month = d.toLocaleString("default", { month: "short" });
  return `${month} ${d.getDate()}`;
}

function getWeekKey(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

function CustomTooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 shadow-xl">
      {label && <p className="mb-1 text-xs font-semibold text-white/70">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-bold" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

function PieTooltipContent({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { fill: string } }>;
}) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 shadow-xl">
      <p className="text-sm font-bold" style={{ color: entry.payload.fill }}>
        {entry.name}: {entry.value}
      </p>
    </div>
  );
}

export default function Reports({ projectId }: { projectId: number | null }) {
  const [issues, setIssues] = useState<LocalIssue[]>([]);
  const [sprints, setSprints] = useState<LocalSprint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId === null) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [issuesData, sprintsData] = await Promise.all([
          invoke<LocalIssue[]>("get_issues", { projectId }),
          invoke<LocalSprint[]>("get_sprints", { projectId })
        ]);
        setIssues(issuesData);
        setSprints(sprintsData);
      } catch (e) {
        console.error("Failed to fetch issues or sprints for reports:", e);
      }
      setLoading(false);
    };
    fetchData();
  }, [projectId]);

  // --- Chart 1: Issue Distribution by Status (Pie) ---
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const issue of issues) {
      counts[issue.status] = (counts[issue.status] || 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      fill: STATUS_COLORS[name] || "#a1a1aa",
    }));
  }, [issues]);

  // --- Chart 2: Issue Distribution by Priority (Horizontal Bar) ---
  const priorityData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const issue of issues) {
      counts[issue.priority] = (counts[issue.priority] || 0) + 1;
    }
    return PRIORITY_ORDER.filter((p) => counts[p]).map((name) => ({
      name,
      count: counts[name],
      fill: PRIORITY_COLORS[name] || "#94a3b8",
    }));
  }, [issues]);

  // --- Chart 3: Created vs Resolved Over Time (Area) ---
  const timelineData = useMemo(() => {
    if (issues.length === 0) return [];

    const weekMap: Record<string, { weekKey: string; label: string; created: number; resolved: number }> = {};

    for (const issue of issues) {
      const createdDate = new Date(issue.created_at);
      const key = getWeekKey(createdDate);
      if (!weekMap[key]) {
        weekMap[key] = { weekKey: key, label: getWeekLabel(createdDate), created: 0, resolved: 0 };
      }
      weekMap[key].created += 1;

      if (issue.status === "Done") {
        const resolvedDate = new Date(issue.updated_at);
        const rKey = getWeekKey(resolvedDate);
        if (!weekMap[rKey]) {
          weekMap[rKey] = { weekKey: rKey, label: getWeekLabel(resolvedDate), created: 0, resolved: 0 };
        }
        weekMap[rKey].resolved += 1;
      }
    }

    return Object.values(weekMap).sort((a, b) => a.weekKey.localeCompare(b.weekKey));
  }, [issues]);

  // --- Chart 4: Time Tracking by Issue Type (Bar) ---
  const timeTrackingData = useMemo(() => {
    const typeMap: Record<string, number> = {};
    for (const issue of issues) {
      if (issue.time_spent_minutes > 0) {
        typeMap[issue.issue_type] = (typeMap[issue.issue_type] || 0) + issue.time_spent_minutes;
      }
    }
    return Object.entries(typeMap).map(([name, minutes]) => ({
      name,
      hours: Math.round((minutes / 60) * 10) / 10,
      minutes,
    }));
  }, [issues]);

  // --- Chart 5: Burndown Chart (current sprint, live issue data) ---
  const burndownData = useMemo(() => {
    const activeSprint = sprints.find((s) => s.status === "active") || sprints[0];
    if (!activeSprint || issues.length === 0) return [];

    const sprintIssues = issues.filter((issue) => issue.sprint_id === activeSprint.id);
    const totalPoints = sprintIssues.reduce((sum, issue) => sum + (issue.story_points ?? 1), 0);
    if (totalPoints === 0) return [];

    const start = activeSprint.start_date ? new Date(activeSprint.start_date) : new Date();
    const end = activeSprint.end_date ? new Date(activeSprint.end_date) : new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
    const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));

    return Array.from({ length: totalDays + 1 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      const completed = sprintIssues
        .filter((issue) => issue.status === "Done" && new Date(issue.updated_at) <= day)
        .reduce((sum, issue) => sum + (issue.story_points ?? 1), 0);
      return {
        day: `Day ${index + 1}`,
        remaining: Math.max(0, totalPoints - completed),
        ideal: Math.max(0, Math.round(totalPoints - (totalPoints / totalDays) * index)),
      };
    });
  }, [sprints, issues]);

  const summaryData = useMemo(() => {
    const completed = issues.filter((issue) => issue.status === "Done");
    const avgLeadDays =
      completed.length === 0
        ? 0
        : Math.round(
            (completed.reduce(
              (sum, issue) => sum + (new Date(issue.updated_at).getTime() - new Date(issue.created_at).getTime()),
              0
            ) /
              completed.length /
              (24 * 60 * 60 * 1000)) *
              10
          ) / 10;
    const openEstimate = issues.reduce((sum, issue) => {
      if (issue.status === "Done") return sum;
      return sum + Math.max(0, (issue.original_estimate_minutes ?? 0) - issue.time_spent_minutes);
    }, 0);
    return {
      avgLeadDays,
      openEstimateHours: Math.round((openEstimate / 60) * 10) / 10,
      doneCount: completed.length,
      retrospective:
        completed.length === 0
          ? "No completed issues yet."
          : `${completed.length} issue${completed.length === 1 ? "" : "s"} completed with average lead time of ${avgLeadDays} day${avgLeadDays === 1 ? "" : "s"}.`,
    };
  }, [issues]);

  // --- Chart 6: Velocity Chart ---
  const velocityData = useMemo(() => {
    const sprintMap: Record<number, { name: string; completed: number; planned: number }> = {};
    for (const sprint of sprints) {
      if (sprint.status !== "planned") {
        sprintMap[sprint.id] = { name: sprint.name, completed: 0, planned: 0 };
      }
    }

    for (const issue of issues) {
      if (issue.sprint_id && sprintMap[issue.sprint_id]) {
        const sp = issue.story_points || 0;
        sprintMap[issue.sprint_id].planned += sp;
        if (issue.status === "Done") {
          sprintMap[issue.sprint_id].completed += sp;
        }
      }
    }
    return Object.values(sprintMap);
  }, [issues, sprints]);

  // --- Chart 7: Cumulative Flow Diagram (Issues per status over time) ---
  const cfdData = useMemo(() => {
    const data = [];
    const now = new Date();
    // Simulate past 14 days
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("default", { month: "short", day: "numeric" });

      let todo = 0;
      let inProgress = 0;
      let inReview = 0;
      let done = 0;

      for (const issue of issues) {
        const created = new Date(issue.created_at);
        const updated = new Date(issue.updated_at);
        
        if (created <= d) {
          if (issue.status === "Done" && updated <= d) {
            done++;
          } else if (issue.status === "In Review" && updated <= d) {
            inReview++;
          } else if (issue.status === "In Progress" && updated <= d) {
            inProgress++;
          } else {
            todo++;
          }
        }
      }
      data.push({ date: label, "To Do": todo, "In Progress": inProgress, "In Review": inReview, "Done": done });
    }
    return data;
  }, [issues]);

  if (projectId === null) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-white/40">Select a project to view reports.</p>
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

  if (issues.length === 0) {
    return (
      <div className="flex flex-col h-full animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">Reports</h2>
            <p className="text-sm text-white/50 mt-1">Analytics and insights into your project's progress.</p>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center bg-neutral-900/40 rounded-xl border border-neutral-800 p-6">
          <div className="text-center">
            <LineChart className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white/60">No data yet</h3>
            <p className="text-sm text-white/40 mt-2 max-w-md">
              Create some issues to see charts and analytics here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fadeIn custom-scrollbar overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">Reports</h2>
          <p className="text-sm text-white/50 mt-1">Analytics and insights into your project's progress.</p>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-4 py-2">
          <p className="text-xs text-white/50">
            Total Issues: <span className="font-bold text-white">{issues.length}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-5 md:grid-cols-3">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Avg Lead / Cycle Time</p>
          <p className="mt-2 text-2xl font-bold text-white">{summaryData.avgLeadDays}d</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Remaining Estimate</p>
          <p className="mt-2 text-2xl font-bold text-white">{summaryData.openEstimateHours}h</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Retrospective Summary</p>
          <p className="mt-2 text-sm font-semibold text-white/70">{summaryData.retrospective}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Chart 1: Issue Distribution by Status */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-neutral-950/60">
              <PieChartIcon className="h-4.5 w-4.5 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Issue Distribution by Status</h3>
              <p className="text-xs text-white/40">Breakdown of all issues by current status</p>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="transparent"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`status-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-3">
            {statusData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                <span className="text-xs text-white/60">
                  {entry.name}{" "}
                  <span className="font-bold text-white/80">({entry.value})</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Issue Distribution by Priority */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-neutral-950/60">
              <BarChart3 className="h-4.5 w-4.5 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Issue Distribution by Priority</h3>
              <p className="text-xs text-white/40">Count of issues at each priority level</p>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#ffffff99", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#ffffff99", fontSize: 12 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<CustomTooltipContent />} cursor={{ fill: "#ffffff08" }} />
                <Bar dataKey="count" name="Issues" radius={[0, 6, 6, 0]} barSize={24}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`priority-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Created vs Resolved Over Time */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-neutral-950/60">
              <LineChart className="h-4.5 w-4.5 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Issues Created vs Resolved</h3>
              <p className="text-xs text-white/40">Weekly trend of new and completed issues</p>
            </div>
          </div>
          {timelineData.length > 0 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
                  <defs>
                    <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#facc15" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="label" tick={{ fill: "#ffffff99", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#ffffff99", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="created"
                    name="Created"
                    stroke="#facc15"
                    strokeWidth={2}
                    fill="url(#gradCreated)"
                    stackId="1"
                  />
                  <Area
                    type="monotone"
                    dataKey="resolved"
                    name="Resolved"
                    stroke="#4ade80"
                    strokeWidth={2}
                    fill="url(#gradResolved)"
                    stackId="2"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-white/40">
              No timeline data available
            </div>
          )}
        </div>

        {/* Chart 4: Time Tracking Summary */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-neutral-950/60">
               <Clock className="h-4.5 w-4.5 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Time Tracking Summary</h3>
              <p className="text-xs text-white/40">Total time logged per issue type (hours)</p>
            </div>
          </div>
          {timeTrackingData.length > 0 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeTrackingData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#ffffff99", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#ffffff99", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    content={<CustomTooltipContent />}
                    cursor={{ fill: "#ffffff08" }}
                  />
                  <Bar dataKey="hours" name="Hours" fill="#facc15" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[280px] items-center justify-center">
              <div className="text-center">
                <Clock className="h-8 w-8 text-white/15 mx-auto mb-2" />
                <p className="text-sm text-white/40">No time logged yet</p>
                <p className="text-xs text-white/30 mt-1">
                  Log time on issues to see tracking data here
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Chart 5: Burndown Chart */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-neutral-950/60">
              <TrendingUp className="h-4.5 w-4.5 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Sprint Burndown</h3>
              <p className="text-xs text-white/40">Remaining vs Ideal effort in current sprint</p>
            </div>
          </div>
          {burndownData.length > 0 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={burndownData} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="day" tick={{ fill: "#ffffff99", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#ffffff99", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltipContent />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="ideal" name="Ideal" stroke="#a1a1aa" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="remaining" name="Remaining" stroke="#facc15" strokeWidth={3} dot={{ fill: "#facc15", r: 4 }} activeDot={{ r: 6 }} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-white/40">
              No active sprint data
            </div>
          )}
        </div>

        {/* Chart 6: Velocity Chart */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-neutral-950/60">
              <Activity className="h-4.5 w-4.5 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Velocity Chart</h3>
              <p className="text-xs text-white/40">Story points completed per sprint</p>
            </div>
          </div>
          {velocityData.length > 0 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={velocityData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#ffffff99", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#ffffff99", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltipContent />} cursor={{ fill: "#ffffff08" }} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="planned" name="Planned" fill="#a1a1aa" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" name="Completed" fill="#4ade80" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-white/40">
              No sprint velocity data
            </div>
          )}
        </div>

        {/* Chart 7: Cumulative Flow Diagram */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5 xl:col-span-2">
          <div className="flex items-center gap-3 mb-5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-neutral-950/60">
              <Layers className="h-4.5 w-4.5 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Cumulative Flow Diagram</h3>
              <p className="text-xs text-white/40">Issues per status over time (Last 14 Days)</p>
            </div>
          </div>
          {cfdData.length > 0 ? (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cfdData} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="date" tick={{ fill: "#ffffff99", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#ffffff99", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltipContent />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="Done" stackId="1" stroke={STATUS_COLORS["Done"]} fill={STATUS_COLORS["Done"]} />
                  <Area type="monotone" dataKey="In Review" stackId="1" stroke={STATUS_COLORS["In Review"]} fill={STATUS_COLORS["In Review"]} />
                  <Area type="monotone" dataKey="In Progress" stackId="1" stroke={STATUS_COLORS["In Progress"]} fill={STATUS_COLORS["In Progress"]} />
                  <Area type="monotone" dataKey="To Do" stackId="1" stroke={STATUS_COLORS["To Do"]} fill={STATUS_COLORS["To Do"]} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[320px] items-center justify-center text-sm text-white/40">
              No flow data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
