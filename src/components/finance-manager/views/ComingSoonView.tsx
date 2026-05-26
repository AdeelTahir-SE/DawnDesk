import { Construction } from "lucide-react";

export default function ComingSoonView({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-10 text-center shadow-lg shadow-black/20">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400 mb-6">
          <Construction className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="max-w-md mx-auto text-sm text-white/50">
          This module is part of the ERP overhaul and is currently under construction. Check back soon!
        </p>
      </div>
    </div>
  );
}
