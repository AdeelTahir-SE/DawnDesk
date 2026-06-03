import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Save, Trash2, ShieldAlert, Loader2, Plus, X, Tag, Settings2, GitMerge, Bot, Database, Users, Mail } from "lucide-react";
import { LocalProject, ProjectMember } from "./types";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import {
  createSupabaseProject,
  deleteSupabaseProject,
  inviteProjectMember,
  listProjectMembers,
  removeProjectMember,
  updateSupabaseProject,
} from "../../lib/workspaceSync";

interface Label {
  id: number;
  project_id: number;
  name: string;
  color: string;
}

interface WorkflowStatus {
  id: number;
  project_id: number;
  name: string;
  category: string;
  position: number;
  wip_limit?: number | null;
}

interface AutomationRule {
  id: number;
  project_id: number;
  name: string;
  trigger_type: string;
  conditions_json: string;
  actions_json: string;
  is_active: boolean;
}

interface CustomField {
  id: number;
  project_id: number;
  name: string;
  field_type: string;
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

export default function ProjectSettings(props: ProjectSettingsProps) {
  if (!props.project) return null;

  return (
    <ProjectSettingsInner
      project={props.project}
      onProjectDeleted={props.onProjectDeleted}
      onProjectUpdated={props.onProjectUpdated}
    />
  );
}

function ProjectSettingsInner({ project, onProjectDeleted, onProjectUpdated }: ProjectSettingsProps & { project: LocalProject }) {
  if (!project) return null;

  const [activeTab, setActiveTab] = useState<"general" | "members" | "workflows" | "automations" | "customFields">("general");

  const [name, setName] = useState(project.name);
  const [projKey, setProjKey] = useState(project.key);
  const [desc, setDesc] = useState(project.description || "");
  const [projectType, setProjectType] = useState<"Scrum" | "Kanban">((project.project_type as "Scrum" | "Kanban") || "Scrum");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");

  // Labels
  const [labels, setLabels] = useState<Label[]>([]);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);
  const [showLabelForm, setShowLabelForm] = useState(false);

  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<ProjectMember["role"]>("Editor");
  const [inviting, setInviting] = useState(false);

  // Workflows
  const [workflows, setWorkflows] = useState<WorkflowStatus[]>([]);
  const [showWorkflowForm, setShowWorkflowForm] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState("");
  const [newWorkflowCategory, setNewWorkflowCategory] = useState("To Do");
  const [newWorkflowWipLimit, setNewWorkflowWipLimit] = useState<number | "">("");

  // Automations
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [showAutomationForm, setShowAutomationForm] = useState(false);
  const [newAutoName, setNewAutoName] = useState("");
  const [newAutoTrigger, setNewAutoTrigger] = useState("Status Changed");
  const [newAutoCondition, setNewAutoCondition] = useState("");
  const [newAutoAction, setNewAutoAction] = useState("Set Priority");
  const [newAutoActionValue, setNewAutoActionValue] = useState("");

  // Custom Fields
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [showCustomFieldForm, setShowCustomFieldForm] = useState(false);
  const [newCustomFieldName, setNewCustomFieldName] = useState("");
  const [newCustomFieldType, setNewCustomFieldType] = useState("Text");

