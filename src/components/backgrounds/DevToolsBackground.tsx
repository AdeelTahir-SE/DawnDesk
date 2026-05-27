
export default function DevToolsBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-neutral-950 pointer-events-none">
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="codeGrid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#codeGrid)" />
        
        {/* Terminal/Code Blocks abstract representation */}
        <g transform="translate(0, -20)">
          <rect x="50%" y="20%" width="300" height="200" rx="8" fill="rgba(20,20,20,0.8)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <circle cx="calc(50% + 20px)" cy="calc(20% + 20px)" r="5" fill="#ef4444" />
          <circle cx="calc(50% + 40px)" cy="calc(20% + 20px)" r="5" fill="#eab308" />
          <circle cx="calc(50% + 60px)" cy="calc(20% + 20px)" r="5" fill="#22c55e" />
          
          <rect x="calc(50% + 20px)" y="calc(20% + 50px)" width="150" height="6" rx="3" fill="rgba(255,255,255,0.2)" />
          <rect x="calc(50% + 20px)" y="calc(20% + 70px)" width="200" height="6" rx="3" fill="rgba(234, 179, 8, 0.4)" />
          <rect x="calc(50% + 20px)" y="calc(20% + 90px)" width="120" height="6" rx="3" fill="rgba(255,255,255,0.1)" />
        </g>
      </svg>
    </div>
  );
}
