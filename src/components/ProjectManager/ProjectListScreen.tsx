import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Plus, Layout, Loader2, Folder, X } from "lucide-react";
import { LocalProject } from "../../Pages/ProjectManager";

interface ProjectListScreenProps {
  onProjectSelect: (projectId: number) => void;
}

export default function ProjectListScreen({ onProjectSelect }: ProjectListScreenProps) {
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Project Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [newProjColor, setNewProjColor] = useState("#facc15");
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const projs = await invoke<LocalProject[]>("get_projects");
      setProjects(projs);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    setCreating(true);
    try {
      await invoke("create_project", { 
        input: {
          name: newProjName.trim(),
          description: newProjDesc.trim() || null,
          color_tag: newProjColor,
          created_at: new Date().toISOString()
        }
      });
      setIsModalOpen(false);
      setNewProjName("");
      setNewProjDesc("");
      await loadData();
      
      // Select the newest project
      const projs = await invoke<LocalProject[]>("get_projects");
      if (projs.length > 0) {
        onProjectSelect(projs[0].id);
      }
    } catch (e) {
      console.error(e);
    }
    setCreating(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full max-w-7xl mx-auto p-4 sm:p-8 space-y-8 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-neutral-900/50 p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
            <Folder className="w-8 h-8 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Project Hub</h1>
            <p className="text-sm text-white/50 mt-1">Manage all your projects and tasks locally.</p>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <section className="space-y-6 flex-1 overflow-auto pb-8 custom-scrollbar">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layout className="w-5 h-5 text-white/50" /> Active Workspaces
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-white/30 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            
            {/* Create New Project Card */}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="group rounded-2xl border-2 border-dashed border-white/10 bg-black/20 p-6 flex flex-col items-center justify-center gap-3 min-h-[220px] hover:border-yellow-400/50 hover:bg-yellow-400/5 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-yellow-400/20 transition-all">
                <Plus className="w-6 h-6 text-white/50 group-hover:text-yellow-400 transition-colors" />
              </div>
              <span className="text-sm font-bold text-white/50 group-hover:text-yellow-400 transition-colors">Create Workspace</span>
            </button>

            {/* Existing Projects */}
            {projects.map(p => (
              <button 
                key={p.id}
                onClick={() => onProjectSelect(p.id)}
                className="group flex flex-col rounded-2xl border border-white/10 bg-neutral-900/50 p-6 text-left hover:border-white/30 hover:shadow-2xl transition-all h-full min-h-[220px] relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: p.color_tag }} />
                
                <div className="flex-1">
                  <div className="w-10 h-10 rounded-xl shadow-sm mb-5 border border-white/10 flex items-center justify-center" style={{ backgroundColor: `${p.color_tag}20` }}>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.color_tag }} />
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-yellow-400 transition-colors line-clamp-1">{p.name}</h3>
                  <p className="text-sm text-white/50 mt-2 line-clamp-2 leading-relaxed">{p.description || "No description provided."}</p>
                </div>
                
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                  <span className="text-xs text-white/30 font-medium">
                    Created {new Date(p.created_at).toLocaleDateString()}
                  </span>
                </div>
              </button>
            ))}

          </div>
        )}
      </section>

      {/* CREATE PROJECT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Create Workspace</h2>
                <p className="text-xs text-white/50 mt-1">A dedicated space for your project and its tasks.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-white/50 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateProject} className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-white/70 uppercase tracking-wider">Project Name</label>
                <input type="text" value={newProjName} onChange={e=>setNewProjName(e.target.value)} placeholder="e.g. Website Redesign" className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-yellow-400/50 transition-colors" required />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-white/70 uppercase tracking-wider">Description (Optional)</label>
                <textarea value={newProjDesc} onChange={e=>setNewProjDesc(e.target.value)} placeholder="Brief description..." className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-yellow-400/50 transition-colors resize-none h-24 custom-scrollbar" />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-white/70 uppercase tracking-wider">Accent Color</label>
                <div className="flex gap-3 mt-1">
                  {["#ffffff", "#a3a3a3", "#525252", "#facc15", "#eab308", "#ca8a04"].map(c => (
                    <button key={c} type="button" onClick={() => setNewProjColor(c)} className={`w-8 h-8 rounded-full border-2 transition-all ${newProjColor === c ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-transparent hover:scale-105 opacity-50 hover:opacity-100'}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white/50 hover:bg-white/5 transition-colors">Cancel</button>
                <button type="submit" disabled={creating} className="px-6 py-2.5 rounded-xl bg-yellow-400 text-black text-sm font-bold hover:bg-yellow-300 transition-colors flex items-center gap-2">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Workspace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
