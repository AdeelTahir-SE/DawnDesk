import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "./supabaseClient";
import { emitConnectionError } from "./connectionErrors";
import type {
  LocalIssue,
  LocalProject,
  LocalSprint,
  LocalStrategy,
  LocalVersion,
  LocalWorkflowStatus,
  ProjectMember,
  ProjectSectionComment,
} from "../components/ProjectManager/types";

export type SupabaseErrorLike = {
  message?: string;
  details?: string | null;
  hint?: string | null;
  code?: string;
};

export type SupabaseProject = {
  id: string;
  name: string;
  key: string;
  description: string | null;
  color_tag: string;
  project_type: string | null;
  owner_id: string;
  created_at: string;
  updated_at?: string;
};

export type SupabaseProjectDraft = {
  name: string;
  key: string;
  description: string | null;
  color_tag: string;
  project_type: string | null;
  created_at?: string;
};

export type FinanceWorkspace = {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at?: string;
};

export type FinanceTableRow = Record<string, any> & {
  id: string;
  workspace_id?: string;
  created_at?: string;
  updated_at?: string;
};

export type FinanceMember = {
  id: string;
  workspace_id: string;
  user_id: string | null;
  invited_email: string | null;
  role: "Owner" | "Accountant" | "Viewer";
  status: "active" | "pending";
  created_at: string;
  display_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
};

export type WorkspaceInviteAlert = {
  invite_id: string;
  invite_type: "project" | "finance";
  resource_id: string;
  resource_name: string;
  role: string;
  invited_email: string;
  created_at: string;
};

export type WorkspaceNotificationAlert = {
  id: string;
  alert_type: "mention" | "invite_declined";
  resource_type: "project" | "finance";
  resource_id: string;
  resource_name: string;
  section: string | null;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
};

export type FinanceSectionComment = {
  id: string;
  finance_workspace_id: string;
  sub_app: "finance";
  comment_section: string;
  parent_id: string | null;
  actual_comment: string;
  author_id: string;
  mentioned_user_ids: string[];
  created_at: string;
  updated_at: string;
  author_display_name?: string | null;
  author_email?: string | null;
  author_avatar_url?: string | null;
};

export type PromptHubOutput = {
  model?: string;
  text?: string;
  imageUrl?: string;
};

export type PromptHubPrompt = {
  id: string;
  title: string;
  category: string;
  content: string;
  output_json: PromptHubOutput | null;
  model: string | null;
  author_id: string;
  created_at: string;
  updated_at: string;
  author_display_name?: string | null;
  author_email?: string | null;
  author_avatar_url?: string | null;
  saves_count?: number;
};

export type PromptHubPromptPage = {
  prompts: PromptHubPrompt[];
  hasMore: boolean;
};

function requireSupabase() {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error("Cloud sync is not configured.");
  }
  return supabase;
}

export function formatSupabaseError(error: unknown) {
  emitConnectionError(error, "supabase");

  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const supabaseError = error as SupabaseErrorLike;
    const parts = [
      supabaseError.message,
      supabaseError.details,
      supabaseError.hint,
      supabaseError.code ? `Code: ${supabaseError.code}` : null,
    ].filter(Boolean);

    if (parts.length > 0) return parts.join(" ");
  }
  return String(error);
}

function isMissingSupabaseRelation(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const supabaseError = error as SupabaseErrorLike;
  const message = `${supabaseError.message ?? ""} ${supabaseError.details ?? ""} ${supabaseError.code ?? ""}`.toLowerCase();
  return message.includes("pgrst205") || message.includes("could not find the table") || message.includes("schema cache");
}

export async function getCurrentUser(): Promise<User> {
  const client = requireSupabase();
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("No cloud account is signed in.");
  return data.user;
}

