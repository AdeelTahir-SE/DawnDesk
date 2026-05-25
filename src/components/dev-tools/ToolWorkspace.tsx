import { ReactNode } from "react";
import { DevTool } from "./devToolsList";
import { ArrowLeft } from "lucide-react";

interface ToolWorkspaceProps {
  tool: DevTool;
  onBack: () => void;
  children: ReactNode;
}

export default function ToolWorkspace({ tool, onBack, children }: ToolWorkspaceProps) {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full max-w-[1600px] mx-auto animate-in fade-in zoom-in-95 duration-300">
      {/* Workspace Top Navigation Bar */}
      <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/60 px-6 py-4 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Hub
          </button>

          <div className="w-px h-6 bg-neutral-800" />

          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-950 border border-neutral-800 text-sm shadow-sm">
              {tool.icon}
            </span>
            <div>
              <h1 className="text-lg font-extrabold text-white tracking-tight leading-tight">
                {tool.title}
              </h1>
              <p className="text-[10px] uppercase tracking-wider text-white/40">
                {tool.category}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Content Area */}
      <div className="flex-1 overflow-hidden p-4 sm:p-6 bg-black/20">
        <div className="h-full w-full rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 shadow-2xl overflow-y-auto custom-scrollbar relative">
          {children}
        </div>
      </div>
    </div>
  );
}
