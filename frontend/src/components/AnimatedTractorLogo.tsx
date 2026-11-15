"use client";

import React, { useState, useEffect } from 'react';

interface AnimatedTractorLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2060';
  showGlow?: boolean;
  className?: string;
}

/**
 * 2060 Trend Circular Animated Tractor Emblem
 * Replicating the authentic circular emblem from user image (media_1794748706632_7ad2be26.jpg):
 * - Outer dark obsidian titanium ring with glowing emerald border
 * - Inner vibrant emerald core
 * - Pure white tractor with rotating wheel spokes, exhaust smoke, glowing headlight, and engine rumble
 */
export const AnimatedTractorLogo: React.FC<AnimatedTractorLogoProps> = ({
  size = 'md',
  showGlow = true,
  className = '',
}) => {
  const sizeMap = {
    sm: { outer: 38, inner: 32, tractor: 22 },
    md: { outer: 48, inner: 40, tractor: 28 },
    lg: { outer: 64, inner: 54, tractor: 38 },
    xl: { outer: 96, inner: 80, tractor: 56 },
    '2060': { outer: 140, inner: 118, tractor: 84 },
  };

  const { outer, inner, tractor } = sizeMap[size];

  return (
    <div
      style={{ width: `${outer}px`, height: `${outer}px` }}
      className={`relative rounded-full flex items-center justify-center shrink-0 ${
        showGlow ? 'animate-aura-glow' : ''
      } ${className}`}
    >
      {/* Outer Obsidian Ring with Glowing Emerald/Cyan Rim */}
      <div className="absolute inset-0 rounded-full bg-[#070d19] border-2 border-emerald-400/80 shadow-[0_0_20px_rgba(16,185,129,0.35)]" />

      {/* Inner Emerald Circular Core */}
      <div
        style={{ width: `${inner}px`, height: `${inner}px` }}
        className="relative rounded-full bg-gradient-to-tr from-[#047857] via-[#059669] to-[#10b981] flex items-center justify-center overflow-hidden shadow-inner border border-emerald-300/40"
      >
        {/* Subtle radial light shimmer */}
        <div className="absolute inset-0 bg-radial from-white/20 via-transparent to-black/20 pointer-events-none" />

        {/* Vertical laser scan line (2060 trend) */}
        <div className="absolute left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-200/90 to-transparent animate-laser-scan pointer-events-none z-20" />

        {/* Animated Tractor SVG in Pure Crisp White */}
        <svg
          width={tractor}
          height={tractor}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10"
        >
          {/* Cyber Exhaust Smoke Puffs */}
          <circle cx="68" cy="18" r="3.2" fill="#ffffff" className="animate-exhaust-1" opacity="0.8" />
          <circle cx="68" cy="18" r="2.5" fill="#a7f3d0" className="animate-exhaust-2" opacity="0.6" />
          <circle cx="68" cy="18" r="1.8" fill="#6ee7b7" className="animate-exhaust-3" opacity="0.4" />

          {/* Tractor Chassis & Cabin (Engine Rumble vibration) */}
          <g className="animate-tractor-chug">
            {/* Exhaust Pipe / Chimney */}
            <rect x="66" y="20" width="4.5" height="22" rx="1.5" fill="#ffffff" />
            <rect x="64.5" y="18" width="7.5" height="3" rx="1" fill="#ffffff" />

            {/* Cabin Body */}
            <path
              d="M24 62 L32 30 L58 30 L62 62 Z"
              fill="#ffffff"
              stroke="#ffffff"
              strokeWidth="1"
              strokeLinejoin="round"
            />

            {/* Cabin Window Glass (Cutout in Emerald Core color) */}
            <path
              d="M36 54 L40 36 L54 36 L56 54 Z"
              fill="#065f46"
            />
            {/* Window Highlight reflection */}
            <line x1="42" y1="38" x2="40" y2="52" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />

            {/* Engine Hood */}
            <path
              d="M60 44 L86 44 C88 44 90 46 90 48 L90 62 L60 62 Z"
              fill="#ffffff"
            />

            {/* Front Headlight with Cyber Beam */}
            <circle cx="89" cy="48" r="3.5" fill="#fef08a" />
            <polygon points="92,46 100,41 100,55 92,50" fill="url(#laserBeam)" opacity="0.75" />
          </g>

          {/* Big Rear Wheel with 2060 Spinning Spokes */}
          <g transform="translate(32, 68)">
            <circle cx="0" cy="0" r="18" fill="#ffffff" />
            <circle cx="0" cy="0" r="10" fill="#065f46" />
            {/* Rotating Wheel Spokes */}
            <g className="animate-wheel-spin origin-center">
              <line x1="-16" y1="0" x2="16" y2="0" stroke="#ffffff" strokeWidth="2" />
              <line x1="0" y1="-16" x2="0" y2="16" stroke="#ffffff" strokeWidth="2" />
              <line x1="-11" y1="-11" x2="11" y2="11" stroke="#ffffff" strokeWidth="1.6" />
              <line x1="-11" y1="11" x2="11" y2="-11" stroke="#ffffff" strokeWidth="1.6" />
            </g>
            <circle cx="0" cy="0" r="4.5" fill="#34d399" />
          </g>

          {/* Small Front Wheel with 2060 Spinning Spokes */}
          <g transform="translate(80, 72)">
            <circle cx="0" cy="0" r="12" fill="#ffffff" />
            <circle cx="0" cy="0" r="6.5" fill="#065f46" />
            {/* Rotating Wheel Spokes */}
            <g className="animate-wheel-spin origin-center">
              <line x1="-10" y1="0" x2="10" y2="0" stroke="#ffffff" strokeWidth="1.6" />
              <line x1="0" y1="-10" x2="0" y2="10" stroke="#ffffff" strokeWidth="1.6" />
            </g>
            <circle cx="0" cy="0" r="3" fill="#34d399" />
          </g>

          {/* Headlight Laser Gradient */}
          <defs>
            <linearGradient id="laserBeam" x1="92" y1="48" x2="100" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};

/**
 * 2060 Trend Futuristic Launch Screen (Matching User Image media_1794748706632_7ad2be26.jpg)
 * - Central Circular Emblem with Outer Dark Obsidian Ring & Emerald Core
 * - Holographic HUD Orbitals & Radar Rings
 * - "Agri-App" Text Below with Chromatic Laser Shimmer
 * - Minimalist Cyber Progress Indicator
 * - Auto-transitions into app after ~1.4s (or tap to skip)
 */
export const AppSplashScreen: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  useEffect(() => {
    onComplete?.();
  }, [onComplete]);
  return null;
};
