import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Download, Loader2, Play, Save, Search, Trash2 } from "lucide-react";
import { useAppLogger } from "../../utils/LoggerContext";
import type { LocalIssue, LocalSavedFilter, LocalSprint } from "./types";

const PRIORITIES = ["All", "Highest", "High", "Medium", "Low", "Lowest"];
const TYPES = ["All", "Epic", "Story", "Task", "Bug", "Subtask"];
const STATUSES = ["All", "To Do", "In Progress", "In Review", "Done"];
const SORTS = ["Updated", "Priority", "Due Date", "Status", "Created"];

function priorityRank(priority: string) {
  return { Highest: 5, High: 4, Medium: 3, Low: 2, Lowest: 1 }[priority] ?? 0;
}

function downloadText(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export default function SearchAndFilters({ projectId }: { projectId: number | null }) {
  const { logSuccess, logError, logWarning } = useAppLogger();
  const [issues, setIssues] = useState<LocalIssue[]>([]);
  const [sprints, setSprints] = useState<LocalSprint[]>([]);
  const [savedFilters, setSavedFilters] = useState<LocalSavedFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [jql, setJql] = useState("");
  const [filterName, setFilterName] = useState("");
  const [type, setType] = useState("All");
  const [priority, setPriority] = useState("All");
  const [status, setStatus] = useState("All");
  const [sprintId, setSprintId] = useState("All");
  const [sortBy, setSortBy] = useState("Updated");

  const fetchData = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [issueData, sprintData, filterData] = await Promise.all([
        invoke<LocalIssue[]>("get_issues", { projectId }),
        invoke<LocalSprint[]>("get_sprints", { projectId }),
        invoke<LocalSavedFilter[]>("get_saved_filters", { projectId }),
      ]);
      setIssues(issueData);
      setSprints(sprintData);
      setSavedFilters(filterData);
    } catch (err) {
      console.error("Failed to load search data:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const filteredIssues = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...issues]
      .filter((issue) => {
        if (q && !`${issue.key} ${issue.title} ${issue.description ?? ""}`.toLowerCase().includes(q)) return false;
        if (type !== "All" && issue.issue_type !== type) return false;
        if (priority !== "All" && issue.priority !== priority) return false;
        if (status !== "All" && issue.status !== status) return false;
        if (sprintId !== "All" && String(issue.sprint_id ?? "backlog") !== sprintId) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "Priority") return priorityRank(b.priority) - priorityRank(a.priority);
        if (sortBy === "Due Date") return String(a.due_date ?? "9999").localeCompare(String(b.due_date ?? "9999"));
        if (sortBy === "Status") return a.status.localeCompare(b.status);
        if (sortBy === "Created") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
  }, [issues, query, type, priority, status, sprintId, sortBy]);

  const runJql = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await invoke<LocalIssue[]>("jql_search", { projectId, jql });
      setIssues(data);
      logSuccess("Project search complete", `${data.length} issue${data.length === 1 ? "" : "s"} found.`, { source: "project-manager" });
    } catch (err) {
      console.error("JQL search failed:", err);
      logError("Project search failed", String(err), { source: "project-manager" });
    }
    setLoading(false);
  };

  const saveFilter = async () => {
    if (!projectId || !filterName.trim()) return;
    const filterQuery = jql.trim() || [
      status !== "All" ? `status = "${status}"` : "",
      priority !== "All" ? `priority = "${priority}"` : "",
      type !== "All" ? `issue_type = "${type}"` : "",
    ].filter(Boolean).join(" AND ");
    try {
      await invoke("create_saved_filter", {
        projectId,
        name: filterName.trim(),
        jqlQuery: filterQuery || "1=1",
      });
      logSuccess("Project filter saved", filterName.trim(), { source: "project-manager" });
      setFilterName("");
      await fetchData();
    } catch (err) {
      console.error("Failed to save filter:", err);
      logError("Project filter save failed", String(err), { source: "project-manager" });
    }
  };

  const exportCsv = () => {
    const rows = [
      ["Key", "Title", "Type", "Status", "Priority", "Story Points", "Due Date", "Created", "Updated"],
      ...filteredIssues.map((issue) => [
        issue.key,
        issue.title,
        issue.issue_type,
        issue.status,
        issue.priority,
        issue.story_points ?? "",
        issue.due_date ?? "",
        issue.created_at,
        issue.updated_at,
      ]),
    ];
    downloadText("project-issues.csv", rows.map((row) => row.map(csvEscape).join(",")).join("\n"), "text/csv");
    logSuccess("Project CSV exported", `${filteredIssues.length} issue${filteredIssues.length === 1 ? "" : "s"} exported.`, { source: "project-manager" });
  };

  const exportJson = () => {
    downloadText("project-issues.json", JSON.stringify(filteredIssues, null, 2), "application/json");
    logSuccess("Project JSON exported", `${filteredIssues.length} issue${filteredIssues.length === 1 ? "" : "s"} exported.`, { source: "project-manager" });
  };

  if (loading && issues.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/45" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-5 animate-fadeIn">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Search & Filters</h2>
          <p className="mt-1 text-sm text-white/50">Find, sort, save, and export live project issues.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="dd-btn-secondary">
            <Download className="h-4 w-4" /> CSV
          </button>
          <button onClick={exportJson} className="dd-btn-secondary">
            <Download className="h-4 w-4" /> JSON
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.3fr_repeat(5,0.7fr)]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Full-text search..."
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-yellow-400/60"
            />
          </div>
          {[["Type", type, setType, TYPES], ["Priority", priority, setPriority, PRIORITIES], ["Status", status, setStatus, STATUSES], ["Sprint", sprintId, setSprintId, ["All", "backlog", ...sprints.map((s) => String(s.id))]], ["Sort", sortBy, setSortBy, SORTS]].map(([label, value, setter, options]) => (
            <select
              key={label as string}
              value={value as string}
              onChange={(e) => (setter as (value: string) => void)(e.target.value)}
              className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none focus:border-yellow-400/60"
              title={label as string}
            >
              {(options as string[]).map((option) => (
                <option key={option} value={option}>
                  {option === "backlog" ? "Backlog" : sprints.find((s) => String(s.id) === option)?.name ?? option}
                </option>
              ))}
            </select>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto_auto]">
          <input
            value={jql}
            onChange={(e) => setJql(e.target.value)}
            placeholder='JQL, e.g. status = "Done" AND priority = "High"'
            className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none focus:border-yellow-400/60"
          />
          <button onClick={runJql} className="dd-btn-primary">
            <Play className="h-4 w-4" /> Run
          </button>
          <button onClick={fetchData} className="dd-btn-secondary">Reset</button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 xl:grid-cols-[1fr_280px]">
        <div className="custom-scrollbar overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-900/40">
          <div className="sticky top-0 z-10 grid grid-cols-[110px_1fr_120px_120px_120px] gap-3 border-b border-neutral-800 bg-neutral-900/95 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white/40">
            <span>Key</span><span>Title</span><span>Status</span><span>Priority</span><span>Due</span>
          </div>
          {filteredIssues.map((issue) => (
            <div key={issue.id} className="grid grid-cols-[110px_1fr_120px_120px_120px] gap-3 border-b border-neutral-800/50 px-4 py-3 text-sm last:border-0">
              <span className="font-bold text-yellow-400">{issue.key}</span>
              <span className="truncate text-white">{issue.title}</span>
              <span className="text-white/60">{issue.status}</span>
              <span className="text-white/60">{issue.priority}</span>
              <span className="text-white/45">{issue.due_date ?? "-"}</span>
            </div>
          ))}
          {filteredIssues.length === 0 && (
            <div className="grid h-48 place-items-center text-sm text-white/40">No issues match these filters.</div>
          )}
        </div>

        <aside className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
          <h3 className="text-sm font-bold text-white">Saved Filters</h3>
          <div className="mt-3 flex gap-2">
            <input
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="Filter name"
              className="min-w-0 flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white outline-none"
            />
            <button onClick={saveFilter} className="rounded-lg bg-yellow-400 px-3 text-black">
              <Save className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {savedFilters.map((filter) => (
              <div key={filter.id} className="rounded-lg border border-neutral-800 bg-neutral-950/50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => setJql(filter.jql_query)}
                    className="truncate text-left text-sm font-semibold text-white hover:text-yellow-400"
                  >
                    {filter.name}
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await invoke("delete_saved_filter", { id: filter.id });
                        await fetchData();
                        logWarning("Project filter deleted", filter.name, { source: "project-manager" });
                      } catch (err) {
                        console.error("Failed to delete filter:", err);
                        logError("Project filter delete failed", String(err), { source: "project-manager" });
                      }
                    }}
                    className="text-white/35 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1 truncate text-xs text-white/35">{filter.jql_query}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
