import { useState, useRef, useEffect, type RefObject } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Pilcrow,
  Quote,
  Minus,
  List,
  ListOrdered,
  ListChecks,
  Link,
  Table,
  Image,
  ChevronDown,
  SquareCode,
  MessageSquareWarning,
} from "lucide-react";

interface EditorToolbarProps {
  onCommand: (command: string, value?: string) => void;
  editorRef: RefObject<HTMLDivElement | null>;
}

interface ToolButton {
  icon: React.ElementType;
  label: string;
  command: string;
  value?: string;
}

const textTools: ToolButton[] = [
  { icon: Bold, label: "Bold (Ctrl+B)", command: "bold" },
  { icon: Italic, label: "Italic (Ctrl+I)", command: "italic" },
  { icon: Underline, label: "Underline (Ctrl+U)", command: "underline" },
  { icon: Strikethrough, label: "Strikethrough (Ctrl+Shift+S)", command: "strikethrough" },
  { icon: Code, label: "Inline Code (Ctrl+Shift+X)", command: "code" },
];

const headingOptions = [
  { icon: Pilcrow, label: "Paragraph", command: "formatBlock", value: "p" },
  { icon: Heading1, label: "Heading 1", command: "formatBlock", value: "h1" },
  { icon: Heading2, label: "Heading 2", command: "formatBlock", value: "h2" },
  { icon: Heading3, label: "Heading 3", command: "formatBlock", value: "h3" },
  { icon: Heading4, label: "Heading 4", command: "formatBlock", value: "h4" },
  { icon: Heading5, label: "Heading 5", command: "formatBlock", value: "h5" },
  { icon: Heading6, label: "Heading 6", command: "formatBlock", value: "h6" },
];

const blockTools: ToolButton[] = [
  { icon: Quote, label: "Blockquote", command: "blockquote" },
  { icon: SquareCode, label: "Code Block", command: "codeBlock" },
  { icon: Minus, label: "Horizontal Rule", command: "horizontalRule" },
  { icon: MessageSquareWarning, label: "Callout", command: "callout" },
];

const listTools: ToolButton[] = [
  { icon: List, label: "Bullet List", command: "insertUnorderedList" },
  { icon: ListOrdered, label: "Numbered List", command: "insertOrderedList" },
  { icon: ListChecks, label: "Checklist", command: "checklist" },
];

const insertTools: ToolButton[] = [
  { icon: Link, label: "Insert Link", command: "link" },
  { icon: Table, label: "Insert Table", command: "table" },
  { icon: Image, label: "Insert Image", command: "image" },
];

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className="relative flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-neutral-800 hover:text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-yellow-400/50"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function Separator() {
  return <div className="mx-1 h-6 border-r border-neutral-800" />;
}

export default function EditorToolbar({ onCommand, editorRef }: EditorToolbarProps) {
  const [headingOpen, setHeadingOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setHeadingOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCommand = (command: string, value?: string) => {
    // Restore focus to editor before executing
    editorRef.current?.focus();
    onCommand(command, value);
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-xl border border-neutral-800 bg-neutral-900/80 px-2 py-1.5 backdrop-blur-sm">
      {/* Text formatting */}
      {textTools.map((tool) => (
        <ToolbarButton
          key={tool.command}
          icon={tool.icon}
          label={tool.label}
          onClick={() => handleCommand(tool.command, tool.value)}
        />
      ))}

      <Separator />

      {/* Headings dropdown */}
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => setHeadingOpen(!headingOpen)}
          className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-white/60 transition-colors hover:bg-neutral-800 hover:text-white"
          title="Headings"
        >
          <Heading1 className="h-4 w-4" />
          <ChevronDown className="h-3 w-3" />
        </button>
        {headingOpen && (
          <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-xl border border-neutral-800 bg-neutral-900 p-1 shadow-xl shadow-black/40 animate-in fade-in zoom-in-95 duration-150">
            {headingOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    handleCommand(opt.command, opt.value);
                    setHeadingOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/70 transition-colors hover:bg-neutral-800 hover:text-white"
                >
                  <Icon className="h-4 w-4 text-white/40" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Separator />

      {/* Block tools */}
      {blockTools.map((tool) => (
        <ToolbarButton
          key={tool.command}
          icon={tool.icon}
          label={tool.label}
          onClick={() => handleCommand(tool.command, tool.value)}
        />
      ))}

      <Separator />

      {/* List tools */}
      {listTools.map((tool) => (
        <ToolbarButton
          key={tool.command}
          icon={tool.icon}
          label={tool.label}
          onClick={() => handleCommand(tool.command, tool.value)}
        />
      ))}

      <Separator />

      {/* Insert tools */}
      {insertTools.map((tool) => (
        <ToolbarButton
          key={tool.command}
          icon={tool.icon}
          label={tool.label}
          onClick={() => handleCommand(tool.command, tool.value)}
        />
      ))}
    </div>
  );
}
