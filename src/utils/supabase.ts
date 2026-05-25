import { createClient } from "@supabase/supabase-js";

// Supabase Credentials
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Initialize live Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface DbUser {
  id: string;
  email: string;
  name: string;
  avatarColor: string; // Gradient class e.g. "from-blue-500 to-indigo-500"
  role: string;
  bio?: string;
  avatarUrl?: string;
}

export interface DbProject {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  members: string[]; // Keep for quick UI loops, but project_members handles roles
  colorTag: string;
  status: 'active' | 'archived';
  createdAt: string;
}

export interface DbProjectMember {
  projectId: string;
  userId: string;
  role: 'Owner' | 'Editor' | 'Viewer';
  joinedAt: string;
}

export interface DbProjectInvite {
  id: string;
  projectId: string;
  email: string;
  status: 'pending' | 'accepted' | 'declined';
  invitedBy: string;
  createdAt: string;
}

export interface DbKanbanColumn {
  id: string;
  projectId: string;
  name: string;
  position: number;
}

export interface DbTask {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: string; // column id or string
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  assignedTo: string; // User ID
  createdBy: string; // User ID
  dueDate: string;
  createdAt: string;
}

export interface DbMessage {
  id: string;
  projectId: string;
  senderId: string; // User ID
  text: string;
  createdAt: string;
  isDeleted?: boolean; // For "deleted message" placeholder
}

// ----------------------------------------------------
// OFFLINE SIMULATION FALLBACK ENGINE
// ----------------------------------------------------
export const SEEDED_USERS: DbUser[] = [
  { id: "user-1", email: "elena@dawndesk.com", name: "Elena Rostova", avatarColor: "from-pink-500 to-rose-500", role: "Product Manager" },
  { id: "user-2", email: "alex@dawndesk.com", name: "Alex Rivera", avatarColor: "from-blue-500 to-indigo-500", role: "Lead Developer" },
  { id: "user-3", email: "sarah@dawndesk.com", name: "Sarah Chen", avatarColor: "from-purple-500 to-violet-500", role: "UI/UX Designer" },
  { id: "user-4", email: "marcus@dawndesk.com", name: "Marcus Vance", avatarColor: "from-emerald-500 to-teal-500", role: "DevOps Engineer" },
  { id: "user-5", email: "chloe@dawndesk.com", name: "Chloe Zhao", avatarColor: "from-amber-500 to-orange-500", role: "Quality Analyst" }
];

