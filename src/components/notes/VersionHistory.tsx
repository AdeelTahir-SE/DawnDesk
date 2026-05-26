import { History, RotateCcw, X } from "lucide-react";

interface NoteVersionItem {
  id: number;
  note_id: number;
  title: string;
  content: string;
  word_count: number;
  created_at: string;
}

interface Props {
  versions: NoteVersionItem[];
  onRestore: (version: NoteVersionItem) => void;
  isOpen: boolean;
  onClose: () => void;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? "s" : ""} ago`;
  return new Date(dateStr).toLocaleDateString();
}

function wordCountBadge(current: number, previous: number | null) {
  if (previous === null) return null;
  const diff = current - previous;
  if (diff === 0) return null;

  const isPositive = diff > 0;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
        isPositive
          ? "bg-green-400/10 text-green-400"
          : "bg-red-400/10 text-red-400"
      }`}
    >
      {isPositive ? "+" : ""}
      {diff} words
    </span>
  );
}

export default function VersionHistory({ versions, onRestore, isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="flex h-full w-[380px] shrink-0 flex-col border-l border-neutral-800 bg-neutral-950 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-yellow-400" />
          <h3 className="font-heading text-lg font-bold text-white">Version History</h3>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-neutral-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-4">
        {versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <History className="mb-3 h-10 w-10 text-white/15" />
            <p className="text-sm font-semibold text-white/30">No versions yet</p>
            <p className="mt-1 text-xs text-white/20">
              Versions are created when you save changes
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {versions.map((version, idx) => {
              const prevVersion = idx < versions.length - 1 ? versions[idx + 1] : null;
              const snippet = stripHtml(version.content).slice(0, 60);

              return (
                <div key={version.id} className="relative pl-6">
                  {/* Timeline line */}
                  {idx < versions.length - 1 && (
                    <div className="absolute left-[9px] top-8 h-[calc(100%+4px)] w-px bg-neutral-800" />
                  )}

                  {/* Timeline dot */}
                  <div
                    className={`absolute left-0 top-3 h-[18px] w-[18px] rounded-full border-2 ${
                      idx === 0
                        ? "border-yellow-400 bg-yellow-400/20"
                        : "border-neutral-700 bg-neutral-900"
                    }`}
                  />

                  <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 transition-colors hover:bg-neutral-900">
                    {/* Timestamp + word badge */}
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-white/50">
                        {relativeTime(version.created_at)}
                      </span>
                      {wordCountBadge(version.word_count, prevVersion?.word_count ?? null)}
                    </div>

                    {/* Title */}
                    <p className="mb-1 text-sm font-bold text-white">
                      {version.title || "Untitled"}
                    </p>

                    {/* Content preview */}
                    <p className="mb-3 text-xs text-white/40">
                      {snippet || "Empty content"}
                      {stripHtml(version.content).length > 60 && "…"}
                    </p>

                    {/* Restore button */}
                    <button
                      onClick={() => onRestore(version)}
                      className="flex items-center gap-1.5 rounded-lg bg-yellow-400/10 px-3 py-1.5 text-xs font-semibold text-yellow-400 transition-colors hover:bg-yellow-400/20"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Restore
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
