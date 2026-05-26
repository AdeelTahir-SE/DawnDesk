import React from 'react';

export default function OnboardingBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-neutral-950 pointer-events-none">
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0a0a0a" />
            <stop offset="60%" stopColor="#111111" />
            <stop offset="100%" stopColor="#251f11" />
          </linearGradient>
          <radialGradient id="sun" cx="50%" cy="80%" r="50%">
            <stop offset="0%" stopColor="rgba(234, 179, 8, 0.6)" />
            <stop offset="40%" stopColor="rgba(234, 179, 8, 0.1)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>
        {/* Sky Background */}
        <rect width="100%" height="100%" fill="url(#sky)" />
        
        {/* Sun Aura */}
        <circle cx="50%" cy="80%" r="70%" fill="url(#sun)" />
        <circle cx="50%" cy="80%" r="20%" fill="rgba(234, 179, 8, 0.1)" filter="blur(20px)"/>
        
        {/* Minimal Vector Horizon/Landscape */}
        <path d="M 0 75 C 400 60, 800 80, 1200 70 S 1800 85, 2000 75 L 2000 100 L 0 100 Z" transform="scale(1, 10)" fill="#0f0f0f" stroke="rgba(234,179,8,0.1)" strokeWidth="0.2" />
        <path d="M 0 85 C 500 75, 900 90, 1300 80 S 1900 95, 2000 85 L 2000 100 L 0 100 Z" transform="scale(1, 10)" fill="#080808" stroke="rgba(234,179,8,0.05)" strokeWidth="0.1" />
      </svg>
    </div>
  );
}
