'use client';

import React, { useState } from 'react';
import { User, ActiveTractorConfig } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import {
  User as UserIcon,
  Shield,
  Truck,
  Phone,
  Mail,
  FileText,
  Save,
  CheckCircle,
  Wrench,
  Fuel,
  Gauge,
  Clock,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';

interface ProfileSectionProps {
  user: User;
  onUpdateProfile: (updated: Partial<User>) => Promise<void>;
  onLogout?: () => void;
  activeTractor?: ActiveTractorConfig;
  onOpenAuthModal?: () => void;
  onNavigateToSettings?: () => void;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  user,
  onUpdateProfile,
  onLogout,
  activeTractor,
  onOpenAuthModal,
  onNavigateToSettings,
}) => {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [name, setName] = useState(user.name || 'Muthu');
  const [email, setEmail] = useState(user.email || 'muthu.driver@agri.in');
  const [phone, setPhone] = useState(user.phone || '+91 94433 11223');
  const [tractorModel, setTractorModel] = useState(user.tractorModel || 'Mahindra 575 DI Sarpanch');
  const [licenseNumber, setLicenseNumber] = useState(user.licenseNumber || 'TN-28-2022-0098234');
  const isOwner = user.role === 'Owner';
  const role: User['role'] = user.role || 'Driver';
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      await onUpdateProfile({
        name,
        email,
        phone,
        tractorModel,
        licenseNumber,
        role,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── Active Tractor & System Controls Header Bar (Moved here from main page) ── */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-neutral-900/80 border border-slate-200 dark:border-white/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        {/* Left: Active Tractor Status & Driver */}
        <div className="flex items-center gap-3">
          <div
            onClick={onNavigateToSettings}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all shadow-xs"
            title="Click to manage Fleet & Tractor Settings"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                activeTractor?.status === 'Active'
                  ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse'
                  : activeTractor?.status === 'Maintenance'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-slate-400'
              }`}
            />
            <span>{activeTractor?.registrationNumber || 'TN-28-AT-5590'} {activeTractor?.status || 'Active'}</span>
          </div>
          <span className="hidden sm:inline-block text-xs text-slate-300 dark:text-neutral-600">|</span>
          <span className="text-xs text-slate-600 dark:text-neutral-400">
            {activeTractor?.model || 'Mahindra 575 DI (45 HP)'} • Driver: <strong className="text-slate-900 dark:text-white font-medium">{activeTractor?.driverName || user.name}</strong>
          </span>
        </div>

        {/* Right: Language Switcher, Theme Toggle & Auth Session */}
        <div className="flex items-center gap-2.5">
          <LanguageSwitcher />

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl border transition-all text-xs flex items-center justify-center bg-white dark:bg-neutral-900 hover:bg-slate-100 dark:hover:bg-neutral-800 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 shadow-xs"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          {onOpenAuthModal && (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 hover:bg-slate-100 dark:hover:bg-neutral-800 border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-xs"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t.authSession}</span>
            </button>
          )}
        </div>
      </div>
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-white/5 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold tracking-wide uppercase mb-2">
          <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          {t.profile}
        </div>
        <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t.profileTitle}
        </h2>
        <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">
          {t.profileSubtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Driver Credentials Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-white/5 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[2px] shadow-lg shadow-emerald-500/20">
                <div className="w-full h-full bg-slate-50 dark:bg-neutral-950 rounded-[14px] flex items-center justify-center font-black text-2xl text-emerald-600 dark:text-emerald-400">
                  {name.charAt(0).toUpperCase()}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {name}
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                    {role}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 font-mono">
                  Lic: {licenseNumber}
                </p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                    {t.operatorName}
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-white/10 focus:border-emerald-500 text-slate-900 dark:text-white text-xs outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>{t.roleCategory}</span>
                  </label>
                  {isOwner ? (
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={t.fleetOwner}
                        className="w-full pl-3.5 pr-24 py-2.5 rounded-xl bg-slate-100 dark:bg-neutral-950/80 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-xs font-bold cursor-default select-none"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                        Fleet Owner
                      </span>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={t.tractorDriver}
                        className="w-full pl-3.5 pr-28 py-2.5 rounded-xl bg-slate-100 dark:bg-neutral-950/80 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-xs font-bold cursor-default select-none"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        Driver Account
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                    {t.officialEmail}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-white/10 focus:border-emerald-500 text-slate-900 dark:text-white text-xs outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                    {t.mobileNumber}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-400" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-white/10 focus:border-emerald-500 text-slate-900 dark:text-white text-xs outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                    {t.assignedTractor}
                  </label>
                  <div className="relative">
                    <Truck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-400" />
                    <input
                      type="text"
                      value={tractorModel}
                      onChange={(e) => setTractorModel(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-white/10 focus:border-emerald-500 text-slate-900 dark:text-white text-xs outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                    {t.drivingLicense}
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-400" />
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-white/10 focus:border-emerald-500 text-slate-900 dark:text-white text-xs outline-none transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between">
                {savedSuccess ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold animate-fadeIn">
                    <CheckCircle className="w-4 h-4" />
                    <span>{t.profileSaved}</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 dark:text-neutral-500">
                    Muthu Tractor Cloud Network
                  </span>
                )}

                <div className="flex items-center gap-3">
                  {onLogout && (
                    <button
                      type="button"
                      onClick={onLogout}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 font-semibold text-xs transition-all shadow-sm"
                      title="Sign Out"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t.signOut}</span>
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Updating...' : t.saveProfile}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Tractor Specs & Implement Inventory */}
        <div className="lg:col-span-5 space-y-6">
          {/* Tractor Telemetry Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-white/5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">Mahindra 575 DI</h4>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 font-mono">Reg: TN-28-AT-5590</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                Online
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/5">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-neutral-400 mb-1">
                  <Gauge className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  <span>Engine Power</span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">45 HP @ 2100 RPM</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/5">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-neutral-400 mb-1">
                  <Fuel className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Diesel Tank</span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">84% (40.3 Litres)</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/5">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-neutral-400 mb-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Total Meter</span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">1,482.4 Operating Hrs</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/5">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-neutral-400 mb-1">
                  <Wrench className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Next Service</span>
                </div>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">In 67 Hours</span>
              </div>
            </div>
          </div>

          {/* Attached Implements Status */}
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-white/5 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span>Machinery Implement Status</span>
              <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400">5 Attached</span>
            </h4>

            <div className="space-y-2.5 text-xs">
              {[
                { name: 'Rotavator (Shaktiman 42 Blades)', status: 'Active', health: '98%' },
                { name: 'Spring Loaded Cultivator (9-15 Tines)', status: 'Active', health: '95%' },
                { name: 'Combine Harvester Head', status: 'Ready', health: '90%' },
                { name: 'Disc Cultivator (Heavy Duty)', status: 'Active', health: '92%' },
                { name: 'Laser Land Leveller (Dual Sensor)', status: 'Calibrated', health: '100%' },
              ].map((imp, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/5 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{imp.name}</p>
                    <p className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">Condition: {imp.health}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold">
                    {imp.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
