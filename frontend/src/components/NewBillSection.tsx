'use client';

import React, { useState, useEffect } from 'react';
import { Bill, Driver, Stats, User, ActiveTractorSession } from '@/types';
import { getLocalDrivers, getLocalTractorServiceConfig } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import {
  IndianRupee,
  Clock,
  CheckCircle2,
  Play,
  Pause,
  Square,
  RotateCcw,
  User as UserIcon,
  Phone,
  MapPin,
  Tractor,
  Sparkles,
  Lock,
  ShieldCheck,
  MessageSquare,
  AlertCircle,
  Save,
} from 'lucide-react';
import {
  getActiveSession,
  saveActiveSession,
  computeLiveSeconds,
  formatDigitalTime,
  pauseSession,
  clearSession,
} from '@/lib/sessionTimer';
import { dispatchCustomerSMS, getCleanIndianPhone } from '@/lib/smsSender';

interface NewBillSectionProps {
  stats: Stats;
  currentUser?: User | null;
  initialDriverName?: string;
  onInvoiceCreated?: (bill: Bill) => void;
  onBillCreated?: (bill: Bill) => void;
  onShareInvoice?: (bill: Bill) => void;
  showToast?: (msg: string) => void;
}

export function NewBillSection({
  currentUser,
  initialDriverName,
  onInvoiceCreated,
  onBillCreated,
  showToast,
}: NewBillSectionProps) {
  const { t } = useLanguage();

  const notify = (msg: string) => {
    if (showToast) showToast(msg);
  };

  // Work Implement Chips (in order: Rotavator, Combine Harvest, Disc Cultivator, Laser Leveller, Spring Cultivator)
  const workOptions = [
    { id: 'Rotavator', label: t.rotavator, icon: '🔄', defaultRate: 900 },
    { id: 'Harvest', label: t.harvest, icon: '🌾', defaultRate: 1400 },
    { id: 'Disc Cultivator', label: t.discCultivator, icon: '💿', defaultRate: 950 },
    { id: 'Laser Leveller', label: t.laserLeveller, icon: '📐', defaultRate: 1200 },
    { id: 'Spring Cultivator', label: t.springCultivator, icon: '⚙️', defaultRate: 850 },
  ];

  // In spring we have 5 spring, 9 spring, and 13 spring
  const springOptions = [
    { id: '5', label: '5 Spring', sub: '5 கொழு (Light)' },
    { id: '9', label: '9 Spring', sub: '9 கொழு (Standard)' },
    { id: '13', label: '13 Spring', sub: '13 கொழு (Heavy)' },
  ];

  // Restore existing active session if available
  const existingSession = typeof window !== 'undefined' ? getActiveSession() : null;

  const [selectedWork, setSelectedWork] = useState(existingSession?.selectedWork || 'Rotavator');
  const [selectedTines, setSelectedTines] = useState(existingSession?.selectedTines || '9');
  const [customerName, setCustomerName] = useState(existingSession?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(existingSession?.customerPhone || '');
  const [driverName, setDriverName] = useState(existingSession?.driverName || currentUser?.name || 'Muthu');
  const [hourlyRate, setHourlyRate] = useState<number>(existingSession?.hourlyRate || 900);
  const [season, setSeason] = useState(existingSession?.season || 'Samba (Main Season)');
  const [location, setLocation] = useState(existingSession?.location || '');
  const [fieldNotes, setFieldNotes] = useState(existingSession?.fieldNotes || '');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Pending'>(existingSession?.paymentStatus || 'Pending');
  const [fleetDrivers, setFleetDrivers] = useState<Driver[]>([]);
  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string }>({});

  // Strict Indian mobile validator (rejects 11 digits, incomplete numbers, or numbers not starting with 6-9)
  const validateIndianMobile = (phone: string): { isValid: boolean; error?: string; cleanDigits: string } => {
    const trimmed = (phone || '').trim();
    if (!trimmed) {
      return { isValid: false, error: 'Farmer Contact Number is required', cleanDigits: '' };
    }

    const digitsOnly = trimmed.replace(/\D/g, '');

    let national = digitsOnly;
    if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
      national = digitsOnly.slice(2);
    } else if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
      national = digitsOnly.slice(1);
    }

    if (national.length !== 10) {
      if (digitsOnly.length > 10) {
        return {
          isValid: false,
          error: `Invalid number: ${digitsOnly.length} digits entered. Mobile numbers must be exactly 10 digits.`,
          cleanDigits: national,
        };
      }
      return {
        isValid: false,
        error: `Incomplete number: only ${digitsOnly.length} of 10 digits entered.`,
        cleanDigits: national,
      };
    }

    if (!/^[6-9]/.test(national)) {
      return {
        isValid: false,
        error: 'Invalid mobile number: Must start with 6, 7, 8, or 9.',
        cleanDigits: national,
      };
    }

    return { isValid: true, cleanDigits: national };
  };

  // Mandatory Customer Security Validator: Prevents timer start or invoice generation without valid farmer details
  const validateCustomerDetails = () => {
    const trimmedName = customerName.trim();

    let nameErr = '';
    let phoneErr = '';

    if (!trimmedName || trimmedName.length < 2) {
      nameErr = 'Farmer / Customer Name is required (min 2 characters)';
    }

    const phoneCheck = validateIndianMobile(customerPhone);
    if (!phoneCheck.isValid) {
      phoneErr = phoneCheck.error || 'Enter a valid 10-digit mobile number';
    }

    return { isValid: !nameErr && !phoneErr, nameErr, phoneErr };
  };

  const handleCustomerNameChange = (val: string) => {
    setCustomerName(val);
    if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: '' }));
    const sess = getActiveSession();
    if (sess) {
      sess.customerName = val.trim();
      sess.lastUpdated = Date.now();
      saveActiveSession(sess);
    }
  };

  const handleCustomerPhoneChange = (val: string) => {
    setCustomerPhone(val);
    const check = validateIndianMobile(val);
    if (formErrors.phone) {
      if (check.isValid) {
        setFormErrors((prev) => ({ ...prev, phone: '' }));
      } else {
        setFormErrors((prev) => ({ ...prev, phone: check.error }));
      }
    }
    const sess = getActiveSession();
    if (sess) {
      sess.customerPhone = val.trim();
      sess.lastUpdated = Date.now();
      saveActiveSession(sess);
    }
  };

  // Auto-send invoice on session completion toggle
  const [autoSendCustomer, setAutoSendCustomer] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('agri_auto_send_customer');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });
  const [smsDispatchedForSession, setSmsDispatchedForSession] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('agri_auto_send_customer', String(autoSendCustomer));
    } catch {
      // storage unavailable
    }
  }, [autoSendCustomer]);

  useEffect(() => {
    setFleetDrivers(getLocalDrivers());
  }, []);

  // Timer & Work Session State
  const [timerSeconds, setTimerSeconds] = useState(() => {
    return existingSession ? computeLiveSeconds(existingSession) : 0;
  });
  const [isRunning, setIsRunning] = useState(() => {
    return existingSession ? Boolean(existingSession.isRunning) : false;
  });
  const [workEnded, setWorkEnded] = useState(false);
  const [manualHours, setManualHours] = useState(existingSession?.manualHours || '');
  const [manualMins, setManualMins] = useState(existingSession?.manualMins || '');

  // Sync session state across tabs and HUD triggers
  useEffect(() => {
    const handleSessionUpdate = () => {
      const session = getActiveSession();
      if (session) {
        setCustomerName(session.customerName || '');
        setCustomerPhone(session.customerPhone || '');
        setSelectedWork(session.selectedWork || 'Rotavator');
        setSelectedTines(session.selectedTines || '9');
        setHourlyRate(session.hourlyRate || 900);
        setSeason(session.season || 'Samba (Main Season)');
        setLocation(session.location || '');
        setDriverName(session.driverName || currentUser?.name || 'Muthu');
        setFieldNotes(session.fieldNotes || '');
        setPaymentStatus(session.paymentStatus || 'Pending');
        if (session.autoSendCustomer !== undefined) setAutoSendCustomer(session.autoSendCustomer);
        setManualHours(session.manualHours || '');
        setManualMins(session.manualMins || '');
        setTimerSeconds(computeLiveSeconds(session));
        setIsRunning(session.isRunning);
      } else {
        // Session was cleared externally
        setTimerSeconds(0);
        setIsRunning(false);
      }
    };

    window.addEventListener('agri_session_update', handleSessionUpdate);
    window.addEventListener('storage', handleSessionUpdate);
    return () => {
      window.removeEventListener('agri_session_update', handleSessionUpdate);
      window.removeEventListener('storage', handleSessionUpdate);
    };
  }, [currentUser]);

  // Sync driver name with prefill or current user if no session is active
  useEffect(() => {
    const sess = getActiveSession();
    if (!sess) {
      if (initialDriverName) {
        setDriverName(initialDriverName);
      } else if (currentUser?.name) {
        setDriverName(currentUser.name);
      }
    }
  }, [currentUser, initialDriverName]);

  // Handle timer tick using timestamp delta to ensure absolute accuracy even when backgrounded
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        const session = getActiveSession();
        if (session && session.isRunning) {
          setTimerSeconds(computeLiveSeconds(session));
        } else {
          setTimerSeconds((prev) => prev + 1);
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const handleStartTimer = () => {
    // 1. Mandatory Security Validation: Farmer Name and Contact Number required
    const validation = validateCustomerDetails();
    if (!validation.isValid) {
      setFormErrors({
        name: validation.nameErr,
        phone: validation.phoneErr,
      });

      try {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
      } catch {
        // ignore
      }

      if (validation.nameErr && validation.phoneErr) {
        notify('⚠️ Security Alert: Farmer Name and Contact Number are required before starting the tractor timer!');
      } else if (validation.nameErr) {
        notify(`⚠️ Security Alert: ${validation.nameErr}`);
      } else {
        notify(`⚠️ Security Alert: ${validation.phoneErr}`);
      }
      return;
    }

    setFormErrors({ name: '', phone: '' });

    const currentSession = getActiveSession();
    const liveSecs = currentSession ? computeLiveSeconds(currentSession) : timerSeconds;

    const newSession: ActiveTractorSession = {
      isRunning: true,
      startTimestamp: Date.now(),
      accumulatedSeconds: liveSecs,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      selectedWork,
      selectedTines,
      hourlyRate,
      season,
      location: location.trim(),
      driverName: driverName.trim(),
      fieldNotes: fieldNotes.trim(),
      paymentStatus,
      autoSendCustomer,
      manualHours,
      manualMins,
      lastUpdated: Date.now(),
    };

    saveActiveSession(newSession);
    setIsRunning(true);
    setWorkEnded(false);

    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(80);
      }
    } catch {
      // ignore
    }
    notify('⚡ Tractor timer started! Field inputs are now secured & locked against edits.');
  };

  const handleStopTimer = () => {
    const updated = pauseSession();
    setIsRunning(false);
    if (updated) {
      setTimerSeconds(updated.accumulatedSeconds);
    }
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([60, 40, 60]);
      }
    } catch {
      // ignore
    }
    notify('⏸️ Work paused. Options unlocked. Click Start Work to resume or End Work to finalize.');
  };

  const handleEndWork = () => {
    // Validate customer details before ending/finalizing
    const validation = validateCustomerDetails();
    if (!validation.isValid) {
      setFormErrors({
        name: validation.nameErr,
        phone: validation.phoneErr,
      });
      notify('⚠️ Security Alert: Farmer details must be completed before finalizing this session.');
      return;
    }

    const currentSession = getActiveSession();
    const currentTimerSecs = currentSession ? computeLiveSeconds(currentSession) : timerSeconds;
    const effectiveSecs = currentTimerSecs + (parseFloat(manualHours) || 0) * 3600 + (parseFloat(manualMins) || 0) * 60;
    if (effectiveSecs <= 0) {
      notify('⚠️ Please run the work timer or enter duration before ending work');
      return;
    }

    if (currentSession) {
      saveActiveSession({
        ...currentSession,
        isRunning: false,
        startTimestamp: null,
        accumulatedSeconds: currentTimerSecs,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        lastUpdated: Date.now(),
      });
    }

    setIsRunning(false);
    setWorkEnded(true);
    setTimerSeconds(currentTimerSecs);

    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([150, 80, 150]);
      }
    } catch {
      // ignore
    }

    const { national10, fullE164, formattedDisplay } = getCleanIndianPhone(customerPhone);
    if (national10.length === 10) {
      let workLabel = selectedWork;
      if (selectedWork === 'Spring Cultivator') {
        workLabel += ` (${selectedTines} Spring)`;
      }
      const totalM = effectiveSecs / 60;
      const hD = Math.floor(totalM / 60);
      const mD = Math.floor(totalM % 60);
      const durationFmt = `${hD}h ${mD.toString().padStart(2, '0')}m`;
      const calcAmount = Math.round((hourlyRate * totalM) / 60);

      const serviceConfig = getLocalTractorServiceConfig();
      const endWorkBill: Partial<Bill> = {
        customerName: customerName.trim(),
        customerPhone: fullE164,
        driverName: driverName.trim(),
        workType: workLabel,
        variant: selectedWork === 'Spring Cultivator' ? `${selectedTines} Spring` : '',
        durationFormatted: durationFmt,
        ratePerHour: hourlyRate,
        totalAmount: calcAmount,
        status: paymentStatus,
        season: season.trim(),
        location: location.trim(),
        billId: `#AGRI-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).replace(/[\s\-/]?2026/g, '').trim(),
      };

      if (autoSendCustomer) {
        // Directly dispatch SMS to customer number with razor-sharp alignment
        dispatchCustomerSMS(endWorkBill, 'Mahindra 575 DI (45 HP)', serviceConfig);
        setSmsDispatchedForSession(true);
        notify(`📱 Work ended! Official SMS invoice directly dispatched to ${customerName.trim()} (${formattedDisplay})`);
      } else {
        notify(`🏁 Work ended! Duration recorded (${durationFmt}). Click "Save Invoice" below to save.`);
      }
    } else if (customerPhone.trim()) {
      notify('⚠️ Work ended! Please enter a valid 10-digit mobile number to dispatch the SMS invoice.');
    } else {
      notify('⚠️ Work ended! Please enter customer mobile number to dispatch the SMS invoice.');
    }
  };

  const handleResetTimer = () => {
    clearSession();
    setIsRunning(false);
    setWorkEnded(false);
    setSmsDispatchedForSession(false);
    setTimerSeconds(0);
    setManualHours('');
    setManualMins('');
    setFormErrors({});
    notify('🔄 Timer reset to 00:00:00.');
  };

  // Calculation helpers
  const getEffectiveSeconds = () => {
    let s = timerSeconds;
    const mH = parseFloat(manualHours) || 0;
    const mM = parseFloat(manualMins) || 0;
    if (mH > 0 || mM > 0) {
      s += Math.floor(mH * 3600 + mM * 60);
    }
    return s;
  };

  const totalEffectiveSeconds = getEffectiveSeconds();
  const totalMins = totalEffectiveSeconds / 60;
  const hoursDisplay = Math.floor(totalMins / 60);
  const minsDisplay = Math.floor(totalMins % 60);
  const totalCalculatedAmount = Math.round((hourlyRate * totalMins) / 60);

  const handleSubmitBill = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateCustomerDetails();
    if (!validation.isValid) {
      setFormErrors({
        name: validation.nameErr,
        phone: validation.phoneErr,
      });
      notify('⚠️ Security Alert: Farmer Name and valid 10-digit Phone Number are required to generate invoice.');
      return;
    }
    if (totalEffectiveSeconds <= 0) {
      notify('⚠️ Please run the work timer or enter manual hours/minutes');
      return;
    }
    if (!workEnded) {
      notify(t.pleaseEndWorkFirst || "⚠️ Please click 'End Work' to finish the session before generating invoice.");
      return;
    }

    let workLabel = selectedWork;
    if (selectedWork === 'Spring Cultivator') {
      workLabel += ` (${selectedTines} Spring)`;
    }

    const durationFormatted = `${hoursDisplay}h ${minsDisplay.toString().padStart(2, '0')}m`;

    const { national10, fullE164, formattedDisplay } = getCleanIndianPhone(customerPhone);

    const billPayload = {
      customerName: customerName.trim(),
      customerPhone: fullE164 || customerPhone.trim(),
      driverName: driverName.trim(),
      workType: workLabel,
      variant: selectedWork === 'Spring Cultivator' ? `${selectedTines} Spring` : '',
      durationSecs: totalEffectiveSeconds,
      durationFormatted,
      ratePerHour: hourlyRate,
      totalAmount: totalCalculatedAmount,
      status: paymentStatus,
      season: season.trim(),
      location: location.trim(),
      notes: fieldNotes.trim() || location.trim(),
      billId: `#AGRI-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).replace(/[\s\-/]?2026/g, '').trim(),
    };

    if (onInvoiceCreated) onInvoiceCreated(billPayload);
    if (onBillCreated) onBillCreated(billPayload);

    // Auto-dispatch invoice via SMS if not already dispatched upon ending work
    if (autoSendCustomer && national10.length === 10) {
      if (!smsDispatchedForSession) {
        const serviceConfig = getLocalTractorServiceConfig();
        dispatchCustomerSMS(billPayload, 'Mahindra 575 DI (45 HP)', serviceConfig);
        notify(`✅ Invoice ${billPayload.billId} saved! 📱 SMS invoice automatically dispatched to ${billPayload.customerName} (${formattedDisplay}).`);
      } else {
        notify(`✅ Invoice ${billPayload.billId} saved successfully to Work History! (📱 SMS invoice already dispatched to ${billPayload.customerName})`);
      }
    } else {
      notify(`✅ Invoice ${billPayload.billId} saved successfully to Work History!`);
    }

    // Reset Form & Clear Active Session
    clearSession();
    setCustomerName('');
    setCustomerPhone('');
    setLocation('');
    setFieldNotes('');
    setWorkEnded(false);
    setSmsDispatchedForSession(false);
    setTimerSeconds(0);
    setManualHours('');
    setManualMins('');
  };

  return (
    <div className="space-y-6">
      {/* ── Two-Column Billing Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Job & Customer Details (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-xl shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Tractor className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="font-sora font-bold text-lg text-slate-900 dark:text-white">{t.fieldSessionDeck}</h2>
            </div>
            {isRunning && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                LIVE IN PROGRESS
              </span>
            )}
          </div>

          {/* 🔒 Security Lockout Alert Banner when work timer is running */}
          {isRunning && (!customerName.trim() || !validateIndianMobile(customerPhone).isValid) ? (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/40 text-rose-900 dark:text-rose-200 flex items-start sm:items-center gap-3 animate-fadeIn shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-400 mt-0.5 sm:mt-0">
                <AlertCircle className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-rose-950 dark:text-rose-100">Action Required — Invalid Customer Mobile Number!</span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-[10px] font-mono font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                    Security Required
                  </span>
                </div>
                <p className="text-rose-800/90 dark:text-rose-200 text-[11px] mt-0.5">
                  {customerPhone.replace(/\D/g, '').length > 10
                    ? `You entered ${customerPhone.replace(/\D/g, '').length} digits. Indian mobile numbers must be exactly 10 digits. Please edit the number below.`
                    : 'Please enter a valid 10-digit mobile number below to secure this field session.'}
                </p>
              </div>
            </div>
          ) : null}

          <form onSubmit={handleSubmitBill} className="space-y-6">
            {/* ── 1. CUSTOMER NAME & CUSTOMER PHONE NUMBER (FIRST) ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-[#1fa85a] dark:text-[#6df59a] text-xs font-bold flex items-center justify-center">1</span>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {t.farmerDetails}
                  </label>
                </div>
                {isRunning && customerName.trim().length >= 2 && validateIndianMobile(customerPhone).isValid && (
                  <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Customer Name */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t.farmerNameLabel} *
                    </label>
                    {formErrors.name && (
                      <span className="text-[10px] font-bold text-rose-500 flex items-center gap-0.5">
                        <AlertCircle className="w-3 h-3" /> Required
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <UserIcon className={`w-4 h-4 absolute left-3.5 top-3.5 ${formErrors.name ? 'text-rose-500' : 'text-slate-400'}`} />
                    <input
                      type="text"
                      required
                      disabled={isRunning && customerName.trim().length >= 2}
                      placeholder={t.farmerNamePlaceholder}
                      value={customerName}
                      onChange={(e) => handleCustomerNameChange(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-colors ${
                        formErrors.name
                          ? 'border-rose-500 focus:border-rose-500 bg-rose-500/5 ring-1 ring-rose-500/30'
                          : isRunning && customerName.trim().length >= 2
                          ? 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 opacity-70 cursor-not-allowed select-none'
                          : 'bg-slate-50 dark:bg-black/40 border-slate-300 dark:border-white/10 focus:border-emerald-500'
                      }`}
                    />
                    {isRunning && customerName.trim().length >= 2 && (
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-3.5" />
                    )}
                  </div>
                  {formErrors.name && (
                    <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {formErrors.name}
                    </p>
                  )}
                </div>

                {/* Customer Phone */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t.farmerPhoneLabel} *
                    </label>
                    <div className="flex items-center gap-1.5">
                      {customerPhone.trim() && (
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            validateIndianMobile(customerPhone).isValid
                              ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15'
                              : 'text-rose-700 dark:text-rose-300 bg-rose-500/15'
                          }`}
                        >
                          {customerPhone.replace(/\D/g, '').length}/10 digits
                        </span>
                      )}
                      {formErrors.phone && (
                        <span className="text-[10px] font-bold text-rose-500 flex items-center gap-0.5">
                          <AlertCircle className="w-3 h-3" /> Invalid
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <Phone className={`w-4 h-4 absolute left-3.5 top-3.5 ${formErrors.phone ? 'text-rose-500' : 'text-slate-400'}`} />
                    <input
                      type="tel"
                      required
                      disabled={isRunning && validateIndianMobile(customerPhone).isValid}
                      placeholder="e.g. 98456 35265"
                      value={customerPhone}
                      onChange={(e) => handleCustomerPhoneChange(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-colors ${
                        formErrors.phone || (customerPhone.trim() && !validateIndianMobile(customerPhone).isValid)
                          ? 'border-rose-500 focus:border-rose-500 bg-rose-500/5 ring-1 ring-rose-500/30'
                          : isRunning && validateIndianMobile(customerPhone).isValid
                          ? 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 opacity-70 cursor-not-allowed select-none'
                          : 'bg-slate-50 dark:bg-black/40 border-slate-300 dark:border-white/10 focus:border-emerald-500'
                      }`}
                    />
                    {isRunning && validateIndianMobile(customerPhone).isValid && (
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-3.5" />
                    )}
                  </div>
                  {formErrors.phone && (
                    <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" /> {formErrors.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── 2. FIELD TYPE / IMPLEMENT SELECTION (SECOND) ── */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-[#1fa85a] dark:text-[#6df59a] text-xs font-bold flex items-center justify-center">2</span>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {t.implementLabel}
                  </label>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  {isRunning && <Lock className="w-3 h-3 text-amber-500" />}
                  Selected: {selectedWork}
                </span>
              </div>

              {/* Implement Chips (in order: Rotavator, Combine Harvest, Disc Cultivator, Laser Leveller, Spring Cultivator) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {workOptions.map((opt) => {
                  const isSelected = selectedWork === opt.id;
                  return (
                    <button
                      type="button"
                      key={opt.id}
                      disabled={isRunning}
                      onClick={() => {
                        setSelectedWork(opt.id);
                        setHourlyRate(opt.defaultRate);
                      }}
                      className={`h-10 px-3 rounded-xl border text-left transition-all font-sora text-xs font-semibold flex items-center gap-2 ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-sm ring-1 ring-emerald-500/30'
                          : 'bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                      } ${isRunning ? 'opacity-65 cursor-not-allowed' : ''}`}
                    >
                      <span className="text-base shrink-0">{opt.icon}</span>
                      <span className="truncate font-bold text-xs">{opt.label}</span>
                      {isRunning && isSelected && (
                        <Lock className="w-3 h-3 ml-auto text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Spring Cultivator Variants: 5 Spring, 9 Spring, and 13 Spring */}
              {selectedWork === 'Spring Cultivator' && (
                <div className="mt-2.5 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 animate-fadeIn space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-950 dark:text-emerald-300">
                      {t.springTinesLabel}:
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      {isRunning && <Lock className="w-3 h-3 text-amber-500" />}
                      5, 9 or 13 Spring Setup
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {springOptions.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        disabled={isRunning}
                        onClick={() => setSelectedTines(item.id)}
                        className={`h-9 px-2 rounded-lg border text-center transition-all flex items-center justify-center gap-1.5 ${
                          selectedTines === item.id
                            ? 'bg-[#1fa85a] text-neutral-950 font-bold border-emerald-600 shadow-sm'
                            : 'bg-white dark:bg-neutral-900 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-emerald-400'
                        } ${isRunning ? 'opacity-65 cursor-not-allowed' : ''}`}
                      >
                        <span className="text-xs font-bold font-sora">{item.label}</span>
                        <span className={`text-[10px] ${selectedTines === item.id ? 'text-emerald-950 font-semibold' : 'text-slate-400'}`}>
                          ({item.id} கொழு)
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── 3. AMOUNT, SEASON, LOCATION & DRIVER DETAILS (NEXT) ── */}
            <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-[#1fa85a] dark:text-[#6df59a] text-xs font-bold flex items-center justify-center">3</span>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Billing, Season, Location & Driver Details
                  </label>
                </div>
                {isRunning && (
                  <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                )}
              </div>

              {/* Row 1: Amount & Season */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Amount (Hourly Rate) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t.ratePerHour} (₹) *
                    </label>
                    <div className="flex gap-1">
                      {[850, 900, 1000, 1200, 1400].map((rate) => (
                        <button
                          type="button"
                          key={rate}
                          disabled={isRunning}
                          onClick={() => setHourlyRate(rate)}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono transition-all ${
                            hourlyRate === rate
                              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border border-emerald-500/40 font-bold'
                              : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          } ${isRunning ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          ₹{rate}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="relative">
                    <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="number"
                      min="1"
                      step="50"
                      required
                      disabled={isRunning}
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono font-bold ${
                        isRunning
                          ? 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 opacity-70 cursor-not-allowed select-none'
                          : 'bg-slate-50 dark:bg-black/40 border-slate-300 dark:border-white/10'
                      }`}
                    />
                    {isRunning && (
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-3.5" />
                    )}
                  </div>
                </div>

                {/* Season */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t.seasonLabel}
                  </label>
                  <div className="relative">
                    <Sparkles className="w-4 h-4 text-emerald-500 absolute left-3.5 top-3.5 pointer-events-none" />
                    <select
                      value={season}
                      disabled={isRunning}
                      onChange={(e) => setSeason(e.target.value)}
                      className={`w-full pl-10 pr-8 py-2.5 rounded-xl border text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-semibold ${
                        isRunning
                          ? 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 opacity-70 cursor-not-allowed select-none'
                          : 'bg-slate-50 dark:bg-black/40 border-slate-300 dark:border-white/10'
                      }`}
                    >
                      <option value="Samba (Main Season)">🌧️ Samba (சம்பா - Aug to Jan / Peak)</option>
                      <option value="Kuruvai (Summer)">☀️ Kuruvai (குறுவை - Jun to Sep)</option>
                      <option value="Navarai (Winter)">❄️ Navarai (நவரை - Dec to Mar)</option>
                      <option value="Kharif Season">🌱 Kharif (Monsoon Plowing)</option>
                      <option value="Rabi Season">🌾 Rabi (Winter Crops)</option>
                      <option value="Summer (Zaid)">🌻 Zaid / Summer Cultivation</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Row 2: Location & Driver Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Location */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t.locationLabel}
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      disabled={isRunning}
                      placeholder="e.g. Vadipatti West Field, Survey No. 42 (2.5 Acres)"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors ${
                        isRunning
                          ? 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 opacity-70 cursor-not-allowed select-none'
                          : 'bg-slate-50 dark:bg-black/40 border-slate-300 dark:border-white/10'
                      }`}
                    />
                    {isRunning && (
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-3.5" />
                    )}
                  </div>
                </div>

                {/* Driver Details */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>{t.driverNameLabel}</span>
                    {currentUser?.role === 'Driver' && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Assigned Operator
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <Tractor className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      type="text"
                      disabled={isRunning || currentUser?.role === 'Driver'}
                      list="fleet-drivers-datalist"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      placeholder="Select or enter driver name..."
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors font-medium ${
                        isRunning || currentUser?.role === 'Driver'
                          ? 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 opacity-80 cursor-not-allowed select-none'
                          : 'bg-slate-50 dark:bg-black/40 border-slate-300 dark:border-white/10'
                      }`}
                    />
                    <datalist id="fleet-drivers-datalist">
                      {fleetDrivers.map((d) => (
                        <option key={d.id || d._id} value={d.name}>
                          {d.assignedTractor} • {d.status}
                        </option>
                      ))}
                    </datalist>
                    {(isRunning || currentUser?.role === 'Driver') && (
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-3.5" />
                    )}
                  </div>
                  {currentUser?.role === 'Driver' && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                      🔒 Operator locked to logged-in driver ({currentUser.name})
                    </p>
                  )}
                </div>
              </div>

              {/* Extra Field Notes (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t.notesLabel}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled={isRunning}
                    placeholder={t.notesPlaceholder}
                    value={fieldNotes}
                    onChange={(e) => setFieldNotes(e.target.value)}
                    className={`w-full px-4 py-2 rounded-xl border text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors ${
                      isRunning
                        ? 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 opacity-70 cursor-not-allowed select-none'
                        : 'bg-slate-50 dark:bg-black/40 border-slate-300 dark:border-white/10'
                    }`}
                  />
                  {isRunning && (
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-3" />
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Work Duration Tracker & Live Billing (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Digital Timer Card - Compact, High-Density & Modern */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-xl shadow-sm text-center relative overflow-hidden">
            {/* Top Status Header */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                {t.workTimer}
              </span>

              {/* Dynamic Status Badge */}
              {workEnded ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  {t.workEnded}
                </span>
              ) : isRunning ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
                  {t.timerRunning}
                </span>
              ) : totalEffectiveSeconds > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  <Pause className="w-3 h-3 text-amber-500" />
                  Paused
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-white/5 text-slate-500 border border-slate-200 dark:border-white/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  {t.timerStopped}
                </span>
              )}
            </div>

            {/* Compact Digital Clock Display */}
            <div className="py-1">
              <div className="font-sora font-extrabold text-3xl sm:text-4xl text-slate-900 dark:text-white tracking-widest tabular-nums drop-shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                {formatDigitalTime(totalEffectiveSeconds)}
              </div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
                {hoursDisplay}h {minsDisplay}m {t.effectiveDuration.toLowerCase()} • ₹{hourlyRate}/hr
              </div>
            </div>

            {/* Three Operation Buttons: Start Work | Stop Work | End Work */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              {/* 1. Start Work */}
              <button
                type="button"
                onClick={handleStartTimer}
                disabled={isRunning}
                className={`py-2.5 px-2 rounded-xl font-sora font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all shadow-sm ${
                  isRunning
                    ? 'bg-emerald-500/15 text-emerald-800/40 dark:text-emerald-300/30 cursor-not-allowed border border-emerald-500/20'
                    : 'bg-[#1fa85a] hover:bg-[#198d4b] text-white active:scale-95 shadow-emerald-500/25 ring-1 ring-emerald-400/30'
                }`}
                title={
                  !customerName.trim() || !validateIndianMobile(customerPhone).isValid
                    ? '⚠️ Please enter Farmer Name & valid 10-digit Phone before starting work'
                    : 'Start field work timer'
                }
              >
                <Play className={`w-3.5 h-3.5 ${isRunning ? 'fill-emerald-800/40 dark:fill-emerald-300/30' : 'fill-white'}`} />
                <span className="truncate">{t.startWork}</span>
              </button>

              {/* 2. Stop Work */}
              <button
                type="button"
                onClick={handleStopTimer}
                disabled={!isRunning}
                className={`py-2.5 px-2 rounded-xl font-sora font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all shadow-sm ${
                  !isRunning
                    ? 'bg-amber-500/10 text-amber-700/40 dark:text-amber-300/30 cursor-not-allowed border border-amber-500/15'
                    : 'bg-amber-500 hover:bg-amber-600 text-neutral-950 active:scale-95 shadow-amber-500/20'
                }`}
                title="Pause field work timer"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span className="truncate">{t.stopWork}</span>
              </button>

              {/* 3. End Work */}
              <button
                type="button"
                onClick={handleEndWork}
                disabled={totalEffectiveSeconds <= 0}
                className={`py-2.5 px-2 rounded-xl font-sora font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all shadow-sm ${
                  totalEffectiveSeconds <= 0
                    ? 'bg-rose-500/10 text-rose-700/40 dark:text-rose-300/30 cursor-not-allowed border border-rose-500/15'
                    : workEnded
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 shadow-md'
                    : 'bg-rose-500 hover:bg-rose-600 text-white active:scale-95 shadow-rose-500/20'
                }`}
                title="Finish and lock work session to generate invoice"
              >
                {workEnded ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Square className="w-3.5 h-3.5 fill-white" />
                )}
                <span className="truncate">{t.endWork}</span>
              </button>
            </div>

            {/* Farmer Details Required Alert Indicator */}
            {!isRunning && (!customerName.trim() || !validateIndianMobile(customerPhone).isValid) && (
              <div className="mt-2 text-center animate-fadeIn">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  <Lock className="w-3 h-3" />
                  {customerPhone.replace(/\D/g, '').length > 10
                    ? `⚠️ Invalid mobile: ${customerPhone.replace(/\D/g, '').length} digits (must be exactly 10 digits)`
                    : 'Farmer Name & valid 10-digit Contact Number required to start work'}
                </span>
              </div>
            )}

            {/* Bottom Row: Manual Duration & Reset */}
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium">{t.orManualTime}:</span>
                <input
                  type="number"
                  min="0"
                  max="24"
                  placeholder="0"
                  disabled={isRunning || timerSeconds > 0}
                  value={manualHours}
                  onChange={(e) => {
                    setManualHours(e.target.value);
                    setWorkEnded(false);
                  }}
                  className={`w-12 px-1.5 py-1 rounded-lg border text-center text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-emerald-500 ${
                    isRunning || timerSeconds > 0
                      ? 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 opacity-60 cursor-not-allowed'
                      : 'bg-slate-50 dark:bg-black/40 border-slate-300 dark:border-white/10'
                  }`}
                />
                <span className="text-[11px]">{t.hours}</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="0"
                  disabled={isRunning || timerSeconds > 0}
                  value={manualMins}
                  onChange={(e) => {
                    setManualMins(e.target.value);
                    setWorkEnded(false);
                  }}
                  className={`w-12 px-1.5 py-1 rounded-lg border text-center text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-emerald-500 ${
                    isRunning || timerSeconds > 0
                      ? 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 opacity-60 cursor-not-allowed'
                      : 'bg-slate-50 dark:bg-black/40 border-slate-300 dark:border-white/10'
                  }`}
                />
                <span className="text-[11px]">{t.minutes}</span>
              </div>

              <button
                type="button"
                onClick={handleResetTimer}
                disabled={isRunning}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors ${
                  isRunning
                    ? 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400 opacity-50 cursor-not-allowed'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={t.resetTimer}
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t.resetTimer}</span>
              </button>
            </div>
          </div>

          {/* Live Bill Summary Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="font-sora font-bold text-sm text-slate-900 dark:text-white">{t.calculationSummary}</h3>
              </div>
              {isRunning && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                  AUTO RECALCULATING
                </span>
              )}
            </div>

            <div className="space-y-2 text-xs">
              {customerName && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>{t.farmerNameLabel}:</span>
                  <strong className="text-slate-900 dark:text-white font-medium truncate max-w-[180px]">
                    {customerName}
                  </strong>
                </div>
              )}
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>{t.implementLabel}:</span>
                <strong className="text-slate-900 dark:text-white font-medium">
                  {selectedWork} {selectedWork === 'Spring Cultivator' ? `(${selectedTines} Spring)` : ''}
                </strong>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>{t.seasonLabel}:</span>
                <strong className="text-emerald-700 dark:text-emerald-400 font-medium truncate max-w-[180px]">{season}</strong>
              </div>
              {location && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>{t.locationLabel}:</span>
                  <strong className="text-slate-900 dark:text-white font-medium truncate max-w-[180px]">{location}</strong>
                </div>
              )}
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>{t.driverNameLabel}:</span>
                <strong className="text-slate-900 dark:text-white font-medium">{driverName}</strong>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>{t.effectiveDuration}:</span>
                <strong className="text-slate-900 dark:text-white font-medium">{hoursDisplay} {t.hours} {minsDisplay} {t.minutes}</strong>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>{t.ratePerHour}:</span>
                <strong className="text-slate-900 dark:text-white font-medium">₹{hourlyRate} / hr</strong>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-baseline justify-between">
              <span className="font-sora font-semibold text-sm text-slate-700 dark:text-slate-300">{t.totalPayable}:</span>
              <span className="font-sora font-extrabold text-3xl text-amber-600 dark:text-gold-400 tabular-nums">
                ₹{totalCalculatedAmount.toLocaleString()}
              </span>
            </div>

            {/* Payment Status Picker */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{t.paymentStatus}:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={() => setPaymentStatus('Pending')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    paymentStatus === 'Pending'
                      ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 shadow-sm'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  } ${isRunning ? 'opacity-65 cursor-not-allowed' : ''}`}
                >
                  {t.pending}
                </button>
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={() => setPaymentStatus('Paid')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    paymentStatus === 'Paid'
                      ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 shadow-sm'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  } ${isRunning ? 'opacity-65 cursor-not-allowed' : ''}`}
                >
                  {t.paid}
                </button>
              </div>
            </div>

            {/* Auto-SMS on Session End Toggle Switch */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center justify-between gap-3 transition-colors shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    autoSendCustomer
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-200 dark:bg-white/10 text-slate-400'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      Auto-SMS on End Work
                    </span>
                    {autoSendCustomer ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 font-mono">
                        SMS ON
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-500 font-mono">
                        OFF
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {customerPhone.trim()
                      ? `Directly sends official SMS invoice to ${getCleanIndianPhone(customerPhone).formattedDisplay || customerPhone.trim()}`
                      : 'Directly dispatches official SMS invoice to customer on End Work'}
                  </p>
                </div>
              </div>

              {/* Modern Toggle Switch */}
              <button
                type="button"
                onClick={() => setAutoSendCustomer(!autoSendCustomer)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  autoSendCustomer ? 'bg-[#1fa85a]' : 'bg-slate-300 dark:bg-neutral-700'
                }`}
                role="switch"
                aria-checked={autoSendCustomer}
                title="Toggle direct SMS invoice dispatch to customer on End Work"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    autoSendCustomer ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Submit / Generate Invoice Button - Enforces 'End Work' first */}
            {!workEnded ? (
              <div className="space-y-1.5 pt-1">
                <button
                  type="button"
                  onClick={handleSubmitBill}
                  className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-300 dark:border-white/15 text-slate-500 dark:text-slate-400 font-sora font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer group"
                >
                  <Lock className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                  <span>Click &quot;{t.endWork}&quot; Above to Unlock Invoice</span>
                </button>
                <p className="text-[11px] text-center text-amber-600 dark:text-amber-400/90 font-medium">
                  {t.pleaseEndWorkFirst}
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSubmitBill}
                className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-[#1fa85a] to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-sora font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 transition-all active:scale-[0.99]"
              >
                <Save className="w-4 h-4 text-white" />
                <span>Save Invoice</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewBillSection;
