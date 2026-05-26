import { useState, useEffect } from "react";
import { 
  Image as ImageIcon, Wand2, Layers, GraduationCap, ArrowRight,
  Sparkles, SlidersHorizontal, HeartPulse, Palette, Settings2, Eye,
  LayoutDashboard, FolderKanban, CloudUpload, PlaySquare, Lightbulb, 
  Check, Play, ChevronRight 
} from "lucide-react";
import bgNightSky from "../../assets/bg-night-sky.png";
import bgOcean from "../../assets/bg-ocean.png";
import bgForest from "../../assets/bg-forest.png";

export default function PhotoEditorOnboarding({ children }: { children: React.ReactNode }) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);

  const bgImages = [bgNightSky, bgOcean, bgForest];
  const currentBg = bgImages[step % bgImages.length];

  useEffect(() => {
    // FORCE ONBOARDING FOR TESTING
    setShowOnboarding(true);
    setLoading(false);
  }, []);

  const handleComplete = () => {
    localStorage.setItem(`onboarded_photo-editor`, "true");
    setShowOnboarding(false);
  };

  const nextStep = () => setStep(s => Math.min(5, s + 1));
  const prevStep = () => setStep(s => Math.max(0, s - 1));

  if (loading) return null;
  if (!showOnboarding) {
    return <>{children}</>;
  }

  // Right visual for Step 1 (Tools)
  const EditingToolsVisual = () => (
    <div className="absolute right-12 top-1/2 -translate-y-1/2 w-[450px] h-[350px] bg-neutral-900/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl flex overflow-hidden animate-in fade-in zoom-in duration-700">
      <div className="w-12 bg-black/40 border-r border-white/5 flex flex-col items-center py-4 gap-4">
        <div className="flex gap-1.5 mb-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
        </div>
        <div className="flex flex-col gap-5 text-white/40 mt-4">
          <Wand2 size={16} />
          <Palette size={16} />
          <SlidersHorizontal size={16} />
          <Layers size={16} />
        </div>
      </div>
      <div className="flex-1 p-4 relative">
        <div className="w-full h-full rounded-xl bg-cover bg-center shadow-inner" style={{backgroundImage: `url(${currentBg})`}}></div>
        {/* Sliders Panel Mockup */}
        <div className="absolute -right-6 top-6 w-56 bg-neutral-900/90 backdrop-blur-md rounded-xl border border-white/10 p-4 shadow-2xl">
          <div className="text-sm font-semibold text-white mb-3 flex justify-between items-center">
            <span>Light</span><ChevronRight size={14} className="text-white/50"/>
          </div>
          {['Exposure', 'Contrast', 'Highlights', 'Shadows', 'Whites', 'Blacks'].map((label, i) => (
            <div key={label} className="mb-2.5">
              <div className="flex justify-between text-[10px] text-white/60 mb-1.5">
                <span>{label}</span>
                <span>{i % 2 === 0 ? '+' : '-'}{10 + i * 5}</span>
              </div>
              <div className="h-1 bg-white/10 rounded-full">
                <div className="h-full bg-[#facc15] w-2/3 rounded-full relative" style={{width: `${40 + i * 10}%`}}>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Right visual for Step 2 (Filters)
  const FiltersVisual = () => (
    <div className="absolute right-12 bottom-24 w-[500px] bg-neutral-900/80 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-700">
      <div className="flex gap-4 mb-4 text-[11px] font-medium text-white/50 border-b border-white/5 pb-3">
        <span className="text-white bg-white/10 px-3 py-1 rounded-full">All</span>
        <span className="px-1 py-1">Landscape</span>
        <span className="px-1 py-1">Portrait</span>
        <span className="px-1 py-1">B&W</span>
        <span className="px-1 py-1">Cinematic</span>
        <span className="px-1 py-1">Vintage</span>
      </div>
      <div className="flex gap-3 overflow-hidden">
        {['Original', 'Vibrant', 'Moody', 'Cinematic', 'Warm'].map((f, i) => (
          <div key={f} className="flex flex-col items-center gap-2 flex-1">
            <div className={`w-full aspect-square rounded-xl bg-cover bg-center border-2 transition-colors ${i === 1 ? 'border-[#facc15]' : 'border-transparent'}`} style={{backgroundImage: `url(${currentBg})`, filter: i === 2 ? 'grayscale(0.5)' : i === 3 ? 'contrast(1.2) sepia(0.2)' : 'none'}}></div>
            <span className={`text-[10px] font-medium ${i === 1 ? 'text-[#facc15]' : 'text-white/70'}`}>{f}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // Right visual for Step 3 (Work Your Way)
  const WorkspaceVisual = () => (
    <div className="absolute right-20 top-1/2 -translate-y-1/2 w-full max-w-[450px] h-full max-h-[400px] animate-in fade-in zoom-in duration-700">
      <div className="absolute left-0 top-0 w-64 bg-neutral-900/90 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-2xl z-20">
        <div className="flex justify-between items-center mb-5">
          <span className="text-sm font-semibold text-white">Projects</span>
          <span className="text-[10px] font-medium bg-white/10 px-3 py-1 rounded-full text-white hover:bg-white/20 cursor-pointer">Open</span>
        </div>
        {['Landscape Collection', 'Portraits', 'Travel 2024', 'Favorites'].map((p, i) => (
          <div key={p} className="flex items-center gap-3 mb-4 last:mb-0 group cursor-pointer">
            <div className="w-10 h-10 rounded-lg bg-cover bg-center" style={{backgroundImage: `url(${bgImages[i % bgImages.length]})`, filter: `hue-rotate(${i * 45}deg)`}}></div>
            <div className="flex-1">
              <div className="text-xs font-medium text-white/90 group-hover:text-white">{p}</div>
              <div className="text-[10px] text-white/50">{8 + i * 3} items</div>
            </div>
            <ChevronRight size={14} className="text-white/30 group-hover:text-white/70 transition-colors" />
          </div>
        ))}
      </div>
      
      <div className="absolute right-0 bottom-10 bg-neutral-900/90 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-2xl flex items-center gap-5 z-30">
        <div>
          <div className="text-sm text-white font-semibold mb-0.5">Cloud Synced</div>
          <div className="text-[11px] text-white/50">All changes saved</div>
        </div>
        <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400">
          <Check size={18} strokeWidth={3}/>
        </div>
      </div>
      
      {/* Background abstract connection line */}
      <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none opacity-30" overflow="visible">
        <path d="M 120 100 C 300 100 200 300 400 320" fill="none" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
        <circle cx="120" cy="100" r="3" fill="white" />
        <circle cx="400" cy="320" r="3" fill="white" />
      </svg>
    </div>
  );

  // Right visual for Step 4 (Learn)
  const LearnVisual = () => (
    <div className="absolute right-24 top-1/2 -translate-y-1/2 w-80 bg-neutral-900/90 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-2xl animate-in fade-in slide-in-from-right-10 duration-700">
      <div className="text-sm font-semibold text-white mb-4">Learn</div>
      <div className="flex gap-4 text-[11px] text-white/50 mb-4 border-b border-white/5 pb-2">
        <span className="text-[#facc15] border-b border-[#facc15] pb-2 -mb-[9px]">Tutorials</span>
        <span>Tips</span>
        <span>Inspiration</span>
      </div>
      
      <div className="w-full h-36 rounded-xl bg-cover bg-center relative mb-4 shadow-inner group cursor-pointer transition-all duration-700" style={{backgroundImage: `url(${currentBg})`}}>
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors rounded-xl"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 transition-transform">
            <Play size={20} fill="currentColor" className="ml-1"/>
          </div>
        </div>
      </div>
      
      <div className="text-sm text-white font-semibold mb-1">Enhance Landscapes</div>
      <div className="flex justify-between items-center text-[11px] text-white/50 mb-5">
        <span>Make your landscapes pop</span>
        <span>12 min</span>
      </div>
      
      <div className="text-xs text-white font-medium mb-3">More Tutorials</div>
      {['Perfect Portraits', 'Creative Color Grading'].map((t, i) => (
        <div key={t} className="flex items-center gap-3 mb-3 last:mb-0 cursor-pointer group">
          <div className="w-12 h-10 rounded-lg bg-cover bg-center" style={{backgroundImage: `url(${bgImages[(i+1) % bgImages.length]})`, filter: i === 0 ? 'hue-rotate(90deg)' : 'hue-rotate(-45deg)'}}></div>
          <div className="flex-1">
            <div className="text-[11px] font-medium text-white/80 group-hover:text-white">{t}</div>
            <div className="text-[9px] text-white/40 mt-0.5">{8 + i * 2} min</div>
          </div>
          <Play size={12} className="text-white/30 group-hover:text-[#facc15]" />
        </div>
      ))}
    </div>
  );

  const slides = [
    // Slide 0: Welcome
    {
      title: <><span className="text-white">Welcome to</span><br/><span className="text-[#facc15]">Photo Editor</span></>,
      desc: <><p className="font-semibold text-white mb-1">Edit. Enhance. Inspire.</p><p>Transform your photos with powerful tools,<br/>creative filters, and professional adjustments<br/>— all in one beautiful workspace.</p></>,
      features: [
        { icon: <Wand2 className="w-5 h-5 text-[#facc15]" />, title: "Powerful Tools", desc: "Everything you need to perfect your photos" },
        { icon: <Layers className="w-5 h-5 text-[#facc15]" />, title: "Creative Freedom", desc: "Unleash your creativity with unlimited possibilities" }
      ],
      rightVisual: null
    },
    // Slide 1: Editing Tools
    {
      title: <><span className="text-white">Powerful</span><br/><span className="text-[#facc15]">Editing Tools</span></>,
      desc: <p>Crop, adjust, retouch, and fine-tune<br/>every detail with a complete set of<br/>professional tools.</p>,
      features: [
        { icon: <Sparkles className="w-5 h-5 text-[#facc15]" />, title: "Smart Adjustments", desc: "Perfect lighting and colors in one click" },
        { icon: <SlidersHorizontal className="w-5 h-5 text-[#facc15]" />, title: "Advanced Controls", desc: "Precise edits for the perfect result" },
        { icon: <HeartPulse className="w-5 h-5 text-[#facc15]" />, title: "Non-Destructive Editing", desc: "Edit freely, your originals stay safe" }
      ],
      rightVisual: <EditingToolsVisual />
    },
    // Slide 2: Filters
    {
      title: <><span className="text-white">Stunning</span><br/><span className="text-[#facc15]">Filters & Effects</span></>,
      desc: <p>Bring your photos to life with a wide<br/>range of creative filters and effects<br/>designed to inspire.</p>,
      features: [
        { icon: <Palette className="w-5 h-5 text-[#facc15]" />, title: "One-Click Looks", desc: "Instantly transform your photos" },
        { icon: <Settings2 className="w-5 h-5 text-[#facc15]" />, title: "Custom Filters", desc: "Create and save your own style" },
        { icon: <Eye className="w-5 h-5 text-[#facc15]" />, title: "Real-Time Preview", desc: "See every change as you edit" }
      ],
      rightVisual: <FiltersVisual />
    },
    // Slide 3: Work Your Way
    {
      title: <><span className="text-white">Work Your</span><br/><span className="text-[#facc15]">Way</span></>,
      desc: <p>Customize your workspace, organize<br/>your projects, and work the way<br/>you like.</p>,
      features: [
        { icon: <LayoutDashboard className="w-5 h-5 text-[#facc15]" />, title: "Custom Workspace", desc: "Arrange tools to fit your workflow" },
        { icon: <FolderKanban className="w-5 h-5 text-[#facc15]" />, title: "Project Management", desc: "Keep your edits organized" },
        { icon: <CloudUpload className="w-5 h-5 text-[#facc15]" />, title: "Cloud Sync", desc: "Access your projects anywhere" }
      ],
      rightVisual: <WorkspaceVisual />
    },
    // Slide 4: Learn
    {
      title: <><span className="text-white">Learn.</span><br/><span className="text-[#facc15]">Create. Grow.</span></>,
      desc: <p>Access tutorials, tips, and guides to<br/>improve your skills and take your<br/>creativity to the next level.</p>,
      features: [
        { icon: <PlaySquare className="w-5 h-5 text-[#facc15]" />, title: "Step-by-Step Tutorials", desc: "Learn at your own pace" },
        { icon: <Lightbulb className="w-5 h-5 text-[#facc15]" />, title: "Tips & Tricks", desc: "Discover new techniques" },
        { icon: <ImageIcon className="w-5 h-5 text-[#facc15]" />, title: "Inspiration Gallery", desc: "Get inspired by amazing edits" }
      ],
      rightVisual: <LearnVisual />
    },
    // Slide 5: All Set
    {
      title: <><span className="text-white">You're</span> <span className="text-[#facc15]">All Set!</span></>,
      desc: <p>Start editing and bring your<br/>vision to life with DawnDesk<br/>Photo Editor.</p>,
      features: [
        { icon: <Check className="w-5 h-5 text-[#facc15]" />, title: "Powerful tools", desc: "" },
        { icon: <Check className="w-5 h-5 text-[#facc15]" />, title: "Creative freedom", desc: "" },
        { icon: <Check className="w-5 h-5 text-[#facc15]" />, title: "Endless possibilities", desc: "" }
      ],
      rightVisual: null
    }
  ];

  const currentSlide = slides[step];

  return (
    <div className=" relative z-[100] w-full h-full min-h-[calc(100vh-4rem)] overflow-hidden bg-black flex font-sans select-none ">
      {/* Background image */}
      {bgImages.map((img, idx) => (
        <img 
          key={img}
          src={img} 
          alt="Background" 
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${idx === (step % bgImages.length) ? 'opacity-100' : 'opacity-0'} ${step % 2 !== 0 ? 'scale-110' : 'scale-100'} transition-transform duration-[20s]`}
        />
      ))}
      
      {/* Left Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#111113] via-[#111113]/90 to-transparent w-[75%]" />
      <div className="absolute inset-0 bg-black/30" />
      
      {/* Top Right Skip Button */}
      <button 
        onClick={handleComplete} 
        className="absolute top-8 right-8 px-5 py-2 rounded-lg bg-black/30 hover:bg-black/50 backdrop-blur-md text-white/90 text-sm font-medium transition-all border border-white/10 z-50 hover:text-white"
      >
        Skip
      </button>
      
      {/* Content Container */}
      <div className="relative z-10 flex flex-col h-full w-full px-8 sm:px-16 pt-8 pb-8 justify-between">
        <div className="flex-1 flex items-center max-w-3xl">
          <div key={step} className="animate-in fade-in slide-in-from-left-4 duration-500 w-full">
            {/* Main Typography */}
            <h1 className="text-[2.75rem] sm:text-[3.25rem] leading-[1.1] font-bold text-white mb-4 tracking-tight">
              {currentSlide.title}
            </h1>
            
            {/* Small Yellow Line */}
            <div className="w-12 h-[3px] bg-gradient-to-r from-[#facc15] to-[#facc15]/30 rounded-full mb-5"></div>
            
            {/* Description Paragraph */}
            <div className="text-base sm:text-lg text-white/70 mb-6 leading-relaxed max-w-md">
              {currentSlide.desc}
            </div>
            
            {/* Features List */}
            <div className="flex flex-col gap-4 mb-6">
              {currentSlide.features.map((f, i) => (
                <div key={i} className="flex items-center gap-5">
                  {step === 5 ? (
                    <div className="w-6 h-6 flex items-center justify-center shrink-0">
                      {f.icon}
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
                      {f.icon}
                    </div>
                  )}
                  <div>
                    <h3 className={`text-white font-semibold ${step === 5 ? 'text-lg' : 'text-[1.1rem] mb-0.5'}`}>{f.title}</h3>
                    {f.desc && <p className="text-white/50 text-[0.95rem]">{f.desc}</p>}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Action Buttons */}
            {step === 0 ? (
              <div className="flex flex-col items-start gap-4 mt-2">
                <button onClick={nextStep} className="flex items-center justify-between w-[340px] bg-[#facc15] hover:bg-[#fbbf24] text-black font-semibold py-4 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-yellow-500/20 group">
                  <div className="flex items-center gap-4">
                    <GraduationCap className="w-6 h-6 opacity-80" strokeWidth={2.5} />
                    <span className="text-lg tracking-wide">Learn Photo Editing</span>
                  </div>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button onClick={handleComplete} className="text-white/50 hover:text-white transition-colors text-[0.95rem] font-medium relative group">
                  Skip welcome tour
                  <span className="absolute -bottom-1 left-0 w-full h-[1px] bg-white/20 group-hover:bg-[#facc15] transition-colors"></span>
                </button>
              </div>
            ) : step === 5 ? (
              <div className="flex items-center gap-4 mt-4">
                <button onClick={prevStep} className="px-6 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors border border-white/10">
                  Back
                </button>
                <button onClick={handleComplete} className="flex items-center justify-between w-[280px] bg-[#facc15] hover:bg-[#fbbf24] text-black font-semibold py-4 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-yellow-500/20 group">
                  <span className="text-lg tracking-wide">Start Editing</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4 mt-4">
                <button onClick={prevStep} className="px-6 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors border border-white/10">
                  Back
                </button>
                <button onClick={nextStep} className="flex items-center justify-center gap-2 w-32 bg-[#facc15] hover:bg-[#fbbf24] text-black font-semibold py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-yellow-500/20 group">
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Visual Container */}
        {currentSlide.rightVisual}
        
      </div>
      
      {/* Bottom Pagination Dots */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-3 z-10">
        {[0, 1, 2, 3, 4, 5].map(idx => (
          <button 
            key={idx} 
            onClick={() => setStep(idx)}
            className={`h-2 rounded-full transition-all duration-300 hover:bg-white/50 cursor-pointer ${
              step === idx 
                ? 'w-6 bg-[#facc15] shadow-[0_0_10px_rgba(250,204,21,0.5)] hover:bg-[#facc15]' 
                : 'w-2 bg-white/30'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
