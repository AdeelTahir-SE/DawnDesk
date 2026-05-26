import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Pencil,
  Trash2,
  Check,
  X,
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

interface NotebookItem {
  id: number;
  name: string;
  parent_id: number | null;
  color: string;
  icon: string;
  sort_order: number;
  created_at: string;
}

interface NotebookTreeProps {
  notebooks: NotebookItem[];
  parentId: number | null;
  activeNotebookId: number | null;
  onSelect: (id: number) => void;
  notes: NoteItem[];
  onDelete: (id: number) => void;
  onRename: (id: number, name: string) => void;
  depth?: number;
}

export default function NotebookTree({
  notebooks,
  parentId,
  activeNotebookId,
  onSelect,
  notes,
  onDelete,
  onRename,
  depth = 0,
}: NotebookTreeProps) {
  const children = notebooks.filter((nb) =>
    parentId === null ? nb.parent_id === null : nb.parent_id === parentId
  );

  if (children.length === 0) return null;

  return (
    <div className="flex flex-col">
      {children.map((nb) => (
        <NotebookNode
          key={nb.id}
          notebook={nb}
          notebooks={notebooks}
          activeNotebookId={activeNotebookId}
          onSelect={onSelect}
          notes={notes}
          onDelete={onDelete}
          onRename={onRename}
          depth={depth}
        />
      ))}
    </div>
  );
}

function NotebookNode({
  notebook,
  notebooks,
  activeNotebookId,
  onSelect,
  notes,
  onDelete,
  onRename,
  depth,
}: {
  notebook: NotebookItem;
  notebooks: NotebookItem[];
  activeNotebookId: number | null;
  onSelect: (id: number) => void;
  notes: NoteItem[];
  onDelete: (id: number) => void;
  onRename: (id: number, name: string) => void;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(notebook.name);

  const hasChildren = notebooks.some((nb) => nb.parent_id === notebook.id);
  const noteCount = notes.filter(
    (n) => n.notebook_id === notebook.id && !n.is_deleted && !n.is_archived
  ).length;
  const isActive = activeNotebookId === notebook.id;
  const dotColor = notebook.color || "#737373";

  const handleRename = () => {
    if (editName.trim() && editName.trim() !== notebook.name) {
      onRename(notebook.id, editName.trim());
    }
    setEditing(false);
  };

  return (
    <div>
      <div
        className={`group flex items-center gap-1 rounded-lg px-2 py-1.5 cursor-pointer transition-colors ${
          isActive
            ? "bg-yellow-400/10 text-yellow-400 shadow-[inset_3px_0_0_#F7C948]"
            : "text-white/70 hover:bg-neutral-800/60 hover:text-white"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onSelect(notebook.id)}
      >
        {/* Expand toggle */}
        <button
          className="shrink-0 p-0.5 rounded hover:bg-neutral-700/50 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-white/40" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-white/40" />
            )
          ) : (
            <span className="inline-block h-3.5 w-3.5" />
          )}
        </button>

        {/* Color dot */}
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: dotColor }}
        />

        {/* Name or edit input */}
        {editing ? (
          <div className="flex items-center gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
            <input
              className="flex-1 min-w-0 bg-neutral-800 border border-neutral-700 rounded px-1.5 py-0.5 text-xs text-white outline-none focus:border-yellow-400/50"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") { setEditing(false); setEditName(notebook.name); }
              }}
              autoFocus
            />
            <button onClick={handleRename} className="p-0.5 hover:text-green-400">
              <Check className="h-3 w-3" />
            </button>
            <button onClick={() => { setEditing(false); setEditName(notebook.name); }} className="p-0.5 hover:text-red-400">
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <>
            <span className={`flex-1 truncate text-sm ${isActive ? "font-bold" : "font-medium"}`}>
              {notebook.name}
            </span>

            {/* Note count / action buttons */}
            {hovered ? (
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  className="p-1 rounded hover:bg-neutral-700/60 text-white/40 hover:text-white transition-colors"
                  onClick={(e) => { e.stopPropagation(); setEditing(true); }}
                  title="Rename"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  className="p-1 rounded hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
                  onClick={(e) => { e.stopPropagation(); onDelete(notebook.id); }}
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ) : (
              noteCount > 0 && (
                <span className="text-xs text-white/40 shrink-0">{noteCount}</span>
              )
            )}
          </>
        )}
      </div>

      {/* Render children */}
      {expanded && hasChildren && (
        <NotebookTree
          notebooks={notebooks}
          parentId={notebook.id}
          activeNotebookId={activeNotebookId}
          onSelect={onSelect}
          notes={notes}
          onDelete={onDelete}
          onRename={onRename}
          depth={depth + 1}
        />
      )}
    </div>
  );
}
