import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import { Edit3, FilePlus2, FileText, Loader2, Pin, Plus, Save, Trash2, X } from "lucide-react";
import { useAppLogger } from "../../utils/LoggerContext";
import type { LocalStrategy } from "./types";
import { deleteProjectStrategy, listProjectStrategies, saveProjectStrategy } from "../../lib/workspaceSync";

const EMPTY_MARKETING_STRATEGY = `# Marketing Strategy

## Goal
- 

## Audience
- 

## Positioning
- 

## Channels
- 

## Content Plan
- 

## Success Metrics
- 
`;

type StrategyDraft = {
  id: string | null;
  name: string;
  category: string;
  markdown: string;
};

function newDraft(): StrategyDraft {
  return {
    id: null,
    name: "Strategy for Marketing",
    category: "Marketing",
    markdown: EMPTY_MARKETING_STRATEGY,
  };
}

function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("default", { month: "short", day: "numeric", year: "numeric" });
}

function markdownSnippet(markdown: string) {
  return markdown
    .replace(/^#+\s*/gm, "")
    .replace(/[-*]\s*/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 150);
}

export default function Strategies({ projectId }: { projectId: string | null }) {
  const { logSuccess, logError, logWarning } = useAppLogger();
  const [strategies, setStrategies] = useState<LocalStrategy[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<StrategyDraft>(newDraft);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"write" | "preview">("preview");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedStrategy = useMemo(
    () => strategies.find((strategy) => strategy.id === selectedId) ?? null,
    [strategies, selectedId]
  );

  const loadStrategies = async (nextSelectedId?: string | null) => {
    if (projectId === null) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listProjectStrategies(projectId);
      setStrategies(data);
      const nextId = nextSelectedId === undefined ? selectedId : nextSelectedId;
      const fallbackId = data[0]?.id ?? null;
      const resolvedId = nextId && data.some((strategy) => strategy.id === nextId) ? nextId : fallbackId;
      setSelectedId(resolvedId);
    } catch (e) {
      console.error("Failed to load strategies:", e);
      setError("Could not load strategies.");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (projectId === null) return;
    loadStrategies(null);
  }, [projectId]);

  useEffect(() => {
    if (!selectedStrategy || isModalOpen) return;
    setDraft({
      id: selectedStrategy.id,
      name: selectedStrategy.name,
      category: selectedStrategy.category,
      markdown: selectedStrategy.markdown,
    });
  }, [selectedStrategy, isModalOpen]);

  const openNewStrategyModal = () => {
    setSelectedId(null);
    setDraft(newDraft());
    setError(null);
    setMode("write");
    setIsModalOpen(true);
  };

  const openStrategyModal = (strategy: LocalStrategy) => {
    setSelectedId(strategy.id);
    setDraft({
      id: strategy.id,
      name: strategy.name,
      category: strategy.category,
      markdown: strategy.markdown,
    });
    setError(null);
    setMode("preview");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSave = async () => {
    if (projectId === null || !draft.name.trim() || !draft.markdown.trim()) return;
    setSaving(true);
    setError(null);

    try {
      const wasExisting = draft.id !== null;
      await saveProjectStrategy(projectId, {
        id: draft.id,
        name: draft.name.trim(),
        category: draft.category.trim() || "Marketing",
        markdown: draft.markdown,
      });
      await loadStrategies(draft.id ?? undefined);
      logSuccess(wasExisting ? "Strategy updated" : "Strategy created", draft.name.trim(), { source: "project-manager" });
      setIsModalOpen(false);
    } catch (e) {
      console.error("Failed to save strategy:", e);
      setError("Could not save this strategy.");
      logError("Strategy save failed", String(e), { source: "project-manager" });
    }

    setSaving(false);
  };

  const handleDelete = async () => {
    if (draft.id === null) {
      closeModal();
      return;
    }
    if (!window.confirm("Delete this strategy page? This cannot be undone.")) return;

    setDeleting(true);
    setError(null);
    try {
      await deleteProjectStrategy(draft.id);
      await loadStrategies(null);
      logWarning("Strategy deleted", draft.name.trim(), { source: "project-manager" });
      setIsModalOpen(false);
    } catch (e) {
      console.error("Failed to delete strategy:", e);
      setError("Could not delete this strategy.");
      logError("Strategy delete failed", String(e), { source: "project-manager" });
    }
    setDeleting(false);
  };

  if (projectId === null) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-white/40">Select a project to manage strategies.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/45" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 animate-fadeIn">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Strategy Board</h2>
          <p className="mt-1 text-sm text-white/50">Attach strategy pages to the board, open one, and keep planning in your shared workspace.</p>
        </div>
        <button
          onClick={openNewStrategyModal}
          className="flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-xs font-bold text-black hover:bg-yellow-300"
        >
          <Plus className="h-4 w-4" />
          Add Page
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <section className="custom-scrollbar relative min-h-[640px] flex-1 overflow-y-auto rounded-2xl border border-neutral-800 bg-[radial-gradient(circle_at_20%_18%,rgba(250,204,21,0.10),transparent_28%),linear-gradient(135deg,#202020,#111111_46%,#1b1b1b)] p-5 shadow-inner">
        <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:36px_36px]" />
        <div className="relative mb-5 flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-yellow-200/70">Soft Board</p>
            <h3 className="mt-1 text-lg font-bold text-white">Pinned Strategy Pages</h3>
          </div>
          <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-bold text-white/55">
            {strategies.length} page{strategies.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="relative grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          <button
            onClick={openNewStrategyModal}
            className="group flex min-h-[260px] flex-col items-center justify-center rounded-sm border-2 border-dashed border-yellow-300/35 bg-yellow-300/5 p-6 text-center transition-colors hover:border-yellow-300/70 hover:bg-yellow-300/10"
          >
            <FilePlus2 className="mb-3 h-10 w-10 text-yellow-300/70 transition-transform group-hover:scale-105" />
            <p className="text-sm font-bold text-white">Add new strategy page</p>
            <p className="mt-2 max-w-44 text-xs leading-5 text-white/45">Create a fresh page and pin it to this board.</p>
          </button>

          {strategies.map((strategy, index) => {
            const rotation = ["-rotate-1", "rotate-1", "rotate-0", "rotate-2", "-rotate-2"][index % 5];
            const paperColor = [
              "bg-[#fff7d1] text-neutral-950",
              "bg-[#f2f7ff] text-neutral-950",
              "bg-[#f4ffe8] text-neutral-950",
              "bg-[#fff0f4] text-neutral-950",
            ][index % 4];

            return (
              <button
                key={strategy.id}
                onClick={() => openStrategyModal(strategy)}
                className={`group relative min-h-[260px] rounded-sm p-5 text-left shadow-2xl shadow-black/35 ring-1 ring-black/10 transition-all hover:-translate-y-1 hover:rotate-0 ${paperColor} ${rotation}`}
              >
                <span className="absolute left-1/2 top-3 grid h-7 w-7 -translate-x-1/2 place-items-center rounded-full bg-red-500 text-white shadow-md shadow-black/25">
                  <Pin className="h-3.5 w-3.5 fill-current" />
                </span>
                <div className="mt-6">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-neutral-500">{strategy.category}</p>
                  <h4 className="mt-2 line-clamp-2 text-xl font-black leading-tight">{strategy.name}</h4>
                  <p className="mt-4 line-clamp-5 text-sm leading-6 text-neutral-700">
                    {markdownSnippet(strategy.markdown) || "Open this page to write strategy notes."}
                  </p>
                </div>
                <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between border-t border-black/10 pt-3 text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                  <span>Updated</span>
                  <span>{formatUpdatedAt(strategy.updated_at)}</span>
                </div>
              </button>
            );
          })}
        </div>

        {strategies.length === 0 && (
          <div className="relative mt-5 rounded-xl border border-white/10 bg-black/20 p-6 text-center">
            <FileText className="mx-auto mb-3 h-9 w-9 text-white/25" />
            <p className="text-sm font-semibold text-white/65">No strategy pages are pinned yet.</p>
            <p className="mt-1 text-xs text-white/40">Use Add Page to create the first one.</p>
          </div>
        )}
      </section>

      {isModalOpen && (
        <StrategyPageModal
          draft={draft}
          mode={mode}
          saving={saving}
          deleting={deleting}
          onDraftChange={setDraft}
          onModeChange={setMode}
          onClose={closeModal}
          onDelete={handleDelete}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function StrategyPageModal({
  draft,
  mode,
  saving,
  deleting,
  onDraftChange,
  onModeChange,
  onClose,
  onDelete,
  onSave,
}: {
  draft: StrategyDraft;
  mode: "write" | "preview";
  saving: boolean;
  deleting: boolean;
  onDraftChange: React.Dispatch<React.SetStateAction<StrategyDraft>>;
  onModeChange: (mode: "write" | "preview") => void;
  onClose: () => void;
  onDelete: () => void;
  onSave: () => void;
}) {
  const isReadOnlyPreview = draft.id !== null && mode === "preview";

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-start justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-4">
      <div className="my-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl shadow-black/60 sm:max-h-[calc(100dvh-2rem)]">
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {mode === "write" ? <Edit3 className="h-4 w-4 text-yellow-400" /> : <Pin className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
              <h3 className="truncate text-base font-bold text-white">{draft.id === null ? "New Strategy Page" : draft.name}</h3>
            </div>
            <p className="mt-1 text-xs text-white/40">{draft.category || "Uncategorized"} page</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onModeChange(mode === "write" ? "preview" : "write")}
              className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-bold text-white/70 hover:bg-neutral-800 hover:text-white"
            >
              {mode === "write" ? "Preview" : "Write"}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-white/40 hover:bg-neutral-800 hover:text-white"
              title="Close page"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
          {!isReadOnlyPreview && (
            <div className="grid grid-cols-1 gap-3 border-b border-neutral-800 bg-neutral-950/30 p-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Page Title</label>
                <input
                  value={draft.name}
                  onChange={(e) => onDraftChange((current) => ({ ...current, name: e.target.value }))}
                  className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-yellow-400/60"
                  placeholder="Strategy for Marketing"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Category</label>
                <input
                  value={draft.category}
                  onChange={(e) => onDraftChange((current) => ({ ...current, category: e.target.value }))}
                  className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-yellow-400/60"
                  placeholder="Marketing"
                />
              </div>
            </div>
          )}

          {mode === "write" ? (
            <div className="flex min-h-[420px] flex-col p-4">
              <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/50">
                <FileText className="h-3.5 w-3.5 text-yellow-400" />
                Page Notes
              </label>
              <textarea
                value={draft.markdown}
                onChange={(e) => onDraftChange((current) => ({ ...current, markdown: e.target.value }))}
                className="custom-scrollbar min-h-[360px] flex-1 resize-none rounded-lg border border-neutral-800 bg-black px-5 py-4 font-mono text-sm leading-7 text-white outline-none transition-colors placeholder-white/35 focus:border-yellow-400/60"
                placeholder="# Marketing Strategy"
              />
            </div>
          ) : (
            <div className="bg-[radial-gradient(circle_at_24%_18%,rgba(250,204,21,0.08),transparent_26%),#090909] p-4 sm:p-6">
              <article className="relative mx-auto min-h-[420px] max-w-3xl rounded-sm bg-[#fff8d8] px-6 py-7 text-neutral-950 shadow-2xl shadow-black/40 sm:px-10 sm:py-10">
                <span className="absolute left-1/2 top-4 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full bg-red-500 text-white shadow-lg shadow-black/25">
                  <Pin className="h-4 w-4 fill-current" />
                </span>
                <header className="mt-8 border-b border-black/10 pb-5">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-neutral-500">{draft.category || "Strategy"}</p>
                  <h1 className="mt-3 max-w-2xl text-3xl font-black leading-tight text-neutral-950">{draft.name}</h1>
                  <p className="mt-3 text-sm font-medium leading-6 text-neutral-600">Complete strategy plan</p>
                </header>
                <div className="prose prose-neutral mt-7 max-w-none prose-headings:font-black prose-headings:text-neutral-950 prose-p:text-neutral-700 prose-li:text-neutral-700 prose-li:marker:text-yellow-700 prose-strong:text-neutral-950 prose-code:text-yellow-800">
                  {draft.markdown.trim() ? (
                    <ReactMarkdown>{draft.markdown}</ReactMarkdown>
                  ) : (
                    <p className="text-sm text-neutral-500">Page preview will appear here.</p>
                  )}
                </div>
                <footer className="mt-10 flex items-center justify-between border-t border-black/10 pt-4 text-[11px] font-black uppercase tracking-[0.16em] text-neutral-500">
                  <span>Strategy page</span>
                  <span>DawnDesk</span>
                </footer>
              </article>
            </div>
          )}
        </div>

        <div className="shrink-0 flex items-center justify-between gap-3 border-t border-neutral-800 p-4">
          <button
            onClick={onDelete}
            disabled={deleting}
            className="flex items-center gap-2 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-500/20 disabled:opacity-60"
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Delete
          </button>
          <button
            onClick={onSave}
            disabled={saving || !draft.name.trim() || !draft.markdown.trim()}
            className={`${isReadOnlyPreview ? "hidden" : "flex"} items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-xs font-bold text-black hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Page
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
