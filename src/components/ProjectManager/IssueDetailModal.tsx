import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { LocalIssue, LocalComment, LocalCustomField, LocalCustomFieldValue, LocalAttachment, LocalIssueLink, LocalIssueHistory, LocalWorklog } from "./types";
import {
  X, Save, Clock, AlignLeft, Tag, Trash2, Plus,
  CheckSquare, MessageSquare, ChevronDown, ChevronUp,
  Bug, BookOpen, Zap, Layers, ListChecks, Calendar,
  ArrowUp, ArrowDown, Minus, ChevronsUp, ChevronsDown,
  Paperclip, Link2, History
} from "lucide-react";

// ---------- local types ----------

interface Label {
  id: number;
  project_id: number;
  name: string;
  color: string;
}

interface IssueDetailModalProps {
  issue: LocalIssue | null;
  projectId: number;
  onClose: () => void;
  onSaved: () => void;
}

// ---------- constants ----------

const STATUSES = ["To Do", "In Progress", "In Review", "Done"] as const;
const ISSUE_TYPES = ["Task", "Story", "Bug", "Epic", "Subtask"] as const;
const PRIORITIES = ["Highest", "High", "Medium", "Low", "Lowest"] as const;

const PRIORITY_COLOR: Record<string, string> = {
  Highest: "text-red-400",
  High: "text-orange-400",
  Medium: "text-yellow-400",
  Low: "text-blue-400",
  Lowest: "text-slate-400",
};

const PRIORITY_BG: Record<string, string> = {
  Highest: "bg-red-400/10",
  High: "bg-orange-400/10",
  Medium: "bg-yellow-400/10",
  Low: "bg-blue-400/10",
  Lowest: "bg-slate-400/10",
};

const STATUS_COLOR: Record<string, string> = {
  "To Do": "bg-neutral-600",
  "In Progress": "bg-blue-500",
  "In Review": "bg-purple-500",
  Done: "bg-green-500",
};

// ---------- helpers ----------

function issueTypeIcon(type: string, className = "w-4 h-4") {
  switch (type) {
    case "Bug": return <Bug className={`${className} text-red-400`} />;
    case "Story": return <BookOpen className={`${className} text-green-400`} />;
    case "Epic": return <Zap className={`${className} text-purple-400`} />;
    case "Subtask": return <ListChecks className={`${className} text-cyan-400`} />;
    default: return <Layers className={`${className} text-blue-400`} />;
  }
}

function priorityIcon(priority: string, className = "w-3.5 h-3.5") {
  const color = PRIORITY_COLOR[priority] || "text-white/40";
  switch (priority) {
    case "Highest": return <ChevronsUp className={`${className} ${color}`} />;
    case "High": return <ArrowUp className={`${className} ${color}`} />;
    case "Medium": return <Minus className={`${className} ${color}`} />;
    case "Low": return <ArrowDown className={`${className} ${color}`} />;
    case "Lowest": return <ChevronsDown className={`${className} ${color}`} />;
    default: return <Minus className={`${className} ${color}`} />;
  }
}

function relativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function formatMinutes(m: number): string {
  if (m === 0) return "0m";
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h === 0) return `${min}m`;
  if (min === 0) return `${h}h`;
  return `${h}h ${min}m`;
}

// ---------- component ----------

