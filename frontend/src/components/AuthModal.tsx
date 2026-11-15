'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@/types';
import { authAPI } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { GoogleAuthChooser } from '@/components/GoogleAuthChooser';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Tractor,
  ArrowRight,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
}) => {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Driver' | 'Owner'>('Driver');
  const [tractorModel] = useState('Mahindra 575 DI Sarpanch');
  const [phone, setPhone] = useState('');

  // UI status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Prevent background scrolling and enable ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = origOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const res = await authAPI.signup({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
          tractorModel,
          phone,
        });

        if (res.success && res.user) {
          setSuccessMsg('Account registered successfully! Welcome.');
          setTimeout(() => {
            onAuthSuccess(res.user);
            onClose();
          }, 800);
        } else {
          setErrorMsg(res.message || 'Signup failed. Please check your credentials.');
        }
      } else {
        const res = await authAPI.login(email.trim().toLowerCase(), password);
        if (res.success && res.user) {
          setSuccessMsg('Logged in successfully!');
          setTimeout(() => {
            onAuthSuccess(res.user);
            onClose();
          }, 600);
        } else {
          setErrorMsg(res.message || 'Invalid email or password.');
        }
      }
    } catch {
      setErrorMsg('Network error. Unable to contact authentication server.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSelect = async (accountName: string, accountEmail: string) => {
    setLoading(true);
    setShowGoogleChooser(false);
    setErrorMsg(null);
    try {
      const res = await authAPI.googleAuth(accountName, accountEmail);
      if (res.success && res.user) {
        setSuccessMsg(`Authenticated as ${accountName} via Google!`);
        setTimeout(() => {
          onAuthSuccess(res.user);
          onClose();
        }, 700);
      } else {
        setErrorMsg('Google sign-in failed.');
      }
    } catch {
      setErrorMsg('Failed to complete Google authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto no-scrollbar animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md my-auto rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden transition-colors max-h-[92vh] flex flex-col no-scrollbar"
      >
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Tractor className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {mode === 'login' ? t.loginTitle : t.signupTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                {mode === 'login' ? t.loginSubtitle : t.signupSubtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body Form */}
        <div className="p-6 space-y-5">
          {/* Notification Alerts */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                    {t.fullName}
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Muthu Selvam"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-white/10 focus:border-emerald-500 text-slate-900 dark:text-white text-xs outline-none transition-all placeholder-slate-400 dark:placeholder-neutral-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                      {t.roleCategory}
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as 'Driver' | 'Owner')}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-white/10 focus:border-emerald-500 text-slate-900 dark:text-white text-xs outline-none"
                    >
                      <option value="Driver">{t.tractorDriver}</option>
                      <option value="Owner">{t.fleetOwner}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                      {t.mobileNumber}
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 94433..."
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-white/10 focus:border-emerald-500 text-slate-900 dark:text-white text-xs outline-none placeholder-slate-400 dark:placeholder-neutral-500"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                {t.emailAddress}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="muthu.driver@agri.in"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-white/10 focus:border-emerald-500 text-slate-900 dark:text-white text-xs outline-none transition-all placeholder-slate-400 dark:placeholder-neutral-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                {t.password}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-white/10 focus:border-emerald-500 text-slate-900 dark:text-white text-xs outline-none transition-all placeholder-slate-400 dark:placeholder-neutral-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 mt-2"
            >
              <span>{loading ? '...' : mode === 'login' ? t.signIn : t.register}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Google Auth Button (Below Sign In button) */}
            <button
              type="button"
              onClick={() => setShowGoogleChooser(true)}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-slate-50 dark:bg-white dark:hover:bg-neutral-100 text-neutral-900 font-semibold text-xs transition-all shadow-md active:scale-[0.99] mt-3 border border-slate-200 dark:border-transparent"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span>{t.continueWithGoogle}</span>
            </button>
          </form>

          {/* Toggle between Login and Signup */}
          <div className="text-center pt-2">
            {mode === 'login' ? (
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                {t.dontHaveAccount}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg(null);
                  }}
                  className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-bold transition-all underline underline-offset-2"
                >
                  {t.createOneNow}
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                {t.alreadyRegistered}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                  }}
                  className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-bold transition-all underline underline-offset-2"
                >
                  {t.signInHere}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Device-Aware Secure Google Account Chooser */}
      <GoogleAuthChooser
        isOpen={showGoogleChooser}
        onClose={() => setShowGoogleChooser(false)}
        onSelectAccount={handleGoogleSelect}
        loading={loading}
      />
    </div>
  );
};
