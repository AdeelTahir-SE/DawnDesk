export interface LocalProject {
  id: number;
  name: string;
  key: string;
  description: string | null;
  color_tag: string;
  created_at: string;
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
