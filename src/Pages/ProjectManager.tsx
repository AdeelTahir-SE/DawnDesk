import { useEffect, useState } from "react";
import ConnectionErrorModal from "../components/ConnectionErrorModal";
import ProjectListScreen from "../components/ProjectManager/ProjectListScreen";
import ProjectDashboard from "../components/ProjectManager/ProjectDashboard";
import Board from "../components/ProjectManager/Board";
import Backlog from "../components/ProjectManager/Backlog";
import Roadmap from "../components/ProjectManager/Roadmap";
import Reports from "../components/ProjectManager/Reports";
import SearchAndFilters from "../components/ProjectManager/SearchAndFilters";
import Strategies from "../components/ProjectManager/Strategies";
import { LayoutDashboard, Settings, ArrowLeft, ListTodo, Map, LineChart, Search, FileText, Loader2, UserPlus, Users, X } from "lucide-react";
import WelcomeScreen from "../components/WelcomeScreen";
import ProjectSectionComments from "../components/ProjectManager/ProjectSectionComments";
import type { ProjectMember } from "../components/ProjectManager/types";
import {
  formatSupabaseError,
  inviteProjectMember,
  listProjectMembers,
  removeProjectMember,
  type SupabaseProject,
} from "../lib/workspaceSync";
import { CONNECTION_ERROR_EVENT, getConnectionErrorMessage } from "../lib/connectionErrors";

const PROJECT_TAB_LABELS = {
  dashboard: "Dashboard",
  backlog: "Backlog",
  board: "Active Sprint",
  roadmap: "Roadmap",
  strategies: "Strategies",
  search: "Search & Filters",
  reports: "Reports",
  settings: "Project Settings",
} as const;

type ProjectTab = keyof typeof PROJECT_TAB_LABELS;

export default function ProjectManager() {
  const [activeProject, setActiveProject] = useState<SupabaseProject | null>(null);
  const [activeTab, setActiveTab] = useState<ProjectTab>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [connectionErrorOpen, setConnectionErrorOpen] = useState(false);

  useEffect(() => {
    const handleConnectionError = () => {
      setConnectionErrorOpen(true);
    };

    window.addEventListener(CONNECTION_ERROR_EVENT, handleConnectionError);
    return () => window.removeEventListener(CONNECTION_ERROR_EVENT, handleConnectionError);
  }, []);

  return (
    <WelcomeScreen appKey="project-manager" title="Project Manager" description="Manage your projects and tasks in Supabase.">
      <ConnectionErrorModal
        open={connectionErrorOpen}
        message={getConnectionErrorMessage()}
        onClose={() => setConnectionErrorOpen(false)}
      />
      {activeProject === null ? (
        <ProjectListScreen
          onProjectSelect={(project) => { setActiveProject(project); setActiveTab("dashboard"); }}
        />
      ) : (
        <div className="dd-page">
          <aside className="dd-sidebar-narrow">
            <div className="dd-sidebar-header">
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => { setActiveProject(null); setSearchQuery(""); }}
                  className="flex items-center gap-2 text-xs font-bold text-white/60 hover:text-white transition-colors self-start"
                >
                  <ArrowLeft className="w-4 h-4" /> Hub
                </button>

                <div>
                  <h1 className="dd-sidebar-title line-clamp-1">{activeProject.name}</h1>
                  <p className="dd-subtext mt-1 line-clamp-2">{activeProject.key} Workspace</p>
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
                    onClick={() => setActiveTab(tab.id as ProjectTab)}
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
                    onClick={() => setActiveTab(tab.id as ProjectTab)}
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
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900/45 px-4 py-3">
                <div className="min-w-0">
                  <p className="dd-label-muted">Current section</p>
                  <h2 className="truncate text-lg font-bold text-white">{PROJECT_TAB_LABELS[activeTab]}</h2>
                </div>
                <ProjectSectionComments
                  projectId={activeProject.id}
                  section={activeTab}
                  sectionLabel={PROJECT_TAB_LABELS[activeTab]}
                />
              </div>
              {activeTab === "dashboard" && <ProjectDashboard projectId={activeProject.id} />}
              {activeTab === "backlog" && <Backlog projectId={activeProject.id} />}
              {activeTab === "board" && <Board projectId={activeProject.id} />}
              {activeTab === "roadmap" && <Roadmap projectId={activeProject.id} />}
              {activeTab === "strategies" && <Strategies projectId={activeProject.id} />}
              {activeTab === "search" && <SearchAndFilters projectId={activeProject.id} />}
              {activeTab === "reports" && <Reports projectId={activeProject.id} />}
              {activeTab === "settings" && (
                <ProjectMembersSettings project={activeProject} />
              )}
            </div>
          </main>
        </div>
      )}
    </WelcomeScreen>
  );
}

function ProjectMembersSettings({ project }: { project: SupabaseProject }) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<ProjectMember["role"]>("Editor");
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");

  const loadMembers = async () => {
    setLoading(true);
    setError("");
    try {
      setMembers(await listProjectMembers(project.id));
    } catch (err) {
      setError(formatSupabaseError(err));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMembers();
  }, [project.id]);

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setError("");
    try {
      await inviteProjectMember(project.id, inviteEmail, inviteRole);
      setInviteEmail("");
      setInviteRole("Editor");
      await loadMembers();
    } catch (err) {
      setError(formatSupabaseError(err));
    }
    setInviting(false);
  };

  const handleRemove = async (member: ProjectMember) => {
    if (member.role === "Owner") return;
    if (!window.confirm("Remove this member from the project?")) return;
    setError("");
    try {
      await removeProjectMember(member.id);
      await loadMembers();
    } catch (err) {
      setError(formatSupabaseError(err));
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-neutral-800 bg-neutral-900/45 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="dd-label-muted">Project Settings</p>
            <h3 className="mt-1 text-xl font-bold text-white">{project.name}</h3>
            <p className="mt-2 text-sm text-neutral-400">Invite teammates and manage project access in Supabase.</p>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-semibold text-neutral-400">
            {project.id}
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleInvite} className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_160px_auto]">
          <input
            type="email"
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
            placeholder="teammate@example.com"
            className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-yellow-400/60"
            required
          />
          <select
            value={inviteRole}
            onChange={(event) => setInviteRole(event.target.value as ProjectMember["role"])}
            className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none focus:border-yellow-400/60"
          >
            <option value="Editor">Editor</option>
            <option value="Viewer">Viewer</option>
          </select>
          <button type="submit" disabled={inviting} className="dd-btn-primary">
            {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Invite
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-neutral-800 bg-neutral-900/45 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="flex items-center gap-2 text-sm font-bold text-white">
            <Users className="h-4 w-4 text-yellow-400" />
            Members
          </h4>
          <span className="rounded-full border border-neutral-800 bg-neutral-950 px-3 py-1 text-xs font-bold text-neutral-400">
            {members.length}
          </span>
        </div>
        {loading ? (
          <div className="grid h-24 place-items-center">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
          </div>
        ) : members.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-800 p-8 text-center text-sm text-neutral-400">
            No members found.
          </div>
        ) : (
          <div className="divide-y divide-neutral-800 overflow-hidden rounded-xl border border-neutral-800">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between gap-4 bg-neutral-950/50 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{member.display_name || member.email || member.invited_email || "Pending member"}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-neutral-500">{member.role} - {member.status}</p>
                </div>
                {member.role !== "Owner" && (
                  <button
                    onClick={() => handleRemove(member)}
                    className="rounded-md p-2 text-neutral-500 transition-colors hover:bg-red-500/10 hover:text-red-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
