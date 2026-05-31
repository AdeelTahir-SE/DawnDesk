import { useState, useEffect, useMemo } from "react";
import { Plus, Layout, Loader2, Folder, X, Search, Cloud, Users } from "lucide-react";
import { useAppLogger } from "../../utils/LoggerContext";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import {
  createSupabaseProject,
  formatSupabaseError,
  listSupabaseProjects,
  type SupabaseProject,
} from "../../lib/workspaceSync";

interface ProjectListScreenProps {
  onProjectSelect: (project: SupabaseProject) => void;
}

export default function ProjectListScreen({ onProjectSelect }: ProjectListScreenProps) {
  const { logSuccess, logError } = useAppLogger();
  const [projects, setProjects] = useState<SupabaseProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Create Project Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [newProjType, setNewProjType] = useState<"Scrum" | "Kanban">("Scrum");
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setSyncError("");
    try {
      if (!isSupabaseConfigured) {
        setProjects([]);
        setSyncError("Cloud sync is not configured. Add the required environment settings.");
        return;
      }
      setProjects(await listSupabaseProjects());
    } catch (e) {
      const message = formatSupabaseError(e);
      setSyncError(message);
      logError("Project workspace load failed", message, { source: "project-manager" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    setCreating(true);
    setSyncError("");
    try {
      if (!isSupabaseConfigured) {
        throw new Error("Cloud sync is not configured. Add the required environment settings.");
      }

      const project = await createSupabaseProject({
        name: newProjName.trim(),
        key: newProjName.trim().substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') || "PROJ",
        description: newProjDesc.trim() || null,
        color_tag: "#facc15",
        project_type: newProjType,
        created_at: new Date().toISOString(),
      });
      setIsModalOpen(false);
      setNewProjName("");
      setNewProjDesc("");
      setNewProjType("Scrum");
      await loadData();
      onProjectSelect(project);
      logSuccess("Project created", newProjName.trim(), { source: "project-manager" });
    } catch (e) {
      const message = formatSupabaseError(e);
      setSyncError(message);
      logError("Project creation failed", message, { source: "project-manager" });
    }
    setCreating(false);
  };

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const lowerQuery = searchQuery.toLowerCase();
    return projects.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) || 
      (p.description && p.description.toLowerCase().includes(lowerQuery)) ||
      p.key.toLowerCase().includes(lowerQuery)
    );
  }, [projects, searchQuery]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full max-w-7xl mx-auto p-4 sm:p-8 space-y-8 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-neutral-800 pb-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center border border-neutral-700/50 shadow-inner">
            <Layout className="w-8 h-8 text-neutral-300" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Workspaces</h1>
            <p className="text-neutral-400 mt-1 max-w-xl">Organize shared projects in your DawnDesk workspace.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-yellow-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Search workspaces..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-64 bg-neutral-900/50 border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="dd-btn-primary"
          >
            <Plus className="h-4 w-4" />
            New Workspace
          </button>
        </div>
      </section>

      {syncError && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Cloud sync needs attention: {syncError}
        </div>
      )}

      {/* Projects Grid */}
      <section className="flex-1 overflow-auto pb-8 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-neutral-600 animate-spin" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-neutral-800 rounded-2xl bg-neutral-900/20">
            <Folder className="w-12 h-12 text-neutral-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-1">No workspaces found</h3>
            <p className="text-neutral-400 max-w-md">
              {searchQuery ? "Try adjusting your search query." : "Get started by creating your first workspace."}
            </p>
            {!searchQuery && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="mt-6 dd-btn-primary"
              >
                <Plus className="h-4 w-4" />
                Create Workspace
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            
            {filteredProjects.map(p => (
              <button 
                key={p.id}
                onClick={() => onProjectSelect(p)}
                className="group text-left border border-neutral-800 bg-neutral-900/40 hover:bg-neutral-800/60 rounded-2xl p-6 transition-all h-full min-h-[200px] flex flex-col relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
              >
                <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: p.color_tag || '#4ade80' }} />
                
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-neutral-800/80 flex items-center justify-center border border-neutral-700">
                    <Folder className="w-5 h-5 text-neutral-300 group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-xs font-mono font-medium text-neutral-500 bg-neutral-900 px-2 py-1 rounded border border-neutral-800">
                    {p.key}
                  </span>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white group-hover:text-yellow-400 transition-colors line-clamp-1 mb-2">{p.name}</h3>
                  <p className="text-sm text-neutral-400 line-clamp-2 leading-relaxed">
                    {p.description || "No description provided."}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 mt-6 pt-4 border-t border-neutral-800/60">
                  <Cloud className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-xs text-neutral-500 font-medium">
                    Synced team project
                  </span>
                  <Users className="ml-auto w-3.5 h-3.5 text-neutral-500" />
                </div>
              </button>
            ))}

          </div>
        )}
      </section>

      {/* CREATE PROJECT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/50">
              <div>
                <h2 className="text-lg font-semibold text-white">Create Workspace</h2>
                <p className="text-sm text-neutral-400 mt-0.5">Initialize a new project environment.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateProject} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">Workspace Name</label>
                <input 
                  type="text" 
                  value={newProjName} 
                  onChange={e=>setNewProjName(e.target.value)} 
                  placeholder="e.g. E-Commerce Platform" 
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all" 
                  required 
                  autoFocus
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">Description (Optional)</label>
                <textarea 
                  value={newProjDesc} 
                  onChange={e=>setNewProjDesc(e.target.value)} 
                  placeholder="Brief overview of this workspace..." 
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all resize-none h-24 custom-scrollbar" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">Project Type</label>
                <select
                  value={newProjType}
                  onChange={(e) => setNewProjType(e.target.value as "Scrum" | "Kanban")}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all"
                >
                  <option value="Scrum">Scrum</option>
                  <option value="Kanban">Kanban</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 px-4 py-2.5 rounded-lg border border-neutral-700 text-sm font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={creating} 
                  className="flex-1 dd-btn-primary"
                >
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
