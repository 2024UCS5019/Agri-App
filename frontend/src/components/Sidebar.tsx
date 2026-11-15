'use client';

import React from 'react';
import { ActiveTab, User } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { AnimatedTractorLogo } from '@/components/AnimatedTractorLogo';
import {
  Receipt,
  FileEdit,
  History,
  BarChart3,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Users,
  Settings,
  Sparkles,
  Cpu,
} from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser?: User | null;
  user?: User | null;
  historyCount?: number;
  isSessionActive?: boolean;
  onLogout?: () => void;
  onOpenProfileModal?: () => void;
  isCollapsed?: boolean;
  collapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
  setCollapsed?: (collapsed: boolean) => void;
  theme?: 'dark' | 'light';
  setTheme?: (theme: 'dark' | 'light') => void;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  currentUser,
  user,
  historyCount = 0,
  isSessionActive = false,
  onOpenProfileModal,
  isCollapsed = false,
  collapsed = false,
  setIsCollapsed,
  setCollapsed,
}: SidebarProps) {
  const { theme } = useTheme();
  const effectiveCollapsed = isCollapsed || collapsed;
  const toggleCollapse = () => {
    const next = !effectiveCollapsed;
    if (setIsCollapsed) setIsCollapsed(next);
    if (setCollapsed) setCollapsed(next);
  };

  const { t } = useLanguage();

  const effectiveUser = currentUser || user;
  const isOwner = effectiveUser?.role === 'Owner';
  const displayName = effectiveUser?.name || 'Muthu';
  const displayRole = isOwner ? t.fleetOwner : t.tractorDriver;
  const initial = displayName.charAt(0).toUpperCase();

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number | string }[] = [
    {
      id: 'billing',
      label: t.newBill,
      icon: <Receipt className="w-5 h-5" />,
      badge: isSessionActive ? 'LIVE' : undefined,
    },
    { id: 'manual-bill', label: t.manualBill, icon: <FileEdit className="w-5 h-5" /> },
    { id: 'history', label: t.workHistory, icon: <History className="w-5 h-5" />, badge: historyCount },
    { id: 'analytics', label: t.analytics, icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'profile', label: t.profile, icon: <UserCheck className="w-5 h-5" /> },
    ...(isOwner
      ? [
          { id: 'drivers' as ActiveTab, label: t.manageDrivers, icon: <Users className="w-5 h-5" /> },
          {
            id: 'owner-dashboard' as ActiveTab,
            label: t.ownerDashboard || 'Owner AI Hub',
            icon: <Cpu className="w-5 h-5" />,
          },
        ]
      : []),
    { id: 'settings', label: t.settings, icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside
      className={`relative h-screen flex flex-col transition-all duration-300 ease-in-out border-r shrink-0 select-none ${
        effectiveCollapsed ? 'w-20' : 'w-64'
      } ${
        theme === 'dark'
          ? 'bg-[#0a0f1a]/95 backdrop-blur-xl text-slate-200 border-white/10'
          : 'bg-white/95 backdrop-blur-xl text-slate-800 border-slate-200 shadow-sm'
      }`}
    >
      {/* Brand Header */}
      <div className={`flex items-center justify-between p-4 border-b ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <AnimatedTractorLogo size="sm" showGlow={false} />
          {!effectiveCollapsed && (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`font-sora font-bold text-base tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Agri-App
                </span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  PRO
                </span>
              </div>
              <span className={`text-[11px] truncate ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                {t.brandTag}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={toggleCollapse}
          className={`p-1.5 rounded-lg transition-colors shrink-0 ${
            theme === 'dark'
              ? 'text-slate-400 hover:text-white hover:bg-white/5'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title={effectiveCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {effectiveCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto no-scrollbar">
        {!effectiveCollapsed && (
          <div className={`px-3 pb-2 text-[10px] font-bold tracking-wider uppercase ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Operations & Fleet
          </div>
        )}

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'profile' && onOpenProfileModal) {
                  onOpenProfileModal();
                } else {
                  setActiveTab(item.id);
                }
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-sora text-sm font-semibold transition-all relative ${
                isActive
                  ? theme === 'dark'
                    ? 'bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 text-emerald-400 border border-emerald-500/30 shadow-emerald-glow'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-500/40 shadow-sm'
                  : theme === 'dark'
                  ? 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
              } ${effectiveCollapsed ? 'justify-center' : ''}`}
            >
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-emerald-500 shadow-[0_0_10px_#10b981]" />
              )}
              <div className={`relative ${isActive ? (theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600') : (theme === 'dark' ? 'text-slate-400' : 'text-slate-500')}`}>
                {item.icon}
                {item.id === 'billing' && isSessionActive && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-ping" />
                )}
              </div>
              {!effectiveCollapsed && <span className="truncate flex-1 text-left">{item.label}</span>}
              {!effectiveCollapsed && item.badge !== undefined && (
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${
                  item.badge === 'LIVE'
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 animate-pulse flex items-center gap-1 font-mono text-[10px]'
                    : theme === 'dark'
                    ? 'bg-white/10 text-slate-200 border-white/10'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {item.badge === 'LIVE' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />}
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Operator Badge (ONLY Profile Name & Role as requested) */}
      <div className={`p-3 border-t ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>
        <button
          type="button"
          onClick={() => {
            if (onOpenProfileModal) {
              onOpenProfileModal();
            } else {
              setActiveTab('profile');
            }
          }}
          className={`w-full flex items-center gap-2.5 p-2 rounded-xl border text-left cursor-pointer transition-all active:scale-[0.98] ${
            activeTab === 'profile'
              ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-400 shadow-emerald-glow'
              : theme === 'dark'
              ? 'bg-white/5 border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/5 text-white'
              : 'bg-slate-50 border-slate-200 hover:border-emerald-500/40 hover:bg-emerald-50/60 shadow-xs text-slate-900'
          } ${effectiveCollapsed ? 'justify-center p-2' : ''}`}
          title="Click to open Profile & Fleet Center"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-sora font-bold text-sm flex items-center justify-center shrink-0 shadow-md">
            {initial}
          </div>
          {!effectiveCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="block font-sora font-semibold text-xs truncate">
                  {displayName}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              </div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate">
                <ShieldCheck className="w-3 h-3 shrink-0" />
                <span className="truncate">{displayRole}</span>
              </div>
            </div>
          )}
          {!effectiveCollapsed && (
            <Sparkles className="w-3.5 h-3.5 text-emerald-500/70 shrink-0" />
          )}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
