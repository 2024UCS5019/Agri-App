'use client';

import React, { useEffect, useState } from 'react';
import { User, ActiveTractorConfig } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { LANGUAGES } from '@/lib/translations';
import {
  X,
  ShieldCheck,
  Tractor,
  Globe,
  Sun,
  Moon,
  LogOut,
  UserCheck,
  Fuel,
  Clock,
  Radio,
  Phone,
  Mail,
  FileText,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface ProfilePopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  activeTractor: ActiveTractorConfig;
  onOpenAuthModal: () => void;
  onNavigateToSettings: () => void;
  onLogout: () => void;
  onAddToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ProfilePopupModal: React.FC<ProfilePopupModalProps> = ({
  isOpen,
  onClose,
  user,
  activeTractor,
  onOpenAuthModal,
  onNavigateToSettings,
  onLogout,
  onAddToast,
}) => {
  const { lang, setLang, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  // Field audio alert state from localStorage
  const [soundAlerts, setSoundAlerts] = useState<boolean>(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('agri_timer_sound');
      if (saved) setSoundAlerts(saved === 'true');
    } catch {
      // Storage unavailable
    }
  }, []);

  const toggleSoundAlerts = () => {
    const next = !soundAlerts;
    setSoundAlerts(next);
    try {
      localStorage.setItem('agri_timer_sound', String(next));
      onAddToast?.(
        next ? 'Field timer audio alerts enabled' : 'Field timer audio alerts muted',
        'info'
      );
    } catch {
      // Storage unavailable
    }
  };

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isOwner = user.role === 'Owner';
  const displayName = user.name || 'Logesh M';
  const displayRole = isOwner ? 'Tractor Owner' : 'Tractor Driver';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 dark:bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* 2060 Pro Centered Dialog Box */}
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-emerald-500/20 shadow-2xl shadow-emerald-500/10 overflow-hidden z-10 flex flex-col max-h-[92vh] animate-scaleUp">
        {/* Holographic Glowing Header Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-[#1fa85a]" />

        {/* Modal Top Bar */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Agri-Fleet OS • Operator Profile
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Deck */}
        <div className="p-5 space-y-3.5 overflow-y-auto no-scrollbar">
          {/* ── 1. OPERATOR PROFILE HERO CARD ── */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-950/80 border border-slate-200 dark:border-white/5 flex items-center gap-3.5 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white font-sora font-extrabold text-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              {initial}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-sora font-bold text-base text-slate-900 dark:text-white truncate">
                  {displayName}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[#1fa85a] dark:text-[#6df59a] text-[10px] font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{displayRole}</span>
                </span>
              </div>

              <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-[11px] text-slate-500 dark:text-neutral-400">
                <span className="flex items-center gap-1 truncate">
                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{user.email || 'muthu.driver@agri.in'}</span>
                </span>
                <span className="hidden sm:inline-block text-slate-300 dark:text-neutral-700">•</span>
                <span className="flex items-center gap-1 shrink-0">
                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{user.phone || '+91 94433 11223'}</span>
                </span>
              </div>

              {user.licenseNumber && (
                <div className="mt-1 flex items-center gap-1.5 text-[10px] font-mono text-slate-400 dark:text-neutral-500">
                  <FileText className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span>License: {user.licenseNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── 2. ACTIVE TRACTOR & MACHINERY TELEMETRY ── */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-white/10 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Tractor className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-sora font-bold text-xs text-slate-900 dark:text-white">
                    Active Machinery Telemetry
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-neutral-400">
                    {activeTractor.model}
                  </p>
                </div>
              </div>

              {/* Status Pill */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToSettings();
                }}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border cursor-pointer hover:opacity-90 transition-all ${
                  activeTractor.status === 'Active'
                    ? 'bg-emerald-500/15 text-[#1fa85a] dark:text-[#6df59a] border-emerald-500/30'
                    : activeTractor.status === 'Maintenance'
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                    : 'bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 border-slate-200 dark:border-white/10'
                }`}
                title="Click to configure in Settings"
              >
                ● {activeTractor.registrationNumber} ({activeTractor.status})
              </button>
            </div>

            {/* Quick Telemetry Indicators */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/5 text-center">
                <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 dark:text-neutral-500 mb-0.5">
                  <Fuel className="w-3 h-3 text-emerald-500" />
                  <span>Diesel Tank</span>
                </div>
                <span className="font-sora font-bold text-xs text-slate-900 dark:text-white">
                  {activeTractor.dieselLevelPercent || 78}%
                </span>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/5 text-center">
                <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 dark:text-neutral-500 mb-0.5">
                  <Clock className="w-3 h-3 text-teal-500" />
                  <span>Meter Total</span>
                </div>
                <span className="font-sora font-bold text-xs text-slate-900 dark:text-white">
                  {activeTractor.currentHours || 1482}h
                </span>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/5 text-center">
                <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 dark:text-neutral-500 mb-0.5">
                  <Radio className="w-3 h-3 text-cyan-500" />
                  <span>GPS Tracking</span>
                </div>
                <span className="font-sora font-bold text-xs text-[#1fa85a] dark:text-[#6df59a]">
                  Connected
                </span>
              </div>
            </div>
          </div>

          {/* ── 3. APPLICATION LANGUAGE PREFERENCES (Sleek Segmented Design) ── */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-neutral-950/70 border border-slate-200/80 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center">
                  <Globe className="w-3.5 h-3.5" />
                </div>
                <span className="font-sora font-bold text-xs text-slate-800 dark:text-neutral-200">
                  {t.language} / மொழி விருப்பங்கள்
                </span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                {LANGUAGES.find((l) => l.code === lang)?.label}
              </span>
            </div>

            {/* Segmented language strip */}
            <div className="grid grid-cols-4 p-1 rounded-xl bg-slate-200/70 dark:bg-neutral-900 border border-slate-300/40 dark:border-white/5 gap-1">
              {LANGUAGES.map((item) => {
                const isSelected = item.code === lang;
                return (
                  <button
                    type="button"
                    key={item.code}
                    onClick={() => {
                      setLang(item.code);
                      onAddToast?.(`Language: ${item.label}`, 'info');
                    }}
                    className={`py-2 px-1 rounded-lg text-center transition-all relative active:scale-95 flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-white dark:bg-neutral-800 text-emerald-600 dark:text-[#6df59a] shadow-sm font-bold ring-1 ring-black/5 dark:ring-white/10'
                        : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-neutral-800/40'
                    }`}
                  >
                    <span className="text-xs font-sora font-bold leading-tight">{item.native}</span>
                    <span className="text-[10px] opacity-75 font-normal leading-tight mt-0.5">{item.label}</span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute -bottom-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── 4. APPEARANCE & FIELD CONTRAST (Sleek Segmented Design) ── */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-neutral-950/70 border border-slate-200/80 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  {theme === 'light' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
                </div>
                <span className="font-sora font-bold text-xs text-slate-800 dark:text-neutral-200">
                  Theme & Field Contrast
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400">
                {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
              </span>
            </div>

            {/* Segmented Theme Switch */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-200/70 dark:bg-neutral-900 border border-slate-300/40 dark:border-white/5 gap-1">
              {/* Light Mode */}
              <button
                type="button"
                onClick={() => {
                  if (theme !== 'light') toggleTheme();
                }}
                className={`py-2 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-2 active:scale-95 ${
                  theme === 'light'
                    ? 'bg-white text-slate-900 shadow-sm font-bold ring-1 ring-black/5'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-neutral-800/40'
                }`}
              >
                <Sun className={`w-4 h-4 ${theme === 'light' ? 'text-amber-500' : 'text-slate-400'}`} />
                <span>Light Mode</span>
                {theme === 'light' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                )}
              </button>

              {/* Dark Mode */}
              <button
                type="button"
                onClick={() => {
                  if (theme !== 'dark') toggleTheme();
                }}
                className={`py-2 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-2 active:scale-95 ${
                  theme === 'dark'
                    ? 'bg-neutral-800 text-white shadow-sm font-bold ring-1 ring-white/10'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-neutral-800/40'
                }`}
              >
                <Moon className={`w-4 h-4 ${theme === 'dark' ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>Dark Mode</span>
                {theme === 'dark' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                )}
              </button>
            </div>
          </div>

          {/* ── 5. FIELD TIMER AUDIO ALERTS TOGGLE ── */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-neutral-950/80 border border-slate-200 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-teal-500" />
              <span className="text-xs font-medium text-slate-800 dark:text-neutral-200">
                Timer Audio Beep & Vibration
              </span>
            </div>

            <button
              type="button"
              onClick={toggleSoundAlerts}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                soundAlerts ? 'bg-[#1fa85a]' : 'bg-slate-300 dark:bg-neutral-800'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                  soundAlerts ? 'left-5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-neutral-950/90 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-2.5">
          {/* Quick Settings Shortcut */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateToSettings();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-xs"
          >
            <Sliders className="w-3.5 h-3.5 text-teal-500" />
            <span>Settings</span>
          </button>

          <div className="flex items-center gap-2">
            {/* Switch Account Button */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAuthModal();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-xs active:scale-95"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t.switchAccount}</span>
            </button>

            {/* Logout Button */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all shadow-xs active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t.signOut}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