export async function ensureUserProfile(user?: User) {
  const client = requireSupabase();
  const currentUser = user ?? await getCurrentUser();
  const metadata = currentUser.user_metadata ?? {};
  const email = currentUser.email ?? null;
  const displayName =
    metadata.full_name ??
    metadata.name ??
    (email ? email.split("@")[0] : "DawnDesk User");

  const { error } = await client.from("profiles").upsert({
    id: currentUser.id,
    email,
    display_name: displayName,
    avatar_url: metadata.avatar_url ?? metadata.picture ?? null,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}

export async function listSupabaseProjects(): Promise<SupabaseProject[]> {
  const client = requireSupabase();
  const user = await getCurrentUser();
  await ensureUserProfile(user);

  const { data: memberships, error: membershipError } = await client
    .from("project_members")
    .select("project_id")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (membershipError) throw membershipError;
  const ids = [...new Set((memberships ?? []).map((row: any) => row.project_id).filter(Boolean))];
  if (ids.length === 0) return [];

  const { data, error } = await client
    .from("projects")
    .select("id,name,key,description,color_tag,project_type,owner_id,created_at,updated_at")
    .in("id", ids)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as SupabaseProject[];
}

export async function createSupabaseProject(project: SupabaseProjectDraft | LocalProject): Promise<SupabaseProject> {
  const client = requireSupabase();
  const user = await getCurrentUser();
  await ensureUserProfile(user);

  const { data, error } = await client
    .rpc("create_project_workspace", {
      project_name: project.name,
      project_key: project.key,
      project_description: project.description,
      project_color_tag: project.color_tag,
      project_type: project.project_type ?? "Scrum",
    });

  if (error) throw error;

  return data as SupabaseProject;
}

export async function updateSupabaseProject(project: LocalProject) {
  if (!project.supabase_project_id) return;
  const client = requireSupabase();
  const { error } = await client
    .from("projects")
    .update({
      name: project.name,
      key: project.key,
      description: project.description,
      color_tag: project.color_tag,
      project_type: project.project_type ?? "Scrum",
      updated_at: new Date().toISOString(),
    })
    .eq("id", project.supabase_project_id);

  if (error) throw error;
}

export async function deleteSupabaseProject(projectId: string) {
  const client = requireSupabase();
  const { error } = await client.from("projects").delete().eq("id", projectId);
  if (error) throw error;
}

export async function listProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("project_members")
    .select("id,project_id,user_id,invited_email,role,status,created_at,profiles:user_id(display_name,email,avatar_url)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    project_id: row.project_id,
    user_id: row.user_id,
    invited_email: row.invited_email,
    role: row.role,
    status: row.status,
    created_at: row.created_at,
    display_name: row.profiles?.display_name ?? null,
    email: row.profiles?.email ?? row.invited_email ?? null,
    avatar_url: row.profiles?.avatar_url ?? null,
  }));
}

export async function inviteProjectMember(projectId: string, email: string, role: ProjectMember["role"]) {
  const client = requireSupabase();
  const { error } = await client.from("project_members").insert({
    project_id: projectId,
    invited_email: email.trim().toLowerCase(),
    role,
    status: "pending",
  });
  if (error) throw error;
}

export async function removeProjectMember(memberId: string) {
  const client = requireSupabase();
  const { error } = await client.from("project_members").delete().eq("id", memberId);
  if (error) throw error;
}

export async function listProjectSectionComments(projectId: string, section: string): Promise<ProjectSectionComment[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("section_comments")
    .select("id,project_id,sub_app,comment_section,parent_id,actual_comment,author_id,mentioned_user_ids,created_at,updated_at,profiles:author_id(display_name,email,avatar_url)")
    .eq("sub_app", "project")
    .eq("project_id", projectId)
    .eq("comment_section", section)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    project_id: row.project_id,
    sub_app: row.sub_app,
    comment_section: row.comment_section,
    parent_id: row.parent_id,
    actual_comment: row.actual_comment,
    author_id: row.author_id,
    mentioned_user_ids: row.mentioned_user_ids ?? [],
    created_at: row.created_at,
    updated_at: row.updated_at,
    author_display_name: row.profiles?.display_name ?? null,
    author_email: row.profiles?.email ?? null,
    author_avatar_url: row.profiles?.avatar_url ?? null,
  }));
}

