import { useCallback, useMemo, useRef, useState } from "react";
import {
  Archive,
  Bookmark,
  Check,
  ChevronDown,
  Clipboard,
  Copy,
  Heart,
  Palette,
  Pin,
  Plus,
  Tag,
  Trash2,
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

interface TagItem {
  id: number;
  name: string;
  parent_id: number | null;
  color: string;
}

interface NotebookOption {
  id: number;
  name: string;
}

interface Props {
  note: NoteItem | null;
  tags: TagItem[];
  noteTags: TagItem[];
  notebooks: NotebookOption[];
  onUpdateNote: (updates: Partial<NoteItem>) => void;
  onAddTag: (tagId: number) => void;
  onRemoveTag: (tagId: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  { name: "Default", value: "" },
  { name: "Red", value: "#EF4444" },
  { name: "Orange", value: "#F97316" },
  { name: "Yellow", value: "#EAB308" },
  { name: "Green", value: "#22C55E" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Purple", value: "#A855F7" },
];

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export default function NotePropertiesPanel({
  note,
  tags,
  noteTags,
  notebooks,
  onUpdateNote,
  onAddTag,
  onRemoveTag,
  isOpen,
  onClose,
}: Props) {
  const [tagSearch, setTagSearch] = useState("");
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const noteTagIds = useMemo(() => new Set(noteTags.map((t) => t.id)), [noteTags]);

  const filteredTags = useMemo(() => {
    return tags.filter(
      (t) =>
        !noteTagIds.has(t.id) &&
        t.name.toLowerCase().includes(tagSearch.toLowerCase())
    );
  }, [tags, noteTagIds, tagSearch]);

  const handleExportMarkdown = useCallback(() => {
    if (!note) return;
    const md = `# ${note.title}\n\n${stripHtml(note.content)}`;
    navigator.clipboard.writeText(md).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [note]);

  if (!isOpen || !note) return null;

  return (
    <div className="flex h-full w-[320px] shrink-0 flex-col border-l border-neutral-800 bg-neutral-950 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
        <h3 className="font-heading text-lg font-bold text-white">Properties</h3>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-neutral-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* --- Properties Section --- */}
        <div className="border-b border-neutral-800 p-5">
          <h4 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-white/40">
            <Palette className="h-3.5 w-3.5" />
            Properties
          </h4>

          {/* Notebook Selector */}
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-semibold text-white/50">
              Notebook
            </label>
            <div className="relative">
              <select
                value={note.notebook_id ?? ""}
                onChange={(e) =>
                  onUpdateNote({
                    notebook_id: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="w-full appearance-none rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2.5 pr-8 text-sm text-white outline-none transition-colors focus:border-yellow-400/30"
              >
                <option value="">No notebook</option>
                {notebooks.map((nb) => (
                  <option key={nb.id} value={nb.id}>
                    {nb.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            </div>
          </div>

          {/* Color Picker */}
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-semibold text-white/50">
              Color
            </label>
            <div className="flex gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => onUpdateNote({ color: c.value })}
                  className={`relative h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                    note.color === c.value
                      ? "border-yellow-400"
                      : "border-neutral-700"
                  }`}
                  style={{
                    backgroundColor: c.value || "#262626",
                  }}
                  title={c.name}
                >
                  {note.color === c.value && (
                    <Check className="absolute inset-0 m-auto h-3.5 w-3.5 text-white drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2">
            <button
              onClick={() => onUpdateNote({ is_pinned: !note.is_pinned })}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                note.is_pinned
                  ? "bg-yellow-400/10 text-yellow-400"
                  : "text-white/60 hover:bg-neutral-800/60"
              }`}
            >
              <Pin className="h-4 w-4" />
              <span>Pinned</span>
              <span className="ml-auto">
                {note.is_pinned ? (
                  <span className="rounded bg-yellow-400/20 px-1.5 py-0.5 text-xs font-bold text-yellow-400">ON</span>
                ) : (
                  <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs font-bold text-white/30">OFF</span>
                )}
              </span>
            </button>

            <button
              onClick={() => onUpdateNote({ is_favorite: !note.is_favorite })}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                note.is_favorite
                  ? "bg-pink-400/10 text-pink-400"
                  : "text-white/60 hover:bg-neutral-800/60"
              }`}
            >
              <Heart className="h-4 w-4" />
              <span>Favorite</span>
              <span className="ml-auto">
                {note.is_favorite ? (
                  <span className="rounded bg-pink-400/20 px-1.5 py-0.5 text-xs font-bold text-pink-400">ON</span>
                ) : (
                  <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs font-bold text-white/30">OFF</span>
                )}
              </span>
            </button>
          </div>
        </div>

        {/* --- Tags Section --- */}
        <div className="border-b border-neutral-800 p-5">
          <h4 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-white/40">
            <Tag className="h-3.5 w-3.5" />
            Tags
          </h4>

          {/* Current tags */}
          <div className="mb-3 flex flex-wrap gap-2">
            {noteTags.length === 0 && (
              <p className="text-xs text-white/30">No tags assigned</p>
            )}
            {noteTags.map((tag) => (
              <span
                key={tag.id}
                className="flex items-center gap-1.5 rounded-full border border-neutral-700 bg-neutral-800/60 px-2.5 py-1 text-xs font-semibold text-white/70"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: tag.color || "#a3a3a3" }}
                />
                {tag.name}
                <button
                  onClick={() => onRemoveTag(tag.id)}
                  className="ml-0.5 text-white/30 transition-colors hover:text-red-400"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>

          {/* Add tag input */}
          <div className="relative">
            <div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-900 px-3">
              <Plus className="h-3.5 w-3.5 text-white/30" />
              <input
                ref={tagInputRef}
                type="text"
                placeholder="Add tag..."
                value={tagSearch}
                onChange={(e) => {
                  setTagSearch(e.target.value);
                  setShowTagDropdown(true);
                }}
                onFocus={() => setShowTagDropdown(true)}
                onBlur={() => setTimeout(() => setShowTagDropdown(false), 200)}
                className="w-full bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-white/30"
              />
            </div>

            {/* Dropdown */}
            {showTagDropdown && filteredTags.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-40 overflow-y-auto rounded-lg border border-neutral-800 bg-neutral-900 py-1 shadow-xl">
                {filteredTags.map((tag) => (
                  <button
                    key={tag.id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onAddTag(tag.id);
                      setTagSearch("");
                      setShowTagDropdown(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white/70 transition-colors hover:bg-neutral-800"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: tag.color || "#a3a3a3" }}
                    />
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* --- Stats Section --- */}
        <div className="border-b border-neutral-800 p-5">
          <h4 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-white/40">
            <Bookmark className="h-3.5 w-3.5" />
            Stats
          </h4>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/50">Words</span>
              <span className="font-semibold text-white">{note.word_count}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/50">Characters</span>
              <span className="font-semibold text-white">{note.char_count}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/50">Reading time</span>
              <span className="font-semibold text-white">{note.reading_time_minutes} min</span>
            </div>
            <div className="h-px bg-neutral-800" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/50">Created</span>
              <span className="text-xs font-medium text-white/60">
                {formatDate(note.created_at)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/50">Updated</span>
              <span className="text-xs font-medium text-white/60">
                {formatDate(note.updated_at)}
              </span>
            </div>
          </div>
        </div>

        {/* --- Actions Section --- */}
        <div className="p-5">
          <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-white/40">
            Actions
          </h4>

          <div className="space-y-1.5">
            <button
              onClick={() => onUpdateNote({ is_archived: !note.is_archived })}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-neutral-800/60 hover:text-white"
            >
              <Archive className="h-4 w-4" />
              {note.is_archived ? "Unarchive" : "Archive"}
            </button>

            <button
              onClick={() => onUpdateNote({ is_deleted: true })}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
              Move to Trash
            </button>

            <button
              onClick={() => onUpdateNote({ id: -1 })} // Signal to parent to duplicate
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-neutral-800/60 hover:text-white"
            >
              <Copy className="h-4 w-4" />
              Duplicate
            </button>

            <button
              onClick={handleExportMarkdown}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-neutral-800/60 hover:text-white"
            >
              <Clipboard className="h-4 w-4" />
              {copied ? (
                <span className="flex items-center gap-1.5 text-green-400">
                  <Check className="h-3.5 w-3.5" />
                  Copied!
                </span>
              ) : (
                "Export as Markdown"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
