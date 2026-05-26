import { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bookmark,
  Box,
  Code2,
  Cpu,
  Database,
  Flag,
  Folder,
  LayoutList,
  Lightbulb,
  LineChart,
  MessageSquare,
  PieChart,
  Receipt,
  ShieldCheck,
  Sparkles,
  Terminal,
  TrendingUp,
  Wallet,
  Wand2,
} from "lucide-react";

import ProjectBackground from "./backgrounds/ProjectBackground";
import FinanceBackground from "./backgrounds/FinanceBackground";
import DevToolsBackground from "./backgrounds/DevToolsBackground";
import PromptsBackground from "./backgrounds/PromptsBackground";
import NotesBackground from "./backgrounds/NotesBackground";

interface WelcomeScreenProps {
  appKey: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}

type Feature = {
  icon: React.ReactNode;
  title: string;
  desc: string;
};

export default function WelcomeScreen({ appKey, title, description, children }: WelcomeScreenProps) {
  const [showWelcome, setShowWelcome] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Always show welcome screen as requested
    setShowWelcome(true);
    setLoading(false);
  }, [appKey]);

  const handleEnter = () => {
    localStorage.setItem(`welcomed_${appKey}`, "true");
    setShowWelcome(false);
  };

  if (loading) return null;
  if (!showWelcome) return <>{children}</>;

  let content: any = {
    appName: "DawnDesk Module",
    appIcon: <Box className="h-5 w-5 text-yellow-400" />,
    title,
    titleHighlight: "",
    subtitle: description || "Open this DawnDesk workspace.",
    features: [] as Feature[],
    buttonText: "Get Started",
    BackgroundComponent: null,
  };

  if (appKey === "project-manager") {
    content = {
      appName: "DawnDesk Project Manager",
      appIcon: <Folder className="h-5 w-5 text-yellow-400" />,
      title: "Welcome to\n",
      titleHighlight: "Project Manager",
      subtitle: "Plan, organize, and deliver work from one focused local workspace.",
      features: [
        { icon: <LayoutList className="h-5 w-5 text-yellow-400" />, title: "Plan Clearly", desc: "Break work into manageable tasks and priorities." },
        { icon: <LineChart className="h-5 w-5 text-yellow-400" />, title: "Track Progress", desc: "See what is planned, active, and complete." },
        { icon: <Flag className="h-5 w-5 text-yellow-400" />, title: "Ship Work", desc: "Keep delivery visible without extra noise." },
      ],
      buttonText: "Open Project Manager",
      BackgroundComponent: ProjectBackground,
    };
  } else if (appKey === "finance") {
    content = {
      appName: "DawnDesk Finance Manager",
      appIcon: <Wallet className="h-5 w-5 text-yellow-400" />,
      title: "Welcome to\n",
      titleHighlight: "Finance Manager",
      subtitle: "Track money, budgets, goals, and invoices in a private local workspace.",
      features: [
        { icon: <TrendingUp className="h-5 w-5 text-yellow-400" />, title: "Analyze Flow", desc: "Understand income, expenses, and trends." },
        { icon: <Receipt className="h-5 w-5 text-yellow-400" />, title: "Track Records", desc: "Keep accounts and transactions organized." },
        { icon: <PieChart className="h-5 w-5 text-yellow-400" />, title: "Plan Ahead", desc: "Use budgets, goals, and renewals to stay ready." },
        { icon: <ShieldCheck className="h-5 w-5 text-yellow-400" />, title: "Stay Private", desc: "Your finance workspace stays on this device." },
      ],
      buttonText: "Open Finance Manager",
      BackgroundComponent: FinanceBackground,
    };
  } else if (appKey === "devtools") {
    content = {
      appName: "DawnDesk Developer Tools",
      appIcon: <Terminal className="h-5 w-5 text-yellow-400" />,
      title: "Welcome to\n",
      titleHighlight: "Developer Tools",
      subtitle: "Use practical utilities for code, data, and environment work.",
      features: [
        { icon: <Code2 className="h-5 w-5 text-yellow-400" />, title: "Code Utilities", desc: "Format, inspect, and transform common inputs." },
        { icon: <Database className="h-5 w-5 text-yellow-400" />, title: "Data Tools", desc: "Work with local development data faster." },
        { icon: <Activity className="h-5 w-5 text-yellow-400" />, title: "System View", desc: "Keep an eye on useful runtime signals." },
        { icon: <Cpu className="h-5 w-5 text-yellow-400" />, title: "Environment Help", desc: "Reduce friction around local setup tasks." },
      ],
      buttonText: "Open DevTools",
      BackgroundComponent: DevToolsBackground,
    };
  } else if (appKey === "prompts") {
    content = {
      appName: "DawnDesk Prompt Manager",
      appIcon: <Sparkles className="h-5 w-5 text-yellow-400" />,
      title: "Welcome to\n",
      titleHighlight: "Prompt Manager",
      subtitle: "Save, search, and reuse your most reliable AI prompt templates.",
      features: [
        { icon: <MessageSquare className="h-5 w-5 text-yellow-400" />, title: "Write Once", desc: "Keep dependable instructions ready." },
        { icon: <Bookmark className="h-5 w-5 text-yellow-400" />, title: "Organize Simply", desc: "Group templates without clutter." },
        { icon: <Wand2 className="h-5 w-5 text-yellow-400" />, title: "Reuse Variables", desc: "Use placeholders like [Topic] and [Code]." },
        { icon: <Lightbulb className="h-5 w-5 text-yellow-400" />, title: "Move Faster", desc: "Copy the right prompt when work begins." },
      ],
      buttonText: "Open Prompt Manager",
      BackgroundComponent: PromptsBackground,
    };
  } else if (appKey === "notes") {
    content = {
      appName: "DawnDesk Notes",
      appIcon: <Lightbulb className="h-5 w-5 text-yellow-400" />,
      title: "Welcome to\n",
      titleHighlight: "Notes & Knowledge Base",
      subtitle: "Capture ideas, link knowledge, and build your second brain — all offline.",
      features: [
        { icon: <Lightbulb className="h-5 w-5 text-yellow-400" />, title: "Capture Ideas", desc: "Rich text editor with markdown, code blocks, and media." },
        { icon: <Bookmark className="h-5 w-5 text-yellow-400" />, title: "Organize Everything", desc: "Notebooks, tags, and favorites keep notes findable." },
        { icon: <Activity className="h-5 w-5 text-yellow-400" />, title: "Link Knowledge", desc: "Wiki-style linking, backlinks, and graph view." },
        { icon: <Database className="h-5 w-5 text-yellow-400" />, title: "Stay Private", desc: "All your notes stay on this device, always." },
      ],
      buttonText: "Open Notes",
      BackgroundComponent: NotesBackground,
    };
  }

  return (
    <div className="relative dd-page duration-500">
      {content.BackgroundComponent && (
        <>
          <content.BackgroundComponent />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-neutral-950 from-30% via-neutral-950/88 via-64% to-neutral-950/10" />
        </>
      )}

      <div className="custom-scrollbar relative z-10 h-full w-full overflow-y-auto">
        <div className="flex min-h-full w-full flex-col justify-center p-6 sm:p-8 lg:w-[55%] xl:p-12">

        <h1 className="text-[2.75rem] sm:text-[3.25rem] leading-[1.1] font-bold text-white mb-4 tracking-tight">
          {content.title}
          <span className="text-yellow-400">{content.titleHighlight}</span>
        </h1>

        <div className="mb-5 mt-5 h-[3px] w-12 rounded-full bg-yellow-400" />

        <p className="mb-5 max-w-md dd-body-lg leading-relaxed sm:text-[1.05rem]">
          {content.subtitle}
        </p>

        {content.features.length > 0 && (
          <div className="mb-5 grid gap-3">
            {content.features.map((feature: Feature) => (
              <div key={feature.title} className="flex items-start gap-4 dd-card p-3">
                <div className="shrink-0 dd-icon-box-sm bg-neutral-950">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="mb-0.5 dd-card-title">{feature.title}</h3>
                  <p className="leading-snug dd-subtext">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-auto pb-2 pt-2">
          <button
            onClick={handleEnter}
            className="group flex w-full max-w-[340px] items-center justify-between dd-btn-primary py-4 shadow-lg shadow-yellow-500/10"
          >
            <span className="text-base tracking-wide">{content.buttonText}</span>
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
