import { useState, useEffect } from "react";

interface OnboardingWrapperProps {
  appKey: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export default function OnboardingWrapper({ appKey, title, description, children }: OnboardingWrapperProps) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hasOnboarded = localStorage.getItem(`onboarded_${appKey}`);
    if (!hasOnboarded) {
      setShowOnboarding(true);
    }
    setLoading(false);
  }, [appKey]);

  const handleSkip = () => {
    localStorage.setItem(`onboarded_${appKey}`, "true");
    setShowOnboarding(false);
  };

  if (loading) return null;

  if (!showOnboarding) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col w-full h-full min-h-[calc(100vh-4rem)] bg-neutral-950 p-4 animate-in fade-in zoom-in-95 duration-500 relative">
      <div className="flex flex-col items-center justify-center flex-1 max-w-3xl mx-auto text-center z-10">
        <div className="w-24 h-24 rounded-3xl bg-yellow-400/10 flex items-center justify-center mb-8 border border-yellow-400/20 shadow-[0_0_50px_rgba(250,204,21,0.1)]">
          <span className="text-4xl">👋</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">{title}</h1>
        <p className="text-lg text-white/50 max-w-xl leading-relaxed">
          {description || "You can customize this boarding screen later."}
        </p>
      </div>
      
      {/* Background aesthetics */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-400/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="absolute bottom-8 right-8 z-20">
        <button 
          onClick={handleSkip}
          className="px-8 py-3 rounded-xl border border-neutral-700 bg-neutral-900/80 text-white font-bold hover:bg-neutral-800 hover:text-yellow-400 hover:border-yellow-400/50 transition-all shadow-lg backdrop-blur-md flex items-center gap-2 group"
        >
          Skip 
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </button>
      </div>
    </div>
  );
}
