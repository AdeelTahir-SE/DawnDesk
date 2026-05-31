import { useEffect, useState } from "react";
import { Loader2, Trash2, X } from "lucide-react";
import type { LocalIssue } from "./types";
import { createProjectIssue, deleteProjectIssue, updateProjectIssue } from "../../lib/workspaceSync";

const ISSUE_TYPES = ["Epic", "Story", "Task", "Bug", "Subtask"];
const STATUSES = ["To Do", "In Progress", "In Review", "Done"];
const PRIORITIES = ["Lowest", "Low", "Medium", "High", "Highest"];

export default function IssueDetailModal({
  issue,
  projectId,
  onClose,
  onSaved,
}: {
  issue: LocalIssue | null;
  projectId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [issueType, setIssueType] = useState("Task");
  const [status, setStatus] = useState("To Do");
  const [priority, setPriority] = useState("Medium");
  const [storyPoints, setStoryPoints] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setTitle(issue?.title ?? "");
    setDescription(issue?.description ?? "");
    setIssueType(issue?.issue_type ?? "Task");
    setStatus(issue?.status ?? "To Do");
    setPriority(issue?.priority ?? "Medium");
    setStoryPoints(issue?.story_points == null ? "" : String(issue.story_points));
    setDueDate(issue?.due_date ?? "");
  }, [issue]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        issue_type: issueType,
        status,
        priority,
        story_points: storyPoints.trim() ? Number(storyPoints) : null,
        due_date: dueDate || null,
      };

      if (issue) {
        await updateProjectIssue({ id: issue.id, ...payload });
      } else {
        await createProjectIssue(projectId, payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!issue || !window.confirm("Delete this issue?")) return;
    setDeleting(true);
    setError("");
    try {
      await deleteProjectIssue(issue.id);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setDeleting(false);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-white">{issue ? issue.key : "Create Issue"}</h2>
            <p className="text-xs text-neutral-400">Saved to your shared workspace</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="custom-scrollbar max-h-[72vh] space-y-4 overflow-y-auto p-6">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Title</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/60"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Select label="Type" value={issueType} options={ISSUE_TYPES} onChange={setIssueType} />
            <Select label="Status" value={status} options={STATUSES} onChange={setStatus} />
            <Select label="Priority" value={priority} options={PRIORITIES} onChange={setPriority} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Story Points</label>
              <input
                type="number"
                min="0"
                value={storyPoints}
                onChange={(event) => setStoryPoints(event.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/60"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/60"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Description</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="custom-scrollbar h-40 w-full resize-none rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/60"
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-neutral-800 px-6 py-4">
          <button
            onClick={handleDelete}
            disabled={!issue || deleting}
            className="inline-flex items-center gap-2 rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-300 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-bold text-neutral-300 hover:bg-neutral-800">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/60"
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}
