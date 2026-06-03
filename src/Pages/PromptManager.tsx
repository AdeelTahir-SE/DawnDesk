import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BarChart3, Bot, Check, ChevronRight, Clipboard, CloudUpload, Copy, Download, Edit, FileQuestion, Globe2, Hash, Heart, Home, Image, MessageSquareText, Plus, RefreshCw, Search, Sparkles, Tag, Trash2, Upload, UserCircle, Variable, X } from "lucide-react";
import WelcomeScreen from "../components/WelcomeScreen";
import ConnectionErrorModal from "../components/ConnectionErrorModal";
import { useAppLogger } from "../utils/LoggerContext";
import { isSupabaseConfigured } from "../lib/supabaseClient";
import {
  getCurrentUser,
  deletePromptFromHub,
  listPromptHubPromptsPage,
  publishPromptToHub,
  recordPromptHubSave,
  type PromptHubPrompt,
} from "../lib/workspaceSync";

interface PromptOutput {
  model: string;
  text: string;
  imageUrl: string;
}

interface Prompt {
  id: string;
  title: string;
  category: string;
  content: string;
  output?: PromptOutput;
  authorName?: string;
  sourceHubId?: string;
  isCustom?: boolean;
}

type HubProfile = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
};

const REMOVED_SEEDED_PROMPT_IDS = new Set([
  "marketing-1",
  "marketing-2",
  "marketing-3",
  "dev-1",
  "dev-2",
  "dev-3",
  "writing-1",
  "writing-2",
  "writing-3",
]);

function removeSeededPrompts(prompts: Prompt[]) {
  return prompts.filter((prompt) => prompt.isCustom !== false && !REMOVED_SEEDED_PROMPT_IDS.has(prompt.id));
}

const extractVariables = (content: string) => Array.from(new Set(content.match(/\[[^\]]+\]/g) ?? []));

const getPromptHubAuthor = (prompt: PromptHubPrompt) =>
  prompt.author_display_name || prompt.author_email || "DawnDesk creator";

const getPromptOutputType = (prompt: PromptHubPrompt) => {
  const hasText = Boolean(prompt.output_json?.text?.trim());
  const hasImage = Boolean(prompt.output_json?.imageUrl?.trim());
  if (hasText && hasImage) return "Text + Image";
  if (hasImage) return "Image";
  if (hasText) return "Text";
  return "Prompt Only";
};

const getPromptHubErrorMessage = (error: unknown) => {
  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();
  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("network request failed") ||
    lower.includes("internet connection")
  ) {
    return "Internet connection error. Prompt Hub could not reach the cloud workspace. Please check your connection and try again.";
  }
  if (lower.includes("supabase is not configured")) {
    return "Cloud sync is not configured. Add the required environment settings before opening Prompt Hub.";
  }
  return raw.split("\n")[0] || "Prompt Hub request failed. Please try again.";
};

const formatHubDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));

/* ---------- Image helpers ---------- */
const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const tryUrlToDataUrl = async (url: string): Promise<string> => {
  // Already a data URL — return as-is
  if (url.startsWith("data:")) return url;
  // Not a remote URL — return as-is
  if (!url.startsWith("http://") && !url.startsWith("https://")) return url;
  try {
    const res = await fetch(url);
    if (!res.ok) return url;
    const blob = await res.blob();
    if (blob.size === 0 || !blob.type.startsWith("image/")) return url;
    return await fileToDataUrl(new File([blob], "image", { type: blob.type }));
  } catch {
    return url; // keep original if conversion fails
  }
};

/* ---------- Robust image component ---------- */
function ProxiedImage({
  src,
  alt,
  className,
  variant = "dark",
}: {
  src: string | undefined;
  alt: string;
  className?: string;
  variant?: "dark" | "light";
}) {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const revokeRef = useRef<string | null>(null);
  const triedFetchRef = useRef(false);

  // Reset state when src changes
  useEffect(() => {
    setFailed(false);
    triedFetchRef.current = false;
    // Clean up old object URL
    if (revokeRef.current) {
      URL.revokeObjectURL(revokeRef.current);
      revokeRef.current = null;
    }

    const url = src?.trim();
    if (!url) {
      setResolvedSrc(null);
      return;
    }

    // Data URLs and blob URLs can be used directly
    if (url.startsWith("data:") || url.startsWith("blob:")) {
      setResolvedSrc(url);
      return;
    }

    // For http(s) URLs try direct first (set as initial src)
    setResolvedSrc(url);

    return () => {
      if (revokeRef.current) {
        URL.revokeObjectURL(revokeRef.current);
        revokeRef.current = null;
      }
    };
  }, [src]);

  const handleError = useCallback(() => {
    const url = src?.trim();
    if (!url || triedFetchRef.current) {
      setFailed(true);
      return;
    }
    // Only attempt fetch fallback for http(s) URLs
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      setFailed(true);
      return;
    }
    triedFetchRef.current = true;

    // Try normal fetch first (works in Tauri since CSP is disabled),
    // then fall back to no-cors opaque response as last resort
    fetch(url)
      .then((res) => {
        if (res.ok) return res.blob();
        throw new Error("cors fetch failed");
      })
      .catch(() =>
        fetch(url, { mode: "no-cors" }).then((res) => res.blob())
      )
      .then((blob) => {
        if (!blob || blob.size === 0) throw new Error("empty blob");
        const objectUrl = URL.createObjectURL(blob);
        revokeRef.current = objectUrl;
        setResolvedSrc(objectUrl);
      })
      .catch(() => {
        setFailed(true);
      });
  }, [src]);

  if (!resolvedSrc || failed) {
    const fallbackBg = variant === "light" ? "bg-neutral-100 text-neutral-400" : "bg-neutral-900/50 text-white/25";
    const fallbackText = variant === "light" ? "text-neutral-400" : "text-white/35";
    return (
      <div
        className={`flex items-center justify-center ${fallbackBg} ${className ?? ""}`}
        style={{ minHeight: 80 }}
      >
        <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
          <Image className="h-8 w-8" />
          <span className={`text-xs font-semibold ${fallbackText}`}>
            {failed ? "Image could not be loaded" : "No image"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      onError={handleError}
      referrerPolicy="no-referrer"
    />
  );
}

const PROMPT_HUB_PAGE_SIZE = 24;
const PROMPT_HUB_CACHE_KEY = "dawndesk_prompt_hub_cache_v1";
const PROMPT_HUB_CACHE_TTL = 1000 * 60 * 5;

type PromptHubCache = {
  savedAt: number;
  prompts: PromptHubPrompt[];
};

const readPromptHubCache = () => {
  try {
    const raw = localStorage.getItem(PROMPT_HUB_CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw) as PromptHubCache;
    if (!Array.isArray(cache.prompts) || Date.now() - cache.savedAt > PROMPT_HUB_CACHE_TTL) return null;
    return cache.prompts;
  } catch {
    return null;
  }
};

const writePromptHubCache = (prompts: PromptHubPrompt[]) => {
  localStorage.setItem(PROMPT_HUB_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), prompts } satisfies PromptHubCache));
};

