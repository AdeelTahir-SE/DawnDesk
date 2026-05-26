import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Save, Trash2, ShieldAlert, Loader2, Plus, X, Tag } from "lucide-react";
import { LocalProject } from "./types";

interface Label {
  id: number;
  project_id: number;
  name: string;
  color: string;
}

interface ProjectSettingsProps {
  project: LocalProject | null;
  onProjectDeleted: () => void;
  onProjectUpdated: (proj: LocalProject) => void;
}

const LABEL_COLORS = [
  "#f87171", "#fb923c", "#facc15", "#4ade80", "#60a5fa", "#a78bfa",
  "#f472b6", "#94a3b8", "#2dd4bf", "#e879f9",
];

export default function ProjectSettings({ project, onProjectDeleted, onProjectUpdated }: ProjectSettingsProps) {
  if (!project) return null;

  const [name, setName] = useState(project.name);
  const [projKey, setProjKey] = useState(project.key);
  const [desc, setDesc] = useState(project.description || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Labels
  const [labels, setLabels] = useState<Label[]>([]);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);
  const [showLabelForm, setShowLabelForm] = useState(false);

  const fetchLabels = async () => {
    try {
      const result = await invoke<Label[]>("get_labels", { projectId: project.id });
      setLabels(result);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchLabels();
  }, [project.id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await invoke("update_project", {
        input: {
          id: project.id,
          name: name.trim(),
          key: projKey.trim().toUpperCase() || project.key,
          description: desc.trim() || null,
          color_tag: project.color_tag
        }
      });
      onProjectUpdated({
        ...project,
        name: name.trim(),
        key: projKey.trim().toUpperCase() || project.key,
        description: desc.trim() || null,
      });
    } catch (error) {
      console.error(error);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this project and ALL its issues? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await invoke("delete_project", { id: project.id });
      onProjectDeleted();
    } catch (error) {
      console.error(error);
      setDeleting(false);
    }
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;
    try {
      await invoke("create_label", { projectId: project.id, name: newLabelName.trim(), color: newLabelColor });
      setNewLabelName("");
      setShowLabelForm(false);
      fetchLabels();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteLabel = async (id: number) => {
    if (!window.confirm("Delete this label? It will be removed from all issues.")) return;
    try {
      await invoke("delete_label", { id });
      fetchLabels();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-3xl h-full overflow-y-auto custom-scrollbar animate-fadeIn pb-12">

      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-white tracking-tight">Project Settings</h2>
        <p className="text-sm text-white/60">Manage your workspace configuration, labels, and workflows.</p>
      </div>

      {/* General Settings */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 sm:p-8">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50 mb-6">General</h3>
        <form onSubmit={handleUpdate} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-[1.5fr_0.5fr] gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Project Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/60 transition-colors"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Key</label>
              <input
                type="text"
                value={projKey}
                onChange={e => setProjKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white uppercase tracking-wider outline-none focus:border-yellow-400/60 transition-colors"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Description</label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/60 transition-colors resize-none h-32 custom-scrollbar"
            />
          </div>

          <div className="flex justify-end mt-2 pt-6 border-t border-neutral-800">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-lg bg-yellow-400 text-black text-sm font-bold hover:bg-yellow-300 transition-colors flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Label Management */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50 flex items-center gap-2"><Tag className="w-4 h-4" /> Labels</h3>
            <p className="text-xs text-white/40 mt-1">Create and manage labels for categorizing issues.</p>
          </div>
          <button
            onClick={() => setShowLabelForm(!showLabelForm)}
            className="flex items-center gap-2 rounded-lg bg-neutral-950 border border-neutral-800 px-4 py-2 text-xs font-bold text-white/70 hover:text-white hover:border-yellow-400/40 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New Label
          </button>
        </div>

        {showLabelForm && (
          <div className="mb-6 p-4 rounded-xl border border-neutral-800 bg-neutral-950/60 flex flex-col gap-4 animate-fadeIn">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Label Name</label>
              <input
                type="text"
                value={newLabelName}
                onChange={e => setNewLabelName(e.target.value)}
                placeholder="e.g. Bug, Feature, Design"
                className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-white placeholder-white/35 outline-none focus:border-yellow-400/60"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Color</label>
              <div className="flex flex-wrap gap-2">
                {LABEL_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewLabelColor(c)}
                    className={`w-7 h-7 rounded-full transition-all ${newLabelColor === c ? "ring-2 ring-white ring-offset-2 ring-offset-neutral-900 scale-110" : "hover:scale-110"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowLabelForm(false)} className="px-4 py-2 rounded-lg border border-neutral-800 text-xs font-semibold text-white/60 hover:text-white">Cancel</button>
              <button type="button" onClick={handleCreateLabel} className="px-4 py-2 rounded-lg bg-yellow-400 text-black text-xs font-bold hover:bg-yellow-300">Create Label</button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {labels.length === 0 ? (
            <p className="text-sm text-white/40 text-center py-6">No labels created yet.</p>
          ) : labels.map(label => (
            <div key={label.id} className="flex items-center justify-between px-4 py-3 rounded-lg border border-neutral-800 bg-neutral-950/40 group hover:border-neutral-700 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: label.color }} />
                <span className="text-sm font-medium text-white">{label.name}</span>
              </div>
              <button
                onClick={() => handleDeleteLabel(label.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Workflow Info */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 sm:p-8">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50 mb-4">Workflow Statuses</h3>
        <p className="text-xs text-white/40 mb-4">Default statuses used across all boards in this project.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {["To Do", "In Progress", "In Review", "Done"].map(s => (
            <div key={s} className="p-3 rounded-lg border border-neutral-800 bg-neutral-950/40 text-center">
              <div className={`w-2.5 h-2.5 rounded-full mx-auto mb-2 ${
                s === "Done" ? "bg-green-400" : s === "In Progress" ? "bg-yellow-400" : s === "In Review" ? "bg-indigo-400" : "bg-neutral-500"
              }`} />
              <span className="text-xs font-semibold text-white/70">{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-6 sm:p-8 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-red-500" />
          <h3 className="text-lg font-bold text-red-500 tracking-tight">Danger Zone</h3>
        </div>
        <p className="text-sm text-red-500/70">
          Deleting this project will permanently erase all issues, sprints, labels, and data. This action cannot be undone.
        </p>
        <div className="mt-2">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm font-bold hover:bg-red-500/20 transition-colors flex items-center gap-2"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete Project
          </button>
        </div>
      </div>

    </div>
  );
}
