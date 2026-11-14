'use client';

import React, { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error Boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-neutral-950 flex items-center justify-center p-6 text-slate-900 dark:text-white">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 shadow-2xl text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto text-2xl">
          🌾
        </div>
        <h2 className="text-xl font-sora font-extrabold tracking-tight">
          Application Notice
        </h2>
        <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
          The page encountered a minor loading state. Click below to refresh the tractor operations console.
        </p>
        <button
          type="button"
          onClick={() => {
            if (typeof reset === 'function') reset();
            else window.location.reload();
          }}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-sora font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
        >
          Reload Dashboard
        </button>
      </div>
    </div>
  );
}
