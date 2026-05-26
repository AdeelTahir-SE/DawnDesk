import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  ClipboardList,
  ListChecks,
  StickyNote,
} from "lucide-react";

interface NoteItem {
  id: number;
  title: string;
  content: string;
  notebook_id: number | null;
  is_pinned: boolean;
  is_favorite: boolean;
  is_archived: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  color: string;
  word_count: number;
  char_count: number;
  reading_time_minutes: number;
  is_daily_note: boolean;
  daily_date: string | null;
  created_at: string;
  updated_at: string;
}

interface TaskItem {
  text: string;
  completed: boolean;
  noteId: number;
  noteTitle: string;
}

interface Props {
  notes: NoteItem[];
  onNoteSelect: (noteId: number) => void;
}

const FILTER_TABS = ["All", "Today", "Overdue", "Completed"] as const;
type FilterTab = (typeof FILTER_TABS)[number];

function extractTasks(notes: NoteItem[]): TaskItem[] {
  const tasks: TaskItem[] = [];

  for (const note of notes) {
    if (note.is_deleted || note.is_archived) continue;

    const content = note.content;
    const noteTitle = note.title || "Untitled";

    // Parse markdown checkboxes: - [ ] and - [x]
    const mdRegex = /^[\s]*[-*]\s\[([ xX])\]\s*(.+)$/gm;
    let match: RegExpExecArray | null;
    while ((match = mdRegex.exec(content)) !== null) {
      tasks.push({
        text: match[2].trim(),
        completed: match[1].toLowerCase() === "x",
        noteId: note.id,
        noteTitle,
      });
    }

    // Parse HTML checkboxes: <input type="checkbox" ...>
    const htmlRegex =
      /<input[^>]*type=["']checkbox["'][^>]*(checked)?[^>]*>\s*(?:<[^>]*>)*\s*(.*?)(?:<\/|$)/gi;
    while ((match = htmlRegex.exec(content)) !== null) {
      const text = match[2].replace(/<[^>]*>/g, "").trim();
      if (text) {
        tasks.push({
          text,
          completed: !!match[1],
          noteId: note.id,
          noteTitle,
        });
      }
    }

    // Parse <li data-checked="true|false"> style (Tiptap/ProseMirror)
    const liRegex =
      /<li[^>]*data-checked=["'](true|false)["'][^>]*>(.*?)<\/li>/gi;
    while ((match = liRegex.exec(content)) !== null) {
      const text = match[2].replace(/<[^>]*>/g, "").trim();
      if (text) {
        tasks.push({
          text,
          completed: match[1] === "true",
          noteId: note.id,
          noteTitle,
        });
      }
    }
  }

  return tasks;
}

export default function TasksView({ notes, onNoteSelect }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All");

  const allTasks = useMemo(() => extractTasks(notes), [notes]);

  const filteredTasks = useMemo(() => {
    switch (activeFilter) {
      case "Completed":
        return allTasks.filter((t) => t.completed);
      case "Today": {
        // Tasks from today's daily notes
        const todayStr = new Date().toISOString().slice(0, 10);
        const todayNoteIds = new Set(
          notes
            .filter(
              (n) =>
                n.is_daily_note && n.daily_date?.slice(0, 10) === todayStr
            )
            .map((n) => n.id)
        );
        return allTasks.filter((t) => todayNoteIds.has(t.noteId));
      }
      case "Overdue": {
        // Tasks from past daily notes that are not completed
        const todayStr = new Date().toISOString().slice(0, 10);
        const pastNoteIds = new Set(
          notes
            .filter(
              (n) =>
                n.is_daily_note &&
                n.daily_date &&
                n.daily_date.slice(0, 10) < todayStr
            )
            .map((n) => n.id)
        );
        return allTasks.filter(
          (t) => !t.completed && pastNoteIds.has(t.noteId)
        );
      }
      default:
        return allTasks;
    }
  }, [allTasks, activeFilter, notes]);

  const completedCount = allTasks.filter((t) => t.completed).length;
  const completionPct =
    allTasks.length > 0 ? Math.round((completedCount / allTasks.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-400">
            Task Tracker
          </p>
          <h2 className="mt-2 font-heading text-3xl font-black tracking-tight text-white">
            Tasks
          </h2>
          <p className="mt-2 text-sm text-white/60">
            All checklist items across your notes.
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900/60 text-yellow-400">
            <ListChecks className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold text-white/50">Total Tasks</p>
          <p className="mt-1 text-2xl font-black text-white">{allTasks.length}</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900/60 text-green-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold text-white/50">Completed</p>
          <p className="mt-1 text-2xl font-black text-green-400">{completedCount}</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900/60 text-blue-400">
            <ClipboardList className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold text-white/50">Completion</p>
          <p className="mt-1 text-2xl font-black text-blue-400">{completionPct}%</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`
              rounded-lg px-4 py-2 text-sm font-semibold transition-colors
              ${
                activeFilter === tab
                  ? "bg-yellow-400/10 text-yellow-400 shadow-[inset_3px_0_0_#F7C948]"
                  : "text-white/50 hover:bg-neutral-800/50 hover:text-white/70"
              }
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 shadow-lg shadow-black/20">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <StickyNote className="mb-4 h-12 w-12 text-white/15" />
            <h3 className="text-lg font-bold text-white">No tasks found across your notes</h3>
            <p className="mt-2 text-sm text-white/40">
              Add checklists to your notes using "- [ ]" syntax
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {filteredTasks.map((task, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-neutral-900/60"
              >
                {/* Checkbox indicator */}
                {task.completed ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-white/25" />
                )}

                {/* Task text */}
                <p
                  className={`flex-1 text-sm ${
                    task.completed
                      ? "text-white/30 line-through"
                      : "font-medium text-white"
                  }`}
                >
                  {task.text}
                </p>

                {/* Parent note link */}
                <button
                  onClick={() => onNoteSelect(task.noteId)}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1 text-xs font-medium text-white/40 transition-colors hover:border-neutral-700 hover:text-white/60"
                >
                  <StickyNote className="h-3 w-3" />
                  {task.noteTitle.length > 20
                    ? task.noteTitle.slice(0, 18) + "…"
                    : task.noteTitle}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
