import { useState, useEffect } from "react";
import { 
  ArrowRight, Folder, LayoutList, Users, LineChart, Flag,
  Wallet, TrendingUp, Receipt, PieChart, ShieldCheck, Box,
  Terminal, Sparkles, Code2, Database, Activity, Cpu,
  MessageSquare, Wand2, Lightbulb, Bookmark
} from "lucide-react";

import projectWelcomeImg from "../assets/project-welcome-clean.png";
import financeWelcomeImg from "../assets/finance-welcome-clean.png";
import devtoolsWelcomeImg from "../assets/devtools-welcome-bg.png";
import promptsWelcomeImg from "../assets/prompts-welcome-bg.png";

interface WelcomeScreenProps {
  appKey: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export default function WelcomeScreen({ appKey, title, description, children }: WelcomeScreenProps) {
  const [showWelcome, setShowWelcome] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem(`welcomed_${appKey}`);
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
    setLoading(false);
  }, [appKey]);

  const handleEnter = () => {
    localStorage.setItem(`welcomed_${appKey}`, "true");
    setShowWelcome(false);
  };

  if (loading) return null;

  if (!showWelcome) {
    return <>{children}</>;
  }

  // Define content based on appKey
  let content = {
    appName: "DawnDesk Module",
    appIcon: <Box className="w-5 h-5 text-yellow-400" />,
    title: title,
    titleHighlight: "",
    subtitle: description || "Welcome to this new module!",
    features: [] as { icon: React.ReactNode, title: string, desc: string }[],
    buttonText: "Get Started",
    image: ""
  };

  if (appKey === "project-manager") {
    content = {
      appName: "DawnDesk Project Manager",
      appIcon: <Folder className="w-5 h-5 text-yellow-400" />,
      title: "Welcome to\n",
      titleHighlight: "Project Manager",
      subtitle: "Plan. Organize. Collaborate. Deliver.\nManage your projects, track progress, collaborate with your team, and achieve your goals — all in one powerful workspace.",
      features: [
        { icon: <LayoutList className="w-5 h-5 text-yellow-400" />, title: "Plan with Clarity", desc: "Break down ideas into actionable tasks and clear timelines." },
        { icon: <Users className="w-5 h-5 text-yellow-400" />, title: "Collaborate Seamlessly", desc: "Work together with your team and keep everyone aligned." },
        { icon: <LineChart className="w-5 h-5 text-yellow-400" />, title: "Track Progress", desc: "Monitor milestones, tasks, and deadlines in real time." },
        { icon: <Flag className="w-5 h-5 text-yellow-400" />, title: "Deliver Results", desc: "Stay focused, meet goals, and celebrate every win." }
      ],
      buttonText: "Get Started with Project Manager",
      image: projectWelcomeImg
    };
  } else if (appKey === "finance") {
    content = {
      appName: "DawnDesk Finance Manager",
      appIcon: <Wallet className="w-5 h-5 text-yellow-400" />,
      title: "Welcome to\n",
      titleHighlight: "Finance Manager",
      subtitle: "Take control of your finances.\nTrack income, manage expenses, analyze trends, and plan for a smarter financial future — all in one powerful workspace.",
      features: [
        { icon: <TrendingUp className="w-5 h-5 text-yellow-400" />, title: "Track & Analyze", desc: "Get real-time insights into your income and expenses." },
        { icon: <Receipt className="w-5 h-5 text-yellow-400" />, title: "Smart Budgeting", desc: "Create budgets, set limits, and stay on track." },
        { icon: <PieChart className="w-5 h-5 text-yellow-400" />, title: "Visual Reports", desc: "Understand your money with beautiful reports." },
        { icon: <ShieldCheck className="w-5 h-5 text-yellow-400" />, title: "Secure & Private", desc: "Your data is encrypted and always protected." }
      ],
      buttonText: "Explore Finance Manager",
      image: financeWelcomeImg
    };
  } else if (appKey === "devtools") {
    content = {
      appName: "DawnDesk Developer Tools",
      appIcon: <Terminal className="w-5 h-5 text-yellow-400" />,
      title: "Welcome to\n",
      titleHighlight: "Developer Tools",
      subtitle: "Supercharge your development.\nA suite of powerful utilities, database managers, and performance monitors designed to help you build faster and smarter.",
      features: [
        { icon: <Code2 className="w-5 h-5 text-yellow-400" />, title: "Code Utilities", desc: "Formatters, linters, and quick-converters." },
        { icon: <Database className="w-5 h-5 text-yellow-400" />, title: "Local DB Management", desc: "Inspect and manage your SQLite databases." },
        { icon: <Activity className="w-5 h-5 text-yellow-400" />, title: "System Monitoring", desc: "Track memory, CPU, and network requests in real-time." },
        { icon: <Cpu className="w-5 h-5 text-yellow-400" />, title: "Environment Configs", desc: "Seamlessly manage local environments and secrets." }
      ],
      buttonText: "Open DevTools",
      image: devtoolsWelcomeImg
    };
  } else if (appKey === "prompts") {
    content = {
      appName: "DawnDesk Prompt Manager",
      appIcon: <Sparkles className="w-5 h-5 text-yellow-400" />,
      title: "Welcome to\n",
      titleHighlight: "Prompt Manager",
      subtitle: "Elevate your AI interactions.\nCraft, test, organize, and perfect your AI prompts in a dedicated offline workspace built for engineers and creatives.",
      features: [
        { icon: <MessageSquare className="w-5 h-5 text-yellow-400" />, title: "Craft & Test", desc: "Design complex prompts and test them interactively." },
        { icon: <Bookmark className="w-5 h-5 text-yellow-400" />, title: "Organize Library", desc: "Save your best prompts into categories and folders." },
        { icon: <Wand2 className="w-5 h-5 text-yellow-400" />, title: "Variable Injection", desc: "Use dynamic variables like {{name}} to reuse templates." },
        { icon: <Lightbulb className="w-5 h-5 text-yellow-400" />, title: "Discover Ideas", desc: "Get inspiration for new ways to interact with AI." }
      ],
      buttonText: "Open Prompt Manager",
      image: promptsWelcomeImg
    };
  }

  return (
    <div className="relative flex w-full h-full bg-[#0a0a0a] text-white overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      
      {/* Background Image */}
      {content.image ? (
        <img 
          src={content.image} 
          alt="Welcome background" 
          className="absolute inset-0 w-full h-full object-cover object-center sm:object-right"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
           <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-400/5 rounded-full blur-[100px]" />
           <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px]" />
           <div className="w-48 h-48 rounded-full border-[12px] border-white/5 flex items-center justify-center shadow-2xl">
             {content.appIcon}
           </div>
        </div>
      )}

      {/* Gradient Overlay for Text Readability */}
      {content.image && (
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] from-30% via-[#0a0a0a]/80 via-60% to-transparent to-100% w-full pointer-events-none" />
      )}
      
      {/* LEFT COLUMN: Content */}
      <div className="w-full lg:w-[55%] p-6 sm:p-8 xl:p-12 flex flex-col justify-center h-full overflow-y-auto custom-scrollbar relative z-10">
        
        {/* Removed App Logo/Name */}

        {/* Title & Subtitle */}
        <h1 className="text-[2.5rem] sm:text-[3rem] leading-[1.1] font-bold text-white mb-3 tracking-tight mt-4 whitespace-pre-line">
          {content.title}
          <span className="text-[#facc15]">{content.titleHighlight}</span>
        </h1>
        
        {/* Small Yellow Line */}
        <div className="w-12 h-[3px] bg-gradient-to-r from-[#facc15] to-[#facc15]/30 rounded-full mb-4"></div>
        
        <div className="text-base sm:text-[1.05rem] text-white/70 mb-4 leading-relaxed max-w-md whitespace-pre-line">
          {content.subtitle}
        </div>

        {/* Features List */}
        {content.features.length > 0 && (
          <div className="flex flex-col gap-3 mb-4">
            {content.features.map((feat, idx) => (
              <div key={idx} className="flex gap-4 sm:gap-4 items-start">
                <div className="w-9 h-9 shrink-0 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                  {feat.icon}
                </div>
                <div className="flex flex-col">
                  <h3 className="text-white font-semibold text-base mb-0.5">{feat.title}</h3>
                  <p className="text-white/50 text-sm leading-snug">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Button */}
        <div className="mt-auto pt-2 pb-2">
          <button 
            onClick={handleEnter}
            className="flex items-center justify-between w-[340px] bg-[#facc15] hover:bg-[#fbbf24] text-black font-semibold py-4 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-yellow-500/20 group"
          >
            <span className="text-lg tracking-wide">{content.buttonText}</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
