'use client';

import React, { useState, useEffect } from 'react';
import { Bill, Driver, Stats, User } from '@/types';
import { getLocalDrivers } from '@/lib/api';
import { getCleanIndianPhone } from '@/lib/smsSender';
import { useLanguage } from '@/context/LanguageContext';
import {
  FileEdit,
  Clock,
  MapPin,
  User as UserIcon,
  Phone,
  Tractor,
  Calendar,
  Sparkles,
  ArrowRight,
  RotateCcw,
  PlusCircle,
  Percent,
  Fuel,
  IndianRupee,
  Layers,
  Banknote,
  Lock,
  ShieldCheck,
} from 'lucide-react';

interface ManualBillSectionProps {
  stats?: Stats;
  currentUser?: User | null;
  onBillCreated: (bill: Bill) => void;
  onViewAllBills: () => void;
  addToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type BillingMode = 'duration' | 'acreage' | 'fixed';

export function ManualBillSection({
  currentUser,
  onBillCreated,
  onViewAllBills,
  addToast,
}: ManualBillSectionProps) {
  const { t } = useLanguage();

  // Mode: Duration (Hrs & Mins), Land Area (Acres & Cents), or Fixed Contract
  const [billingMode, setBillingMode] = useState<BillingMode>('duration');

  // Customer & Field Data
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [location, setLocation] = useState('');
  const [season, setSeason] = useState('Samba (சம்பா)');
  const [notes, setNotes] = useState('');

  // Date & Shift
  const [workDate, setWorkDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [timeSlot, setTimeSlot] = useState<'Morning' | 'Afternoon' | 'Evening' | 'Night'>('Morning');

  // Implement Selection
  const [selectedWork, setSelectedWork] = useState('Rotavator');
  const [customWorkName, setCustomWorkName] = useState('');
  const [selectedTines, setSelectedTines] = useState<'5' | '9' | '13'>('9');

  // Rate & Financials
  const [hourlyRate, setHourlyRate] = useState<number>(900);
  const [acreRate, setAcreRate] = useState<number>(1200);

  // Duration Mode state
  const [hours, setHours] = useState('1');
  const [minutes, setMinutes] = useState('30');

  // Acreage Mode state
  const [acres, setAcres] = useState('2');
  const [cents, setCents] = useState('0');

  // Fixed Mode state
  const [fixedAmount, setFixedAmount] = useState('2500');

  // Adjustments & Expenses
  const [discount, setDiscount] = useState('0');
  const [extraCharges, setExtraCharges] = useState('0');
  const [dieselLiters, setDieselLiters] = useState('');

  // Driver Assignment
  const [driverName, setDriverName] = useState(currentUser?.name || 'Logesh M');
  const [fleetDrivers, setFleetDrivers] = useState<Driver[]>([]);

  // Payment Status & Mode
  const [paymentStatus, setPaymentStatus] = useState<'Pending' | 'Paid'>('Pending');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Bank'>('Cash');

  // Load Drivers
  useEffect(() => {
    try {
      const drivers = getLocalDrivers();
      setFleetDrivers(drivers);
    } catch {
      // ignore
    }
  }, []);

  // Sync user name
  useEffect(() => {
    if (currentUser?.name) {
      setDriverName(currentUser.name);
    }
  }, [currentUser]);

  // Adjust default rates when implement changes
  const handleImplementSelect = (work: string, defaultHrRate: number, defaultAcreRate: number) => {
    setSelectedWork(work);
    setHourlyRate(defaultHrRate);
    setAcreRate(defaultAcreRate);
  };

  const notify = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (addToast) {
      addToast(msg, type);
    } else {
      alert(msg);
    }
  };

  // Calculations
  const numHours = parseFloat(hours) || 0;
  const numMinutes = parseFloat(minutes) || 0;
  const totalMinutes = numHours * 60 + numMinutes;
  const totalDurationSecs = Math.round(totalMinutes * 60);

  const numAcres = parseFloat(acres) || 0;
  const numCents = parseFloat(cents) || 0;
  const totalAcreage = numAcres + numCents / 100;

  const numDiscount = parseFloat(discount) || 0;
  const numExtra = parseFloat(extraCharges) || 0;

  let baseAmount = 0;
  let formattedDurationText = '';

  if (billingMode === 'duration') {
    baseAmount = Math.round((hourlyRate * totalMinutes) / 60);
    formattedDurationText = `${numHours}h ${numMinutes.toString().padStart(2, '0')}m`;
  } else if (billingMode === 'acreage') {
    baseAmount = Math.round(totalAcreage * acreRate);
    formattedDurationText = `${totalAcreage.toFixed(2)} Acres (${numAcres} ac ${numCents} cts)`;
  } else {
    baseAmount = parseFloat(fixedAmount) || 0;
    formattedDurationText = `Contract Fixed`;
  }

  const finalTotalAmount = Math.max(0, Math.round(baseAmount + numExtra - numDiscount));

  const handleReset = () => {
    setCustomerName('');
    setCustomerPhone('');
    setLocation('');
    setNotes('');
    setHours('1');
    setMinutes('0');
    setAcres('1');
    setCents('0');
    setFixedAmount('2000');
    setDiscount('0');
    setExtraCharges('0');
    setDieselLiters('');
    notify('Form reset to default values', 'info');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || customerName.trim().length < 2) {
      notify('⚠️ Security Alert: Farmer / Customer Name is required (min 2 characters)', 'error');
      return;
    }
    const digitsOnly = customerPhone.replace(/\D/g, '');
    let national = digitsOnly;
    if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) national = digitsOnly.slice(2);
    else if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) national = digitsOnly.slice(1);

    if (national.length !== 10) {
      if (digitsOnly.length > 10) {
        notify(`⚠️ Security Alert: Invalid mobile number (${digitsOnly.length} digits entered). Mobile numbers must be exactly 10 digits.`, 'error');
      } else {
        notify(`⚠️ Security Alert: Incomplete mobile number (${digitsOnly.length} digits). Mobile numbers must be exactly 10 digits.`, 'error');
      }
      return;
    }
    if (!/^[6-9]/.test(national)) {
      notify('⚠️ Security Alert: Mobile number must start with 6, 7, 8, or 9', 'error');
      return;
    }

    if (billingMode === 'duration' && totalDurationSecs <= 0) {
      notify('⚠️ Please specify work hours and minutes', 'error');
      return;
    }
    if (billingMode === 'acreage' && totalAcreage <= 0) {
      notify('⚠️ Please enter land acreage or cents', 'error');
      return;
    }
    if (billingMode === 'fixed' && baseAmount <= 0) {
      notify('⚠️ Please enter agreed contract amount', 'error');
      return;
    }

    const effectiveWorkType = selectedWork === 'Custom' ? (customWorkName.trim() || 'Custom Implement') : selectedWork;
    let workLabel = effectiveWorkType;
    if (selectedWork === 'Spring Cultivator') {
      workLabel += ` (${selectedTines} Spring)`;
    }

    let modeDescription = '';
    if (billingMode === 'duration') {
      modeDescription = `Hourly Billing (${hourlyRate}/hr)`;
    } else if (billingMode === 'acreage') {
      modeDescription = `Acreage Billing (${totalAcreage.toFixed(2)} Acres @ ₹${acreRate}/ac)`;
    } else {
      modeDescription = `Fixed Lump-Sum Contract`;
    }

    const compiledNotes = [
      notes.trim(),
      modeDescription,
      timeSlot ? `Shift: ${timeSlot}` : '',
      dieselLiters ? `Diesel: ${dieselLiters}L` : '',
      numDiscount > 0 ? `Discount: ₹${numDiscount}` : '',
      numExtra > 0 ? `Transport/Extra: ₹${numExtra}` : '',
    ]
      .filter(Boolean)
      .join(' • ');

    const newBill: Bill = {
      billId: `#AGRI-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: customerName.trim(),
      customerPhone: getCleanIndianPhone(customerPhone).fullE164 || customerPhone.trim(),
      driverName: driverName.trim(),
      workType: workLabel,
      variant: selectedWork === 'Spring Cultivator' ? `${selectedTines} Spring` : billingMode === 'acreage' ? `${totalAcreage.toFixed(2)} Ac` : '',
      durationSecs: totalDurationSecs || 3600,
      durationFormatted: formattedDurationText,
      ratePerHour: billingMode === 'duration' ? hourlyRate : billingMode === 'acreage' ? acreRate : baseAmount,
      totalAmount: finalTotalAmount,
      status: paymentStatus,
      season: season.trim(),
      location: location.trim(),
      notes: compiledNotes,
      date: (
        workDate
          ? new Date(workDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
          : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      ).replace(/[\s\-/]?2026/g, '').trim(),
    };

    onBillCreated(newBill);
    notify(`✅ Manual Invoice ${newBill.billId} generated and saved!`, 'success');
  };

  const implementsList = [
    { name: 'Rotavator', icon: '🔄', hrRate: 900, acRate: 1200 },
    { name: 'Combine Harvest', icon: '🌾', hrRate: 1400, acRate: 2200 },
    { name: 'Disc Cultivator', icon: '💿', hrRate: 950, acRate: 1300 },
    { name: 'Laser Leveller', icon: '📐', hrRate: 1200, acRate: 1500 },
    { name: 'Spring Cultivator', icon: '⚙️', hrRate: 850, acRate: 1100 },
    { name: 'Custom', icon: '✏️', hrRate: 900, acRate: 1200 },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* ── Top Header Banner ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-[#1fa85a] dark:text-[#6df59a]">
              <FileEdit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-sora font-extrabold text-slate-900 dark:text-white tracking-tight">
                {t.manualBillTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                {t.manualBillSubtitle}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onViewAllBills}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
        >
          <span>{t.workHistory}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Mode Switcher Pills (Duration | Acreage | Fixed Contract) ── */}
      <div className="p-1 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row gap-1">
        <button
          type="button"
          onClick={() => setBillingMode('duration')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-sora font-bold flex items-center justify-center gap-2 transition-all ${
            billingMode === 'duration'
              ? 'bg-[#1fa85a] text-white shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400/40'
              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{t.byHours}</span>
        </button>

        <button
          type="button"
          onClick={() => setBillingMode('acreage')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-sora font-bold flex items-center justify-center gap-2 transition-all ${
            billingMode === 'acreage'
              ? 'bg-[#1fa85a] text-white shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400/40'
              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{t.byAcreage}</span>
        </button>

        <button
          type="button"
          onClick={() => setBillingMode('fixed')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-sora font-bold flex items-center justify-center gap-2 transition-all ${
            billingMode === 'fixed'
              ? 'bg-[#1fa85a] text-white shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400/40'
              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
          }`}
        >
          <Banknote className="w-3.5 h-3.5" />
          <span>{t.byFixed}</span>
        </button>
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Details (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Date, Shift & Customer Information */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-xl shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-[#1fa85a] dark:text-[#6df59a] text-xs font-bold flex items-center justify-center">1</span>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t.farmerDetails} & {t.workDate}
                </label>
              </div>

              {/* Date & Shift Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.workDate} *</span>
                  </label>
                  <input
                    type="date"
                    value={workDate}
                    onChange={(e) => setWorkDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.timeSlot}</span>
                  </label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value as 'Morning' | 'Afternoon' | 'Evening' | 'Night')}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    <option value="Morning">{t.morning} (காலை)</option>
                    <option value="Afternoon">{t.afternoon} (பிற்பகல்)</option>
                    <option value="Evening">{t.evening} (மாலை)</option>
                    <option value="Night">{t.night} (இரவு)</option>
                  </select>
                </div>
              </div>

              {/* Farmer Name & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t.farmerNameLabel} *
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder={t.farmerNamePlaceholder}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t.farmerPhoneLabel} *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      placeholder="e.g. 98421 54321"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Location & Crop Season */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t.locationLabel}
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="e.g. Melur Canal Road, North Acre"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t.seasonLabel}
                  </label>
                  <select
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    <option value="Samba (சம்பா)">Samba (சம்பா - Aug to Jan)</option>
                    <option value="Kuruvai (குறுவை)">Kuruvai (குறுவை - Jun to Sep)</option>
                    <option value="Navarai (நவரை)">Navarai (நவரை - Dec to Apr)</option>
                    <option value="Thaladi (தாளடி)">Thaladi (தாளடி - Oct to Feb)</option>
                    <option value="Kharif (Summer)">Kharif (Summer Harvest)</option>
                    <option value="Rabi (Winter)">Rabi (Winter Season)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Implement Selection */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-xl shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-[#1fa85a] dark:text-[#6df59a] text-xs font-bold flex items-center justify-center">2</span>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {t.implementLabel}
                  </label>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Selected: {selectedWork === 'Custom' ? (customWorkName || 'Custom') : selectedWork}
                </span>
              </div>

              {/* Implement Chips (Compact height matching input fields) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {implementsList.map((item) => {
                  const isSelected = selectedWork === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => handleImplementSelect(item.name, item.hrRate, item.acRate)}
                      className={`h-10 px-3 rounded-xl border text-left transition-all font-sora text-xs font-semibold flex items-center gap-2 ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-sm ring-1 ring-emerald-500/30'
                          : 'bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="text-base shrink-0">{item.icon}</span>
                      <span className="truncate font-bold text-xs">{item.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Implement Name Input */}
              {selectedWork === 'Custom' && (
                <div className="pt-1.5 animate-fadeIn">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Custom Attachment Name:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Baler, Post Hole Digger, Ridger..."
                    value={customWorkName}
                    onChange={(e) => setCustomWorkName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Spring Cultivator Tines Count Selector */}
              {selectedWork === 'Spring Cultivator' && (
                <div className="mt-2.5 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 animate-fadeIn space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-950 dark:text-emerald-300">
                      {t.springTinesLabel}:
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      5, 9 or 13 Spring Setup
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { count: '5', label: '5 Spring', sub: '5 கொழு' },
                      { count: '9', label: '9 Spring', sub: '9 கொழு' },
                      { count: '13', label: '13 Spring', sub: '13 கொழு' },
                    ].map((tin) => (
                      <button
                        key={tin.count}
                        type="button"
                        onClick={() => setSelectedTines(tin.count as '5' | '9' | '13')}
                        className={`h-9 px-2 rounded-lg border text-center transition-all flex items-center justify-center gap-1.5 ${
                          selectedTines === tin.count
                            ? 'bg-[#1fa85a] text-white font-bold border-emerald-600 shadow-sm'
                            : 'bg-white dark:bg-neutral-900 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-emerald-400'
                        }`}
                      >
                        <span className="text-xs font-bold font-sora">{tin.label}</span>
                        <span className={`text-[10px] ${selectedTines === tin.count ? 'text-white/90 font-semibold' : 'text-slate-400'}`}>
                          ({tin.sub})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Duration / Acreage / Contract Calculation Inputs */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-xl shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-[#1fa85a] dark:text-[#6df59a] text-xs font-bold flex items-center justify-center">3</span>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {billingMode === 'duration'
                    ? 'Work Duration & Hourly Rate'
                    : billingMode === 'acreage'
                    ? 'Field Land Area & Acre Rate'
                    : 'Fixed Contract Amount'}
                </label>
              </div>

              {/* Mode A: Duration */}
              {billingMode === 'duration' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t.hours} (மணி) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="48"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 text-center"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t.minutes} (நிமிடங்கள்) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={minutes}
                      onChange={(e) => setMinutes(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 text-center"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t.ratePerHour} (₹/hr) *
                    </label>
                    <input
                      type="number"
                      min="100"
                      step="50"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 focus:outline-none focus:border-emerald-500 text-center"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Mode B: Acreage */}
              {billingMode === 'acreage' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t.acres} (ஏக்கர்) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={acres}
                      onChange={(e) => setAcres(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 text-center"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t.cents} (சென்ட்)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={cents}
                      onChange={(e) => setCents(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t.ratePerAcre} (₹/ac) *
                    </label>
                    <input
                      type="number"
                      min="100"
                      step="50"
                      value={acreRate}
                      onChange={(e) => setAcreRate(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 focus:outline-none focus:border-emerald-500 text-center"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Mode C: Fixed Contract */}
              {billingMode === 'fixed' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Fixed Agreed Contract Amount (₹) *
                    </label>
                    <div className="relative">
                      <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="number"
                        min="1"
                        value={fixedAmount}
                        onChange={(e) => setFixedAmount(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Contract Scope / Agreement
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Complete 3 acres wetland preparation"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 4. Driver Assignment & Financial Adjustments */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-xl shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-[#1fa85a] dark:text-[#6df59a] text-xs font-bold flex items-center justify-center">4</span>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t.driverNameLabel} & Financial Adjustments
                </label>
              </div>

              {/* Driver Assignment */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Tractor className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.driverNameLabel}</span>
                  </div>
                  {currentUser?.role === 'Driver' && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Assigned Operator
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled={currentUser?.role === 'Driver'}
                    list="manual-fleet-drivers"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Enter or select driver name..."
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-medium ${
                      currentUser?.role === 'Driver'
                        ? 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 opacity-80 cursor-not-allowed select-none'
                        : 'bg-slate-50 dark:bg-black/40 border-slate-300 dark:border-white/10'
                    }`}
                    required
                  />
                  {currentUser?.role === 'Driver' && (
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-3.5" />
                  )}
                  <datalist id="manual-fleet-drivers">
                    {fleetDrivers.map((d) => (
                      <option key={d.id || d._id} value={d.name}>
                        {d.assignedTractor} • {d.status}
                      </option>
                    ))}
                    <option value="Muthu">Mahindra 575 DI (Muthu)</option>
                    <option value="Logesh M">Driver Logesh M</option>
                  </datalist>
                </div>
                {currentUser?.role === 'Driver' && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                    🔒 Operator locked to logged-in driver ({currentUser.name})
                  </p>
                )}
              </div>

              {/* Discount, Extra Charges & Diesel */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.discount}</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    placeholder="0"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                    <PlusCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.extraCharges}</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    placeholder="0"
                    value={extraCharges}
                    onChange={(e) => setExtraCharges(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                    <Fuel className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.dieselLiters}</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="e.g. 12"
                    value={dieselLiters}
                    onChange={(e) => setDieselLiters(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 text-center"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Live Bill Summary & Instant Submission (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="font-sora font-bold text-sm text-slate-900 dark:text-white">
                  {t.calculationSummary}
                </h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-[#1fa85a] dark:text-[#6df59a] border border-emerald-500/20">
                Manual Entry
              </span>
            </div>

            {/* Itemized Calculation Rows */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>{t.workDate}:</span>
                <strong className="text-slate-900 dark:text-white font-medium">
                  {workDate} ({timeSlot})
                </strong>
              </div>

              {customerName && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>{t.farmerNameLabel}:</span>
                  <strong className="text-slate-900 dark:text-white font-medium truncate max-w-[170px]">
                    {customerName}
                  </strong>
                </div>
              )}

              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>{t.implementLabel}:</span>
                <strong className="text-slate-900 dark:text-white font-medium">
                  {selectedWork === 'Custom' ? customWorkName || 'Custom' : selectedWork}
                  {selectedWork === 'Spring Cultivator' ? ` (${selectedTines}s)` : ''}
                </strong>
              </div>

              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>{t.driverNameLabel}:</span>
                <strong className="text-slate-900 dark:text-white font-medium truncate max-w-[170px]">
                  {driverName}
                </strong>
              </div>

              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>{t.billingMode}:</span>
                <strong className="text-[#1fa85a] dark:text-[#6df59a] font-semibold">
                  {formattedDurationText}
                </strong>
              </div>

              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Base Subtotal:</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">
                  ₹{baseAmount.toLocaleString()}
                </span>
              </div>

              {numExtra > 0 && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Transport/Extra Fee:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    + ₹{numExtra.toLocaleString()}
                  </span>
                </div>
              )}

              {numDiscount > 0 && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Discount Applied:</span>
                  <span className="font-mono text-rose-600 dark:text-rose-400">
                    - ₹{numDiscount.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Total Net Payable */}
            <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-baseline justify-between">
              <div>
                <span className="font-sora font-semibold text-xs text-slate-700 dark:text-slate-300 block">
                  {t.netPayable}:
                </span>
                <span className="text-[10px] text-slate-400">Final Calculated Price</span>
              </div>
              <span className="font-sora font-extrabold text-3xl text-amber-600 dark:text-gold-400 tabular-nums">
                ₹{finalTotalAmount.toLocaleString()}
              </span>
            </div>

            {/* Payment Settlement Status Picker */}
            <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {t.paymentStatus}:
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('Pending')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      paymentStatus === 'Pending'
                        ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 shadow-sm'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {t.pending}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('Paid')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      paymentStatus === 'Paid'
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 shadow-sm'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {t.paid}
                  </button>
                </div>
              </div>

              {/* Payment Mode (Cash / UPI / Bank) */}
              {paymentStatus === 'Paid' && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Payment Mode:</span>
                  <div className="flex gap-1.5 text-[11px]">
                    {(['Cash', 'UPI', 'Bank'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m)}
                        className={`px-2.5 py-0.5 rounded-lg font-medium transition-all ${
                          paymentMethod === m
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-black font-bold'
                            : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-neutral-400'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons: Submit Invoice & Reset Form */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full py-3.5 rounded-2xl bg-[#1fa85a] hover:bg-[#198d4b] text-white font-sora font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/40 hover:opacity-95 transition-all active:scale-[0.99]"
              >
                <span>{t.createManualBillBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Fields</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManualBillSection;
