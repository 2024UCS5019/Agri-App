"use client";

import React, { useState, useEffect } from 'react';
import { X, User as UserIcon, Mail, Trash2, ArrowLeft } from 'lucide-react';
import { LeafRingLoader } from '@/components/LeafRingLoader';

export interface DeviceGoogleAccount {
  name: string;
  email: string;
  color?: string;
}

interface GoogleAuthChooserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (name: string, email: string) => Promise<void>;
  loading?: boolean;
}

const STORAGE_KEY = 'agri_device_google_accounts';

const AVATAR_COLORS = [
  'bg-emerald-600',
  'bg-blue-600',
  'bg-amber-600',
  'bg-purple-600',
  'bg-rose-600',
  'bg-indigo-600',
];

export const GoogleAuthChooser: React.FC<GoogleAuthChooserProps> = ({
  isOpen,
  onClose,
  onSelectAccount,
  loading = false,
}) => {
  const [deviceAccounts, setDeviceAccounts] = useState<DeviceGoogleAccount[]>([]);
  const [showInputForm, setShowInputForm] = useState(false);
  const [inputEmail, setInputEmail] = useState('');
  const [inputName, setInputName] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  // Load ONLY accounts previously authenticated on THIS client device
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: DeviceGoogleAccount[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDeviceAccounts(parsed);
          setShowInputForm(false);
          return;
        }
      }
    } catch {
      // ignore
    }
    // If no accounts exist on this device yet, show the sign-in input directly
    setDeviceAccounts([]);
    setShowInputForm(true);
  }, [isOpen]);

  if (!isOpen) return null;

  const saveAccountToDevice = (name: string, email: string) => {
    try {
      const existing: DeviceGoogleAccount[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const filtered = existing.filter((acc) => acc.email.toLowerCase() !== email.toLowerCase());
      const randomColor = AVATAR_COLORS[filtered.length % AVATAR_COLORS.length];
      const updated = [{ name, email, color: randomColor }, ...filtered];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setDeviceAccounts(updated);
    } catch {
      // ignore
    }
  };

  const removeAccountFromDevice = (e: React.MouseEvent, email: string) => {
    e.stopPropagation();
    try {
      const updated = deviceAccounts.filter((acc) => acc.email.toLowerCase() !== email.toLowerCase());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setDeviceAccounts(updated);
      if (updated.length === 0) {
        setShowInputForm(true);
      }
    } catch {
      // ignore
    }
  };

  const handleSelect = async (name: string, email: string) => {
    saveAccountToDevice(name, email);
    await onSelectAccount(name, email);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInputError(null);

    const cleanEmail = inputEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setInputError('Please enter a valid Google email address.');
      return;
    }

    const cleanName = inputName.trim() || cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    await handleSelect(cleanName, cleanEmail);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 p-6 shadow-2xl space-y-4 text-slate-900 dark:text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {showInputForm && deviceAccounts.length > 0 ? 'Add Google Account' : 'Choose a Google Account'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-neutral-400">
          to continue to <strong className="text-slate-900 dark:text-white">Muthu Tractor Cloud</strong>
        </p>

        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3">
            <LeafRingLoader size={32} />
            <p className="text-xs text-slate-600 dark:text-neutral-300 font-medium animate-pulse">
              Authenticating with Google...
            </p>
          </div>
        ) : showInputForm ? (
          /* Google Account Input Form (Shown when no device accounts exist or user clicks 'Use another account') */
          <form onSubmit={handleFormSubmit} className="space-y-3 pt-1">
            {inputError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                {inputError}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                Your Google Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  autoFocus
                  required
                  autoComplete="email"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                Display Name (Optional)
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  placeholder="e.g. Ramesh"
                  autoComplete="name"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 mt-2"
            >
              <span>Continue with Google</span>
            </button>

            {deviceAccounts.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setShowInputForm(false);
                  setInputError(null);
                }}
                className="w-full py-2 text-center text-xs text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to accounts on this device</span>
              </button>
            )}
          </form>
        ) : (
          /* List of ONLY accounts previously logged into THIS specific client device */
          <div className="space-y-2">
            {deviceAccounts.map((account) => {
              const letter = (account.name || account.email).charAt(0).toUpperCase();
              const bgColor = account.color || 'bg-emerald-600';
              return (
                <div
                  key={account.email}
                  onClick={() => handleSelect(account.name, account.email)}
                  role="button"
                  tabIndex={0}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-neutral-950 dark:hover:bg-neutral-800 border border-slate-200 dark:border-white/5 hover:border-emerald-500/30 transition-all text-left group shadow-sm cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-9 h-9 rounded-full ${bgColor} text-white font-bold flex items-center justify-center text-sm shadow-md shrink-0`}>
                      {letter}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                        {account.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">
                        {account.email}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => removeAccountFromDevice(e, account.email)}
                    title="Remove from this device"
                    className="p-1.5 text-slate-400 hover:text-rose-500 dark:text-neutral-500 dark:hover:text-rose-400 transition-colors rounded-lg ml-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => {
                setShowInputForm(true);
                setInputEmail('');
                setInputName('');
                setInputError(null);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50/70 hover:bg-slate-100 dark:bg-neutral-950/60 dark:hover:bg-neutral-800/80 border border-dashed border-slate-300 dark:border-white/10 text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white transition-all text-xs"
            >
              <UserIcon className="w-4 h-4 text-slate-400 dark:text-neutral-400" />
              <span>Use another account</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
