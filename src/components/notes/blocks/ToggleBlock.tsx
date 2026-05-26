import { useState, useRef, useEffect, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";

interface ToggleBlockProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export default function ToggleBlock({
  title,
  children,
  defaultOpen = false,
}: ToggleBlockProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children, isOpen]);

  return (
    <div className="my-3 rounded-xl border border-neutral-800 bg-neutral-900/40">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left transition-colors hover:bg-neutral-800/40"
      >
        <ChevronRight
          className={`h-4 w-4 shrink-0 text-white/40 transition-transform duration-200 ${
            isOpen ? "rotate-90" : ""
          }`}
        />
        <span className="text-sm font-semibold text-white">{title}</span>
      </button>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isOpen ? `${contentHeight}px` : "0px",
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div ref={contentRef} className="px-4 pb-4 pl-10 text-sm leading-relaxed text-white/70">
          {children}
        </div>
      </div>
    </div>
  );
}