export async function createProjectSectionComment({
  projectId,
  section,
  actualComment,
  parentId = null,
  mentionedUserIds,
}: {
  projectId: string;
  section: string;
  actualComment: string;
  parentId?: string | null;
  mentionedUserIds: string[];
}) {
  const client = requireSupabase();
  const user = await getCurrentUser();
  await ensureUserProfile(user);

  const { error } = await client.from("section_comments").insert({
    project_id: projectId,
    sub_app: "project",
    comment_section: section,
    parent_id: parentId,
    actual_comment: actualComment,
    author_id: user.id,
    mentioned_user_ids: mentionedUserIds,
  });

  if (error) throw error;
}

export async function listProjectIssues(projectId: string): Promise<LocalIssue[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("project_issues")
    .select("id,project_id,sprint_id,parent_id,issue_type,key,title,description,status,priority,story_points,time_spent_minutes,original_estimate_minutes,rank,pinned,archived,due_date,created_at,updated_at")
    .eq("project_id", projectId)
    .order("rank", { ascending: true });

  if (error) throw error;
  return (data ?? []) as LocalIssue[];
}

export async function listProjectSprints(projectId: string): Promise<LocalSprint[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("project_sprints")
    .select("id,project_id,name,status,start_date,end_date")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as LocalSprint[];
}

export async function createProjectSprint(input: {
  project_id: string;
  name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
}): Promise<LocalSprint> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("project_sprints")
    .insert(input)
    .select("id,project_id,name,status,start_date,end_date")
    .single();
  if (error) throw error;
  return data as LocalSprint;
}

