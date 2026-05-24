import React, { useState, useEffect, useRef } from "react";
import { 
  pmGateway, 
  DbUser, 
  DbProject, 
  DbTask, 
  DbMessage,
  isFallbackMode,
  lastDbError,
  SQL_SCHEMA,
  supabase
} from "../utils/supabase";

export default function ProjectManager() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<DbUser | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState(""); // Password support
  const [nameInput, setNameInput] = useState("");
  const [roleInput, setRoleInput] = useState("Lead Developer");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  // App Core State
  const [projects, setProjects] = useState<DbProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [tasks, setTasks] = useState<DbTask[]>([]);
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [allUsers, setAllUsers] = useState<DbUser[]>([]);
  
  // Workspace UI State
  const [activeTab, setActiveTab] = useState<"tasks" | "chat" | "members">("tasks");
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSchemaDrawerOpen, setIsSchemaDrawerOpen] = useState(false); // SQL Schema modal
  const [loading, setLoading] = useState(false);

  // Forms State
  const [newProjName, setNewProjName] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [newProjMembers, setNewProjMembers] = useState<string[]>([]);
  const [projFormError, setProjFormError] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [taskFormError, setTaskFormError] = useState("");

  // Chat and Mentioning State
  const [chatInput, setChatInput] = useState("");
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [suggestionFilter, setSuggestionFilter] = useState("");
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  // Mention Notifications State (keeps track of mentions the user received)
  const [unreadMentions, setUnreadMentions] = useState<{ [projectId: string]: boolean }>({});

  // Sync state with gateway
  const refreshAll = async () => {
    setLoading(true);
    try {
      const active = pmGateway.getActiveUser();
      setCurrentUser(active);
      
      const users = await pmGateway.getRegisteredUsers();
      setAllUsers(users);

      const projs = await pmGateway.getProjects();
      setProjects(projs);

      if (projs.length > 0) {
        if (!selectedProjectId || !projs.find(p => p.id === selectedProjectId)) {
          setSelectedProjectId(projs[0].id);
        }
      } else {
        setSelectedProjectId("");
      }
    } catch (e) {
      console.error("Failed to sync gateway", e);
    } finally {
      setLoading(false);
    }
  };

  // Run on mount
  useEffect(() => {
    void refreshAll();
  }, []);

  // Fetch tasks and messages when selected project changes and set up live updates
  useEffect(() => {
    let messageChannel: any = null;
    let taskChannel: any = null;

    const fetchProjData = async () => {
      if (selectedProjectId) {
        setTasks(await pmGateway.getTasks(selectedProjectId));
        setMessages(await pmGateway.getMessages(selectedProjectId));
        // Mark mentions for this project as read
        setUnreadMentions(prev => ({ ...prev, [selectedProjectId]: false }));

        // Enable real-time subscriptions if connected live to Supabase
        if (!isFallbackMode) {
          messageChannel = supabase
            .channel(`room:messages:${selectedProjectId}`)
            .on(
              "postgres_changes",
              { event: "INSERT", schema: "public", table: "messages", filter: `project_id=eq.${selectedProjectId}` },
              (payload) => {
                const newMsg: DbMessage = {
                  id: payload.new.id,
                  projectId: payload.new.project_id,
                  senderId: payload.new.sender_id,
                  text: payload.new.text,
                  createdAt: payload.new.created_at
                };
                setMessages(prev => {
                  if (prev.find(m => m.id === newMsg.id)) return prev;
                  return [...prev, newMsg];
                });
              }
            )
            .subscribe();

          taskChannel = supabase
            .channel(`room:tasks:${selectedProjectId}`)
            .on(
              "postgres_changes",
              { event: "*", schema: "public", table: "tasks", filter: `project_id=eq.${selectedProjectId}` },
              async () => {
                const updatedTasks = await pmGateway.getTasks(selectedProjectId);
                setTasks(updatedTasks);
              }
            )
            .subscribe();
        }
      } else {
        setTasks([]);
        setMessages([]);
      }
      setActiveTab("tasks");
    };

    void fetchProjData();

    return () => {
      if (messageChannel) {
        void supabase.removeChannel(messageChannel);
      }
      if (taskChannel) {
        void supabase.removeChannel(taskChannel);
      }
    };
  }, [selectedProjectId]);

  // Scroll to bottom of chat when messages populate
  useEffect(() => {
    if (activeTab === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  // Active Project Helper
  const activeProject = projects.find(p => p.id === selectedProjectId);

  // Filter projects by current logged-in user membership
  const userProjects = projects.filter(p => currentUser && p.members.includes(currentUser.id));

  // Get users belonging to active project
  const projectMembers = activeProject 
    ? allUsers.filter(u => activeProject.members.includes(u.id))
    : [];

  // Sandbox Switcher
  const handleSwitchUser = async (user: DbUser) => {
    pmGateway.setActiveUser(user);
    setCurrentUser(user);
    setEmailInput(user.email);
    setPasswordInput("");
    await refreshAll();
  };

  // Auth Operations
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!emailInput.trim() || !passwordInput) {
      setAuthError("Email and password are required.");
      return;
    }

    setLoading(true);
    const res = await pmGateway.logIn(emailInput.trim(), passwordInput);
    setLoading(false);

    if (res.success && res.user) {
      setCurrentUser(res.user);
      setAuthSuccess(`Welcome back, ${res.user.name}!`);
      setPasswordInput("");
      await refreshAll();
    } else {
      setAuthError(res.error || "Login failed.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    const name = nameInput.trim();
    const email = emailInput.trim();
    const role = roleInput.trim();
    const password = passwordInput;

    if (!name || !email || !role || !password) {
      setAuthError("Please fill out all registration fields.");
      return;
    }

    if (password.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const res = await pmGateway.signUp(email, name, role, password);
    setLoading(false);

    if (res.success && res.user) {
      setCurrentUser(res.user);
      setAuthSuccess(`Account created for ${res.user.name}!`);
      setPasswordInput("");
      setNameInput("");
      await refreshAll();
    } else {
      setAuthError(res.error || "Registration failed.");
    }
  };

  const handleLogout = () => {
    pmGateway.setActiveUser(null);
    setCurrentUser(null);
    setSelectedProjectId("");
    setEmailInput("");
    setPasswordInput("");
    setNameInput("");
  };

  // Project Operations
  const openProjectModal = () => {
    setNewProjName("");
    setNewProjDesc("");
    setNewProjMembers([]);
    setProjFormError("");
    setInviteEmail("");
    setIsProjectModalOpen(true);
  };

  const handleInviteUser = () => {
    setProjFormError("");
    if (!inviteEmail.trim()) return;

    const currentMemberCount = newProjMembers.length + 1; // +1 for creator
    if (currentMemberCount >= 5) {
      setProjFormError("A project can have a maximum of 5 members.");
      return;
    }

    const userToInvite = allUsers.find(u => u.email.toLowerCase() === inviteEmail.toLowerCase().trim());
    
    if (!userToInvite) {
      setProjFormError(`User with email ${inviteEmail} not found.`);
      return;
    }

    if (userToInvite.id === currentUser?.id) {
      setProjFormError("You are already included as the creator.");
      setInviteEmail("");
      return;
    }

    if (newProjMembers.includes(userToInvite.id)) {
      setProjFormError("User is already invited.");
      setInviteEmail("");
      return;
    }

    setNewProjMembers([...newProjMembers, userToInvite.id]);
    setInviteEmail("");
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setProjFormError("");

    const name = newProjName.trim();
    const desc = newProjDesc.trim();

    if (!name || !desc) {
      setProjFormError("Please enter a project name and description.");
      return;
    }

    if (!currentUser) return;

    const totalMembers = newProjMembers.includes(currentUser.id) ? newProjMembers.length : newProjMembers.length + 1;
    if (totalMembers > 5) {
      setProjFormError("A project can have a maximum of 5 members.");
      return;
    }

    setLoading(true);
    const newProj = await pmGateway.createProject(name, desc, currentUser.id, newProjMembers);
    setLoading(false);

    setIsProjectModalOpen(false);
    await refreshAll();
    setSelectedProjectId(newProj.id);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm("Are you sure you want to delete this project and all associated tasks/messages?")) {
      setLoading(true);
      await pmGateway.deleteProject(projectId);
      await refreshAll();
    }
  };

  // Task Operations
  const openTaskModal = () => {
    setNewTaskTitle("");
    setNewTaskDesc("");
    setNewTaskAssignee(projectMembers[0]?.id || "");
    setNewTaskDueDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setTaskFormError("");
    setIsTaskModalOpen(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskFormError("");

    const title = newTaskTitle.trim();
    const desc = newTaskDesc.trim();

    if (!title || !desc || !newTaskAssignee || !newTaskDueDate) {
      setTaskFormError("Please fill out all task details.");
      return;
    }

    if (!currentUser || !selectedProjectId) return;

    await pmGateway.createTask(
      selectedProjectId,
      title,
      desc,
      newTaskAssignee,
      currentUser.id,
      newTaskDueDate
    );

    setIsTaskModalOpen(false);
    setTasks(await pmGateway.getTasks(selectedProjectId));
  };

  const handleMoveTask = async (taskId: string, currentStatus: DbTask['status'], direction: 'left' | 'right') => {
    const statuses: DbTask['status'][] = ["Todo", "In Progress", "Review", "Done"];
    const idx = statuses.indexOf(currentStatus);
    let nextIdx = idx;

    if (direction === 'left' && idx > 0) nextIdx -= 1;
    if (direction === 'right' && idx < 3) nextIdx += 1;

    if (nextIdx !== idx) {
      await pmGateway.updateTaskStatus(taskId, statuses[nextIdx]);
      if (selectedProjectId) {
        setTasks(await pmGateway.getTasks(selectedProjectId));
      }
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      await pmGateway.deleteTask(taskId);
      if (selectedProjectId) {
        setTasks(await pmGateway.getTasks(selectedProjectId));
      }
    }
  };

  // --- CHAT INTERACTION & AUTOCOMPLETE MENTIONS ---
  const handleChatInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setChatInput(value);

    // Check for typing `@` suggestion trigger
    const selectionStart = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, selectionStart);
    const lastWordMatch = textBeforeCursor.match(/@(\w*)$/);

    if (lastWordMatch) {
      setShowMentionSuggestions(true);
      setSuggestionFilter(lastWordMatch[1]);
      setSuggestionIndex(0);
    } else {
      setShowMentionSuggestions(false);
    }
  };

  const handleSelectSuggestion = (user: DbUser) => {
    if (!chatInputRef.current) return;
    
    const value = chatInput;
    const selectionStart = chatInputRef.current.selectionStart;
    const textBeforeCursor = value.substring(0, selectionStart);
    const textAfterCursor = value.substring(selectionStart);
    
    // Replace `@typingName` with `@Full User Name `
    const newTextBefore = textBeforeCursor.replace(/@\w*$/, `@${user.name} `);
    
    setChatInput(newTextBefore + textAfterCursor);
    setShowMentionSuggestions(false);
    
    // Focus back on text area and set selection
    setTimeout(() => {
      if (chatInputRef.current) {
        chatInputRef.current.focus();
        const cursorPosition = newTextBefore.length;
        chatInputRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionSuggestions && filteredSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSuggestionIndex(prev => (prev + 1) % filteredSuggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSuggestionIndex(prev => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        handleSelectSuggestion(filteredSuggestions[suggestionIndex]);
        return;
      }
      if (e.key === "Escape") {
        setShowMentionSuggestions(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSendChat();
    }
  };

  const filteredSuggestions = projectMembers.filter(member => {
    if (member.id === currentUser?.id) return false;
    return member.name.toLowerCase().includes(suggestionFilter.toLowerCase());
  });

  const handleSendChat = async () => {
    const text = chatInput.trim();
    if (!text || !currentUser || !selectedProjectId) return;

    await pmGateway.sendMessage(selectedProjectId, currentUser.id, text);
    
    // Trigger mock notifications
    projectMembers.forEach(member => {
      if (member.id !== currentUser.id && text.includes(`@${member.name}`)) {
        setUnreadMentions(prev => ({ ...prev, [selectedProjectId]: true }));
      }
    });

    setChatInput("");
    setShowMentionSuggestions(false);
    setMessages(await pmGateway.getMessages(selectedProjectId));
  };

  const renderMessageText = (text: string) => {
    let parts: (string | React.ReactNode)[] = [text];
    
    projectMembers.forEach(member => {
      const mentionStr = `@${member.name}`;
      const newParts: (string | React.ReactNode)[] = [];
      
      parts.forEach(part => {
        if (typeof part === 'string') {
          const split = part.split(mentionStr);
          if (split.length > 1) {
            split.forEach((subPart, idx) => {
              newParts.push(subPart);
              if (idx < split.length - 1) {
                newParts.push(
                  <span 
                    key={`${member.id}-${idx}`} 
                    className="px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 text-xs font-semibold select-none inline-block mx-0.5"
                  >
                    {mentionStr}
                  </span>
                );
              }
            });
          } else {
            newParts.push(part);
          }
        } else {
          newParts.push(part);
        }
      });
      parts = newParts;
    });
    
    return <span className="whitespace-pre-wrap break-words">{parts}</span>;
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full flex-col text-white max-w-7xl animate-fadeIn p-4 md:p-8 relative">
      
      {/* ⚠️ Supabase Fallback/Alert banner */}
      {isFallbackMode && (
        <div className="mb-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-yellow-200">
          <div className="flex items-center gap-2 leading-relaxed">
            <span>⚠️</span>
            <div>
              <strong className="text-yellow-300">Supabase tables not initialized:</strong> Operating in Collaborative Local Sandbox mode. 
              <span className="text-white/40 ml-1">Error: {lastDbError || "relation profiles does not exist."}</span>
            </div>
          </div>
          <button
            onClick={() => setIsSchemaDrawerOpen(true)}
            className="rounded-lg bg-yellow-400 px-3.5 py-1.5 text-[10px] font-bold text-black hover:bg-yellow-300 transition-colors shadow shrink-0"
          >
            Show SQL Script 📋
          </button>
        </div>
      )}

      {/* --- AUTH PANEL (if logged out) --- */}
      {!currentUser ? (
        <div className="grid w-full grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1 my-auto">
          {/* Left panel: Info & Sandbox Switcher */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div>
              <span className="text-xs font-bold tracking-widest text-yellow-400 uppercase">
                Cloud Collaboration
              </span>
              <h1 className="text-4xl font-extrabold mt-2 leading-tight bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-500 bg-clip-text text-transparent">
                DawnDesk Project Hub
              </h1>
              <p className="mt-3 text-white/60 text-sm max-w-xl leading-relaxed">
                Connect and manage projects dynamically with your team. Establish boards, assign tasks, and communicate instantly using interactive chat rooms featuring member tags.
              </p>
            </div>

            {/* Sandbox Quick login Accounts */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5 backdrop-blur-md shadow-xl flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">
                  👥 Simulated Local Switcher (Max 5 Users)
                </h3>
                <p className="text-xs text-white/40 mt-1">
                  You can click any identity below to instantly sign in as a pre-seeded account locally to test the cooperative features:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                {allUsers.slice(0, 5).map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSwitchUser(user)}
                    className="flex items-center justify-between p-3 rounded-xl border border-neutral-800 bg-neutral-950/40 hover:bg-neutral-800/40 hover:border-yellow-400/30 text-left transition-all duration-200 group hover:scale-[1.01]"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${user.avatarColor} flex items-center justify-center text-xs font-bold text-white shadow-md`}>
                        {user.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-yellow-300 transition-colors">
                          {user.name}
                        </div>
                        <div className="text-[10px] text-white/40 mt-0.5">{user.role}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-yellow-400/80 group-hover:text-yellow-300 opacity-60 group-hover:opacity-100 flex items-center gap-1">
                      Quick Sign In
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-2.5 h-2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right panel: Login & Register Forms */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 backdrop-blur-md shadow-2xl flex flex-col gap-4">
              {/* Form switcher tabs */}
              <div className="grid grid-cols-2 bg-neutral-950/60 p-1.5 rounded-xl border border-neutral-800/80">
                <button
                  onClick={() => { setAuthMode("login"); setAuthError(""); setAuthSuccess(""); }}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    authMode === "login"
                      ? "bg-yellow-400 text-black shadow-md"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  Log In
                </button>
                <button
                  onClick={() => { setAuthMode("register"); setAuthError(""); setAuthSuccess(""); }}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    authMode === "register"
                      ? "bg-yellow-400 text-black shadow-md"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  Register / Sign Up
                </button>
              </div>

              {/* Feedback messages */}
              {authError && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300 leading-normal">
                  ⚠️ {authError}
                </div>
              )}
              {authSuccess && (
                <div className="rounded-xl border border-green-500/40 bg-green-500/10 p-3 text-xs text-green-300">
                  🎉 {authSuccess}
                </div>
              )}

              {/* AUTH FORMS */}
              {authMode === "login" ? (
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-white/50 tracking-wider uppercase">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. sarah@dawndesk.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-3.5 py-2.5 text-xs text-white placeholder-white/25 outline-none focus:border-yellow-400/60 focus:bg-neutral-950 transition-all duration-200"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-white/50 tracking-wider uppercase">
                      Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-3.5 py-2.5 text-xs text-white placeholder-white/25 outline-none focus:border-yellow-400/60 focus:bg-neutral-950 transition-all duration-200"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-xl bg-yellow-400 py-3 text-xs font-extrabold text-black hover:bg-yellow-300 transition-colors shadow-[0_0_15px_rgba(250,204,21,0.1)] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? "Authenticating..." : "Sign In to Database"}
                  </button>
                  <p className="text-[10px] text-white/40 text-center">
                    Note: Supabase user accounts are authenticated globally. Use email sandbox sign-in on the left to bypass passwords locally!
                  </p>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="flex flex-col gap-4">
                  {/* Total profile counter */}
                  <div className="flex justify-between items-center bg-neutral-950/40 border border-neutral-800 rounded-lg p-2 text-[10px] font-semibold text-white/60">
                    <span>Registered Members:</span>
                    <span className="px-2 py-0.5 rounded bg-yellow-400/10 text-yellow-300 font-bold">
                      {allUsers.length} profiles
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-white/50 tracking-wider uppercase">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sarah Chen"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-3.5 py-2.5 text-xs text-white placeholder-white/20 outline-none focus:border-yellow-400/60 focus:bg-neutral-950 transition-all duration-200"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-white/50 tracking-wider uppercase">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. sarah@dawndesk.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-3.5 py-2.5 text-xs text-white placeholder-white/20 outline-none focus:border-yellow-400/60 focus:bg-neutral-950 transition-all duration-200"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-white/50 tracking-wider uppercase">
                      Password (min. 6 chars)
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-3.5 py-2.5 text-xs text-white placeholder-white/20 outline-none focus:border-yellow-400/60 focus:bg-neutral-950 transition-all duration-200"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-white/50 tracking-wider uppercase">
                      Professional Role
                    </label>
                    <select
                      value={roleInput}
                      onChange={(e) => setRoleInput(e.target.value)}
                      className="rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-yellow-400/60 focus:bg-neutral-950 transition-all duration-200 cursor-pointer"
                    >
                      <option value="Product Manager">Product Manager</option>
                      <option value="Lead Developer">Lead Developer</option>
                      <option value="UI/UX Designer">UI/UX Designer</option>
                      <option value="DevOps Engineer">DevOps Engineer</option>
                      <option value="Quality Analyst">Quality Analyst</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-xl bg-yellow-400 py-3 text-xs font-extrabold text-black hover:bg-yellow-300 transition-colors shadow-[0_0_15px_rgba(250,204,21,0.1)] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? "Registering account..." : "Sign Up Live"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* --- CORE APP WORKSPACE (if logged in) --- */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-stretch flex-1">
          {/* Left panel: Active profile & Projects sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            
            {/* User Details card */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 backdrop-blur-md flex flex-col gap-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${currentUser.avatarColor} flex items-center justify-center text-xs font-bold text-white shadow-md border border-white/10`}>
                    {currentUser.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{currentUser.name}</div>
                    <div className="text-[10px] text-yellow-400/80 font-medium mt-0.5">{currentUser.role}</div>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 rounded-lg bg-neutral-950/40 hover:bg-red-500/10 border border-neutral-800/80 hover:border-red-500/20 text-white/50 hover:text-red-400 transition-colors"
                  title="Log Out"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                  </svg>
                </button>
              </div>

              {/* Collaborative Swappers */}
              <div className="border-t border-neutral-800/60 pt-2.5 flex flex-col gap-1.5">
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-wide">
                  ⚡ Collaborator Switcher (Realtime Demo)
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  {allUsers.slice(0, 5).map((u) => {
                    const isActive = u.id === currentUser.id;
                    const hasMention = unreadMentions[selectedProjectId] && u.id !== currentUser.id && u.id === "user-3";
                    return (
                      <button
                        key={u.id}
                        onClick={() => void handleSwitchUser(u)}
                        disabled={isActive}
                        className={`relative px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                          isActive
                            ? "bg-yellow-400/10 text-yellow-300 border border-yellow-400/40 font-bold"
                            : "bg-neutral-950/60 hover:bg-neutral-800 border border-neutral-800 text-white/60 hover:text-white"
                        }`}
                        title={isActive ? "Currently signed in" : `Switch role to ${u.name}`}
                      >
                        {u.name.split(" ")[0]}
                        {hasMention && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full border border-neutral-900 animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Projects list */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 backdrop-blur-md flex flex-col gap-4 shadow-lg flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
                  📂 Projects ({userProjects.length})
                </h2>
                <button
                  onClick={openProjectModal}
                  className="p-1.5 rounded-lg bg-yellow-400 text-black hover:bg-yellow-300 transition-colors shadow-sm"
                  title="Create Project"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              </div>

              {userProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-neutral-800 rounded-xl bg-neutral-950/10">
                  <p className="text-xs text-white/40">No projects yet. Build one below!</p>
                  <button onClick={openProjectModal} className="mt-2 text-[10px] text-yellow-300 font-bold hover:underline">
                    Create Project
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 overflow-y-auto max-h-[350px] no-scrollbar">
                  {userProjects.map((proj) => {
                    const isSelected = proj.id === selectedProjectId;
                    const memberDetails = allUsers.filter(u => proj.members.includes(u.id));
                    return (
                      <div
                        key={proj.id}
                        onClick={() => setSelectedProjectId(proj.id)}
                        className={`group p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "bg-neutral-800/80 border-yellow-400/40 shadow-inner"
                            : "bg-neutral-950/30 border-neutral-800/60 hover:bg-neutral-800/40 hover:border-neutral-700"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-bold text-xs text-white group-hover:text-yellow-300 transition-colors truncate max-w-[180px]">
                            {proj.name}
                          </div>
                          {proj.createdBy === currentUser.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleDeleteProject(proj.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-all"
                              title="Delete Project"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3 h-3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.34 12.142m-10.116-6.23C9.182 3.931 12 9 12 9s2.818-5.069 3.417-6.23M15.75 12c0 2.623-1.636 4.88-4 5.75m4-5.75a6.002 6.002 0 0 0-4-5.75m4-5.75c0-2.623-1.636-4.88-4-5.75m-4 5.75c0 2.623 1.636 4.88 4 5.75m-4-5.75a6.002 6.002 0 0 1 4-5.75m4 11.5v3a2.25 2.25 0 0 1-2.25 2.25h-3.5m0-13.5v-3A2.25 2.25 0 0 0 11.25 3h-3.5" />
                              </svg>
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-white/50 mt-1 line-clamp-2 leading-relaxed">
                          {proj.description}
                        </p>
                        
                        <div className="flex items-center justify-between border-t border-neutral-800/40 pt-2 mt-2">
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {memberDetails.map((m) => (
                              <div
                                key={m.id}
                                className={`inline-block h-4.5 w-4.5 rounded-full ring-2 ring-neutral-900 bg-gradient-to-tr ${m.avatarColor} flex items-center justify-center text-[8px] font-bold text-white`}
                                title={`${m.name} (${m.role})`}
                              >
                                {m.name[0]}
                              </div>
                            ))}
                          </div>
                          <span className="text-[9px] text-white/30 font-semibold uppercase tracking-wider">
                            {proj.members.length} members
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Active workspace content */}
          <div className="lg:col-span-8 flex">
            {!activeProject ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900/30 p-12 text-center backdrop-blur-md w-full">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-12 h-12 text-white/20 mb-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.97 5.97 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                </svg>
                <h3 className="text-base font-bold text-white/80">No active project selected</h3>
                <p className="mt-1 text-xs text-white/40 max-w-sm leading-normal">
                  Click a project from your sidebar dashboard, or click the '+' button to spin up a new collaboration project.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-md shadow-2xl flex flex-col w-full overflow-hidden">
                {/* Board Header details */}
                <div className="p-4 border-b border-neutral-800/80 bg-neutral-900/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-lg font-extrabold text-white tracking-wide truncate max-w-[320px]">
                      {activeProject.name}
                    </h1>
                    <p className="text-[10px] text-white/50 mt-1 line-clamp-1 max-w-[450px]">
                      {activeProject.description}
                    </p>
                  </div>

                  {/* Workspace tab selector */}
                  <div className="flex bg-neutral-950/60 p-1 rounded-xl border border-neutral-800/80 self-start md:self-auto">
                    <button
                      onClick={() => setActiveTab("tasks")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        activeTab === "tasks" ? "bg-yellow-400 text-black font-extrabold shadow-sm" : "text-white/60 hover:text-white"
                      }`}
                    >
                      📋 Kanban Tasks
                    </button>
                    <button
                      onClick={() => setActiveTab("chat")}
                      className={`relative px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        activeTab === "chat" ? "bg-yellow-400 text-black font-extrabold shadow-sm" : "text-white/60 hover:text-white"
                      }`}
                    >
                      💬 Team Chat
                      {unreadMentions[selectedProjectId] && currentUser.id === "user-3" && (
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab("members")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        activeTab === "members" ? "bg-yellow-400 text-black font-extrabold shadow-sm" : "text-white/60 hover:text-white"
                      }`}
                    >
                      👥 Team ({activeProject.members.length})
                    </button>
                  </div>
                </div>

                {/* Tab content containers */}
                <div className="flex-1 p-5 overflow-y-auto no-scrollbar flex flex-col justify-stretch">
                  
                  {/* TAB 1: KANBAN TASKS */}
                  {activeTab === "tasks" && (
                    <div className="flex flex-col gap-4 flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">
                          Task Dashboard
                        </span>
                        <button
                          onClick={openTaskModal}
                          className="inline-flex items-center gap-1 bg-yellow-400 text-black hover:bg-yellow-300 font-bold px-3 py-1.5 rounded-xl text-xs shadow-sm transition-all"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3 h-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          Add Task
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch flex-1">
                        {(["Todo", "In Progress", "Review", "Done"] as DbTask['status'][]).map((status) => {
                          const columnTasks = tasks.filter(t => t.status === status);
                          const statusColors = {
                            "Todo": "border-neutral-800 bg-neutral-950/20 text-neutral-400",
                            "In Progress": "border-blue-500/20 bg-blue-500/5 text-blue-400",
                            "Review": "border-purple-500/20 bg-purple-500/5 text-purple-400",
                            "Done": "border-green-500/20 bg-green-500/5 text-green-400"
                          };

                          return (
                            <div key={status} className={`rounded-2xl border p-3 flex flex-col gap-3 min-h-[300px] ${statusColors[status]}`}>
                              <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                                <span className="text-xs font-bold text-white tracking-wide">{status}</span>
                                <span className="px-2 py-0.5 rounded-full bg-neutral-850 border border-neutral-800 text-[10px] font-bold text-white/50">
                                  {columnTasks.length}
                                </span>
                              </div>

                              <div className="flex flex-col gap-2 overflow-y-auto max-h-[450px] no-scrollbar">
                                {columnTasks.length === 0 ? (
                                  <div className="py-8 text-center text-[10px] text-white/20 italic border border-dashed border-neutral-800/40 rounded-xl">
                                    No tasks
                                  </div>
                                ) : (
                                  columnTasks.map((task) => {
                                    const assignee = allUsers.find(u => u.id === task.assignedTo);
                                    const isOverdue = new Date(task.dueDate) < new Date() && task.status !== "Done";

                                    return (
                                      <div key={task.id} className="p-3 rounded-xl border border-neutral-800 bg-neutral-900 shadow-md flex flex-col gap-2 group/card hover:border-yellow-400/20 transition-all duration-200">
                                        <div className="flex justify-between items-start gap-1">
                                          <h4 className="text-xs font-bold text-white line-clamp-1 group-hover/card:text-yellow-300 transition-colors">
                                            {task.title}
                                          </h4>
                                          <button
                                            onClick={() => void handleDeleteTask(task.id)}
                                            className="opacity-0 group-hover/card:opacity-100 p-0.5 rounded hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-all"
                                            title="Delete Task"
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-2.5 h-2.5">
                                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.34 12.142m-10.116-6.23C9.182 3.931 12 9 12 9s2.818-5.069 3.417-6.23M15.75 12c0 2.623-1.636 4.88-4 5.75m4-5.75a6.002 6.002 0 0 0-4-5.75m4-5.75c0-2.623-1.636-4.88-4-5.75m-4 5.75c0 2.623 1.636 4.88 4 5.75m-4-5.75a6.002 6.002 0 0 1 4-5.75m4 11.5v3a2.25 2.25 0 0 1-2.25 2.25h-3.5m0-13.5v-3A2.25 2.25 0 0 0 11.25 3h-3.5" />
                                            </svg>
                                          </button>
                                        </div>
                                        <p className="text-[10px] text-white/50 line-clamp-2 leading-relaxed">
                                          {task.description}
                                        </p>

                                        <div className="flex items-center gap-1 text-[9px] mt-1 font-semibold">
                                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-2.5 h-2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                                          </svg>
                                          <span className={isOverdue ? 'text-red-400' : 'text-white/40'}>
                                            {task.dueDate} {isOverdue && "(Overdue)"}
                                          </span>
                                        </div>

                                        <div className="flex justify-between items-center mt-1 border-t border-neutral-800/40 pt-2">
                                          <div className="flex items-center gap-1.5">
                                            {assignee && (
                                              <>
                                                <div className={`w-4.5 h-4.5 rounded-full bg-gradient-to-tr ${assignee.avatarColor} flex items-center justify-center text-[7px] font-bold text-white`}>
                                                  {assignee.name[0]}
                                                </div>
                                                <span className="text-[9px] text-white/60 font-semibold">{assignee.name.split(" ")[0]}</span>
                                              </>
                                            )}
                                          </div>

                                          <div className="flex items-center gap-1">
                                            <button
                                              onClick={() => void handleMoveTask(task.id, status, 'left')}
                                              disabled={status === "Todo"}
                                              className="p-1 rounded bg-neutral-950/40 hover:bg-neutral-800 text-white/40 hover:text-white disabled:opacity-30"
                                            >
                                              ←
                                            </button>
                                            <button
                                              onClick={() => void handleMoveTask(task.id, status, 'right')}
                                              disabled={status === "Done"}
                                              className="p-1 rounded bg-neutral-950/40 hover:bg-neutral-800 text-white/40 hover:text-white disabled:opacity-30"
                                            >
                                              →
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: TEAM GROUP CHAT */}
                  {activeTab === "chat" && (
                    <div className="flex flex-col gap-4 flex-1 h-[420px] max-h-[500px]">
                      <div className="flex-1 overflow-y-auto bg-neutral-950/30 border border-neutral-800 rounded-2xl p-4 flex flex-col gap-4 no-scrollbar">
                        {messages.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-center text-white/30 italic">
                            <p>Chat room active. Use @Name to tag team members!</p>
                          </div>
                        ) : (
                          messages.map((msg) => {
                            const sender = allUsers.find(u => u.id === msg.senderId);
                            const isSelf = msg.senderId === currentUser?.id;
                            const formattedTime = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                            return (
                              <div key={msg.id} className={`flex gap-3 max-w-[85%] ${isSelf ? 'self-end flex-row-reverse' : 'self-start'}`}>
                                {sender && (
                                  <div className={`w-8 h-8 rounded-full shrink-0 bg-gradient-to-tr ${sender.avatarColor} flex items-center justify-center text-xs font-bold text-white shadow`}>
                                    {sender.name.split(" ").map(n => n[0]).join("")}
                                  </div>
                                )}
                                <div className="flex flex-col gap-1">
                                  <div className={`flex items-baseline gap-2 ${isSelf ? 'justify-end' : 'justify-start'}`}>
                                    <span className="text-[10px] font-bold text-white/60">{sender?.name}</span>
                                    <span className="text-[8px] text-white/30">{formattedTime}</span>
                                  </div>
                                  <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                                    isSelf ? 'bg-yellow-400 text-black rounded-tr-none font-medium' : 'bg-neutral-900 text-white/95 rounded-tl-none border border-neutral-800/80 shadow'
                                  }`}>
                                    {renderMessageText(msg.text)}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      <div className="relative">
                        {showMentionSuggestions && filteredSuggestions.length > 0 && (
                          <div className="absolute bottom-full left-0 mb-2 w-52 rounded-xl border border-neutral-800 bg-neutral-900 p-1.5 shadow-2xl z-20 animate-scaleUp">
                            <div className="px-2.5 py-1 text-[9px] font-bold text-white/40 tracking-wider uppercase border-b border-neutral-800/60 pb-1 mb-1">
                              Project Members:
                            </div>
                            <div className="flex flex-col max-h-[160px] overflow-y-auto no-scrollbar">
                              {filteredSuggestions.map((member, idx) => (
                                <button
                                  key={member.id}
                                  onClick={() => handleSelectSuggestion(member)}
                                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-left transition-all ${
                                    idx === suggestionIndex ? "bg-yellow-400 text-black font-bold" : "text-white/80 hover:bg-neutral-800"
                                  }`}
                                >
                                  <div className={`w-4 h-4 rounded-full bg-gradient-to-tr ${member.avatarColor} flex items-center justify-center text-[7px] font-bold text-white`}>
                                    {member.name[0]}
                                  </div>
                                  <div className="truncate">{member.name}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 items-end">
                          <textarea
                            ref={chatInputRef}
                            value={chatInput}
                            onChange={handleChatInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your message... Mention team members with @Name"
                            rows={2}
                            className="flex-1 rounded-xl border border-neutral-800 bg-neutral-950/60 p-3 text-xs text-white placeholder-white/35 outline-none focus:border-yellow-400/60 focus:bg-neutral-950 transition-all duration-200 resize-none font-sans"
                          />
                          <button
                            onClick={() => void handleSendChat()}
                            className="h-10 px-4 rounded-xl bg-yellow-400 text-black hover:bg-yellow-300 font-extrabold text-xs shadow transition-all shrink-0"
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: MEMBERS DIRECTORY */}
                  {activeTab === "members" && (
                    <div className="flex flex-col gap-4 flex-1">
                      <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">
                        Collaborative Project Directory
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {projectMembers.map((member) => {
                          const isSelf = member.id === currentUser?.id;
                          const isOnline = isSelf;

                          return (
                            <div key={member.id} className="flex items-center justify-between p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 shadow">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${member.avatarColor} flex items-center justify-center text-sm font-bold text-white shadow border border-white/10`}>
                                  {member.name.split(" ").map(n => n[0]).join("")}
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                    {member.name}
                                    {isSelf && (
                                      <span className="px-1.5 py-0.2 bg-yellow-400/10 text-yellow-300 border border-yellow-400/30 text-[8px] font-semibold uppercase rounded">
                                        You
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-white/40 mt-0.5">{member.role}</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-yellow-500/60'}`} />
                                <span className="text-[10px] text-white/40 font-medium">
                                  {isOnline ? 'Online' : 'Idle'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL DIALOGS --- */}
      {/* 1. New Project Modal */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h2 className="text-base font-bold text-white">Create Collaboration Project</h2>
              <button onClick={() => setIsProjectModalOpen(false)} className="text-white/40 hover:text-white p-1 hover:bg-neutral-800 rounded-lg">✕</button>
            </div>

            {projFormError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                ⚠️ {projFormError}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-white/50 tracking-wider uppercase">Project Name</label>
                <input
                  type="text"
                  placeholder="e.g. DawnDesk Web Client"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-3.5 py-2.5 text-xs text-white placeholder-white/20 outline-none focus:border-yellow-400/60 focus:bg-neutral-950"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-white/50 tracking-wider uppercase">Description</label>
                <textarea
                  placeholder="Summarize project milestones, visual guidelines, or task parameters..."
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  rows={3}
                  className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-3 text-xs text-white placeholder-white/20 outline-none focus:border-yellow-400/60 focus:bg-neutral-950 resize-none"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-white/50 tracking-wider uppercase">Invite Members by Email (Max 5 Total)</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="e.g. colleague@dawndesk.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1 rounded-xl border border-neutral-800 bg-neutral-950/60 px-3.5 py-2.5 text-xs text-white placeholder-white/20 outline-none focus:border-yellow-400/60 focus:bg-neutral-950"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleInviteUser();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleInviteUser}
                    className="rounded-xl bg-neutral-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-neutral-700 transition-colors shadow-sm"
                  >
                    Invite
                  </button>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  {currentUser && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/40 border border-neutral-800 opacity-70">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full bg-gradient-to-tr ${currentUser.avatarColor} flex items-center justify-center text-[8px] font-bold text-white`}>
                          {currentUser.name[0]}
                        </div>
                        <span className="text-xs text-white">{currentUser.name} (Creator)</span>
                      </div>
                    </div>
                  )}
                  {newProjMembers.map((memberId) => {
                    const user = allUsers.find(u => u.id === memberId);
                    if (!user) return null;
                    return (
                      <div key={user.id} className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/40 border border-neutral-800">
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded-full bg-gradient-to-tr ${user.avatarColor} flex items-center justify-center text-[8px] font-bold text-white`}>
                            {user.name[0]}
                          </div>
                          <span className="text-xs text-white">{user.name} ({user.email})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewProjMembers(newProjMembers.filter(id => id !== user.id))}
                          className="text-red-400 hover:text-red-300 text-xs font-bold px-2"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800/60">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="rounded-xl border border-neutral-800 bg-neutral-950/40 px-4 py-2.5 text-xs font-semibold text-white/70 hover:bg-neutral-800/60 hover:text-white"
                >
                  Cancel
                </button>
                <button type="submit" className="rounded-xl bg-yellow-400 px-5 py-2.5 text-xs font-bold text-black hover:bg-yellow-300 shadow-sm">
                  Assemble Space
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. New Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h2 className="text-base font-bold text-white">Create Kanban Task</h2>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-white/40 hover:text-white p-1 hover:bg-neutral-800 rounded-lg">✕</button>
            </div>

            {taskFormError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                ⚠️ {taskFormError}
              </div>
            )}

            <form onSubmit={handleCreateTask} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-white/50 tracking-wider uppercase">Task Title</label>
                <input
                  type="text"
                  placeholder="e.g. Audit code latency"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-3.5 py-2.5 text-xs text-white placeholder-white/20 outline-none focus:border-yellow-400/60 focus:bg-neutral-950"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-white/50 tracking-wider uppercase">Task Description</label>
                <textarea
                  placeholder="Describe scope, requirements, and target outputs..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  rows={3}
                  className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-3 text-xs text-white placeholder-white/20 outline-none focus:border-yellow-400/60 focus:bg-neutral-950 resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-white/50 tracking-wider uppercase">Assignee</label>
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-xs text-white outline-none focus:border-yellow-400/60 focus:bg-neutral-950 cursor-pointer"
                    required
                  >
                    {projectMembers.map((member) => (
                      <option key={member.id} value={member.id} className="bg-neutral-900 text-white">
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-white/50 tracking-wider uppercase">Due Date</label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-xs text-white outline-none focus:border-yellow-400/60 focus:bg-neutral-950 cursor-pointer"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800/60">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="rounded-xl border border-neutral-800 bg-neutral-950/40 px-4 py-2.5 text-xs font-semibold text-white/70 hover:bg-neutral-800/60 hover:text-white"
                >
                  Cancel
                </button>
                <button type="submit" className="rounded-xl bg-yellow-400 px-5 py-2.5 text-xs font-bold text-black hover:bg-yellow-300 shadow-sm">
                  Publish Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. SQL Schema Drawer Modal */}
      {isSchemaDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-xl rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">📋 Supabase Tables SQL Setup Script</h2>
              <button 
                onClick={() => setIsSchemaDrawerOpen(false)} 
                className="text-white/40 hover:text-white p-1 hover:bg-neutral-800 rounded-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-white/60 leading-relaxed">
              We connected successfully to your Supabase project! However, your database doesn't have the required tables yet. Copy the SQL script below, open your <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-yellow-300 hover:underline">Supabase Console</a>, navigate to the <strong className="text-white">SQL Editor</strong>, paste it, and click <strong className="text-white">Run</strong>:
            </p>

            <div className="relative">
              <pre className="bg-black/90 p-4 rounded-xl text-[10px] font-mono text-green-400 select-all max-h-[250px] overflow-y-auto leading-normal">
                {SQL_SCHEMA}
              </pre>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                onClick={() => {
                  void navigator.clipboard.writeText(SQL_SCHEMA);
                  alert("SQL Script copied to clipboard! You can paste it in your Supabase SQL editor.");
                }}
                className="rounded-xl bg-yellow-400 px-5 py-2.5 text-xs font-bold text-black hover:bg-yellow-300 transition-colors shadow"
              >
                Copy SQL Script 📋
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
