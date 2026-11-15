'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ActiveTab, ActiveTractorConfig, Bill, Stats, User } from '@/types';
import {
  authAPI,
  billsAPI,
  getLocalSession,
  clearLocalSession,
  getLocalTractorConfig,
  setLocalTractorConfig,
  DEFAULT_TRACTOR_CONFIG,
} from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { NewBillSection } from '@/components/NewBillSection';
import { ManualBillSection } from '@/components/ManualBillSection';
import { AnalyticsSection } from '@/components/AnalyticsSection';
import { WorkHistorySection } from '@/components/WorkHistorySection';
import { ProfileSection } from '@/components/ProfileSection';
import { ShareInvoiceModal } from '@/components/ShareInvoiceModal';
import { AuthModal } from '@/components/AuthModal';
import { LoginPage } from '@/components/LoginPage';
import { LeafRingLoader } from '@/components/LeafRingLoader';
import { ManageDriversSection } from '@/components/ManageDriversSection';
import { SettingsSection } from '@/components/SettingsSection';
import { OwnerDashboardSection } from '@/components/OwnerDashboardSection';
import { ProfilePopupModal } from '@/components/ProfilePopupModal';
import { AnimatedTractorLogo, AppSplashScreen } from '@/components/AnimatedTractorLogo';
import { useLanguage } from '@/context/LanguageContext';
import {
  Menu,
  X,
  CheckCircle2,
  AlertCircle,
  Tractor,
  Activity,
  Users,
  Settings,
  ShieldCheck,
  Sparkles,
  Cpu,
  Play,
  Pause,
  ExternalLink,
  Receipt,
  FileEdit,
  History,
  BarChart3,
  UserCheck,
} from 'lucide-react';
import {
  getActiveSession,
  computeLiveSeconds,
  formatDigitalTime,
  calculateSessionAmount,
  pauseSession,
  resumeSession,
} from '@/lib/sessionTimer';
import { ActiveTractorSession } from '@/types';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

const VALID_TABS: ActiveTab[] = [
  'billing',
  'manual-bill',
  'history',
  'analytics',
  'profile',
  'drivers',
  'settings',
  'loader',
  'owner-dashboard',
];

