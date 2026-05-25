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
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "med" | "high">("med");
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
          description: null,
          status,
          priority: newTaskPriority,
          due_date: null,
          created_at: new Date().toISOString()
        }
      });
      setIsAddingTask(null);
      setNewTaskTitle("");
      setNewTaskPriority("med");
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
    if (p === 'high') return 'text-white border-white/50 bg-white/10';
    if (p === 'med') return 'text-white/70 border-white/20 bg-white/5';
    return 'text-white/40 border-white/10 bg-transparent';
  };

  const renderColumn = (title: string, status: "todo" | "in_progress" | "done") => {
    const columnTasks = tasks.filter(t => t.status === status);
    
    return (
      <div className="flex flex-col bg-neutral-900/40 border border-white/5 rounded-2xl p-4 w-full min-w-[320px] max-w-sm shrink-0 h-full overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white tracking-tight">{title}</h3>
            <span className="text-xs bg-black/40 text-white/50 px-2 py-0.5 rounded-full font-bold">{columnTasks.length}</span>
          </div>
          <button 
            onClick={() => setIsAddingTask(status)}
            className="p-1 hover:bg-white/10 rounded-md text-white/50 hover:text-white transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 pr-2">
          {/* New Task Input */}
          {isAddingTask === status && (
            <div className="bg-neutral-800 border border-white/20 rounded-xl p-3 animate-in fade-in slide-in-from-top-2">
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
                className="w-full bg-transparent text-sm text-white placeholder-white/30 outline-none mb-3"
              />
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {(['low', 'med', 'high'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setNewTaskPriority(p)}
                      className={`text-[10px] uppercase font-bold px-2 py-1 rounded border transition-colors ${newTaskPriority === p ? getPriorityColor(p) : 'border-transparent text-white/30 hover:bg-white/5'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setIsAddingTask(null)} className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-md"><X className="w-4 h-4" /></button>
                  <button onClick={() => handleCreateTask(status)} disabled={creating} className="p-1.5 text-black bg-yellow-400 hover:bg-yellow-300 rounded-md">{creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}</button>
                </div>
              </div>
            </div>
          )}

          {columnTasks.map(t => (
            <div key={t.id} className="group bg-neutral-900 border border-white/5 rounded-xl p-4 shadow-sm hover:border-white/20 hover:shadow-md transition-all flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex gap-2 items-start">
                  <div className="mt-0.5 cursor-grab active:cursor-grabbing text-white/20 hover:text-white/50">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <p className="text-sm text-white font-medium leading-snug">{t.title}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pl-6">
                <div className="flex items-center gap-2">
                  <span className={`flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getPriorityColor(t.priority)}`}>
                    <Flag className="w-3 h-3" /> {t.priority}
                  </span>
                  {t.due_date && (
                    <span className="flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/50">
                      <Calendar className="w-3 h-3" /> {new Date(t.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <select 
                    value={t.status}
                    onChange={(e) => handleUpdateStatus(t, e.target.value)}
                    className="bg-black/50 border border-white/10 rounded-md text-xs text-white/70 outline-none px-1 py-1"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">Doing</option>
                    <option value="done">Done</option>
                  </select>
                  <button onClick={() => handleDeleteTask(t.id)} className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {columnTasks.length === 0 && isAddingTask !== status && (
            <div className="py-8 flex flex-col items-center justify-center text-white/20 border-2 border-dashed border-white/5 rounded-xl">
              <span className="text-sm font-medium">No tasks</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 text-white/30 animate-spin" /></div>;
  }

  return (
    <div className="flex gap-6 h-full overflow-x-auto pb-4 custom-scrollbar items-start">
      {renderColumn("To Do", "todo")}
      {renderColumn("In Progress", "in_progress")}
      {renderColumn("Done", "done")}
    </div>
  );
}
