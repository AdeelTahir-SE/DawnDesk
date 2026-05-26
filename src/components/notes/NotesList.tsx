import { useState, useMemo } from "react";
import {
  Plus,
  Pin,
  Heart,
  Trash2,
  List,
  LayoutGrid,
  ChevronDown,
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

interface NotesListProps {
  notes: NoteItem[];
  activeNoteId: number | null;
  onNoteSelect: (id: number) => void;
  onCreateNote: () => void;
  onDeleteNote: (id: number) => void;
  onTogglePin: (id: number) => void;
  onToggleFavorite: (id: number) => void;
  viewMode: "list" | "grid";
  onViewModeChange: (mode: "list" | "grid") => void;
  sortBy: "updated" | "created" | "title";
  onSortChange: (sort: "updated" | "created" | "title") => void;
  title: string;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function getSnippet(content: string, len = 80): string {
  const clean = content.replace(/[#*_\->\[\]`~]/g, "").trim();
  return clean.length > len ? clean.slice(0, len) + "…" : clean;
}

export default function NotesList({
  notes,
  activeNoteId,
  onNoteSelect,
  onCreateNote,
  onDeleteNote,
  onTogglePin,
  onToggleFavorite,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  title,
}: NotesListProps) {
  const [sortOpen, setSortOpen] = useState(false);

  const sortedNotes = useMemo(() => {
    const arr = [...notes];
    switch (sortBy) {
      case "title":
        arr.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "created":
        arr.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case "updated":
      default:
        arr.sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
    }
    return arr;
  }, [notes, sortBy]);

  const pinnedNotes = sortedNotes.filter((n) => n.is_pinned);
  const unpinnedNotes = sortedNotes.filter((n) => !n.is_pinned);

  const sortLabels = {
    updated: "Last Updated",
    created: "Date Created",
    title: "Title A–Z",
  };

  return (
    <div className="flex h-full min-w-[300px] max-w-[380px] w-full flex-col border-r border-neutral-800 bg-neutral-950 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-neutral-800/60 px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="font-heading text-base font-bold text-white truncate">{title}</h2>
            <p className="text-xs text-white/40 mt-0.5">
              {notes.length} {notes.length === 1 ? "note" : "notes"}
            </p>
          </div>
          <button
            className="flex items-center gap-1.5 rounded-lg bg-yellow-400/10 px-3 py-1.5 text-sm font-semibold text-yellow-400 hover:bg-yellow-400/20 transition-colors shrink-0"
            onClick={onCreateNote}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New</span>
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-3 gap-2">
          {/* Sort dropdown */}
          <div className="relative">
            <button
              className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/60 px-2.5 py-1.5 text-xs font-medium text-white/50 hover:text-white/80 transition-colors"
              onClick={() => setSortOpen(!sortOpen)}
            >
              <Clock className="h-3 w-3" />
              {sortLabels[sortBy]}
              <ChevronDown className="h-3 w-3" />
            </button>
            {sortOpen && (
              <div className="absolute left-0 top-full mt-1 z-50 min-w-[150px] rounded-xl border border-neutral-800 bg-neutral-900 shadow-xl shadow-black/30 py-1">
                {(["updated", "created", "title"] as const).map((s) => (
                  <button
                    key={s}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                      sortBy === s
                        ? "text-yellow-400 bg-yellow-400/10"
                        : "text-white/60 hover:bg-neutral-800 hover:text-white"
                    }`}
                    onClick={() => {
                      onSortChange(s);
                      setSortOpen(false);
                    }}
                  >
                    {sortLabels[s]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View mode toggle */}
          <div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-900/60">
            <button
              className={`p-1.5 rounded-l-lg transition-colors ${
                viewMode === "list"
                  ? "bg-yellow-400/10 text-yellow-400"
                  : "text-white/40 hover:text-white/70"
              }`}
              onClick={() => onViewModeChange("list")}
              title="List view"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              className={`p-1.5 rounded-r-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-yellow-400/10 text-yellow-400"
                  : "text-white/40 hover:text-white/70"
              }`}
              onClick={() => onViewModeChange("grid")}
              title="Grid view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {notes.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-900/60 border border-neutral-800 mb-4">
              <FileText className="h-8 w-8 text-white/20" />
            </div>
            <p className="text-sm font-semibold text-white/50 mb-1">No notes yet</p>
            <p className="text-xs text-white/30 mb-4 max-w-[200px]">
              Create your first note to start capturing your ideas.
            </p>
            <button
              className="flex items-center gap-1.5 rounded-lg bg-yellow-400/10 px-4 py-2 text-sm font-semibold text-yellow-400 hover:bg-yellow-400/20 transition-colors"
              onClick={onCreateNote}
            >
              <Plus className="h-4 w-4" />
              Create Note
            </button>
          </div>
        ) : viewMode === "list" ? (
          /* List view */
          <div className="flex flex-col py-1">
            {/* Pinned section */}
            {pinnedNotes.length > 0 && (
              <>
                <div className="flex items-center gap-1.5 px-4 py-2">
                  <Pin className="h-3 w-3 text-yellow-400/60" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-yellow-400/60">
                    Pinned
                  </span>
                </div>
                {pinnedNotes.map((note) => (
                  <NoteRow
                    key={note.id}
                    note={note}
                    isActive={activeNoteId === note.id}
                    onSelect={onNoteSelect}
                    onDelete={onDeleteNote}
                    onTogglePin={onTogglePin}
                    onToggleFavorite={onToggleFavorite}
                  />
                ))}
                {unpinnedNotes.length > 0 && (
                  <div className="mx-4 my-1.5 border-t border-neutral-800/40" />
                )}
              </>
            )}

            {/* Unpinned */}
            {unpinnedNotes.map((note) => (
              <NoteRow
                key={note.id}
                note={note}
                isActive={activeNoteId === note.id}
                onSelect={onNoteSelect}
                onDelete={onDeleteNote}
                onTogglePin={onTogglePin}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        ) : (
          /* Grid view */
          <div className="grid grid-cols-2 gap-2 p-3">
            {pinnedNotes.concat(unpinnedNotes).map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                isActive={activeNoteId === note.id}
                onSelect={onNoteSelect}
                onDelete={onDeleteNote}
                onTogglePin={onTogglePin}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── List row ─── */

function NoteRow({
  note,
  isActive,
  onSelect,
  onDelete,
  onTogglePin,
  onToggleFavorite,
}: {
  note: NoteItem;
  isActive: boolean;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onTogglePin: (id: number) => void;
  onToggleFavorite: (id: number) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`group relative flex flex-col gap-1 px-4 py-2.5 cursor-pointer transition-colors ${
        isActive
          ? "bg-yellow-400/5 border-l-2 border-yellow-400"
          : "border-l-2 border-transparent hover:bg-neutral-900/80"
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(note.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          className={`text-sm font-semibold truncate ${
            isActive ? "text-yellow-400" : "text-white"
          }`}
        >
          {note.title || "Untitled"}
        </h3>
        <div className="flex items-center gap-0.5 shrink-0">
          {hovered ? (
            <>
              <button
                className={`p-1 rounded hover:bg-neutral-700/60 transition-colors ${
                  note.is_pinned ? "text-yellow-400" : "text-white/30 hover:text-white/60"
                }`}
                onClick={(e) => { e.stopPropagation(); onTogglePin(note.id); }}
                title={note.is_pinned ? "Unpin" : "Pin"}
              >
                <Pin className="h-3 w-3" />
              </button>
              <button
                className={`p-1 rounded hover:bg-neutral-700/60 transition-colors ${
                  note.is_favorite ? "text-red-400" : "text-white/30 hover:text-white/60"
                }`}
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(note.id); }}
                title={note.is_favorite ? "Unfavorite" : "Favorite"}
              >
                <Heart className={`h-3 w-3 ${note.is_favorite ? "fill-red-400" : ""}`} />
              </button>
              <button
                className="p-1 rounded hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors"
                onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
                title="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </>
          ) : (
            <>
              {note.is_pinned && <Pin className="h-3 w-3 text-yellow-400/50" />}
              {note.is_favorite && (
                <Heart className="h-3 w-3 text-red-400/50 fill-red-400/50" />
              )}
            </>
          )}
        </div>
      </div>

      {note.content && (
        <p className="text-xs text-white/40 truncate leading-relaxed">
          {getSnippet(note.content)}
        </p>
      )}

      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-[10px] text-white/25">{formatDate(note.updated_at)}</span>
        {note.word_count > 0 && (
          <span className="text-[10px] text-white/25">
            {note.word_count} {note.word_count === 1 ? "word" : "words"}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Grid card ─── */

function NoteCard({
  note,
  isActive,
  onSelect,
  onDelete,
  onTogglePin,
  onToggleFavorite,
}: {
  note: NoteItem;
  isActive: boolean;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onTogglePin: (id: number) => void;
  onToggleFavorite: (id: number) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`group relative flex flex-col gap-2 rounded-xl border p-3 cursor-pointer transition-all ${
        isActive
          ? "border-yellow-400/40 bg-yellow-400/5"
          : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 hover:bg-neutral-900/70"
      }`}
      style={note.color ? { borderTopColor: note.color, borderTopWidth: "2px" } : {}}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(note.id)}
    >
      <div className="flex items-start justify-between gap-1">
        <h3
          className={`text-xs font-semibold line-clamp-2 ${
            isActive ? "text-yellow-400" : "text-white"
          }`}
        >
          {note.title || "Untitled"}
        </h3>
        {hovered && (
          <div className="flex items-center gap-0 shrink-0">
            <button
              className={`p-0.5 rounded transition-colors ${
                note.is_pinned ? "text-yellow-400" : "text-white/30 hover:text-white/60"
              }`}
              onClick={(e) => { e.stopPropagation(); onTogglePin(note.id); }}
            >
              <Pin className="h-2.5 w-2.5" />
            </button>
            <button
              className={`p-0.5 rounded transition-colors ${
                note.is_favorite ? "text-red-400" : "text-white/30 hover:text-white/60"
              }`}
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(note.id); }}
            >
              <Heart className={`h-2.5 w-2.5 ${note.is_favorite ? "fill-red-400" : ""}`} />
            </button>
            <button
              className="p-0.5 rounded text-white/30 hover:text-red-400 transition-colors"
              onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
            >
              <Trash2 className="h-2.5 w-2.5" />
            </button>
          </div>
        )}
      </div>

      {note.content && (
        <p className="text-[11px] text-white/35 line-clamp-3 leading-relaxed">
          {getSnippet(note.content, 100)}
        </p>
      )}

      <div className="flex items-center gap-1.5 mt-auto">
        <span className="text-[10px] text-white/20">{formatDate(note.updated_at)}</span>
        {note.is_pinned && !hovered && <Pin className="h-2.5 w-2.5 text-yellow-400/40" />}
      </div>
    </div>
  );
}
