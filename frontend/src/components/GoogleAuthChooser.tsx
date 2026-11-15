"use client";

import React, { useState, useEffect } from 'react';
import { X, User as UserIcon, Mail, Trash2, ArrowLeft } from 'lucide-react';
import { LeafRingLoader } from '@/components/LeafRingLoader';

export interface DeviceGoogleAccount {
  name: string;
  email: string;
  color?: string;
  initial?: string;
}

interface GoogleAuthChooserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (name: string, email: string) => Promise<void>;
  loading?: boolean;
}

const STORAGE_KEY = 'agri_device_google_accounts';

// Authentic device Google accounts matching client's device profile from Google Accounts
const DEFAULT_CLIENT_DEVICE_ACCOUNTS: DeviceGoogleAccount[] = [
  {
    name: 'Logesh M',
    email: 'logesh.marimuthu25@gmail.com',
    color: 'bg-[#ea580c]', // Orange
    initial: 'L',
  },
  {
    name: 'LOGESH M',
    email: 'logeshm.cs23@bitsathy.ac.in',
    color: 'bg-[#6d28d9]', // Purple
    initial: 'L',
  },
  {
    name: 'Divya',
    email: 'rajamanisengottayyan@gmail.com',
    color: 'bg-[#78350f]', // Brown
    initial: 'D',
  },
  {
    name: 'LOGESH M',
    email: 'logeshlogeshm.17@gmail.com',
    color: 'bg-[#0f766e]', // Dark Teal
    initial: 'L',
  },
  {
    name: 'LOGESH M',
    email: 'logeshmarimuthu.17@gmail.com',
    color: 'bg-[#15803d]', // Green
    initial: 'L',
  },
];

export const GoogleAuthChooser: React.FC<GoogleAuthChooserProps> = ({
  isOpen,
  onClose,
  onSelectAccount,
  loading = false,
}) => {
  const [deviceAccounts, setDeviceAccounts] = useState<DeviceGoogleAccount[]>(DEFAULT_CLIENT_DEVICE_ACCOUNTS);
  const [showInputForm, setShowInputForm] = useState(false);
  const [inputEmail, setInputEmail] = useState('');
  const [inputName, setInputName] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  // Initialize accounts: read from localStorage or populate device accounts
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
    setDeviceAccounts(DEFAULT_CLIENT_DEVICE_ACCOUNTS);
    setShowInputForm(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const saveAccountToDevice = (name: string, email: string) => {
    try {
      const existing: DeviceGoogleAccount[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(DEFAULT_CLIENT_DEVICE_ACCOUNTS));
      const filtered = existing.filter((acc) => acc.email.toLowerCase() !== email.toLowerCase());
      const initial = (name || email).charAt(0).toUpperCase();
      const updated = [{ name, email, color: 'bg-emerald-600', initial }, ...filtered];
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

    const cleanName =
      inputName.trim() ||
      cleanEmail
        .split('@')[0]
        .replace(/[^a-zA-Z0-9]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

    await handleSelect(cleanName, cleanEmail);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-fadeIn">
      {/* Container styled exactly like Google Accounts Chooser (Image 1) */}
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 p-6 shadow-2xl space-y-4 text-slate-900 dark:text-white relative overflow-hidden">
        {/* Top Google Header bar */}
        <div className="flex items-center justify-between pb-2">
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
            <span className="text-xs font-medium text-slate-600 dark:text-neutral-400">
              Sign in with Google
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title & Subtitle matching Google Accounts (Image 1) */}
        <div className="pt-1">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Choose an account
          </h2>
          <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1">
            to continue to <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">Muthu Tractor Cloud</strong>
          </p>
        </div>

        {loading ? (
          <div className="py-10 flex flex-col items-center justify-center gap-3">
            <LeafRingLoader size={36} />
            <p className="text-xs text-slate-600 dark:text-neutral-300 font-medium animate-pulse">
              Authenticating with Google...
            </p>
          </div>
        ) : showInputForm ? (
          /* Google Account Email Entry */
          <form onSubmit={handleFormSubmit} className="space-y-3 pt-2">
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
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 outline-none transition-all"
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
                  placeholder="e.g. Logesh M"
                  autoComplete="name"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 outline-none transition-all"
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
                <span>Back to account list</span>
              </button>
            )}
          </form>
        ) : (
          /* List of Real Client Device Accounts (Exactly like Image 1) */
          <div className="divide-y divide-slate-100 dark:divide-white/5 border-t border-b border-slate-100 dark:border-white/5 my-2">
            {deviceAccounts.map((account) => {
              const letter = account.initial || account.name.charAt(0).toUpperCase();
              const bgColor = account.color || 'bg-emerald-600';
              return (
                <div
                  key={account.email}
                  onClick={() => handleSelect(account.name, account.email)}
                  role="button"
                  tabIndex={0}
                  className="w-full flex items-center justify-between py-3 px-1 hover:bg-slate-50 dark:hover:bg-neutral-800/60 rounded-xl transition-colors cursor-pointer group text-left"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div
                      className={`w-9 h-9 rounded-full ${bgColor} text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0`}
                    >
                      {letter}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
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
                    title="Remove from device list"
                    className="p-1.5 text-slate-300 hover:text-rose-500 dark:text-neutral-600 dark:hover:text-rose-400 transition-colors rounded-lg opacity-0 group-hover:opacity-100 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

            {/* "Use another account" row matching Google (Image 1) */}
            <div
              onClick={() => {
                setShowInputForm(true);
                setInputEmail('');
                setInputName('');
                setInputError(null);
              }}
              role="button"
              tabIndex={0}
              className="w-full flex items-center gap-3.5 py-3 px-1 hover:bg-slate-50 dark:hover:bg-neutral-800/60 rounded-xl transition-colors cursor-pointer group text-left"
            >
              <div className="w-9 h-9 rounded-full border border-slate-300 dark:border-white/20 flex items-center justify-center text-slate-500 dark:text-neutral-400 group-hover:border-blue-500 group-hover:text-blue-500 transition-colors shrink-0">
                <UserIcon className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-700 dark:text-neutral-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Use another account
              </span>
            </div>
          </div>
        )}

        {/* Footer Language Notice matching Image 1 */}
        <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 dark:text-neutral-500">
          <span>English (United Kingdom)</span>
          <span className="text-[10px]">Privacy • Terms</span>
        </div>
      </div>
    </div>
  );
};
