import { useState, useEffect } from "react";
import { Plus, Search, X, FileQuestion, Edit, Trash2, Check, Copy } from "lucide-react";
import WelcomeScreen from "../components/WelcomeScreen";

interface Prompt {
  id: string;
  title: string;
  category: string;
  content: string;
  isCustom?: boolean;
}

const SEEDED_PROMPTS: Prompt[] = [
  // Marketing
  {
    id: "marketing-1",
    category: "Marketing",
    title: "Social Media Hook Generator",
    content: "Write a high-converting social media post hook for the following topic: [Topic]. Ensure it is hooky, targets a pain point, and includes a call to action. Tone: [Tone]",
    isCustom: false
  },
  {
    id: "marketing-2",
    category: "Marketing",
    title: "SEO Blog Post Outline",
    content: "Generate a detailed SEO-friendly blog post outline for the keyword: [Keyword]. Include recommended heading levels (H2, H3), search intent, target length, and LSI keywords to target.",
    isCustom: false
  },
  {
    id: "marketing-3",
    category: "Marketing",
    title: "Cold Outreach Email",
    content: "Create a personalized, compelling cold outreach email to a prospect in the [Industry] industry. The offer is [Offer] and the goal is to book a 15-minute discovery call. Keep it concise, focused on their benefit, and conversational.",
    isCustom: false
  },
  // Development
  {
    id: "dev-1",
    category: "Development",
    title: "Code Refactor Specialist",
    content: "Refactor the following [Language] code for readability, performance, and compliance with best practices. Explain the specific optimizations and changes made:\n\n[Code]",
    isCustom: false
  },
  {
    id: "dev-2",
    category: "Development",
    title: "Regex Pattern Generator",
    content: "Generate a regular expression pattern that matches the following criteria: [Criteria]. Provide example matching strings and a detailed breakdown of how each part of the regex works in [Language/Standard].",
    isCustom: false
  },
  {
    id: "dev-3",
    category: "Development",
    title: "Code Documentation Writer",
    content: "Write comprehensive, professional JSDoc/TSDoc or docstring documentation for the following function/class. Describe all parameters, return types, throws, and include a usage example:\n\n[Code]",
    isCustom: false
  },
  // Writing & Design
  {
    id: "writing-1",
    category: "Writing & Design",
    title: "Tone & Voice Adjuster",
    content: "Rewrite the following text to have a [Desired Tone] tone. Maintain the core message but adjust vocabulary, syntax, and sentence length accordingly:\n\n[Text]",
    isCustom: false
  },
  {
    id: "writing-2",
    category: "Writing & Design",
    title: "Catchy Headline Copywriter",
    content: "Brainstorm 10 catchy, attention-grabbing headlines for a product named '[Product Name]'. It is a [Product Description] targeting [Target Audience]. Focus on emotional appeal and benefit-driven angles.",
    isCustom: false
  },
  {
    id: "writing-3",
    category: "Writing & Design",
    title: "Component Style Architect",
    content: "As an expert frontend architect, suggest the CSS/Tailwind classes, color palette, typography, and interactive hover/focus states to make a premium, modern [Component Name] component. The vibe should be [Vibe, e.g. glassmorphism dark mode].",
    isCustom: false
  }
];

