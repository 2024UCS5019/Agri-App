"use client";

import React, { useState, useEffect } from 'react';

interface AnimatedTractorLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2062';
  showGlow?: boolean;
  className?: string;
}

export const AnimatedTractorLogo: React.FC<AnimatedTractorLogoProps> = ({
  size = 'md',
  showGlow = true,
  className = '',
}) => {
  const sizeMap = {
    sm: { box: 38, tractor: 26 },
    md: { box: 48, tractor: 34 },
    lg: { box: 64, tractor: 46 },
    xl: { box: 100, tractor: 72 },
    '2062': { box: 130, tractor: 92 },
  };

  const { box, tractor } = sizeMap[size];

  return (
    <div
      style={{ width: `${box}px`, height: `${box}px` }}
      className={`relative rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 p-[2px] flex items-center justify-center shrink-0 ${
        showGlow ? 'animate-aura-glow' : ''
      } ${className}`}
    >
      <div className="w-full h-full bg-[#050811] rounded-[22px] flex items-center justify-center relative overflow-hidden">
        {/* Subtle radial cyber background glow */}
        <div className="absolute inset-0 bg-radial from-emerald-500/25 via-teal-500/10 to-transparent pointer-events-none" />

        {/* Laser scan line passing vertically */}
        <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent animate-laser-scan pointer-events-none z-20" />

        {/* Animated Tractor SVG */}
        <svg
          width={tractor}
          height={tractor}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10"
        >
          {/* Cyber Smoke / Exhaust energy puffs */}
          <circle cx="68" cy="18" r="3.2" fill="#34d399" className="animate-exhaust-1" />
          <circle cx="68" cy="18" r="2.6" fill="#38bdf8" className="animate-exhaust-2" />
          <circle cx="68" cy="18" r="2.0" fill="#a7f3d0" className="animate-exhaust-3" />

          {/* Tractor Chassis & Cabin (Engine Rumble vibration) */}
          <g className="animate-tractor-chug">
            {/* Exhaust Pipe / Chimney */}
            <rect x="66" y="20" width="4" height="22" rx="1.5" fill="#34d399" />
            <rect x="64.5" y="18" width="7" height="3" rx="1" fill="#38bdf8" />

            {/* Cabin Body */}
            <path
              d="M24 62 L32 30 L58 30 L62 62 Z"
              fill="#10b981"
              stroke="#6ee7b7"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />

            {/* Futuristic Cabin Window */}
            <path
              d="M36 54 L40 36 L54 36 L56 54 Z"
              fill="#064e3b"
              stroke="#38bdf8"
              strokeWidth="1.2"
            />
            {/* Window Hologram Reflection */}
            <line x1="42" y1="38" x2="40" y2="52" stroke="#a7f3d0" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />

            {/* Engine Hood */}
            <path
              d="M60 44 L86 44 C88 44 90 46 90 48 L90 62 L60 62 Z"
              fill="#10b981"
              stroke="#6ee7b7"
              strokeWidth="1.5"
            />

            {/* Front Headlight with Cyber Neon Glow */}
            <circle cx="89" cy="48" r="3.5" fill="#fef08a" />
            <polygon points="92,46 100,40 100,56 92,50" fill="url(#cyberHeadlightBeam)" opacity="0.75" />
          </g>

          {/* Big Rear Wheel with Rotating 2062 Hyper-Drive Spokes */}
          <g transform="translate(32, 68)">
            <circle cx="0" cy="0" r="18" fill="#047857" stroke="#ffffff" strokeWidth="3" />
            <circle cx="0" cy="0" r="9" fill="#064e3b" stroke="#38bdf8" strokeWidth="1" />
            {/* Spokes rotating */}
            <g className="animate-wheel-spin origin-center">
              <line x1="-16" y1="0" x2="16" y2="0" stroke="#a7f3d0" strokeWidth="1.8" />
              <line x1="0" y1="-16" x2="0" y2="16" stroke="#a7f3d0" strokeWidth="1.8" />
              <line x1="-11" y1="-11" x2="11" y2="11" stroke="#38bdf8" strokeWidth="1.4" />
              <line x1="-11" y1="11" x2="11" y2="-11" stroke="#38bdf8" strokeWidth="1.4" />
            </g>
            <circle cx="0" cy="0" r="4.5" fill="#facc15" />
          </g>

          {/* Small Front Wheel with Rotating Spokes */}
          <g transform="translate(80, 72)">
            <circle cx="0" cy="0" r="12" fill="#047857" stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="0" cy="0" r="6" fill="#064e3b" stroke="#38bdf8" strokeWidth="1" />
            {/* Spokes rotating */}
            <g className="animate-wheel-spin origin-center">
              <line x1="-10" y1="0" x2="10" y2="0" stroke="#a7f3d0" strokeWidth="1.4" />
              <line x1="0" y1="-10" x2="0" y2="10" stroke="#a7f3d0" strokeWidth="1.4" />
            </g>
            <circle cx="0" cy="0" r="3.2" fill="#facc15" />
          </g>

          {/* Gradient definitions */}
          <defs>
            <linearGradient id="cyberHeadlightBeam" x1="92" y1="48" x2="100" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};

/**
 * 2062 Trend Futuristic Launch Splash Screen
 * Automatically shows on app open with futuristic holographic HUD rings,
 * animated tractor emblem, and glowing "Agri App" text ONLY.
 * Smoothly transitions out after ~1.3s or instantly on tap.
 */
export const AppSplashScreen: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFading(true);
      setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 450); // 450ms silky smooth fade transition
    }, 1300); // 1.3s display duration for 2062 futuristic launch

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      onClick={() => {
        setFading(true);
        setTimeout(() => setVisible(false), 200);
      }}
      className={`fixed inset-0 z-[9999] bg-[#04070e] flex flex-col items-center justify-center p-6 select-none transition-opacity duration-450 cursor-pointer overflow-hidden ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      title="Tap anywhere to skip"
    >
      {/* Background Deep Space Ambient Nebula */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-gradient-to-tr from-emerald-500/20 via-teal-500/15 to-cyan-500/20 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[280px] h-[280px] bg-emerald-400/25 rounded-full blur-[70px] pointer-events-none animate-pulse" />

      {/* 2062 Holographic Central Chamber */}
      <div className="relative mb-8 flex items-center justify-center animate-cyber-float">
        {/* Outer Orbital Ring 1: Clockwise dashed cyan HUD */}
        <div className="absolute w-[240px] h-[240px] rounded-full border border-dashed border-cyan-400/35 animate-hud-cw pointer-events-none" />
        
        {/* Outer Orbital Ring 2: Counter-Clockwise dotted emerald HUD */}
        <div className="absolute w-[205px] h-[205px] rounded-full border border-dotted border-emerald-400/40 animate-hud-ccw pointer-events-none" />

        {/* Outer Ping Radar Wave */}
        <div className="absolute w-[170px] h-[170px] rounded-full border border-emerald-400/40 animate-ping opacity-35 pointer-events-none [animation-duration:3s]" />

        {/* Orbital HUD Telemetry Nodes */}
        <div className="absolute w-[240px] h-[240px] animate-hud-cw pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
        </div>

        {/* 2062 Center Animated Tractor Logo Hero */}
        <div className="relative z-10 drop-shadow-[0_0_35px_rgba(16,185,129,0.5)]">
          <AnimatedTractorLogo size="2062" showGlow={true} />
        </div>
      </div>

      {/* Brand Title: "Agri App" ONLY (2062 Neon Hologram Typography) */}
      <div className="relative z-10 text-center mb-6">
        <h1 className="font-sora font-black text-3xl sm:text-4xl tracking-tight text-white flex items-center justify-center">
          <span className="bg-gradient-to-r from-emerald-400 via-teal-200 to-cyan-400 bg-clip-text text-transparent animate-text-neon select-none">
            Agri App
          </span>
        </h1>
      </div>

      {/* 2062 Futuristic Laser Charge Line */}
      <div className="relative z-10 w-44 h-1 bg-white/10 rounded-full overflow-hidden border border-white/5">
        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 via-teal-300 to-cyan-400 rounded-full w-full animate-[progress_1.2s_cubic-bezier(0.4,0,0.2,1)_infinite]" />
      </div>
    </div>
  );
};
