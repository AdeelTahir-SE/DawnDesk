import React from 'react';

export default function ProjectBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-neutral-950 pointer-events-none">
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          </pattern>
          <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(234, 179, 8, 0.15)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <circle cx="80%" cy="30%" r="400" fill="url(#glow)" filter="blur(60px)" opacity="0.6" />
        
        {/* Abstract Kanban blocks */}
        <g transform="translate(0, -50)">
          <rect x="60%" y="20%" width="120" height="80" rx="12" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" />
          <rect x="60%" y="35%" width="120" height="140" rx="12" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" />
          <rect x="75%" y="25%" width="120" height="100" rx="12" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" />
          <rect x="75%" y="45%" width="120" height="60" rx="12" fill="rgba(234, 179, 8, 0.05)" stroke="rgba(234, 179, 8, 0.2)" />
          <rect x="90%" y="30%" width="120" height="110" rx="12" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" />
        </g>
      </svg>
    </div>
  );
}
