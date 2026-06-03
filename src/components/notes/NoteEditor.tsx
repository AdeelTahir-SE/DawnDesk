import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { StickyNote, Maximize2, Minimize2, AlignCenter, Bot, Image as ImageIcon, Link2, Loader2, Save, X } from "lucide-react";
import EditorToolbar from "./EditorToolbar";
import EditorStatusBar from "./EditorStatusBar";
import { generateText } from "../../lib/aiTextGeneration";
import { useAppLogger } from "../../utils/LoggerContext";

interface Note {
  id: number;
  title: string;
  content: string;
  notebook_id?: number | null;
  is_pinned?: boolean;
  is_archived?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface NoteEditorProps {
  note: Note | null;
  onSave: (data: { title: string; content: string }) => void;
  onToggleFocusMode?: () => void;
  isFocusMode?: boolean;
  notebookName?: string;
  tags?: string[];
}

export default function NoteEditor({
  note,
  onSave,
  onToggleFocusMode,
  isFocusMode = false,
  notebookName,
  tags = [],
}: NoteEditorProps) {
  const [title, setTitle] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [typewriterMode, setTypewriterMode] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showLinkToast, setShowLinkToast] = useState(false);
  const [showImageToast, setShowImageToast] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [aiAction, setAiAction] = useState<"summarize" | "generate" | "rewrite" | "continue">("summarize");
  const [aiPlacement, setAiPlacement] = useState<"append" | "replace" | "section">("section");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const { logSuccess, logError } = useAppLogger();

  const editorRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const savedLinkRangeRef = useRef<Range | null>(null);
  const savedImageRangeRef = useRef<Range | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitRef = useRef(false);

  // Sync note data into editor
  useEffect(() => {
    if (!note) return;
    isInitRef.current = true;
    setTitle(note.title);
    if (editorRef.current) {
      editorRef.current.innerHTML = note.content || "";
    }
    setLastSaved(note.updated_at ? new Date(note.updated_at) : null);

    // Auto-focus title on new notes (empty title)
    if (!note.title && titleRef.current) {
      setTimeout(() => titleRef.current?.focus(), 50);
    }

    // Reset init flag after mount
    requestAnimationFrame(() => {
      isInitRef.current = false;
    });
  }, [note?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced auto-save
  const triggerSave = useCallback(() => {
    if (isInitRef.current || !note) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      const content = editorRef.current?.innerHTML || "";
      onSave({ title, content });
      setLastSaved(new Date());
    }, 500);
  }, [title, note, onSave]);

