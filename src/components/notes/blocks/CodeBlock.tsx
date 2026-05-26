import { useState, useRef, useMemo } from "react";
import { Copy, Check, ChevronDown } from "lucide-react";

interface CodeBlockProps {
  language: string;
  code: string;
  onChange?: (code: string) => void;
  onLanguageChange?: (language: string) => void;
}

const LANGUAGES = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Rust",
  "Go",
  "Java",
  "C++",
  "HTML",
  "CSS",
  "SQL",
  "Bash",
  "JSON",
  "Markdown",
  "YAML",
  "TOML",
  "Ruby",
  "PHP",
  "Swift",
  "Kotlin",
  "Dart",
];

export default function CodeBlock({
  language,
  code,
  onChange,
  onLanguageChange,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const lines = useMemo(() => code.split("\n"), [code]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: do nothing
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e.target.value);
  };

  const handleSelectLanguage = (lang: string) => {
    onLanguageChange?.(lang);
    setLangOpen(false);
  };

  // Close dropdown on outside click
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.relatedTarget as Node)) {
      setLangOpen(false);
    }
  };

  return (
    <div className="group my-3 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-neutral-800 px-3 py-2">
        {/* Language selector */}
        <div ref={dropdownRef} className="relative" onBlur={handleBlur}>
          <button
            type="button"
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-white/50 transition-colors hover:bg-neutral-800 hover:text-white"
          >
            {language || "Plain Text"}
            <ChevronDown className="h-3 w-3" />
          </button>
          {langOpen && (
            <div className="absolute left-0 top-full z-50 mt-1 max-h-60 w-40 overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-900 p-1 shadow-xl shadow-black/40 animate-in fade-in zoom-in-95 duration-150">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => handleSelectLanguage(lang)}
                  className={`flex w-full items-center rounded-lg px-3 py-1.5 text-xs transition-colors hover:bg-neutral-800 ${
                    lang === language
                      ? "text-yellow-400 font-semibold"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Copy button */}
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-white/40 transition-colors hover:bg-neutral-800 hover:text-white"
          title="Copy to clipboard"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-400" />
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code area */}
      <div className="flex overflow-x-auto text-sm">
        {/* Line numbers */}
        <div className="select-none border-r border-neutral-800 bg-neutral-950 py-3 text-right">
          {lines.map((_, i) => (
            <div
              key={i}
              className="px-3 font-mono text-xs leading-6 text-white/30"
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Editable textarea */}
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={handleCodeChange}
            spellCheck={false}
            className="w-full resize-none bg-transparent p-3 font-mono text-xs leading-6 text-white/90 outline-none placeholder:text-white/20"
            style={{
              minHeight: `${Math.max(lines.length, 3) * 24 + 24}px`,
            }}
            placeholder="Enter code here…"
            readOnly={!onChange}
          />
        </div>
      </div>
    </div>
  );
}
