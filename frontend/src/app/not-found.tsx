'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tractor, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // Automatically redirect back to the home portal after 2 seconds
    const timer = setTimeout(() => {
      router.push('/');
    }, 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-100 dark:bg-neutral-950 text-slate-900 dark:text-white p-6 font-sans">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-neutral-900/80 border border-slate-200 dark:border-white/10 shadow-2xl text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
          <Tractor className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="font-sora font-extrabold text-3xl tracking-tight text-slate-900 dark:text-white">
            404
          </h2>
          <p className="text-base font-bold text-slate-800 dark:text-slate-200">
            Page Not Found
          </p>
          <p className="text-xs text-slate-500 dark:text-neutral-400">
            The entire Agri-App fleet portal and login system are hosted on the main portal. Redirecting you automatically...
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Agri Portal Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
