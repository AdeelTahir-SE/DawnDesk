import { useState, useEffect } from "react";
import { 
  Film, Wand2, Layers, ArrowRight, Video, Scissors, Gauge, Diamond, 
  Sparkles, Type, Music, FolderKanban, Save, Download,
  PlaySquare, Lightbulb, Image as LucideImage, Check, Play, ChevronRight, CheckSquare
} from "lucide-react";
import bgNightSky from "../../assets/bg-night-sky.png";
import bgOcean from "../../assets/bg-ocean.png";
import bgForest from "../../assets/bg-forest.png";

const VIDEO_EDITOR_ONBOARDING_KEY = "onboarded_video-editor-v1";

export default function VideoEditorOnboarding({ children }: { children: React.ReactNode }) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);

  const bgImages = [bgNightSky, bgOcean, bgForest];
  const currentBg = bgImages[step % bgImages.length];

  useEffect(() => {
    const hasOnboarded = localStorage.getItem(VIDEO_EDITOR_ONBOARDING_KEY);
    if (!hasOnboarded) {
      setShowOnboarding(true);
    }
    setLoading(false);
  }, []);

  const handleComplete = () => {
    localStorage.setItem(VIDEO_EDITOR_ONBOARDING_KEY, "true");
    setShowOnboarding(false);
  };

  const nextStep = () => setStep(s => Math.min(5, s + 1));
  const prevStep = () => setStep(s => Math.max(0, s - 1));

  if (loading) return null;
  if (!showOnboarding) {
    return <>{children}</>;
  }

  // Right visual for Step 1 (Editing Tools)
  const EditingToolsVisual = () => (
    <div className="absolute right-12 top-1/2 -translate-y-1/2 w-[500px] h-[380px] bg-neutral-900/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-700">
      {/* Top Bar */}
      <div className="h-10 bg-black/40 border-b border-white/5 flex items-center px-4 justify-between">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
        </div>
        <div className="text-[10px] text-white/40 font-medium">DawnDesk</div>
        <div className="flex items-center gap-3">
          <div className="text-[9px] text-white/40">16:9</div>
          <div className="bg-[#facc15] text-black text-[9px] font-bold px-3 py-1 rounded">Export</div>
        </div>
      </div>
      
      <div className="flex flex-1">
        {/* Left Toolbar */}
        <div className="w-10 bg-black/20 border-r border-white/5 flex flex-col items-center py-3 gap-4 text-white/30">
          <Scissors size={14} />
          <Type size={14} />
          <Sparkles size={14} />
          <Music size={14} />
          <Layers size={14} />
        </div>
        
        {/* Main Area */}
        <div className="flex-1 flex flex-col p-3 gap-3">
          {/* Video Preview */}
          <div className="flex-1 rounded-lg bg-cover bg-center border border-white/5 relative" style={{backgroundImage: `url(${currentBg})`}}>
            {/* Playback Controls Overlay */}
            <div className="absolute bottom-2 left-0 right-0 flex items-center justify-between px-4">
              <div className="text-[9px] font-mono text-white/70">00:00:18:15</div>
              <div className="flex items-center gap-2 text-white/80">
                <Play size={12} fill="currentColor" />
              </div>
              <div className="text-[9px] text-white/30">HD</div>
            </div>
          </div>
          
          {/* Timeline */}
          <div className="h-28 bg-black/30 rounded-lg border border-white/5 p-2 relative overflow-hidden">
            {/* Playhead */}
            <div className="absolute left-1/3 top-0 bottom-0 w-[1px] bg-[#facc15] z-10 flex flex-col items-center">
              <div className="w-2 h-2 rounded-full bg-[#facc15] -mt-1"></div>
            </div>
            
            <div className="flex text-[8px] text-white/30 justify-between mb-2 px-1">
              <span>00:00</span><span>00:05</span><span>00:10</span><span>00:15</span><span>00:20</span>
            </div>
            
            {/* Tracks */}
            <div className="flex flex-col gap-1.5 relative">
              <div className="h-6 w-full flex items-center">
                <div className="h-5 w-2/3 bg-indigo-500/30 border border-indigo-500/50 rounded flex items-center px-2 text-[8px] text-indigo-200 truncate">
                  <Video size={8} className="mr-1 inline"/> Travel_01.mp4
                </div>
                <div className="h-5 w-1/4 bg-indigo-500/30 border border-indigo-500/50 rounded ml-1 flex items-center px-2 text-[8px] text-indigo-200 truncate">
                  Mountains.mp4
                </div>
              </div>
              
              <div className="h-6 w-full flex items-center">
                <div className="h-5 w-3/4 bg-emerald-500/30 border border-emerald-500/50 rounded ml-4 flex items-center px-2 text-[8px] text-emerald-200 truncate">
                  <Music size={8} className="mr-1 inline"/> Background Music.mp3
                </div>
              </div>

              <div className="h-6 w-full flex items-center">
                <div className="h-5 w-1/3 bg-purple-500/30 border border-purple-500/50 rounded ml-24 flex items-center px-2 text-[8px] text-purple-200 truncate">
                  <Type size={8} className="mr-1 inline"/> Text Animation
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Right visual for Step 2 (Effects & Transitions)
  const EffectsVisual = () => (
    <div className="absolute right-12 top-1/2 -translate-y-1/2 w-[520px] flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700">
      {/* Video Preview */}
      <div className="w-full h-64 rounded-2xl border border-white/10 shadow-2xl bg-cover bg-center relative group" style={{backgroundImage: `url(${currentBg})`, filter: 'brightness(0.9) contrast(1.1) saturate(1.2)'}}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-[#facc15]/90 flex items-center justify-center text-black group-hover:scale-110 transition-transform shadow-lg shadow-yellow-500/20">
            <Play size={20} fill="currentColor" className="ml-1"/>
          </div>
        </div>
      </div>
      
      {/* Transitions Panel */}
      <div className="w-full bg-neutral-900/90 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-2xl">
        <div className="flex gap-5 mb-4 text-[11px] font-medium text-white/50 border-b border-white/5 pb-3">
          <span className="text-white border-b-2 border-[#facc15] pb-3 -mb-[13px]">Transitions</span>
          <span className="hover:text-white cursor-pointer">Filters</span>
          <span className="hover:text-white cursor-pointer">Overlays</span>
          <span className="hover:text-white cursor-pointer">LUTs</span>
        </div>
        <div className="flex gap-3 overflow-hidden">
          <div className="flex flex-col items-center gap-2">
            <div className="w-[72px] aspect-video rounded-lg bg-black border border-white/10 flex items-center justify-center text-white/30">
              <span className="text-xs">✕</span>
            </div>
            <span className="text-[10px] font-medium text-white/50">None</span>
          </div>
          {['Fade', 'Slide', 'Zoom', 'Push', 'Wipe'].map((f, i) => (
            <div key={f} className="flex flex-col items-center gap-2 flex-1">
              <div className={`w-full aspect-video rounded-lg bg-cover bg-center border-2 transition-colors ${i === 2 ? 'border-[#facc15]' : 'border-transparent opacity-80'}`} style={{backgroundImage: `url(${currentBg})`}}></div>
              <span className={`text-[10px] font-medium ${i === 2 ? 'text-[#facc15]' : 'text-white/70'}`}>{f}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Right visual for Step 3 (Organize. Manage. Sync.)
  const SyncVisual = () => (
    <div className="absolute right-16 top-1/2 -translate-y-1/2 w-full max-w-[500px] h-full max-h-[450px] animate-in fade-in zoom-in duration-700">
      <div className="absolute left-0 top-10 w-64 bg-neutral-900/90 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-2xl z-20">
        <div className="flex justify-between items-center mb-5">
          <span className="text-sm font-semibold text-white">Projects</span>
          <span className="text-[10px] font-medium bg-white/10 px-3 py-1 rounded-full text-white hover:bg-white/20 cursor-pointer">New Project</span>
        </div>
        {[
          { name: 'Travel Vlog', time: 'Updated 2m ago' },
          { name: 'Cinematic Short Film', time: 'Updated yesterday' },
          { name: 'Wedding Highlights', time: 'Updated 3d ago' },
          { name: 'Product Promo', time: 'Updated 5d ago' }
        ].map((p, i) => (
          <div key={p.name} className="flex items-center gap-3 mb-4 last:mb-0 group cursor-pointer">
            <div className="w-12 h-8 rounded bg-cover bg-center" style={{backgroundImage: `url(${bgImages[i % bgImages.length]})`, filter: `hue-rotate(${i * 60}deg)`}}></div>
            <div className="flex-1">
              <div className="text-xs font-medium text-white/90 group-hover:text-white">{p.name}</div>
              <div className="text-[9px] text-white/50">{p.time}</div>
            </div>
            <ChevronRight size={14} className="text-white/30 group-hover:text-white/70 transition-colors" />
          </div>
        ))}
      </div>
      
      <div className="absolute right-0 top-0 w-32 h-32 flex flex-col items-center justify-center z-30">
        <div className="w-16 h-16 rounded-2xl border-2 border-[#facc15]/30 flex items-center justify-center bg-neutral-900/80 backdrop-blur-md mb-2 shadow-[0_0_30px_rgba(250,204,21,0.15)]">
          <Save size={28} className="text-[#facc15]" />
        </div>
      </div>

      <div className="absolute right-0 bottom-10 w-48 bg-neutral-900/90 backdrop-blur-xl rounded-xl border border-white/10 p-2 shadow-2xl z-20 grid grid-cols-2 gap-2">
        <div className="aspect-video rounded bg-cover bg-center border border-white/5" style={{backgroundImage: `url(${currentBg})`, filter: 'hue-rotate(30deg)'}}></div>
        <div className="aspect-video rounded bg-cover bg-center border border-white/5" style={{backgroundImage: `url(${currentBg})`, filter: 'hue-rotate(90deg)'}}></div>
        <div className="aspect-video rounded bg-cover bg-center border border-white/5" style={{backgroundImage: `url(${currentBg})`, filter: 'hue-rotate(150deg)'}}></div>
        <div className="aspect-video rounded bg-cover bg-center border border-white/5" style={{backgroundImage: `url(${currentBg})`, filter: 'hue-rotate(210deg)'}}></div>
      </div>
      
      {/* Background abstract connection line */}
      <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none opacity-40" overflow="visible">
        <path d="M 250 150 C 350 150 400 100 430 110" fill="none" stroke="#facc15" strokeWidth="1" strokeDasharray="4 4" />
        <path d="M 250 220 C 350 220 380 300 400 320" fill="none" stroke="#facc15" strokeWidth="1" strokeDasharray="4 4" />
        <circle cx="250" cy="150" r="3" fill="#facc15" />
        <circle cx="430" cy="110" r="3" fill="#facc15" />
        <circle cx="250" cy="220" r="3" fill="#facc15" />
        <circle cx="400" cy="320" r="3" fill="#facc15" />
      </svg>
    </div>
  );

  // Right visual for Step 4 (Learn)
  const LearnVisual = () => (
    <div className="absolute right-24 top-1/2 -translate-y-1/2 w-[340px] bg-neutral-900/90 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-2xl animate-in fade-in slide-in-from-right-10 duration-700">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-semibold text-white">Learn</span>
        <ChevronRight size={14} className="text-white/40" />
      </div>
      <div className="flex gap-5 text-[11px] font-medium text-white/50 mb-4 border-b border-white/5 pb-2">
        <span className="text-[#facc15] border-b-2 border-[#facc15] pb-2 -mb-[9px]">Tutorials</span>
        <span className="hover:text-white cursor-pointer">Tips</span>
        <span className="hover:text-white cursor-pointer">Inspiration</span>
      </div>
      
      <div className="w-full h-40 rounded-xl bg-cover bg-center relative mb-4 shadow-inner group cursor-pointer transition-all duration-700" style={{backgroundImage: `url(${currentBg})`}}>
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors rounded-xl"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 transition-transform">
            <Play size={20} fill="currentColor" className="ml-1"/>
          </div>
        </div>
      </div>
      
      <div className="text-sm text-white font-semibold mb-1">Cinematic Color Grading</div>
      <div className="flex justify-between items-center text-[11px] text-white/50 mb-6">
        <span>Make your videos pop</span>
        <span>12 min</span>
      </div>
      
      <div className="text-xs text-white font-medium mb-3">More Tutorials</div>
      {[
        { title: 'Smooth Transitions', time: '8 min' },
        { title: 'Text Animation Basics', time: '6 min' }
      ].map((t, i) => (
        <div key={t.title} className="flex items-center gap-3 mb-3 last:mb-0 cursor-pointer group">
          <div className="w-16 h-10 rounded-lg bg-cover bg-center" style={{backgroundImage: `url(${bgImages[(i+1) % bgImages.length]})`, filter: i === 0 ? 'hue-rotate(90deg)' : 'hue-rotate(-45deg)'}}></div>
          <div className="flex-1">
            <div className="text-[11px] font-medium text-white/80 group-hover:text-white">{t.title}</div>
            <div className="flex items-center gap-1 text-[9px] text-white/40 mt-0.5">
              <PlaySquare size={8} /> {t.time}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const slides = [
    // Slide 0: Welcome
    {
      title: <><span className="text-white">Welcome to</span><br/><span className="text-[#facc15]">Video Editor</span></>,
      desc: <><p className="font-semibold text-white mb-1">Import. Edit. Export.</p><p>Build video projects with a timeline,<br/>media bin, effects, text, audio tools,<br/>and export presets.</p></>,
      features: [
        { icon: <Wand2 className="w-5 h-5 text-[#facc15]" />, title: "Editing Tools", desc: "Trim, split, arrange, and tune clips" },
        { icon: <Film className="w-5 h-5 text-[#facc15]" />, title: "Effects & Transitions", desc: "Use built-in effects, transitions, and color controls" },
        { icon: <Layers className="w-5 h-5 text-[#facc15]" />, title: "Timeline Workflow", desc: "Work with tracks, media, text, and audio" }
      ],
      rightVisual: null
    },
    // Slide 1: Editing Tools
    {
      title: <><span className="text-white">Powerful</span><br/><span className="text-[#facc15]">Editing Tools</span></>,
      desc: <p>Trim, cut, split, and arrange your clips<br/>with precision. Everything you need<br/>for professional editing.</p>,
      features: [
        { icon: <Scissors className="w-5 h-5 text-[#facc15]" />, title: "Precision Editing", desc: "Frame-accurate control" },
        { icon: <Gauge className="w-5 h-5 text-[#facc15]" />, title: "Speed & Motion Control", desc: "Create slow motion or speed ramps" },
        { icon: <Diamond className="w-5 h-5 text-[#facc15]" />, title: "Clip Controls", desc: "Adjust clip properties in the editor panels" }
      ],
      rightVisual: <EditingToolsVisual />
    },
    // Slide 2: Effects
    {
      title: <><span className="text-white">Stunning</span><br/><span className="text-[#facc15]">Effects & Transitions</span></>,
      desc: <p>Enhance your videos with professional<br/>effects, smooth transitions, and creative<br/>visuals that stand out.</p>,
      features: [
        { icon: <Wand2 className="w-5 h-5 text-[#facc15]" />, title: "Creative Transitions", desc: "Cinematic & smooth" },
        { icon: <Sparkles className="w-5 h-5 text-[#facc15]" />, title: "Visual Effects", desc: "Filters, overlays & LUTs" },
        { icon: <Type className="w-5 h-5 text-[#facc15]" />, title: "Text & Titles", desc: "Stylish titles and animations" },
        { icon: <Music className="w-5 h-5 text-[#facc15]" />, title: "Audio Effects", desc: "Music, sound effects & more" }
      ],
      rightVisual: <EffectsVisual />
    },
    // Slide 3: Organize
    {
      title: <><span className="text-white">Organize.</span><br/><span className="text-[#facc15]">Save. Export.</span></>,
      desc: <p>Keep media in the bin, save project<br/>files, and export finished videos<br/>through DawnDesk.</p>,
      features: [
        { icon: <FolderKanban className="w-5 h-5 text-[#facc15]" />, title: "Project Files", desc: "Save and load DawnDesk video projects" },
        { icon: <Save className="w-5 h-5 text-[#facc15]" />, title: "Manual Saves", desc: "Keep project state in a .ddvp file" },
        { icon: <Download className="w-5 h-5 text-[#facc15]" />, title: "Media Import", desc: "Import media and prepare exports" }
      ],
      rightVisual: <SyncVisual />
    },
    // Slide 4: Learn
    {
      title: <><span className="text-white">Learn.</span><br/><span className="text-[#facc15]">Create. Grow.</span></>,
      desc: <p>Use the built-in panels to work with<br/>media, properties, effects, transitions,<br/>audio, text, masks, and color.</p>,
      features: [
        { icon: <PlaySquare className="w-5 h-5 text-[#facc15]" />, title: "Preview & Timeline", desc: "Review edits while building the sequence" },
        { icon: <Lightbulb className="w-5 h-5 text-[#facc15]" />, title: "Editor Panels", desc: "Use focused panels for common editing tasks" },
        { icon: <LucideImage className="w-5 h-5 text-[#facc15]" />, title: "Export Presets", desc: "Choose output settings before rendering" }
      ],
      rightVisual: <LearnVisual />
    },
    // Slide 5: All Set
    {
      title: <><span className="text-white">You're</span> <span className="text-[#facc15]">All Set!</span></>,
      desc: <p>Everything is ready. Start creating<br/>amazing videos with DawnDesk<br/>Video Editor.</p>,
      features: [
        { icon: <Check className="w-5 h-5 text-[#facc15]" />, title: "Import media", desc: "" },
        { icon: <Check className="w-5 h-5 text-[#facc15]" />, title: "Edit on the timeline", desc: "" },
        { icon: <Check className="w-5 h-5 text-[#facc15]" />, title: "Export your video", desc: "" }
      ],
      rightVisual: null
    }
  ];

  const currentSlide = slides[step];

  return (
    <div className="relative z-[100] w-full h-full min-h-[calc(100vh-4rem)] overflow-hidden bg-black flex font-sans select-none animate-fadeIn duration-500">
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
            <h1 className="text-[2.5rem] sm:text-[3rem] leading-[1.1] font-bold text-white mb-3 tracking-tight mt-4">
              {currentSlide.title}
            </h1>
            
            {/* Small Yellow Line */}
            <div className="w-12 h-[3px] bg-gradient-to-r from-[#facc15] to-[#facc15]/30 rounded-full mb-4"></div>
            
            {/* Description Paragraph */}
            <div className="text-base sm:text-[1.05rem] text-white/70 mb-4 leading-relaxed max-w-md">
              {currentSlide.desc}
            </div>
            
            {/* Features List */}
            <div className="flex flex-col gap-3 mb-4">
              {currentSlide.features.map((f, i) => (
                <div key={i} className="flex items-center gap-4">
                  {step === 5 ? (
                    <div className="w-6 h-6 flex items-center justify-center shrink-0">
                      {f.icon}
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
                      {f.icon}
                    </div>
                  )}
                  <div>
                    <h3 className={`text-white font-semibold ${step === 5 ? 'text-lg' : 'text-base mb-0.5'}`}>{f.title}</h3>
                    {f.desc && <p className="text-white/50 text-sm">{f.desc}</p>}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Action Buttons */}
            {step === 0 ? (
              <div className="flex flex-col items-start gap-4 mt-1">
                <button onClick={nextStep} className="flex items-center justify-between w-[340px] bg-[#facc15] hover:bg-[#fbbf24] text-black font-semibold py-4 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-yellow-500/20 group">
                  <div className="flex items-center gap-4">
                    <CheckSquare className="w-6 h-6 opacity-80" strokeWidth={2.5} />
                    <span className="text-lg tracking-wide">Start Editing</span>
                  </div>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ) : step === 5 ? (
              <div className="flex items-center gap-4 mt-2">
                <button onClick={prevStep} className="px-6 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors border border-white/10">
                  Back
                </button>
                <button onClick={handleComplete} className="flex items-center justify-between w-[280px] bg-[#facc15] hover:bg-[#fbbf24] text-black font-semibold py-4 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-yellow-500/20 group">
                  <span className="text-lg tracking-wide">Start Editing</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4 mt-2">
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
