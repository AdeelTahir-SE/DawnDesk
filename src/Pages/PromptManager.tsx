import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Edit, FileQuestion, Plus, Search, Trash2, Variable, X } from "lucide-react";
import WelcomeScreen from "../components/WelcomeScreen";

interface Prompt {
  id: string;
  title: string;
  category: string;
  content: string;
  isCustom?: boolean;
}

const SEEDED_PROMPTS: Prompt[] = [
  {
    id: "marketing-1",
    category: "Marketing",
    title: "Social Media Hook Generator",
    content: "Write a high-converting social media post hook for the following topic: [Topic]. Ensure it targets a pain point, builds curiosity, and includes a call to action. Tone: [Tone]",
    isCustom: false,
  },
  {
    id: "marketing-2",
    category: "Marketing",
    title: "SEO Blog Post Outline",
    content: "Generate a detailed SEO-friendly blog post outline for the keyword: [Keyword]. Include search intent, H2/H3 structure, target length, and related terms to include.",
    isCustom: false,
  },
  {
    id: "marketing-3",
    category: "Marketing",
    title: "Cold Outreach Email",
    content: "Create a personalized cold outreach email for a prospect in [Industry]. The offer is [Offer] and the goal is a 15-minute discovery call. Keep it concise, benefit-led, and conversational.",
    isCustom: false,
  },
  {
    id: "dev-1",
    category: "Development",
    title: "Code Refactor Specialist",
    content: "Refactor the following [Language] code for readability, performance, and best practices. Explain the most important changes made:\n\n[Code]",
    isCustom: false,
  },
  {
    id: "dev-2",
    category: "Development",
    title: "Regex Pattern Generator",
    content: "Generate a regular expression pattern that matches: [Criteria]. Provide example matches, non-matches, and a concise breakdown for [Language/Standard].",
    isCustom: false,
  },
  {
    id: "dev-3",
    category: "Development",
    title: "Code Documentation Writer",
    content: "Write professional JSDoc/TSDoc or docstring documentation for the following function or class. Include parameters, return values, thrown errors, and a usage example:\n\n[Code]",
    isCustom: false,
  },
  {
    id: "writing-1",
    category: "Writing & Design",
    title: "Tone & Voice Adjuster",
    content: "Rewrite the following text in a [Desired Tone] tone. Keep the original meaning, but adjust vocabulary, rhythm, and sentence structure:\n\n[Text]",
    isCustom: false,
  },
  {
    id: "writing-2",
    category: "Writing & Design",
    title: "Catchy Headline Copywriter",
    content: "Brainstorm 10 benefit-driven headlines for [Product Name]. It is a [Product Description] for [Target Audience]. Prioritize clarity, emotional pull, and specificity.",
    isCustom: false,
  },
  {
    id: "writing-3",
    category: "Writing & Design",
    title: "Component Style Architect",
    content: "As a frontend design lead, suggest structure, Tailwind classes, color palette, typography, and interaction states for a premium [Component Name]. Vibe: [Vibe].",
    isCustom: false,
  },
];

const extractVariables = (content: string) => Array.from(new Set(content.match(/\[[^\]]+\]/g) ?? []));

