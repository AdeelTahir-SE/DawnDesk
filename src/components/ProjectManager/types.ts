export interface LocalProject {
  id: number;
  name: string;
  key: string;
  description: string | null;
  color_tag: string;
  created_at: string;
  project_type: string | null;
}

export interface LocalSprint {
  id: number;
  project_id: number;
  name: string;
  status: string; // 'planned', 'active', 'closed'
  start_date: string | null;
  end_date: string | null;
}

export interface LocalIssue {
  id: number;
  project_id: number;
  sprint_id: number | null;
  parent_id: number | null;
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
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface LocalComment {
  id: number;
  issue_id: number;
  content: string;
  created_at: string;
}

export interface LocalVersion {
  id: number;
  project_id: number;
  name: string;
  release_date: string | null;
  released: boolean;
}

export interface LocalIssueHistory {
  id: number;
  issue_id: number;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export interface LocalWorkflowStatus {
  id: number;
  project_id: number;
  name: string;
  category: string;
  position: number;
  wip_limit: number | null;
}

export interface LocalSavedFilter {
  id: number;
  project_id: number;
  name: string;
  jql_query: string;
}

export interface LocalLabel {
  id: number;
  project_id: number;
  name: string;
  color: string;
}

export interface LocalIssueLink {
  id: number;
  link_type: string; // e.g. 'Blocks', 'Duplicates', 'Relates To'
  source_issue_id: number;
  target_issue_id: number;
}

export interface LocalWorklog {
  id: number;
  issue_id: number;
  minutes: number;
  description: string | null;
  created_at: string;
}

export interface LocalAutomationRule {
  id: number;
  project_id: number;
  name: string;
  trigger_type: string;
  conditions_json: string;
  actions_json: string;
  is_active: boolean;
}

export interface LocalCustomField {
  id: number;
  project_id: number;
  name: string;
  field_type: string;
}

export interface LocalCustomFieldValue {
  issue_id: number;
  field_id: number;
  value: string;
}

export interface LocalAttachment {
  id: number;
  issue_id: number;
  file_name: string;
  local_path: string;
  created_at: string;
}