export async function updateProjectSprint(input: {
  id: string;
  name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
}) {
  const client = requireSupabase();
  const { error } = await client
    .from("project_sprints")
    .update({
      name: input.name,
      status: input.status,
      start_date: input.start_date,
      end_date: input.end_date,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);
  if (error) throw error;
}

export async function listProjectWorkflowStatuses(projectId: string): Promise<LocalWorkflowStatus[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("project_workflow_statuses")
    .select("id,project_id,name,category,position,wip_limit")
    .eq("project_id", projectId)
    .order("position", { ascending: true });

  if (error) throw error;
  return (data ?? []) as LocalWorkflowStatus[];
}

export async function createProjectIssue(projectId: string, input: Partial<LocalIssue>) {
  const client = requireSupabase();
  const user = await getCurrentUser();
  const existingIssues = await listProjectIssues(projectId);
  const keyNumber = existingIssues.length + 1;
  const project = (await listSupabaseProjects()).find((item) => item.id === projectId);
  const issueKey = input.key ?? `${project?.key ?? "PROJ"}-${keyNumber}`;
  const now = new Date().toISOString();

  const { data, error } = await client
    .from("project_issues")
    .insert({
      project_id: projectId,
      sprint_id: input.sprint_id ?? null,
      parent_id: input.parent_id ?? null,
      issue_type: input.issue_type ?? "Task",
      key: issueKey,
      title: input.title ?? "Untitled issue",
      description: input.description ?? null,
      status: input.status ?? "To Do",
      priority: input.priority ?? "Medium",
      story_points: input.story_points ?? null,
      time_spent_minutes: input.time_spent_minutes ?? 0,
      original_estimate_minutes: input.original_estimate_minutes ?? null,
      rank: input.rank ?? Date.now(),
      pinned: input.pinned ?? false,
      archived: input.archived ?? false,
      due_date: input.due_date ?? null,
      created_by: user.id,
      created_at: now,
      updated_at: now,
    })
    .select("id,project_id,sprint_id,parent_id,issue_type,key,title,description,status,priority,story_points,time_spent_minutes,original_estimate_minutes,rank,pinned,archived,due_date,created_at,updated_at")
    .single();

  if (error) throw error;
  return data as LocalIssue;
}

export async function updateProjectIssue(input: Partial<LocalIssue> & { id: string }) {
  const client = requireSupabase();
  const { id, project_id: _projectId, created_at: _createdAt, key: _key, ...rest } = input;
  const { error } = await client
    .from("project_issues")
    .update({
      ...rest,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;
}

export async function deleteProjectIssue(id: string) {
  const client = requireSupabase();
  const { error } = await client.from("project_issues").delete().eq("id", id);
  if (error) throw error;
}

export async function listProjectVersions(projectId: string): Promise<LocalVersion[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("project_versions")
    .select("id,project_id,name,release_date,released")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as LocalVersion[];
}

export async function createProjectVersion(projectId: string, name: string, releaseDate: string | null): Promise<LocalVersion> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("project_versions")
    .insert({
      project_id: projectId,
      name,
      release_date: releaseDate,
      released: false,
    })
    .select("id,project_id,name,release_date,released")
    .single();
  if (error) throw error;
  return data as LocalVersion;
}

export async function deleteProjectVersion(id: string) {
  const client = requireSupabase();
  const { error } = await client.from("project_versions").delete().eq("id", id);
  if (error) throw error;
}

export async function listProjectStrategies(projectId: string): Promise<LocalStrategy[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("project_strategies")
    .select("id,project_id,name,category,markdown,created_at,updated_at")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as LocalStrategy[];
}

export async function saveProjectStrategy(projectId: string, input: {
  id: string | null;
  name: string;
  category: string;
  markdown: string;
}) {
  const client = requireSupabase();
  const user = await getCurrentUser();
  const now = new Date().toISOString();
  if (input.id) {
    const { error } = await client
      .from("project_strategies")
      .update({
        name: input.name,
        category: input.category,
        markdown: input.markdown,
        updated_at: now,
      })
      .eq("id", input.id);
    if (error) throw error;
    return;
  }

  const { error } = await client.from("project_strategies").insert({
    project_id: projectId,
    name: input.name,
    category: input.category,
    markdown: input.markdown,
    created_by: user.id,
    created_at: now,
    updated_at: now,
  });
  if (error) throw error;
}

export async function deleteProjectStrategy(id: string) {
  const client = requireSupabase();
  const { error } = await client.from("project_strategies").delete().eq("id", id);
  if (error) throw error;
}

export async function getOrCreateFinanceWorkspace(): Promise<FinanceWorkspace> {
  const client = requireSupabase();
  const user = await getCurrentUser();
  await ensureUserProfile(user);

  const { data: membership, error: membershipError } = await client
    .from("finance_workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (membershipError) throw membershipError;

  if (membership?.workspace_id) {
    const { data, error } = await client
      .from("finance_workspaces")
      .select("id,name,owner_id,created_at,updated_at")
      .eq("id", membership.workspace_id)
      .single();
    if (error) throw error;
    return data as FinanceWorkspace;
  }

  const now = new Date().toISOString();
  const { data: workspace, error: workspaceError } = await client
    .from("finance_workspaces")
    .insert({
      name: "Finance Workspace",
      owner_id: user.id,
      created_at: now,
      updated_at: now,
    })
    .select("id,name,owner_id,created_at,updated_at")
    .single();

  if (workspaceError) throw workspaceError;

  const { error: memberError } = await client.from("finance_workspace_members").insert({
    workspace_id: workspace.id,
    user_id: user.id,
    invited_email: user.email ?? null,
    role: "Owner",
    status: "active",
  });

  if (memberError) throw memberError;
  return workspace as FinanceWorkspace;
}

export async function listFinanceWorkspaces(): Promise<FinanceWorkspace[]> {
  const client = requireSupabase();
  const user = await getCurrentUser();
  await ensureUserProfile(user);

  const { data: memberships, error: membershipError } = await client
    .from("finance_workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (membershipError) throw membershipError;
  const ids = [...new Set((memberships ?? []).map((row: any) => row.workspace_id).filter(Boolean))];
  if (ids.length === 0) return [];

  const { data, error } = await client
    .from("finance_workspaces")
    .select("id,name,owner_id,created_at,updated_at")
    .in("id", ids)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as FinanceWorkspace[];
}

export async function createFinanceWorkspace(name: string): Promise<FinanceWorkspace> {
  const client = requireSupabase();
  const user = await getCurrentUser();
  await ensureUserProfile(user);

  const { data, error } = await client.rpc("create_finance_workspace", {
    workspace_name: name.trim(),
  });

  if (!error) return data as FinanceWorkspace;

  const missingFunction =
    error.code === "PGRST202" ||
    error.message?.toLowerCase().includes("could not find the function");

  if (!missingFunction) throw error;

  const now = new Date().toISOString();
  const { data: workspace, error: workspaceError } = await client
    .from("finance_workspaces")
    .insert({
      name: name.trim() || "Finance Workspace",
      owner_id: user.id,
      created_at: now,
      updated_at: now,
    })
    .select("id,name,owner_id,created_at,updated_at")
    .single();

  if (workspaceError) throw workspaceError;

  const { error: memberError } = await client.from("finance_workspace_members").insert({
    workspace_id: workspace.id,
    user_id: user.id,
    invited_email: user.email ?? null,
    role: "Owner",
    status: "active",
  });

  if (memberError) throw memberError;
  return workspace as FinanceWorkspace;
}

export const FINANCE_EXPORT_TABLES = [
  "finance_accounts",
  "finance_transactions",
  "finance_budgets",
  "finance_goals",
  "finance_subscriptions",
  "finance_debts",
  "finance_invoices",
  "finance_chart_of_accounts",
  "finance_journal_entries",
  "finance_vendor_bills",
  "finance_fixed_assets",
  "finance_purchase_orders",
  "finance_inventory_items",
  "finance_tax_codes",
  "finance_audit_logs",
  "finance_compliance_roles",
  "finance_period_closes",
  "finance_exchange_rates",
  "finance_ar_recurring_billing",
  "finance_ar_dunning_campaigns",
  "finance_ar_revrec_schedules",
] as const;

const FINANCE_TABLES = new Set<string>(FINANCE_EXPORT_TABLES);

function assertFinanceTable(tableName: string) {
  if (!FINANCE_TABLES.has(tableName)) {
    throw new Error(`Unsupported finance table: ${tableName}`);
  }
}

export async function listFinanceRows(tableName: string, workspaceId: string): Promise<FinanceTableRow[]> {
  assertFinanceTable(tableName);
  const client = requireSupabase();
  const orderColumn = tableName === "finance_audit_logs" ? "timestamp" : "created_at";
  const { data, error } = await client
    .from(tableName)
    .select("*")
    .eq("workspace_id", workspaceId)
    .order(orderColumn, { ascending: false });

  if (error) throw new Error(formatSupabaseError(error));
  return (data ?? []) as FinanceTableRow[];
}

export async function createFinanceRow(tableName: string, workspaceId: string, payload: Record<string, any>) {
  assertFinanceTable(tableName);
  const client = requireSupabase();
  const { error } = await client.from(tableName).insert({
    ...payload,
    workspace_id: workspaceId,
  });
  if (error) throw new Error(formatSupabaseError(error));
}

export async function deleteFinanceRow(tableName: string, id: string) {
  assertFinanceTable(tableName);
  const client = requireSupabase();
  const { error } = await client.from(tableName).delete().eq("id", id);
  if (error) throw new Error(formatSupabaseError(error));
}

export async function getFinancePreference<T>(workspaceId: string, key: string, fallback: T): Promise<T> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("finance_workspace_preferences")
    .select("value_json")
    .eq("workspace_id", workspaceId)
    .eq("preference_key", key)
    .maybeSingle();

  if (error) throw new Error(formatSupabaseError(error));
  return (data?.value_json ?? fallback) as T;
}

export async function saveFinancePreference(workspaceId: string, key: string, value: unknown) {
  const client = requireSupabase();
  const now = new Date().toISOString();
  const { error } = await client
    .from("finance_workspace_preferences")
    .upsert({
      workspace_id: workspaceId,
      preference_key: key,
      value_json: value,
      updated_at: now,
    }, { onConflict: "workspace_id,preference_key" });

  if (error) throw new Error(formatSupabaseError(error));
}

export async function listFinanceMembers(workspaceId: string): Promise<FinanceMember[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("finance_workspace_members")
    .select("id,workspace_id,user_id,invited_email,role,status,created_at,profiles:user_id(display_name,email,avatar_url)")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    workspace_id: row.workspace_id,
    user_id: row.user_id,
    invited_email: row.invited_email,
    role: row.role,
    status: row.status,
    created_at: row.created_at,
    display_name: row.profiles?.display_name ?? null,
    email: row.profiles?.email ?? row.invited_email ?? null,
    avatar_url: row.profiles?.avatar_url ?? null,
  }));
}

