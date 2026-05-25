import React, { useState, useEffect } from "react";
import { pmGateway, DbTask, DbKanbanColumn, DbProjectMember, DbUser } from "../../utils/supabase";
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Edit2, Trash2, Calendar } from "lucide-react";

interface KanbanBoardProps {
  projectId: string;
  currentUser: DbUser;
}

// ------------------------------------
// TASK CARD COMPONENT (Sortable)
// ------------------------------------
const TaskCard = ({ task, members, onEdit, onDelete }: { task: DbTask; members: any[]; onEdit: (t: DbTask) => void; onDelete: (id: string) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, data: { type: "Task", task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const assignee = members.find(m => m.userId === task.assignedTo)?.user;
  const isOverdue = new Date(task.dueDate).getTime() < Date.now();

  const priorityColors: Record<string, string> = {
    Low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    High: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    Urgent: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group bg-neutral-900 border border-neutral-800 rounded-xl p-3 cursor-grab hover:border-yellow-400/50 hover:shadow-[0_0_15px_rgba(250,204,21,0.05)] transition-all active:cursor-grabbing relative"
    >
      <div className="flex justify-between items-start mb-2 gap-2">
        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onPointerDown={(e) => { e.stopPropagation(); onEdit(task); }} className="p-1 hover:bg-neutral-800 rounded text-white/50 hover:text-yellow-400"><Edit2 className="w-3 h-3" /></button>
          <button onPointerDown={(e) => { e.stopPropagation(); onDelete(task.id); }} className="p-1 hover:bg-neutral-800 rounded text-white/50 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
        </div>
      </div>
      
      <h4 className="text-xs font-bold text-white mb-2 leading-tight">{task.title}</h4>
      
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-800/80">
        <div className={`flex items-center gap-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded ${isOverdue ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-white/40'}`}>
          <Calendar className="w-3 h-3" />
          {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </div>
        
        {assignee && (
          <div title={assignee.name} className={`w-5 h-5 rounded-full bg-gradient-to-tr ${assignee.avatarColor} flex items-center justify-center text-[8px] font-bold text-white shadow-sm`}>
            {assignee.name.charAt(0)}
          </div>
        )}
      </div>
    </div>
  );
};

// ------------------------------------
// COLUMN COMPONENT
// ------------------------------------
const KanbanColumn = ({ column, tasks, members, onEditTask, onDeleteTask }: { column: DbKanbanColumn; tasks: DbTask[]; members: any[]; onEditTask: any; onDeleteTask: any }) => {
  const { setNodeRef } = useSortable({ id: column.id, data: { type: "Column", column } });

  return (
    <div className="flex flex-col bg-neutral-950/40 border border-neutral-800/80 rounded-2xl w-[300px] flex-shrink-0 max-h-full">
      <div className="p-3 border-b border-neutral-800/80 flex justify-between items-center bg-neutral-900/60 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-white/80">{column.name}</h3>
          <span className="bg-neutral-800 text-white/50 text-[10px] font-bold px-2 py-0.5 rounded-full">{tasks.length}</span>
        </div>
      </div>

      <div ref={setNodeRef} className="flex-1 overflow-y-auto p-2 flex flex-col gap-2 min-h-[150px]">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} members={members} onEdit={onEditTask} onDelete={onDeleteTask} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

// ------------------------------------
// MAIN BOARD COMPONENT
// ------------------------------------
export default function KanbanBoard({ projectId, currentUser }: KanbanBoardProps) {
  const [columns, setColumns] = useState<DbKanbanColumn[]>([]);
  const [tasks, setTasks] = useState<DbTask[]>([]);
  const [members, setMembers] = useState<(DbProjectMember & { user?: DbUser })[]>([]);
  
  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DbTask | null>(null);

  // Form State
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskStatus, setTaskStatus] = useState("");
  const [taskPriority, setTaskPriority] = useState<DbTask['priority']>("Medium");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const loadData = async () => {
    const [cols, tsks, mems, users] = await Promise.all([
      pmGateway.getColumns(projectId),
      pmGateway.getTasks(projectId),
      pmGateway.getProjectMembers(projectId),
      pmGateway.getRegisteredUsers()
    ]);
    setColumns(cols);
    setTasks(tsks);
    setMembers(mems.map(m => ({ ...m, user: users.find(u => u.id === m.userId) })));
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === "Task";
    const isOverTask = over.data.current?.type === "Task";
    const isOverColumn = over.data.current?.type === "Column";

    if (isActiveTask) {
      const activeTask = tasks.find(t => t.id === activeId);
      if (!activeTask) return;

      let newStatus = activeTask.status;

      if (isOverTask) {
        const overTask = tasks.find(t => t.id === overId);
        if (overTask) newStatus = overTask.status;
      } else if (isOverColumn) {
        newStatus = overId;
      }

      if (activeTask.status !== newStatus) {
        setTasks(prev => prev.map(t => t.id === activeId ? { ...t, status: newStatus } : t));
        await pmGateway.updateTask(activeId, { status: newStatus });
      }
    }
  };

  const openTaskModal = (task?: DbTask) => {
    if (task) {
      setEditingTask(task);
      setTaskTitle(task.title);
      setTaskDesc(task.description);
      setTaskStatus(task.status);
      setTaskPriority(task.priority);
      setTaskAssignee(task.assignedTo);
      setTaskDueDate(task.dueDate);
    } else {
      setEditingTask(null);
      setTaskTitle("");
      setTaskDesc("");
      setTaskStatus(columns.length > 0 ? columns[0].id : "");
      setTaskPriority("Medium");
      setTaskAssignee(members[0]?.userId || currentUser.id);
      setTaskDueDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    }
    setIsTaskModalOpen(true);
  };

  const saveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskStatus) return;

    if (editingTask) {
      await pmGateway.updateTask(editingTask.id, {
        title: taskTitle,
        description: taskDesc,
        status: taskStatus,
        priority: taskPriority,
        assignedTo: taskAssignee,
        dueDate: taskDueDate
      });
    } else {
      await pmGateway.createTask(
        projectId, taskTitle, taskDesc, taskStatus, taskPriority, taskAssignee, currentUser.id, taskDueDate
      );
    }
    setIsTaskModalOpen(false);
    loadData();
  };

  const deleteTask = async (id: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      await pmGateway.deleteTask(id);
      loadData();
    }
  };

  const addColumn = async () => {
    const name = prompt("Enter new column name:");
    if (name && name.trim()) {
      await pmGateway.createColumn(projectId, name.trim());
      loadData();
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex justify-between items-center mb-4 px-2">
        <h2 className="text-lg font-bold text-white">Board</h2>
        <div className="flex gap-2">
          <button onClick={() => openTaskModal()} className="flex items-center gap-1.5 bg-yellow-400 text-black px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-yellow-300">
            <Plus className="w-4 h-4" /> New Task
          </button>
          <button onClick={addColumn} className="flex items-center gap-1.5 bg-neutral-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-neutral-700">
            <Plus className="w-4 h-4" /> Add Column
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 h-full items-start px-2">
            {columns.map(col => (
              <KanbanColumn 
                key={col.id} 
                column={col} 
                tasks={tasks.filter(t => t.status === col.id)} 
                members={members}
                onEditTask={openTaskModal}
                onDeleteTask={deleteTask}
              />
            ))}
          </div>
        </DndContext>
      </div>

      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 flex flex-col text-white">
            <h2 className="text-lg font-bold mb-4">{editingTask ? "Edit Task" : "Create Task"}</h2>
            
            <form onSubmit={saveTask} className="flex flex-col gap-4">
              <input 
                type="text" value={taskTitle} onChange={e=>setTaskTitle(e.target.value)} 
                placeholder="Task Title" className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-400/50" required
              />
              
              <textarea 
                value={taskDesc} onChange={e=>setTaskDesc(e.target.value)} 
                placeholder="Description (Markdown supported)" className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-400/50 min-h-[100px] resize-y"
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-white/50 uppercase">Status</label>
                  <select value={taskStatus} onChange={e=>setTaskStatus(e.target.value)} className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs outline-none">
                    {columns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-white/50 uppercase">Priority</label>
                  <select value={taskPriority} onChange={e=>setTaskPriority(e.target.value as any)} className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs outline-none">
                    <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-white/50 uppercase">Assignee</label>
                  <select value={taskAssignee} onChange={e=>setTaskAssignee(e.target.value)} className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs outline-none">
                    {members.map(m => <option key={m.userId} value={m.userId}>{m.user?.name || m.userId}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-white/50 uppercase">Due Date</label>
                  <input type="date" value={taskDueDate} onChange={e=>setTaskDueDate(e.target.value)} className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs outline-none" required />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="px-4 py-2 text-xs font-bold text-white/60 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2 text-xs font-bold bg-yellow-400 text-black rounded-xl hover:bg-yellow-300 transition-colors">Save Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
