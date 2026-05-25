import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Save, Trash2, ShieldAlert, Loader2 } from "lucide-react";
import { LocalProject } from "../../Pages/ProjectManager";

interface ProjectSettingsProps {
  project: LocalProject | null;
  onProjectDeleted: () => void;
  onProjectUpdated: (proj: LocalProject) => void;
}

export default function ProjectSettings({ project, onProjectDeleted, onProjectUpdated }: ProjectSettingsProps) {
  if (!project) return null;

  const [name, setName] = useState(project.name);
  const [desc, setDesc] = useState(project.description || "");
  const [color, setColor] = useState(project.color_tag);
  
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await invoke("update_project", {
        input: {
          id: project.id,
          name: name.trim(),
          description: desc.trim() || null,
          color_tag: color
        }
      });
      onProjectUpdated({
        ...project,
        name: name.trim(),
        description: desc.trim() || null,
        color_tag: color
      });
    } catch (error) {
      console.error(error);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this project and ALL its tasks? This cannot be undone.")) return;
    
    setDeleting(true);
    try {
      await invoke("delete_project", { id: project.id });
      onProjectDeleted();
    } catch (error) {
      console.error(error);
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-3xl h-full overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-300">
      
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Project Settings</h2>
        <p className="text-sm text-white/50">Manage your workspace configuration.</p>
      </div>

      <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 sm:p-8">
        <form onSubmit={handleUpdate} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-white/70 uppercase tracking-wider">Project Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/50 transition-colors" 
              required 
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-white/70 uppercase tracking-wider">Description</label>
            <textarea 
              value={desc} 
              onChange={e => setDesc(e.target.value)} 
              className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/50 transition-colors resize-none h-32 custom-scrollbar" 
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-white/70 uppercase tracking-wider">Accent Color</label>
            <div className="flex gap-3 mt-1">
              {["#ffffff", "#a3a3a3", "#525252", "#facc15", "#eab308", "#ca8a04"].map(c => (
                <button 
                  key={c} 
                  type="button" 
                  onClick={() => setColor(c)} 
                  className={`w-10 h-10 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-transparent hover:scale-105 opacity-50 hover:opacity-100'}`} 
                  style={{ backgroundColor: c }} 
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end mt-4 pt-6 border-t border-white/5">
            <button 
              type="submit" 
              disabled={saving} 
              className="px-6 py-2.5 rounded-xl bg-yellow-400 text-black text-sm font-bold hover:bg-yellow-300 transition-colors flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
            </button>
          </div>
        </form>
      </div>

      <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-6 sm:p-8 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-red-500" />
          <h3 className="text-lg font-bold text-red-500 tracking-tight">Danger Zone</h3>
        </div>
        <p className="text-sm text-red-500/70">
          Deleting this project will permanently erase all associated tasks and data. This action cannot be undone.
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