export default function IssueDetailModal({
  issue,
  projectId,
  onClose,
  onSaved,
}: IssueDetailModalProps) {
  const isNew = !issue;

  // ---- form state ----
  const [title, setTitle] = useState(issue?.title || "");
  const [description, setDescription] = useState(issue?.description || "");
  const [status, setStatus] = useState(issue?.status || "To Do");
  const [priority, setPriority] = useState(issue?.priority || "Medium");
  const [issueType, setIssueType] = useState(issue?.issue_type || "Task");
  const [storyPoints, setStoryPoints] = useState<number | null>(issue?.story_points ?? null);
  const [dueDate, setDueDate] = useState(issue?.due_date || "");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ---- original estimate ----
  const [originalEstimate, setOriginalEstimate] = useState<number | null>(issue?.original_estimate_minutes ?? null);

  // ---- custom fields ----
  const [customFields, setCustomFields] = useState<LocalCustomField[]>([]);
  const [issueCustomFields, setIssueCustomFields] = useState<LocalCustomFieldValue[]>([]);

  // ---- attachments ----
  const [attachments, setAttachments] = useState<LocalAttachment[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  // ---- links ----
  const [links, setLinks] = useState<LocalIssueLink[]>([]);
  const [linkIssueId, setLinkIssueId] = useState("");
  const [linkType, setLinkType] = useState("Blocks");
  const [linking, setLinking] = useState(false);

  // ---- history ----
  const [history, setHistory] = useState<LocalIssueHistory[]>([]);
  const [activeTab, setActiveTab] = useState<"comments" | "history">("comments");

  // ---- subtasks ----
  const [allIssues, setAllIssues] = useState<LocalIssue[]>([]);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [creatingSubtask, setCreatingSubtask] = useState(false);
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);

  // ---- comments ----
  const [comments, setComments] = useState<LocalComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  // ---- worklogs ----
  const [worklogs, setWorklogs] = useState<LocalWorklog[]>([]);
  const [showLogWork, setShowLogWork] = useState(false);
  const [logHours, setLogHours] = useState(0);
  const [logMinutes, setLogMinutes] = useState(0);
  const [logDesc, setLogDesc] = useState("");
  const [loggingWork, setLoggingWork] = useState(false);

  // ---- labels ----
  const [projectLabels, setProjectLabels] = useState<Label[]>([]);
  const [issueLabels, setIssueLabels] = useState<Label[]>([]);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [togglingLabel, setTogglingLabel] = useState<number | null>(null);

  const titleRef = useRef<HTMLInputElement>(null);

  // ---- data fetching ----

  const fetchRelatedData = useCallback(async () => {
    if (isNew) return;
    try {
      const [issuesRes, commentsRes, worklogsRes, projLabels, issLabels, cFields, iCFields, atts, issueLinks, hist] = await Promise.all([
        invoke<LocalIssue[]>("get_issues", { projectId }),
        invoke<LocalComment[]>("get_comments", { issueId: issue.id }),
        invoke<LocalWorklog[]>("get_worklogs", { issueId: issue.id }),
        invoke<Label[]>("get_labels", { projectId }),
        invoke<Label[]>("get_issue_labels", { issueId: issue.id }),
        invoke<LocalCustomField[]>("get_custom_fields", { projectId }),
        invoke<LocalCustomFieldValue[]>("get_issue_custom_fields", { issueId: issue.id }),
        invoke<LocalAttachment[]>("get_attachments", { issueId: issue.id }),
        invoke<LocalIssueLink[]>("get_issue_links", { issueId: issue.id }),
        invoke<LocalIssueHistory[]>("get_issue_history", { issueId: issue.id }),
      ]);
      setAllIssues(issuesRes);
      setComments(commentsRes);
      setWorklogs(worklogsRes);
      setProjectLabels(projLabels);
      setIssueLabels(issLabels);
      setCustomFields(cFields);
      setIssueCustomFields(iCFields);
      setAttachments(atts);
      setLinks(issueLinks);
      setHistory(hist);
    } catch (err) {
      console.error("Failed to fetch related data:", err);
    }
  }, [isNew, issue, projectId]);

  useEffect(() => {
    fetchRelatedData();
  }, [fetchRelatedData]);

  useEffect(() => {
    if (isNew) {
      invoke<Label[]>("get_labels", { projectId })
        .then(setProjectLabels)
        .catch(() => {});
      invoke<LocalCustomField[]>("get_custom_fields", { projectId })
        .then(setCustomFields)
        .catch(() => {});
    }
  }, [isNew, projectId]);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  // ---- derived ----

  const subtasks = allIssues.filter((i) => i.parent_id === issue?.id);
  const totalLoggedMinutes = worklogs.reduce((sum, w) => sum + w.minutes, 0);
  const issueLabelIds = new Set(issueLabels.map((l) => l.id));

  // ---- handlers ----

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (isNew) {
        await invoke("create_issue", {
          input: {
            project_id: projectId,
            sprint_id: null,
            parent_id: null,
            issue_type: issueType,
            title: title.trim(),
            description: description.trim() || null,
            status,
            priority,
            story_points: storyPoints,
            original_estimate_minutes: originalEstimate,
            due_date: dueDate || null,
            created_at: new Date().toISOString(),
          },
        });
      } else {
        await invoke("update_issue", {
          input: {
            id: issue.id,
            sprint_id: issue.sprint_id,
            issue_type: issueType,
            title: title.trim(),
            description: description.trim() || null,
            status,
            priority,
            story_points: storyPoints,
            time_spent_minutes: issue.time_spent_minutes,
            original_estimate_minutes: originalEstimate,
            rank: issue.rank,
            pinned: issue.pinned,
            due_date: dueDate || null,
            updated_at: new Date().toISOString(),
          },
        });
      }
      onSaved();
    } catch (err) {
      console.error("Failed to save issue:", err);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!issue) return;
    setDeleting(true);
    try {
      await invoke("delete_issue", { id: issue.id });
      onSaved();
    } catch (err) {
      console.error("Failed to delete issue:", err);
    }
    setDeleting(false);
  };

  const handleCreateSubtask = async () => {
    if (!subtaskTitle.trim() || !issue) return;
    setCreatingSubtask(true);
    try {
      await invoke("create_issue", {
        input: {
          project_id: projectId,
          sprint_id: issue.sprint_id,
          parent_id: issue.id,
          issue_type: "Subtask",
          title: subtaskTitle.trim(),
          description: null,
          status: "To Do",
          priority: "Medium",
          story_points: null,
          original_estimate_minutes: null,
          due_date: null,
          created_at: new Date().toISOString(),
        },
      });
      setSubtaskTitle("");
      setShowSubtaskForm(false);
      const updated = await invoke<LocalIssue[]>("get_issues", { projectId });
      setAllIssues(updated);
    } catch (err) {
      console.error("Failed to create subtask:", err);
    }
    setCreatingSubtask(false);
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !issue) return;
    setPostingComment(true);
    try {
      await invoke("create_comment", {
        issueId: issue.id,
        content: commentText.trim(),
        createdAt: new Date().toISOString(),
      });
      setCommentText("");
      const updated = await invoke<LocalComment[]>("get_comments", { issueId: issue.id });
      setComments(updated);
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
    setPostingComment(false);
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await invoke("delete_comment", { id: commentId });
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  };

  const handleLogWork = async () => {
    const totalMins = logHours * 60 + logMinutes;
    if (totalMins <= 0 || !issue) return;
    setLoggingWork(true);
    try {
      await invoke("create_worklog", {
        issueId: issue.id,
        minutes: totalMins,
        description: logDesc.trim() || null,
        createdAt: new Date().toISOString(),
      });
      setLogHours(0);
      setLogMinutes(0);
      setLogDesc("");
      setShowLogWork(false);
      const updated = await invoke<LocalWorklog[]>("get_worklogs", { issueId: issue.id });
      setWorklogs(updated);
    } catch (err) {
      console.error("Failed to log work:", err);
    }
    setLoggingWork(false);
  };

  const handleToggleLabel = async (labelId: number) => {
    if (!issue) return;
    setTogglingLabel(labelId);
    try {
      await invoke("toggle_issue_label", { issueId: issue.id, labelId });
      const updated = await invoke<Label[]>("get_issue_labels", { issueId: issue.id });
      setIssueLabels(updated);
    } catch (err) {
      console.error("Failed to toggle label:", err);
    }
    setTogglingLabel(null);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !issue) return;
    setUploadingAttachment(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const dataUrl = ev.target?.result as string;
        await invoke("upload_attachment", {
          issueId: issue.id,
          fileName: file.name,
          base64Data: dataUrl,
          createdAt: new Date().toISOString(),
        });
        const updated = await invoke<LocalAttachment[]>("get_attachments", { issueId: issue.id });
        setAttachments(updated);
        setUploadingAttachment(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Failed to upload attachment", err);
      setUploadingAttachment(false);
    }
  };

  const handleCreateLink = async () => {
    if (!linkIssueId || !issue) return;
    setLinking(true);
    try {
      await invoke("create_issue_link", {
        linkType,
        sourceIssueId: issue.id,
        targetIssueId: parseInt(linkIssueId),
      });
      const updated = await invoke<LocalIssueLink[]>("get_issue_links", { issueId: issue.id });
      setLinks(updated);
      setLinkIssueId("");
    } catch (err) {
      console.error(err);
    }
    setLinking(false);
  };

  const handleCustomFieldChange = async (fieldId: number, value: string) => {
    if (!issue) return;
    setIssueCustomFields((prev) => {
      const existing = prev.find((f) => f.field_id === fieldId);
      if (existing) return prev.map((f) => (f.field_id === fieldId ? { ...f, value } : f));
      return [...prev, { issue_id: issue.id, field_id: fieldId, value }];
    });
    try {
      await invoke("set_custom_field_value", { issueId: issue.id, fieldId, value });
    } catch (err) {
      console.error(err);
    }
  };

  // ---- render ----

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/80 backdrop-blur-md p-4 sm:p-8 animate-fadeIn"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex w-full max-w-6xl h-full max-h-[92vh] bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-scaleUp">

        {/* =================== LEFT PANEL =================== */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header bar */}
          <div className="px-6 sm:px-8 py-4 flex items-center gap-3 border-b border-neutral-800 shrink-0">
            {issueTypeIcon(issueType, "w-5 h-5")}
            <span className="text-xs font-bold text-yellow-400 bg-yellow-400/10 px-2.5 py-1 rounded-md tracking-wide">
              {isNew ? "NEW ISSUE" : issue.key}
            </span>
            {!isNew && (
              <span className="text-[10px] text-white/30 ml-auto">
                Created {relativeTime(issue.created_at)}
              </span>
            )}
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <form id="issue-form" onSubmit={handleSave} className="p-6 sm:p-8 flex flex-col gap-6">
              {/* Title */}
              <input
                ref={titleRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Issue summary"
                className="text-2xl font-bold bg-transparent text-white outline-none placeholder-white/30 w-full"
                required
              />

              {/* Description */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/50 flex items-center gap-2">
                  <AlignLeft className="w-4 h-4" /> Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description using Markdown..."
                  className="rounded-xl border border-neutral-800 bg-neutral-900/40 px-4 py-3 text-sm text-white placeholder-white/35 outline-none focus:border-yellow-400/60 transition-colors resize-none h-48 custom-scrollbar font-mono leading-relaxed"
                />
              </div>
            </form>

            {/* ---- Subtasks ---- */}
            {!isNew && (
              <div className="px-6 sm:px-8 pb-6">
                <div className="border border-neutral-800 rounded-xl bg-neutral-900/40 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 flex items-center gap-2">
                      <CheckSquare className="w-4 h-4" /> Subtasks
                      {subtasks.length > 0 && (
                        <span className="ml-1 bg-neutral-800 text-white/60 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {subtasks.filter((s) => s.status === "Done").length}/{subtasks.length}
                        </span>
                      )}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowSubtaskForm((v) => !v)}
                      className="p-1 rounded-md text-white/40 hover:text-yellow-400 hover:bg-yellow-400/10 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* progress bar */}
                  {subtasks.length > 0 && (
                    <div className="px-4 pt-3">
                      <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all duration-500"
                          style={{ width: `${(subtasks.filter((s) => s.status === "Done").length / subtasks.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* subtask list */}
                  <div className="divide-y divide-neutral-800/50">
                    {subtasks.map((sub) => (
                      <div key={sub.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-800/30 transition-colors group">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${STATUS_COLOR[sub.status] || "bg-neutral-600"}`} />
                        <span className={`text-sm flex-1 ${sub.status === "Done" ? "text-white/40 line-through" : "text-white/80"}`}>
                          {sub.title}
                        </span>
                        <span className="text-[10px] font-bold text-white/30">{sub.key}</span>
                        {priorityIcon(sub.priority, "w-3 h-3")}
                      </div>
                    ))}
                  </div>

                  {subtasks.length === 0 && !showSubtaskForm && (
                    <p className="text-xs text-white/30 px-4 py-4 text-center">No subtasks yet</p>
                  )}

                  {/* create subtask form */}
                  {showSubtaskForm && (
                    <div className="flex items-center gap-2 px-4 py-3 border-t border-neutral-800">
                      <input
                        type="text"
                        value={subtaskTitle}
                        onChange={(e) => setSubtaskTitle(e.target.value)}
                        placeholder="Subtask title..."
                        className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-yellow-400/60 transition-colors"
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreateSubtask(); } }}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleCreateSubtask}
                        disabled={creatingSubtask || !subtaskTitle.trim()}
                        className="px-3 py-2 rounded-lg bg-yellow-400 text-black text-xs font-bold hover:bg-yellow-300 transition-colors disabled:opacity-40"
                      >
                        {creatingSubtask ? "..." : "Add"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ---- Attachments ---- */}
            {!isNew && (
              <div className="px-6 sm:px-8 pb-6">
                <div className="border border-neutral-800 rounded-xl bg-neutral-900/40 overflow-hidden p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 flex items-center gap-2 mb-3">
                    <Paperclip className="w-4 h-4" /> Attachments
                  </h3>
                  <div className="flex flex-col gap-3">
                    <input type="file" onChange={handleUpload} disabled={uploadingAttachment} className="text-xs text-white/70" />
                    {uploadingAttachment && <p className="text-xs text-yellow-400">Uploading...</p>}
                    <div className="flex flex-wrap gap-2">
                      {attachments.map(att => (
                        <div key={att.id} className="bg-neutral-800 text-xs px-3 py-1.5 rounded-lg flex items-center gap-2">
                          <span className="text-white truncate max-w-[200px]">{att.file_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ---- Linked Issues ---- */}
            {!isNew && (
              <div className="px-6 sm:px-8 pb-6">
                <div className="border border-neutral-800 rounded-xl bg-neutral-900/40 overflow-hidden p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 flex items-center gap-2 mb-3">
                    <Link2 className="w-4 h-4" /> Linked Issues
                  </h3>
                  <div className="flex flex-col gap-3">
                    {links.map(link => {
                      const isSource = link.source_issue_id === issue.id;
                      const targetId = isSource ? link.target_issue_id : link.source_issue_id;
                      const targetIssue = allIssues.find(i => i.id === targetId);
                      return (
                        <div key={link.id} className="flex items-center gap-2 text-xs">
                          <span className="text-white/50">{link.link_type}</span>
                          <span className="text-white">{targetIssue?.key || `Issue #${targetId}`}</span>
                          <span className="text-white/30">{targetIssue?.title}</span>
                        </div>
                      );
                    })}
                    <div className="flex items-center gap-2 mt-2">
                      <select
                        value={linkType}
                        onChange={(e) => setLinkType(e.target.value)}
                        className="bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1.5 text-xs text-white outline-none"
                      >
                        <option value="Blocks">Blocks</option>
                        <option value="Relates To">Relates To</option>
                      </select>
                      <select
                        value={linkIssueId}
                        onChange={(e) => setLinkIssueId(e.target.value)}
                        className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1.5 text-xs text-white outline-none"
                      >
                        <option value="">Select issue...</option>
                        {allIssues.filter(i => i.id !== issue.id).map(i => (
                          <option key={i.id} value={i.id}>{i.key} - {i.title}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleCreateLink}
                        disabled={linking || !linkIssueId}
                        className="px-3 py-1.5 rounded-lg bg-neutral-800 text-white text-xs font-bold hover:bg-neutral-700 transition-colors disabled:opacity-40"
                      >
                        Link
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ---- Activity (Comments / History) ---- */}
            {!isNew && (
              <div className="px-6 sm:px-8 pb-8">
                <div className="flex flex-col gap-4">
                  <div className="flex gap-4 border-b border-neutral-800 mb-2">
                    <button
                      type="button"
                      className={`pb-2 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${activeTab === 'comments' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-white/50 hover:text-white/80'}`}
                      onClick={() => setActiveTab('comments')}
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Comments
                    </button>
                    <button
                      type="button"
                      className={`pb-2 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${activeTab === 'history' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-white/50 hover:text-white/80'}`}
                      onClick={() => setActiveTab('history')}
                    >
                      <History className="w-3.5 h-3.5" /> History
                    </button>
                  </div>

                  {activeTab === 'comments' && (
                    <>
                      {/* comment list */}
                      <div className="flex flex-col gap-3">
                        {comments.length === 0 && (
                          <p className="text-xs text-white/30 py-2">No comments yet. Start the conversation.</p>
                        )}
                        {comments.map((c) => (
                          <div key={c.id} className="group bg-neutral-900/40 border border-neutral-800 rounded-xl px-4 py-3 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-white/40 font-medium">{relativeTime(c.created_at)}</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(c.id)}
                                className="p-1 rounded text-white/0 group-hover:text-white/30 hover:!text-red-400 hover:bg-red-400/10 transition-all"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">{c.content}</p>
                          </div>
                        ))}
                      </div>

                      {/* add comment */}
                      <div className="flex gap-2">
                        <textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Write a comment..."
                          rows={2}
                          className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900/40 px-4 py-2.5 text-sm text-white placeholder-white/35 outline-none focus:border-yellow-400/60 transition-colors resize-none custom-scrollbar"
                          onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleAddComment(); } }}
                        />
                        <button
                          type="button"
                          onClick={handleAddComment}
                          disabled={postingComment || !commentText.trim()}
                          className="self-end px-4 py-2.5 rounded-xl bg-neutral-800 text-white text-xs font-bold hover:bg-neutral-700 transition-colors disabled:opacity-40"
                        >
                          {postingComment ? "..." : "Post"}
                        </button>
                      </div>
                      <p className="text-[10px] text-white/25 -mt-2">Ctrl + Enter to post</p>
                    </>
                  )}

                  {activeTab === 'history' && (
                    <div className="flex flex-col gap-3">
                      {history.length === 0 && <p className="text-xs text-white/30 py-2">No history available.</p>}
                      {history.map(h => (
                        <div key={h.id} className="flex items-start gap-3 py-2 border-b border-neutral-800/50 last:border-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400/50 mt-1.5 shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs text-white/70">
                              Changed <span className="font-semibold text-white">{h.field_name}</span>
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-white/50">
                              <span className="line-through truncate max-w-[200px]">{h.old_value || 'None'}</span>
                              <span>→</span>
                              <span className="text-green-400 truncate max-w-[200px]">{h.new_value || 'None'}</span>
                            </div>
                            <p className="text-[10px] text-white/30 mt-1">{relativeTime(h.created_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =================== RIGHT SIDEBAR =================== */}
        <aside className="w-[320px] shrink-0 flex flex-col bg-neutral-900/40 border-l border-neutral-800 overflow-hidden">
          {/* close button */}
          <div className="flex justify-end px-4 pt-4 shrink-0">
            <button onClick={onClose} className="p-2 rounded-lg text-white/50 hover:bg-neutral-800 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* scrollable sidebar */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-5 pb-5">
            <div className="flex flex-col gap-5">

              {/* Status */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Status</label>
                <div className="relative">
                  <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${STATUS_COLOR[status] || "bg-neutral-600"}`} />
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 pl-7 pr-3 py-2.5 text-sm text-white outline-none focus:border-yellow-400/60 transition-colors appearance-none cursor-pointer"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-white/30 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Issue Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Type</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    {issueTypeIcon(issueType, "w-3.5 h-3.5")}
                  </div>
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 pl-8 pr-3 py-2.5 text-sm text-white outline-none focus:border-yellow-400/60 transition-colors appearance-none cursor-pointer"
                  >
                    {ISSUE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-white/30 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Priority */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Priority</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    {priorityIcon(priority, "w-3.5 h-3.5")}
                  </div>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 pl-8 pr-3 py-2.5 text-sm text-white outline-none focus:border-yellow-400/60 transition-colors appearance-none cursor-pointer"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-white/30 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {/* priority badge preview */}
                <div className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-md w-fit ${PRIORITY_COLOR[priority]} ${PRIORITY_BG[priority]}`}>
                  {priorityIcon(priority, "w-3 h-3")}
                  {priority}
                </div>
              </div>

              <div className="border-t border-neutral-800" />

              {/* Story Points */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Story Points</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={storyPoints ?? ""}
                  onChange={(e) => setStoryPoints(e.target.value === "" ? null : parseInt(e.target.value, 10))}
                  placeholder="–"
                  className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none focus:border-yellow-400/60 transition-colors w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              {/* Due Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-white/40 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none focus:border-yellow-400/60 transition-colors w-full [color-scheme:dark]"
                />
              </div>

              <div className="border-t border-neutral-800" />

              {/* Time Tracking */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-white/40 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> Time Tracking
                </label>
                
                <div className="flex flex-col gap-1.5 mb-2">
                  <label className="text-[9px] font-semibold uppercase tracking-widest text-white/30">
                    Original Estimate (mins)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={originalEstimate ?? ""}
                    onChange={(e) => setOriginalEstimate(e.target.value === "" ? null : parseInt(e.target.value, 10))}
                    placeholder="e.g. 120"
                    className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none focus:border-yellow-400/60 transition-colors w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-white/40 mb-0.5">Total Logged</p>
                      <p className="text-lg font-bold text-white">{formatMinutes(totalLoggedMinutes)}</p>
                    </div>
                    {!isNew && (
                      <button
                        type="button"
                        onClick={() => setShowLogWork((v) => !v)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20 transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Log Work
                      </button>
                    )}
                  </div>

                  {/* recent worklogs */}
                  {worklogs.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-neutral-800 flex flex-col gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                      {worklogs.slice(-5).reverse().map((w) => (
                        <div key={w.id} className="flex items-center justify-between text-[10px]">
                          <span className="text-white/50 truncate flex-1">{w.description || "Work logged"}</span>
                          <span className="text-white/70 font-semibold ml-2 shrink-0">{formatMinutes(w.minutes)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* log work form */}
                {showLogWork && (
                  <div className="p-3 bg-neutral-950 rounded-lg border border-yellow-400/30 flex flex-col gap-2.5 animate-fadeIn">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[9px] text-white/30 font-semibold uppercase mb-1 block">Hours</label>
                        <input
                          type="number"
                          min={0}
                          value={logHours}
                          onChange={(e) => setLogHours(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-sm text-white outline-none focus:border-yellow-400/60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[9px] text-white/30 font-semibold uppercase mb-1 block">Minutes</label>
                        <input
                          type="number"
                          min={0}
                          max={59}
                          value={logMinutes}
                          onChange={(e) => setLogMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                          className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-sm text-white outline-none focus:border-yellow-400/60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>
                    <input
                      type="text"
                      value={logDesc}
                      onChange={(e) => setLogDesc(e.target.value)}
                      placeholder="What did you work on?"
                      className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-sm text-white placeholder-white/25 outline-none focus:border-yellow-400/60"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleLogWork}
                        disabled={loggingWork || (logHours === 0 && logMinutes === 0)}
                        className="flex-1 px-3 py-1.5 rounded-md bg-yellow-400 text-black text-xs font-bold hover:bg-yellow-300 transition-colors disabled:opacity-40"
                      >
                        {loggingWork ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowLogWork(false)}
                        className="px-3 py-1.5 rounded-md bg-neutral-800 text-white/60 text-xs font-semibold hover:bg-neutral-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-neutral-800" />

              {/* Custom Fields */}
              {customFields.length > 0 && !isNew && (
                <>
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[10px] font-semibold uppercase tracking-widest text-white/40 flex items-center gap-1.5">
                      <ListChecks className="w-3 h-3" /> Custom Fields
                    </h4>
                    {customFields.map(cf => {
                      const val = issueCustomFields.find(f => f.field_id === cf.id)?.value || "";
                      return (
                        <div key={cf.id} className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-semibold uppercase tracking-widest text-white/40">{cf.name}</label>
                          <input
                            type="text"
                            value={val}
                            onChange={(e) => handleCustomFieldChange(cf.id, e.target.value)}
                            className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none focus:border-yellow-400/60 transition-colors w-full"
                          />
                        </div>
                      )
                    })}
                  </div>
                  <div className="border-t border-neutral-800" />
                </>
              )}

              {/* Labels */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-white/40 flex items-center gap-1.5">
                  <Tag className="w-3 h-3" /> Labels
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {issueLabels.map((label) => (
                    <span
                      key={label.id}
                      className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: `${label.color}20`, color: label.color }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: label.color }} />
                      {label.name}
                    </span>
                  ))}
                  {!isNew && (
                    <button
                      type="button"
                      onClick={() => setShowLabelPicker((v) => !v)}
                      className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-white/40 border border-dashed border-white/20 rounded-full px-2.5 py-1 cursor-pointer hover:border-yellow-400/40 hover:text-yellow-400 transition-colors"
                    >
                      {showLabelPicker ? <ChevronUp className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                      {showLabelPicker ? "Close" : "Add"}
                    </button>
                  )}
                </div>

                {/* label picker */}
                {showLabelPicker && (
                  <div className="bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden animate-fadeIn">
                    {projectLabels.length === 0 ? (
                      <p className="text-[10px] text-white/30 px-3 py-3 text-center">No labels in this project</p>
                    ) : (
                      <div className="max-h-40 overflow-y-auto custom-scrollbar divide-y divide-neutral-800/50">
                        {projectLabels.map((label) => {
                          const active = issueLabelIds.has(label.id);
                          const toggling = togglingLabel === label.id;
                          return (
                            <button
                              key={label.id}
                              type="button"
                              onClick={() => handleToggleLabel(label.id)}
                              disabled={toggling}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-neutral-900/60 transition-colors ${toggling ? "opacity-40" : ""}`}
                            >
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${active ? "border-yellow-400 bg-yellow-400" : "border-neutral-700"}`}>
                                {active && (
                                  <svg className="w-2.5 h-2.5 text-black" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M2 6l3 3 5-5" />
                                  </svg>
                                )}
                              </div>
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: label.color }} />
                              <span className="text-xs text-white/70">{label.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-neutral-800" />

              {/* Action buttons */}
              <div className="flex flex-col gap-2.5 pt-1">
                <button
                  type="submit"
                  form="issue-form"
                  disabled={saving}
                  className="w-full flex justify-center items-center gap-2 px-5 py-3 rounded-xl bg-yellow-400 text-black text-sm font-bold hover:bg-yellow-300 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <span className="animate-pulse">Saving...</span>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {isNew ? "Create Issue" : "Save Changes"}
                    </>
                  )}
                </button>

                {!isNew && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="w-full flex justify-center items-center gap-2 px-5 py-2.5 rounded-xl border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  >
                    {deleting ? (
                      <span className="animate-pulse">Deleting...</span>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Issue
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