  const fetchData = async () => {
    try {
      const [lbls, wfs, autos] = await Promise.all([
        invoke<Label[]>("get_labels", { projectId: project.id }),
        invoke<WorkflowStatus[]>("get_workflow_statuses", { projectId: project.id }),
        invoke<AutomationRule[]>("get_automation_rules", { projectId: project.id }),
      ]);
      setLabels(lbls);
      setWorkflows(wfs);
      setAutomations(autos);
      await fetchMembers(project.supabase_project_id ?? null);

      try {
        const cfs = await invoke<CustomField[]>("get_custom_fields", { projectId: project.id });
        setCustomFields(cfs);
      } catch (e) {
        console.warn("Custom fields fetch failed, backend might not be ready yet", e);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [project.id]);

  const fetchMembers = async (supabaseProjectId = project.supabase_project_id ?? null) => {
    if (!supabaseProjectId || !isSupabaseConfigured) {
      setMembers([]);
      return;
    }

    try {
      const data = await listProjectMembers(supabaseProjectId);
      setMembers(data);
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : String(error));
    }
  };

  useEffect(() => {
    if (workflows.length > 0 && !newAutoCondition) {
      setNewAutoCondition(workflows[0].name);
    }
  }, [workflows, newAutoCondition]);

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
          color_tag: project.color_tag,
          project_type: projectType,
          supabase_project_id: project.supabase_project_id ?? null
        }
      });
      const updatedProject = {
        ...project,
        name: name.trim(),
        key: projKey.trim().toUpperCase() || project.key,
        description: desc.trim() || null,
        project_type: projectType,
      };
      if (updatedProject.supabase_project_id) {
        await updateSupabaseProject(updatedProject);
      }
      onProjectUpdated(updatedProject);
    } catch (error) {
      console.error(error);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this project and ALL its issues? This cannot be undone.")) return;
    setDeleting(true);
    try {
      if (project.supabase_project_id && isSupabaseConfigured) {
        await deleteSupabaseProject(project.supabase_project_id);
      }
      await invoke("delete_project", { id: project.id });
      onProjectDeleted();
    } catch (error) {
      console.error(error);
      setDeleting(false);
    }
  };

  const handleLinkSupabase = async () => {
    if (!isSupabaseConfigured) {
      setSyncError("Cloud sync is not configured yet. Add the required environment settings.");
      return;
    }

    setSyncing(true);
    setSyncError("");
    try {
      const remoteProject = await createSupabaseProject(project);
      const updatedProject = { ...project, supabase_project_id: remoteProject.id };
      await invoke("update_project", { input: updatedProject });
      onProjectUpdated(updatedProject);
      await fetchMembers(remoteProject.id);
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : String(error));
    }
    setSyncing(false);
  };

  const handleInviteMember = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!project.supabase_project_id || !inviteEmail.trim()) return;

    setInviting(true);
    setSyncError("");
    try {
      await inviteProjectMember(project.supabase_project_id, inviteEmail, inviteRole);
      setInviteEmail("");
      setInviteRole("Editor");
      await fetchMembers();
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : String(error));
    }
    setInviting(false);
  };

  const handleRemoveMember = async (member: ProjectMember) => {
    if (member.role === "Owner") return;
    if (!window.confirm("Remove this member from the project?")) return;

    try {
      await removeProjectMember(member.id);
      await fetchMembers();
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : String(error));
    }
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;
    try {
      await invoke("create_label", { projectId: project.id, name: newLabelName.trim(), color: newLabelColor });
      setNewLabelName("");
      setShowLabelForm(false);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteLabel = async (id: number) => {
    if (!window.confirm("Delete this label? It will be removed from all issues.")) return;
    try {
      await invoke("delete_label", { id });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateWorkflow = async () => {
    if (!newWorkflowName.trim()) return;
    try {
      await invoke("create_workflow_status", {
        projectId: project.id,
        name: newWorkflowName.trim(),
        category: newWorkflowCategory,
        position: workflows.length,
        wipLimit: newWorkflowWipLimit === "" ? null : Number(newWorkflowWipLimit)
      });
      setNewWorkflowName("");
      setNewWorkflowWipLimit("");
      setShowWorkflowForm(false);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteWorkflow = async (id: number) => {
    if (!window.confirm("Delete this status? Issues in this status may become orphaned.")) return;
    try {
      await invoke("delete_workflow_status", { id });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateAutomation = async () => {
    if (!newAutoName.trim()) return;
    try {
      const conditionsJson = JSON.stringify({ status: newAutoCondition });
      const actionsJson = JSON.stringify([{ type: newAutoAction, value: newAutoActionValue }]);

      await invoke("create_automation_rule", {
        projectId: project.id,
        name: newAutoName.trim(),
        triggerType: newAutoTrigger,
        conditionsJson,
        actionsJson
      });
      setNewAutoName("");
      setNewAutoActionValue("");
      setShowAutomationForm(false);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAutomation = async (id: number) => {
    if (!window.confirm("Delete this automation rule?")) return;
    try {
      await invoke("delete_automation_rule", { id });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateCustomField = async () => {
    if (!newCustomFieldName.trim()) return;
    try {
      await invoke("create_custom_field", {
        projectId: project.id,
        name: newCustomFieldName.trim(),
        fieldType: newCustomFieldType
      });
      setNewCustomFieldName("");
      setNewCustomFieldType("Text");
      setShowCustomFieldForm(false);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCustomField = async (id: number) => {
    if (!window.confirm("Delete this custom field?")) return;
    try {
      await invoke("delete_custom_field", { id });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-3xl h-full overflow-y-auto custom-scrollbar animate-fadeIn pb-12">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-white tracking-tight">Project Settings</h2>
        <p className="text-sm text-white/60">Manage your workspace configuration, labels, workflows, automations, and fields.</p>
      </div>

      <div className="flex gap-4 border-b border-neutral-800 pb-px">
        {[
          { id: "general", label: "General", icon: Settings2 },
          { id: "members", label: "Members", icon: Users },
          { id: "workflows", label: "Workflows", icon: GitMerge },
          { id: "automations", label: "Automations", icon: Bot },
          { id: "customFields", label: "Custom Fields", icon: Database },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === t.id
                ? "border-yellow-400 text-yellow-400"
                : "border-transparent text-white/50 hover:text-white/80"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {syncError && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Cloud sync needs attention: {syncError}
        </div>
      )}

      {activeTab === "general" && (
        <div className="flex flex-col gap-8 animate-fadeIn">
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

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Project Type</label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value as "Scrum" | "Kanban")}
                  className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/60 transition-colors"
                >
                  <option value="Scrum">Scrum</option>
                  <option value="Kanban">Kanban</option>
                </select>
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
      )}

      {activeTab === "members" && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Project Members
                </h3>
                <p className="text-xs text-white/40 mt-1">
                  Projects can include multiple users with Owner or Editor access.
                </p>
              </div>
              {!project.supabase_project_id && (
                <button
                  onClick={handleLinkSupabase}
                  disabled={syncing}
                  className="dd-btn-primary"
                >
                  {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                  Connect Workspace
                </button>
              )}
            </div>

            {project.supabase_project_id ? (
              <>
                <form onSubmit={handleInviteMember} className="mt-6 grid grid-cols-1 gap-3 rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 sm:grid-cols-[1fr_160px_auto]">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(event) => setInviteEmail(event.target.value)}
                      placeholder="teammate@example.com"
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2.5 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-yellow-400/60"
                      required
                    />
                  </div>
                  <select
                    value={inviteRole}
                    onChange={(event) => setInviteRole(event.target.value as ProjectMember["role"])}
                    className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-yellow-400/60"
                  >
                    <option value="Editor">Full access</option>
                  </select>
                  <button type="submit" disabled={inviting} className="dd-btn-primary">
                    {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Invite
                  </button>
                </form>

                <div className="mt-6 space-y-2">
                  {members.length === 0 ? (
                    <p className="text-center text-sm text-white/40 py-6">No members loaded yet.</p>
                  ) : members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between gap-4 rounded-xl border border-neutral-800 bg-neutral-950/50 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {member.display_name || member.email || member.invited_email || "Pending member"}
                        </p>
                        <p className="text-xs text-white/40">
                          {member.email || member.invited_email || "No email"} - {member.status}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1 text-xs font-bold text-white/60">
                          {member.role}
                        </span>
                        {member.role !== "Owner" && (
                          <button
                            onClick={() => handleRemoveMember(member)}
                            className="rounded-lg p-2 text-white/35 transition-colors hover:bg-red-500/10 hover:text-red-300"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="mt-6 rounded-xl border border-dashed border-neutral-800 bg-neutral-950/40 p-6 text-sm leading-relaxed text-white/50">
                Connect this project to invite teammates and make it available across signed-in DawnDesk installs.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "workflows" && (
        <div className="flex flex-col gap-8 animate-fadeIn">
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50 flex items-center gap-2">Workflow Statuses</h3>
                <p className="text-xs text-white/40 mt-1">Manage the statuses that issues can move through.</p>
              </div>
              <button
                onClick={() => setShowWorkflowForm(!showWorkflowForm)}
                className="flex items-center gap-2 rounded-lg bg-neutral-950 border border-neutral-800 px-4 py-2 text-xs font-bold text-white/70 hover:text-white hover:border-yellow-400/40 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> New Status
              </button>
            </div>

            {showWorkflowForm && (
              <div className="mb-6 p-4 rounded-xl border border-neutral-800 bg-neutral-950/60 flex flex-col gap-4 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Status Name</label>
                    <input
                      type="text"
                      value={newWorkflowName}
                      onChange={e => setNewWorkflowName(e.target.value)}
                      placeholder="e.g. In QA, Blocked"
                      className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-white placeholder-white/35 outline-none focus:border-yellow-400/60"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Category</label>
                    <select
                      value={newWorkflowCategory}
                      onChange={e => setNewWorkflowCategory(e.target.value)}
                      className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/60"
                    >
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="In Review">In Review</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-white/50">WIP Limit (Optional)</label>
                  <input
                    type="number"
                    min="1"
                    value={newWorkflowWipLimit}
                    onChange={e => setNewWorkflowWipLimit(e.target.value ? Number(e.target.value) : "")}
                    placeholder="Leave empty for no limit"
                    className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-white placeholder-white/35 outline-none focus:border-yellow-400/60"
                  />
                </div>

                <div className="flex gap-3 justify-end mt-2">
                  <button type="button" onClick={() => setShowWorkflowForm(false)} className="px-4 py-2 rounded-lg border border-neutral-800 text-xs font-semibold text-white/60 hover:text-white">Cancel</button>
                  <button type="button" onClick={handleCreateWorkflow} className="px-4 py-2 rounded-lg bg-yellow-400 text-black text-xs font-bold hover:bg-yellow-300">Create Status</button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {workflows.length === 0 ? (
                <p className="text-sm text-white/40 text-center py-6">No custom statuses created yet.</p>
              ) : workflows.map(wf => (
                <div key={wf.id} className="flex items-center justify-between px-4 py-3 rounded-lg border border-neutral-800 bg-neutral-950/40 group hover:border-neutral-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-white">{wf.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-white/50">{wf.category}</span>
                    {wf.wip_limit && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">WIP: {wf.wip_limit}</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteWorkflow(wf.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "automations" && (
        <div className="flex flex-col gap-8 animate-fadeIn">
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50 flex items-center gap-2">Automation Rules</h3>
                <p className="text-xs text-white/40 mt-1">Automate tasks based on triggers and conditions.</p>
              </div>
              <button
                onClick={() => setShowAutomationForm(!showAutomationForm)}
                className="flex items-center gap-2 rounded-lg bg-neutral-950 border border-neutral-800 px-4 py-2 text-xs font-bold text-white/70 hover:text-white hover:border-yellow-400/40 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> New Rule
              </button>
            </div>

            {showAutomationForm && (
              <div className="mb-6 p-4 rounded-xl border border-neutral-800 bg-neutral-950/60 flex flex-col gap-6 animate-fadeIn">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Rule Name</label>
                  <input
                    type="text"
                    value={newAutoName}
                    onChange={e => setNewAutoName(e.target.value)}
                    placeholder="e.g. Set High Priority on Bug Status"
                    className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-white placeholder-white/35 outline-none focus:border-yellow-400/60"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-neutral-900/40 p-4 rounded-lg border border-neutral-800/50">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Trigger Type</label>
                    <select
                      value={newAutoTrigger}
                      onChange={e => setNewAutoTrigger(e.target.value)}
                      className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/60"
                    >
                      <option value="Status Changed">Status Changed</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Condition (Status is)</label>
                    <select
                      value={newAutoCondition}
                      onChange={e => setNewAutoCondition(e.target.value)}
                      className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/60"
                    >
                      {workflows.map(wf => (
                        <option key={wf.id} value={wf.name}>{wf.name}</option>
                      ))}
                      {workflows.length === 0 && <option value="" disabled>No statuses available</option>}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-neutral-900/40 p-4 rounded-lg border border-neutral-800/50">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Action Type</label>
                    <select
                      value={newAutoAction}
                      onChange={e => setNewAutoAction(e.target.value)}
                      className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/60"
                    >
                      <option value="Set Priority">Set Priority</option>
                      <option value="Add Label">Add Label</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Action Value</label>
                    <input
                      type="text"
                      value={newAutoActionValue}
                      onChange={e => setNewAutoActionValue(e.target.value)}
                      placeholder={newAutoAction === "Set Priority" ? "e.g. High" : "e.g. Bug"}
                      className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-white placeholder-white/35 outline-none focus:border-yellow-400/60"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setShowAutomationForm(false)} className="px-4 py-2 rounded-lg border border-neutral-800 text-xs font-semibold text-white/60 hover:text-white">Cancel</button>
                  <button type="button" onClick={handleCreateAutomation} className="px-4 py-2 rounded-lg bg-yellow-400 text-black text-xs font-bold hover:bg-yellow-300">Create Rule</button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {automations.length === 0 ? (
                <p className="text-sm text-white/40 text-center py-6">No automation rules created yet.</p>
              ) : automations.map(auto => {
                let parsedConditions, parsedActions;
                try { parsedConditions = JSON.parse(auto.conditions_json); } catch(e) {}
                try { parsedActions = JSON.parse(auto.actions_json); } catch(e) {}

                return (
                  <div key={auto.id} className="flex flex-col gap-2 px-4 py-3 rounded-lg border border-neutral-800 bg-neutral-950/40 group hover:border-neutral-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-white">{auto.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-white/50">{auto.trigger_type}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteAutomation(auto.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {(parsedConditions || parsedActions) && (
                      <div className="flex items-center gap-2 text-xs text-white/40 mt-1">
                        {parsedConditions?.status && <span>If status is <strong>{parsedConditions.status}</strong>, </span>}
                        {parsedActions?.[0] && <span>then {parsedActions[0].type}: <strong>{parsedActions[0].value}</strong></span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === "customFields" && (
        <div className="flex flex-col gap-8 animate-fadeIn">
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50 flex items-center gap-2">Custom Fields</h3>
                <p className="text-xs text-white/40 mt-1">Define additional data fields for issues in this project.</p>
              </div>
              <button
                onClick={() => setShowCustomFieldForm(!showCustomFieldForm)}
                className="flex items-center gap-2 rounded-lg bg-neutral-950 border border-neutral-800 px-4 py-2 text-xs font-bold text-white/70 hover:text-white hover:border-yellow-400/40 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> New Field
              </button>
            </div>

            {showCustomFieldForm && (
              <div className="mb-6 p-4 rounded-xl border border-neutral-800 bg-neutral-950/60 flex flex-col gap-4 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Field Name</label>
                    <input
                      type="text"
                      value={newCustomFieldName}
                      onChange={e => setNewCustomFieldName(e.target.value)}
                      placeholder="e.g. Budget, Launch Date"
                      className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-white placeholder-white/35 outline-none focus:border-yellow-400/60"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Field Type</label>
                    <select
                      value={newCustomFieldType}
                      onChange={e => setNewCustomFieldType(e.target.value)}
                      className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/60"
                    >
                      <option value="Text">Text</option>
                      <option value="Number">Number</option>
                      <option value="Date">Date</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 justify-end mt-2">
                  <button type="button" onClick={() => setShowCustomFieldForm(false)} className="px-4 py-2 rounded-lg border border-neutral-800 text-xs font-semibold text-white/60 hover:text-white">Cancel</button>
                  <button type="button" onClick={handleCreateCustomField} className="px-4 py-2 rounded-lg bg-yellow-400 text-black text-xs font-bold hover:bg-yellow-300">Create Field</button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {customFields.length === 0 ? (
                <p className="text-sm text-white/40 text-center py-6">No custom fields created yet.</p>
              ) : customFields.map(field => (
                <div key={field.id} className="flex items-center justify-between px-4 py-3 rounded-lg border border-neutral-800 bg-neutral-950/40 group hover:border-neutral-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-white">{field.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-white/50">{field.field_type}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteCustomField(field.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
