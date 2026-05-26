import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Search, X, FileText, Clock, Filter } from "lucide-react";

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

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notes: NoteItem[];
  onNoteSelect: (id: number) => void;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-yellow-400/30 text-yellow-300 rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function getSnippetAround(content: string, query: string, len = 120): string {
  const clean = content.replace(/[#*_\->\[\]`~]/g, "").trim();
  if (!query.trim()) return clean.slice(0, len);
  const idx = clean.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return clean.slice(0, len);
  const start = Math.max(0, idx - 40);
  const snippet = clean.slice(start, start + len);
  return (start > 0 ? "…" : "") + snippet + (start + len < clean.length ? "…" : "");
}

export default function SearchPanel({
  isOpen,
  onClose,
  notes,
  onNoteSelect,
}: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [titleOnly, setTitleOnly] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Search results
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return notes
      .filter((n) => !n.is_deleted)
      .filter((n) => {
        const matchesText = titleOnly
          ? n.title.toLowerCase().includes(q)
          : n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);

        let matchesDate = true;
        if (dateFrom) {
          matchesDate = matchesDate && new Date(n.updated_at) >= new Date(dateFrom);
        }
        if (dateTo) {
          matchesDate = matchesDate && new Date(n.updated_at) <= new Date(dateTo + "T23:59:59");
        }

        return matchesText && matchesDate;
      })
      .slice(0, 20);
  }, [query, notes, titleOnly, dateFrom, dateTo]);

  // Keep selectedIdx in bounds
  useEffect(() => {
    if (selectedIdx >= results.length) setSelectedIdx(Math.max(0, results.length - 1));
  }, [results.length, selectedIdx]);

  // Scroll selected into view
  useEffect(() => {
    if (listRef.current) {
      const el = listRef.current.children[selectedIdx] as HTMLElement | undefined;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIdx]);

  const handleSelect = useCallback(
    (id: number) => {
      if (query.trim() && !recentSearches.includes(query.trim())) {
        setRecentSearches((prev) => [query.trim(), ...prev].slice(0, 5));
      }
      onNoteSelect(id);
      onClose();
    },
    [query, recentSearches, onNoteSelect, onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && results[selectedIdx]) {
        handleSelect(results[selectedIdx].id);
      }
    },
    [results, selectedIdx, onClose, handleSelect]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-[600px] rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl shadow-black/40 overflow-hidden animate-in zoom-in-95 duration-200"
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-neutral-800 px-4 py-3">
          <Search className="h-5 w-5 shrink-0 text-white/30" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-base text-white placeholder:text-white/30 outline-none"
            placeholder="Search notes…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIdx(0);
            }}
          />
          <button
            className="p-1 rounded-lg hover:bg-neutral-800 text-white/40 hover:text-white transition-colors"
            onClick={() => setShowFilters(!showFilters)}
            title="Filters"
          >
            <Filter className={`h-4 w-4 ${showFilters ? "text-yellow-400" : ""}`} />
          </button>
          <button
            className="p-1 rounded-lg hover:bg-neutral-800 text-white/40 hover:text-white transition-colors"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 border-b border-neutral-800/60 px-4 py-2.5">
            <label className="flex items-center gap-1.5 text-xs text-white/50 cursor-pointer">
              <input
                type="checkbox"
                checked={titleOnly}
                onChange={(e) => setTitleOnly(e.target.checked)}
                className="rounded border-neutral-700 bg-neutral-800 text-yellow-400 focus:ring-yellow-400/30"
              />
              Title only
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-white/30">From:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-1 text-xs text-white/60 outline-none focus:border-yellow-400/40"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-white/30">To:</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-1 text-xs text-white/60 outline-none focus:border-yellow-400/40"
              />
            </div>
          </div>
        )}

        {/* Results */}
        <div ref={listRef} className="max-h-[400px] overflow-y-auto custom-scrollbar">
          {query.trim() === "" ? (
            /* Recent searches or hint */
            <div className="px-4 py-6">
              {recentSearches.length > 0 ? (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30 mb-2">
                    Recent Searches
                  </p>
                  {recentSearches.map((rs, i) => (
                    <button
                      key={i}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/50 hover:bg-neutral-800/60 hover:text-white transition-colors"
                      onClick={() => setQuery(rs)}
                    >
                      <Clock className="h-3.5 w-3.5 text-white/25" />
                      {rs}
                    </button>
                  ))}
                </>
              ) : (
                <div className="text-center">
                  <Search className="h-8 w-8 text-white/10 mx-auto mb-2" />
                  <p className="text-sm text-white/30">Start typing to search your notes</p>
                  <p className="text-xs text-white/20 mt-1">
                    Search by title, content, or use filters
                  </p>
                </div>
              )}
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <FileText className="h-8 w-8 text-white/10 mx-auto mb-2" />
              <p className="text-sm text-white/40">No notes match "{query}"</p>
            </div>
          ) : (
            <div className="py-1">
              <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">
                {results.length} {results.length === 1 ? "result" : "results"}
              </p>
              {results.map((note, idx) => (
                <button
                  key={note.id}
                  className={`flex w-full flex-col gap-0.5 px-4 py-2.5 text-left transition-colors ${
                    idx === selectedIdx
                      ? "bg-yellow-400/10 border-l-2 border-yellow-400"
                      : "border-l-2 border-transparent hover:bg-neutral-800/50"
                  }`}
                  onClick={() => handleSelect(note.id)}
                  onMouseEnter={() => setSelectedIdx(idx)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-white truncate">
                      {highlightMatch(note.title || "Untitled", query)}
                    </span>
                    <span className="text-[10px] text-white/25 shrink-0">
                      {formatDate(note.updated_at)}
                    </span>
                  </div>
                  <p className="text-xs text-white/40 truncate">
                    {highlightMatch(getSnippetAround(note.content, query), query)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-neutral-800/60 px-4 py-2">
          <div className="flex items-center gap-3 text-[10px] text-white/20">
            <span>
              <kbd className="rounded border border-neutral-700 bg-neutral-800 px-1 py-0.5 text-white/40">↑↓</kbd> navigate
            </span>
            <span>
              <kbd className="rounded border border-neutral-700 bg-neutral-800 px-1 py-0.5 text-white/40">↵</kbd> open
            </span>
            <span>
              <kbd className="rounded border border-neutral-700 bg-neutral-800 px-1 py-0.5 text-white/40">esc</kbd> close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
