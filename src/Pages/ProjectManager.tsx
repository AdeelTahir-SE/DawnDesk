import { useState, useEffect } from "react";
import { pmGateway, DbUser, DbProject } from "../utils/supabase";
import AuthPanel from "../components/ProjectManager/AuthPanel";
import ProjectListScreen from "../components/ProjectManager/ProjectListScreen";
import ProjectDashboard from "../components/ProjectManager/ProjectDashboard";
import KanbanBoard from "../components/ProjectManager/KanbanBoard";
import ChatPanel from "../components/ProjectManager/ChatPanel";
import ProjectSettings from "../components/ProjectManager/ProjectSettings";
import { LayoutDashboard, Layout, MessageSquare, Settings, ArrowLeft, Loader2 } from "lucide-react";
import OnboardingWrapper from "../components/OnboardingWrapper";

export default function ProjectManager() {
  const [currentUser, setCurrentUser] = useState<DbUser | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string>("");
  const [activeProject, setActiveProject] = useState<DbProject | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "board" | "chat" | "settings">("dashboard");
  const [loadingProject, setLoadingProject] = useState(false);

  useEffect(() => {
    const active = pmGateway.getActiveUser();
    if (active) setCurrentUser(active);
  }, []);

  useEffect(() => {
    const loadProject = async () => {
      if (!activeProjectId) {
        setActiveProject(null);
        return;
      }
      setLoadingProject(true);
      const projs = await pmGateway.getProjects();
      const proj = projs.find(p => p.id === activeProjectId);
      setActiveProject(proj || null);
      setLoadingProject(false);
    };
    loadProject();
  }, [activeProjectId]);

  const handleLogin = (user: DbUser) => {
    setCurrentUser(user);
    setActiveProjectId("");
  };

  const handleLogout = () => {
    pmGateway.setActiveUser(null);
    setCurrentUser(null);
    setActiveProjectId("");
  };

  if (!currentUser) {
    return <AuthPanel onLogin={handleLogin} />;
  }

  // 1. HUB VIEW
  if (!activeProjectId) {
    return (
      <ProjectListScreen 
        currentUser={currentUser} 
        onProjectSelect={(id) => { setActiveProjectId(id); setActiveTab("dashboard"); }} 
        onLogout={handleLogout} 
      />
    );
  }

  // 2. WORKSPACE VIEW
  return (
    <OnboardingWrapper appKey="project-manager" title="Welcome to Project Manager" description="Orchestrate your team's workflow entirely.">
      <div className="flex flex-col h-[calc(100vh-4rem)] w-full max-w-[1600px] mx-auto animate-in fade-in zoom-in-95 duration-300">
        
        {/* Workspace Top Navigation Bar */}
        <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/60 px-6 py-4 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setActiveProjectId("")}
              className="flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Hub
            </button>
            
            <div className="w-px h-6 bg-neutral-800" />
            
            <div className="flex items-center gap-3">
              {loadingProject ? (
                <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
              ) : (
                <>
                  <div className="w-5 h-5 rounded shadow-sm border border-white/10" style={{ backgroundColor: activeProject?.colorTag }} />
                  <h1 className="text-xl font-extrabold text-white tracking-tight">{activeProject?.name}</h1>
                </>
              )}
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-1 bg-neutral-950/40 p-1 rounded-xl border border-neutral-800/80">
            {[
              { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
              { id: "board", label: "Kanban", icon: Layout },
              { id: "chat", label: "Chat", icon: MessageSquare },
              { id: "settings", label: "Settings", icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-neutral-800/80 text-yellow-400 shadow-sm border border-neutral-700/50"
                    : "text-white/40 hover:text-white hover:bg-neutral-900"
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
          {activeTab === "board" && <KanbanBoard projectId={activeProjectId} currentUser={currentUser} />}
          {activeTab === "chat" && <ChatPanel projectId={activeProjectId} currentUser={currentUser} />}
          {activeTab === "settings" && <ProjectSettings projectId={activeProjectId} currentUser={currentUser} onProjectDeleted={() => setActiveProjectId("")} />}
        </div>
      </div>
    </OnboardingWrapper>
  );
}
