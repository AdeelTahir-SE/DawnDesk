import { ChevronDown, ChevronRight, Link2, StickyNote } from "lucide-react";

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

interface Props {
  backlinks: NoteItem[];
  onNoteSelect: (noteId: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export default function BacklinksPanel({ backlinks, onNoteSelect, isOpen, onToggle }: Props) {
  return (
    <div className="border-t border-neutral-800 bg-neutral-950">
      {/* Header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-neutral-900/60"
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-white/40" />
        ) : (
          <ChevronRight className="h-4 w-4 text-white/40" />
        )}
        <Link2 className="h-4 w-4 text-yellow-400" />
        <span className="text-sm font-bold text-white">Backlinks</span>
        <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs font-semibold text-white/50">
          {backlinks.length}
        </span>
      </button>

      {/* Content */}
      {isOpen && (
        <div className="px-5 pb-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {backlinks.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-800 py-8">
              <StickyNote className="mb-2 h-8 w-8 text-white/15" />
              <p className="text-sm font-semibold text-white/30">
                No notes link to this note yet
              </p>
              <p className="mt-1 text-xs text-white/20">
                Create links in other notes to see them here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {backlinks.map((note) => {
                const snippet = stripHtml(note.content).slice(0, 120);
                return (
                  <button
                    key={note.id}
                    onClick={() => onNoteSelect(note.id)}
                    className="flex w-full flex-col gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 text-left transition-all hover:bg-neutral-900 hover:border-neutral-700"
                  >
                    <div className="flex items-center gap-2">
                      <Link2 className="h-3.5 w-3.5 shrink-0 text-yellow-400/60" />
                      <p className="truncate text-sm font-bold text-white">
                        {note.title || "Untitled"}
                      </p>
                    </div>
                    {snippet && (
                      <p className="line-clamp-2 text-xs text-white/40 pl-5">
                        {snippet}
                        {stripHtml(note.content).length > 120 && "…"}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
