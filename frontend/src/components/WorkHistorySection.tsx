'use client';

import React, { useState, useMemo } from 'react';
import { Bill, Stats, User } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import {
  Search,
  Share2,
  Trash2,
  Clock,
  ArrowUpDown,
  AlertCircle,
  Phone,
  Wrench,
  Tractor,
  IndianRupee,
  CheckCircle2,
  StickyNote,
} from 'lucide-react';
import { NoteReminderModal } from './NoteReminderModal';

interface WorkHistorySectionProps {
  bills: Bill[];
  stats?: Stats;
  currentUser?: User | null;
  onToggleStatus: (id: string, currentStatus: 'Paid' | 'Pending') => void;
  onDeleteBill: (id: string) => void;
  onViewInvoice?: (bill: Bill) => void;
  onShareInvoice?: (bill: Bill) => void;
  onNewBillClick: () => void;
  onUpdateBillNote?: (id: string, notes: string) => void;
  addToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const WorkHistorySection: React.FC<WorkHistorySectionProps> = ({
  bills,
  stats,
  currentUser,
  onToggleStatus,
  onDeleteBill,
  onShareInvoice,
  onNewBillClick,
  onUpdateBillNote,
  addToast,
}) => {
  const { t } = useLanguage();
  const [activeNoteBill, setActiveNoteBill] = useState<Bill | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Pending'>('All');
  const [workTypeFilter, setWorkTypeFilter] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amt || 0);
  };

  const filteredBills = useMemo(() => {
    return bills
      .filter((b) => {
        const matchesSearch =
          b.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.billId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.customerPhone?.includes(searchQuery) ||
          b.workType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.driverName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.location?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
        const matchesType =
          workTypeFilter === 'All' ||
          b.workType?.toLowerCase().includes(workTypeFilter.toLowerCase());

        return matchesSearch && matchesStatus && matchesType;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt || 0).getTime();
        const dateB = new Date(b.date || b.createdAt || 0).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [bills, searchQuery, statusFilter, workTypeFilter, sortOrder]);

  const totalFilteredAmount = useMemo(() => {
    if (!Array.isArray(filteredBills)) return 0;
    return filteredBills.reduce((acc, curr) => acc + (Number(curr?.totalAmount) || 0), 0);
  }, [filteredBills]);

  const safeStats = stats || {
    totalRevenue: 0,
    totalHours: 0,
    pendingDues: 0,
    completedJobs: 0,
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── Top KPI Metrics Ribbon ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-5 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-md flex items-center gap-4 hover:border-emerald-500/40 transition-all shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">{t.totalRevenue}</span>
            <h3 className="font-sora font-extrabold text-2xl text-slate-900 dark:text-white tracking-tight mt-0.5">
              ₹{(safeStats.totalRevenue || 0).toLocaleString()}
            </h3>
          </div>
        </div>

        {/* Hours Logged */}
        <div className="p-5 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-md flex items-center gap-4 hover:border-emerald-500/40 transition-all shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">{t.hoursLogged}</span>
            <h3 className="font-sora font-extrabold text-2xl text-slate-900 dark:text-white tracking-tight mt-0.5">
              {(Number(safeStats.totalHours) || 0).toFixed(1)} hrs
            </h3>
          </div>
        </div>

        {/* Pending Dues */}
        <div className="p-5 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-md flex items-center gap-4 hover:border-amber-500/40 transition-all shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">{t.pendingDues}</span>
            <h3 className="font-sora font-extrabold text-2xl text-amber-600 dark:text-amber-400 tracking-tight mt-0.5">
              ₹{(safeStats.pendingDues || 0).toLocaleString()}
            </h3>
          </div>
        </div>

        {/* Completed Jobs */}
        <div className="p-5 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-md flex items-center gap-4 hover:border-emerald-500/40 transition-all shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">{t.completedJobs}</span>
            <h3 className="font-sora font-extrabold text-2xl text-slate-900 dark:text-white tracking-tight mt-0.5">
              {safeStats.completedJobs || 0}
            </h3>
          </div>
        </div>
      </div>

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/5 pb-6">
        <div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t.ledgerTitle}
          </h2>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">
            {currentUser?.role === 'Driver'
              ? `Personal tractor sessions, billing records, and payment settlements for Operator ${currentUser.name}.`
              : t.ledgerSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNewBillClick}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 active:scale-95"
          >
            {t.newTractorBill}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar Strip */}
      <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-white/5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-white/10 focus:border-emerald-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 text-xs transition-all outline-none"
            />
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3 flex items-center bg-slate-100 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 rounded-xl p-1">
            {(['All', 'Paid', 'Pending'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  statusFilter === status
                    ? 'bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-bold shadow-sm'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {status === 'All' ? t.all : status === 'Paid' ? t.paid : t.pending}
              </button>
            ))}
          </div>

          {/* Implement Work Type Filter */}
          <div className="md:col-span-3">
            <select
              value={workTypeFilter}
              onChange={(e) => setWorkTypeFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:border-emerald-500 outline-none"
            >
              <option value="All">{t.allImplements}</option>
              <option value="Rotavator">{t.rotavator}</option>
              <option value="Spring Cultivator">{t.springCultivator}</option>
              <option value="Harvest">{t.harvest}</option>
              <option value="Disc Cultivator">{t.discCultivator}</option>
              <option value="Laser Leveller">{t.laserLeveller}</option>
            </select>
          </div>

          {/* Sort Order Toggle */}
          <div className="md:col-span-1">
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="w-full h-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-neutral-950 border border-slate-300 dark:border-white/10 text-slate-700 hover:text-slate-900 dark:text-neutral-300 dark:hover:text-white flex items-center justify-center text-xs transition-all shadow-sm"
              title={`Sorting ${sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}`}
            >
              <ArrowUpDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </button>
          </div>
        </div>

        {/* Dynamic Summary Metric */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-white/5 text-xs text-slate-500 dark:text-neutral-400">
          <div>
            {t.showingEntries} <span className="font-bold text-slate-900 dark:text-white">{filteredBills.length}</span> {t.of}{' '}
            <span className="font-bold text-slate-900 dark:text-white">{bills.length}</span> {t.entries}
          </div>
          <div className="flex items-center gap-2">
            <span>{t.filteredTotal}:</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">{formatCurrency(totalFilteredAmount)}</span>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-neutral-900/40 backdrop-blur-sm shadow-sm">
        {filteredBills.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-neutral-800/80 border border-slate-200 dark:border-white/10 mx-auto flex items-center justify-center text-slate-400 dark:text-neutral-400">
              <AlertCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              {currentUser?.role === 'Driver' && !searchQuery && statusFilter === 'All' && workTypeFilter === 'All'
                ? `No invoices logged for Operator ${currentUser.name}`
                : t.noRecordsFound}
            </h4>
            <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'All' || workTypeFilter !== 'All'
                ? 'Try adjusting your search filters or keyword terms.'
                : currentUser?.role === 'Driver'
                ? `You haven't logged any tractor work sessions yet. Tap '+ New Tractor Bill' to record your first field job!`
                : t.noRecordsDesc}
            </p>
            <button
              onClick={onNewBillClick}
              className="mt-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold transition-all"
            >
              {t.newTractorBill}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900/90 text-slate-600 dark:text-neutral-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">{t.invoiceDateCol}</th>
                  <th className="py-3.5 px-4">{t.farmerCol}</th>
                  <th className="py-3.5 px-4">{t.driverCol}</th>
                  <th className="py-3.5 px-4">{t.implementCol}</th>
                  <th className="py-3.5 px-4">{t.durationRateCol}</th>
                  <th className="py-3.5 px-4 text-right">{t.totalCol}</th>
                  <th className="py-3.5 px-4 text-center">{t.statusCol}</th>
                  <th className="py-3.5 px-4 text-right">{t.actionsCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredBills.map((bill) => {
                  const billId = bill.id || bill._id || bill.billId;
                  const isPaid = bill.status === 'Paid';

                  return (
                    <tr
                      key={billId}
                      className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Invoice ID & Date */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {(bill.billId || '#AGRI-001').replace(/[-_]?2026/g, '')}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                          {(bill.date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })).replace(/[\s\-/]?2026/g, '').trim()}
                        </div>
                      </td>

                      {/* Farmer Details */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                            {bill.customerName?.charAt(0) || 'F'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {bill.customerName}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-neutral-400 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400 dark:text-neutral-400" />
                              {bill.customerPhone || 'N/A'}
                            </div>
                            {bill.notes && bill.notes.trim() && (
                              <button
                                type="button"
                                onClick={() => setActiveNoteBill(bill)}
                                className="mt-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-[10px] text-amber-700 dark:text-amber-400 border border-amber-500/25 flex items-center gap-1 max-w-[190px] truncate text-left transition-colors"
                                title={`Reminder: ${bill.notes}`}
                              >
                                <StickyNote className="w-2.5 h-2.5 shrink-0 text-amber-600 dark:text-amber-400" />
                                <span className="truncate">{bill.notes}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Driver / Operator Details */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs shrink-0">
                            <Tractor className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {bill.driverName || 'Logesh M'}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-neutral-400">
                              Operator
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Implement / Work Type */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-neutral-800/80 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-neutral-200">
                          <Wrench className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span className="font-medium">{bill.workType}</span>
                        </div>
                        {bill.variant && (
                          <div className="text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5 pl-1">
                            {bill.variant}
                          </div>
                        )}
                        {bill.season && (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 pl-1">
                            🌾 {bill.season}
                          </div>
                        )}
                        {bill.location && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[170px] mt-0.5 pl-1">
                            📍 {bill.location}
                          </div>
                        )}
                      </td>

                      {/* Duration & Rate */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900 dark:text-white flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                          {bill.durationFormatted}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                          ₹{bill.ratePerHour}/hr
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {formatCurrency(bill.totalAmount)}
                        </div>
                      </td>

                      {/* Status Toggle Button */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => onToggleStatus(billId, bill.status)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-sm ${
                            isPaid
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
                              : 'bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20'
                          }`}
                          title="Click to toggle Paid/Pending"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isPaid ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-amber-500 dark:bg-amber-400'
                            }`}
                          />
                          {bill.status}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onShareInvoice?.(bill)}
                            className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 transition-all border border-emerald-200 dark:border-emerald-500/20 shadow-sm"
                            title="Share Invoice (WhatsApp, Instagram, Email, PDF)"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setActiveNoteBill(bill)}
                            className={`p-2 rounded-lg transition-all border shadow-sm relative ${
                              bill.notes && bill.notes.trim()
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
                                : 'bg-slate-100 hover:bg-amber-50 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-500 hover:text-amber-600 dark:text-neutral-400 dark:hover:text-amber-400 border-slate-200 dark:border-white/5'
                            }`}
                            title={bill.notes ? `Payment / Due Note: ${bill.notes}` : 'Add Payment & Due Reminder Note'}
                          >
                            <StickyNote className="w-3.5 h-3.5" />
                            {bill.notes && bill.notes.trim() && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-black animate-pulse" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete invoice ${bill.billId}? This action cannot be undone.`)) {
                                onDeleteBill(billId);
                              }
                            }}
                            className="p-2 rounded-lg bg-slate-100 hover:bg-rose-100 dark:bg-neutral-800 dark:hover:bg-rose-950 text-slate-500 hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400 transition-all border border-slate-200 dark:border-white/5 shadow-sm"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Reminder & Due Date Note Modal */}
      <NoteReminderModal
        bill={activeNoteBill}
        isOpen={Boolean(activeNoteBill)}
        onClose={() => setActiveNoteBill(null)}
        onSaveNote={(targetId, noteText) => {
          if (onUpdateBillNote) {
            onUpdateBillNote(targetId, noteText);
          }
        }}
        addToast={addToast}
      />
    </div>
  );
};
