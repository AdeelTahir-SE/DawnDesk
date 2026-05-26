import { useState } from "react";
import { Archive, RefreshCcw, Trash2, Calendar, FileText } from "lucide-react";

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

interface ArchiveViewProps {
  notes: NoteItem[];
  onRestore: (id: number) => void;
  onDelete: (id: number) => void;
  onNoteSelect: (id: number) => void;
}

export default function ArchiveView({ notes, onRestore, onDelete, onNoteSelect }: ArchiveViewProps) {
  const [hoveredNoteId, setHoveredNoteId] = useState<number | null>(null);

  const getPlainText = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (notes.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center animate-fadeIn">
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-neutral-900/60 border border-neutral-800 text-white/20">
          <Archive className="h-8 w-8" />
        </div>
        <h3 className="mb-2 font-heading text-lg font-bold text-white">No archived notes</h3>
        <p className="max-w-xs text-sm text-white/50">
          When you archive notes, they'll appear here safely out of your main workspace.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto custom-scrollbar p-6 lg:p-8 animate-fadeIn">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-white flex items-center gap-2">
              <Archive className="h-6 w-6 text-yellow-400" />
              Archive
            </h1>
            <p className="text-sm text-white/50 mt-1">
              {notes.length} {notes.length === 1 ? "note" : "notes"} in your archive
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => {
            const preview = getPlainText(note.content).substring(0, 100);
            
            return (
              <div
                key={note.id}
                className="group relative flex flex-col rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 transition-all hover:bg-neutral-900/80 hover:border-neutral-700"
                onMouseEnter={() => setHoveredNoteId(note.id)}
                onMouseLeave={() => setHoveredNoteId(null)}
              >
                {/* Note Content */}
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => onNoteSelect(note.id)}
                >
                  <h3 className="mb-2 font-bold text-white line-clamp-1">
                    {note.title || "Untitled"}
                  </h3>
                  <p className="mb-4 text-xs leading-relaxed text-white/50 line-clamp-3 min-h-[3.5rem]">
                    {preview || <span className="italic">Empty note</span>}
                  </p>
                </div>

                {/* Footer metadata */}
                <div className="mt-auto flex items-center gap-3 border-t border-neutral-800/50 pt-3 text-[10px] text-white/40">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(note.updated_at)}
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {note.word_count} words
                  </div>
                </div>

                {/* Action Buttons Overlay */}
                <div 
                  className={`absolute right-3 top-3 flex items-center gap-1 rounded-lg bg-neutral-800/90 p-1 backdrop-blur-sm transition-opacity duration-200 ${
                    hoveredNoteId === note.id ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRestore(note.id);
                    }}
                    className="grid h-7 w-7 place-items-center rounded hover:bg-neutral-700 hover:text-white text-white/70 transition-colors"
                    title="Restore Note"
                  >
                    <RefreshCcw className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(note.id);
                    }}
                    className="grid h-7 w-7 place-items-center rounded hover:bg-red-500/20 hover:text-red-400 text-white/70 transition-colors"
                    title="Move to Trash"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