export default function PromptManager() {


  // State
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Dialog / Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("Marketing");
  const [customCategory, setCustomCategory] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formError, setFormError] = useState("");

  // Load from LocalStorage or seed defaults
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

  // Sync to local storage
  const savePrompts = (newPrompts: Prompt[]) => {
    setPrompts(newPrompts);
    localStorage.setItem("dawndesk_prompts", JSON.stringify(newPrompts));
  };

  // Categories list
  const categories = ["All", ...Array.from(new Set(prompts.map((p) => p.category)))];

  // Filter & Search Prompts
  const filteredPrompts = prompts.filter((prompt) => {
    const matchesCategory = activeCategory === "All" || prompt.category === activeCategory;
    const matchesSearch =
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Actions
  const handleCopy = (id: string, text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };


  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this prompt template?")) {
      const updated = prompts.filter((p) => p.id !== id);
      savePrompts(updated);
    }
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
    
    // Check if category is standard or custom
    setFormCategory(prompt.category);
    setCustomCategory("");
    setFormContent(prompt.content);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSavePrompt = (e: React.FormEvent) => {
    e.preventDefault();

    const title = formTitle.trim();
    const finalCategory = (formCategory === "New Category..." ? customCategory.trim() : formCategory.trim());
    const content = formContent.trim();

    if (!title || !finalCategory || !content) {
      setFormError("Please fill out all fields.");
      return;
    }

    if (modalMode === "create") {
      const newPrompt: Prompt = {
        id: `custom-${Date.now()}`,
        title,
        category: finalCategory,
        content,
        isCustom: true
      };
      savePrompts([...prompts, newPrompt]);
    } else if (modalMode === "edit" && editingPromptId) {
      const updated = prompts.map((p) =>
        p.id === editingPromptId
          ? { ...p, title, category: finalCategory, content, isCustom: p.isCustom ?? true }
          : p
      );
      savePrompts(updated);
    }

    setIsModalOpen(false);
  };

  // Get Category Badge Style
  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case "Marketing":
        return "bg-orange-500/10 text-orange-400 border border-orange-500/30";
      case "Development":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/30";
      case "Writing & Design":
        return "bg-purple-500/10 text-purple-400 border border-purple-500/30";
      default:
        return "bg-yellow-500/10 text-yellow-300 border border-yellow-500/30";
    }
  };

  return (
    <WelcomeScreen appKey="prompts" title="Prompt Manager" description="Organize your AI prompt library securely offline.">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full flex-col gap-6 p-8 text-white max-w-7xl animate-fadeIn">
        {/* Header section */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-500 bg-clip-text text-transparent">
              Prompt Manager
            </h1>
            <p className="mt-1.5 text-sm text-white/60 max-w-xl">
              Browse, search, and organize high-quality AI templates. Click 'Use in Chat' to instantly draft your messages in the AI workspace.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-semibold text-black hover:bg-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.15)] hover:shadow-[0_0_25px_rgba(250,204,21,0.3)] hover:scale-[1.02] transition-all duration-300 shrink-0"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Add New Prompt
          </button>
        </div>

        {/* Filter and Search Panel */}
        <div className="flex flex-col gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 backdrop-blur-md">
          {/* Search */}
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-white/40" strokeWidth={2} />
            <input
              type="text"
              placeholder="Search prompt titles, categories, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950/60 py-3 pl-12 pr-4 text-sm text-white placeholder-white/30 outline-none focus:border-yellow-400/60 focus:bg-neutral-950 transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            )}
          </div>

          {/* Horizontal Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-t border-neutral-800/60 pt-3 overflow-x-auto no-scrollbar">
            <span className="text-xs font-semibold tracking-wider text-white/40 uppercase mr-2">
              Categories:
            </span>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`rounded-lg px-4 py-2 text-xs font-medium transition-all duration-200 ${
                  activeCategory === category
                    ? "bg-yellow-400 text-black font-semibold shadow-[0_0_12px_rgba(250,204,21,0.2)]"
                    : "bg-neutral-950/40 border border-neutral-800/80 text-white/60 hover:bg-neutral-800/60 hover:text-white"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Prompts Cards Grid */}
        {filteredPrompts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900/30 p-12 text-center backdrop-blur-sm">
            <FileQuestion className="w-12 h-12 text-white/20 mb-4" strokeWidth={1.5} />
            <h3 className="text-lg font-medium text-white/80">No templates found</h3>
            <p className="mt-1 text-sm text-white/40 max-w-sm">
              {searchQuery
                ? "We couldn't find any prompts matching your search terms. Try refining your keywords."
                : "There are no prompts stored in this category yet. Click '+ Add New Prompt' to make one."}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 rounded-lg border border-neutral-700 bg-neutral-800/40 px-4 py-2 text-xs hover:bg-neutral-800 hover:text-white transition-colors"
              >
                Clear Search Query
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPrompts.map((prompt) => (
              <div
                key={prompt.id}
                className="group flex flex-col justify-between rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5 hover:bg-neutral-900/70 hover:border-yellow-400/30 transition-all duration-300 shadow-xl hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] hover:scale-[1.01]"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${getCategoryBadgeClass(
                        prompt.category
                      )}`}
                    >
                      {prompt.category}
                    </span>
                    <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => openEditModal(prompt)}
                        className="rounded p-1 hover:bg-neutral-800 text-white/60 hover:text-white transition-colors"
                        title="Edit Prompt"
                      >
                        <Edit className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                      {(prompt.isCustom !== false) && (
                        <button
                          onClick={() => handleDelete(prompt.id)}
                          className="rounded p-1 hover:bg-red-500/10 text-white/60 hover:text-red-400 transition-colors"
                          title="Delete Prompt"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-wide group-hover:text-yellow-300/90 transition-colors duration-200">
                    {prompt.title}
                  </h3>

                  <div 
                    onClick={() => handleCopy(prompt.id, prompt.content)}
                    className="mt-3 block rounded-xl border border-neutral-800/80 bg-neutral-950/50 p-3.5 text-xs text-neutral-300 font-mono leading-relaxed min-h-[90px] max-h-[140px] overflow-y-auto hover:bg-neutral-950/80 hover:border-neutral-700/50 cursor-pointer transition-all duration-200 select-all group/code shadow-inner no-scrollbar"
                    title="Click to copy prompt template"
                  >
                    <p className="whitespace-pre-wrap break-words">{prompt.content}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-neutral-800/60 pt-3 gap-2">
                  <button
                    onClick={() => handleCopy(prompt.id, prompt.content)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-300 ${
                      copiedId === prompt.id
                        ? "bg-green-500/10 border-green-500/40 text-green-400"
                        : "bg-neutral-950/40 border-neutral-800/80 text-white/70 hover:bg-neutral-800/60 hover:text-white"
                    }`}
                  >
                    {copiedId === prompt.id ? (
                      <>
                        <Check className="w-3 h-3 text-green-400 animate-scaleUp" strokeWidth={3} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-white/50" strokeWidth={2} />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modern Creation/Editing Glassmorphic Dialog Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
            <div
              className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp"
              role="dialog"
              aria-modal="true"
            >
              {/* Modal Title */}
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h2 className="text-xl font-bold text-white">
                  {modalMode === "create" ? "Add New AI Prompt" : "Edit AI Prompt"}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1 hover:bg-neutral-800 text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" strokeWidth={2} />
                </button>
              </div>

              {/* Modal Body / Form */}
              <form onSubmit={handleSavePrompt} className="flex flex-col gap-4">
                {/* Form Error */}
                {formError && (
                  <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
                    {formError}
                  </div>
                )}

                {/* Title input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-white/70 tracking-wide uppercase">
                    Prompt Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Code Refactor Specialist"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="rounded-lg border border-neutral-800 bg-neutral-950/60 px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-yellow-400/60 focus:bg-neutral-950 transition-all duration-200"
                    required
                  />
                </div>

                {/* Category selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-white/70 tracking-wide uppercase">
                    Category
                  </label>
                  <div className="flex flex-col gap-2">
                    <select
                      value={formCategory}
                      onChange={(e) => {
                        setFormCategory(e.target.value);
                        if (e.target.value !== "New Category...") {
                          setCustomCategory("");
                        }
                      }}
                      className="rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-yellow-400/60 focus:bg-neutral-950 transition-all duration-200 cursor-pointer"
                    >
                      {/* Unique active categories except 'All' */}
                      {Array.from(
                        new Set(
                          prompts
                            .map((p) => p.category)
                            .filter((cat) => cat !== "All")
                        )
                      ).map((cat) => (
                        <option key={cat} value={cat} className="bg-neutral-900">
                          {cat}
                        </option>
                      ))}
                      <option value="New Category..." className="bg-neutral-900 font-semibold text-yellow-300">
                        + Create New Category...
                      </option>
                    </select>

                    {/* Custom Category Input (Conditional) */}
                    {formCategory === "New Category..." && (
                      <input
                        type="text"
                        placeholder="Enter new category name..."
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className="rounded-lg border border-neutral-800 bg-neutral-950/60 px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-yellow-400/60 focus:bg-neutral-950 transition-all duration-200 animate-slideDown"
                        required
                      />
                    )}
                  </div>
                </div>

                {/* Content textarea */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-white/77 tracking-wide uppercase">
                      Prompt Template
                    </label>
                    <span className="text-[10px] text-white/30 font-normal normal-case">
                      Use [Tag] for placeholders (e.g. [Keyword], [Code])
                    </span>
                  </div>
                  <textarea
                    placeholder="Type your prompt template here. For example:&#10;Analyze the following [Language] class for potential security flaws:&#10;&#10;[Code]"
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    rows={5}
                    className="rounded-lg border border-neutral-800 bg-neutral-950/60 px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-yellow-400/60 focus:bg-neutral-950 transition-all duration-200 resize-none font-mono"
                    required
                  />
                </div>

                {/* Action Buttons */}
                <div className="mt-2 flex items-center justify-end gap-3 border-t border-neutral-800 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-neutral-800 bg-neutral-950/40 px-4 py-2.5 text-xs font-semibold text-white/70 hover:bg-neutral-800/60 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-yellow-400 px-5 py-2.5 text-xs font-bold text-black hover:bg-yellow-300 transition-colors shadow-[0_0_12px_rgba(250,204,21,0.1)]"
                  >
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
