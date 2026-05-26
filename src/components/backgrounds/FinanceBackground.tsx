import React from 'react';

export default function FinanceBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-neutral-950 pointer-events-none">
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="greenGlow" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(34, 197, 94, 0.05)" />
            <stop offset="100%" stopColor="rgba(234, 179, 8, 0.15)" />
          </linearGradient>
        </defs>
        
        {/* Background Mesh */}
        <path d="M 0 1000 C 300 800, 600 900, 900 600 S 1400 700, 2000 400 L 2000 1000 Z" fill="url(#greenGlow)" opacity="0.6" />
        
        {/* Financial Trend Lines */}
        <path d="M 0 800 C 400 900, 700 600, 1000 500 S 1500 600, 2000 200" fill="none" stroke="rgba(234, 179, 8, 0.3)" strokeWidth="3" />
        <path d="M 0 900 C 300 700, 800 800, 1100 600 S 1600 400, 2000 300" fill="none" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="2" strokeDasharray="5,5" />
        
        {/* Grid dots */}
        <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.05)"/>
        </pattern>
        <rect x="0" y="0" width="100%" height="100%" fill="url(#dots)" />
      </svg>
    </div>
  );
}
