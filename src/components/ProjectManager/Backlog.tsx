import { useState, useEffect, useMemo, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { LocalIssue, LocalSprint } from "./types";
import {
  Loader2,
  Plus,
  ChevronDown,
  ChevronRight,
  Calendar,
  Play,
  CheckCircle2,
  Bug,
  BookOpen,
  CheckSquare,
  Layers,
  GitBranch,
  ListTodo,
  Filter,
  X,
} from "lucide-react";
import IssueDetailModal from "./IssueDetailModal";

const PRIORITY_COLORS: Record<string, string> = {
  Highest: "bg-red-400",
  High: "bg-orange-400",
  Medium: "bg-yellow-400",
  Low: "bg-blue-400",
  Lowest: "bg-slate-400",
};

const SPRINT_STATUS_STYLES: Record<string, string> = {
  planned:
    "text-blue-400 bg-blue-400/10 border-blue-400/20",
  active:
    "text-green-400 bg-green-400/10 border-green-400/20",
  closed:
    "text-white/40 bg-neutral-800 border-neutral-700",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  Bug: <Bug className="w-3.5 h-3.5 text-red-400" />,
  Story: <BookOpen className="w-3.5 h-3.5 text-green-400" />,
  Task: <CheckSquare className="w-3.5 h-3.5 text-blue-400" />,
  Epic: <Layers className="w-3.5 h-3.5 text-purple-400" />,
  Subtask: <GitBranch className="w-3.5 h-3.5 text-cyan-400" />,
};

const ISSUE_TYPES = ["All", "Epic", "Story", "Task", "Bug", "Subtask"];
const PRIORITIES = ["All", "Highest", "High", "Medium", "Low", "Lowest"];
const STATUSES = ["All", "To Do", "In Progress", "In Review", "Done"];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SprintAssignDropdown({
  sprints,
  currentSprintId,
  onAssign,
}: {
  sprints: LocalSprint[];
  currentSprintId: number | null;
  onAssign: (sprintId: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const eligible = sprints.filter(
    (s) => s.status === "planned" || s.status === "active"
  );

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="text-[10px] font-semibold text-white/40 hover:text-yellow-400 bg-neutral-800 hover:bg-neutral-700 px-2 py-1 rounded transition-colors flex items-center gap-1"
        title="Assign to sprint"
      >
        Sprint <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 w-44 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl overflow-hidden animate-fadeIn">
          {eligible.length === 0 && (
            <p className="px-3 py-2 text-xs text-white/40">
              No available sprints
            </p>
          )}
          {eligible.map((sprint) => (
            <button
              key={sprint.id}
              onClick={(e) => {
                e.stopPropagation();
                onAssign(sprint.id);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                sprint.id === currentSprintId
                  ? "text-yellow-400 bg-yellow-400/10"
                  : "text-white/70 hover:bg-yellow-400/10 hover:text-yellow-400"
              }`}
            >
              {sprint.name}
              <span className="ml-1.5 text-[10px] text-white/30">
                ({sprint.status})
              </span>
            </button>
          ))}
          {currentSprintId && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAssign(null);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs text-red-400/70 hover:bg-red-400/10 hover:text-red-400 border-t border-neutral-800 transition-colors"
            >
              Remove from sprint
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function Backlog({ projectId }: { projectId: number | null }) {
  const [issues, setIssues] = useState<LocalIssue[]>([]);
  const [sprints, setSprints] = useState<LocalSprint[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedIssue, setSelectedIssue] = useState<LocalIssue | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Create sprint inline form
  const [showCreateSprint, setShowCreateSprint] = useState(false);
  const [newSprintName, setNewSprintName] = useState("");
  const [newSprintStart, setNewSprintStart] = useState("");
  const [newSprintEnd, setNewSprintEnd] = useState("");
  const [creatingSprint, setCreatingSprint] = useState(false);

  // Collapsible sections
  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >({});

  // Filters
  const [filterType, setFilterType] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [issuesRes, sprintsRes] = await Promise.all([
        invoke<LocalIssue[]>("get_issues", { projectId }),
        invoke<LocalSprint[]>("get_sprints", { projectId }),
      ]);
      setIssues(issuesRes);
      setSprints(sprintsRes);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const filteredIssues = useMemo(() => {
    return issues.filter((i) => {
      if (filterType !== "All" && i.issue_type !== filterType) return false;
      if (filterPriority !== "All" && i.priority !== filterPriority)
        return false;
      if (filterStatus !== "All" && i.status !== filterStatus) return false;
      return true;
    });
  }, [issues, filterType, filterPriority, filterStatus]);

  // Group: sprints first (sorted: active, planned, closed), then backlog
  const sprintSections = useMemo(() => {
    const order: Record<string, number> = { active: 0, planned: 1, closed: 2 };
    const sorted = [...sprints].sort(
      (a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9)
    );
    return sorted.map((sprint) => ({
      sprint,
      issues: filteredIssues.filter((i) => i.sprint_id === sprint.id),
    }));
  }, [sprints, filteredIssues]);

  const backlogIssues = useMemo(
    () => filteredIssues.filter((i) => i.sprint_id === null),
    [filteredIssues]
  );

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCreateSprint = async () => {
    if (!projectId || !newSprintName.trim()) return;
    setCreatingSprint(true);
    try {
      await invoke("create_sprint", {
        input: {
          project_id: projectId,
          name: newSprintName.trim(),
          status: "planned",
          start_date: newSprintStart || null,
          end_date: newSprintEnd || null,
        },
      });
      setNewSprintName("");
      setNewSprintStart("");
      setNewSprintEnd("");
      setShowCreateSprint(false);
      await fetchData();
    } catch (err) {
      console.error("Failed to create sprint:", err);
    }
    setCreatingSprint(false);
  };

  const handleSprintAction = async (
    sprint: LocalSprint,
    newStatus: string
  ) => {
    try {
      await invoke("update_sprint", {
        id: sprint.id,
        name: sprint.name,
        status: newStatus,
        startDate: sprint.start_date,
        endDate: sprint.end_date,
      });
      await fetchData();
    } catch (err) {
      console.error("Failed to update sprint:", err);
    }
  };

  const handleAssignSprint = async (
    issue: LocalIssue,
    sprintId: number | null
  ) => {
    try {
      await invoke("update_issue", {
        input: {
          id: issue.id,
          sprint_id: sprintId,
          issue_type: issue.issue_type,
          title: issue.title,
          description: issue.description,
          status: issue.status,
          priority: issue.priority,
          story_points: issue.story_points,
          time_spent_minutes: issue.time_spent_minutes,
          due_date: issue.due_date,
          updated_at: new Date().toISOString(),
        },
      });
      setIssues((prev) =>
        prev.map((i) =>
          i.id === issue.id ? { ...i, sprint_id: sprintId } : i
        )
      );
    } catch (err) {
      console.error("Failed to assign sprint:", err);
    }
  };

  const openCreateModal = () => {
    setSelectedIssue(null);
    setIsModalOpen(true);
  };

  const openIssueModal = (issue: LocalIssue) => {
    setSelectedIssue(issue);
    setIsModalOpen(true);
  };

  const totalSP = (issueList: LocalIssue[]) =>
    issueList.reduce((acc, i) => acc + (i.story_points ?? 0), 0);

  const hasActiveFilters =
    filterType !== "All" ||
    filterPriority !== "All" ||
    filterStatus !== "All";

  const clearFilters = () => {
    setFilterType("All");
    setFilterPriority("All");
    setFilterStatus("All");
  };

  if (loading && issues.length === 0) {
    return (
      <div className="flex justify-center mt-20">
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fadeIn relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            Backlog
          </h2>
          <p className="text-sm text-white/50 mt-1">
            Plan your upcoming sprints and prioritize issues.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors border ${
              hasActiveFilters
                ? "border-yellow-400/40 text-yellow-400 bg-yellow-400/10"
                : "border-neutral-800 text-white/60 bg-neutral-900/40 hover:text-white hover:bg-neutral-800"
            }`}
          >
            <Filter className="w-4 h-4" /> Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
            )}
          </button>
          <button
            onClick={() => setShowCreateSprint(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-neutral-900/60 border border-neutral-800 px-4 py-2.5 text-sm font-semibold text-white/70 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Sprint
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-bold text-black transition-colors hover:bg-yellow-300"
          >
            <Plus className="w-4 h-4" /> Create Issue
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="flex items-center gap-4 mb-4 p-3 bg-neutral-900/40 rounded-xl border border-neutral-800 animate-fadeIn">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">
              Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white outline-none focus:border-yellow-400/60"
            >
              {ISSUE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">
              Priority
            </label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white outline-none focus:border-yellow-400/60"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white outline-none focus:border-yellow-400/60"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-white/40 hover:text-yellow-400 flex items-center gap-1 transition-colors ml-auto"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      )}

      {/* Create Sprint Inline Form */}
      {showCreateSprint && (
        <div className="mb-4 p-4 bg-neutral-900/60 rounded-xl border border-neutral-800 animate-fadeIn">
          <h3 className="text-sm font-semibold text-white mb-3">
            New Sprint
          </h3>
          <div className="flex items-end gap-3">
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                Name
              </label>
              <input
                type="text"
                value={newSprintName}
                onChange={(e) => setNewSprintName(e.target.value)}
                placeholder="Sprint name"
                className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-yellow-400/60 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                Start Date
              </label>
              <input
                type="date"
                value={newSprintStart}
                onChange={(e) => setNewSprintStart(e.target.value)}
                className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400/60 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                End Date
              </label>
              <input
                type="date"
                value={newSprintEnd}
                onChange={(e) => setNewSprintEnd(e.target.value)}
                className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400/60 transition-colors"
              />
            </div>
            <button
              onClick={handleCreateSprint}
              disabled={creatingSprint || !newSprintName.trim()}
              className="rounded-lg bg-yellow-400 px-5 py-2 text-sm font-bold text-black hover:bg-yellow-300 transition-colors disabled:opacity-40"
            >
              {creatingSprint ? "Creating…" : "Create"}
            </button>
            <button
              onClick={() => setShowCreateSprint(false)}
              className="rounded-lg border border-neutral-800 px-4 py-2 text-sm font-semibold text-white/50 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pb-4">
        {/* Sprint Sections */}
        {sprintSections.map(({ sprint, issues: sectionIssues }) => {
          const isCollapsed = collapsedSections[`sprint-${sprint.id}`];
          const sp = totalSP(sectionIssues);
          return (
            <div
              key={sprint.id}
              className="bg-neutral-900/40 rounded-xl border border-neutral-800 overflow-hidden"
            >
              {/* Sprint Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-neutral-800/30 transition-colors"
                onClick={() => toggleSection(`sprint-${sprint.id}`)}
              >
                <div className="flex items-center gap-3">
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4 text-white/40" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/40" />
                  )}
                  <h3 className="text-sm font-bold text-white">
                    {sprint.name}
                  </h3>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${SPRINT_STATUS_STYLES[sprint.status] ?? "text-white/40 bg-neutral-800 border-neutral-700"}`}
                  >
                    {sprint.status}
                  </span>
                  {(sprint.start_date || sprint.end_date) && (
                    <span className="text-xs text-white/40 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {sprint.start_date
                        ? formatDate(sprint.start_date)
                        : "—"}{" "}
                      →{" "}
                      {sprint.end_date ? formatDate(sprint.end_date) : "—"}
                    </span>
                  )}
                  <span className="text-xs text-white/40">
                    {sectionIssues.length} issue
                    {sectionIssues.length !== 1 ? "s" : ""}
                  </span>
                  {sp > 0 && (
                    <span className="text-[10px] font-bold text-white/50 bg-neutral-800 px-2 py-0.5 rounded-full">
                      {sp} SP
                    </span>
                  )}
                </div>

                <div
                  className="flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {sprint.status === "planned" && (
                    <button
                      onClick={() => handleSprintAction(sprint, "active")}
                      className="flex items-center gap-1.5 text-xs font-semibold text-green-400 bg-green-400/10 hover:bg-green-400/20 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" /> Start Sprint
                    </button>
                  )}
                  {sprint.status === "active" && (
                    <button
                      onClick={() => handleSprintAction(sprint, "closed")}
                      className="flex items-center gap-1.5 text-xs font-semibold text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Complete Sprint
                    </button>
                  )}
                </div>
              </div>

              {/* Sprint Issues */}
              {!isCollapsed && (
                <div className="border-t border-neutral-800">
                  {sectionIssues.length === 0 ? (
                    <div className="flex items-center justify-center h-16 text-xs text-white/30">
                      No issues in this sprint
                    </div>
                  ) : (
                    <div className="divide-y divide-neutral-800/60">
                      {sectionIssues.map((issue) => (
                        <IssueRow
                          key={issue.id}
                          issue={issue}
                          sprints={sprints}
                          onClick={() => openIssueModal(issue)}
                          onAssignSprint={(sprintId) =>
                            handleAssignSprint(issue, sprintId)
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Backlog Section */}
        <div className="bg-neutral-900/40 rounded-xl border border-neutral-800 overflow-hidden">
          <div
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-neutral-800/30 transition-colors"
            onClick={() => toggleSection("backlog")}
          >
            <div className="flex items-center gap-3">
              {collapsedSections["backlog"] ? (
                <ChevronRight className="w-4 h-4 text-white/40" />
              ) : (
                <ChevronDown className="w-4 h-4 text-white/40" />
              )}
              <ListTodo className="w-4 h-4 text-white/50" />
              <h3 className="text-sm font-bold text-white">Backlog</h3>
              <span className="text-xs text-white/40">
                {backlogIssues.length} issue
                {backlogIssues.length !== 1 ? "s" : ""}
              </span>
              {totalSP(backlogIssues) > 0 && (
                <span className="text-[10px] font-bold text-white/50 bg-neutral-800 px-2 py-0.5 rounded-full">
                  {totalSP(backlogIssues)} SP
                </span>
              )}
            </div>
          </div>

          {!collapsedSections["backlog"] && (
            <div className="border-t border-neutral-800">
              {backlogIssues.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-24 text-white/30">
                  <ListTodo className="w-8 h-8 mb-2" />
                  <p className="text-xs">
                    No unassigned issues. Create issues to fill your backlog.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-800/60">
                  {backlogIssues.map((issue) => (
                    <IssueRow
                      key={issue.id}
                      issue={issue}
                      sprints={sprints}
                      onClick={() => openIssueModal(issue)}
                      onAssignSprint={(sprintId) =>
                        handleAssignSprint(issue, sprintId)
                      }
                      showAssign
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Issue Detail Modal */}
      {isModalOpen && projectId && (
        <IssueDetailModal
          issue={selectedIssue}
          projectId={projectId}
          onClose={() => setIsModalOpen(false)}
          onSaved={() => {
            setIsModalOpen(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

/* ---- Issue Row Component ---- */

function IssueRow({
  issue,
  sprints,
  onClick,
  onAssignSprint,
  showAssign = false,
}: {
  issue: LocalIssue;
  sprints: LocalSprint[];
  onClick: () => void;
  onAssignSprint: (sprintId: number | null) => void;
  showAssign?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between px-4 py-3 hover:bg-neutral-800/30 cursor-pointer transition-colors group"
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Key */}
        <span className="text-xs font-bold text-yellow-400 w-20 shrink-0">
          {issue.key}
        </span>
        {/* Type Icon */}
        <span className="flex items-center gap-1.5 shrink-0">
          {TYPE_ICONS[issue.issue_type] ?? null}
          <span className="text-[10px] font-semibold text-white/40">
            {issue.issue_type}
          </span>
        </span>
        {/* Title */}
        <span className="text-sm text-white truncate">{issue.title}</span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {/* Priority */}
        <span className="flex items-center gap-1.5">
          <span
            className={`w-2.5 h-2.5 rounded-full ${PRIORITY_COLORS[issue.priority] ?? "bg-neutral-500"}`}
            title={issue.priority}
          />
          <span className="text-[10px] font-semibold text-white/40 hidden lg:inline">
            {issue.priority}
          </span>
        </span>

        {/* Story Points */}
        {issue.story_points != null && (
          <span className="text-[10px] font-bold text-white/50 bg-neutral-800 px-2 py-0.5 rounded-full">
            {issue.story_points} SP
          </span>
        )}

        {/* Status */}
        <span className="text-[10px] font-semibold px-2 py-1 bg-neutral-900/60 rounded text-white/50 w-20 text-center">
          {issue.status}
        </span>

        {/* Assign to sprint dropdown (always visible for backlog, on hover for sprint issues) */}
        <div
          className={
            showAssign
              ? ""
              : "opacity-0 group-hover:opacity-100 transition-opacity"
          }
        >
          <SprintAssignDropdown
            sprints={sprints}
            currentSprintId={issue.sprint_id}
            onAssign={onAssignSprint}
          />
        </div>
      </div>
    </div>
  );
}
