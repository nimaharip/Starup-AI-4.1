import React from 'react';

interface LogoProps {
    className?: string;
    showTagline?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = "w-full", showTagline = true }) => {
    return (
        <div className={`flex flex-col items-center justify-center text-center ${className}`}>
            {/* SVG Logo Mark representing the AI Starup Emblem */}
            <svg 
                viewBox="0 0 360 180" 
                className="w-full max-w-[180px] h-auto drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]"
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="aiLogoGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8b5cf6" /> {/* Indigo / Purple */}
                        <stop offset="50%" stopColor="#3b82f6" /> {/* Electric Blue */}
                        <stop offset="100%" stopColor="#06b6d4" /> {/* Cyan / Teal */}
                    </linearGradient>
                    <linearGradient id="starLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#22d3ee" /> {/* Cyan */}
                        <stop offset="100%" stopColor="#60a5fa" /> {/* Sky Blue */}
                    </linearGradient>
                    <filter id="neonGlowLogo" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="6" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Left Leg & Arch of A */}
                <path 
                    d="M 60,150 L 145,35 C 151,26 160,20 170,20 L 180,20 C 185,20 188,24 186,29 L 105,150 C 103,153 99,155 95,155 L 72,155 C 65,155 61,147 64,152 Z" 
                    fill="url(#aiLogoGradient)" 
                />

                {/* Right Leg of A (Disconnected shape matching the dynamic composition) */}
                <path 
                    d="M 183,38 Q 194,58 206,78 L 240,128 C 244,134 250,138 258,138 L 285,138 C 291,138 294,132 291,127 L 210,38 Z" 
                    fill="url(#aiLogoGradient)" 
                    opacity="0.9"
                />

                {/* Stylized Slanted "i" Column */}
                <path 
                    d="M 270,75 L 296,120 C 298,124 296,130 291,130 L 268,130 C 263,130 259,127 257,122 L 236,83 C 234,79 237,74 242,74 L 263,74 C 267,74 269,74 270,75 Z" 
                    fill="url(#aiLogoGradient)" 
                />

                {/* Middle 'A' Sparkle (4-Point Star) */}
                <path 
                    d="M 160,78 Q 160,95 130,95 Q 160,95 160,112 Q 160,95 190,95 Q 160,95 160,78 Z" 
                    fill="url(#starLogoGradient)" 
                    filter="url(#neonGlowLogo)"
                />

                {/* 'i' Top Sparkle (Hovering above) */}
                <path 
                    d="M 285,30 Q 285,42 268,42 Q 285,42 285,54 Q 285,42 302,42 Q 285,42 285,30 Z" 
                    fill="url(#starLogoGradient)" 
                    filter="url(#neonGlowLogo)"
                />
            </svg>

            {/* Typography "AI STARUP" and Subtitle */}
            <h2 className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 font-['Orbitron'] mt-2 uppercase transition-all duration-300 hover:scale-105">
                AI Starup
            </h2>

            {showTagline && (
                <div className="flex items-center gap-2 mt-2 w-full max-w-[270px]">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-cyan-400/40"></div>
                    <span className="text-[10px] text-cyan-400 font-medium uppercase tracking-wider font-['Orbitron'] whitespace-nowrap">
                        BELAJAR AI • BANGUN MASA DEPAN
                    </span>
                    <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-cyan-400/40"></div>
                </div>
            )}
        </div>
    );
};

export default Logo;