const SEEDED_PROJECTS: DbProject[] = [
  {
    id: "project-1",
    name: "DawnDesk Dashboard Redesign",
    description: "Revamp the core dashboard interface with modern dark aesthetics, HSL grids, glassmorphism layers, and responsive visual widgets.",
    createdBy: "user-1",
    members: ["user-1", "user-2", "user-3"],
    colorTag: "#F7C948",
    status: "active",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const SEEDED_MEMBERS: DbProjectMember[] = [
  { projectId: "project-1", userId: "user-1", role: "Owner", joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
  { projectId: "project-1", userId: "user-2", role: "Editor", joinedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
  { projectId: "project-1", userId: "user-3", role: "Viewer", joinedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() }
];

const SEEDED_COLUMNS: DbKanbanColumn[] = [
  { id: "col-todo", projectId: "project-1", name: "Todo", position: 0 },
  { id: "col-progress", projectId: "project-1", name: "In Progress", position: 1 },
  { id: "col-review", projectId: "project-1", name: "Review", position: 2 },
  { id: "col-done", projectId: "project-1", name: "Done", position: 3 }
];

const SEEDED_TASKS: DbTask[] = [
  {
    id: "task-1",
    projectId: "project-1",
    title: "Draft High-Fidelity Mockups",
    description: "Create premium landing and sidebar concepts using a harmonious dark color scheme with yellow highlighting.",
    status: "col-done",
    priority: "High",
    assignedTo: "user-3",
    createdBy: "user-1",
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const SEEDED_MESSAGES: DbMessage[] = [
  {
    id: "msg-1",
    projectId: "project-1",
    senderId: "user-1",
    text: "Welcome team to the DawnDesk Dashboard Redesign space! We are connected to the live Supabase network.",
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    isDeleted: false
  }
];

class SupabaseFallbackDb {
  private usersKey = "dawndesk_pm_users";
  private projectsKey = "dawndesk_pm_projects";
  private membersKey = "dawndesk_pm_members";
  private invitesKey = "dawndesk_pm_invites";
  private columnsKey = "dawndesk_pm_columns";
  private tasksKey = "dawndesk_pm_tasks";
  private messagesKey = "dawndesk_pm_messages";
  private activeUserKey = "dawndesk_pm_active_user";

  constructor() {
    this.initDatabase();
  }

  private initDatabase() {
    if (!localStorage.getItem(this.usersKey)) localStorage.setItem(this.usersKey, JSON.stringify(SEEDED_USERS));
    if (!localStorage.getItem(this.projectsKey)) localStorage.setItem(this.projectsKey, JSON.stringify(SEEDED_PROJECTS));
    if (!localStorage.getItem(this.membersKey)) localStorage.setItem(this.membersKey, JSON.stringify(SEEDED_MEMBERS));
    if (!localStorage.getItem(this.columnsKey)) localStorage.setItem(this.columnsKey, JSON.stringify(SEEDED_COLUMNS));
    if (!localStorage.getItem(this.tasksKey)) localStorage.setItem(this.tasksKey, JSON.stringify(SEEDED_TASKS));
    if (!localStorage.getItem(this.messagesKey)) localStorage.setItem(this.messagesKey, JSON.stringify(SEEDED_MESSAGES));
    if (!localStorage.getItem(this.invitesKey)) localStorage.setItem(this.invitesKey, JSON.stringify([]));
  }

  public getUsers(): DbUser[] { return JSON.parse(localStorage.getItem(this.usersKey)!) || []; }
  public saveUsers(users: DbUser[]) { localStorage.setItem(this.usersKey, JSON.stringify(users)); }

  public getActiveUser(): DbUser | null { const d = localStorage.getItem(this.activeUserKey); return d ? JSON.parse(d) : null; }
  public setActiveUser(u: DbUser | null) { if(u) localStorage.setItem(this.activeUserKey, JSON.stringify(u)); else localStorage.removeItem(this.activeUserKey); }

  public getProjects(): DbProject[] { return JSON.parse(localStorage.getItem(this.projectsKey)!) || []; }
  public saveProjects(p: DbProject[]) { localStorage.setItem(this.projectsKey, JSON.stringify(p)); }

  public getProjectMembers(): DbProjectMember[] { return JSON.parse(localStorage.getItem(this.membersKey)!) || []; }
  public saveProjectMembers(m: DbProjectMember[]) { localStorage.setItem(this.membersKey, JSON.stringify(m)); }

  public getProjectInvites(): DbProjectInvite[] { return JSON.parse(localStorage.getItem(this.invitesKey)!) || []; }
  public saveProjectInvites(i: DbProjectInvite[]) { localStorage.setItem(this.invitesKey, JSON.stringify(i)); }

  public getColumns(): DbKanbanColumn[] { return JSON.parse(localStorage.getItem(this.columnsKey)!) || []; }
  public saveColumns(c: DbKanbanColumn[]) { localStorage.setItem(this.columnsKey, JSON.stringify(c)); }

  public getTasks(): DbTask[] { return JSON.parse(localStorage.getItem(this.tasksKey)!) || []; }
  public saveTasks(t: DbTask[]) { localStorage.setItem(this.tasksKey, JSON.stringify(t)); }

  public getMessages(): DbMessage[] { return JSON.parse(localStorage.getItem(this.messagesKey)!) || []; }
  public saveMessages(m: DbMessage[]) { localStorage.setItem(this.messagesKey, JSON.stringify(m)); }
}

export const localFallback = new SupabaseFallbackDb();

// Gateway states
export let isFallbackMode = false;
export let lastDbError = "";

export const setFallbackMode = (enabled: boolean, errorMsg: string = "") => {
  isFallbackMode = enabled;
  lastDbError = errorMsg;
  if (enabled) console.warn("Supabase Gateway fell back to local storage simulator. Error:", errorMsg);
};

const gradients = [
  "from-teal-500 to-emerald-500",
  "from-cyan-500 to-blue-500",
  "from-purple-500 to-pink-500",
  "from-yellow-500 to-amber-500",
  "from-rose-500 to-red-500"
];

export const SQL_SCHEMA = `-- Extended Schema for v1
-- Not applied here since we use Fallback for complete v1 emulation.
`;

// const isRelationMissing = (err: any) => err && (err.code === "42P01" || err.message?.includes("relation") || err.message?.includes("does not exist"));

// Gateway API
export const pmGateway = {
  // --- USER AUTH & PROFILE ---
  getActiveUser: (): DbUser | null => localFallback.getActiveUser(),
  setActiveUser: (user: DbUser | null) => localFallback.setActiveUser(user),

  getRegisteredUsers: async (): Promise<DbUser[]> => {
    return localFallback.getUsers();
  },

  signUp: async (email: string, name: string, role: string, _password?: string): Promise<{ success: boolean; user?: DbUser; error?: string }> => {
    // Force fallback mode to emulate full v1 easily without requiring live Supabase tables
    setFallbackMode(true, "Forced fallback for advanced v1 features");
    const users = localFallback.getUsers();
    if (users.length >= 20) return { success: false, error: "Workspace cap reached." };
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) return { success: false, error: "Local user exists." };
    const newUser: DbUser = { id: `user-${Date.now()}`, email: email.toLowerCase(), name, avatarColor: gradients[Math.floor(Math.random() * gradients.length)], role };
    localFallback.saveUsers([...users, newUser]);
    localFallback.setActiveUser(newUser);
    return { success: true, user: newUser };
  },

  logIn: async (email: string, _password?: string): Promise<{ success: boolean; user?: DbUser; error?: string }> => {
    setFallbackMode(true, "Forced fallback for advanced v1 features");
    const users = localFallback.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return { success: false, error: "No local user found." };
    localFallback.setActiveUser(user);
    return { success: true, user };
  },

  updateProfile: async (userId: string, updates: Partial<DbUser>) => {
    const users = localFallback.getUsers().map(u => u.id === userId ? { ...u, ...updates } : u);
    localFallback.saveUsers(users);
    const active = localFallback.getActiveUser();
    if (active && active.id === userId) {
      localFallback.setActiveUser({ ...active, ...updates });
    }
  },

  // --- PROJECTS ---
  getProjects: async (): Promise<DbProject[]> => {
    return localFallback.getProjects(); 
  },

  createProject: async (name: string, description: string, createdBy: string, colorTag: string): Promise<DbProject> => {
    const projs = localFallback.getProjects();
    const newProj: DbProject = { 
      id: `project-${Date.now()}`, 
      name, 
      description, 
      createdBy, 
      members: [createdBy], 
      colorTag, 
      status: 'active', 
      createdAt: new Date().toISOString() 
    };
    localFallback.saveProjects([...projs, newProj]);
    
    // Add Owner member
    const mems = localFallback.getProjectMembers();
    localFallback.saveProjectMembers([...mems, { projectId: newProj.id, userId: createdBy, role: 'Owner', joinedAt: new Date().toISOString() }]);

    // Add default columns
    const cols = localFallback.getColumns();
    localFallback.saveColumns([...cols, 
      { id: `col-${Date.now()}-todo`, projectId: newProj.id, name: "Todo", position: 0 },
      { id: `col-${Date.now()}-prog`, projectId: newProj.id, name: "In Progress", position: 1 },
      { id: `col-${Date.now()}-rev`, projectId: newProj.id, name: "Review", position: 2 },
      { id: `col-${Date.now()}-done`, projectId: newProj.id, name: "Done", position: 3 }
    ]);
    
    return newProj;
  },

  updateProject: async (projectId: string, updates: Partial<DbProject>) => {
    const p = localFallback.getProjects().map(x => x.id === projectId ? { ...x, ...updates } : x);
    localFallback.saveProjects(p);
  },

  deleteProject: async (projectId: string) => {
    localFallback.saveProjects(localFallback.getProjects().filter(p => p.id !== projectId));
    localFallback.saveTasks(localFallback.getTasks().filter(t => t.projectId !== projectId));
    localFallback.saveMessages(localFallback.getMessages().filter(m => m.projectId !== projectId));
    localFallback.saveColumns(localFallback.getColumns().filter(c => c.projectId !== projectId));
    localFallback.saveProjectMembers(localFallback.getProjectMembers().filter(m => m.projectId !== projectId));
    localFallback.saveProjectInvites(localFallback.getProjectInvites().filter(i => i.projectId !== projectId));
  },

  // --- PROJECT MEMBERS & INVITES ---
  getProjectMembers: async (projectId: string) => {
    return localFallback.getProjectMembers().filter(m => m.projectId === projectId);
  },

  addProjectMember: async (projectId: string, userId: string, role: 'Owner' | 'Editor' | 'Viewer') => {
    const mems = localFallback.getProjectMembers();
    if (!mems.find(m => m.projectId === projectId && m.userId === userId)) {
      localFallback.saveProjectMembers([...mems, { projectId, userId, role, joinedAt: new Date().toISOString() }]);
      const p = localFallback.getProjects().map(x => x.id === projectId ? { ...x, members: [...x.members, userId] } : x);
      localFallback.saveProjects(p);
    }
  },

  removeProjectMember: async (projectId: string, userId: string) => {
    localFallback.saveProjectMembers(localFallback.getProjectMembers().filter(m => !(m.projectId === projectId && m.userId === userId)));
    const p = localFallback.getProjects().map(x => x.id === projectId ? { ...x, members: x.members.filter(m => m !== userId) } : x);
    localFallback.saveProjects(p);
    // Unassign tasks belonging to the removed user
    const tasks = localFallback.getTasks().map(t => (t.projectId === projectId && t.assignedTo === userId) ? { ...t, assignedTo: '' } : t);
    localFallback.saveTasks(tasks);
  },

  updateMemberRole: async (projectId: string, userId: string, role: 'Owner' | 'Editor' | 'Viewer') => {
    const mems = localFallback.getProjectMembers().map(m => (m.projectId === projectId && m.userId === userId) ? { ...m, role } : m);
    localFallback.saveProjectMembers(mems);
  },

  getProjectInvites: async (projectId: string) => {
    return localFallback.getProjectInvites().filter(i => i.projectId === projectId);
  },

  getAllUserInvites: async (email: string) => {
    return localFallback.getProjectInvites().filter(i => i.email.toLowerCase() === email.toLowerCase() && i.status === 'pending');
  },

  createInvite: async (projectId: string, email: string, invitedBy: string) => {
    const inv = localFallback.getProjectInvites();
    localFallback.saveProjectInvites([...inv, { id: `inv-${Date.now()}`, projectId, email: email.toLowerCase(), status: 'pending', invitedBy, createdAt: new Date().toISOString() }]);
  },

  respondToInvite: async (inviteId: string, status: 'accepted' | 'declined', userId?: string) => {
    const invs = localFallback.getProjectInvites();
    const invite = invs.find(i => i.id === inviteId);
    if (invite) {
      invite.status = status;
      localFallback.saveProjectInvites([...invs]);
      if (status === 'accepted' && userId) {
        await pmGateway.addProjectMember(invite.projectId, userId, 'Editor'); 
      }
    }
  },

  // --- KANBAN COLUMNS ---
  getColumns: async (projectId: string) => {
    return localFallback.getColumns().filter(c => c.projectId === projectId).sort((a,b) => a.position - b.position);
  },

  createColumn: async (projectId: string, name: string) => {
    const cols = localFallback.getColumns();
    const pCols = cols.filter(c => c.projectId === projectId);
    const newCol: DbKanbanColumn = { id: `col-${Date.now()}`, projectId, name, position: pCols.length };
    localFallback.saveColumns([...cols, newCol]);
    return newCol;
  },

  updateColumn: async (columnId: string, name: string) => {
    const cols = localFallback.getColumns().map(c => c.id === columnId ? { ...c, name } : c);
    localFallback.saveColumns(cols);
  },

  deleteColumn: async (columnId: string) => {
    localFallback.saveColumns(localFallback.getColumns().filter(c => c.id !== columnId));
    // Soft drop tasks from this column (put them in the first available column if any)
    const cols = localFallback.getColumns();
    const firstCol = cols.length > 0 ? cols[0].id : "";
    if (firstCol) {
      const tasks = localFallback.getTasks().map(t => t.status === columnId ? { ...t, status: firstCol } : t);
      localFallback.saveTasks(tasks);
    } else {
      localFallback.saveTasks(localFallback.getTasks().filter(t => t.status !== columnId));
    }
  },

  reorderColumns: async (columns: DbKanbanColumn[]) => {
    const cols = localFallback.getColumns();
    const newCols = cols.map(c => {
      const updated = columns.find(uc => uc.id === c.id);
      return updated ? { ...c, position: updated.position } : c;
    });
    localFallback.saveColumns(newCols);
  },

  // --- TASKS ---
  getTasks: async (projectId: string): Promise<DbTask[]> => {
    return localFallback.getTasks().filter(t => t.projectId === projectId);
  },

  createTask: async (projectId: string, title: string, description: string, status: string, priority: DbTask['priority'], assignedTo: string, createdBy: string, dueDate: string): Promise<DbTask> => {
    const allTasks = localFallback.getTasks();
    const newTask: DbTask = { id: `task-${Date.now()}`, projectId, title, description, status, priority, assignedTo, createdBy, dueDate, createdAt: new Date().toISOString() };
    localFallback.saveTasks([...allTasks, newTask]);
    return newTask;
  },

  updateTask: async (taskId: string, updates: Partial<DbTask>) => {
    const updated = localFallback.getTasks().map(t => t.id === taskId ? { ...t, ...updates } : t);
    localFallback.saveTasks(updated);
  },

  deleteTask: async (taskId: string) => {
    localFallback.saveTasks(localFallback.getTasks().filter(t => t.id !== taskId));
  },

  // --- MESSAGES ---
  getMessages: async (projectId: string): Promise<DbMessage[]> => {
    return localFallback.getMessages().filter(m => m.projectId === projectId).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  sendMessage: async (projectId: string, senderId: string, text: string): Promise<DbMessage> => {
    const allMsgs = localFallback.getMessages();
    const newMsg: DbMessage = { id: `msg-${Date.now()}`, projectId, senderId, text, createdAt: new Date().toISOString(), isDeleted: false };
    localFallback.saveMessages([...allMsgs, newMsg]);
    return newMsg;
  },

  deleteMessage: async (messageId: string) => {
    // Soft delete to keep placeholder
    const msgs = localFallback.getMessages().map(m => m.id === messageId ? { ...m, isDeleted: true, text: "" } : m);
    localFallback.saveMessages(msgs);
  }
};
