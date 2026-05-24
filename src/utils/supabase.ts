import { createClient } from "@supabase/supabase-js";

// Supabase Credentials
export const supabaseUrl = "https://zandhfkvuzrykwagvbnw.supabase.co";
export const supabaseAnonKey = "sb_publishable_UBlV7Fn3wEsyLyU21XP2cA_bev9RGul";

// Initialize live Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface DbUser {
  id: string;
  email: string;
  name: string;
  avatarColor: string; // Gradient class e.g. "from-blue-500 to-indigo-500"
  role: string;
}

export interface DbProject {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  members: string[]; // Member IDs
  createdAt: string;
}

export interface DbTask {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'Todo' | 'In Progress' | 'Review' | 'Done';
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
}

// ----------------------------------------------------
// OFFLINE SIMULATION FALLBACK ENGINE
// ----------------------------------------------------
// Fallback seeds in case live database tables are not initialized yet.
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
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const SEEDED_TASKS: DbTask[] = [
  {
    id: "task-1",
    projectId: "project-1",
    title: "Draft High-Fidelity Mockups",
    description: "Create premium landing and sidebar concepts using a harmonious dark color scheme with yellow highlighting.",
    status: "Done",
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
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
  }
];

class SupabaseFallbackDb {
  private usersKey = "dawndesk_pm_users";
  private projectsKey = "dawndesk_pm_projects";
  private tasksKey = "dawndesk_pm_tasks";
  private messagesKey = "dawndesk_pm_messages";
  private activeUserKey = "dawndesk_pm_active_user";

  constructor() {
    this.initDatabase();
  }

  private initDatabase() {
    if (!localStorage.getItem(this.usersKey)) localStorage.setItem(this.usersKey, JSON.stringify(SEEDED_USERS));
    if (!localStorage.getItem(this.projectsKey)) localStorage.setItem(this.projectsKey, JSON.stringify(SEEDED_PROJECTS));
    if (!localStorage.getItem(this.tasksKey)) localStorage.setItem(this.tasksKey, JSON.stringify(SEEDED_TASKS));
    if (!localStorage.getItem(this.messagesKey)) localStorage.setItem(this.messagesKey, JSON.stringify(SEEDED_MESSAGES));
  }

  public getUsers(): DbUser[] {
    const data = localStorage.getItem(this.usersKey);
    return data ? JSON.parse(data) : SEEDED_USERS;
  }

  public saveUsers(users: DbUser[]) {
    localStorage.setItem(this.usersKey, JSON.stringify(users));
  }

  public getActiveUser(): DbUser | null {
    const data = localStorage.getItem(this.activeUserKey);
    return data ? JSON.parse(data) : null;
  }

  public setActiveUser(user: DbUser | null) {
    if (user) localStorage.setItem(this.activeUserKey, JSON.stringify(user));
    else localStorage.removeItem(this.activeUserKey);
  }

  public getProjects(): DbProject[] {
    const data = localStorage.getItem(this.projectsKey);
    return data ? JSON.parse(data) : SEEDED_PROJECTS;
  }

  public saveProjects(projs: DbProject[]) {
    localStorage.setItem(this.projectsKey, JSON.stringify(projs));
  }

  public getTasks(): DbTask[] {
    const data = localStorage.getItem(this.tasksKey);
    return data ? JSON.parse(data) : SEEDED_TASKS;
  }

  public saveTasks(tasks: DbTask[]) {
    localStorage.setItem(this.tasksKey, JSON.stringify(tasks));
  }

  public getMessages(): DbMessage[] {
    const data = localStorage.getItem(this.messagesKey);
    return data ? JSON.parse(data) : SEEDED_MESSAGES;
  }

  public saveMessages(msgs: DbMessage[]) {
    localStorage.setItem(this.messagesKey, JSON.stringify(msgs));
  }
}

export const localFallback = new SupabaseFallbackDb();

// ----------------------------------------------------
// DYNAMIC DUAL-MODE SERVICE GATEWAY
// ----------------------------------------------------
// Tracks whether we had to fallback to LocalStorage due to missing tables
export let isFallbackMode = false;
export let lastDbError = "";

export const setFallbackMode = (enabled: boolean, errorMsg: string = "") => {
  isFallbackMode = enabled;
  lastDbError = errorMsg;
  if (enabled) {
    console.warn("Supabase Gateway fell back to local storage simulator. Error:", errorMsg);
  }
};

