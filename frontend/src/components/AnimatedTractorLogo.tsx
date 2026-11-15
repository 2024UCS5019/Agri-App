"use client";

import React, { useState, useEffect } from 'react';

interface AnimatedTractorLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showGlow?: boolean;
  className?: string;
}

export const AnimatedTractorLogo: React.FC<AnimatedTractorLogoProps> = ({
  size = 'md',
  showGlow = true,
  className = '',
}) => {
  const sizeMap = {
    sm: { box: 36, tractor: 26 },
    md: { box: 48, tractor: 34 },
    lg: { box: 64, tractor: 46 },
    xl: { box: 100, tractor: 72 },
  };

  const { box, tractor } = sizeMap[size];

  return (
    <div
      style={{ width: `${box}px`, height: `${box}px` }}
      className={`relative rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-[2px] flex items-center justify-center shrink-0 ${
        showGlow ? 'animate-aura-glow' : ''
      } ${className}`}
    >
      <div className="w-full h-full bg-[#080c14] rounded-[14px] flex items-center justify-center relative overflow-hidden">
        {/* Subtle radial background glow */}
        <div className="absolute inset-0 bg-radial from-emerald-500/20 via-transparent to-transparent pointer-events-none" />

        {/* Animated Tractor SVG */}
        <svg
          width={tractor}
          height={tractor}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10"
        >
          {/* Smoke Puffs from Exhaust */}
          <circle cx="68" cy="18" r="3" fill="#10b981" className="animate-exhaust-1" />
          <circle cx="68" cy="18" r="2.5" fill="#34d399" className="animate-exhaust-2" />
          <circle cx="68" cy="18" r="2" fill="#6ee7b7" className="animate-exhaust-3" />

          {/* Tractor Chassis & Cabin (Subtle Engine Rumble) */}
          <g className="animate-tractor-chug">
            {/* Exhaust Pipe */}
            <rect x="66" y="20" width="4" height="22" rx="1.5" fill="#34d399" />
            <rect x="64.5" y="18" width="7" height="3" rx="1" fill="#6ee7b7" />

            {/* Cabin Body */}
            <path
              d="M24 62 L32 30 L58 30 L62 62 Z"
              fill="#10b981"
              stroke="#34d399"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />

            {/* Cabin Window Glass */}
            <path
              d="M36 54 L40 36 L54 36 L56 54 Z"
              fill="#064e3b"
              stroke="#6ee7b7"
              strokeWidth="1"
            />
            {/* Window Highlight reflection */}
            <line x1="42" y1="38" x2="40" y2="52" stroke="#a7f3d0" strokeWidth="1" strokeLinecap="round" opacity="0.6" />

            {/* Engine Hood */}
            <path
              d="M60 44 L86 44 C88 44 90 46 90 48 L90 62 L60 62 Z"
              fill="#10b981"
              stroke="#34d399"
              strokeWidth="1.5"
            />

            {/* Front Headlight with warm glow */}
            <circle cx="89" cy="48" r="3" fill="#fef08a" />
            <polygon points="92,46 99,41 99,55 92,50" fill="url(#headlightBeam)" opacity="0.6" />
          </g>

          {/* Big Rear Wheel with Rotating Spokes */}
          <g transform="translate(32, 68)">
            <circle cx="0" cy="0" r="18" fill="#047857" stroke="#ffffff" strokeWidth="3" />
            <circle cx="0" cy="0" r="9" fill="#064e3b" />
            {/* Spokes rotating */}
            <g className="animate-wheel-spin origin-center">
              <line x1="-16" y1="0" x2="16" y2="0" stroke="#a7f3d0" strokeWidth="1.5" />
              <line x1="0" y1="-16" x2="0" y2="16" stroke="#a7f3d0" strokeWidth="1.5" />
              <line x1="-11" y1="-11" x2="11" y2="11" stroke="#a7f3d0" strokeWidth="1.2" />
              <line x1="-11" y1="11" x2="11" y2="-11" stroke="#a7f3d0" strokeWidth="1.2" />
            </g>
            <circle cx="0" cy="0" r="4" fill="#facc15" />
          </g>

          {/* Small Front Wheel with Rotating Spokes */}
          <g transform="translate(80, 72)">
            <circle cx="0" cy="0" r="12" fill="#047857" stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="0" cy="0" r="6" fill="#064e3b" />
            {/* Spokes rotating */}
            <g className="animate-wheel-spin origin-center">
              <line x1="-10" y1="0" x2="10" y2="0" stroke="#a7f3d0" strokeWidth="1.2" />
              <line x1="0" y1="-10" x2="0" y2="10" stroke="#a7f3d0" strokeWidth="1.2" />
            </g>
            <circle cx="0" cy="0" r="3" fill="#facc15" />
          </g>

          {/* Gradient definitions */}
          <defs>
            <linearGradient id="headlightBeam" x1="92" y1="48" x2="100" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};

/**
 * Full-screen Animated Launch Splash Screen
 * Automatically shows on app launch and smoothly fades into the app after 1.2s.
 */
export const AppSplashScreen: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [visible, setVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        if (sessionStorage.getItem('agri_splash_shown')) {
          return false;
        }
      } catch {
        // ignore
      }
    }
    return true;
  });
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    try {
      sessionStorage.setItem('agri_splash_shown', 'true');
    } catch {
      // ignore
    }
    const timer = setTimeout(() => {
      setFading(true);
      setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 400); // 400ms fade transition
    }, 1100);

    return () => clearTimeout(timer);
  }, [visible, onComplete]);

  if (!visible) return null;

  return (
    <div
      onClick={() => {
        setFading(true);
        setTimeout(() => setVisible(false), 200);
      }}
      className={`fixed inset-0 z-[999] bg-[#080c14] flex flex-col items-center justify-center p-6 select-none transition-opacity duration-400 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background radial ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-emerald-500/15 rounded-full blur-[90px] pointer-events-none" />

      {/* Animated Tractor Logo Hero */}
      <div className="relative mb-6">
        {/* Outer radar pulse rings */}
        <div className="absolute inset-[-12px] rounded-full border border-emerald-500/30 animate-ping opacity-40 pointer-events-none" />
        <div className="absolute inset-[-24px] rounded-full border border-teal-500/20 animate-pulse pointer-events-none" />

        <AnimatedTractorLogo size="xl" showGlow={true} />
      </div>

      {/* Brand Title with Shimmer */}
      <h1 className="font-sora font-black text-2xl sm:text-3xl tracking-tight text-white flex items-center gap-1.5 mb-1.5">
        <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
          AGRI-APP
        </span>
      </h1>

      <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400/90 font-mono mb-6">
        Tractor Fleet & Billing • Enterprise
      </p>

      {/* Smooth Loading Progress Bar */}
      <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden relative">
        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full w-full animate-[progress_1.1s_ease-in-out_infinite]" />
      </div>
    </div>
  );
};
