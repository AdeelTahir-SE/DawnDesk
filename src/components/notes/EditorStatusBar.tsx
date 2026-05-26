import { Clock, BookOpen, Hash, FolderOpen } from "lucide-react";

interface EditorStatusBarProps {
  wordCount: number;
  charCount: number;
  readingTime: number;
  lastSaved: Date | null;
  notebookName?: string;
  tags: string[];
}

function formatLastSaved(date: Date | null): string {
  if (!date) return "Not saved";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 5) return "Just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function EditorStatusBar({
  wordCount,
  charCount,
  readingTime,
  lastSaved,
  notebookName,
  tags,
}: EditorStatusBarProps) {
  return (
    <div className="flex h-9 items-center gap-3 border-t border-neutral-800 bg-neutral-950/60 px-4 text-xs text-white/50">
      {/* Word count */}
      <span className="flex items-center gap-1.5" title="Word count">
        <BookOpen className="h-3 w-3" />
        {wordCount} {wordCount === 1 ? "word" : "words"}
      </span>

      <span className="text-neutral-700">•</span>

      {/* Char count */}
      <span title="Character count">
        {charCount} {charCount === 1 ? "char" : "chars"}
      </span>

      <span className="text-neutral-700">•</span>

      {/* Reading time */}
      <span className="flex items-center gap-1.5" title="Estimated reading time">
        <Clock className="h-3 w-3" />
        {readingTime < 1 ? "< 1" : readingTime} min read
      </span>

      <span className="text-neutral-700">•</span>

      {/* Last saved */}
      <span title={lastSaved ? lastSaved.toLocaleString() : "Not saved yet"}>
        {formatLastSaved(lastSaved)}
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Notebook */}
      {notebookName && (
        <span className="flex items-center gap-1.5 rounded-md bg-neutral-800/60 px-2 py-0.5" title="Notebook">
          <FolderOpen className="h-3 w-3 text-yellow-400/60" />
          {notebookName}
        </span>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex items-center gap-1.5">
          <Hash className="h-3 w-3 text-white/30" />
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-yellow-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-400/80"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
