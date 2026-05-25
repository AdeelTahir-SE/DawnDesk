import { useState, useEffect } from "react";
import { 
  ArrowRight, Folder, LayoutList, Users, LineChart, Flag,
  Wallet, TrendingUp, Receipt, PieChart, ShieldCheck, Box,
  Terminal, Sparkles
} from "lucide-react";

import projectWelcomeImg from "../assets/project-welcome.png";
import financeWelcomeImg from "../assets/finance-welcome.png";

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
    content.appName = "DawnDesk Developer Tools";
    content.appIcon = <Terminal className="w-5 h-5 text-yellow-400" />;
    content.title = "Welcome to\n";
    content.titleHighlight = "Developer Tools";
    content.buttonText = "Open DevTools";
    // Missing image for devtools, fallback to default aesthetic
  } else if (appKey === "prompts") {
    content.appName = "DawnDesk Prompt Manager";
    content.appIcon = <Sparkles className="w-5 h-5 text-yellow-400" />;
    content.title = "Welcome to\n";
    content.titleHighlight = "Prompt Manager";
    content.buttonText = "Open Prompt Manager";
  }

  return (
    <div className="flex w-full h-[calc(100vh-4rem)] bg-[#0a0a0a] text-white overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      
      {/* LEFT COLUMN: Content */}
      <div className="w-full lg:w-1/2 p-8 sm:p-12 xl:p-20 flex flex-col justify-center h-full overflow-y-auto custom-scrollbar relative z-10">
        
        {/* App Logo/Name */}
        <div className="flex items-center gap-3 mb-10 sm:mb-16">
          <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center border border-yellow-400/20 shadow-sm">
            {content.appIcon}
          </div>
          <span className="text-sm font-bold text-white/80">{content.appName}</span>
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight mb-6 whitespace-pre-line leading-tight">
          {content.title}
          <span className="text-yellow-400">{content.titleHighlight}</span>
        </h1>
        
        <p className="text-sm sm:text-base text-white/60 max-w-lg mb-12 whitespace-pre-line leading-relaxed font-medium">
          {content.subtitle}
        </p>

        {/* Features List */}
        {content.features.length > 0 && (
          <div className="flex flex-col gap-8 mb-12">
            {content.features.map((feat, idx) => (
              <div key={idx} className="flex gap-4 sm:gap-5 items-start">
                <div className="w-12 h-12 shrink-0 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shadow-sm">
                  {feat.icon}
                </div>
                <div className="flex flex-col">
                  <h3 className="text-base font-bold text-white mb-1 tracking-tight">{feat.title}</h3>
                  <p className="text-sm text-white/50 leading-snug">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Button */}
        <div className="mt-auto pt-8">
          <button 
            onClick={handleEnter}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-yellow-400 text-black text-sm font-bold hover:bg-yellow-300 transition-all shadow-lg flex items-center justify-center gap-3 group"
          >
            {content.buttonText}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: Image */}
      <div className="hidden lg:block lg:w-1/2 h-full relative border-l border-white/5 bg-neutral-900">
        {content.image ? (
          <>
            <img 
              src={content.image} 
              alt="Welcome background" 
              className="absolute inset-0 w-full h-full object-cover object-right"
            />
            {/* Gradient overlay to smoothly blend the image with the black left side */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/30 to-transparent w-32" />
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
             <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-400/5 rounded-full blur-[100px]" />
             <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px]" />
             <div className="w-48 h-48 rounded-full border-[12px] border-white/5 flex items-center justify-center shadow-2xl">
               {content.appIcon}
             </div>
          </div>
        )}
      </div>

    </div>
  );
}
