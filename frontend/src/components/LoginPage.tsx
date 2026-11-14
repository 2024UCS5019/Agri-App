'use client';

import React, { useState } from 'react';
import { User } from '@/types';
import { authAPI } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { LeafRingLoader } from '@/components/LeafRingLoader';
import {
  Truck,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  X,
  Sun,
  Moon,
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState<'login' | 'signup'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedMode = localStorage.getItem('agri_auth_mode');
        if (savedMode === 'signup' || savedMode === 'login') {
          return savedMode;
        }
      } catch {
        // storage unavailable
      }
    }
    return 'login';
  });
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);

  // Form states - empty by default for security
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Driver' | 'Owner'>('Driver');
  const [tractorModel] = useState('Mahindra 575 DI Sarpanch');
  const [phone, setPhone] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleModeChange = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      localStorage.setItem('agri_auth_mode', newMode);
    } catch {
      // ignore
    }
  };

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

        if (res.success) {
          // Security requirement: do NOT auto login. Switch to sign in and require password.
          setPassword('');
          handleModeChange('login');
          setSuccessMsg('Account registered successfully! Please enter your password to sign in.');
        } else {
          setErrorMsg(res.message || 'Signup failed. Please verify credentials.');
        }
      } else {
        const res = await authAPI.login(email.trim().toLowerCase(), password);
        if (res.success && res.user) {
          setSuccessMsg('Authentication successful! Loading dashboard...');
          setTimeout(() => {
            onLoginSuccess(res.user);
          }, 500);
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
        setSuccessMsg(`Welcome, ${accountName}! Authenticated via Google.`);
        setTimeout(() => {
          onLoginSuccess(res.user);
        }, 600);
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
    <div className="min-h-screen w-full bg-slate-100 dark:bg-[#060910] text-slate-900 dark:text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-emerald-500 selection:text-black transition-colors duration-200">
      {/* Ambient background glows */}
      <div className="absolute top-[-150px] left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1.5px] shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-white dark:bg-[#080c14] rounded-[14px] flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h1 className="font-sora font-extrabold text-base text-slate-900 dark:text-white tracking-tight">
              {t.appTitle}
            </h1>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold tracking-wide">
              {t.brandTag}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />

          {/* Theme Toggle Button on Login Screen */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl border transition-all text-xs flex items-center justify-center bg-white dark:bg-neutral-900 hover:bg-slate-100 dark:hover:bg-neutral-800 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 shadow-sm"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="relative z-10 w-full max-w-md mx-auto px-4 py-8">
        <div className="relative rounded-3xl bg-white dark:bg-neutral-900/90 border border-slate-200 dark:border-white/10 shadow-2xl backdrop-blur-xl p-6 sm:p-8 space-y-6 transition-colors">
          {/* Card Top Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />

          {/* Card Header */}
          <div className="text-center space-y-1.5 pt-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white font-sora tracking-tight">
              {mode === 'login' ? t.loginTitle : t.signupTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              {mode === 'login' ? t.loginSubtitle : t.signupSubtitle}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleModeChange('login')}
              className={`py-2 rounded-xl transition-all ${
                mode === 'login'
                  ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.signIn}
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('signup')}
              className={`py-2 rounded-xl transition-all ${
                mode === 'signup'
                  ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.register}
            </button>
          </div>

          {/* Feedback alerts */}
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

          {/* Form */}
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
              className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 mt-2 active:scale-[0.99]"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <LeafRingLoader size={20} inheritColor={true} ariaLabel="Signing in" />
                  <span>{mode === 'login' ? 'Signing in...' : 'Registering...'}</span>
                </div>
              ) : (
                <>
                  <span>{mode === 'login' ? t.signIn : t.register}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Google 1-Click Authentication Button (Below Sign In button) */}
            <button
              type="button"
              onClick={() => setShowGoogleChooser(true)}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-slate-50 dark:bg-white dark:hover:bg-neutral-100 text-neutral-900 font-bold text-xs transition-all shadow-md active:scale-[0.99] mt-3 border border-slate-200 dark:border-transparent"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                  onClick={() => handleModeChange('signup')}
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
                  onClick={() => handleModeChange('login')}
                  className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-bold transition-all underline underline-offset-2"
                >
                  {t.signInHere}
                </button>
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 py-4 text-center text-xs text-slate-500 dark:text-neutral-400">
        Muthu Tractor Cloud Network • Fleet Edition
      </footer>

      {/* Google Account Chooser Modal Popup */}
      {showGoogleChooser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 p-6 shadow-2xl space-y-4 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                <span className="text-xs font-bold text-slate-900 dark:text-white">{t.chooseGoogleAccount}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleChooser(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-neutral-400">
              to continue to <strong className="text-slate-900 dark:text-white">Muthu Tractor Cloud</strong>
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleGoogleSelect('Logesh M', 'logeshmuthu2004@gmail.com')}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-neutral-950 dark:hover:bg-neutral-800 border border-slate-200 dark:border-white/5 hover:border-emerald-500/30 transition-all text-left group shadow-sm"
              >
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                  L
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                    Logesh M
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">
                    logeshmuthu2004@gmail.com
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleGoogleSelect('Muthu (Driver)', 'muthu.tractorfleet@gmail.com')}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-neutral-950 dark:hover:bg-neutral-800 border border-slate-200 dark:border-white/5 hover:border-emerald-500/30 transition-all text-left group shadow-sm"
              >
                <div className="w-9 h-9 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                  M
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                    Muthu (Driver)
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">
                    muthu.tractorfleet@gmail.com
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const customEmail = prompt('Enter your Google email address:', 'farmer@gmail.com');
                  if (customEmail) {
                    const customName = customEmail.split('@')[0];
                    handleGoogleSelect(customName, customEmail);
                  }
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50/70 hover:bg-slate-100 dark:bg-neutral-950/60 dark:hover:bg-neutral-800/80 border border-dashed border-slate-300 dark:border-white/10 text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white transition-all text-xs"
              >
                <UserIcon className="w-4 h-4 text-slate-400 dark:text-neutral-400" />
                <span>Use another account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