export async function inviteFinanceMember(workspaceId: string, email: string, role: FinanceMember["role"]) {
  const client = requireSupabase();
  const { error } = await client.from("finance_workspace_members").insert({
    workspace_id: workspaceId,
    invited_email: email.trim().toLowerCase(),
    role,
    status: "pending",
  });
  if (error) throw error;
}

export async function removeFinanceMember(memberId: string) {
  const client = requireSupabase();
  const { error } = await client.from("finance_workspace_members").delete().eq("id", memberId);
  if (error) throw error;
}

export async function listPendingWorkspaceInvites(): Promise<WorkspaceInviteAlert[]> {
  const client = requireSupabase();
  const user = await getCurrentUser();
  await ensureUserProfile(user);

  const { data, error } = await client.rpc("list_pending_workspace_invites");
  if (error) throw error;
  return (data ?? []) as WorkspaceInviteAlert[];
}

export async function acceptWorkspaceInvite(invite: Pick<WorkspaceInviteAlert, "invite_id" | "invite_type">) {
  const client = requireSupabase();
  const user = await getCurrentUser();
  await ensureUserProfile(user);

  const { error } = await client.rpc("accept_workspace_invite", {
    invite_kind: invite.invite_type,
    target_invite_id: invite.invite_id,
  });
  if (error) throw error;
}

