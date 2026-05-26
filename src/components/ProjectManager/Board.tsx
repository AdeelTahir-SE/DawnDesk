import { useState, useEffect, useRef, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { LocalIssue, LocalSprint } from "./types";
import {
  Loader2,
  Plus,
  Search,
  Calendar,
  ChevronDown,
  Bug,
  BookOpen,
  CheckSquare,
  Layers,
  GitBranch,
  AlertCircle,
} from "lucide-react";
import IssueDetailModal from "./IssueDetailModal";

const COLUMNS = ["To Do", "In Progress", "In Review", "Done"] as const;

const PRIORITY_COLORS: Record<string, string> = {
  Highest: "bg-red-400",
  High: "bg-orange-400",
  Medium: "bg-yellow-400",
  Low: "bg-blue-400",
  Lowest: "bg-slate-400",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  Bug: <Bug className="w-3.5 h-3.5 text-red-400" />,
  Story: <BookOpen className="w-3.5 h-3.5 text-green-400" />,
  Task: <CheckSquare className="w-3.5 h-3.5 text-blue-400" />,
  Epic: <Layers className="w-3.5 h-3.5 text-purple-400" />,
  Subtask: <GitBranch className="w-3.5 h-3.5 text-cyan-400" />,
};

function isOverdue(dateStr: string): boolean {
  return new Date(dateStr) < new Date();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function StatusDropdown({
  currentStatus,
  onChangeStatus,
}: {
  currentStatus: string;
  onChangeStatus: (status: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="flex items-center gap-1 text-[10px] font-semibold text-white/40 hover:text-white/70 bg-neutral-900 hover:bg-neutral-800 px-2 py-1 rounded transition-colors"
        title="Change status"
      >
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 w-36 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl overflow-hidden animate-fadeIn">
          {COLUMNS.filter((s) => s !== currentStatus).map((status) => (
            <button
              key={status}
              onClick={(e) => {
                e.stopPropagation();
                onChangeStatus(status);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs text-white/70 hover:bg-yellow-400/10 hover:text-yellow-400 transition-colors"
            >
              {status}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Board({ projectId }: { projectId: number | null }) {
  const [issues, setIssues] = useState<LocalIssue[]>([]);
  const [sprints, setSprints] = useState<LocalSprint[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedIssue, setSelectedIssue] = useState<LocalIssue | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createColumnStatus, setCreateColumnStatus] = useState<string | null>(null);

  const activeSprint = useMemo(
    () => sprints.find((s) => s.status === "active") ?? null,
    [sprints]
  );

  const sprintIssues = useMemo(() => {
    if (!activeSprint) return [];
    return issues.filter((i) => i.sprint_id === activeSprint.id);
  }, [issues, activeSprint]);

  const filteredIssues = useMemo(() => {
    if (!searchQuery.trim()) return sprintIssues;
    const q = searchQuery.toLowerCase();
    return sprintIssues.filter(
      (i) =>
        i.title.toLowerCase().includes(q) || i.key.toLowerCase().includes(q)
    );
  }, [sprintIssues, searchQuery]);

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

  const handleQuickStatusChange = async (
    issue: LocalIssue,
    newStatus: string
  ) => {
    try {
      await invoke("update_issue", {
        input: {
          id: issue.id,
          sprint_id: issue.sprint_id,
          issue_type: issue.issue_type,
          title: issue.title,
          description: issue.description,
          status: newStatus,
          priority: issue.priority,
          story_points: issue.story_points,
          time_spent_minutes: issue.time_spent_minutes,
          due_date: issue.due_date,
          updated_at: new Date().toISOString(),
        },
      });
      setIssues((prev) =>
        prev.map((i) =>
          i.id === issue.id ? { ...i, status: newStatus } : i
        )
      );
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const openCreateModal = (status?: string) => {
    setSelectedIssue(null);
    setCreateColumnStatus(status ?? null);
    setIsModalOpen(true);
  };

  const openIssueModal = (issue: LocalIssue) => {
    setSelectedIssue(issue);
    setIsModalOpen(true);
  };

  if (loading && issues.length === 0) {
    return (
      <div className="flex justify-center mt-20">
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      </div>
    );
  }

  if (!activeSprint) {
    return (
      <div className="flex flex-col items-center justify-center h-full animate-fadeIn">
        <AlertCircle className="w-16 h-16 text-white/20 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">No Active Sprint</h2>
        <p className="text-sm text-white/40 max-w-md text-center">
          There is no active sprint for this project. Go to the Backlog view to
          create and start a sprint.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fadeIn relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            {activeSprint.name}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded">
              Active
            </span>
            {(activeSprint.start_date || activeSprint.end_date) && (
              <span className="text-xs text-white/40 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {activeSprint.start_date
                  ? formatDate(activeSprint.start_date)
                  : "—"}{" "}
                →{" "}
                {activeSprint.end_date
                  ? formatDate(activeSprint.end_date)
                  : "—"}
              </span>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search by title or key…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-sm text-white placeholder-white/30 outline-none focus:border-yellow-400/60 transition-colors"
          />
        </div>
      </div>

      {/* Columns */}
      <div className="flex flex-1 gap-4 overflow-x-auto pb-4 custom-scrollbar">
        {COLUMNS.map((status) => {
          const columnIssues = filteredIssues.filter(
            (i) => i.status === status
          );
          return (
            <div
              key={status}
              className="flex flex-col w-80 shrink-0 bg-neutral-900/40 rounded-xl border border-neutral-800 p-3 h-full"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                  {status}
                </span>
                <span className="text-xs font-bold text-white/40 bg-neutral-900 px-2 py-0.5 rounded-full">
                  {columnIssues.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pe-1">
                {columnIssues.map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => openIssueModal(issue)}
                    className="group bg-neutral-950 p-4 rounded-lg border border-neutral-800 hover:border-yellow-400/40 hover:shadow-lg transition-all cursor-pointer"
                  >
                    {/* Card top row: title + quick status */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-white font-medium line-clamp-2 flex-1">
                        {issue.title}
                      </p>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <StatusDropdown
                          currentStatus={issue.status}
                          onChangeStatus={(s) =>
                            handleQuickStatusChange(issue, s)
                          }
                        />
                      </div>
                    </div>

                    {/* Card bottom metadata */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {/* Key */}
                        <span className="text-[10px] font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded">
                          {issue.key}
                        </span>
                        {/* Type */}
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-white/40">
                          {TYPE_ICONS[issue.issue_type] ?? null}
                          {issue.issue_type}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Story Points */}
                        {issue.story_points != null && (
                          <span className="text-[10px] font-bold text-white/50 bg-neutral-800 px-2 py-0.5 rounded-full">
                            {issue.story_points} SP
                          </span>
                        )}
                        {/* Priority Dot */}
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${PRIORITY_COLORS[issue.priority] ?? "bg-neutral-500"}`}
                          title={issue.priority}
                        />
                      </div>
                    </div>

                    {/* Due date */}
                    {issue.due_date && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-white/30" />
                        <span
                          className={`text-[10px] font-semibold ${
                            isOverdue(issue.due_date)
                              ? "text-red-400"
                              : "text-white/40"
                          }`}
                        >
                          {formatDate(issue.due_date)}
                          {isOverdue(issue.due_date) && " — Overdue"}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Create Issue per column */}
              <button
                onClick={() => openCreateModal(status)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-950/50 py-2.5 text-xs font-semibold text-white/50 hover:bg-neutral-900 hover:text-white transition-colors"
              >
                <Plus className="w-4 h-4" /> Create Issue
              </button>
            </div>
          );
        })}
      </div>

      {/* Issue Detail Modal */}
      {isModalOpen && projectId && (
        <IssueDetailModal
          issue={selectedIssue}
          projectId={projectId}
          onClose={() => {
            setIsModalOpen(false);
            setCreateColumnStatus(null);
          }}
          onSaved={() => {
            setIsModalOpen(false);
            setCreateColumnStatus(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
