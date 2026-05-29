import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import ReactMarkdown from "react-markdown";
import { Edit3, Eye, FileText, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { useAppLogger } from "../../utils/LoggerContext";
import type { LocalStrategy } from "./types";

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
  id: number | null;
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

export default function Strategies({ projectId }: { projectId: number | null }) {
  const { logSuccess, logError, logWarning } = useAppLogger();
  const [strategies, setStrategies] = useState<LocalStrategy[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<StrategyDraft>(newDraft);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"write" | "preview">("write");

  const selectedStrategy = useMemo(
    () => strategies.find((strategy) => strategy.id === selectedId) ?? null,
    [strategies, selectedId]
  );

  const loadStrategies = async (nextSelectedId?: number | null) => {
    if (projectId === null) return;
    setLoading(true);
    setError(null);
    try {
      const data = await invoke<LocalStrategy[]>("get_strategies", { projectId });
      setStrategies(data);
      const nextId = nextSelectedId === undefined ? selectedId : nextSelectedId;
      const fallbackId = data[0]?.id ?? null;
      const resolvedId = nextId && data.some((strategy) => strategy.id === nextId) ? nextId : fallbackId;
      setSelectedId(resolvedId);
      if (resolvedId === null) {
        setDraft(newDraft());
      }
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
    if (selectedStrategy) {
      setDraft({
        id: selectedStrategy.id,
        name: selectedStrategy.name,
        category: selectedStrategy.category,
        markdown: selectedStrategy.markdown,
      });
    }
  }, [selectedStrategy]);

  const handleNewStrategy = () => {
    setSelectedId(null);
    setDraft(newDraft());
    setError(null);
    setMode("write");
  };

  const handleSave = async () => {
    if (projectId === null || !draft.name.trim() || !draft.markdown.trim()) return;
    setSaving(true);
    setError(null);
    const now = new Date().toISOString();

    try {
      if (draft.id === null) {
        await invoke("create_strategy", {
          input: {
            project_id: projectId,
            name: draft.name.trim(),
            category: draft.category.trim() || "Marketing",
            markdown: draft.markdown,
            created_at: now,
          },
        });
        await loadStrategies(null);
        logSuccess("Strategy created", draft.name.trim(), { source: "project-manager" });
      } else {
        await invoke("update_strategy", {
          input: {
            id: draft.id,
            name: draft.name.trim(),
            category: draft.category.trim() || "Marketing",
            markdown: draft.markdown,
            updated_at: now,
          },
        });
        await loadStrategies(draft.id);
        logSuccess("Strategy updated", draft.name.trim(), { source: "project-manager" });
      }
    } catch (e) {
      console.error("Failed to save strategy:", e);
      setError("Could not save this strategy.");
      logError("Strategy save failed", String(e), { source: "project-manager" });
    }

    setSaving(false);
  };

  const handleDelete = async () => {
    if (draft.id === null) {
      handleNewStrategy();
      return;
    }
    if (!window.confirm("Delete this strategy? This cannot be undone.")) return;

    setDeleting(true);
    setError(null);
    try {
      await invoke("delete_strategy", { id: draft.id });
      await loadStrategies(null);
      logWarning("Strategy deleted", draft.name.trim(), { source: "project-manager" });
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Strategies</h2>
          <p className="mt-1 text-sm text-white/50">Plan strategy in Markdown with a focused editor and clean preview.</p>
        </div>
        <button
          onClick={handleNewStrategy}
          className="flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-xs font-bold text-black hover:bg-yellow-300"
        >
          <Plus className="h-4 w-4" />
          New Strategy
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="min-h-[180px] rounded-xl border border-neutral-800 bg-neutral-900/40 p-3 xl:min-h-0">
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="text-xs font-bold uppercase tracking-wider text-white/40">Saved Strategies</p>
            <span className="rounded-md bg-neutral-800 px-2 py-0.5 text-[11px] font-bold text-white/45">{strategies.length}</span>
          </div>
          <div className="custom-scrollbar flex h-full flex-col gap-2 overflow-y-auto pr-1">
            {strategies.length === 0 ? (
              <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-neutral-800 p-6 text-center">
                <div>
                  <FileText className="mx-auto mb-3 h-9 w-9 text-white/20" />
                  <p className="text-sm font-semibold text-white/60">No strategies yet</p>
                  <p className="mt-1 text-xs text-white/35">Start with the marketing strategy draft.</p>
                </div>
              </div>
            ) : (
              strategies.map((strategy) => (
                <button
                  key={strategy.id}
                  onClick={() => setSelectedId(strategy.id)}
                  className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                    selectedId === strategy.id
                      ? "border-yellow-400/60 bg-yellow-400/10"
                      : "border-neutral-800 bg-neutral-950/40 hover:border-neutral-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">{strategy.name}</p>
                      <p className="mt-1 text-xs text-white/40">{strategy.category}</p>
                    </div>
                    <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] font-semibold uppercase text-white/45">
                      MD
                    </span>
                  </div>
                  <p className="mt-3 text-[11px] text-white/35">Updated {formatUpdatedAt(strategy.updated_at)}</p>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col rounded-xl border border-neutral-800 bg-neutral-900/40">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 px-5 py-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {mode === "write" ? <Edit3 className="h-4 w-4 text-yellow-400" /> : <Eye className="h-4 w-4 text-yellow-400" />}
                <h3 className="text-sm font-bold text-white">{draft.id === null ? "New Strategy" : draft.name}</h3>
              </div>
              <p className="mt-1 text-xs text-white/40">{draft.category || "Uncategorized"} strategy document</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-neutral-800 bg-neutral-950 p-1">
                <button
                  onClick={() => setMode("write")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${mode === "write" ? "bg-yellow-400 text-black" : "text-white/50 hover:bg-neutral-800 hover:text-white"}`}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Write
                </button>
                <button
                  onClick={() => setMode("preview")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${mode === "preview" ? "bg-yellow-400 text-black" : "text-white/50 hover:bg-neutral-800 hover:text-white"}`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </button>
              </div>

              {draft.id === null && (
                <button
                  onClick={handleNewStrategy}
                  className="rounded-lg p-2 text-white/40 hover:bg-neutral-800 hover:text-white"
                  title="Reset draft"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-500/20 disabled:opacity-60"
              >
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Delete
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !draft.name.trim() || !draft.markdown.trim()}
                className="flex items-center gap-2 rounded-lg bg-yellow-400 px-3 py-2 text-xs font-bold text-black hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save
              </button>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)]">
            <div className="grid grid-cols-1 gap-3 border-b border-neutral-800 bg-neutral-950/30 p-4 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Strategy Name</label>
                <input
                  value={draft.name}
                  onChange={(e) => setDraft((current) => ({ ...current, name: e.target.value }))}
                  className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-yellow-400/60"
                  placeholder="Strategy for Marketing"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Category</label>
                <input
                  value={draft.category}
                  onChange={(e) => setDraft((current) => ({ ...current, category: e.target.value }))}
                  className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-yellow-400/60"
                  placeholder="Marketing"
                />
              </div>
            </div>

            {mode === "write" ? (
              <div className="flex min-h-0 flex-col p-4">
                <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/50">
                  <FileText className="h-3.5 w-3.5 text-yellow-400" />
                  Markdown
                </label>
                <textarea
                  value={draft.markdown}
                  onChange={(e) => setDraft((current) => ({ ...current, markdown: e.target.value }))}
                  className="custom-scrollbar min-h-[560px] flex-1 resize-none rounded-lg border border-neutral-800 bg-neutral-950 px-5 py-4 font-mono text-sm leading-7 text-white outline-none transition-colors placeholder-white/35 focus:border-yellow-400/60"
                  placeholder="# Marketing Strategy"
                />
              </div>
            ) : (
              <div className="custom-scrollbar min-h-0 overflow-y-auto p-6">
              <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-a:text-yellow-300 prose-strong:text-white prose-li:marker:text-yellow-400 prose-code:text-yellow-200">
                {draft.markdown.trim() ? (
                  <ReactMarkdown>{draft.markdown}</ReactMarkdown>
                ) : (
                  <p className="text-sm text-white/40">Markdown preview will appear here.</p>
                )}
              </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
