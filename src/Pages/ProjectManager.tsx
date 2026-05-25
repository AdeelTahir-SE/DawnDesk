import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import ProjectListScreen from "../components/ProjectManager/ProjectListScreen";
import ProjectDashboard from "../components/ProjectManager/ProjectDashboard";
import KanbanBoard from "../components/ProjectManager/KanbanBoard";
import ProjectSettings from "../components/ProjectManager/ProjectSettings";
import { LayoutDashboard, Layout, Settings, ArrowLeft, Loader2 } from "lucide-react";
import WelcomeScreen from "../components/WelcomeScreen";

export interface LocalProject {
  id: number;
  name: string;
  description: string | null;
  color_tag: string;
  created_at: string;
}

export default function ProjectManager() {
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const [activeProject, setActiveProject] = useState<LocalProject | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "board" | "settings">("dashboard");
  const [loadingProject, setLoadingProject] = useState(false);

  useEffect(() => {
    const loadProject = async () => {
      if (activeProjectId === null) {
        setActiveProject(null);
        return;
      }
      setLoadingProject(true);
      try {
        const projs = await invoke<LocalProject[]>("get_projects");
        const proj = projs.find(p => p.id === activeProjectId);
        setActiveProject(proj || null);
      } catch (e) {
        console.error("Failed to load project details:", e);
      }
      setLoadingProject(false);
    };
    loadProject();
  }, [activeProjectId]);

  return (
    <WelcomeScreen appKey="project-manager" title="Project Manager" description="Manage your projects and tasks locally.">
      {activeProjectId === null ? (
        <ProjectListScreen 
          onProjectSelect={(id) => { setActiveProjectId(id); setActiveTab("dashboard"); }} 
        />
      ) : (
        <div className="flex flex-col h-[calc(100vh-4rem)] w-full max-w-[1600px] mx-auto animate-in fade-in zoom-in-95 duration-300">
        
        {/* Workspace Top Navigation Bar */}
        <div className="flex items-center justify-between border-b border-white/10 bg-neutral-900/60 px-6 py-4 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setActiveProjectId(null)}
              className="flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Hub
            </button>
            
            <div className="w-px h-6 bg-white/10" />
            
            <div className="flex items-center gap-3">
              {loadingProject ? (
                <Loader2 className="w-5 h-5 text-white/50 animate-spin" />
              ) : (
                <>
                  <div className="w-5 h-5 rounded shadow-sm border border-white/10" style={{ backgroundColor: activeProject?.color_tag }} />
                  <h1 className="text-xl font-extrabold text-white tracking-tight">{activeProject?.name}</h1>
                </>
              )}
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
            {[
              { id: "dashboard", label: "Overview", icon: LayoutDashboard },
              { id: "board", label: "Tasks", icon: Layout },
              { id: "settings", label: "Settings", icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-white/10 text-yellow-400 shadow-sm border border-white/5"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Workspace Content Area */}
        <div className="flex-1 overflow-hidden p-4 sm:p-6 bg-black/20">
          {activeTab === "dashboard" && <ProjectDashboard projectId={activeProjectId} />}
          {activeTab === "board" && <KanbanBoard projectId={activeProjectId} />}
          {activeTab === "settings" && <ProjectSettings project={activeProject} onProjectDeleted={() => setActiveProjectId(null)} onProjectUpdated={(proj) => setActiveProject(proj)} />}
        </div>
      </div>
      )}
    </WelcomeScreen>
  );
}
