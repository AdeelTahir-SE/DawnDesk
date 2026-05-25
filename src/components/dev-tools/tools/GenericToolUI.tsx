import { DevTool } from "../devToolsList";
import { Wrench } from "lucide-react";

interface GenericToolUIProps {
  tool: DevTool;
}

export default function GenericToolUI({ tool }: GenericToolUIProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-8 text-center animate-fadeIn">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-yellow-400/20 blur-[50px] rounded-full" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900/80 shadow-2xl backdrop-blur-xl">
          <Wrench className="h-10 w-10 text-yellow-400" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mb-3">
        {tool.title} is coming soon
      </h2>
      <p className="text-sm text-white/50 max-w-md mx-auto leading-relaxed">
        This tool is currently under development. DawnDesk updates regularly, so check back soon to access this feature offline, forever.
      </p>

      <button className="mt-8 rounded-xl bg-neutral-800 px-6 py-3 text-xs font-bold text-white hover:bg-neutral-700 transition-colors shadow-lg">
        Notify me when available
      </button>
    </div>
  );
}
