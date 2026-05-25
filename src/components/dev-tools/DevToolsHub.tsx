import { DevTool, devTools } from "./devToolsList";
import { useState } from "react";

interface DevToolsHubProps {
  onSelectTool: (tool: DevTool) => void;
}

export default function DevToolsHub({ onSelectTool }: DevToolsHubProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const categories = ["V1 - Core Tools", "V2 - Workflow Tools", "V3 - Advanced Tools"];

  const filteredTools = devTools.filter(
    (tool) =>
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mx-auto flex w-full flex-col gap-8 p-8 max-w-7xl animate-fadeIn">
      {/* Header section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          Developer Tools
        </h1>
        <p className="text-base text-white/50 max-w-2xl">
          A collection of rare, high-value tools that are usually scattered across the internet or locked behind subscriptions. All processing happens locally on your machine.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search tools by name or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-900/60 py-3 pl-12 pr-4 text-sm text-white placeholder-white/30 outline-none focus:border-yellow-400/50 focus:bg-neutral-900 transition-all duration-200"
        />
      </div>

      {/* Tool Categories */}
      <div className="flex flex-col gap-12 pb-12">
        {categories.map((category) => {
          const toolsInCategory = filteredTools.filter(
            (tool) => tool.category === category
          );

          if (toolsInCategory.length === 0) return null;

          return (
            <div key={category} className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white tracking-wide">
                  {category}
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-neutral-800 to-transparent" />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {toolsInCategory.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => onSelectTool(tool)}
                    className="group relative flex flex-col items-start gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5 text-left hover:bg-neutral-800/60 hover:border-neutral-700 transition-all duration-300"
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-950 border border-neutral-800 text-xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                        {tool.icon}
                      </span>
                      {tool.isImplemented && (
                        <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-400 uppercase tracking-wider border border-green-500/20">
                          Ready
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-semibold text-white/90 group-hover:text-white transition-colors line-clamp-1">
                        {tool.title}
                      </h3>
                      <p className="mt-1 text-xs text-white/40 leading-relaxed line-clamp-2 group-hover:text-white/60 transition-colors">
                        {tool.description}
                      </p>
                    </div>

                    <div className="absolute right-4 bottom-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-yellow-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-4 h-4"
                      >
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {filteredTools.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-4xl opacity-20">🔍</span>
            <h3 className="mt-4 text-lg font-medium text-white/80">No tools found</h3>
            <p className="mt-1 text-sm text-white/40">Try adjusting your search terms.</p>
          </div>
        )}
      </div>
    </div>
  );
}
