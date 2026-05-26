import { useState } from "react";
import { Trash2, RefreshCcw, Calendar, FileText, AlertTriangle } from "lucide-react";

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

interface TrashViewProps {
  notes: NoteItem[];
  onRestore: (id: number) => void;
  onPermanentDelete: (id: number) => void;
  onEmptyTrash: () => void;
}

export default function TrashView({ notes, onRestore, onPermanentDelete, onEmptyTrash }: TrashViewProps) {
  const [showConfirmEmpty, setShowConfirmEmpty] = useState(false);

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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (notes.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center animate-fadeIn">
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-neutral-900/60 border border-neutral-800 text-white/20">
          <Trash2 className="h-8 w-8" />
        </div>
        <h3 className="mb-2 font-heading text-lg font-bold text-white">Trash is empty</h3>
        <p className="max-w-xs text-sm text-white/50">
          Deleted notes will appear here. They are kept safely until you permanently delete them.
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
              <Trash2 className="h-6 w-6 text-red-400" />
              Trash
            </h1>
            <p className="text-sm text-white/50 mt-1">
              {notes.length} {notes.length === 1 ? "note" : "notes"} in trash
            </p>
          </div>
          
          <div className="relative">
            {showConfirmEmpty ? (
              <div className="flex items-center gap-2 animate-in fade-in zoom-in-95">
                <button
                  onClick={() => setShowConfirmEmpty(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-white/50 hover:bg-neutral-800 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onEmptyTrash();
                    setShowConfirmEmpty(false);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Confirm Empty
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmEmpty(true)}
                className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Empty Trash
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {notes.map((note) => {
            const preview = getPlainText(note.content).substring(0, 150);
            
            return (
              <div
                key={note.id}
                className="group relative flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 transition-all hover:bg-neutral-900/80 hover:border-neutral-700"
              >
                {/* Note Info */}
                <div className="flex-1 pr-10 opacity-70 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-white line-clamp-1">
                      {note.title || "Untitled"}
                    </h3>
                    <span className="text-[10px] uppercase tracking-wider text-red-400/70 border border-red-400/20 bg-red-400/10 px-1.5 py-0.5 rounded">
                      Deleted {note.deleted_at ? formatDate(note.deleted_at) : 'Unknown'}
                    </span>
                  </div>
                  <p className="text-xs text-white/40 line-clamp-1 mb-2">
                    {preview || <span className="italic">Empty note</span>}
                  </p>
                  
                  <div className="flex items-center gap-3 text-[10px] text-white/30">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Created: {formatDate(note.created_at)}
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {note.word_count} words
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => onRestore(note.id)}
                    className="flex items-center gap-2 rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700 transition-colors"
                  >
                    <RefreshCcw className="h-3.5 w-3.5" />
                    Restore
                  </button>
                  <button
                    onClick={() => onPermanentDelete(note.id)}
                    className="flex items-center gap-2 rounded-lg border border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Forever
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
