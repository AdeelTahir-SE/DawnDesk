import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Plus, GripVertical, Trash2, Calendar, Loader2, Flag, X } from "lucide-react";

export interface LocalTask {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "med" | "high";
  due_date: string | null;
  created_at: string;
}

export default function KanbanBoard({ projectId }: { projectId: number }) {
  const [tasks, setTasks] = useState<LocalTask[]>([]);
  const [loading, setLoading] = useState(true);

  // New task form state
  const [isAddingTask, setIsAddingTask] = useState<"todo" | "in_progress" | "done" | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "med" | "high">("med");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchTasks = async () => {
    try {
      const data = await invoke<LocalTask[]>("get_tasks", { projectId });
      setTasks(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const handleCreateTask = async (status: string) => {
    if (!newTaskTitle.trim()) return;
    setCreating(true);
    try {
      await invoke("create_task", {
        input: {
          project_id: projectId,
          title: newTaskTitle.trim(),
          description: newTaskDescription.trim() || null,
          status,
          priority: newTaskPriority,
          due_date: newTaskDueDate || null,
          created_at: new Date().toISOString()
        }
      });
      setIsAddingTask(null);
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskPriority("med");
      setNewTaskDueDate("");
      fetchTasks();
    } catch (e) {
      console.error(e);
    }
    setCreating(false);
  };

  const handleUpdateStatus = async (task: LocalTask, newStatus: string) => {
    try {
      // optimistic update
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus as any } : t));
      await invoke("update_task", {
        input: { ...task, status: newStatus }
      });
    } catch (e) {
      console.error(e);
      fetchTasks(); // revert on fail
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      setTasks(prev => prev.filter(t => t.id !== id));
      await invoke("delete_task", { id });
    } catch (e) {
      console.error(e);
      fetchTasks();
    }
  };

  const getPriorityColor = (p: string) => {
    if (p === 'high') return 'text-white border-neutral-700 bg-neutral-800/60';
    if (p === 'med') return 'text-white/80 border-neutral-800 bg-neutral-950/40';
    return 'text-white/50 border-neutral-800 bg-transparent';
  };

  const renderColumn = (title: string, status: "todo" | "in_progress" | "done") => {
    const columnTasks = tasks.filter(t => t.status === status);
    
    return (
      <div className="flex flex-col bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 w-full min-w-[340px] max-w-sm shrink-0 h-full overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white tracking-tight">{title}</h3>
            <span className="text-xs bg-neutral-950/60 text-white/60 px-2 py-0.5 rounded-full font-semibold">{columnTasks.length}</span>
          </div>
          <button 
            onClick={() => setIsAddingTask(status)}
            className="p-1 hover:bg-neutral-800/60 rounded-md text-white/60 hover:text-white transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 pr-2">
          {/* New Task Input */}
          {isAddingTask === status && (
            <div className="bg-neutral-800/60 border border-neutral-700 rounded-xl p-3 animate-in fade-in slide-in-from-top-2">
              <input
                autoFocus
                type="text"
                placeholder="What needs to be done?"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCreateTask(status);
                  if (e.key === 'Escape') setIsAddingTask(null);
                }}
                className="w-full bg-transparent text-sm text-white placeholder-white/35 outline-none mb-3"
              />
              <textarea
                placeholder="Add context, acceptance notes, or a handoff detail..."
                value={newTaskDescription}
                onChange={e => setNewTaskDescription(e.target.value)}
                className="mb-3 h-16 w-full resize-none rounded-lg border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-xs text-white outline-none placeholder-white/35 focus:border-yellow-400/60"
              />
              <div className="mb-3 grid grid-cols-[1fr_auto] gap-2">
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={e => setNewTaskDueDate(e.target.value)}
                  className="rounded-lg border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-xs text-white outline-none focus:border-yellow-400/60"
                />
                <span className="self-center text-[10px] font-semibold uppercase tracking-wider text-white/45">Due date</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {(['low', 'med', 'high'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setNewTaskPriority(p)}
                      className={`text-[10px] uppercase font-bold px-2 py-1 rounded border transition-colors ${newTaskPriority === p ? getPriorityColor(p) : 'border-transparent text-white/45 hover:bg-neutral-800/40'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setIsAddingTask(null)} className="p-1.5 text-white/50 hover:text-white hover:bg-neutral-800/60 rounded-md"><X className="w-4 h-4" /></button>
                  <button onClick={() => handleCreateTask(status)} disabled={creating} className="p-1.5 text-black bg-yellow-400 hover:bg-yellow-300 rounded-md">{creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}</button>
                </div>
              </div>
            </div>
          )}

          {columnTasks.map(t => (
            <div key={t.id} className="group bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 shadow-sm hover:border-neutral-700 hover:shadow-md transition-all flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex gap-2 items-start">
                  <div className="mt-0.5 cursor-grab active:cursor-grabbing text-white/35 hover:text-white/60">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <p className="text-sm text-white font-medium leading-snug">{t.title}</p>
                </div>
              </div>
              {t.description && (
                <p className="pl-6 text-xs leading-relaxed text-white/50">{t.description}</p>
              )}

              <div className="flex items-center justify-between pl-6">
                <div className="flex items-center gap-2">
                  <span className={`flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getPriorityColor(t.priority)}`}>
                    <Flag className="w-3 h-3" /> {t.priority}
                  </span>
                  {t.due_date && (
                    <span className="flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-neutral-950/40 border border-neutral-800 text-white/60">
                      <Calendar className="w-3 h-3" /> {new Date(t.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <select 
                    value={t.status}
                    onChange={(e) => handleUpdateStatus(t, e.target.value)}
                    className="bg-neutral-950 border border-neutral-800 rounded-md text-xs text-white/60 outline-none px-1 py-1"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">Doing</option>
                    <option value="done">Done</option>
                  </select>
                  <button onClick={() => handleDeleteTask(t.id)} className="p-1.5 text-white/45 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {columnTasks.length === 0 && isAddingTask !== status && (
            <div className="py-8 flex flex-col items-center justify-center text-white/35 border-2 border-dashed border-neutral-800 rounded-xl">
              <span className="text-sm font-medium">No tasks</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 text-white/45 animate-spin" /></div>;
  }

  return (
    <div className="flex gap-6 h-full overflow-x-auto pb-4 custom-scrollbar items-start">
      {renderColumn("To Do", "todo")}
      {renderColumn("In Progress", "in_progress")}
      {renderColumn("Done", "done")}
    </div>
  );
}