// Gradient mapping for avatars
const gradients = [
  "from-teal-500 to-emerald-500",
  "from-cyan-500 to-blue-500",
  "from-purple-500 to-pink-500",
  "from-yellow-500 to-amber-500",
  "from-rose-500 to-red-500"
];

// SQL Schema for the User's Supabase dashboard
export const SQL_SCHEMA = `-- 1. Profiles Table (Link to Auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text not null,
  avatar_color text not null,
  role text not null
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;
create policy "Allow public read profiles" on public.profiles for select using (true);
create policy "Allow insert profiles" on public.profiles for insert with check (auth.uid() = id);
create policy "Allow update profiles" on public.profiles for update using (auth.uid() = id);

-- 2. Projects Table
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text not null,
  created_by uuid references public.profiles(id) on delete cascade not null,
  members text[] not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for projects
alter table public.projects enable row level security;
create policy "Allow authenticated user read projects" on public.projects for select using (true);
create policy "Allow authenticated user insert projects" on public.projects for insert with check (auth.uid() = created_by);
create policy "Allow authenticated user delete projects" on public.projects for delete using (auth.uid() = created_by);

-- 3. Tasks Table
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  description text not null,
  status text not null check (status in ('Todo', 'In Progress', 'Review', 'Done')),
  assigned_to uuid references public.profiles(id) on delete cascade not null,
  created_by uuid references public.profiles(id) on delete cascade not null,
  due_date text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for tasks
alter table public.tasks enable row level security;
create policy "Allow authenticated user read tasks" on public.tasks for select using (true);
create policy "Allow authenticated user write tasks" on public.tasks for all using (true);

-- 4. Messages Table
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for messages
alter table public.messages enable row level security;
create policy "Allow authenticated user read messages" on public.messages for select using (true);
create policy "Allow authenticated user write messages" on public.messages for insert with check (auth.uid() = sender_id);
`;

// Helper check for relation missing code
const isRelationMissing = (err: any) => {
  return err && (err.code === "42P01" || err.message?.includes("relation") || err.message?.includes("does not exist"));
};