export default function PromptManager() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("Marketing");
  const [customCategory, setCustomCategory] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("dawndesk_prompts");
    if (stored) {
      try {
        setPrompts(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored prompts, falling back to seeds", e);
        setPrompts(SEEDED_PROMPTS);
      }
    } else {
      setPrompts(SEEDED_PROMPTS);
      localStorage.setItem("dawndesk_prompts", JSON.stringify(SEEDED_PROMPTS));
    }
  }, []);

  const savePrompts = (nextPrompts: Prompt[]) => {
    setPrompts(nextPrompts);
    localStorage.setItem("dawndesk_prompts", JSON.stringify(nextPrompts));
  };

  const categories = useMemo(() => ["All", ...Array.from(new Set(prompts.map((prompt) => prompt.category)))], [prompts]);

  const filteredPrompts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return prompts.filter((prompt) => {
      const matchesCategory = activeCategory === "All" || prompt.category === activeCategory;
      const matchesSearch = `${prompt.title} ${prompt.category} ${prompt.content}`.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, prompts, searchQuery]);

  const handleCopy = (id: string, text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1400);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this prompt template?")) return;
    savePrompts(prompts.filter((prompt) => prompt.id !== id));
  };

  const openCreateModal = () => {
    setModalMode("create");
    setEditingPromptId(null);
    setFormTitle("");
    setFormCategory(categories[1] || "Marketing");
    setCustomCategory("");
    setFormContent("");
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (prompt: Prompt) => {
    setModalMode("edit");
    setEditingPromptId(prompt.id);
    setFormTitle(prompt.title);
    setFormCategory(prompt.category);
    setCustomCategory("");
    setFormContent(prompt.content);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSavePrompt = (event: React.FormEvent) => {
    event.preventDefault();
    const title = formTitle.trim();
    const finalCategory = formCategory === "New Category..." ? customCategory.trim() : formCategory.trim();
    const content = formContent.trim();

    if (!title || !finalCategory || !content) {
      setFormError("Please fill out all fields.");
      return;
    }

    if (modalMode === "create") {
      savePrompts([{ id: `custom-${Date.now()}`, title, category: finalCategory, content, isCustom: true }, ...prompts]);
    } else if (editingPromptId) {
      savePrompts(
        prompts.map((prompt) =>
          prompt.id === editingPromptId
            ? { ...prompt, title, category: finalCategory, content, isCustom: prompt.isCustom ?? true }
            : prompt,
        ),
      );
    }

    setIsModalOpen(false);
  };

  return (
    <WelcomeScreen appKey="prompts" title="Prompt Manager" description="Organize your AI prompt library securely offline.">
      <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-neutral-950 text-white animate-fadeIn">
        <aside className="flex h-full w-60 shrink-0 flex-col border-r border-neutral-800 bg-neutral-900/60">
          <div className="border-b border-neutral-800 p-5">
            <div className="flex items-center gap-3">
              
              <div>
                <h1 className="font-heading text-base font-bold text-white">Prompts</h1>
                <p className="text-xs text-white/50">{prompts.length} templates</p>
              </div>
            </div>
          </div>

          <nav className="custom-scrollbar flex-1 overflow-y-auto p-3">
            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/40">Categories</p>
            <div className="space-y-1">
              {categories.map((category) => {
                const count = category === "All" ? prompts.length : prompts.filter((prompt) => prompt.category === category).length;
                return (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      activeCategory === category ? "bg-yellow-400/10 text-yellow-300" : "text-white/55 hover:bg-neutral-800/60 hover:text-white"
                    }`}
                  >
                    <span className="truncate">{category}</span>
                    <span className="text-xs text-white/35">{count}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </aside>

        <main className="custom-scrollbar flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <section className="rounded-2xl border border-neutral-800 bg-gradient-to-r from-neutral-900 to-neutral-950 p-5 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-yellow-400">Prompt Manager</p>
                  <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Reusable Prompt Library</h2>
                  <p className="mt-2 max-w-2xl text-sm text-white/60 sm:text-base">
                    Keep your best AI instructions organized, searchable, and ready to copy.
                  </p>
                </div>
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-bold text-black transition-colors hover:bg-yellow-300"
                >
                  <Plus className="h-4 w-4" />
                  New Prompt
                </button>
              </div>
            </section>

            <section className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search prompt titles, categories, or body text..."
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-10 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-yellow-400/60"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/60">
              <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Library</h3>
                  <p className="mt-1 text-xs text-white/50">{filteredPrompts.length} matching templates</p>
                </div>
              </div>

              {filteredPrompts.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <FileQuestion className="mb-4 h-10 w-10 text-white/25" />
                  <h3 className="text-base font-semibold text-white">No prompts found</h3>
                  <p className="mt-1 text-sm text-white/45">Try a different category or search term.</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-800">
                  {filteredPrompts.map((prompt) => {
                    const variables = extractVariables(prompt.content);
                    return (
                      <article key={prompt.id} className="grid gap-4 px-5 py-4 transition-colors hover:bg-neutral-800/35 lg:grid-cols-[1fr_180px_132px] lg:items-center">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="truncate text-sm font-semibold text-white">{prompt.title}</h4>
                            <span className="rounded-full border border-neutral-800 bg-neutral-950 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-yellow-300">
                              {prompt.category}
                            </span>
                          </div>
                          <p className="mt-2 line-clamp-2 max-w-4xl whitespace-pre-wrap text-sm leading-relaxed text-white/55">{prompt.content}</p>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-white/45">
                          <Variable className="h-3.5 w-3.5" />
                          {variables.length ? variables.join(", ") : "No variables"}
                        </div>

                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleCopy(prompt.id, prompt.content)}
                            className={`grid h-9 w-9 place-items-center rounded-lg border transition-colors ${
                              copiedId === prompt.id
                                ? "border-green-500/30 bg-green-500/10 text-green-300"
                                : "border-neutral-800 bg-neutral-950 text-white/55 hover:text-white"
                            }`}
                            title="Copy prompt"
                          >
                            {copiedId === prompt.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => openEditModal(prompt)}
                            className="grid h-9 w-9 place-items-center rounded-lg border border-neutral-800 bg-neutral-950 text-white/55 hover:text-white"
                            title="Edit prompt"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {prompt.isCustom !== false && (
                            <button
                              onClick={() => handleDelete(prompt.id)}
                              className="grid h-9 w-9 place-items-center rounded-lg border border-neutral-800 bg-neutral-950 text-white/55 hover:border-red-500/30 hover:text-red-300"
                              title="Delete prompt"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </main>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/80 p-4 backdrop-blur-md animate-fadeIn">
            <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl animate-scaleUp" role="dialog" aria-modal="true">
              <div className="flex items-center justify-between border-b border-neutral-800 p-6">
                <div>
                  <h2 className="font-heading text-xl font-bold text-white">{modalMode === "create" ? "Create Prompt" : "Edit Prompt"}</h2>
                  <p className="mt-1 text-xs text-white/50">Use bracketed placeholders like [Topic] to keep prompts reusable.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg text-white/50 hover:bg-neutral-800 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSavePrompt} className="custom-scrollbar flex max-h-[72vh] flex-col gap-5 overflow-y-auto p-6">
                {formError && <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm font-semibold text-red-300">{formError}</div>}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.2fr_0.8fr]">
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Prompt Title</span>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(event) => setFormTitle(event.target.value)}
                      placeholder="e.g. Product Requirements Reviewer"
                      className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-yellow-400/60"
                      required
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Category</span>
                    <select
                      value={formCategory}
                      onChange={(event) => {
                        setFormCategory(event.target.value);
                        if (event.target.value !== "New Category...") setCustomCategory("");
                      }}
                      className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/60"
                    >
                      {categories.filter((category) => category !== "All").map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                      <option value="New Category...">Create new category...</option>
                    </select>
                  </label>
                </div>

                {formCategory === "New Category..." && (
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/50">New Category Name</span>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(event) => setCustomCategory(event.target.value)}
                      placeholder="e.g. Product Strategy"
                      className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-yellow-400/60"
                      required
                    />
                  </label>
                )}

                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Prompt Template</span>
                  <textarea
                    value={formContent}
                    onChange={(event) => setFormContent(event.target.value)}
                    rows={12}
                    placeholder="Analyze [Input] for [Goal]. Return concise recommendations and a prioritized action list."
                    className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 font-mono text-sm leading-relaxed text-white outline-none placeholder:text-white/35 focus:border-yellow-400/60"
                    required
                  />
                </label>

                <div className="flex justify-end gap-3 border-t border-neutral-800 pt-5">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg border border-neutral-800 bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white/60 hover:text-white">
                    Cancel
                  </button>
                  <button type="submit" className="rounded-lg bg-yellow-400 px-5 py-2.5 text-sm font-bold text-black hover:bg-yellow-300">
                    {modalMode === "create" ? "Add Template" : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </WelcomeScreen>
  );
}
