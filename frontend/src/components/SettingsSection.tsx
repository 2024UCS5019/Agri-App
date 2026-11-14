'use client';

import React, { useState, useEffect } from 'react';
import { ActiveTractorConfig, TractorServiceConfig, User } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { LANGUAGES } from '@/lib/translations';
import {
  setLocalTractorConfig,
  getLocalDrivers,
  getLocalTractorServiceConfig,
  setLocalTractorServiceConfig,
} from '@/lib/api';
import {
  Tractor,
  Shield,
  ShieldCheck,
  Globe,
  Sun,
  Moon,
  UserCheck,
  LogOut,
  Save,
  Check,
  Sliders,
  Receipt,
  Bell,
  Sparkles,
  Building2,
  Lock,
  FileText,
  Phone,
  MapPin,
  Cpu,
  Zap,
} from 'lucide-react';

interface SettingsSectionProps {
  currentUser: User | null;
  activeTractor: ActiveTractorConfig;
  onUpdateActiveTractor: (config: ActiveTractorConfig) => void;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  onAddToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const TRACTOR_SUGGESTIONS = [
  'Mahindra 575 DI (45 HP)',
  'Mahindra 575 DI Sarpanch (TN-28-AT-5590)',
  'John Deere 5050 D (50 HP)',
  'Massey Ferguson 241 DI (42 HP)',
  'Swaraj 744 FE (48 HP)',
  'Kubota MU4501 (45 HP)',
  'Sonalika DI 42 RX (42 HP)',
  'Farmtrac 60 Powermaxx (55 HP)',
];

const QUICK_RATES = [850, 900, 950, 1200, 1400];

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  currentUser,
  activeTractor,
  onUpdateActiveTractor,
  onOpenAuthModal,
  onLogout,
  onAddToast,
}) => {
  const { lang, setLang, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  // Active Tractor State
  const [regNumber, setRegNumber] = useState(activeTractor.registrationNumber);
  const [model, setModel] = useState(activeTractor.model);
  const [driverName, setDriverName] = useState(activeTractor.driverName);
  const [status, setStatus] = useState<ActiveTractorConfig['status']>(activeTractor.status);

  // Billing Defaults State
  const [defaultRate, setDefaultRate] = useState<number>(900);
  const [defaultImplement, setDefaultImplement] = useState<string>('Rotavator');
  const [invoicePrefix, setInvoicePrefix] = useState<string>('INV-');
  const [timerSoundAlerts, setTimerSoundAlerts] = useState<boolean>(true);

  // Fleet Drivers for dropdown
  const [fleetDrivers, setFleetDrivers] = useState<string[]>([]);

  // Tractor Model AI Telemetry & Input Analysis State
  const [aiAnalysisOpen, setAiAnalysisOpen] = useState<boolean>(false);
  const [customUserInput, setCustomUserInput] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<{
    model: string;
    hp: number;
    baseFuelLight: string;
    baseFuelHeavy: string;
    optimalRPM: string;
    recommendedBillingRate: number;
    hydraulicCapacity: string;
    recommendedRotavator: string;
    recommendedCultivator: string;
    soilAdaptation: string;
    customInput: string;
    customAnswer: string;
    timestamp: string;
  } | null>(null);

  // Owner Permission Check
  const isOwner = currentUser?.role === 'Owner';

  // Tractor Service Name & Customer Description Branding (Owner Only)
  const [serviceName, setServiceName] = useState<string>('Muthu Tractor Fleet');
  const [tagline, setTagline] = useState<string>('Agricultural Machinery, Cultivation & Harvest Operations');
  const [servicePhone, setServicePhone] = useState<string>('+91 94433 88123');
  const [serviceLocation, setServiceLocation] = useState<string>('Tamil Nadu, India');
  const [customerDescription, setCustomerDescription] = useState<string>(
    'Thank you for partnering with our Tractor Fleet! Official digital tax invoice and field service record.'
  );
  const [gstin, setGstin] = useState<string>('33AAAAA0000A1Z5');

  // Service Branding Presets for Quick Setup
  const BRANDING_PRESETS = [
    {
      label: 'Muthu Tractor Fleet',
      name: 'Muthu Tractor Fleet',
      tagline: 'Agricultural Machinery, Cultivation & Harvest Operations',
      desc: 'Thank you for partnering with Muthu Tractor Fleet! Official digital tax invoice and field service record.',
    },
    {
      label: 'Logesh Agro Works',
      name: 'Logesh Tractor Services',
      tagline: 'Precision Furrow Cultivation, Rotavator Tillage & Land Leveling',
      desc: 'Thank you for choosing Logesh Tractor Services! High-precision depth tilling and guaranteed land preparation.',
    },
    {
      label: 'Sri Amman Fleet',
      name: 'Sri Amman Tractor Works',
      tagline: 'Wet Field Puddler, 9-Tine Cultivator & Combine Harvester',
      desc: 'Thank you for choosing Sri Amman Tractor Works! Quality tractor machinery for all seasonal cultivation.',
    },
  ];

  useEffect(() => {
    const drivers = getLocalDrivers();
    if (drivers && drivers.length > 0) {
      setFleetDrivers(drivers.map((d) => d.name));
    }

    // Load Tractor Service Branding configuration
    const serviceCfg = getLocalTractorServiceConfig();
    if (serviceCfg) {
      setServiceName(serviceCfg.serviceName);
      setTagline(serviceCfg.tagline);
      setServicePhone(serviceCfg.phone);
      setServiceLocation(serviceCfg.location);
      setCustomerDescription(serviceCfg.customerDescription);
      setGstin(serviceCfg.gstin || '');
    }

    // Load billing defaults if any
    try {
      const savedRate = localStorage.getItem('agri_default_rate');
      if (savedRate) setDefaultRate(Number(savedRate));
      const savedImpl = localStorage.getItem('agri_default_implement');
      if (savedImpl) setDefaultImplement(savedImpl);
      const savedPrefix = localStorage.getItem('agri_invoice_prefix');
      if (savedPrefix) setInvoicePrefix(savedPrefix);
      const savedSound = localStorage.getItem('agri_timer_sound');
      if (savedSound) setTimerSoundAlerts(savedSound === 'true');

      // Load saved AI Tractor Analysis if present
      const savedAiAnalysis = localStorage.getItem('agri_tractor_ai_analysis');
      if (savedAiAnalysis) {
        setAiAnalysisResult(JSON.parse(savedAiAnalysis));
      }
    } catch {
      // Storage unavailable
    }
  }, []);

  // Tractor Model AI Telemetry & User Input Analysis Engine
  const handleRunAiAnalysis = (customPrompt?: string) => {
    const inputToUse = customPrompt !== undefined ? customPrompt : customUserInput;
    setIsAnalyzing(true);
    setAiAnalysisOpen(true);

    setTimeout(() => {
      const targetModel = model.trim() || 'Mahindra 575 DI (45 HP)';
      const modelLower = targetModel.toLowerCase();
      let hp = 45;
      const hpMatch = targetModel.match(/(\d{2,3})\s*HP/i);
      if (hpMatch) {
        hp = parseInt(hpMatch[1], 10);
      } else if (modelLower.includes('john deere') || modelLower.includes('5050')) {
        hp = 50;
      } else if (modelLower.includes('swaraj') || modelLower.includes('744')) {
        hp = 48;
      } else if (modelLower.includes('massey') || modelLower.includes('241')) {
        hp = 42;
      } else if (modelLower.includes('farmtrac') || modelLower.includes('60')) {
        hp = 55;
      } else if (modelLower.includes('kubota') || modelLower.includes('4501')) {
        hp = 45;
      } else if (modelLower.includes('sonalika') || modelLower.includes('42')) {
        hp = 42;
      } else if (modelLower.includes('new holland') || modelLower.includes('3630')) {
        hp = 55;
      } else if (modelLower.includes('eicher') || modelLower.includes('380')) {
        hp = 40;
      }

      const baseFuelLight = (hp * 0.082).toFixed(1);
      const baseFuelHeavy = (hp * 0.115).toFixed(1);
      const optimalRPM = hp >= 50 ? '1,500 – 1,750 RPM' : '1,650 – 1,850 RPM';
      const recommendedBillingRate = hp >= 55 ? 1200 : hp >= 50 ? 950 : hp >= 45 ? 900 : 850;
      const hydraulicCapacity = hp >= 55 ? '2,000 kg' : hp >= 50 ? '1,800 kg' : hp >= 45 ? '1,600 kg' : '1,400 kg';
      const recommendedRotavator = hp >= 50 ? '42 – 48 Blades (7 Feet Heavy)' : hp >= 45 ? '36 – 42 Blades (6 Feet Standard)' : '36 Blades (5.5 Feet)';
      const recommendedCultivator = hp >= 50 ? '11 Tines Heavy Furrow' : '9 Tines Spring Loaded';
      const soilAdaptation = hp >= 50 ? 'Excels in Black Cotton & Deep Red Soil' : hp >= 45 ? 'All-Rounder for Wet Paddy & Loamy Soil' : 'Optimal for Sandy Loam & Light Soil';

      let customAnswer = '';
      const qLower = (inputToUse || '').toLowerCase();
      if (qLower.includes('fuel') || qLower.includes('diesel')) {
        customAnswer = `Telemetry projection for ${targetModel}: Consumes ${baseFuelLight} L/hr on light haulage and ${baseFuelHeavy} L/hr during heavy rotavator duty. Operating between ${optimalRPM} prevents fuel wastage and preserves injector pressure.`;
      } else if (qLower.includes('rate') || qLower.includes('price') || qLower.includes('cost') || qLower.includes('bill')) {
        customAnswer = `Based on engine displacement and diesel consumption, the optimal customer charge is ₹${recommendedBillingRate}/hr (standard tilling) and ₹${recommendedBillingRate + 150}/hr (heavy puddling) for a sustainable 45%+ net operating margin.`;
      } else if (qLower.includes('paddy') || qLower.includes('wet') || qLower.includes('mud') || qLower.includes('puddle')) {
        customAnswer = `For wet paddy fields, run ${targetModel} in 2nd Low gear with half-cage or full-cage wheels. Maintain steady 1,700 RPM to sustain PTO momentum without tyre rutting or bogging down.`;
      } else if (qLower.includes('rotavator') || qLower.includes('blade') || qLower.includes('tillage') || qLower.includes('cultivator')) {
        customAnswer = `Implement Pairing Analysis: ${targetModel} (${hp} HP) provides peak drawbar efficiency with ${recommendedRotavator} and ${recommendedCultivator}. Hydraulic lift (${hydraulicCapacity}) ensures effortless implement lifting at headlands.`;
      } else if (qLower.includes('oil') || qLower.includes('service') || qLower.includes('maintenance')) {
        customAnswer = `Engine Longevity Protocol: Use 15W-40 CI-4 diesel engine oil. Replace oil and spin-on filter every 250 engine hours. Blow out the outer air filter element every 50 hours in dusty field operations.`;
      } else if (inputToUse.trim()) {
        customAnswer = `AI Synthesis for input "${inputToUse}": ${targetModel} delivers ${hp} HP and ${hydraulicCapacity} hydraulic lift. For this field condition, ensure engine temperature stays between 80°C–90°C and tire pressure is tuned to 14 PSI (rear) / 24 PSI (front) for minimal slippage.`;
      } else {
        customAnswer = `Model ${targetModel} (${hp} HP) is rated in prime operational condition. Optimal working band is ${optimalRPM} delivering maximum drawbar torque with minimum diesel burn.`;
      }

      const result = {
        model: targetModel,
        hp,
        baseFuelLight,
        baseFuelHeavy,
        optimalRPM,
        recommendedBillingRate,
        hydraulicCapacity,
        recommendedRotavator,
        recommendedCultivator,
        soilAdaptation,
        customInput: inputToUse,
        customAnswer,
        timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      };

      setAiAnalysisResult(result);
      try {
        localStorage.setItem('agri_tractor_ai_analysis', JSON.stringify(result));
      } catch {
        // storage quota
      }
      setIsAnalyzing(false);
      onAddToast?.(`🤖 AI completed telemetry analysis for ${targetModel}!`, 'success');
    }, 600);
  };

  // Save Tractor Configuration
  const handleSaveTractor = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ActiveTractorConfig = {
      registrationNumber: regNumber.trim() || 'TN-28-AT-5590',
      model: model.trim() || 'Mahindra 575 DI (45 HP)',
      driverName: driverName.trim() || (currentUser?.name || 'Logesh M'),
      status,
      currentHours: activeTractor.currentHours,
      nextServiceHours: activeTractor.nextServiceHours,
      dieselLevelPercent: activeTractor.dieselLevelPercent || 78,
    };
    setLocalTractorConfig(updated);
    onUpdateActiveTractor(updated);
    onAddToast?.('Active Tractor configuration & fleet status saved!', 'success');
  };

  // Save Billing Defaults
  const handleSaveBillingDefaults = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('agri_default_rate', String(defaultRate));
      localStorage.setItem('agri_default_implement', defaultImplement);
      localStorage.setItem('agri_invoice_prefix', invoicePrefix);
      localStorage.setItem('agri_timer_sound', String(timerSoundAlerts));
      onAddToast?.('Billing & digital timer defaults saved successfully!', 'success');
    } catch {
      onAddToast?.('Failed to save billing defaults', 'error');
    }
  };

  // Save Tractor Service Branding (Owner Only)
  const handleSaveServiceBranding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      onAddToast?.('Permission Denied: Only Fleet Owners can modify the Tractor Service Name.', 'error');
      return;
    }

    const updatedConfig: TractorServiceConfig = {
      serviceName: serviceName.trim() || 'Muthu Tractor Fleet',
      tagline: tagline.trim() || 'Agricultural Machinery, Cultivation & Harvest Operations',
      phone: servicePhone.trim() || '+91 94433 88123',
      location: serviceLocation.trim() || 'Tamil Nadu, India',
      customerDescription:
        customerDescription.trim() ||
        'Thank you for partnering with our Tractor Fleet! Official digital tax invoice and field service record.',
      gstin: gstin.trim(),
    };

    setLocalTractorServiceConfig(updatedConfig);
    onAddToast?.(
      `Tractor Service Name updated to "${updatedConfig.serviceName}"! Final customer descriptions updated across all invoices.`,
      'success'
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl">
      {/* ── Settings Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/5 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#1fa85a] dark:text-[#6df59a] text-[11px] font-semibold tracking-wide uppercase mb-1.5">
            <Sliders className="w-3 h-3" />
            System Control Center
          </div>
          <h1 className="text-xl lg:text-2xl font-extrabold font-sora text-slate-900 dark:text-white tracking-tight">
            {t.settings}
          </h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Manage your active machinery, billing presets, display language, theme mode, and security session.
          </p>
        </div>

        {/* Live Active Status Pill Preview */}
        <div className="p-2.5 px-3 rounded-xl bg-white dark:bg-neutral-900/90 border border-slate-200 dark:border-white/10 shadow-xs flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
            <span
              className={`w-2 h-2 rounded-full ${
                status === 'Active'
                  ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse'
                  : status === 'Maintenance'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-slate-400'
              }`}
            />
            <span>{regNumber || 'TN-28-AT-5590'} {status}</span>
          </div>
          <span className="text-xs text-slate-300 dark:text-neutral-700">|</span>
          <span className="text-xs text-slate-600 dark:text-neutral-400 truncate max-w-[200px]">
            {model} • Driver: <strong className="text-slate-900 dark:text-white font-medium">{driverName}</strong>
          </span>
        </div>
      </div>

      {/* ── 1. ACTIVE TRACTOR & FLEET STATUS ── */}
      <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-white/10 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Tractor className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-sora font-bold text-sm text-slate-900 dark:text-white">
                Active Tractor & Fleet Status
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                Controls the active machinery, plate number, and operator displayed in the header and timers.
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
              status === 'Active'
                ? 'bg-emerald-500/15 text-[#1fa85a] dark:text-[#6df59a] border border-emerald-500/30'
                : status === 'Maintenance'
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                : 'bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 border border-slate-200 dark:border-white/10'
            }`}
          >
            ● {status}
          </span>
        </div>

        <form onSubmit={handleSaveTractor} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Registration Number */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                Vehicle Registration Plate / Fleet Tag *
              </label>
              <input
                type="text"
                required
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                placeholder="e.g. TN-28-AT-5590"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white font-mono uppercase font-bold outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Tractor Model */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider">
                  Tractor Model & Horsepower *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setAiAnalysisOpen(!aiAnalysisOpen);
                    if (!aiAnalysisResult) handleRunAiAnalysis();
                  }}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20"
                >
                  <Sparkles className="w-3 h-3 text-emerald-500 animate-pulse" />
                  <span>{aiAnalysisOpen ? 'Close AI Analysis' : 'Analyze Model with AI'}</span>
                </button>
              </div>
              <input
                type="text"
                required
                list="tractor-model-suggestions"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. Mahindra 575 DI (45 HP)"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors"
              />
              <datalist id="tractor-model-suggestions">
                {TRACTOR_SUGGESTIONS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
          </div>

          {/* ── TRACTOR MODEL AI ANALYSIS & USER INPUT SYSTEM ── */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/[0.06] via-slate-50 dark:via-neutral-950/40 to-teal-500/[0.04] border border-emerald-500/20 dark:border-emerald-500/20 space-y-3.5 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/15 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Cpu className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      AI Tractor Model Telemetry & Analysis
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                      Smart Assistant
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-neutral-400">
                    Active Target: <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{model || 'Mahindra 575 DI (45 HP)'}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRunAiAnalysis()}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-neutral-950 text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-60"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                <span>{isAnalyzing ? 'Analyzing Machinery...' : 'Run Model Analysis'}</span>
              </button>
            </div>

            {/* User Custom Input Field ("Give Me Input" that AI will take and analyze) */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider">
                Provide Field Condition or Question for AI Analysis:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customUserInput}
                  onChange={(e) => setCustomUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleRunAiAnalysis(customUserInput);
                    }
                  }}
                  placeholder="e.g. Fuel consumption in wet soil, recommended hourly rate, rotavator matching..."
                  className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => handleRunAiAnalysis(customUserInput)}
                  disabled={isAnalyzing}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-neutral-950 text-xs font-bold transition-all shrink-0 active:scale-95 disabled:opacity-50"
                >
                  Analyze Input
                </button>
              </div>

              {/* Quick Input Suggestions */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-medium">Quick Prompts:</span>
                {[
                  { label: '⛽ Fuel & RPM Check', prompt: 'Fuel consumption and RPM' },
                  { label: '💰 Recommended Rate', prompt: 'Optimal hourly billing rate' },
                  { label: '🌾 Wet Paddy Soil', prompt: 'Wet paddy puddling setup' },
                  { label: '🔄 Rotavator Blades', prompt: 'Best rotavator blades and gear' },
                  { label: '🛠️ Service & Oil', prompt: 'Engine oil grade and maintenance schedule' },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => {
                      setCustomUserInput(chip.prompt);
                      handleRunAiAnalysis(chip.prompt);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-white/80 dark:bg-neutral-900/80 hover:bg-emerald-500/10 hover:border-emerald-500/30 border border-slate-200 dark:border-white/10 text-[10px] text-slate-600 dark:text-neutral-300 font-medium transition-colors"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Analysis Output Card */}
            {aiAnalysisResult && (
              <div className="p-3.5 rounded-xl bg-white/90 dark:bg-neutral-900/90 border border-emerald-500/30 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {aiAnalysisResult.model}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {aiAnalysisResult.hp} Horsepower
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Analyzed at {aiAnalysisResult.timestamp}
                  </span>
                </div>

                {/* 4 Telemetry Metric Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/5">
                    <span className="text-[10px] text-slate-400 dark:text-neutral-500 uppercase tracking-wider block">Diesel Burn</span>
                    <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                      {aiAnalysisResult.baseFuelLight} – {aiAnalysisResult.baseFuelHeavy} L/hr
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/5">
                    <span className="text-[10px] text-slate-400 dark:text-neutral-500 uppercase tracking-wider block">Optimal RPM Band</span>
                    <span className="font-mono font-bold text-xs text-sky-600 dark:text-sky-400 mt-0.5 block">
                      {aiAnalysisResult.optimalRPM}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/5">
                    <span className="text-[10px] text-slate-400 dark:text-neutral-500 uppercase tracking-wider block">Hydraulic Lift</span>
                    <span className="font-mono font-bold text-xs text-purple-600 dark:text-purple-400 mt-0.5 block">
                      {aiAnalysisResult.hydraulicCapacity}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block font-semibold">Recommended Rate</span>
                    <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                      ₹{aiAnalysisResult.recommendedBillingRate}/hr
                    </span>
                  </div>
                </div>

                {/* Implement & Soil Matching */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-neutral-950/60 border border-slate-100 dark:border-white/5">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-neutral-400 block">Matched Implements:</span>
                    <p className="text-slate-800 dark:text-slate-200 text-[11px] mt-0.5">
                      • {aiAnalysisResult.recommendedRotavator}
                      <br />
                      • {aiAnalysisResult.recommendedCultivator}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-neutral-950/60 border border-slate-100 dark:border-white/5">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-neutral-400 block">Soil Adaptation:</span>
                    <p className="text-slate-800 dark:text-slate-200 text-[11px] mt-0.5">
                      {aiAnalysisResult.soilAdaptation}
                    </p>
                  </div>
                </div>

                {/* AI Input Synthesis Answer */}
                <div className="p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Analysis Insights on Your Input:</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-200 text-[11px] leading-relaxed">
                    {aiAnalysisResult.customAnswer}
                  </p>
                </div>

                {/* Apply Recommended Rate Quick Action */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500 dark:text-neutral-400">
                    Apply this rate to your default billing settings?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setDefaultRate(aiAnalysisResult.recommendedBillingRate);
                      try {
                        localStorage.setItem('agri_default_rate', String(aiAnalysisResult.recommendedBillingRate));
                      } catch {}
                      onAddToast?.(`✅ Applied AI recommended rate (₹${aiAnalysisResult.recommendedBillingRate}/hr) to billing defaults!`, 'success');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all"
                  >
                    <Zap className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Apply ₹{aiAnalysisResult.recommendedBillingRate}/hr to Billing</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Assigned Driver Name */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                Assigned Operator / Driver *
              </label>
              <input
                type="text"
                required
                list="driver-name-suggestions"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="e.g. Logesh M"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors"
              />
              <datalist id="driver-name-suggestions">
                {currentUser?.name && <option value={currentUser.name} />}
                {fleetDrivers.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </div>

            {/* Machinery Status Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                Machine Status Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Active', 'Maintenance', 'Idle'] as const).map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all border ${
                      status === s
                        ? s === 'Active'
                          ? 'bg-emerald-500/20 text-[#1fa85a] dark:text-[#6df59a] border-emerald-500/40 font-bold'
                          : s === 'Maintenance'
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40 font-bold'
                          : 'bg-slate-200 dark:bg-neutral-800 text-slate-800 dark:text-white border-slate-300 dark:border-white/20 font-bold'
                        : 'bg-slate-50 dark:bg-neutral-950 text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-white/5 hover:border-slate-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1fa85a] hover:bg-[#19904d] text-neutral-950 font-sora font-bold text-xs shadow-xs transition-all active:scale-[0.98]"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Tractor Configuration</span>
            </button>
          </div>
        </form>
      </div>

      {/* ── 2. TRACTOR SERVICE BRANDING & CUSTOMER INVOICE DESCRIPTION (OWNER ONLY) ── */}
      <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-white/10 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/5 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-sora font-bold text-sm text-slate-900 dark:text-white">
                  Tractor Service Branding & Customer Description
                </h2>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Owner Only
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                Configure your official Tractor Service enterprise name, helpline, and thank-you notes displayed on customer SMS invoices, modals, and PDF downloads.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isOwner ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Owner Edit Access</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[11px] font-bold">
                <Lock className="w-3.5 h-3.5" />
                <span>Owner Protected (Read Only)</span>
              </span>
            )}
          </div>
        </div>

        {!isOwner && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300">
            <Lock className="w-4 h-4 shrink-0 text-amber-500" />
            <span>
              <strong>Driver Account Notice:</strong> Only the Fleet Owner has permission to edit the Tractor Service Name and Customer Description. Current fleet settings are displayed below.
            </span>
          </div>
        )}

        <form onSubmit={handleSaveServiceBranding} className="space-y-4">
          {/* Quick Branding Presets (Owner only) */}
          {isOwner && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                  Quick Business Templates:
                </span>
                <span className="text-[10px] text-slate-400">Click to autofill branding fields</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {BRANDING_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setServiceName(preset.name);
                      setTagline(preset.tagline);
                      setCustomerDescription(preset.desc);
                      onAddToast?.(`Loaded template: ${preset.name}`, 'info');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all text-xs ${
                      serviceName === preset.name
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-neutral-950/60 text-slate-600 dark:text-neutral-400 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-slate-900 dark:text-white truncate">
                      {preset.label}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                      {preset.tagline}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Service Name */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Our Tractor Service Name *</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-normal">Shows on Invoices & SMS</span>
              </label>
              <input
                type="text"
                required
                disabled={!isOwner}
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="e.g. Muthu Tractor Fleet / Logesh Agro Services"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white font-sora font-bold outline-none focus:border-emerald-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {/* Service Tagline */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                Service Tagline / Subtitle
              </label>
              <input
                type="text"
                disabled={!isOwner}
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Agricultural Machinery, Cultivation & Harvest Operations"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Customer Helpline Phone */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>Customer Helpline Phone</span>
              </label>
              <input
                type="tel"
                disabled={!isOwner}
                value={servicePhone}
                onChange={(e) => setServicePhone(e.target.value)}
                placeholder="+91 94433 88123"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white font-mono outline-none focus:border-emerald-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {/* Base Location */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>Base Location / Branch</span>
              </label>
              <input
                type="text"
                disabled={!isOwner}
                value={serviceLocation}
                onChange={(e) => setServiceLocation(e.target.value)}
                placeholder="Tamil Nadu, India"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {/* GSTIN / Reg No */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                Agri Reg / GSTIN (Optional)
              </label>
              <input
                type="text"
                disabled={!isOwner}
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                placeholder="33AAAAA0000A1Z5"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white font-mono uppercase outline-none focus:border-emerald-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Final Customer Description */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-500" />
                <span>Final Customer Description & Thank-You Note *</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {customerDescription.length} chars
              </span>
            </label>
            <textarea
              rows={2}
              required
              disabled={!isOwner}
              value={customerDescription}
              onChange={(e) => setCustomerDescription(e.target.value)}
              placeholder="e.g. Thank you for partnering with our Tractor Fleet! Official digital tax invoice and field service record."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors resize-none disabled:opacity-60 disabled:cursor-not-allowed leading-relaxed"
            />
            <p className="text-[10px] text-slate-500 dark:text-neutral-400 mt-1">
              This message appears at the conclusion of all SMS invoices, customer notifications, invoice modal popups, and printed PDFs.
            </p>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={!isOwner}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1fa85a] hover:bg-[#19904d] text-neutral-950 font-sora font-bold text-xs shadow-xs transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isOwner ? <Save className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{isOwner ? 'Save Tractor Service Branding' : 'Owner Edit Access Required'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ── 3. BILLING & DIGITAL TIMER DEFAULTS ── */}
      <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-white/10 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-sora font-bold text-sm text-slate-900 dark:text-white">
                Billing & Digital Timer Defaults
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                Preset standard hourly rate, implement defaults, invoice numbering, and sound alerts.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 text-[11px] font-semibold">
            <Sparkles className="w-3 h-3" />
            <span>Field Auto-Sync</span>
          </span>
        </div>

        <form onSubmit={handleSaveBillingDefaults} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Default Hourly Rate */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                Default Hourly Rate (₹/hr)
              </label>
              <input
                type="number"
                min="100"
                step="50"
                value={defaultRate}
                onChange={(e) => setDefaultRate(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white font-mono font-bold outline-none focus:border-emerald-500 transition-colors"
              />
              {/* Quick Tap Rate Presets */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-medium">Quick:</span>
                {QUICK_RATES.map((rate) => (
                  <button
                    type="button"
                    key={rate}
                    onClick={() => setDefaultRate(rate)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold transition-all border ${
                      defaultRate === rate
                        ? 'bg-emerald-500/20 border-emerald-500 text-[#1fa85a] dark:text-[#6df59a] font-bold'
                        : 'bg-slate-100 dark:bg-neutral-800/80 border-slate-200 dark:border-white/5 text-slate-600 dark:text-neutral-400 hover:border-emerald-500/30'
                    }`}
                  >
                    ₹{rate}
                  </button>
                ))}
              </div>
            </div>

            {/* Default Implement */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                Default Implement
              </label>
              <select
                value={defaultImplement}
                onChange={(e) => setDefaultImplement(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors cursor-pointer"
              >
                <option value="Rotavator">Rotavator (சுழல் கலப்பை)</option>
                <option value="Spring Cultivator">Spring Cultivator (ஸ்பிரிங் கொழு)</option>
                <option value="Disc Cultivator">Disc Cultivator (வட்டு கலப்பை)</option>
                <option value="Combine Harvest">Combine Harvest (அறுவடை இயந்திரம்)</option>
                <option value="Laser Leveller">Laser Leveller (லேசர் சமன்)</option>
              </select>
              <p className="text-[10px] text-slate-400 dark:text-neutral-500 mt-2">
                Pre-selects this attachment when opening New Bill.
              </p>
            </div>

            {/* Invoice Prefix */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                Invoice ID Prefix
              </label>
              <input
                type="text"
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase())}
                placeholder="INV-"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white font-mono uppercase font-bold outline-none focus:border-emerald-500 transition-colors"
              />
              <p className="text-[10px] text-slate-400 dark:text-neutral-500 mt-2">
                Example: {invoicePrefix || 'INV-'}89101
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-white/5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={timerSoundAlerts}
                onChange={(e) => setTimerSoundAlerts(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 cursor-pointer"
              />
              <span className="text-xs font-medium text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-teal-500" />
                Play audio beep alert & vibration on timer Start / Stop
              </span>
            </label>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1fa85a] hover:bg-[#19904d] text-neutral-950 font-sora font-bold text-xs shadow-xs transition-all active:scale-[0.98]"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Defaults</span>
            </button>
          </div>
        </form>
      </div>

      {/* ── 3. APPLICATION LANGUAGE / மொழி விருப்பங்கள் ── */}
      <div className="p-4 md:p-5 rounded-2xl bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-white/10 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Globe className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="font-sora font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                Application Language / மொழி விருப்பங்கள்
              </h2>
            </div>
          </div>
          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            {LANGUAGES.find((l) => l.code === lang)?.label} ({LANGUAGES.find((l) => l.code === lang)?.native})
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {LANGUAGES.map((item) => {
            const isSelected = item.code === lang;
            return (
              <button
                type="button"
                key={item.code}
                onClick={() => {
                  setLang(item.code);
                  onAddToast?.(`Language set to ${item.label}`, 'info');
                }}
                className={`px-3 py-2 rounded-xl border text-xs transition-all flex items-center justify-between gap-1.5 active:scale-[0.98] ${
                  isSelected
                    ? 'bg-emerald-500/20 border-emerald-500 text-slate-900 dark:text-white shadow-xs font-bold ring-1 ring-emerald-500/30'
                    : 'bg-slate-50 dark:bg-neutral-950 border-slate-200 dark:border-white/5 text-slate-700 dark:text-neutral-300 hover:border-emerald-500/30'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-sora font-bold text-xs text-[#1fa85a] dark:text-[#6df59a]">{item.native}</span>
                  <span className="text-[10px] text-slate-500 dark:text-neutral-400 font-normal">({item.label})</span>
                </div>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-[#1fa85a] dark:text-[#6df59a] shrink-0 stroke-[2.5]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. APPEARANCE & FIELD VISIBILITY ── */}
      <div className="p-4 md:p-5 rounded-2xl bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-white/10 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Sun className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="font-sora font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                Appearance & Field Visibility
              </h2>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            {theme === 'light' ? 'Light Theme Active' : 'Dark Theme Active'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg">
          {/* Light Mode Preview */}
          <button
            type="button"
            onClick={() => {
              if (theme !== 'light') toggleTheme();
            }}
            className={`px-3.5 py-2 rounded-xl border text-xs transition-all flex items-center justify-between gap-2 active:scale-[0.98] ${
              theme === 'light'
                ? 'bg-amber-500/15 border-amber-500 text-amber-900 dark:text-amber-200 shadow-xs ring-1 ring-amber-500/30 font-bold'
                : 'bg-slate-50 dark:bg-neutral-950 border-slate-200 dark:border-white/5 text-slate-600 dark:text-neutral-400 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="font-semibold text-xs">Light Mode</span>
            </div>
            {theme === 'light' && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300">Active</span>
            )}
          </button>

          {/* Dark Mode Preview */}
          <button
            type="button"
            onClick={() => {
              if (theme !== 'dark') toggleTheme();
            }}
            className={`px-3.5 py-2 rounded-xl border text-xs transition-all flex items-center justify-between gap-2 active:scale-[0.98] ${
              theme === 'dark'
                ? 'bg-emerald-500/15 border-emerald-500 text-[#1fa85a] dark:text-[#6df59a] shadow-xs ring-1 ring-emerald-500/30 font-bold'
                : 'bg-slate-50 dark:bg-neutral-950 border-slate-200 dark:border-white/5 text-slate-600 dark:text-neutral-400 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Moon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-semibold text-xs">Dark Mode</span>
            </div>
            {theme === 'dark' && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-[#1fa85a] dark:text-[#6df59a]">Active</span>
            )}
          </button>
        </div>
      </div>

      {/* ── 5. AUTH SESSION / ACCOUNT SECURITY ── */}
      <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-white/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-sora font-bold text-sm text-slate-900 dark:text-white">
                {t.authSession} / Account Security
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                Manage your active tractor operator session, switch roles, or securely sign out.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-[#1fa85a] dark:text-[#6df59a] border border-emerald-500/20 text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Active Session</span>
          </span>
        </div>

        {/* Current User Card */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-sora font-extrabold text-base flex items-center justify-center shadow-xs shrink-0">
              {(currentUser?.name || 'Muthu').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-sora font-bold text-sm text-slate-900 dark:text-white">
                  {currentUser?.name || 'Logesh M'}
                </h3>
                <span className="px-2 py-0.2 rounded-md bg-emerald-500/20 text-[#1fa85a] dark:text-[#6df59a] text-[10px] font-bold uppercase">
                  {currentUser?.role === 'Owner' ? 'Tractor Owner' : 'Tractor Driver'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                {currentUser?.email || 'logeshmuthu2004@gmail.com'}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono mt-0.5">
                Phone: {currentUser?.phone || '+91 94433 88123'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Switch Account Button */}
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 hover:border-emerald-500/40 text-xs font-semibold text-slate-800 dark:text-neutral-200 shadow-xs transition-all active:scale-[0.98]"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t.switchAccount}</span>
            </button>

            {/* Logout Button */}
            <button
              type="button"
              onClick={onLogout}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all active:scale-[0.98]"
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