export const pmGateway = {
  // --- AUTH SERVICES ---
  getActiveUser: (): DbUser | null => {
    return localFallback.getActiveUser();
  },

  setActiveUser: (user: DbUser | null) => {
    localFallback.setActiveUser(user);
  },

  getRegisteredUsers: async (): Promise<DbUser[]> => {
    if (isFallbackMode) {
      return localFallback.getUsers();
    }
    try {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) {
        if (isRelationMissing(error)) {
          setFallbackMode(true, "profiles table not found on Supabase.");
          return localFallback.getUsers();
        }
        throw error;
      }
      return data.map(d => ({
        id: d.id,
        email: d.email,
        name: d.name,
        avatarColor: d.avatar_color,
        role: d.role
      }));
    } catch (err: any) {
      setFallbackMode(true, err.message || "Failed to fetch Supabase profiles.");
      return localFallback.getUsers();
    }
  },

  signUp: async (email: string, name: string, role: string, password?: string): Promise<{ success: boolean; user?: DbUser; error?: string }> => {
    // If no password is provided or we are in fallback, register locally
    if (isFallbackMode || !password) {
      const users = localFallback.getUsers();
      if (users.length >= 5) {
        return { success: false, error: "Workspace cap reached (Maximum 5 local users). You can log in using one of the pre-seeded accounts." };
      }
      if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        return { success: false, error: "A local user with this email already exists." };
      }
      const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];
      const newUser: DbUser = {
        id: `user-${Date.now()}`,
        email: email.toLowerCase(),
        name,
        avatarColor: randomGradient,
        role
      };
      localFallback.saveUsers([...users, newUser]);
      localFallback.setActiveUser(newUser);
      return { success: true, user: newUser };
    }

    try {
      // 1. Supabase Auth Sign Up
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error("SignUp failed to return user data.");

      // 2. Insert into Profiles
      const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];
      const profileData = {
        id: data.user.id,
        email: email.toLowerCase(),
        name,
        avatar_color: randomGradient,
        role
      };

      const { error: profileError } = await supabase.from("profiles").insert(profileData);
      
      if (profileError) {
        if (isRelationMissing(profileError)) {
          setFallbackMode(true, "profiles table not found on Supabase. Falling back.");
          // Create local user
          const mockUser = { id: data.user.id, email, name, avatarColor: randomGradient, role };
          localFallback.saveUsers([...localFallback.getUsers(), mockUser]);
          localFallback.setActiveUser(mockUser);
          return { success: true, user: mockUser };
        }
        throw profileError;
      }

      const verifiedUser: DbUser = {
        id: data.user.id,
        email,
        name,
        avatarColor: randomGradient,
        role
      };

      localFallback.setActiveUser(verifiedUser);
      return { success: true, user: verifiedUser };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to sign up on Supabase." };
    }
  },

  logIn: async (email: string, password?: string): Promise<{ success: boolean; user?: DbUser; error?: string }> => {
    // If no password or fallback, authenticate locally
    if (isFallbackMode || !password) {
      const users = localFallback.getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) return { success: false, error: "No local user found with this email." };
      localFallback.setActiveUser(user);
      return { success: true, user };
    }

    try {
      // 1. Supabase Login
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error("SignIn failed to return user.");

      // 2. Fetch profile from database
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (profileError) {
        if (isRelationMissing(profileError)) {
          setFallbackMode(true, "profiles table not found on Supabase. Falling back.");
          const user = { id: data.user.id, email, name: email.split("@")[0], avatarColor: gradients[0], role: "Lead Developer" };
          localFallback.setActiveUser(user);
          return { success: true, user };
        }
        throw profileError;
      }

      const activeUser: DbUser = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        avatarColor: profile.avatar_color,
        role: profile.role
      };

      localFallback.setActiveUser(activeUser);
      return { success: true, user: activeUser };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to log in on Supabase." };
    }
  },

  // --- PROJECTS SERVICES ---
  getProjects: async (): Promise<DbProject[]> => {
    if (isFallbackMode) {
      return localFallback.getProjects();
    }
    try {
      const { data, error } = await supabase.from("projects").select("*");
      if (error) {
        if (isRelationMissing(error)) {
          setFallbackMode(true, "projects table not found.");
          return localFallback.getProjects();
        }
        throw error;
      }
      return data.map(d => ({
        id: d.id,
        name: d.name,
        description: d.description,
        createdBy: d.created_by,
        members: d.members,
        createdAt: d.created_at
      }));
    } catch (err: any) {
      setFallbackMode(true, err.message);
      return localFallback.getProjects();
    }
  },

  createProject: async (name: string, description: string, createdBy: string, memberIds: string[]): Promise<DbProject> => {
    const finalMembers = Array.from(new Set([createdBy, ...memberIds]));
    const createdAt = new Date().toISOString();

    if (isFallbackMode) {
      const projs = localFallback.getProjects();
      const newProj = { id: `project-${Date.now()}`, name, description, createdBy, members: finalMembers, createdAt };
      localFallback.saveProjects([...projs, newProj]);
      return newProj;
    }

    try {
      const { data, error } = await supabase
        .from("projects")
        .insert({
          name,
          description,
          created_by: createdBy,
          members: finalMembers,
          created_at: createdAt
        })
        .select()
        .single();

      if (error) throw error;
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        createdBy: data.created_by,
        members: data.members,
        createdAt: data.created_at
      };
    } catch (err: any) {
      setFallbackMode(true, err.message);
      // fallback create
      const projs = localFallback.getProjects();
      const newProj = { id: `project-${Date.now()}`, name, description, createdBy, members: finalMembers, createdAt };
      localFallback.saveProjects([...projs, newProj]);
      return newProj;
    }
  },

  deleteProject: async (projectId: string) => {
    if (isFallbackMode) {
      localFallback.saveProjects(localFallback.getProjects().filter(p => p.id !== projectId));
      localFallback.saveTasks(localFallback.getTasks().filter(t => t.projectId !== projectId));
      localFallback.saveMessages(localFallback.getMessages().filter(m => m.projectId !== projectId));
      return;
    }

    try {
      await supabase.from("projects").delete().eq("id", projectId);
    } catch (err) {
      // safe fallback
      localFallback.saveProjects(localFallback.getProjects().filter(p => p.id !== projectId));
    }
  },

  // --- TASKS SERVICES ---
  getTasks: async (projectId: string): Promise<DbTask[]> => {
    if (isFallbackMode) {
      return localFallback.getTasks().filter(t => t.projectId === projectId);
    }
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId);

      if (error) {
        if (isRelationMissing(error)) {
          setFallbackMode(true, "tasks table not found.");
          return localFallback.getTasks().filter(t => t.projectId === projectId);
        }
        throw error;
      }

      return data.map(d => ({
        id: d.id,
        projectId: d.project_id,
        title: d.title,
        description: d.description,
        status: d.status,
        assignedTo: d.assigned_to,
        createdBy: d.created_by,
        dueDate: d.due_date,
        createdAt: d.created_at
      }));
    } catch (err: any) {
      setFallbackMode(true, err.message);
      return localFallback.getTasks().filter(t => t.projectId === projectId);
    }
  },

  createTask: async (projectId: string, title: string, description: string, assignedTo: string, createdBy: string, dueDate: string): Promise<DbTask> => {
    const createdAt = new Date().toISOString();

    if (isFallbackMode) {
      const allTasks = localFallback.getTasks();
      const newTask: DbTask = { id: `task-${Date.now()}`, projectId, title, description, status: "Todo", assignedTo, createdBy, dueDate, createdAt };
      localFallback.saveTasks([...allTasks, newTask]);
      return newTask;
    }

    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          project_id: projectId,
          title,
          description,
          status: "Todo",
          assigned_to: assignedTo,
          created_by: createdBy,
          due_date: dueDate,
          created_at: createdAt
        })
        .select()
        .single();

      if (error) throw error;
      return {
        id: data.id,
        projectId: data.project_id,
        title: data.title,
        description: data.description,
        status: data.status,
        assignedTo: data.assigned_to,
        createdBy: data.created_by,
        dueDate: data.due_date,
        createdAt: data.created_at
      };
    } catch (err: any) {
      setFallbackMode(true, err.message);
      const allTasks = localFallback.getTasks();
      const newTask: DbTask = { id: `task-${Date.now()}`, projectId, title, description, status: "Todo", assignedTo, createdBy, dueDate, createdAt };
      localFallback.saveTasks([...allTasks, newTask]);
      return newTask;
    }
  },

  updateTaskStatus: async (taskId: string, status: DbTask['status']) => {
    if (isFallbackMode) {
      const updated = localFallback.getTasks().map(t => t.id === taskId ? { ...t, status } : t);
      localFallback.saveTasks(updated);
      return;
    }
    try {
      await supabase.from("tasks").update({ status }).eq("id", taskId);
    } catch (err: any) {
      setFallbackMode(true, err.message);
      const updated = localFallback.getTasks().map(t => t.id === taskId ? { ...t, status } : t);
      localFallback.saveTasks(updated);
    }
  },

  deleteTask: async (taskId: string) => {
    if (isFallbackMode) {
      localFallback.saveTasks(localFallback.getTasks().filter(t => t.id !== taskId));
      return;
    }
    try {
      await supabase.from("tasks").delete().eq("id", taskId);
    } catch (err: any) {
      setFallbackMode(true, err.message);
      localFallback.saveTasks(localFallback.getTasks().filter(t => t.id !== taskId));
    }
  },

  // --- MESSAGES SERVICES ---
  getMessages: async (projectId: string): Promise<DbMessage[]> => {
    if (isFallbackMode) {
      return localFallback.getMessages().filter(m => m.projectId === projectId);
    }
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) {
        if (isRelationMissing(error)) {
          setFallbackMode(true, "messages table not found.");
          return localFallback.getMessages().filter(m => m.projectId === projectId);
        }
        throw error;
      }

      return data.map(d => ({
        id: d.id,
        projectId: d.project_id,
        senderId: d.sender_id,
        text: d.text,
        createdAt: d.created_at
      }));
    } catch (err: any) {
      setFallbackMode(true, err.message);
      return localFallback.getMessages().filter(m => m.projectId === projectId);
    }
  },

  sendMessage: async (projectId: string, senderId: string, text: string): Promise<DbMessage> => {
    const createdAt = new Date().toISOString();

    if (isFallbackMode) {
      const allMsgs = localFallback.getMessages();
      const newMsg = { id: `msg-${Date.now()}`, projectId, senderId, text, createdAt };
      localFallback.saveMessages([...allMsgs, newMsg]);
      return newMsg;
    }

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          project_id: projectId,
          sender_id: senderId,
          text,
          created_at: createdAt
        })
        .select()
        .single();

      if (error) throw error;
      return {
        id: data.id,
        projectId: data.project_id,
        senderId: data.sender_id,
        text: data.text,
        createdAt: data.created_at
      };
    } catch (err: any) {
      setFallbackMode(true, err.message);
      const allMsgs = localFallback.getMessages();
      const newMsg = { id: `msg-${Date.now()}`, projectId, senderId, text, createdAt };
      localFallback.saveMessages([...allMsgs, newMsg]);
      return newMsg;
    }
  }
};
