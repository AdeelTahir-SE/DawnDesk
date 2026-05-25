import { useEffect, useState } from "react";
import { pmGateway, DbTask, DbProjectMember, DbUser, DbProject } from "../../utils/supabase";

interface ProjectDashboardProps {
  projectId: string;
}

export default function ProjectDashboard({ projectId }: ProjectDashboardProps) {
  const [tasks, setTasks] = useState<DbTask[]>([]);
  const [members, setMembers] = useState<(DbProjectMember & { user?: DbUser })[]>([]);
  const [project, setProject] = useState<DbProject | null>(null);

  useEffect(() => {
    const load = async () => {
      const [t, m, p, users] = await Promise.all([
        pmGateway.getTasks(projectId),
        pmGateway.getProjectMembers(projectId),
        pmGateway.getProjects(),
        pmGateway.getRegisteredUsers()
      ]);
      setTasks(t);
      setMembers(m.map(mem => ({ ...mem, user: users.find(u => u.id === mem.userId) })));
      setProject(p.find(x => x.id === projectId) || null);
    };
    load();
  }, [projectId]);

  if (!project) return null;

  const doneColId = "col-done"; // Simplification for mock dashboard logic, in reality we'd fetch columns
  const doneTasks = tasks.filter(t => t.status.includes('done') || t.status === doneColId);
  const activeTasks = tasks.filter(t => !t.status.includes('done') && t.status !== doneColId);
  
  const upcomingTasks = [...activeTasks].sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  }).slice(0, 5);

  const progress = tasks.length === 0 ? 0 : Math.round((doneTasks.length / tasks.length) * 100);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 h-full overflow-y-auto no-scrollbar pb-12 animate-in fade-in">
      
      {/* Header Section */}
      <section className="rounded-2xl border border-neutral-800 bg-gradient-to-r from-neutral-900 to-neutral-950 p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <p className="text-xs uppercase tracking-[0.2em] text-yellow-400 font-bold">Workspace Overview</p>
        <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{project.name}</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/60 sm:text-base">
          {project.description || "Track your team's velocity and monitor upcoming deadlines."}
        </p>
      </section>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-yellow-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="text-sm text-white/60 font-medium">Total Tasks</p>
          <p className="mt-2 text-3xl font-bold text-white">{tasks.length}</p>
          <p className="mt-2 text-xs font-semibold text-yellow-300">Workspace scope</p>
        </article>
        
        <article className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-yellow-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="text-sm text-white/60 font-medium">Active Tasks</p>
          <p className="mt-2 text-3xl font-bold text-white">{activeTasks.length}</p>
          <p className="mt-2 text-xs font-semibold text-yellow-300">In progress pipeline</p>
        </article>

        <article className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-yellow-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="text-sm text-white/60 font-medium">Completed</p>
          <p className="mt-2 text-3xl font-bold text-white">{doneTasks.length}</p>
          <p className="mt-2 text-xs font-semibold text-green-400">Marked as done</p>
        </article>

        <article className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-yellow-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="text-sm text-white/60 font-medium">Team Members</p>
          <p className="mt-2 text-3xl font-bold text-white">{members.length}</p>
          <div className="mt-2 flex -space-x-2 overflow-hidden">
            {members.map(m => (
              <div key={m.userId} className={`inline-block h-5 w-5 rounded-full ring-2 ring-neutral-900 bg-gradient-to-tr ${m.user?.avatarColor || 'from-neutral-500 to-neutral-600'} flex items-center justify-center text-[8px] font-bold text-white`} title={m.user?.name}>
                {m.user?.name.charAt(0)}
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* Main Grid */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        
        {/* Left Column (8 cols) */}
        <div className="xl:col-span-8 space-y-4">
          <article className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-white">Project Velocity</h2>
            <p className="mt-1 text-xs text-white/50">Overall completion status</p>
            
            <div className="mt-6 flex flex-col gap-2">
              <div className="flex justify-between items-end text-sm">
                <span className="font-bold text-white">{progress}% Completed</span>
                <span className="text-white/40">{doneTasks.length} / {tasks.length} Tasks</span>
              </div>
              <div className="w-full bg-neutral-950/80 rounded-full h-3 overflow-hidden border border-neutral-800">
                <div 
                  className="bg-yellow-400 h-3 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(250,204,21,0.5)]" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
            </div>
          </article>

          <article className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Upcoming Deadlines</h2>
                <p className="mt-1 text-xs text-white/50">Tasks ordered by nearest due date</p>
              </div>
              <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-300">
                {upcomingTasks.length} items
              </span>
            </div>

            <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-950/60 overflow-hidden">
              {upcomingTasks.length > 0 ? (
                <ul className="divide-y divide-neutral-800">
                  {upcomingTasks.map(task => {
                    const assignee = members.find(m => m.userId === task.assignedTo)?.user;
                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
                    return (
                      <li key={task.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-neutral-900/40 transition-colors group">
                        <div className="flex items-center gap-4 min-w-0">
                          {assignee ? (
                            <div className={`shrink-0 w-8 h-8 rounded-full bg-gradient-to-tr ${assignee.avatarColor} flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-1 ring-white/10`} title={assignee.name}>
                              {assignee.name.charAt(0)}
                            </div>
                          ) : (
                            <div className="shrink-0 w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[10px] font-bold text-white/40">?</div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white/90 group-hover:text-yellow-400 transition-colors">{task.title}</p>
                            <p className="mt-1 text-xs text-white/45 flex items-center gap-2">
                              <span className={`px-1.5 py-0.5 rounded border ${
                                task.priority === 'Urgent' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                task.priority === 'High' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                'bg-neutral-800 text-white/60 border-neutral-700'
                              }`}>{task.priority}</span>
                            </p>
                          </div>
                        </div>

                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold border ${
                          isOverdue ? "bg-red-500/10 text-red-400 border-red-500/30" : "bg-neutral-800 text-white/70 border-neutral-700"
                        }`}>
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No date'}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <div className="px-4 py-6 text-sm text-white/60 text-center">
                  No active tasks with upcoming deadlines.
                </div>
              )}
            </div>
          </article>
        </div>

        {/* Right Column (4 cols) */}
        <div className="xl:col-span-4 space-y-4">
          <article className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5 h-full">
            <h2 className="text-lg font-semibold text-white">Project Members</h2>
            <p className="mt-1 text-xs text-white/50">Team roster and roles</p>
            <ul className="mt-4 space-y-3">
              {members.map(m => (
                <li key={m.userId} className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/80 px-3 py-2.5 hover:border-neutral-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full bg-gradient-to-tr ${m.user?.avatarColor || 'from-neutral-600 to-neutral-700'} flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-1 ring-white/10`}>
                      {m.user?.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-white/90">{m.user?.name}</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-yellow-400/80 font-bold">{m.role}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>

      </section>
    </div>
  );
}
