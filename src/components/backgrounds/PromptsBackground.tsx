
export default function PromptsBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-neutral-950 pointer-events-none">
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(234, 179, 8, 0.3)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>
        
        {/* Connection Links */}
        <line x1="60%" y1="30%" x2="75%" y2="50%" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
        <line x1="75%" y1="50%" x2="90%" y2="40%" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
        <line x1="75%" y1="50%" x2="70%" y2="70%" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
        <line x1="70%" y1="70%" x2="55%" y2="60%" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
        <line x1="60%" y1="30%" x2="55%" y2="60%" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />

        {/* Floating AI Nodes */}
        <circle cx="60%" cy="30%" r="80" fill="url(#nodeGlow)" />
        <circle cx="60%" cy="30%" r="4" fill="rgba(234, 179, 8, 0.8)" />
        <circle cx="60%" cy="30%" r="20" fill="none" stroke="rgba(234, 179, 8, 0.2)" strokeWidth="1" strokeDasharray="2,2"/>
        
        <circle cx="75%" cy="50%" r="120" fill="url(#nodeGlow)" />
        <circle cx="75%" cy="50%" r="6" fill="rgba(234, 179, 8, 0.9)" />
        <circle cx="75%" cy="50%" r="16" fill="none" stroke="rgba(234, 179, 8, 0.3)" strokeWidth="1" />

        <circle cx="90%" cy="40%" r="60" fill="url(#nodeGlow)" />
        <circle cx="90%" cy="40%" r="3" fill="rgba(255, 255, 255, 0.5)" />

        <circle cx="70%" cy="70%" r="100" fill="url(#nodeGlow)" />
        <circle cx="70%" cy="70%" r="5" fill="rgba(234, 179, 8, 0.6)" />

        <circle cx="55%" cy="60%" r="70" fill="url(#nodeGlow)" />
        <circle cx="55%" cy="60%" r="3" fill="rgba(255, 255, 255, 0.4)" />
      </svg>
    </div>
  );
}