  // Save on title change
  useEffect(() => {
    if (!isInitRef.current && note) {
      triggerSave();
    }
  }, [title]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // Handle content editable input
  const handleInput = useCallback(() => {
    triggerSave();
  }, [triggerSave]);

  const openLinkToast = useCallback(() => {
    const selection = window.getSelection();
    const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    savedLinkRangeRef.current = range && editorRef.current?.contains(range.commonAncestorContainer)
      ? range.cloneRange()
      : null;
    setLinkUrl("");
    setShowLinkToast(true);
  }, []);

  const closeLinkToast = useCallback(() => {
    setShowLinkToast(false);
    setLinkUrl("");
    savedLinkRangeRef.current = null;
  }, []);

  const openImageToast = useCallback(() => {
    const selection = window.getSelection();
    const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    savedImageRangeRef.current = range && editorRef.current?.contains(range.commonAncestorContainer)
      ? range.cloneRange()
      : null;
    setImageUrl("");
    setShowImageToast(true);
  }, []);

  const closeImageToast = useCallback(() => {
    setShowImageToast(false);
    setImageUrl("");
    savedImageRangeRef.current = null;
  }, []);

  const normalizeUrl = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (/^(https?:|mailto:|tel:|data:|blob:|file:|asset:|#|\/)/i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }, []);

  const applyLink = useCallback((event?: React.FormEvent) => {
    event?.preventDefault();
    const url = normalizeUrl(linkUrl);
    if (!url) return;

    editorRef.current?.focus();
    const selection = window.getSelection();
    const range = savedLinkRangeRef.current;

    if (selection && range) {
      selection.removeAllRanges();
      selection.addRange(range);
    }

    document.execCommand("createLink", false, url);
    triggerSave();
    logSuccess("Link added", "Inserted a link into the current note.", { source: "notes" });
    closeLinkToast();
  }, [closeLinkToast, linkUrl, logSuccess, normalizeUrl, triggerSave]);

  const applyImage = useCallback((event?: React.FormEvent) => {
    event?.preventDefault();
    const url = normalizeUrl(imageUrl);
    if (!url) return;

    editorRef.current?.focus();
    const selection = window.getSelection();
    const range = savedImageRangeRef.current;

    if (selection && range) {
      selection.removeAllRanges();
      selection.addRange(range);
    }

    document.execCommand("insertImage", false, url);
    triggerSave();
    logSuccess("Image inserted", "Added an image to the current note.", { source: "notes" });
    closeImageToast();
  }, [closeImageToast, imageUrl, logSuccess, normalizeUrl, triggerSave]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && !e.shiftKey && e.key === "b") {
        e.preventDefault();
        document.execCommand("bold");
      } else if (ctrl && !e.shiftKey && e.key === "i") {
        e.preventDefault();
        document.execCommand("italic");
      } else if (ctrl && !e.shiftKey && e.key === "u") {
        e.preventDefault();
        document.execCommand("underline");
      } else if (ctrl && !e.shiftKey && e.key === "s") {
        e.preventDefault();
        if (note) {
          if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
          const content = editorRef.current?.innerHTML || "";
          onSave({ title, content });
          setLastSaved(new Date());
          logSuccess("Note saved", "Note saved manually via shortcut.", { source: "notes" });
        }
      } else if (ctrl && e.shiftKey && e.key === "S") {
        e.preventDefault();
        document.execCommand("strikethrough");
      } else if (ctrl && e.shiftKey && e.key === "X") {
        e.preventDefault();
        // Wrap selection in <code>
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const code = document.createElement("code");
          code.className =
            "rounded bg-neutral-800 px-1.5 py-0.5 font-mono text-sm text-yellow-400";
          range.surroundContents(code);
        }
      }
    },
    [note, onSave, title, logSuccess]
  );