export default function PromptManager() {
  const { logSuccess, logWarning, logError } = useAppLogger();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [activeView, setActiveView] = useState<"library" | "hub">("library");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hubPrompts, setHubPrompts] = useState<PromptHubPrompt[]>([]);
  const [hubLoading, setHubLoading] = useState(false);
  const [hubLoadingMore, setHubLoadingMore] = useState(false);
  const [hubHasMore, setHubHasMore] = useState(true);
  const [hubError, setHubError] = useState("");
  const [hubSort, setHubSort] = useState<"featured" | "newest" | "popular">("featured");
  const [hubMode, setHubMode] = useState<"explore" | "dashboard">("explore");
  const [selectedHubCategory, setSelectedHubCategory] = useState("All");
  const [selectedHubModel, setSelectedHubModel] = useState("All");
  const [selectedHubOutputType, setSelectedHubOutputType] = useState("All");
  const [selectedHubPrompt, setSelectedHubPrompt] = useState<PromptHubPrompt | null>(null);
  const [hubProfile, setHubProfile] = useState<HubProfile | null>(null);
  const [hubConnectionModalOpen, setHubConnectionModalOpen] = useState(false);
  const [hubConnectionBlocked, setHubConnectionBlocked] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [deletingHubPromptId, setDeletingHubPromptId] = useState<string | null>(null);
  const hubScrollRef = useRef<HTMLElement | null>(null);
  const hubLoadInFlightRef = useRef(false);
  const hubPageRef = useRef(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("Marketing");
  const [customCategory, setCustomCategory] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formModel, setFormModel] = useState("");
  const [formOutputText, setFormOutputText] = useState("");
  const [formOutputImageUrl, setFormOutputImageUrl] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("dawndesk_prompts");
    if (stored) {
      try {
        const storedPrompts = JSON.parse(stored);
        const nextPrompts = Array.isArray(storedPrompts) ? removeSeededPrompts(storedPrompts) : [];
        setPrompts(nextPrompts);
        localStorage.setItem("dawndesk_prompts", JSON.stringify(nextPrompts));
      } catch (e) {
        console.error("Failed to parse stored prompts, starting with an empty prompt library", e);
        setPrompts([]);
        localStorage.setItem("dawndesk_prompts", JSON.stringify([]));
      }
    } else {
      setPrompts([]);
      localStorage.setItem("dawndesk_prompts", JSON.stringify([]));
    }
  }, []);

  const mergeHubPrompts = (current: PromptHubPrompt[], incoming: PromptHubPrompt[]) => {
    const byId = new Map(current.map((prompt) => [prompt.id, prompt]));
    for (const prompt of incoming) byId.set(prompt.id, prompt);
    return Array.from(byId.values());
  };

  const loadHubPrompts = useCallback(async ({ reset = false, useCache = false } = {}) => {
    if (!isSupabaseConfigured) {
      setHubError("Connect cloud sync to browse the public Prompt Hub.");
      setHubConnectionBlocked(true);
      setHubConnectionModalOpen(true);
      return;
    }

    if (hubLoadInFlightRef.current) return;
    hubLoadInFlightRef.current = true;

    const nextPage = reset ? 0 : hubPageRef.current;
    if (reset && useCache) {
      const cachedPrompts = readPromptHubCache();
      if (cachedPrompts?.length) setHubPrompts(cachedPrompts);
    }

    if (reset) setHubLoading(true);
    else setHubLoadingMore(true);

    setHubError("");
    try {
      const page = await listPromptHubPromptsPage({ page: nextPage, pageSize: PROMPT_HUB_PAGE_SIZE });
      setHubPrompts((current) => {
        const nextPrompts = reset ? page.prompts : mergeHubPrompts(current, page.prompts);
        writePromptHubCache(nextPrompts);
        return nextPrompts;
      });
      const followingPage = nextPage + 1;
      hubPageRef.current = followingPage;
      setHubHasMore(page.hasMore);
      setHubConnectionBlocked(false);
    } catch (error) {
      const message = getPromptHubErrorMessage(error);
      setHubError(message);
      setHubConnectionBlocked(true);
      setHubConnectionModalOpen(true);
      logError("Prompt hub load failed", message, { source: "prompts" });
    } finally {
      setHubLoading(false);
      setHubLoadingMore(false);
      hubLoadInFlightRef.current = false;
    }
  }, [logError]);

  useEffect(() => {
    if (activeView === "hub") {
      void loadHubPrompts({ reset: true, useCache: true });
      void loadHubProfile();
    }
  }, [activeView, loadHubPrompts]);

  const handleHubScroll = () => {
    const element = hubScrollRef.current;
    if (!element || hubMode !== "explore" || !hubHasMore || hubLoading || hubLoadingMore) return;
    const remaining = element.scrollHeight - element.scrollTop - element.clientHeight;
    if (remaining < 700) void loadHubPrompts();
  };

  const loadHubProfile = async () => {
    if (!isSupabaseConfigured) return;
    try {
      const user = await getCurrentUser();
      const metadata = user.user_metadata ?? {};
      const email = user.email ?? "";
      setHubProfile({
        id: user.id,
        name: metadata.full_name ?? metadata.name ?? (email ? email.split("@")[0] : "DawnDesk User"),
        email,
        avatarUrl: metadata.avatar_url ?? metadata.picture ?? "",
      });
    } catch {
      setHubProfile(null);
    }
  };

  const savePrompts = (nextPrompts: Prompt[]) => {
    setPrompts(nextPrompts);
    localStorage.setItem("dawndesk_prompts", JSON.stringify(nextPrompts));
  };

  const categories = useMemo(() => ["All", ...Array.from(new Set(prompts.map((prompt) => prompt.category)))], [prompts]);
  const hubCategories = useMemo(() => ["All", ...Array.from(new Set(hubPrompts.map((prompt) => prompt.category).filter(Boolean)))], [hubPrompts]);
  const hubModels = useMemo(() => {
    const models = hubPrompts
      .map((prompt) => prompt.output_json?.model || prompt.model)
      .filter((model): model is string => Boolean(model?.trim()));
    return ["All", ...Array.from(new Set(models))];
  }, [hubPrompts]);
  const hubOutputTypes = useMemo(() => ["All", ...Array.from(new Set(hubPrompts.map(getPromptOutputType)))], [hubPrompts]);

  const filteredPrompts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return prompts.filter((prompt) => {
      const matchesCategory = activeCategory === "All" || prompt.category === activeCategory;
      const output = prompt.output;
      const matchesSearch = `${prompt.title} ${prompt.category} ${prompt.content} ${output?.model ?? ""} ${output?.text ?? ""} ${output?.imageUrl ?? ""}`.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, prompts, searchQuery]);

  const filteredHubPrompts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const next = hubPrompts.filter((prompt) => {
      const output = prompt.output_json;
      const author = getPromptHubAuthor(prompt);
      const model = output?.model || prompt.model || "";
      const matchesCategory = selectedHubCategory === "All" || prompt.category === selectedHubCategory;
      const matchesModel = selectedHubModel === "All" || model === selectedHubModel;
      const matchesOutputType = selectedHubOutputType === "All" || getPromptOutputType(prompt) === selectedHubOutputType;
      return `${prompt.title} ${prompt.category} ${prompt.content} ${prompt.model ?? ""} ${output?.model ?? ""} ${output?.text ?? ""} ${author}`
        .toLowerCase()
        .includes(query) && matchesCategory && matchesModel && matchesOutputType;
    });

    if (hubSort === "featured" || hubSort === "popular") {
      return [...next].sort((a, b) => {
        const aScore = (a.output_json?.imageUrl ? 2 : 0) + (a.output_json?.text ? 1 : 0);
        const bScore = (b.output_json?.imageUrl ? 2 : 0) + (b.output_json?.text ? 1 : 0);
        const popularOffset = hubSort === "popular" ? a.title.localeCompare(b.title) : 0;
        return bScore - aScore || popularOffset || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }

    return next;
  }, [hubPrompts, hubSort, searchQuery, selectedHubCategory, selectedHubModel, selectedHubOutputType]);

  const myHubPrompts = useMemo(
    () => hubPrompts.filter((prompt) => hubProfile?.id && prompt.author_id === hubProfile.id),
    [hubProfile?.id, hubPrompts],
  );

  const hubDashboardStats = useMemo(() => {
    const localHubSaves = prompts.filter((prompt) => prompt.sourceHubId).length;
    const totalSaves = myHubPrompts.reduce((sum, prompt) => sum + (prompt.saves_count ?? 0), 0);
    const topPrompt = [...myHubPrompts].sort((a, b) => (b.saves_count ?? 0) - (a.saves_count ?? 0))[0];
    const categoriesShared = new Set(myHubPrompts.map((prompt) => prompt.category)).size;

    return {
      localHubSaves,
      totalSaves,
      topPrompt,
      categoriesShared,
    };
  }, [myHubPrompts, prompts]);

  const handleCopy = (id: string, text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    logSuccess("Prompt copied", "Prompt content copied to clipboard.", { source: "prompts" });
    window.setTimeout(() => setCopiedId(null), 1400);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this prompt template?")) return;
    savePrompts(prompts.filter((prompt) => prompt.id !== id));
    logWarning("Prompt deleted", "Prompt template removed from the library.", { source: "prompts" });
  };

  const handlePublishPrompt = async (prompt: Prompt) => {
    if (!isSupabaseConfigured) {
      logWarning("Prompt hub unavailable", "Connect cloud sync before publishing prompts.", { source: "prompts" });
      setHubConnectionBlocked(true);
      setHubConnectionModalOpen(true);
      return;
    }

    setPublishingId(prompt.id);
    try {
      await publishPromptToHub({
        title: prompt.title,
        category: prompt.category,
        content: prompt.content,
        output: prompt.output,
      });
      logSuccess("Prompt published", `${prompt.title} is now available in Prompt Hub.`, { source: "prompts" });
      if (activeView === "hub") await loadHubPrompts({ reset: true });
    } catch (error) {
      const message = getPromptHubErrorMessage(error);
      setHubConnectionBlocked(true);
      setHubConnectionModalOpen(true);
      logError("Prompt publish failed", message, { source: "prompts" });
    } finally {
      setPublishingId(null);
    }
  };

  const handleSaveHubPrompt = async (hubPrompt: PromptHubPrompt) => {
    if (prompts.some((prompt) => prompt.sourceHubId === hubPrompt.id)) {
      logWarning("Prompt already saved", "This Prompt Hub item is already in your local library.", { source: "prompts" });
      return;
    }

    const rawImageUrl = hubPrompt.output_json?.imageUrl || "";
    // Convert remote image to embedded data URL so it always displays locally
    const imageUrl = rawImageUrl ? await tryUrlToDataUrl(rawImageUrl) : "";
    const output = hubPrompt.output_json
      ? {
          model: hubPrompt.output_json.model || hubPrompt.model || "",
          text: hubPrompt.output_json.text || "",
          imageUrl,
        }
      : undefined;
    const authorName = getPromptHubAuthor(hubPrompt);
    savePrompts([
      {
        id: `hub-${hubPrompt.id}`,
        title: hubPrompt.title,
        category: hubPrompt.category,
        content: hubPrompt.content,
        output,
        authorName,
        sourceHubId: hubPrompt.id,
        isCustom: true,
      },
      ...prompts,
    ]);
    try {
      await recordPromptHubSave(hubPrompt.id);
      setHubPrompts((items) =>
        items.map((prompt) =>
          prompt.id === hubPrompt.id ? { ...prompt, saves_count: (prompt.saves_count ?? 0) + 1 } : prompt,
        ),
      );
      setSelectedHubPrompt((current) =>
        current?.id === hubPrompt.id ? { ...current, saves_count: (current.saves_count ?? 0) + 1 } : current,
      );
    } catch (error) {
      logWarning("Prompt saved locally", `Saved locally, but Prompt Hub could not record the save count: ${getPromptHubErrorMessage(error)}`, { source: "prompts" });
    }
    logSuccess("Prompt saved locally", `Saved ${hubPrompt.title} by ${authorName}.`, { source: "prompts" });
  };

  const handleDeleteHubPrompt = async (prompt: PromptHubPrompt) => {
    if (!hubProfile?.id || prompt.author_id !== hubProfile.id) {
      logWarning("Prompt Hub delete blocked", "Only the prompt author can delete a published prompt.", { source: "prompts" });
      return;
    }

    if (!window.confirm(`Delete "${prompt.title}" from Prompt Hub? Local copies saved by other people will remain on their devices.`)) return;

    setDeletingHubPromptId(prompt.id);
    try {
      await deletePromptFromHub(prompt.id);
      setHubPrompts((items) => items.filter((item) => item.id !== prompt.id));
      setSelectedHubPrompt((current) => (current?.id === prompt.id ? null : current));
      logWarning("Prompt deleted from hub", `${prompt.title} was removed from Prompt Hub.`, { source: "prompts" });
    } catch (error) {
      logError("Prompt Hub delete failed", getPromptHubErrorMessage(error), { source: "prompts" });
    } finally {
      setDeletingHubPromptId(null);
    }
  };

  const openCreateModal = () => {
    setModalMode("create");
    setEditingPromptId(null);
    setFormTitle("");
    setFormCategory(categories[1] || "New Category...");
    setCustomCategory("");
    setFormContent("");
    setFormModel("");
    setFormOutputText("");
    setFormOutputImageUrl("");
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
    setFormModel(prompt.output?.model ?? "");
    setFormOutputText(prompt.output?.text ?? "");
    setFormOutputImageUrl(prompt.output?.imageUrl ?? "");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleImageFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setFormError("Selected file is not an image.");
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setFormOutputImageUrl(dataUrl);
    } catch {
      setFormError("Failed to read the image file.");
    }
  };

  const handlePasteImageFromClipboard = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith("image/"));
        if (imageType) {
          const blob = await item.getType(imageType);
          const dataUrl = await fileToDataUrl(new File([blob], "pasted-image", { type: imageType }));
          setFormOutputImageUrl(dataUrl);
          return;
        }
      }
      setFormError("No image found in clipboard. Try copying an image first.");
    } catch {
      setFormError("Could not access clipboard. Please allow clipboard permissions or use Upload instead.");
    }
  };

  const handleSavePrompt = (event: React.FormEvent) => {
    event.preventDefault();
    const title = formTitle.trim();
    const finalCategory = formCategory === "New Category..." ? customCategory.trim() : formCategory.trim();
    const content = formContent.trim();
    const model = formModel.trim();
    const outputText = formOutputText.trim();
    const imageUrl = formOutputImageUrl.trim();
    const output = model || outputText || imageUrl ? { model, text: outputText, imageUrl } : undefined;

    if (!title || !finalCategory || !content) {
      setFormError("Please fill out all fields.");
      return;
    }

    if (modalMode === "create") {
      savePrompts([{ id: `custom-${Date.now()}`, title, category: finalCategory, content, output, isCustom: true }, ...prompts]);
      logSuccess("Prompt created", title, { source: "prompts" });
    } else if (editingPromptId) {
      savePrompts(
        prompts.map((prompt) =>
          prompt.id === editingPromptId
            ? { ...prompt, title, category: finalCategory, content, output, isCustom: prompt.isCustom ?? true }
            : prompt,
        ),
      );
      logSuccess("Prompt updated", title, { source: "prompts" });
    }

    setIsModalOpen(false);
  };

  const canPublishToHub = isSupabaseConfigured && !hubConnectionBlocked;

  if (activeView === "hub") {
    return (
      <WelcomeScreen appKey="prompts" title="Prompt Manager" description="Browse, save, and publish prompt templates.">
        <div className="prompt-hub-shell flex h-[calc(100vh-4rem)] overflow-hidden bg-[#f5f3ee] text-neutral-950">
          <aside className="prompt-hub-sidebar dd-sidebar-narrow custom-scrollbar overflow-y-auto px-3 py-4">
            <div className="dd-sidebar-header -mx-3 -mt-4 mb-4 px-5 py-5">
              <div>
                <h1 className="dd-sidebar-title text-base">Prompts</h1>
                <p className="dd-subtext">{prompts.length} templates</p>
              </div>
            </div>

            <nav className="space-y-1">
              <button onClick={() => setActiveView("library")} className="prompt-hub-nav-item dd-nav-item-sm">
                <Home className="h-4 w-4" />
                <span className="prompt-hub-nav-label">My Library</span>
              </button>
              <button
                onClick={() => setHubMode("explore")}
                className={`prompt-hub-nav-item dd-nav-item-sm ${
                  hubMode === "explore" ? "dd-nav-item-sm-active prompt-hub-nav-active" : ""
                }`}
              >
                <Globe2 className="h-4 w-4" />
                <span className="prompt-hub-nav-label">Prompt Hub</span>
              </button>
              <button
                onClick={() => setHubMode("dashboard")}
                className={`prompt-hub-nav-item dd-nav-item-sm ${
                  hubMode === "dashboard" ? "dd-nav-item-sm-active prompt-hub-nav-active" : ""
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span className="prompt-hub-nav-label">My Dashboard</span>
              </button>
            </nav>

            <div className="mt-7">
              <p className="dd-label-muted mb-2 px-2">Categories</p>
              <div className="space-y-1">
                {hubCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedHubCategory(category)}
                    className={`prompt-hub-filter dd-nav-item-sm justify-between ${
                      selectedHubCategory === category ? "dd-nav-item-sm-active prompt-hub-filter-active" : ""
                    }`}
                  >
                    <span className="inline-flex min-w-0 items-center gap-3">
                      {category === "All" ? <Hash className="h-4 w-4 shrink-0" /> : <Tag className="h-4 w-4 shrink-0" />}
                      <span className="truncate">{category}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" />
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-7">
              <p className="dd-label-muted mb-2 px-2">Output Type</p>
              <div className="space-y-1">
                {hubOutputTypes.map((type) => {
                  const Icon = type === "Image" ? Image : type === "Text" ? MessageSquareText : type === "Text + Image" ? Sparkles : FileQuestion;
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedHubOutputType(type)}
                      className={`prompt-hub-filter dd-nav-item-sm ${
                        selectedHubOutputType === type ? "dd-nav-item-sm-active prompt-hub-filter-active" : ""
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{type}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-7">
              <p className="dd-label-muted mb-2 px-2">Models</p>
              <div className="space-y-1">
                {hubModels.slice(0, 7).map((model) => (
                  <button
                    key={model}
                    onClick={() => setSelectedHubModel(model)}
                    className={`prompt-hub-filter dd-nav-item-sm ${
                      selectedHubModel === model ? "dd-nav-item-sm-active prompt-hub-filter-active" : ""
                    }`}
                  >
                    <Bot className="h-4 w-4 shrink-0" />
                    <span className="truncate">{model}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="prompt-hub-profile mt-3 flex items-center gap-3 border-t border-neutral-800/70 px-1.5 py-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-neutral-950 text-white">
                {hubProfile?.avatarUrl ? (
                  <img src={hubProfile.avatarUrl} alt={hubProfile.name} className="h-full w-full object-cover" />
                ) : (
                  <UserCircle className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-white">{hubProfile?.name ?? "DawnDesk User"}</p>
                <p className="truncate text-xs font-semibold text-white/45">{hubProfile?.email || "Signed in profile"}</p>
              </div>
            </div>
          </aside>

          <main ref={hubScrollRef} onScroll={handleHubScroll} className="custom-scrollbar relative flex-1 overflow-y-auto">
            {hubMode === "explore" && (
              <div className="prompt-hub-topbar sticky top-0 z-20 border-b border-neutral-200 bg-[#f5f3ee]/90 px-5 py-3 backdrop-blur-xl">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    {["All", ...hubModels.filter((model) => model !== "All").slice(0, 4)].map((model) => (
                      <button
                        key={model}
                        onClick={() => setSelectedHubModel(model)}
                        className={`prompt-hub-chip rounded-xl border px-4 py-2 text-sm font-semibold ${
                          selectedHubModel === model ? "prompt-hub-chip-active border-yellow-400 bg-yellow-400 text-neutral-950" : "border-transparent bg-neutral-200/70 text-neutral-600 hover:bg-neutral-300"
                        }`}
                      >
                        {model}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative w-full min-w-[260px] lg:w-80">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                      <input
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search prompts, authors, models..."
                        className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-10 text-sm font-medium text-neutral-900 outline-none focus:border-neutral-400"
                      />
                      {searchQuery && (
                        <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-950">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <button onClick={() => void loadHubPrompts({ reset: true })} className="grid h-11 w-11 place-items-center rounded-xl bg-white text-neutral-700 shadow-sm" title="Refresh hub">
                      <RefreshCw className={`h-4 w-4 ${hubLoading ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="px-5 py-5">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-neutral-400">DawnDesk Prompt Hub</p>
                  <h2 className="mt-1 text-3xl font-black tracking-tight text-neutral-950">
                    {hubMode === "dashboard" ? "Your Prompt Hub dashboard" : "Explore community prompts"}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {hubMode === "explore" && (
                    <div className="inline-flex rounded-2xl bg-white p-1 shadow-sm">
                      {(["featured", "newest", "popular"] as const).map((sort) => (
                        <button
                          key={sort}
                          onClick={() => setHubSort(sort)}
                          className={`prompt-hub-sort rounded-xl px-4 py-2 text-sm font-bold capitalize ${
                            hubSort === sort ? "prompt-hub-sort-active bg-yellow-400 text-neutral-950" : "bg-neutral-100/70 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-950"
                          }`}
                        >
                          {sort}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {hubError && (
                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {hubError}
                </div>
              )}

              {hubMode === "dashboard" ? (
                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                      { label: "Published", caption: "Prompts live on Hub", value: myHubPrompts.length, icon: CloudUpload },
                      { label: "Saved by others", caption: "Local saves of your work", value: hubDashboardStats.totalSaves, icon: Heart },
                      { label: "Saved locally", caption: "Hub prompts in library", value: hubDashboardStats.localHubSaves, icon: Download },
                      { label: "Categories", caption: "Topics you shared", value: hubDashboardStats.categoriesShared, icon: Tag },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className="prompt-hub-dashboard-stat rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-neutral-950">{item.label}</p>
                              <p className="mt-1 truncate text-xs font-semibold text-neutral-500">{item.caption}</p>
                            </div>
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-700">
                              <Icon className="h-5 w-5" />
                            </div>
                          </div>
                          <p className="mt-4 text-4xl font-black tracking-tight text-neutral-950">{item.value}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
                    <section className="prompt-hub-dashboard-panel overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                      <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4">
                        <div>
                          <h3 className="text-lg font-black text-neutral-950">Your published prompts</h3>
                          <p className="mt-1 text-sm font-semibold text-neutral-500">Manage what stays visible in Prompt Hub.</p>
                        </div>
                        <button onClick={() => setActiveView("library")} className="flex shrink-0 items-center gap-2 rounded-xl bg-neutral-950 px-4 py-2 text-sm font-bold text-white">
                          <Plus className="h-4 w-4" />
                          Publish more
                        </button>
                      </div>

                      {hubLoading && hubPrompts.length === 0 ? (
                        <div className="grid min-h-[240px] place-items-center text-sm font-bold text-neutral-500">Loading your dashboard...</div>
                      ) : myHubPrompts.length === 0 ? (
                        <div className="grid min-h-[240px] place-items-center px-6 text-center">
                          <div>
                            <CloudUpload className="mx-auto mb-4 h-10 w-10 text-neutral-300" />
                            <h4 className="text-base font-black text-neutral-950">No published prompts yet</h4>
                            <p className="mt-1 text-sm text-neutral-500">Publish from your local library to start seeing saved counts here.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="divide-y divide-neutral-100">
                          {myHubPrompts.map((prompt) => (
                            <article key={prompt.id} className="prompt-hub-published-row grid gap-4 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_96px_92px] lg:items-center">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="truncate text-base font-black text-neutral-950">{prompt.title}</h4>
                                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-600">{prompt.category}</span>
                                </div>
                                <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-600">{prompt.content}</p>
                              </div>
                              <div className="prompt-hub-save-count inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-50 px-3 py-2 text-center">
                                <Download className="h-4 w-4" />
                                <div className="text-left">
                                  <p className="text-lg font-black leading-none text-neutral-950">{prompt.saves_count ?? 0}</p>
                                  <p className="text-[11px] font-bold leading-none text-neutral-500">saves</p>
                                </div>
                              </div>
                              <button
                                onClick={() => void handleDeleteHubPrompt(prompt)}
                                disabled={deletingHubPromptId === prompt.id}
                                className="prompt-hub-delete-button flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm font-bold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            </article>
                          ))}
                        </div>
                      )}
                    </section>

                    <aside className="space-y-5">
                      <div className="prompt-hub-dashboard-panel rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-neutral-950 text-white">
                            {hubProfile?.avatarUrl ? (
                              <img src={hubProfile.avatarUrl} alt={hubProfile.name} className="h-full w-full object-cover" />
                            ) : (
                              <UserCircle className="h-7 w-7" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-lg font-black text-neutral-950">{hubProfile?.name ?? "DawnDesk User"}</p>
                            <p className="truncate text-sm font-semibold text-neutral-500">{hubProfile?.email || "Signed in profile"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="prompt-hub-dashboard-panel rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-yellow-600" />
                          <h3 className="text-base font-black text-neutral-950">Best performer</h3>
                        </div>
                        {hubDashboardStats.topPrompt ? (
                          <div className="mt-4">
                            <p className="text-xl font-black leading-tight text-neutral-950">{hubDashboardStats.topPrompt.title}</p>
                            <p className="mt-2 text-sm leading-6 text-neutral-600">
                              Saved locally by {hubDashboardStats.topPrompt.saves_count ?? 0} people.
                            </p>
                          </div>
                        ) : (
                          <p className="mt-4 text-sm leading-6 text-neutral-500">Publish prompts to see which ones people save most.</p>
                        )}
                      </div>
                    </aside>
                  </div>
                </div>
              ) : hubLoading && hubPrompts.length === 0 ? (
                <div className="grid min-h-[420px] place-items-center text-sm font-bold text-neutral-500">Loading Prompt Hub...</div>
              ) : filteredHubPrompts.length === 0 ? (
                <div className="grid min-h-[420px] place-items-center rounded-3xl border border-dashed border-neutral-300 bg-white/60 text-center">
                  <div>
                    <Globe2 className="mx-auto mb-4 h-10 w-10 text-neutral-300" />
                    <h3 className="text-lg font-black text-neutral-950">No prompts found</h3>
                    <p className="mt-1 text-sm text-neutral-500">Publish a prompt or adjust your filters.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="columns-1 gap-4 sm:columns-2 xl:columns-3 2xl:columns-4">
                    {filteredHubPrompts.map((prompt, index) => {
                    const output = prompt.output_json;
                    const authorName = getPromptHubAuthor(prompt);
                    const savedLocally = prompts.some((item) => item.sourceHubId === prompt.id);
                    const hasImage = Boolean(output?.imageUrl);
                    const visualHeights = ["h-72", "h-48", "h-80", "h-60", "h-96"];
                    return (
                      <button
                        key={prompt.id}
                        onClick={() => setSelectedHubPrompt(prompt)}
                        className="prompt-hub-card mb-4 block w-full break-inside-avoid overflow-hidden rounded-3xl bg-white text-left shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-xl"
                      >
                        {hasImage ? (
                          <ProxiedImage
                            src={output?.imageUrl}
                            alt={`${prompt.title} output`}
                            className="h-auto w-full bg-neutral-100 object-contain"
                            variant="light"
                          />
                        ) : (
                          <div className={`${visualHeights[index % visualHeights.length]} flex flex-col justify-between bg-gradient-to-br from-neutral-950 via-neutral-800 to-yellow-500 p-5 text-white`}>
                            <Sparkles className="h-8 w-8 text-yellow-300" />
                            <p className="line-clamp-6 text-2xl font-black leading-tight">{prompt.title}</p>
                          </div>
                        )}
                        <div className={`${hasImage ? "space-y-2 p-3" : "space-y-3 p-4"}`}>
                          <div className="prompt-hub-card-meta flex min-h-7 flex-wrap items-start gap-2">
                            <span className="prompt-hub-card-pill inline-flex max-w-full shrink-0 items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold leading-5 text-neutral-600">
                              <span className="truncate">{prompt.category}</span>
                            </span>
                            <span className="prompt-hub-output-pill inline-flex max-w-full shrink-0 items-center rounded-full bg-yellow-300 px-3 py-1 text-xs font-black leading-5 text-neutral-950 shadow-sm ring-1 ring-yellow-500/20">
                              <span className="truncate">{getPromptOutputType(prompt)}</span>
                            </span>
                          </div>
                          <h3 className={`${hasImage ? "line-clamp-2 text-base" : "line-clamp-2 text-lg"} font-black leading-tight text-neutral-950`}>{prompt.title}</h3>
                          <p className={`${hasImage ? "line-clamp-2 text-xs leading-5" : "line-clamp-3 text-sm leading-6"} text-neutral-600`}>{prompt.content}</p>
                          <div className="flex items-center justify-between gap-3 pt-1">
                            <div className="flex min-w-0 items-center gap-2">
                              <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-neutral-950 text-white">
                                {prompt.author_avatar_url ? (
                                  <img src={prompt.author_avatar_url} alt={authorName} className="h-full w-full object-cover" />
                                ) : (
                                  <UserCircle className="h-4 w-4" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-neutral-800">{authorName}</p>
                                <p className="truncate text-xs text-neutral-400">{output?.model || prompt.model || formatHubDate(prompt.created_at)}</p>
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-bold text-neutral-500">
                                <Download className="h-3.5 w-3.5" />
                                {prompt.saves_count ?? 0}
                              </span>
                              {savedLocally && <Check className="h-5 w-5 text-green-600" />}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                    })}
                  </div>
                  <div className="grid min-h-16 place-items-center py-3 text-sm font-bold text-neutral-500">
                    {hubLoadingMore ? "Loading more prompts..." : hubHasMore ? "Scroll for more prompts" : "You are all caught up"}
                  </div>
                </>
              )}
            </div>

          </main>

          {selectedHubPrompt && (
            <div className="prompt-hub-detail fixed inset-0 z-[160] flex bg-neutral-200/85 backdrop-blur-sm">
              <div className="custom-scrollbar flex min-w-0 flex-1 items-center justify-center overflow-y-auto p-6">
                <div className="flex w-full max-w-4xl items-center justify-center gap-5">
                  <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                    {selectedHubPrompt.output_json?.imageUrl ? (
                      <ProxiedImage
                        src={selectedHubPrompt.output_json.imageUrl}
                        alt={`${selectedHubPrompt.title} output`}
                        className="max-h-[78vh] w-full object-contain"
                        variant="light"
                      />
                    ) : (
                      <div className="min-h-[520px] bg-gradient-to-br from-neutral-950 via-neutral-800 to-yellow-500 p-10 text-white">
                        <Sparkles className="mb-10 h-10 w-10 text-yellow-300" />
                        <p className="text-sm font-black uppercase tracking-[0.2em] text-yellow-200">{selectedHubPrompt.category}</p>
                        <h2 className="mt-4 max-w-xl text-5xl font-black leading-tight">{selectedHubPrompt.title}</h2>
                        <p className="mt-6 max-w-xl whitespace-pre-wrap text-lg leading-8 text-white/75">{selectedHubPrompt.content}</p>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              <aside className="prompt-hub-detail-panel flex w-[34rem] max-w-[42vw] shrink-0 flex-col border-l border-neutral-200 bg-white">
                <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-6 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-neutral-950 text-white">
                      {selectedHubPrompt.author_avatar_url ? (
                        <img src={selectedHubPrompt.author_avatar_url} alt={getPromptHubAuthor(selectedHubPrompt)} className="h-full w-full object-cover" />
                      ) : (
                        <UserCircle className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-neutral-950">{getPromptHubAuthor(selectedHubPrompt)}</p>
                      <p className="truncate text-xs font-semibold text-neutral-500">{selectedHubPrompt.author_email || "Prompt creator"}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    <span className="prompt-hub-detail-save-pill inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-1.5 text-xs font-black leading-none text-neutral-950">
                      <Download className="h-3.5 w-3.5" />
                      <span>{selectedHubPrompt.saves_count ?? 0}</span>
                      <span className="hidden sm:inline">saved</span>
                    </span>
                    <span className="max-w-24 truncate rounded-full bg-neutral-100 px-2.5 py-1.5 text-xs font-bold leading-none text-neutral-600" title={selectedHubPrompt.output_json?.model || selectedHubPrompt.model || "Prompt"}>
                      {selectedHubPrompt.output_json?.model || selectedHubPrompt.model || "Prompt"}
                    </span>
                    <button onClick={() => setSelectedHubPrompt(null)} className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
                  <div className="prompt-hub-detail-copy rounded-3xl bg-[#f7f5ef] p-5">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-neutral-500">Topic: {selectedHubPrompt.category}</p>
                    <h2 className="mt-4 text-2xl font-black leading-tight text-neutral-950">{selectedHubPrompt.title}</h2>
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-neutral-700">{selectedHubPrompt.content}</p>
                    {selectedHubPrompt.output_json?.text && (
                      <div className="mt-6 border-t border-neutral-200 pt-5">
                        <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-neutral-500">Stored output</p>
                        <p className="whitespace-pre-wrap text-sm leading-7 text-neutral-700">{selectedHubPrompt.output_json.text}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-neutral-100 p-5">
                  <button
                    onClick={() => handleCopy(selectedHubPrompt.id, selectedHubPrompt.content)}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-4 py-4 text-sm font-black text-white hover:bg-neutral-800"
                  >
                    {copiedId === selectedHubPrompt.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    Use as Prompt
                  </button>
                  <button
                    onClick={() => void handleSaveHubPrompt(selectedHubPrompt)}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-4 py-4 text-sm font-black text-white hover:bg-neutral-800"
                  >
                    <Download className="h-4 w-4" />
                    Save Local
                  </button>
                </div>
              </aside>
            </div>
          )}
          <ConnectionErrorModal
            open={hubConnectionModalOpen}
            onClose={() => setHubConnectionModalOpen(false)}
          />
        </div>
      </WelcomeScreen>
    );
  }

  return (
    <WelcomeScreen appKey="prompts" title="Prompt Manager" description="Organize your AI prompt library securely offline.">
      <div className="dd-page">
        <aside className="dd-sidebar-narrow">
          <div className="dd-sidebar-header">
            <div className="flex items-center gap-3">
              
              <div>
                <h1 className="dd-sidebar-title text-base">Prompts</h1>
                <p className="dd-subtext">{prompts.length} templates</p>
              </div>
            </div>
          </div>

          <nav className="custom-scrollbar h-full flex-1 overflow-y-auto p-3">
            <p className="dd-label-muted mb-2 px-2">Library</p>
            <div className="mb-5 space-y-1">
              <button
                onClick={() => setActiveView("library")}
                className="dd-nav-item-sm dd-nav-item-sm-active justify-between"
              >
                <span className="inline-flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  My Prompts
                </span>
                <span className="text-xs text-white/35">{prompts.length}</span>
              </button>
              <button
                onClick={() => setActiveView("hub")}
                className="dd-nav-item-sm"
              >
                <span className="inline-flex items-center gap-2">
                  <Globe2 className="h-4 w-4" />
                  Prompt Hub
                </span>
              </button>
            </div>

            <p className="dd-label-muted mb-2 px-2">Categories</p>
            <div className="space-y-1">
              {categories.map((category) => {
                const count = category === "All" ? prompts.length : prompts.filter((prompt) => prompt.category === category).length;
                return (
                  <button
                    key={category}
                    onClick={() => {
                      setActiveView("library");
                      setActiveCategory(category);
                    }}
                    className={`dd-nav-item-sm justify-between ${
                      activeCategory === category ? "dd-nav-item-sm-active" : ""
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
            <section className="dd-hero">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="dd-label">Prompt Manager</p>
                  <h2 className="dd-page-title mt-2">Reusable Prompt Library</h2>
                  <p className="dd-body-lg max-w-2xl mt-2">Keep your best AI instructions organized, searchable, and ready to copy.</p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2 lg:self-auto">
                  <button
                    onClick={() => setActiveView("hub")}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-950/45 px-3 text-xs font-bold text-white/70 transition-colors hover:border-neutral-700 hover:bg-neutral-900 hover:text-white"
                  >
                    <Globe2 className="h-3.5 w-3.5 text-white/55" />
                    Open Hub
                  </button>
                  <button
                    onClick={openCreateModal}
                    className="inline-flex h-9 items-center gap-2 rounded-lg bg-yellow-400 px-3.5 text-xs font-black text-black transition-colors hover:bg-yellow-300"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New Prompt
                  </button>
                </div>
              </div>
            </section>

            <section className="dd-card-inset">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search prompt titles, categories, or body text..."
                  className="dd-input w-full !px-10"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950/70 shadow-2xl shadow-black/20">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 bg-neutral-900/45 px-5 py-4">
                <div className="min-w-0">
                  <h3 className="dd-section-title">Library</h3>
                  <p className="dd-subtext mt-1">{filteredPrompts.length} matching templates</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-bold text-white/55">
                  <span className="rounded-full border border-neutral-800 bg-neutral-950 px-3 py-1.5">
                    {filteredPrompts.filter((prompt) => prompt.output?.text?.trim()).length} text outputs
                  </span>
                  <span className="rounded-full border border-neutral-800 bg-neutral-950 px-3 py-1.5">
                    {filteredPrompts.filter((prompt) => prompt.output?.imageUrl?.trim()).length} image outputs
                  </span>
                </div>
              </div>

              {filteredPrompts.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <FileQuestion className="mb-4 h-10 w-10 text-white/25" />
                  <h3 className="text-base font-semibold text-white">{prompts.length === 0 ? "No prompts yet" : "No prompts found"}</h3>
                  <p className="mt-1 text-sm text-white/45">
                    {prompts.length === 0 ? "Create your first prompt or save one from Prompt Hub." : "Try a different category or search term."}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 p-4 xl:grid-cols-2">
                  {filteredPrompts.map((prompt) => {
                    const variables = extractVariables(prompt.content);
                    const hasOutputText = Boolean(prompt.output?.text?.trim());
                    const hasOutputImage = Boolean(prompt.output?.imageUrl?.trim());
                    const hasOutput = Boolean(prompt.output?.model?.trim() || hasOutputText || hasOutputImage);
                    return (
                      <article key={prompt.id} className="group flex min-h-[280px] flex-col rounded-xl border border-neutral-800 bg-neutral-900/55 p-4 transition-colors hover:border-yellow-400/25 hover:bg-neutral-900">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="max-w-full truncate text-base font-black text-white">{prompt.title}</h4>
                              {prompt.authorName && (
                                <span className="inline-flex max-w-40 items-center gap-1 rounded-full border border-neutral-800 bg-neutral-950 px-2 py-1 text-[11px] font-semibold text-white/45">
                                  <UserCircle className="h-3 w-3 shrink-0 text-yellow-400" />
                                  <span className="truncate">By {prompt.authorName}</span>
                                </span>
                              )}
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="dd-pill">
                              {prompt.category}
                            </span>
                              <span className="inline-flex items-center gap-1 rounded-full border border-neutral-800 bg-neutral-950 px-2 py-1 text-[11px] font-bold text-white/45">
                                <Variable className="h-3 w-3" />
                                {variables.length ? `${variables.length} variables` : "No variables"}
                              </span>
                              <span className="inline-flex max-w-36 items-center gap-1 rounded-full border border-neutral-800 bg-neutral-950 px-2 py-1 text-[11px] font-bold text-white/45">
                                <Bot className="h-3 w-3 shrink-0" />
                                <span className="truncate">{prompt.output?.model?.trim() || "No model"}</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-1">
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
                            {canPublishToHub && !prompt.sourceHubId && (
                              <button
                                onClick={() => void handlePublishPrompt(prompt)}
                                className="grid h-9 w-9 place-items-center rounded-lg border border-neutral-800 bg-neutral-950 text-white/55 hover:border-yellow-400/40 hover:text-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
                                title="Publish to Prompt Hub"
                                disabled={publishingId === prompt.id}
                              >
                                <CloudUpload className={`h-4 w-4 ${publishingId === prompt.id ? "animate-pulse" : ""}`} />
                              </button>
                            )}
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
                        </div>

                        <p className="mt-4 line-clamp-3 min-h-[4.5rem] whitespace-pre-wrap text-sm leading-6 text-white/70">{prompt.content}</p>

                          {hasOutput && (
                          <div className="mt-auto rounded-xl border border-neutral-800 bg-black/30 p-3">
                            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-bold text-white/60">
                              <MessageSquareText className="h-3.5 w-3.5 text-yellow-400" />
                              Saved output
                                {prompt.output?.model?.trim() && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-neutral-800 bg-neutral-950 px-2 py-0.5 text-[11px] text-white/50">
                                  <Bot className="h-3 w-3" />
                                    {prompt.output.model}
                                  </span>
                                )}
                                {hasOutputImage && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-neutral-800 bg-neutral-950 px-2 py-0.5 text-[11px] text-white/50">
                                  <Image className="h-3 w-3" />
                                    Image
                                  </span>
                                )}
                              </div>
                            <div className={`grid gap-3 ${hasOutputImage ? "sm:grid-cols-[minmax(0,1fr)_128px]" : ""}`}>
                                {hasOutputText ? (
                                <p className="line-clamp-5 whitespace-pre-wrap rounded-lg border border-neutral-800 bg-neutral-950/70 p-3 text-sm leading-6 text-white/75">{prompt.output?.text}</p>
                                ) : (
                                <p className="rounded-lg border border-neutral-800 bg-neutral-950/70 p-3 text-sm text-white/35">No text output saved.</p>
                                )}
                                {hasOutputImage && (
                                  <ProxiedImage
                                    src={prompt.output?.imageUrl}
                                    alt={`${prompt.title} output`}
                                    className="h-28 w-full rounded-lg border border-neutral-700 object-cover"
                                  />
                                )}
                              </div>
                            </div>
                          )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </main>

        {isModalOpen && (
          <div className="dd-modal-overlay">
            <div className="dd-modal" role="dialog" aria-modal="true">
              <div className="dd-modal-header">
                <div>
                  <h2 className="dd-modal-title">{modalMode === "create" ? "Create Prompt" : "Edit Prompt"}</h2>
                  <p className="dd-subtext mt-1">Use bracketed placeholders like [Topic] to keep prompts reusable.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="dd-icon-btn h-9 w-9">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSavePrompt} className="dd-modal-body">
                {formError && <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm font-semibold text-red-300">{formError}</div>}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.2fr_0.8fr]">
                  <label className="flex flex-col gap-2">
                    <span className="dd-form-label">Prompt Title</span>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(event) => setFormTitle(event.target.value)}
                      placeholder="e.g. Product Requirements Reviewer"
                      className="dd-input"
                      required
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="dd-form-label">Category</span>
                    <select
                      value={formCategory}
                      onChange={(event) => {
                        setFormCategory(event.target.value);
                        if (event.target.value !== "New Category...") setCustomCategory("");
                      }}
                      className="dd-select"
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
                    <span className="dd-form-label">New Category Name</span>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(event) => setCustomCategory(event.target.value)}
                      placeholder="e.g. Product Strategy"
                      className="dd-input"
                      required
                    />
                  </label>
                )}

                <label className="flex flex-col gap-2">
                  <span className="dd-form-label">Prompt Template</span>
                  <textarea
                    value={formContent}
                    onChange={(event) => setFormContent(event.target.value)}
                    rows={12}
                    placeholder="Analyze [Input] for [Goal]. Return concise recommendations and a prioritized action list."
                    className="dd-input font-mono leading-relaxed"
                    required
                  />
                </label>

                <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-white">Corresponding Output</h3>
                    <p className="mt-1 text-xs text-white/45">Save the model and result produced by this prompt. The result can be text, image, or both.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-[0.8fr_1.2fr]">
                    <label className="flex flex-col gap-2">
                      <span className="dd-form-label">Model Used</span>
                      <input
                        type="text"
                        value={formModel}
                        onChange={(event) => setFormModel(event.target.value)}
                        placeholder="e.g. GPT-4.1, Gemini 2.5 Pro, Midjourney v6"
                        className="dd-input"
                      />
                    </label>
                    <div className="flex flex-col gap-2">
                      <span className="dd-form-label">Output Image</span>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs font-bold text-white/70 transition-colors hover:border-neutral-600 hover:text-white">
                          <Upload className="h-3.5 w-3.5" />
                          Upload Image
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) void handleImageFileSelect(file);
                              e.target.value = "";
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => void handlePasteImageFromClipboard()}
                          className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs font-bold text-white/70 transition-colors hover:border-neutral-600 hover:text-white"
                        >
                          <Clipboard className="h-3.5 w-3.5" />
                          Paste from Clipboard
                        </button>
                        {formOutputImageUrl.trim() && (
                          <button
                            type="button"
                            onClick={() => setFormOutputImageUrl("")}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/20"
                          >
                            <X className="h-3.5 w-3.5" />
                            Remove
                          </button>
                        )}
                      </div>
                      {formOutputImageUrl.trim() ? (
                        <p className="text-[11px] font-semibold text-green-400/70">✓ Image embedded — will display reliably everywhere.</p>
                      ) : (
                        <p className="text-[11px] text-white/35">Upload a file or paste an image from clipboard.</p>
                      )}
                    </div>
                  </div>

                  <label className="mt-4 flex flex-col gap-2">
                    <span className="dd-form-label">Output Text</span>
                    <textarea
                      value={formOutputText}
                      onChange={(event) => setFormOutputText(event.target.value)}
                      rows={7}
                      placeholder="Paste the generated answer/result here..."
                      className="dd-input leading-relaxed"
                    />
                  </label>

                  {formOutputImageUrl.trim() && (
                    <div className="mt-4 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950">
                      <ProxiedImage src={formOutputImageUrl.trim()} alt="Output preview" className="max-h-56 w-full object-contain" />
                    </div>
                  )}
                </div>

                <div className="dd-modal-footer">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="dd-btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="dd-btn-primary">
                    {modalMode === "create" ? "Add Template" : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        <ConnectionErrorModal
          open={hubConnectionModalOpen}
          onClose={() => setHubConnectionModalOpen(false)}
        />
      </div>
    </WelcomeScreen>
  );
}
