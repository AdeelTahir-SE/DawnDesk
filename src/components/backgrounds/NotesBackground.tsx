
export default function NotesBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-neutral-950 pointer-events-none">
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="notesGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(234, 179, 8, 0.15)" />
            <stop offset="50%" stopColor="rgba(234, 179, 8, 0.05)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>
          <filter id="blur">
            <feGaussianBlur stdDeviation="40" />
          </filter>
        </defs>
        
        <rect width="100%" height="100%" fill="url(#notesGlow)" filter="url(#blur)" />
        
        {/* Notebook-like lines */}
        <pattern id="lines" width="100" height="40" patternUnits="userSpaceOnUse">
          <line x1="0" y1="39" x2="100" y2="39" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#lines)" />
        
        {/* Abstract "Brain/Graph" nodes */}
        <circle cx="70%" cy="40%" r="4" fill="rgba(234, 179, 8, 0.8)" />
        <circle cx="80%" cy="20%" r="6" fill="rgba(234, 179, 8, 0.5)" />
        <circle cx="60%" cy="70%" r="3" fill="rgba(255, 255, 255, 0.3)" />
        
        <path d="M 70% 40% Q 75% 30% 80% 20%" fill="none" stroke="rgba(234, 179, 8, 0.2)" strokeWidth="2" strokeDasharray="4 4" />
        <path d="M 70% 40% Q 65% 55% 60% 70%" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" />
      </svg>
    </div>
  );
}
