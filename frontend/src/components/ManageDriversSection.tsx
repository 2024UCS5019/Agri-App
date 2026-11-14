'use client';

import React, { useState, useEffect } from 'react';
import { Driver, User } from '@/types';
import { driversAPI } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import {
  Users,
  UserPlus,
  Tractor,
  Phone,
  Shield,
  ShieldCheck,
  Search,
  CheckCircle2,
  Clock,
  Briefcase,
  X,
  Edit2,
  Trash2,
  MessageCircle,
  MapPin,
  Receipt,
} from 'lucide-react';

interface ManageDriversSectionProps {
  currentUser: User | null;
  onSelectDriverForBill?: (driverName: string) => void;
  onAddToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const TRACTOR_SUGGESTIONS = [
  'Mahindra 575 DI (45 HP)',
  'Mahindra 575 DI Sarpanch (TN-28-AT-5590)',
  'John Deere 5050 D (50 HP)',
  'Massey Ferguson 241 DI (42 HP)',
  'Swaraj 744 FE (48 HP)',
  'Sonalika DI 42 RX (42 HP)',
  'Kubota MU4501 (45 HP)',
  'Farmtrac 60 Powermaxx (55 HP)',
  'New Holland 3630 TX (55 HP)',
];

export const ManageDriversSection: React.FC<ManageDriversSectionProps> = ({
  currentUser,
  onSelectDriverForBill,
  onAddToast,
}) => {
  const { t } = useLanguage();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'On Duty' | 'Available' | 'Inactive'>('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  // Form State (Hourly wage, Daily wage, and Skills removed as requested)
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [assignedTractor, setAssignedTractor] = useState('Mahindra 575 DI (45 HP)');
  const [experienceYears, setExperienceYears] = useState(3);
  const [status, setStatus] = useState<Driver['status']>('Available');
  const [address, setAddress] = useState('');

  // Optional Driver Login Account creation
  const [createLoginAccount, setCreateLoginAccount] = useState(false);
  const [driverEmail, setDriverEmail] = useState('');
  const [driverPassword, setDriverPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch Drivers
  const loadDrivers = async () => {
    setLoading(true);
    try {
      const list = await driversAPI.getAll();
      setDrivers(list);
    } catch {
      // Handled in api fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  const isOwner = currentUser?.role === 'Owner';

  // Open modal for new driver
  const handleOpenAddModal = () => {
    setEditingDriver(null);
    setName('');
    setPhone('+91 ');
    setLicenseNumber('TN-');
    setAssignedTractor('Mahindra 575 DI');
    setExperienceYears(3);
    setStatus('Available');
    setAddress('');
    setCreateLoginAccount(false);
    setDriverEmail('');
    setDriverPassword('');
    setIsModalOpen(true);
  };

  // Open modal for editing driver
  const handleOpenEditModal = (driver: Driver) => {
    setEditingDriver(driver);
    setName(driver.name);
    setPhone(driver.phone);
    setLicenseNumber(driver.licenseNumber);
    setAssignedTractor(driver.assignedTractor || '');
    setExperienceYears(driver.experienceYears ?? 3);
    setStatus(driver.status);
    setAddress(driver.address || '');
    setCreateLoginAccount(false);
    setIsModalOpen(true);
  };

  // Submit Add / Edit
  const handleSubmitDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onAddToast?.('Please enter driver name', 'error');
      return;
    }
    if (!phone.trim()) {
      onAddToast?.('Please enter driver phone number', 'error');
      return;
    }
    if (!licenseNumber.trim()) {
      onAddToast?.('Please enter driving license number', 'error');
      return;
    }
    if (!assignedTractor.trim()) {
      onAddToast?.('Please manually assign tractor name', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingDriver) {
        const id = editingDriver._id || editingDriver.id || '';
        const updated = await driversAPI.update(id, {
          name: name.trim(),
          phone: phone.trim(),
          licenseNumber: licenseNumber.trim().toUpperCase(),
          assignedTractor: assignedTractor.trim(),
          experienceYears: Number(experienceYears),
          status,
          address: address.trim(),
        });
        if (updated) {
          setDrivers((prev) => prev.map((d) => (d._id === id || d.id === id ? updated : d)));
          onAddToast?.(`Driver ${updated.name} updated successfully!`, 'success');
        }
      } else {
        const created = await driversAPI.create({
          name: name.trim(),
          phone: phone.trim(),
          licenseNumber: licenseNumber.trim().toUpperCase(),
          assignedTractor: assignedTractor.trim(),
          experienceYears: Number(experienceYears),
          status,
          address: address.trim(),
          ownerEmail: currentUser?.email || 'owner@agri.in',
          createLoginAccount,
          driverEmail: driverEmail.trim().toLowerCase(),
          driverPassword,
        });
        setDrivers((prev) => [created, ...prev]);
        onAddToast?.(`Driver ${created.name} added to your fleet!`, 'success');
      }
      setIsModalOpen(false);
    } catch {
      onAddToast?.('Failed to save driver', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Driver Status
  const handleToggleStatus = async (driver: Driver) => {
    const nextStatus: Driver['status'] =
      driver.status === 'On Duty' ? 'Available' : driver.status === 'Available' ? 'On Duty' : 'Available';
    const id = driver._id || driver.id || '';

    // Optimistic UI
    setDrivers((prev) =>
      prev.map((d) => (d._id === id || d.id === id ? { ...d, status: nextStatus } : d))
    );

    try {
      await driversAPI.toggleStatus(id, nextStatus);
      onAddToast?.(`${driver.name} is now ${nextStatus}`, 'info');
    } catch {
      onAddToast?.('Failed to update driver status', 'error');
    }
  };

  // Delete Driver
  const handleDeleteDriver = async (driver: Driver) => {
    const id = driver._id || driver.id || '';
    if (confirm(`Are you sure you want to remove driver ${driver.name} from your fleet?`)) {
      setDrivers((prev) => prev.filter((d) => d._id !== id && d.id !== id));
      try {
        await driversAPI.delete(id);
        onAddToast?.(`Driver ${driver.name} removed from fleet`, 'info');
      } catch {
        onAddToast?.('Failed to delete driver', 'error');
      }
    }
  };

  // Filtered List
  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch =
      driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.assignedTractor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' ? true : driver.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate Metrics
  const safeDrivers = Array.isArray(drivers) ? drivers : [];
  const totalCount = safeDrivers.length;
  const onDutyCount = safeDrivers.filter((d) => d?.status === 'On Duty').length;
  const availableCount = safeDrivers.filter((d) => d?.status === 'Available').length;
  const totalFleetHours = safeDrivers.reduce((sum, d) => sum + (Number(d?.totalHours) || 0), 0);

  // Access Control Guard
  if (!isOwner) {
    return (
      <div className="p-8 rounded-3xl bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-white/10 shadow-sm text-center max-w-lg mx-auto space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
          <Shield className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold font-sora text-slate-900 dark:text-white">
          Tractor Owner Access Only
        </h2>
        <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
          The <strong>Manage Drivers</strong> section is restricted to registered Tractor Owners. As a Tractor Driver, you can view your bills and work history in your personal ledger.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ── Hero Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/5 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#1fa85a] dark:text-[#6df59a] text-xs font-semibold tracking-wide uppercase mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Tractor Owner Fleet Deck
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold font-sora text-slate-900 dark:text-white tracking-tight">
            {t.manageDrivers}
          </h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            Register new drivers, manually assign tractor machinery, and dispatch operators.
          </p>
        </div>

        {/* Primary CTA: Add New Driver */}
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl bg-[#1fa85a] hover:bg-[#19904d] text-neutral-950 font-sora font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
        >
          <UserPlus className="w-4 h-4" />
          <span>{t.addDriver}</span>
        </button>
      </div>

      {/* ── KPI Fleet Driver Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Drivers */}
        <div className="p-5 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-md flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
              Fleet Drivers
            </span>
            <h3 className="font-sora font-extrabold text-2xl text-slate-900 dark:text-white mt-0.5">
              {totalCount}
            </h3>
          </div>
        </div>

        {/* Metric 2: On Duty */}
        <div className="p-5 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-md flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 relative">
            <Tractor className="w-6 h-6" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
              On Duty
            </span>
            <h3 className="font-sora font-extrabold text-2xl text-amber-600 dark:text-amber-400 mt-0.5">
              {onDutyCount}
            </h3>
          </div>
        </div>

        {/* Metric 3: Available */}
        <div className="p-5 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-md flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
              Available
            </span>
            <h3 className="font-sora font-extrabold text-2xl text-teal-600 dark:text-teal-400 mt-0.5">
              {availableCount}
            </h3>
          </div>
        </div>

        {/* Metric 4: Total Logged Hours */}
        <div className="p-5 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-md flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
              Fleet Run Hours
            </span>
            <h3 className="font-sora font-extrabold text-2xl text-slate-900 dark:text-white mt-0.5">
              {totalFleetHours}h
            </h3>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-white/5 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search driver by name, phone, tractor, or DL..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 outline-none focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['All', 'On Duty', 'Available', 'Inactive'] as const).map((filter) => (
            <button
              type="button"
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === filter
                  ? 'bg-emerald-500/20 text-[#1fa85a] dark:text-[#6df59a] border border-emerald-500/30'
                  : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* ── Drivers Grid ── */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 dark:text-neutral-400">
          Loading fleet drivers...
        </div>
      ) : filteredDrivers.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-white/5 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-neutral-800 text-slate-400 dark:text-neutral-500 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-sora font-semibold text-sm text-slate-800 dark:text-neutral-200">
              No drivers match your criteria
            </h3>
            <p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">
              Try modifying your search or click below to add a new driver.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1fa85a] hover:bg-[#19904d] text-neutral-950 font-bold text-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Driver</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredDrivers.map((driver) => {
            const initial = driver.name.charAt(0).toUpperCase();
            const cleanPhone = driver.phone.replace(/[^0-9]/g, '');

            return (
              <div
                key={driver._id || driver.id}
                className="p-6 rounded-3xl bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-white/5 hover:border-emerald-500/30 transition-all duration-200 shadow-sm flex flex-col justify-between space-y-5"
              >
                {/* Driver Card Header */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-sora font-bold text-lg flex items-center justify-center shadow-md shrink-0">
                        {initial}
                      </div>
                      <div>
                        <h3 className="font-sora font-bold text-base text-slate-900 dark:text-white leading-tight">
                          {driver.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-neutral-400 mt-0.5 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{driver.phone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(driver)}
                      title="Click to toggle status"
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase transition-all flex items-center gap-1.5 ${
                        driver.status === 'On Duty'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : driver.status === 'Available'
                          ? 'bg-emerald-500/10 text-[#1fa85a] dark:text-[#6df59a] border border-emerald-500/20'
                          : 'bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 border border-slate-200 dark:border-white/10'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          driver.status === 'On Duty'
                            ? 'bg-amber-500 animate-pulse'
                            : driver.status === 'Available'
                            ? 'bg-[#1fa85a]'
                            : 'bg-slate-400'
                        }`}
                      />
                      <span>{driver.status}</span>
                    </button>
                  </div>

                  {/* Machinery & License Info */}
                  <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-neutral-950/70 border border-slate-200 dark:border-white/5 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between text-slate-700 dark:text-neutral-300">
                      <span className="flex items-center gap-1.5 text-slate-500 dark:text-neutral-400 text-[11px]">
                        <Tractor className="w-3.5 h-3.5 text-emerald-500" />
                        Assigned Tractor:
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[170px]" title={driver.assignedTractor}>
                        {driver.assignedTractor}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-700 dark:text-neutral-300">
                      <span className="flex items-center gap-1.5 text-slate-500 dark:text-neutral-400 text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                        DL Number:
                      </span>
                      <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-neutral-200">
                        {driver.licenseNumber}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-700 dark:text-neutral-300">
                      <span className="flex items-center gap-1.5 text-slate-500 dark:text-neutral-400 text-[11px]">
                        <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                        Experience:
                      </span>
                      <span>{driver.experienceYears || 3} Years</span>
                    </div>

                    {driver.address && (
                      <div className="flex items-center justify-between text-slate-700 dark:text-neutral-300">
                        <span className="flex items-center gap-1.5 text-slate-500 dark:text-neutral-400 text-[11px]">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          Location:
                        </span>
                        <span className="truncate max-w-[170px]">{driver.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Operational Telemetry Summary */}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-neutral-800/80 text-center">
                      <span className="block text-[10px] text-slate-400 dark:text-neutral-500 uppercase font-semibold">Engine Run</span>
                      <span className="font-sora font-bold text-xs text-emerald-600 dark:text-emerald-400">{driver.totalHours || 0} Hours</span>
                    </div>
                    <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-neutral-800/80 text-center">
                      <span className="block text-[10px] text-slate-400 dark:text-neutral-500 uppercase font-semibold">Jobs Completed</span>
                      <span className="font-sora font-bold text-xs text-slate-900 dark:text-white">{driver.totalTrips || 0} Trips</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Bar */}
                <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Fast Call */}
                    <a
                      href={`tel:${cleanPhone}`}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      title="Direct Phone Call"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>

                    {/* WhatsApp */}
                    <a
                      href={`https://wa.me/${cleanPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:text-emerald-500 transition-colors"
                      title="Send WhatsApp Message"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>

                    {/* Edit Driver */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(driver)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      title="Edit Driver Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Driver */}
                    <button
                      type="button"
                      onClick={() => handleDeleteDriver(driver)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                      title="Remove Driver"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Start Bill CTA with this Driver */}
                  {onSelectDriverForBill && (
                    <button
                      type="button"
                      onClick={() => onSelectDriverForBill(driver.name)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-[#1fa85a] dark:text-[#6df59a] border border-emerald-500/20 text-xs font-semibold transition-all active:scale-95"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Start Bill</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add / Edit Driver Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-neutral-950 border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sora font-bold text-lg text-slate-900 dark:text-white">
                    {editingDriver ? 'Edit Fleet Driver' : 'Register New Fleet Driver'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">
                    Enter operator credentials and tractor machinery assignment.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Driver Form */}
            <form onSubmit={handleSubmitDriver} className="space-y-4">
              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                    Driver Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Murugan M"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 94433 11223"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* DL Number & Manually Assigned Tractor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                    Driving License (DL) *
                  </label>
                  <input
                    type="text"
                    required
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value.toUpperCase())}
                    placeholder="TN-28-2022-0098234"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                    Assigned Tractor (Manual Name) *
                  </label>
                  <input
                    type="text"
                    required
                    list="tractor-suggestions-list"
                    value={assignedTractor}
                    onChange={(e) => setAssignedTractor(e.target.value)}
                    placeholder="e.g. Mahindra 575 DI (TN-28-AT-5590)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                  <datalist id="tractor-suggestions-list">
                    {TRACTOR_SUGGESTIONS.map((tractor) => (
                      <option key={tractor} value={tractor} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Experience, Status & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                    Exp (Yrs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                    Driver Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Driver['status'])}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  >
                    <option value="Available">Available for Dispatch</option>
                    <option value="On Duty">On Duty (Active Field Run)</option>
                    <option value="Inactive">Inactive / Leave</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                    Village / Location
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Kangeyam, Tirupur Dist"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Optional Login Account Provisioning (New drivers only) */}
              {!editingDriver && (
                <div className="pt-2 border-t border-slate-200 dark:border-white/10 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createLoginAccount}
                      onChange={(e) => setCreateLoginAccount(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span className="text-xs font-semibold text-slate-800 dark:text-neutral-200">
                      Provision login account for this driver
                    </span>
                  </label>

                  {createLoginAccount && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-white/5 animate-fadeIn">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-neutral-400 mb-1">
                          Driver Login Email
                        </label>
                        <input
                          type="email"
                          required={createLoginAccount}
                          value={driverEmail}
                          onChange={(e) => setDriverEmail(e.target.value)}
                          placeholder="driver@agri.in"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-950 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-neutral-400 mb-1">
                          Driver Login Password
                        </label>
                        <input
                          type="password"
                          minLength={6}
                          required={createLoginAccount}
                          value={driverPassword}
                          onChange={(e) => setDriverPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-950 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#1fa85a] hover:bg-[#19904d] text-neutral-950 font-sora font-bold text-xs shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {submitting
                    ? 'Saving...'
                    : editingDriver
                    ? 'Update Driver'
                    : 'Register Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