export default function Home() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedTab = localStorage.getItem('agri_active_tab') as ActiveTab | null;
        if (savedTab && VALID_TABS.includes(savedTab)) {
          return savedTab;
        }
      } catch {
        // storage unavailable
      }
    }
    return 'billing';
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [prefilledDriver, setPrefilledDriver] = useState<string>('');

  // Active Tractor Work Session (Persistent & global across all tabs and reloads)
  const [activeSession, setActiveSession] = useState<ActiveTractorSession | null>(() => {
    if (typeof window !== 'undefined') {
      return getActiveSession();
    }
    return null;
  });
  const [liveSessionSeconds, setLiveSessionSeconds] = useState<number>(() => {
    return activeSession ? computeLiveSeconds(activeSession) : 0;
  });

  // Keep live seconds ticking continuously in the background across all tabs
  useEffect(() => {
    const interval = setInterval(() => {
      const sess = getActiveSession();
      setActiveSession(sess);
      if (sess) {
        setLiveSessionSeconds(computeLiveSeconds(sess));
      } else {
        setLiveSessionSeconds(0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Listen to cross-component or cross-tab session broadcast events
  useEffect(() => {
    const handleSessionBroadcast = () => {
      const sess = getActiveSession();
      setActiveSession(sess);
      setLiveSessionSeconds(sess ? computeLiveSeconds(sess) : 0);
    };

    window.addEventListener('agri_session_update', handleSessionBroadcast);
    window.addEventListener('storage', handleSessionBroadcast);
    return () => {
      window.removeEventListener('agri_session_update', handleSessionBroadcast);
      window.removeEventListener('storage', handleSessionBroadcast);
    };
  }, []);

  // Tab change with localStorage persistence
  const handleTabChange = useCallback((newTab: ActiveTab) => {
    setActiveTab(newTab);
    try {
      localStorage.setItem('agri_active_tab', newTab);
    } catch {
      // Storage unavailable
    }
  }, []);

  const handleSelectDriverForBill = (driverName: string) => {
    setPrefilledDriver(driverName);
    handleTabChange('billing');
    addToast(`Selected driver: ${driverName} for new bill`, 'info');
  };

  // Auth & User state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return Boolean(localStorage.getItem('agri_token') && localStorage.getItem('agri_user'));
      } catch {
        return false;
      }
    }
    return false;
  });
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [user, setUser] = useState<User>({
    name: 'Muthu',
    email: 'muthu.driver@agri.in',
    role: 'Driver',
    phone: '+91 94433 11223',
    tractorModel: 'Mahindra 575 DI Sarpanch',
    licenseNumber: 'TN-28-2022-0098234',
  });

  // Active Tractor Config State (synchronized with header and Settings)
  const [activeTractor, setActiveTractor] = useState<ActiveTractorConfig>(DEFAULT_TRACTOR_CONFIG);

  // Bills & Stats state
  const [bills, setBills] = useState<Bill[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    totalHours: 0,
    pendingDues: 0,
    completedJobs: 0,
    paidCount: 0,
    pendingCount: 0,
    monthlyData: [],
    workTypeBreakdown: [],
    paymentStatusDistribution: [],
  });

  // Modal states
  const [shareInvoice, setShareInvoice] = useState<Bill | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Role-Based Access Isolation: Driver accounts strictly see only their own jobs and revenue
  const userBills = useMemo(() => {
    if (user.role === 'Driver' && user.name) {
      const driverQuery = user.name.trim().toLowerCase();
      return bills.filter((b) => {
        const billDriver = (b.driverName || '').trim().toLowerCase();
        return billDriver.includes(driverQuery) || driverQuery.includes(billDriver);
      });
    }
    return bills;
  }, [bills, user.role, user.name]);

  const userStats = useMemo(() => {
    if (user.role === 'Driver' && user.name) {
      let totalRevenue = 0;
      let totalSecs = 0;
      let pendingDues = 0;
      let paidCount = 0;
      let pendingCount = 0;

      userBills.forEach((b) => {
        totalSecs += Number(b.durationSecs) || 0;
        if (b.status === 'Paid') {
          totalRevenue += Number(b.totalAmount) || 0;
          paidCount++;
        } else {
          pendingDues += Number(b.totalAmount) || 0;
          pendingCount++;
        }
      });

      return {
        totalRevenue,
        totalHours: parseFloat((totalSecs / 3600).toFixed(1)),
        pendingDues,
        completedJobs: userBills.length,
        paidCount,
        pendingCount,
        monthlyData: stats.monthlyData,
        workTypeBreakdown: stats.workTypeBreakdown,
        paymentStatusDistribution: [
          { name: 'Paid', value: totalRevenue, count: paidCount, color: '#10b981' },
          { name: 'Pending', value: pendingDues, count: pendingCount, color: '#f59e0b' },
        ],
      };
    }
    return stats;
  }, [userBills, stats, user.role, user.name]);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const handleHudPause = useCallback(() => {
    const updated = pauseSession();
    setActiveSession(updated);
    if (updated) setLiveSessionSeconds(updated.accumulatedSeconds);
    addToast('⏸️ Tractor field work paused', 'info');
  }, [addToast]);

  const handleHudResume = useCallback(() => {
    const currentSession = getActiveSession();
    if (currentSession) {
      const digits = (currentSession.customerPhone || '').replace(/\D/g, '');
      let national = digits;
      if (digits.length === 12 && digits.startsWith('91')) national = digits.slice(2);
      else if (digits.length === 11 && digits.startsWith('0')) national = digits.slice(1);

      if (!currentSession.customerName?.trim() || national.length !== 10) {
        addToast(
          digits.length > 10
            ? `⚠️ Invalid mobile (${digits.length} digits). Exactly 10-digit mobile number required to resume.`
            : '⚠️ Farmer details required! Please enter customer name & 10-digit phone in New Bill to resume.',
          'error'
        );
        handleTabChange('billing');
        return;
      }
    }
    const updated = resumeSession();
    setActiveSession(updated);
    if (updated) setLiveSessionSeconds(computeLiveSeconds(updated));
    addToast('⚡ Tractor field work resumed', 'success');
  }, [addToast, handleTabChange]);

  // Fetch initial data
  const loadData = useCallback(async () => {
    try {
      const localToken = typeof window !== 'undefined' ? localStorage.getItem('agri_token') : null;
      const localUser = getLocalSession();
      if (!localToken || !localUser) {
        setIsAuthenticated(false);
        setAuthChecked(true);
        return;
      }

      const fetchedUser = await authAPI.getMe();
      const effectiveUser = fetchedUser || localUser;
      const driverFilter = effectiveUser?.role === 'Driver' ? effectiveUser.name : undefined;

      const [fetchedBills, fetchedStats] = await Promise.all([
        billsAPI.getAll(driverFilter ? { driverName: driverFilter } : undefined),
        billsAPI.getStats(driverFilter),
      ]);

      if (effectiveUser) {
        setUser(effectiveUser);
        setIsAuthenticated(true);
      } else {
        clearLocalSession();
        setIsAuthenticated(false);
      }
      if (fetchedBills) setBills(fetchedBills);
      if (fetchedStats) setStats(fetchedStats);
    } catch {
      // Offline fallback handles it
      const localUser = getLocalSession();
      const localToken = typeof window !== 'undefined' ? localStorage.getItem('agri_token') : null;
      if (localUser && localToken) {
        setUser(localUser);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } finally {
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    try {
      const savedTab = localStorage.getItem('agri_active_tab') as ActiveTab | null;
      if (savedTab && VALID_TABS.includes(savedTab)) {
        setActiveTab(savedTab);
      }
    } catch {
      // Storage unavailable
    }

    const savedTractor = getLocalTractorConfig();
    if (savedTractor) {
      setActiveTractor(savedTractor);
    }

    const localUser = getLocalSession();
    const localToken = typeof window !== 'undefined' ? localStorage.getItem('agri_token') : null;
    if (localUser && localToken) {
      setUser(localUser);
      setIsAuthenticated(true);
      loadData();
    } else {
      setIsAuthenticated(false);
      setAuthChecked(true);
    }
  }, [loadData]);

  // Safeguard: Owner Hub is strictly accessible only to Owner accounts
  useEffect(() => {
    if (user.role !== 'Owner' && activeTab === 'owner-dashboard') {
      setActiveTab('billing');
    }
  }, [user.role, activeTab]);

  // Handle Bill Creation & Saving
  const handleBillCreated = async (newBill: Bill) => {
    try {
      const created = await billsAPI.create(newBill);
      const finalBill = created || newBill;
      setBills((prev) => {
        const idToMatch = finalBill._id || finalBill.billId;
        const exists = prev.some((b) => (b._id && b._id === idToMatch) || b.billId === finalBill.billId);
        if (exists) {
          return prev.map((b) => ((b._id && b._id === idToMatch) || b.billId === finalBill.billId ? finalBill : b));
        }
        return [finalBill, ...prev];
      });
      const updatedStats = await billsAPI.getStats();
      setStats(updatedStats);
      addToast(`Bill ${finalBill.billId} saved to Work History!`, 'success');
    } catch {
      setBills((prev) => {
        const exists = prev.some((b) => b.billId === newBill.billId);
        if (exists) {
          return prev.map((b) => (b.billId === newBill.billId ? newBill : b));
        }
        return [newBill, ...prev];
      });
      addToast(`Bill ${newBill.billId} saved successfully!`, 'success');
    }
  };

  // Handle Status Toggle (Paid <-> Pending)
  const handleToggleStatus = async (id: string, currentStatus: 'Paid' | 'Pending') => {
    const nextStatus = currentStatus === 'Paid' ? 'Pending' : 'Paid';

    // Optimistic UI update
    setBills((prev) =>
      prev.map((b) => ((b.id === id || b._id === id || b.billId === id) ? { ...b, status: nextStatus } : b))
    );

    try {
      const updatedBill = await billsAPI.toggleStatus(id, nextStatus);
      if (updatedBill) {
        addToast(`Invoice marked as ${nextStatus}`, 'success');
        const updatedStats = await billsAPI.getStats();
        setStats(updatedStats);
      }
    } catch {
      addToast('Failed to update status', 'error');
    }
  };

  // Handle Delete Bill
  const handleDeleteBill = async (id: string) => {
    try {
      const ok = await billsAPI.delete(id);
      if (ok) {
        setBills((prev) => prev.filter((b) => b.id !== id && b._id !== id && b.billId !== id));
        const updatedStats = await billsAPI.getStats();
        setStats(updatedStats);
        addToast('Invoice record deleted', 'info');
      }
    } catch {
      addToast('Failed to delete invoice', 'error');
    }
  };

  // Handle Update Bill Note & Due Date
  const handleUpdateBillNote = async (id: string, notes: string) => {
    try {
      await billsAPI.updateNotes(id, notes);
      setBills((prev) =>
        prev.map((b) => (b.id === id || b._id === id || b.billId === id ? { ...b, notes } : b))
      );
      addToast('📝 Reminder note saved successfully!', 'success');
    } catch {
      setBills((prev) =>
        prev.map((b) => (b.id === id || b._id === id || b.billId === id ? { ...b, notes } : b))
      );
      addToast('📝 Reminder note saved!', 'success');
    }
  };

  // Handle Profile Update
  const handleUpdateProfile = async (updated: Partial<User>) => {
    try {
      const res = await authAPI.updateProfile(updated);
      if (res.success && res.user) {
        setUser(res.user);
        addToast('Operator profile saved successfully', 'success');
      }
    } catch {
      addToast('Profile update failed', 'error');
    }
  };

  // Handle Login Success
  const handleLoginSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setIsAuthenticated(true);
    addToast(`Logged in as ${authenticatedUser.name}`, 'success');
    loadData();
  };

  // Handle Logout -> returns straight to Login Page
  const handleLogout = async () => {
    await authAPI.logout();
    clearLocalSession();
    setIsAuthenticated(false);
    addToast('Signed out of fleet portal', 'info');
  };

  // Full-page centered loader while validating session (Example 1)
  if (!authChecked) {
    return (
      <>
        <AppSplashScreen />
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-100 dark:bg-neutral-950 text-slate-900 dark:text-neutral-100 p-6 transition-colors duration-200">
          <LeafRingLoader size={75} ariaLabel="Preparing your fields" />
          <div className="mt-6 text-center space-y-1.5 font-sora">
            <h3 className="font-semibold text-lg text-slate-900 dark:text-neutral-100 tracking-tight">
              Preparing your fields
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Syncing telemetry & machinery coordinates...
            </p>
          </div>
        </div>
      </>
    );
  }

  // If logged out, render the Login Page!
  if (authChecked && !isAuthenticated) {
    return (
      <>
        <AppSplashScreen />
        {/* Toast Notification Container */}
        <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-3 p-4 rounded-2xl border shadow-2xl backdrop-blur-md animate-slideDown ${
                toast.type === 'success'
                  ? 'bg-white/95 dark:bg-neutral-900/95 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 shadow-emerald-500/10'
                  : toast.type === 'error'
                  ? 'bg-white/95 dark:bg-neutral-900/95 border-rose-500/40 text-rose-700 dark:text-rose-300 shadow-rose-500/10'
                  : 'bg-white/95 dark:bg-neutral-900/95 border-cyan-500/40 text-cyan-700 dark:text-cyan-300 shadow-cyan-500/10'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : toast.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              ) : (
                <Activity className="w-5 h-5 text-cyan-400 shrink-0" />
              )}
              <p className="text-xs font-semibold flex-1 leading-snug">{toast.message}</p>
            </div>
          ))}
        </div>

        <LoginPage onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  return (
    <>
      <AppSplashScreen />
      <div className="flex h-screen w-full overflow-hidden bg-slate-100 dark:bg-neutral-950 text-slate-900 dark:text-neutral-100 font-sans antialiased selection:bg-emerald-500/30 selection:text-emerald-300 transition-colors duration-200">
      {/* Toast Notification Container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 p-4 rounded-2xl border shadow-2xl backdrop-blur-md animate-slideDown ${
              toast.type === 'success'
                ? 'bg-white/95 dark:bg-neutral-900/95 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 shadow-emerald-500/10'
                : toast.type === 'error'
                ? 'bg-white/95 dark:bg-neutral-900/95 border-rose-500/40 text-rose-700 dark:text-rose-300 shadow-rose-500/10'
                : 'bg-white/95 dark:bg-neutral-900/95 border-cyan-500/40 text-cyan-700 dark:text-cyan-300 shadow-cyan-500/10'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            ) : (
              <Activity className="w-5 h-5 text-cyan-500 shrink-0" />
            )}
            <p className="text-xs font-semibold flex-1 leading-snug">{toast.message}</p>
          </div>
        ))}
      </div>

      {/* Desktop Luxury Vertical Sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          user={user}
          historyCount={userBills.length}
          isSessionActive={Boolean(activeSession && activeSession.isRunning)}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          onLogout={handleLogout}
          onOpenProfileModal={() => setProfileModalOpen(true)}
        />
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-full bg-white dark:bg-neutral-950 border-r border-slate-200 dark:border-white/10 h-full p-4 flex flex-col shadow-2xl">
            {/* Header: Branded Tractor Logo matching PC */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10 mb-4">
              <div className="flex items-center gap-3 overflow-hidden">
                <AnimatedTractorLogo size="sm" showGlow={false} />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-sora font-bold text-base tracking-tight text-slate-900 dark:text-white">
                      Agri-App
                    </span>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      PRO
                    </span>
                  </div>
                  <span className="text-[11px] truncate text-slate-500 dark:text-slate-400">
                    {t.brandTag || 'Tractor Fleet & Billing'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-3 pb-2 text-[10px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              Operations & Fleet
            </div>

            <div className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar">
              {/* New Bill */}
              <button
                onClick={() => {
                  handleTabChange('billing');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold font-sora transition-all ${
                  activeTab === 'billing'
                    ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-900 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Receipt className={`w-5 h-5 ${activeTab === 'billing' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-neutral-400'}`} />
                  <span>{t.newBill}</span>
                </div>
                {Boolean(activeSession && activeSession.isRunning) && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500 text-neutral-950 animate-pulse">
                    LIVE
                  </span>
                )}
              </button>

              {/* Manual Bill */}
              <button
                onClick={() => {
                  handleTabChange('manual-bill');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold font-sora transition-all ${
                  activeTab === 'manual-bill'
                    ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-900 border border-transparent'
                }`}
              >
                <FileEdit className={`w-5 h-5 ${activeTab === 'manual-bill' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-neutral-400'}`} />
                <span>{t.manualBill}</span>
              </button>

              {/* Work History */}
              <button
                onClick={() => {
                  handleTabChange('history');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold font-sora transition-all ${
                  activeTab === 'history'
                    ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-900 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <History className={`w-5 h-5 ${activeTab === 'history' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-neutral-400'}`} />
                  <span>{t.workHistory}</span>
                </div>
                {userBills.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                    {userBills.length}
                  </span>
                )}
              </button>

              {/* Analytics & Charts */}
              <button
                onClick={() => {
                  handleTabChange('analytics');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold font-sora transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-900 border border-transparent'
                }`}
              >
                <BarChart3 className={`w-5 h-5 ${activeTab === 'analytics' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-neutral-400'}`} />
                <span>{t.analytics}</span>
              </button>

              {/* Profile & Fleet */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setProfileModalOpen(true);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold font-sora transition-all ${
                  activeTab === 'profile'
                    ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-900 border border-transparent'
                }`}
              >
                <UserCheck className={`w-5 h-5 ${activeTab === 'profile' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-neutral-400'}`} />
                <span>{t.profile}</span>
              </button>

              {/* Owner Features: Manage Drivers below Profile & Fleet, Owner AI Hub below Manage Drivers */}
              {user.role === 'Owner' && (
                <>
                  <button
                    onClick={() => {
                      handleTabChange('drivers');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold font-sora transition-all ${
                      activeTab === 'drivers'
                        ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-sm'
                        : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-900 border border-transparent'
                    }`}
                  >
                    <Users className={`w-5 h-5 ${activeTab === 'drivers' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-neutral-400'}`} />
                    <span>{t.manageDrivers}</span>
                  </button>

                  <button
                    onClick={() => {
                      handleTabChange('owner-dashboard');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold font-sora transition-all ${
                      activeTab === 'owner-dashboard'
                        ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-sm'
                        : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-900 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Cpu className={`w-5 h-5 ${activeTab === 'owner-dashboard' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-neutral-400'}`} />
                      <span>{t.ownerDashboard || 'Owner AI Hub'}</span>
                    </div>
                  </button>
                </>
              )}

              {/* Settings */}
              <button
                onClick={() => {
                  handleTabChange('settings');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold font-sora transition-all ${
                  activeTab === 'settings'
                    ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-900 border border-transparent'
                }`}
              >
                <Settings className={`w-5 h-5 ${activeTab === 'settings' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-neutral-400'}`} />
                <span>{t.settings}</span>
              </button>
            </div>

            {/* Mobile Drawer Footer: ONLY profile name and role */}
            <div className="pt-4 border-t border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setProfileModalOpen(true);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all text-left shadow-xs active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-sora font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="block font-sora font-semibold text-xs text-slate-900 dark:text-white truncate">
                      {user.name}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{user.role === 'Owner' ? t.fleetOwner : t.tractorDriver}</span>
                  </div>
                </div>
                <Sparkles className="w-4 h-4 text-emerald-500/70" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header: minimal hamburger menu toggle on small mobile screens only */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-neutral-950/60 backdrop-blur-md shrink-0 z-20">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              <Tractor className="w-4 h-4" />
            </div>
            <span className="font-sora font-bold text-sm text-slate-900 dark:text-white">Agri-App</span>
          </div>
          <div className="w-9" />
        </div>

        {/* Scrollable View Content (Clean seamless view without right-side scrollbar) */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-8 space-y-8 scroll-smooth no-scrollbar">
          {/* ── Persistent Floating Live Tractor Session HUD Banner (Visible across any non-billing page) ── */}
          {activeSession && (activeSession.isRunning || liveSessionSeconds > 0) && activeTab !== 'billing' && (
            <div className="sticky top-0 z-30 p-4 rounded-3xl bg-slate-900/95 dark:bg-black/95 border-2 border-emerald-500/50 shadow-2xl shadow-emerald-950/40 backdrop-blur-xl text-white animate-fadeIn transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left: Indicator, Machine Implement, Operator, Farmer */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                      activeSession.isRunning
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.35)] animate-pulse'
                        : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                    }`}
                  >
                    <Tractor className="w-6 h-6" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase ${
                          activeSession.isRunning
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            activeSession.isRunning ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                          }`}
                        />
                        {activeSession.isRunning ? 'LIVE TRACTOR SESSION RUNNING' : 'SESSION PAUSED'}
                      </span>

                      <span className="text-xs font-bold font-sora text-slate-200 truncate">
                        {activeSession.selectedWork}{' '}
                        {activeSession.selectedWork === 'Spring Cultivator' ? `(${activeSession.selectedTines}S)` : ''}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 truncate mt-1 flex items-center gap-2">
                      <span className="text-slate-300 font-medium">
                        👨‍🌾 {activeSession.customerName || 'Field Session'}
                      </span>
                      <span>•</span>
                      <span>🚜 {activeSession.driverName}</span>
                      {activeSession.location && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[150px]">📍 {activeSession.location}</span>
                        </>
                      )}
                      <span>•</span>
                      <span className="text-emerald-400 font-semibold font-mono">
                        ₹{calculateSessionAmount(liveSessionSeconds, activeSession.hourlyRate).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Digital Timer Counter & Control Actions */}
                <div className="flex items-center justify-between md:justify-end gap-3.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/10">
                  <div className="text-left md:text-right">
                    <div className="font-mono font-extrabold text-2xl text-emerald-400 tracking-wider tabular-nums drop-shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                      {formatDigitalTime(liveSessionSeconds)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      ₹{activeSession.hourlyRate}/hr • Active
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Pause / Resume Button */}
                    {activeSession.isRunning ? (
                      <button
                        type="button"
                        onClick={handleHudPause}
                        className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold font-sora flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                        title="Pause field work session"
                      >
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Pause</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleHudResume}
                        className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold font-sora flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                        title="Resume field work session"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Resume</span>
                      </button>
                    )}

                    {/* Open in New Bill / Finalize Work */}
                    <button
                      type="button"
                      onClick={() => handleTabChange('billing')}
                      className="px-4 py-2 rounded-xl bg-[#1fa85a] hover:bg-[#198d4b] text-white text-xs font-bold font-sora flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/25 active:scale-95"
                      title="Switch to New Bill to view live session or generate bill"
                    >
                      <span>Open in New Bill</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <NewBillSection
              stats={userStats}
              currentUser={user}
              initialDriverName={prefilledDriver}
              onBillCreated={handleBillCreated}
              onShareInvoice={(bill) => setShareInvoice(bill)}
              showToast={(msg) => addToast(msg, 'info')}
            />
          )}

          {activeTab === 'manual-bill' && (
            <ManualBillSection
              stats={userStats}
              currentUser={user}
              onBillCreated={handleBillCreated}
              onViewAllBills={() => handleTabChange('history')}
              addToast={addToast}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsSection
              stats={userStats}
              refreshStats={loadData}
            />
          )}

          {activeTab === 'history' && (
            <WorkHistorySection
              bills={userBills}
              stats={userStats}
              currentUser={user}
              onToggleStatus={handleToggleStatus}
              onDeleteBill={handleDeleteBill}
              onViewInvoice={(bill) => setShareInvoice(bill)}
              onShareInvoice={(bill) => setShareInvoice(bill)}
              onNewBillClick={() => handleTabChange('billing')}
              onUpdateBillNote={handleUpdateBillNote}
              addToast={addToast}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileSection
              user={user}
              activeTractor={activeTractor}
              onUpdateProfile={handleUpdateProfile}
              onLogout={handleLogout}
              onOpenAuthModal={() => setAuthModalOpen(true)}
              onNavigateToSettings={() => handleTabChange('settings')}
            />
          )}

          {activeTab === 'owner-dashboard' && user.role === 'Owner' && (
            <OwnerDashboardSection
              currentUser={user}
              bills={bills}
              stats={stats}
              onNavigateTab={handleTabChange}
              addToast={addToast}
            />
          )}

          {activeTab === 'drivers' && (
            <ManageDriversSection
              currentUser={user}
              onSelectDriverForBill={handleSelectDriverForBill}
              onAddToast={addToast}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsSection
              currentUser={user}
              activeTractor={activeTractor}
              onUpdateActiveTractor={(updated) => {
                setActiveTractor(updated);
                setLocalTractorConfig(updated);
              }}
              onOpenAuthModal={() => setAuthModalOpen(true)}
              onLogout={handleLogout}
              onAddToast={addToast}
            />
          )}
        </main>
      </div>

      {/* Share & Save Invoice Modal */}
      <ShareInvoiceModal
        bill={shareInvoice}
        onClose={() => setShareInvoice(null)}
        tractorModel={activeTractor.model}
        addToast={addToast}
        onSaveInvoice={handleBillCreated}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={(authenticatedUser) => {
          setUser(authenticatedUser);
          addToast(`Logged in as ${authenticatedUser.name}`, 'success');
        }}
      />

      {/* Centered Profile & Telemetry Popup Modal */}
      <ProfilePopupModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        user={user}
        activeTractor={activeTractor}
        onOpenAuthModal={() => {
          setProfileModalOpen(false);
          setAuthModalOpen(true);
        }}
        onNavigateToSettings={() => {
          setProfileModalOpen(false);
          handleTabChange('settings');
        }}
        onLogout={handleLogout}
        onAddToast={addToast}
      />
    </div>
    </>
  );
}