export async function declineWorkspaceInvite(invite: Pick<WorkspaceInviteAlert, "invite_id" | "invite_type">) {
  const client = requireSupabase();
  const user = await getCurrentUser();
  await ensureUserProfile(user);

  const { error } = await client.rpc("decline_workspace_invite", {
    invite_kind: invite.invite_type,
    target_invite_id: invite.invite_id,
  });
  if (error) throw error;
}

export async function listWorkspaceNotifications(): Promise<WorkspaceNotificationAlert[]> {
  const client = requireSupabase();
  const user = await getCurrentUser();
  await ensureUserProfile(user);

  const { data, error } = await client.rpc("list_workspace_notifications");
  if (error) throw error;
  return (data ?? []) as WorkspaceNotificationAlert[];
}

export async function markWorkspaceNotificationRead(notificationId: string) {
  const client = requireSupabase();
  const { error } = await client.rpc("mark_workspace_notification_read", {
    notification_id: notificationId,
  });
  if (error) throw error;
}

export async function listFinanceSectionComments(workspaceId: string, section: string): Promise<FinanceSectionComment[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("section_comments")
    .select("id,finance_workspace_id,sub_app,comment_section,parent_id,actual_comment,author_id,mentioned_user_ids,created_at,updated_at,profiles:author_id(display_name,email,avatar_url)")
    .eq("sub_app", "finance")
    .eq("finance_workspace_id", workspaceId)
    .eq("comment_section", section)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    finance_workspace_id: row.finance_workspace_id,
    sub_app: row.sub_app,
    comment_section: row.comment_section,
    parent_id: row.parent_id,
    actual_comment: row.actual_comment,
    author_id: row.author_id,
    mentioned_user_ids: row.mentioned_user_ids ?? [],
    created_at: row.created_at,
    updated_at: row.updated_at,
    author_display_name: row.profiles?.display_name ?? null,
    author_email: row.profiles?.email ?? null,
    author_avatar_url: row.profiles?.avatar_url ?? null,
  }));
}

