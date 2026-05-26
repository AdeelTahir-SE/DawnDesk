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

type Feature = {
  icon: React.ReactNode;
  title: string;
  desc: string;
};

export default function WelcomeScreen({ appKey, title, description, children }: WelcomeScreenProps) {
  const [showWelcome, setShowWelcome] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem(`welcomed_${appKey}`);
    if (!hasSeenWelcome) setShowWelcome(true);
    setLoading(false);
  }, [appKey]);

  const handleEnter = () => {
    localStorage.setItem(`welcomed_${appKey}`, "true");
    setShowWelcome(false);
  };

  if (loading) return null;
  if (!showWelcome) return <>{children}</>;

  let content = {
    appName: "DawnDesk Module",
    appIcon: <Box className="h-5 w-5 text-yellow-400" />,
    title,
    titleHighlight: "",
    subtitle: description || "Open this DawnDesk workspace.",
    features: [] as Feature[],
    buttonText: "Get Started",
    image: "",
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
      image: projectWelcomeImg,
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
      image: financeWelcomeImg,
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
      image: devtoolsWelcomeImg,
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
      image: promptsWelcomeImg,
    };
  }

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-neutral-950 text-white animate-in fade-in zoom-in-95 duration-500">
      {content.image && (
        <>
          <img src={content.image} alt="" className="absolute inset-0 h-full w-full object-cover object-center sm:object-right" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-neutral-950 from-30% via-neutral-950/88 via-64% to-neutral-950/10" />
        </>
      )}

      {!content.image && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="flex h-48 w-48 items-center justify-center rounded-full border-[12px] border-white/5 shadow-2xl">
            {content.appIcon}
          </div>
        </div>
      )}

      <div className="custom-scrollbar relative z-10 flex h-full w-full flex-col justify-center overflow-y-auto p-6 sm:p-8 lg:w-[55%] xl:p-12">
        <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/70 px-3 py-1 text-xs font-semibold text-white/60">
          {content.appIcon}
          {content.appName}
        </div>

        <h1 className="font-heading whitespace-pre-line text-[2.5rem] font-black leading-[1.05] tracking-tight text-white sm:text-[3rem]">
          {content.title}
          <span className="text-yellow-400">{content.titleHighlight}</span>
        </h1>

        <div className="mb-5 mt-5 h-[3px] w-12 rounded-full bg-yellow-400" />

        <p className="mb-5 max-w-md text-base leading-relaxed text-white/65 sm:text-[1.05rem]">
          {content.subtitle}
        </p>

        {content.features.length > 0 && (
          <div className="mb-5 grid gap-3">
            {content.features.map((feature) => (
              <div key={feature.title} className="flex items-start gap-4 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="mb-0.5 text-sm font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm leading-snug text-white/50">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-auto pb-2 pt-2">
          <button
            onClick={handleEnter}
            className="group flex w-full max-w-[340px] items-center justify-between rounded-xl bg-yellow-400 px-6 py-4 font-bold text-black shadow-lg shadow-yellow-500/10 transition-colors hover:bg-yellow-300 active:scale-[0.99]"
          >
            <span className="text-base tracking-wide">{content.buttonText}</span>
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
