'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LeafRingLoader } from './LeafRingLoader';
import { Check, Copy, Play, Pause, RotateCcw, Sparkles } from 'lucide-react';

export const LeafLoaderShowcase: React.FC = () => {
  const [progressVal, setProgressVal] = useState<number>(60);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const rawDomLoaderRef = useRef<SVGSVGElement | null>(null);

  // Auto-play progress simulation
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgressVal((prev) => {
        const next = prev >= 100 ? 0 : prev + 1;
        if (rawDomLoaderRef.current) {
          rawDomLoaderRef.current.style.setProperty('--p', String(next));
        }
        return next;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Synchronize raw DOM element when progressVal changes
  useEffect(() => {
    if (rawDomLoaderRef.current) {
      rawDomLoaderRef.current.style.setProperty('--p', String(progressVal));
    }
  }, [progressVal]);

  const handleSetProgressDom = (val: number) => {
    setIsPlaying(false);
    setProgressVal(val);
    if (rawDomLoaderRef.current) {
      // Exactly as requested in the user prompt:
      rawDomLoaderRef.current.style.setProperty('--p', String(val));
    }
  };

  const rawSvgSnippet = `<!-- 80px Circular Leaf Ring Loader (Pure Inline SVG + CSS) -->
<svg class="leaf-ring-loader" viewBox="-32 -32 64 64" role="status" aria-label="Loading" style="--s: 80px;">
  <g class="leaf-petals">
    <g style="transform: rotate(0deg);"><path class="leaf-petal" style="--i:0;" d="M0 -5 C5 -9 5 -19 0 -25 C-5 -19 -5 -9 0 -5Z" /></g>
    <g style="transform: rotate(45deg);"><path class="leaf-petal" style="--i:1;" d="M0 -5 C5 -9 5 -19 0 -25 C-5 -19 -5 -9 0 -5Z" /></g>
    <g style="transform: rotate(90deg);"><path class="leaf-petal" style="--i:2;" d="M0 -5 C5 -9 5 -19 0 -25 C-5 -19 -5 -9 0 -5Z" /></g>
    <g style="transform: rotate(135deg);"><path class="leaf-petal" style="--i:3;" d="M0 -5 C5 -9 5 -19 0 -25 C-5 -19 -5 -9 0 -5Z" /></g>
    <g style="transform: rotate(180deg);"><path class="leaf-petal" style="--i:4;" d="M0 -5 C5 -9 5 -19 0 -25 C-5 -19 -5 -9 0 -5Z" /></g>
    <g style="transform: rotate(225deg);"><path class="leaf-petal" style="--i:5;" d="M0 -5 C5 -9 5 -19 0 -25 C-5 -19 -5 -9 0 -5Z" /></g>
    <g style="transform: rotate(270deg);"><path class="leaf-petal" style="--i:6;" d="M0 -5 C5 -9 5 -19 0 -25 C-5 -19 -5 -9 0 -5Z" /></g>
    <g style="transform: rotate(315deg);"><path class="leaf-petal" style="--i:7;" d="M0 -5 C5 -9 5 -19 0 -25 C-5 -19 -5 -9 0 -5Z" /></g>
  </g>
  <circle cx="0" cy="0" r="3.2" class="leaf-seed" />
</svg>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(rawSvgSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="space-y-8 animate-fadeIn font-sora">
      {/* Header (No brand name, clean modern 2060 trend) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/5 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#1fa85a] dark:text-[#6df59a] text-xs font-semibold tracking-wide uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Circular Leaf Ring System
          </div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Agricultural Leaf Ring Loader
          </h2>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">
            8-leaf radial growth wave • Pure SVG & CSS variables • Light & Dark adaptive
          </p>
        </div>

        {/* Color Palette Indicators (Green & Light Green only) */}
        <div className="flex items-center gap-3 p-2 rounded-2xl bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-white/5 text-xs shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-[#1fa85a] dark:bg-[#6df59a] shadow-sm inline-block" />
            <span className="text-slate-700 dark:text-neutral-300 font-mono text-[11px]">Main</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-[#b9f5c8] dark:bg-[#1d4d31] shadow-sm inline-block" />
            <span className="text-slate-700 dark:text-neutral-300 font-mono text-[11px]">Light</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-[#0b6b38] dark:bg-[#e4ffec] shadow-sm inline-block" />
            <span className="text-slate-700 dark:text-neutral-300 font-mono text-[11px]">Seed</span>
          </div>
        </div>
      </div>

      {/* Grid of the 4 Required Use Cases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* ── Example 1: Large 75px Centered with "Preparing your fields" ── */}
        <div className="p-8 rounded-3xl bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-white/5 shadow-sm flex flex-col items-center justify-center min-h-[340px] text-center relative overflow-hidden">
          <span className="absolute top-4 left-5 text-[11px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">
            Example 1 • Full Page Loader
          </span>

          <div className="my-auto flex flex-col items-center justify-center space-y-5">
            <LeafRingLoader size={75} ariaLabel="Preparing your fields" />
            <div className="space-y-1">
              <h3 className="font-sora font-semibold text-base text-slate-800 dark:text-neutral-100 tracking-tight">
                Preparing your fields
              </h3>
              <p className="text-xs text-slate-400 dark:text-neutral-500">
                Syncing soil telemetry & machinery coordinates
              </p>
            </div>
          </div>
        </div>

        {/* ── Example 2: 30px Loader in Driver Summary Card ── */}
        <div className="p-8 rounded-3xl bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-white/5 shadow-sm flex flex-col justify-between min-h-[340px] relative">
          <span className="text-[11px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider mb-6 block">
            Example 2 • Inline Card Loader
          </span>

          {/* Clean minimal card */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-4 my-auto">
            <LeafRingLoader size={30} ariaLabel="Loading driver summary" />
            <div className="flex-1 min-w-0">
              <span className="font-sora font-semibold text-sm text-slate-800 dark:text-white block">
                Loading driver summary
              </span>
              <span className="text-xs text-slate-500 dark:text-neutral-400 block mt-0.5">
                Fetching operator logs, engine hours, and session ledger...
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 dark:text-neutral-500 mt-4">
            Size: <code className="text-[#1fa85a] dark:text-[#6df59a]">--s: 30px</code> • Fits neatly in list items, table rows, and status headers
          </p>
        </div>

        {/* ── Example 3: 20px Loader Inside Green Sign-In Button ── */}
        <div className="p-8 rounded-3xl bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-white/5 shadow-sm flex flex-col justify-between min-h-[340px] relative">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">
              Example 3 • Button Action Loader
            </span>
            <button
              type="button"
              onClick={() => setIsSigningIn(!isSigningIn)}
              className="text-xs font-semibold text-[#1fa85a] dark:text-[#6df59a] underline"
            >
              {isSigningIn ? 'Reset to Idle' : 'Simulate Signing In'}
            </button>
          </div>

          <div className="my-auto space-y-4 max-w-sm mx-auto w-full">
            <button
              type="button"
              disabled={isSigningIn}
              onClick={() => setIsSigningIn(true)}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#1fa85a] hover:bg-[#19904d] text-neutral-950 font-sora font-bold text-sm flex items-center justify-center gap-3 shadow-lg shadow-[#1fa85a]/20 transition-all active:scale-[0.99] disabled:opacity-95"
            >
              {isSigningIn ? (
                <>
                  {/* Leaves inherit text color (currentColor) */}
                  <LeafRingLoader size={20} inheritColor={true} ariaLabel="Signing in" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In to Tractor Fleet</span>
              )}
            </button>

            <p className="text-center text-xs text-slate-500 dark:text-neutral-400">
              {isSigningIn
                ? 'Leaves inherit the button text colour (#0a0f1a) via currentColor'
                : 'Click button to preview loading animation inside button'}
            </p>
          </div>

          <p className="text-xs text-slate-400 dark:text-neutral-500">
            Size: <code className="text-[#1fa85a] dark:text-[#6df59a]">--s: 20px</code> • <code className="text-[#1fa85a] dark:text-[#6df59a]">inheritColor: true</code>
          </p>
        </div>

        {/* ── Example 4: Progress Version (--p from 0 to 100) ── */}
        <div className="p-8 rounded-3xl bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-white/5 shadow-sm flex flex-col justify-between min-h-[340px] relative">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">
              Example 4 • Progress Mode (<code className="text-[#1fa85a] dark:text-[#6df59a]">--p: {progressVal}%</code>)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white text-xs flex items-center gap-1 transition-all"
                title={isPlaying ? 'Pause sweep' : 'Auto sweep 0-100%'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span className="text-[11px]">{isPlaying ? 'Pause' : 'Sweep'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetProgressDom(0)}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white"
                title="Reset to 0%"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Loader Centered with Progress Readout */}
          <div className="my-auto flex flex-col sm:flex-row items-center justify-center gap-8 py-2">
            {/* Native SVG manipulated directly via element.style.setProperty('--p', ...) */}
            <div className="relative flex items-center justify-center">
              <svg
                ref={rawDomLoaderRef}
                id="raw-progress-loader"
                className="leaf-ring-loader is-progress"
                viewBox="-32 -32 64 64"
                role="status"
                aria-label={`Progress ${progressVal}%`}
                style={{ ['--s' as string]: '80px', ['--p' as string]: progressVal }}
              >
                <g className="leaf-petals">
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((rot, idx) => (
                    <g key={idx} style={{ transform: `rotate(${rot}deg)` }}>
                      <path
                        d="M0 -5 C5 -9 5 -19 0 -25 C-5 -19 -5 -9 0 -5Z"
                        className="leaf-petal"
                        style={{ ['--i' as string]: idx } as React.CSSProperties}
                      />
                    </g>
                  ))}
                </g>
                <circle cx="0" cy="0" r="3.2" className="leaf-seed" />
              </svg>

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[11px] font-extrabold text-[#0b6b38] dark:text-[#e4ffec] font-mono mt-10">
                  {progressVal}%
                </span>
              </div>
            </div>

            {/* Slider & Quick Presets */}
            <div className="space-y-3 max-w-[200px] w-full">
              <div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-neutral-400 mb-1 font-mono">
                  <span>0%</span>
                  <span className="font-bold text-[#1fa85a] dark:text-[#6df59a]">{progressVal}%</span>
                  <span>100%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progressVal}
                  onChange={(e) => handleSetProgressDom(Number(e.target.value))}
                  className="w-full accent-[#1fa85a] cursor-pointer"
                />
              </div>

              {/* Preset buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[0, 25, 50, 60, 75, 100].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleSetProgressDom(val)}
                    className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${
                      progressVal === val
                        ? 'bg-[#1fa85a] text-neutral-950 font-bold'
                        : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 dark:text-neutral-500">
            Set via: <code className="text-[#1fa85a] dark:text-[#6df59a]">element.style.setProperty(&apos;--p&apos;, {progressVal})</code>
          </p>
        </div>
      </div>

      {/* Code Snippet Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-white/5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-sora font-bold text-sm text-slate-900 dark:text-white">
              Pure Inline SVG Markup
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              No JavaScript libraries or images required. Controlled entirely with CSS variables.
            </p>
          </div>
          <button
            type="button"
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-all border border-slate-200 dark:border-white/5"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-[#1fa85a]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Copied!' : 'Copy SVG'}</span>
          </button>
        </div>

        <pre className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-800 dark:text-neutral-300 overflow-x-auto leading-relaxed">
          <code>{rawSvgSnippet}</code>
        </pre>
      </div>
    </div>
  );
};

export default LeafLoaderShowcase;