export async function createFinanceSectionComment({
  workspaceId,
  section,
  actualComment,
  parentId = null,
  mentionedUserIds,
}: {
  workspaceId: string;
  section: string;
  actualComment: string;
  parentId?: string | null;
  mentionedUserIds: string[];
}) {
  const client = requireSupabase();
  const user = await getCurrentUser();
  await ensureUserProfile(user);

  const { error } = await client.from("section_comments").insert({
    finance_workspace_id: workspaceId,
    sub_app: "finance",
    comment_section: section,
    parent_id: parentId,
    actual_comment: actualComment,
    author_id: user.id,
    mentioned_user_ids: mentionedUserIds,
  });

  if (error) throw error;
}

export async function listPromptHubPrompts(): Promise<PromptHubPrompt[]> {
  const page = await listPromptHubPromptsPage();
  return page.prompts;
}

export async function listPromptHubPromptsPage({
  page = 0,
  pageSize = 24,
}: {
  page?: number;
  pageSize?: number;
} = {}): Promise<PromptHubPromptPage> {
  const client = requireSupabase();
  const from = page * pageSize;
  const to = from + pageSize - 1;
  const { data, error } = await client
    .from("prompt_hub_prompts")
    .select("id,title,category,content,output_json,model,author_id,created_at,updated_at,profiles:author_id(display_name,email,avatar_url)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw new Error(formatSupabaseError(error));

  const promptIds = (data ?? []).map((row: any) => row.id).filter(Boolean);
  const saveCounts = new Map<string, number>();

  if (promptIds.length > 0) {
    const { data: savesData, error: savesError } = await client
      .from("prompt_hub_saves")
      .select("prompt_id")
      .in("prompt_id", promptIds);

    if (savesError) {
      if (!isMissingSupabaseRelation(savesError)) {
        throw new Error(formatSupabaseError(savesError));
      }
    } else {
      for (const save of savesData ?? []) {
        const promptId = (save as any).prompt_id;
        saveCounts.set(promptId, (saveCounts.get(promptId) ?? 0) + 1);
      }
    }
  }

  const prompts = (data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    content: row.content,
    output_json: row.output_json ?? null,
    model: row.model ?? null,
    author_id: row.author_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author_display_name: row.profiles?.display_name ?? null,
    author_email: row.profiles?.email ?? null,
    author_avatar_url: row.profiles?.avatar_url ?? null,
    saves_count: saveCounts.get(row.id) ?? 0,
  }));

  return {
    prompts,
    hasMore: prompts.length === pageSize,
  };
}

export async function publishPromptToHub(input: {
  title: string;
  category: string;
  content: string;
  output?: PromptHubOutput;
}) {
  const client = requireSupabase();
  const user = await getCurrentUser();
  await ensureUserProfile(user);

  const output = input.output ?? null;
  const { error } = await client.from("prompt_hub_prompts").insert({
    author_id: user.id,
    title: input.title,
    category: input.category,
    content: input.content,
    output_json: output,
    model: output?.model ?? null,
    updated_at: new Date().toISOString(),
  });

  if (error && !isMissingSupabaseRelation(error)) throw new Error(formatSupabaseError(error));
}

export async function recordPromptHubSave(promptId: string) {
  const client = requireSupabase();
  const user = await getCurrentUser();
  await ensureUserProfile(user);

  const { error } = await client.from("prompt_hub_saves").upsert(
    {
      prompt_id: promptId,
      user_id: user.id,
    },
    { onConflict: "prompt_id,user_id", ignoreDuplicates: true },
  );

  if (error) throw new Error(formatSupabaseError(error));
}

export async function deletePromptFromHub(promptId: string) {
  const client = requireSupabase();
  const { error } = await client.from("prompt_hub_prompts").delete().eq("id", promptId);
  if (error) throw new Error(formatSupabaseError(error));
}
