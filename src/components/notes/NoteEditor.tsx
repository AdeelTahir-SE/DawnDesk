import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { StickyNote, Maximize2, Minimize2, AlignCenter } from "lucide-react";
import EditorToolbar from "./EditorToolbar";
import EditorStatusBar from "./EditorStatusBar";

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

  const editorRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
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
    []
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
        const url = prompt("Enter URL:");
        if (url) {
          document.execCommand("createLink", false, url);
        }
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
        const imgUrl = prompt("Enter image URL:");
        if (imgUrl) {
          document.execCommand("insertImage", false, imgUrl);
        }
        break;
      }
      default:
        break;
    }
    triggerSave();
  }, [triggerSave]);

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
          <div className="flex-1 overflow-x-auto">
            <EditorToolbar onCommand={handleCommand} editorRef={editorRef} />
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {/* Typewriter mode */}
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
    </div>
  );
}