  // Toolbar command handler
  const handleCommand = useCallback((command: string, value?: string) => {
    switch (command) {
      case "bold":
        document.execCommand("bold");
        break;
      case "italic":
        document.execCommand("italic");
        break;
      case "underline":
        document.execCommand("underline");
        break;
      case "strikethrough":
        document.execCommand("strikethrough");
        break;
      case "code": {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const code = document.createElement("code");
          code.className =
            "rounded bg-neutral-800 px-1.5 py-0.5 font-mono text-sm text-yellow-400";
          range.surroundContents(code);
        }
        break;
      }
      case "formatBlock":
        document.execCommand("formatBlock", false, value);
        break;
      case "blockquote":
        document.execCommand("formatBlock", false, "blockquote");
        break;
      case "codeBlock": {
        const pre = document.createElement("pre");
        pre.className =
          "my-2 rounded-xl border border-neutral-800 bg-neutral-950 p-4 font-mono text-sm text-white/80";
        const codeEl = document.createElement("code");
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          codeEl.textContent = range.toString() || "// code here";
          range.deleteContents();
          pre.appendChild(codeEl);
          range.insertNode(pre);
        }
        break;
      }
      case "horizontalRule":
        document.execCommand("insertHorizontalRule");
        break;
      case "callout": {
        const callout = document.createElement("div");
        callout.className =
          "my-2 rounded-xl border-l-4 border-l-yellow-400 bg-yellow-400/5 px-4 py-3 text-sm text-white/70";
        callout.innerHTML = "<strong class='text-yellow-400'>Note</strong><br/>Type your callout text here...";
        const sel2 = window.getSelection();
        if (sel2 && sel2.rangeCount > 0) {
          const range = sel2.getRangeAt(0);
          range.deleteContents();
          range.insertNode(callout);
        }
        break;
      }
      case "insertUnorderedList":
        document.execCommand("insertUnorderedList");
        break;
      case "insertOrderedList":
        document.execCommand("insertOrderedList");
        break;
      case "checklist": {
        const ul = document.createElement("ul");
        ul.style.listStyle = "none";
        ul.style.paddingLeft = "0";
        for (let i = 0; i < 3; i++) {
          const li = document.createElement("li");
          li.className = "flex items-center gap-2 py-1";
          li.innerHTML = `<input type="checkbox" class="rounded border-neutral-600 accent-yellow-400" /> <span>Item ${i + 1}</span>`;
          ul.appendChild(li);
        }
        const sel3 = window.getSelection();
        if (sel3 && sel3.rangeCount > 0) {
          const range = sel3.getRangeAt(0);
          range.deleteContents();
          range.insertNode(ul);
        }
        break;
      }
      case "link": {
        openLinkToast();
        break;
      }
      case "table": {
        const table = document.createElement("table");
        table.className =
          "my-2 w-full border-collapse rounded-xl border border-neutral-800";
        for (let r = 0; r < 3; r++) {
          const tr = document.createElement("tr");
          tr.className =
            r === 0
              ? "bg-neutral-900/60 border-b border-neutral-800"
              : "border-b border-neutral-800";
          for (let c = 0; c < 3; c++) {
            const td = document.createElement(r === 0 ? "th" : "td");
            td.className =
              "border-r border-neutral-800 px-3 py-2 text-sm text-white/80 last:border-r-0";
            td.contentEditable = "true";
            td.textContent = r === 0 ? `Header ${c + 1}` : "";
            tr.appendChild(td);
          }
          table.appendChild(tr);
        }
        const sel4 = window.getSelection();
        if (sel4 && sel4.rangeCount > 0) {
          const range = sel4.getRangeAt(0);
          range.deleteContents();
          range.insertNode(table);
        }
        break;
      }
      case "image": {
        openImageToast();
        break;
      }
      default:
        break;
    }
    triggerSave();
  }, [openImageToast, openLinkToast, triggerSave]);

  // Re-compute word count on each render when note exists
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);

  const updateStats = useCallback(() => {
    const text = editorRef.current?.innerText || "";
    const trimmed = text.trim();
    const w = trimmed ? trimmed.split(/\s+/).length : 0;
    setWordCount(w);
    setCharCount(trimmed.length);
    setReadingTime(Math.ceil(w / 200));
  }, []);

  const persistNow = useCallback((nextTitle = title, nextContent?: string) => {
    if (!note) return;
    const content = nextContent ?? editorRef.current?.innerHTML ?? "";
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    onSave({ title: nextTitle, content });
    setLastSaved(new Date());
  }, [note, onSave, title]);

  const applyAiResult = useCallback((text: string) => {
    if (!editorRef.current) return;
    const currentHtml = editorRef.current.innerHTML || "";
    const resultHtml = textToNoteHtml(text);
    let nextHtml = resultHtml;

    if (aiPlacement === "append") {
      nextHtml = `${currentHtml}${currentHtml.trim() ? "<p><br></p>" : ""}${resultHtml}`;
    } else if (aiPlacement === "section") {
      const label = aiAction === "summarize"
        ? "AI Summary"
        : aiAction === "rewrite"
          ? "AI Rewrite"
          : aiAction === "continue"
            ? "AI Continuation"
            : "AI Generated Notes";
      nextHtml = `${currentHtml}${currentHtml.trim() ? "<p><br></p>" : ""}<h2>${label}</h2>${resultHtml}`;
    }

    editorRef.current.innerHTML = nextHtml;
    persistNow(title, nextHtml);
    updateStats();
  }, [aiAction, aiPlacement, persistNow, title, updateStats]);

  const handleAiGenerate = useCallback(async () => {
    if (!note || aiLoading) return;
    const currentText = editorRef.current?.innerText.trim() || "";
    if (aiAction !== "generate" && !currentText) {
      setAiError("Write or select a note with content first.");
      return;
    }

    setAiLoading(true);
    setAiError("");
    try {
      const actionInstruction = {
        summarize: "Summarize the note into concise headings and bullets. Preserve important decisions, tasks, dates, and open questions.",
        generate: "Generate useful note content from the user's brief. Use clear headings, bullets, and short paragraphs.",
        rewrite: "Rewrite and improve the note for clarity, structure, and readability without changing the meaning.",
        continue: "Continue the note naturally from where it ends. Keep the same style and structure.",
      }[aiAction];

      const result = await generateText({
        system: "You are an assistant inside DawnDesk Notes. Return clean HTML-friendly Markdown only. Do not wrap the answer in code fences.",
        prompt: [
          `Action: ${actionInstruction}`,
          `Note title: ${title || note.title || "Untitled"}`,
          aiPrompt.trim() ? `User instructions: ${aiPrompt.trim()}` : "",
          currentText ? `Current note content:\n${currentText}` : "",
        ].filter(Boolean).join("\n\n"),
        maxTokens: 1200,
      });
      applyAiResult(result.text);
      setShowAiModal(false);
      setAiPrompt("");
      logSuccess("Notes AI complete", `Generated with ${result.model}.`, { source: "notes" });
    } catch (error) {
      const message = String(error);
      setAiError(message);
      logError("Notes AI failed", message, { source: "notes" });
    }
    setAiLoading(false);
  }, [aiAction, aiLoading, aiPrompt, applyAiResult, logError, logSuccess, note, title]);

  useEffect(() => {
    updateStats();
  }, [title, updateStats]);

  // Empty state
  if (!note) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900/60 shadow-lg shadow-black/20">
          <StickyNote className="h-10 w-10 text-yellow-400/60" />
        </div>
        <div className="text-center">
          <h3 className="font-heading text-lg font-bold text-white/80">
            No note selected
          </h3>
          <p className="mt-1 max-w-xs text-sm text-white/40">
            Select a note from the sidebar or create a new one to start writing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col animate-in fade-in zoom-in-95 duration-300">
      {/* Toolbar */}
      <div className="shrink-0 border-b border-neutral-800 bg-neutral-950/80 px-4 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1 overflow-visible">
            <EditorToolbar onCommand={handleCommand} editorRef={editorRef} />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {/* Save and AI Stack */}
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => {
                  if (!note) return;
                  if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
                  const content = editorRef.current?.innerHTML || "";
                  onSave({ title, content });
                  setLastSaved(new Date());
                  logSuccess("Note saved", "Note saved manually.", { source: "notes" });
                }}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-2.5 text-xs font-bold text-white transition-colors hover:bg-neutral-700"
                title="Save note (Auto-saves automatically)"
              >
                <Save className="h-4 w-4" />
                Save
              </button>

              <button
                type="button"
                onClick={() => {
                  setAiError("");
                  setShowAiModal(true);
                }}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-yellow-400/25 bg-yellow-400/10 px-2.5 text-xs font-bold text-yellow-300 transition-colors hover:bg-yellow-400/20"
                title="AI note tools"
              >
                <Bot className="h-4 w-4" />
                AI
              </button>
            </div>

            <button
              type="button"
              onClick={() => setTypewriterMode(!typewriterMode)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                typewriterMode
                  ? "bg-yellow-400/10 text-yellow-400"
                  : "text-white/40 hover:bg-neutral-800 hover:text-white"
              }`}
              title="Typewriter mode"
            >
              <AlignCenter className="h-4 w-4" />
            </button>

            {/* Focus mode */}
            {onToggleFocusMode && (
              <button
                type="button"
                onClick={onToggleFocusMode}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                  isFocusMode
                    ? "bg-yellow-400/10 text-yellow-400"
                    : "text-white/40 hover:bg-neutral-800 hover:text-white"
                }`}
                title={isFocusMode ? "Exit focus mode" : "Focus mode"}
              >
                {isFocusMode ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Editor body */}
      <div
        className={`flex-1 overflow-y-auto ${
          typewriterMode ? "scroll-pt-[40vh]" : ""
        }`}
        style={typewriterMode ? { scrollPaddingTop: "40vh", scrollPaddingBottom: "40vh" } : undefined}
      >
        <div className="mx-auto w-full max-w-3xl px-8 py-8">
          {/* Title */}
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
            className="w-full bg-transparent font-heading text-3xl font-black tracking-tight text-white outline-none placeholder:text-white/20"
          />

          {/* Divider */}
          <div className="my-4 h-px bg-neutral-800" />

          {/* Content editable */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={() => {
              handleInput();
              updateStats();
            }}
            onKeyDown={handleKeyDown}
            data-placeholder="Start writing…"
            className={`prose-editor min-h-[50vh] w-full text-base leading-relaxed text-white/80 outline-none
              [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-white/20
              [&_h1]:mt-8 [&_h1]:text-2xl [&_h1]:font-black [&_h1]:text-white [&_h1]:font-heading
              [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:font-heading
              [&_h3]:mt-5 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-white
              [&_h4]:mt-4 [&_h4]:text-base [&_h4]:font-bold [&_h4]:text-white
              [&_h5]:mt-4 [&_h5]:text-sm [&_h5]:font-bold [&_h5]:text-white
              [&_h6]:mt-3 [&_h6]:text-xs [&_h6]:font-bold [&_h6]:text-white/80
              [&_p]:my-2
              [&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-yellow-400/50 [&_blockquote]:bg-yellow-400/5 [&_blockquote]:px-4 [&_blockquote]:py-2 [&_blockquote]:rounded-r-lg [&_blockquote]:text-white/60
              [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6
              [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6
              [&_li]:my-1
              [&_a]:text-yellow-400 [&_a]:underline [&_a]:underline-offset-2
              [&_hr]:my-6 [&_hr]:border-neutral-800
              [&_pre]:my-3 [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-neutral-800 [&_pre]:bg-neutral-950 [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-sm
              [&_code]:rounded [&_code]:bg-neutral-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm [&_code]:text-yellow-400
              [&_table]:w-full [&_table]:border-collapse [&_table]:my-3 [&_table]:rounded-xl
              [&_th]:border [&_th]:border-neutral-800 [&_th]:bg-neutral-900/60 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-bold
              [&_td]:border [&_td]:border-neutral-800 [&_td]:px-3 [&_td]:py-2
              [&_img]:my-3 [&_img]:max-w-full [&_img]:rounded-xl [&_img]:border [&_img]:border-neutral-800
              ${typewriterMode ? "pb-[40vh]" : ""}
            `}
          />
        </div>
      </div>

      {/* Status bar */}
      <div className="shrink-0">
        <EditorStatusBar
          wordCount={wordCount}
          charCount={charCount}
          readingTime={readingTime}
          lastSaved={lastSaved}
          notebookName={notebookName}
          tags={tags}
        />
      </div>

      {showLinkToast && (
        <div className="fixed left-1/2 top-24 z-[180] w-[min(440px,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border border-neutral-800 bg-neutral-950 p-4 shadow-2xl shadow-black/60">
          <form onSubmit={applyLink} className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-yellow-400/25 bg-yellow-400/10 text-yellow-300">
                  <Link2 className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-white">Insert Link</h3>
                  <p className="mt-1 text-xs leading-5 text-white/45">Paste a URL and apply it to the selected text.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeLinkToast}
                className="rounded-lg p-2 text-white/40 transition-colors hover:bg-neutral-800 hover:text-white"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex gap-2">
              <input
                value={linkUrl}
                onChange={(event) => setLinkUrl(event.target.value)}
                autoFocus
                placeholder="https://example.com"
                className="min-w-0 flex-1 rounded-lg border border-neutral-800 bg-black px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-yellow-400/60"
              />
              <button
                type="submit"
                disabled={!linkUrl.trim()}
                className="rounded-lg bg-yellow-400 px-4 py-2.5 text-sm font-black text-black transition-colors hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </form>
        </div>
      )}

      {showImageToast && (
        <div className="fixed left-1/2 top-24 z-[180] w-[min(460px,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border border-neutral-800 bg-neutral-950 p-4 shadow-2xl shadow-black/60">
          <form onSubmit={applyImage} className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-yellow-400/25 bg-yellow-400/10 text-yellow-300">
                  <ImageIcon className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-white">Insert Image</h3>
                  <p className="mt-1 text-xs leading-5 text-white/45">Paste an image URL and DawnDesk will place it in this note.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeImageToast}
                className="rounded-lg p-2 text-white/40 transition-colors hover:bg-neutral-800 hover:text-white"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex gap-2">
              <input
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                autoFocus
                placeholder="https://example.com/image.png"
                className="min-w-0 flex-1 rounded-lg border border-neutral-800 bg-black px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-yellow-400/60"
              />
              <button
                type="submit"
                disabled={!imageUrl.trim()}
                className="rounded-lg bg-yellow-400 px-4 py-2.5 text-sm font-black text-black transition-colors hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Insert
              </button>
            </div>
          </form>
        </div>
      )}

      {showAiModal && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl shadow-black/70">
            <div className="flex items-start justify-between gap-4 border-b border-neutral-800 p-5">
              <div className="flex gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full border border-yellow-400/30 bg-yellow-400/10 text-yellow-300">
                  <Bot className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-white">Notes AI</h3>
                  <p className="mt-1 text-sm leading-6 text-white/50">Summarize, generate, rewrite, or continue this note using the default AI provider from Settings.</p>
                </div>
              </div>
              <button
                onClick={() => !aiLoading && setShowAiModal(false)}
                disabled={aiLoading}
                className="rounded-lg p-2 text-white/40 hover:bg-neutral-800 hover:text-white disabled:cursor-wait disabled:opacity-50"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Action</span>
                  <select
                    value={aiAction}
                    onChange={(event) => setAiAction(event.target.value as typeof aiAction)}
                    disabled={aiLoading}
                    className="mt-2 w-full rounded-lg border border-neutral-800 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-yellow-400/60"
                  >
                    <option value="summarize">Summarize note</option>
                    <option value="generate">Generate content</option>
                    <option value="rewrite">Rewrite note</option>
                    <option value="continue">Continue writing</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Placement</span>
                  <select
                    value={aiPlacement}
                    onChange={(event) => setAiPlacement(event.target.value as typeof aiPlacement)}
                    disabled={aiLoading}
                    className="mt-2 w-full rounded-lg border border-neutral-800 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-yellow-400/60"
                  >
                    <option value="section">Add as new section</option>
                    <option value="append">Append to note</option>
                    <option value="replace">Replace note content</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Instructions</span>
                <textarea
                  value={aiPrompt}
                  onChange={(event) => setAiPrompt(event.target.value)}
                  disabled={aiLoading}
                  className="custom-scrollbar mt-2 min-h-[140px] w-full resize-none rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm leading-7 text-white outline-none placeholder-white/30 focus:border-yellow-400/60 disabled:cursor-wait disabled:opacity-70"
                  placeholder="Optional: make it more concise, turn it into action items, draft meeting notes, write a research outline..."
                />
              </label>

              {aiLoading && (
                <div className="rounded-xl border border-yellow-400/25 bg-yellow-400/10 px-4 py-3">
                  <div className="flex items-center gap-3 text-sm font-bold text-yellow-100">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating note content
                  </div>
                  <p className="mt-2 text-xs leading-5 text-yellow-100/70">Using your configured default text provider and the current note as context.</p>
                </div>
              )}

              {aiError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
                  {aiError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-neutral-800 p-5">
              <button
                onClick={() => setShowAiModal(false)}
                disabled={aiLoading}
                className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm font-bold text-white/60 hover:bg-neutral-800 hover:text-white disabled:cursor-wait disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleAiGenerate()}
                disabled={aiLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-black text-black hover:bg-yellow-300 disabled:cursor-wait disabled:opacity-60"
              >
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                {aiLoading ? "Generating" : "Apply AI"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function textToNoteHtml(text: string) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length) {
      blocks.push(`<ul>${listItems.map((item) => `<li>${item}</li>`).join("")}</ul>`);
      listItems = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushList();
      blocks.push(`<h${heading[1].length}>${escapeHtml(heading[2])}</h${heading[1].length}>`);
      continue;
    }
    const bullet = line.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      listItems.push(escapeHtml(bullet[1]));
      continue;
    }
    flushList();
    blocks.push(`<p>${escapeHtml(line)}</p>`);
  }
  flushList();
  return blocks.join("");
}
