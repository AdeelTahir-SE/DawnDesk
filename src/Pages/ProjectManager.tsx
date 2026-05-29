import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import ProjectListScreen from "../components/ProjectManager/ProjectListScreen";
import ProjectDashboard from "../components/ProjectManager/ProjectDashboard";
import Board from "../components/ProjectManager/Board";
import Backlog from "../components/ProjectManager/Backlog";
import Roadmap from "../components/ProjectManager/Roadmap";
import Reports from "../components/ProjectManager/Reports";
import ProjectSettings from "../components/ProjectManager/ProjectSettings";
import SearchAndFilters from "../components/ProjectManager/SearchAndFilters";
import Strategies from "../components/ProjectManager/Strategies";
import { LayoutDashboard, Settings, ArrowLeft, Loader2, ListTodo, Map, LineChart, Search, FileText } from "lucide-react";
import WelcomeScreen from "../components/WelcomeScreen";
import { LocalProject } from "../components/ProjectManager/types";

export default function ProjectManager() {
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const [activeProject, setActiveProject] = useState<LocalProject | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "backlog" | "board" | "roadmap" | "strategies" | "search" | "reports" | "settings">("dashboard");
  const [loadingProject, setLoadingProject] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
        <div className="dd-page">
          <aside className="dd-sidebar-narrow">
            <div className="dd-sidebar-header">
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => { setActiveProjectId(null); setSearchQuery(""); }}
                  className="flex items-center gap-2 text-xs font-bold text-white/60 hover:text-white transition-colors self-start"
                >
                  <ArrowLeft className="w-4 h-4" /> Hub
                </button>

                <div>
                  {loadingProject ? (
                    <Loader2 className="w-5 h-5 text-white/60 animate-spin" />
                  ) : (
                    <>
                      <h1 className="dd-sidebar-title line-clamp-1">{activeProject?.name}</h1>
                      <p className="dd-subtext mt-1 line-clamp-2">{activeProject?.key} Workspace</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="px-3 pt-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/35" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search issues..."
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 pl-9 pr-3 py-2 text-xs text-white placeholder-white/35 outline-none focus:border-yellow-400/60 transition-colors"
                />
              </div>
            </div>

            <nav className="custom-scrollbar flex-1 overflow-y-auto p-3">
              <p className="dd-label-muted mb-2 px-2">Planning</p>
              <div className="space-y-1 mb-6">
                {[
                  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
                  { id: "roadmap", label: "Roadmap", icon: Map },
                  { id: "strategies", label: "Strategies", icon: FileText },
                  { id: "backlog", label: "Backlog", icon: ListTodo },
                  { id: "board", label: "Active Sprint", icon: LayoutDashboard },
                  { id: "search", label: "Search & Filters", icon: Search },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`dd-nav-item-sm ${
                      activeTab === tab.id ? "dd-nav-item-sm-active" : ""
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              <p className="dd-label-muted mb-2 px-2">Project</p>
              <div className="space-y-1">
                {[
                  { id: "reports", label: "Reports", icon: LineChart },
                  { id: "settings", label: "Project Settings", icon: Settings }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`dd-nav-item-sm ${
                      activeTab === tab.id ? "dd-nav-item-sm-active" : ""
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </nav>
          </aside>

          <main className="custom-scrollbar flex-1 overflow-y-auto p-8 bg-neutral-950">
            <div className="mx-auto max-w-[1400px] h-full">
              {activeTab === "dashboard" && <ProjectDashboard projectId={activeProjectId} />}
              {activeTab === "backlog" && <Backlog projectId={activeProjectId} />}
              {activeTab === "board" && <Board projectId={activeProjectId} />}
              {activeTab === "roadmap" && <Roadmap projectId={activeProjectId} />}
              {activeTab === "strategies" && <Strategies projectId={activeProjectId} />}
              {activeTab === "search" && <SearchAndFilters projectId={activeProjectId} />}
              {activeTab === "reports" && <Reports projectId={activeProjectId} />}
              {activeTab === "settings" && <ProjectSettings project={activeProject} onProjectDeleted={() => setActiveProjectId(null)} onProjectUpdated={(proj) => setActiveProject(proj)} />}
            </div>
          </main>
        </div>
      )}
    </WelcomeScreen>
  );
}
