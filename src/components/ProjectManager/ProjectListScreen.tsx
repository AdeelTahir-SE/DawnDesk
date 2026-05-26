import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Plus, Layout, Loader2, Folder, X, BarChart3, Clock, CheckCircle2, Sparkles } from "lucide-react";
import { LocalProject, LocalIssue } from "./types";

interface ProjectListScreenProps {
  onProjectSelect: (projectId: number) => void;
}

export default function ProjectListScreen({ onProjectSelect }: ProjectListScreenProps) {
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [taskCounts, setTaskCounts] = useState<Record<number, { total: number; done: number; active: number }>>({});
  const [loading, setLoading] = useState(true);

  // Create Project Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const projs = await invoke<LocalProject[]>("get_projects");
      setProjects(projs);
      const counts: Record<number, { total: number; done: number; active: number }> = {};
      await Promise.all(projs.map(async (project) => {
        const tasks = await invoke<LocalIssue[]>("get_issues", { projectId: project.id });
        counts[project.id] = {
          total: tasks.length,
          done: tasks.filter(task => task.status === "Done").length,
          active: tasks.filter(task => task.status !== "Done").length,
        };
      }));
      setTaskCounts(counts);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const totalTasks = Object.values(taskCounts).reduce((sum, count) => sum + count.total, 0);
  const activeTasks = Object.values(taskCounts).reduce((sum, count) => sum + count.active, 0);
  const completedTasks = Object.values(taskCounts).reduce((sum, count) => sum + count.done, 0);

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
          key: newProjName.trim().substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') || "PROJ",
          description: newProjDesc.trim() || null,
          color_tag: "#facc15",
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
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full max-w-7xl mx-auto p-4 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Header */}
      <section className="dd-hero">
        <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-neutral-950/40 flex items-center justify-center border border-neutral-800">
            <Folder className="w-8 h-8 text-yellow-400" />
          </div>
          <div>
            <p className="dd-label">Project Manager</p>
            <h1 className="dd-page-title mt-2">Project Hub</h1>
            <p className="dd-body-lg max-w-2xl mt-2">Manage all your projects and tasks locally.</p>
          </div>
        </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="dd-btn-primary"
          >
            <Plus className="h-4 w-4" />
            New Workspace
          </button>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="dd-card-inset">
            <div className="dd-form-label flex items-center gap-2">
              <Layout className="h-4 w-4" /> Workspaces
            </div>
            <div className="mt-2 text-2xl font-bold text-white">{projects.length}</div>
          </div>
          <div className="dd-card-inset">
            <div className="dd-form-label flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-400" /> Active Tasks
            </div>
            <div className="mt-2 text-2xl font-bold text-white">{activeTasks}</div>
          </div>
          <div className="dd-card-inset">
            <div className="dd-form-label flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Completed
            </div>
            <div className="mt-2 text-2xl font-bold text-white">{completedTasks}<span className="text-sm text-white/45"> / {totalTasks}</span></div>
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="space-y-6 flex-1 overflow-auto pb-8 custom-scrollbar">
        <div className="flex items-center justify-between">
          <h2 className="dd-section-title flex items-center gap-2">
            <Layout className="w-5 h-5 text-white/60" /> Active Workspaces
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-white/45 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            
            {/* Create New Project Card */}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="group rounded-2xl border-2 border-dashed border-neutral-800 bg-neutral-950/40 p-6 flex flex-col items-center justify-center gap-3 min-h-[220px] hover:border-yellow-400/40 hover:bg-yellow-400/10 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-neutral-950/40 flex items-center justify-center group-hover:scale-110 group-hover:bg-yellow-400/10 transition-all">
                <Plus className="w-6 h-6 text-white/60 group-hover:text-yellow-400 transition-colors" />
              </div>
              <span className="text-sm font-bold text-white/60 group-hover:text-yellow-400 transition-colors">Create Workspace</span>
            </button>

            {/* Existing Projects */}
            {projects.map(p => (
              (() => {
                const counts = taskCounts[p.id] ?? { total: 0, done: 0, active: 0 };
                const progress = counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : 0;
                return (
              <button 
                key={p.id}
                onClick={() => onProjectSelect(p.id)}
                className="dd-card-elevated group flex flex-col text-left hover:border-yellow-400/40 hover:shadow-2xl transition-all h-full min-h-[240px] relative overflow-hidden"
              >
                
                <div className="flex-1">
                  <div className="w-10 h-10 rounded-xl shadow-sm mb-5 border border-neutral-800 bg-neutral-950/40 flex items-center justify-center">
                    <Folder className="w-5 h-5 text-yellow-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-yellow-300 transition-colors line-clamp-1">{p.name}</h3>
                  <p className="text-sm text-white/60 mt-2 line-clamp-2 leading-relaxed">{p.description || "No description provided."}</p>
                </div>
                <div className="dd-card-inset mt-5">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-semibold text-white/50"><BarChart3 className="h-3.5 w-3.5" /> Progress</span>
                    <span className="font-bold text-white">{progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-neutral-800">
                    <div className="h-full rounded-full bg-yellow-400" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-neutral-800">
                  <span className="text-xs text-white/45 font-medium">
                    Created {new Date(p.created_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-white/50">
                    <Sparkles className="h-3.5 w-3.5" /> {counts.active} active
                  </span>
                </div>
              </button>
                );
              })()
            ))}

          </div>
        )}
      </section>

      {/* CREATE PROJECT MODAL */}
      {isModalOpen && (
        <div className="dd-modal-overlay !z-[100]">
          <div className="dd-modal-sm">
            <div className="dd-modal-header">
              <div>
                <h2 className="dd-modal-title">Create Workspace</h2>
                <p className="dd-subtext mt-1">A dedicated space for your project and its tasks.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="dd-icon-btn h-9 w-9">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateProject} className="dd-modal-body">
              <div className="flex flex-col gap-2">
                <label className="dd-form-label">Project Name</label>
                <input type="text" value={newProjName} onChange={e=>setNewProjName(e.target.value)} placeholder="e.g. Website Redesign" className="dd-input" required />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="dd-form-label">Description (Optional)</label>
                <textarea value={newProjDesc} onChange={e=>setNewProjDesc(e.target.value)} placeholder="Brief description..." className="dd-input resize-none h-24 custom-scrollbar" />
              </div>

              <div className="dd-modal-footer mt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="dd-btn-secondary">Cancel</button>
                <button type="submit" disabled={creating} className="dd-btn-primary px-6">
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
