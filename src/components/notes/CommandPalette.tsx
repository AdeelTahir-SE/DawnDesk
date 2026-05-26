import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Command,
  FilePlus,
  FolderPlus,
  Tag,
  Focus,
  Moon,
  FileText,
  Clock,
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

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  notes: NoteItem[];
  onNoteSelect: (id: number) => void;
  onAction: (action: string) => void;
}

interface CommandItem {
  id: string;
  type: "note" | "action";
  label: string;
  sublabel?: string;
  icon: React.ElementType;
  noteId?: number;
  action?: string;
}

const ACTIONS: CommandItem[] = [
  { id: "new-note", type: "action", label: "New Note", icon: FilePlus, action: "new-note" },
  { id: "new-notebook", type: "action", label: "New Notebook", icon: FolderPlus, action: "new-notebook" },
  { id: "new-tag", type: "action", label: "New Tag", icon: Tag, action: "new-tag" },
  { id: "toggle-focus", type: "action", label: "Toggle Focus Mode", icon: Focus, action: "toggle-focus" },
  { id: "toggle-dark", type: "action", label: "Toggle Dark Mode", icon: Moon, action: "toggle-dark" },
];

function fuzzyMatch(text: string, query: string): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export default function CommandPalette({
  isOpen,
  onClose,
  notes,
  onNoteSelect,
  onAction,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global Ctrl+K handler
  useEffect(() => {
    // This effect is only for information — parent handles opening.
    // We handle Escape internally.
  }, []);

  // Build items list
  const items = useMemo((): CommandItem[] => {
    const q = query.trim();

    // Recent notes (non-deleted, sorted by updated_at)
    const recentNotes: CommandItem[] = notes
      .filter((n) => !n.is_deleted)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 8)
      .map((n) => ({
        id: `note-${n.id}`,
        type: "note" as const,
        label: n.title || "Untitled",
        sublabel: formatDate(n.updated_at),
        icon: FileText,
        noteId: n.id,
      }));

    if (!q) {
      return [...recentNotes, ...ACTIONS];
    }

    // Filter by fuzzy match
    const matchedNotes = notes
      .filter((n) => !n.is_deleted && fuzzyMatch(n.title || "Untitled", q))
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 10)
      .map((n) => ({
        id: `note-${n.id}`,
        type: "note" as const,
        label: n.title || "Untitled",
        sublabel: formatDate(n.updated_at),
        icon: FileText,
        noteId: n.id,
      }));

    const matchedActions = ACTIONS.filter((a) =>
      fuzzyMatch(a.label, q)
    );

    return [...matchedNotes, ...matchedActions];
  }, [query, notes]);

  // Keep selectedIdx in bounds
  useEffect(() => {
    if (selectedIdx >= items.length) setSelectedIdx(Math.max(0, items.length - 1));
  }, [items.length, selectedIdx]);

  // Scroll selected into view
  useEffect(() => {
    if (listRef.current) {
      const el = listRef.current.querySelector(`[data-idx="${selectedIdx}"]`) as HTMLElement | null;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIdx]);

  const handleSelect = useCallback(
    (item: CommandItem) => {
      if (item.type === "note" && item.noteId !== undefined) {
        onNoteSelect(item.noteId);
      } else if (item.type === "action" && item.action) {
        onAction(item.action);
      }
      onClose();
    },
    [onNoteSelect, onAction, onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, items.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (items[selectedIdx]) handleSelect(items[selectedIdx]);
      }
    },
    [items, selectedIdx, onClose, handleSelect]
  );

  if (!isOpen) return null;

  // Find section breaks for rendering headers
  const noteItems = items.filter((i) => i.type === "note");
  const actionItems = items.filter((i) => i.type === "action");

  return (
    <div
      className="fixed inset-0 z-[110] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-[520px] rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl shadow-black/50 overflow-hidden animate-in zoom-in-95 duration-200"
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-neutral-800 px-4 py-3">
          <Command className="h-5 w-5 shrink-0 text-yellow-400/60" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-base text-white placeholder:text-white/30 outline-none"
            placeholder="Type a command or search…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIdx(0);
            }}
          />
          <div className="flex items-center gap-1 shrink-0">
            <kbd className="rounded border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-[10px] text-white/30">
              ESC
            </kbd>
          </div>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[360px] overflow-y-auto custom-scrollbar py-1">
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Command className="h-8 w-8 text-white/10 mx-auto mb-2" />
              <p className="text-sm text-white/40">No matching commands or notes</p>
            </div>
          ) : (
            <>
              {/* Notes section */}
              {noteItems.length > 0 && (
                <>
                  <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/25">
                    {query.trim() ? "Notes" : "Recent Notes"}
                  </p>
                  {noteItems.map((item) => {
                    const globalIdx = items.indexOf(item);
                    return (
                      <PaletteItem
                        key={item.id}
                        item={item}
                        isSelected={globalIdx === selectedIdx}
                        dataIdx={globalIdx}
                        onSelect={handleSelect}
                        onHover={() => setSelectedIdx(globalIdx)}
                      />
                    );
                  })}
                </>
              )}

              {/* Actions section */}
              {actionItems.length > 0 && (
                <>
                  {noteItems.length > 0 && (
                    <div className="mx-3 my-1 border-t border-neutral-800/50" />
                  )}
                  <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/25">
                    Actions
                  </p>
                  {actionItems.map((item) => {
                    const globalIdx = items.indexOf(item);
                    return (
                      <PaletteItem
                        key={item.id}
                        item={item}
                        isSelected={globalIdx === selectedIdx}
                        dataIdx={globalIdx}
                        onSelect={handleSelect}
                        onHover={() => setSelectedIdx(globalIdx)}
                      />
                    );
                  })}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 border-t border-neutral-800/60 px-4 py-2 text-[10px] text-white/20">
          <span>
            <kbd className="rounded border border-neutral-700 bg-neutral-800 px-1 py-0.5 text-white/40">↑↓</kbd> navigate
          </span>
          <span>
            <kbd className="rounded border border-neutral-700 bg-neutral-800 px-1 py-0.5 text-white/40">↵</kbd> select
          </span>
          <span>
            <kbd className="rounded border border-neutral-700 bg-neutral-800 px-1 py-0.5 text-white/40">esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Single palette item ─── */

function PaletteItem({
  item,
  isSelected,
  dataIdx,
  onSelect,
  onHover,
}: {
  item: CommandItem;
  isSelected: boolean;
  dataIdx: number;
  onSelect: (item: CommandItem) => void;
  onHover: () => void;
}) {
  const Icon = item.icon;

  return (
    <button
      data-idx={dataIdx}
      className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors ${
        isSelected
          ? "bg-yellow-400/10 text-yellow-400"
          : "text-white/70 hover:bg-neutral-800/50 hover:text-white"
      }`}
      onClick={() => onSelect(item)}
      onMouseEnter={onHover}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isSelected ? "bg-yellow-400/20" : "bg-neutral-800/60"
        }`}
      >
        <Icon className={`h-4 w-4 ${isSelected ? "text-yellow-400" : "text-white/40"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isSelected ? "text-yellow-400" : "text-white"}`}>
          {item.label}
        </p>
        {item.sublabel && (
          <p className="text-[10px] text-white/30 flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />
            {item.sublabel}
          </p>
        )}
      </div>
      {item.type === "action" && (
        <span className="text-[10px] text-white/20 shrink-0">Action</span>
      )}
    </button>
  );
}
