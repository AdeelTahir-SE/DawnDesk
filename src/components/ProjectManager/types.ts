export interface LocalProject {
  id: string;
  name: string;
  key: string;
  description: string | null;
  color_tag: string;
  created_at: string;
  project_type: string | null;
  supabase_project_id?: string | null;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string | null;
  invited_email: string | null;
  role: "Owner" | "Editor" | "Viewer";
  status: "active" | "pending";
  created_at: string;
  display_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
}

export interface ProjectSectionComment {
  id: string;
  project_id: string;
  sub_app: "project" | "finance";
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
}

export interface LocalSprint {
  id: string;
  project_id: string;
  name: string;
  status: string; // 'planned', 'active', 'closed'
  start_date: string | null;
  end_date: string | null;
}

export interface LocalIssue {
  id: string;
  project_id: string;
  sprint_id: string | null;
  parent_id: string | null;
  issue_type: string; // 'Epic', 'Story', 'Task', 'Bug', 'Subtask'
  key: string; // e.g. PROJ-1
  title: string;
  description: string | null;
  status: string; // 'To Do', 'In Progress', 'In Review', 'Done'
  priority: string; // 'Lowest', 'Low', 'Medium', 'High', 'Highest'
  story_points: number | null;
  time_spent_minutes: number;
  original_estimate_minutes: number | null;
  rank: number;
  pinned: boolean;
  archived?: boolean;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface LocalComment {
  id: string;
  issue_id: string;
  content: string;
  created_at: string;
}

export interface LocalVersion {
  id: string;
  project_id: string;
  name: string;
  release_date: string | null;
  released: boolean;
}

export interface LocalIssueHistory {
  id: string;
  issue_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export interface LocalWorkflowStatus {
  id: string;
  project_id: string;
  name: string;
  category: string;
  position: number;
  wip_limit: number | null;
}

export interface LocalSavedFilter {
  id: string;
  project_id: string;
  name: string;
  jql_query: string;
}

export interface LocalLabel {
  id: string;
  project_id: string;
  name: string;
  color: string;
}

export interface LocalStrategy {
  id: string;
  project_id: string;
  name: string;
  category: string;
  markdown: string;
  created_at: string;
  updated_at: string;
}

export interface LocalIssueLink {
  id: string;
  link_type: string; // e.g. 'Blocks', 'Duplicates', 'Relates To'
  source_issue_id: string;
  target_issue_id: string;
}

export interface LocalWorklog {
  id: string;
  issue_id: string;
  minutes: number;
  description: string | null;
  created_at: string;
}

export interface LocalAutomationRule {
  id: string;
  project_id: string;
  name: string;
  trigger_type: string;
  conditions_json: string;
  actions_json: string;
  is_active: boolean;
}

export interface LocalCustomField {
  id: string;
  project_id: string;
  name: string;
  field_type: string;
}

export interface LocalCustomFieldValue {
  issue_id: string;
  field_id: string;
  value: string;
}

export interface LocalAttachment {
  id: string;
  issue_id: string;
  file_name: string;
  local_path: string;
  created_at: string;
}
