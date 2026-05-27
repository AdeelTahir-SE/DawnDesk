import { devTools } from "./devToolsList";
import { useState } from "react";
import { Search, ArrowRight } from "lucide-react";

export default function DevToolsHub() {
  const [searchQuery, setSearchQuery] = useState("");



  const filteredTools = devTools.filter(
    (tool) =>
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative max-h-[calc(100vh-4rem)] flex w-full h-full animate-fadeIn overflow-hidden">
      {/* Full Page Coming Soon Overlay */}
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-[4px]">
        <div className="bg-neutral-950/90 border border-neutral-800 px-10 py-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 animate-fadeIn pointer-events-auto">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Coming Soon</h2>
          <p className="text-white/60 text-center max-w-sm">We're working hard to bring these developer tools to life. Stay tuned for updates!</p>
        </div>
      </div>

      {/* Blurred & Non-Interactable Content */}
      <div className="mx-auto flex w-full flex-col gap-8 p-8 max-w-7xl opacity-40 pointer-events-none blur-[4px] select-none overflow-hidden">
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
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" strokeWidth={2} />
          <input
            type="text"
            placeholder="Search tools by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-900/60 py-3 pl-12 pr-4 text-sm text-white placeholder-white/30 outline-none"
          />
        </div>

        {/* Tool Grid */}
        <div className="flex flex-col gap-12 pb-12">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTools.map((tool) => (
              <div
                key={tool.id}
                className="group relative flex flex-col items-start gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5 text-left"
              >
                <div className="flex w-full items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-950 border border-neutral-800 text-xl shadow-sm">
                    {tool.icon}
                  </span>
                  {tool.isImplemented && (
                    <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-400 uppercase tracking-wider border border-green-500/20">
                      Ready
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-white/90 line-clamp-1">
                    {tool.title}
                  </h3>
                  <p className="mt-1 text-xs text-white/40 leading-relaxed line-clamp-2">
                    {tool.description}
                  </p>
                </div>

                <div className="absolute right-4 bottom-5 opacity-0 text-yellow-400">
                  <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                </div>
              </div>
            ))}
          </div>

          {filteredTools.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="w-12 h-12 opacity-20 text-white" />
              <h3 className="mt-4 text-lg font-medium text-white/80">No tools found</h3>
              <p className="mt-1 text-sm text-white/40">Try adjusting your search terms.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
