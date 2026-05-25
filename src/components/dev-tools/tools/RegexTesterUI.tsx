
import { useState } from "react";

export default function RegexTesterUI() {
  const [regex, setRegex] = useState("([A-Z])\\w+");
  const [flags, setFlags] = useState("gm");
  const [testString, setTestString] = useState("Hello world! This is a Test string for Regex.");

  return (
    <div className="flex flex-col h-full gap-6 animate-fadeIn">
      {/* Top Controls: Regex & Flags */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
        {/* Regex Input */}
        <div className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 backdrop-blur-md">
          <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-white/50">
            Regular Expression
          </label>
          <div className="flex items-center gap-3 bg-neutral-950/50 rounded-lg border border-neutral-800 px-3 py-2 focus-within:border-yellow-400/50 transition-colors">
            <span className="text-yellow-400 font-mono text-lg font-bold">/</span>
            <input
              type="text"
              value={regex}
              onChange={(e) => setRegex(e.target.value)}
              className="flex-1 bg-transparent text-white font-mono outline-none placeholder-white/20"
              placeholder="Enter regex..."
            />
            <span className="text-yellow-400 font-mono text-lg font-bold">/</span>
          </div>
        </div>

        {/* Flags Input */}
        <div className="w-full sm:w-48 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 backdrop-blur-md">
          <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-white/50">
            Flags
          </label>
          <input
            type="text"
            value={flags}
            onChange={(e) => setFlags(e.target.value)}
            className="w-full bg-neutral-950/50 rounded-lg border border-neutral-800 px-3 py-2.5 text-white font-mono outline-none focus:border-yellow-400/50 transition-colors uppercase tracking-widest text-center"
            placeholder="gmi"
          />
        </div>
      </div>

      {/* Main Split: Test String & Match Info */}
      <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[400px]">
        {/* Test String Area */}
        <div className="flex-1 flex flex-col rounded-xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-md overflow-hidden">
          <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-950/40 px-4 py-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
              Test String
            </span>
            <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
              2 Matches
            </span>
          </div>
          <div className="relative flex-1 p-4">
            <textarea
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              className="absolute inset-0 w-full h-full resize-none bg-transparent p-4 text-transparent caret-white font-mono text-sm leading-relaxed z-10 outline-none"
              spellCheck={false}
            />
            {/* Fake Highlight Overlay */}
            <div className="absolute inset-0 p-4 font-mono text-sm leading-relaxed text-white/60 z-0 pointer-events-none whitespace-pre-wrap break-words">
              <span className="bg-yellow-400/20 text-yellow-300 rounded-[2px] border-b-2 border-yellow-400">Hello</span> world! <span className="bg-yellow-400/20 text-yellow-300 rounded-[2px] border-b-2 border-yellow-400">This</span> is a <span className="bg-yellow-400/20 text-yellow-300 rounded-[2px] border-b-2 border-yellow-400">Test</span> string for <span className="bg-yellow-400/20 text-yellow-300 rounded-[2px] border-b-2 border-yellow-400">Regex</span>.
            </div>
          </div>
        </div>

        {/* Match Details Sidebar */}
        <div className="w-full lg:w-80 flex flex-col rounded-xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-md overflow-hidden">
          <div className="border-b border-neutral-800 bg-neutral-950/40 px-4 py-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
              Match Details
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {/* Mock Match 1 */}
            <div className="rounded-lg border border-neutral-800 bg-neutral-950/50 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white">Match 1</span>
                <span className="text-[10px] text-white/30 font-mono">0-5</span>
              </div>
              <p className="text-sm font-mono text-yellow-300 bg-yellow-400/10 px-2 py-1 rounded inline-block">
                Hello
              </p>
              <div className="mt-3 flex flex-col gap-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/40">Group 1:</span>
                  <span className="font-mono text-white/80">H</span>
                </div>
              </div>
            </div>

            {/* Mock Match 2 */}
            <div className="rounded-lg border border-neutral-800 bg-neutral-950/50 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white">Match 2</span>
                <span className="text-[10px] text-white/30 font-mono">13-17</span>
              </div>
              <p className="text-sm font-mono text-yellow-300 bg-yellow-400/10 px-2 py-1 rounded inline-block">
                This
              </p>
              <div className="mt-3 flex flex-col gap-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/40">Group 1:</span>
                  <span className="font-mono text-white/80">T</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
