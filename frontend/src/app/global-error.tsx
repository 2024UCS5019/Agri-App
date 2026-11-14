'use client';

import React from 'react';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 flex items-center justify-center min-h-screen p-6">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
            🚜
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">
            Tractor Fleet System Reload
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            A background update occurred. Click below to reload the console.
          </p>
          <button
            type="button"
            onClick={() => {
              if (typeof reset === 'function') reset();
              else window.location.reload();
            }}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Reload Console
          </button>
        </div>
      </body>
    </html>
  );
}
