'use client';

import React, { useState, useEffect } from 'react';
import { Bill } from '@/types';
import { getCleanIndianPhone } from '@/lib/smsSender';
import { getLocalTractorServiceConfig } from '@/lib/api';
import {
  X,
  StickyNote,
  Calendar,
  IndianRupee,
  Phone,
  MessageSquare,
  MessageCircle,
  Save,
  Trash2,
} from 'lucide-react';

interface NoteReminderModalProps {
  bill: Bill | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveNote: (billId: string, updatedNote: string) => void;
  addToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const NoteReminderModal: React.FC<NoteReminderModalProps> = ({
  bill,
  isOpen,
  onClose,
  onSaveNote,
  addToast,
}) => {
  const [noteText, setNoteText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueAmount, setDueAmount] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (bill) {
      setNoteText(bill.notes || '');
      setDueAmount(bill.status === 'Paid' ? '0' : String(bill.totalAmount || 0));

      // Attempt to parse existing due date from notes if previously structured
      const dueMatch = (bill.notes || '').match(/Due Date:\s*([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}\s+[A-Za-z]+)/i);
      if (dueMatch && dueMatch[1]) {
        // Keep note text as is
      }
      setDueDate('');
    }
  }, [bill, isOpen]);

  if (!isOpen || !bill) return null;

  const phoneInfo = getCleanIndianPhone(bill.customerPhone || '');
  const config = getLocalTractorServiceConfig();

  // Quick Due Date helpers
  const setQuickDate = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setDueDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleAppendSuggestion = (suggestion: string) => {
    setNoteText((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return suggestion;
      if (trimmed.includes(suggestion)) return trimmed;
      return `${trimmed} • ${suggestion}`;
    });
  };

  const compileFullNote = (): string => {
    const parts: string[] = [];
    if (dueDate) {
      const formattedDate = new Date(dueDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      parts.push(`📅 Due Date: ${formattedDate}`);
    }
    if (dueAmount && Number(dueAmount) > 0) {
      parts.push(`💰 Due Amount: ₹${Number(dueAmount).toLocaleString('en-IN')}`);
    }
    if (noteText.trim()) {
      parts.push(noteText.trim());
    }
    return parts.join(' | ');
  };

  const handleSave = () => {
    setIsSaving(true);
    const finalNote = compileFullNote();
    const targetId = bill._id || bill.billId || bill.id || '';
    onSaveNote(targetId, finalNote);
    setIsSaving(false);
    addToast?.(`📝 Reminder & notes saved for ${bill.customerName}!`, 'success');
    onClose();
  };

  const handleClearNote = () => {
    const targetId = bill._id || bill.billId || bill.id || '';
    onSaveNote(targetId, '');
    setNoteText('');
    setDueDate('');
    setDueAmount('');
    addToast?.(`🗑️ Note cleared for invoice ${bill.billId}!`, 'info');
    onClose();
  };

  // Send WhatsApp Reminder
  const handleSendWhatsAppReminder = () => {
    const serviceName = config.serviceName || 'Tractor Fleet';
    const amountStr = dueAmount ? `₹${dueAmount}` : `₹${bill.totalAmount}`;
    const dateStr = dueDate ? ` by ${dueDate}` : '';
    const reminderMsg =
      `*🌾 ${serviceName.toUpperCase()} - PAYMENT REMINDER*\n` +
      `--------------------------------\n` +
      `Farmer: ${bill.customerName}\n` +
      `Bill No: ${bill.billId}\n` +
      `Work: ${bill.workType} (${bill.durationFormatted})\n` +
      `Pending Due: ${amountStr}${dateStr}\n` +
      (noteText ? `Note: ${noteText}\n` : '') +
      `--------------------------------\n` +
      `Kindly arrange payment at your earliest convenience. Thank you!`;

    const encoded = encodeURIComponent(reminderMsg);
    const url = phoneInfo.national10.length === 10
      ? `https://wa.me/91${phoneInfo.national10}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
    addToast?.(`Opening WhatsApp reminder for ${bill.customerName}...`, 'success');
  };

  // Send Native SMS Reminder
  const handleSendSmsReminder = () => {
    const serviceName = config.serviceName || 'Tractor Fleet';
    const amountStr = dueAmount ? `Rs. ${dueAmount}` : `Rs. ${bill.totalAmount}`;
    const dateStr = dueDate ? ` by ${dueDate}` : '';
    const smsMsg =
      `REMINDER: ${serviceName}\n` +
      `Bill: ${bill.billId}\n` +
      `Customer: ${bill.customerName}\n` +
      `Due: ${amountStr}${dateStr}\n` +
      (noteText ? `Note: ${noteText}\n` : '') +
      `Helpline: ${config.phone || '+91 94433 88123'}`;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const delimiter = isIOS ? '&' : '?';
    const recipient = phoneInfo.fullE164;
    const smsUrl = recipient
      ? `sms:${recipient}${delimiter}body=${encodeURIComponent(smsMsg)}`
      : `sms:${delimiter}body=${encodeURIComponent(smsMsg)}`;

    try {
      const a = document.createElement('a');
      a.href = smsUrl;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.location.href = smsUrl;
    }

    addToast?.(`Dispatched SMS reminder for ${bill.customerName}!`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 dark:bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh] animate-scaleUp">
        {/* Accent Amber Top Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-400 to-amber-600" />

        {/* Modal Top Bar */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <StickyNote className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-sora font-bold text-sm text-slate-900 dark:text-white">
                Payment Reminder & Due Note
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                {bill.billId || '#INV'} • {bill.date}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 space-y-4 overflow-y-auto no-scrollbar">
          {/* Customer & Bill Overview Pill */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-neutral-950/80 border border-slate-200 dark:border-white/5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-sora font-bold text-xs text-slate-900 dark:text-white truncate">
                {bill.customerName}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-neutral-400 flex items-center gap-1 font-mono">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{phoneInfo.formattedDisplay || bill.customerPhone}</span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="font-sora font-extrabold text-sm text-slate-900 dark:text-white">
                ₹{bill.totalAmount?.toLocaleString('en-IN')}
              </div>
              <span className={`inline-block px-2 py-0.2 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                bill.status === 'Paid'
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
              }`}>
                ● {bill.status}
              </span>
            </div>
          </div>

          {/* Due Date & Due Amount Form Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Due Date Input */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>Reminder / Due Date</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-medium"
              />
              {/* Quick Date Presets */}
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setQuickDate(1)}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-[10px] text-slate-600 dark:text-slate-300 font-medium transition-colors"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(3)}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-[10px] text-slate-600 dark:text-slate-300 font-medium transition-colors"
                >
                  In 3 Days
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(7)}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-[10px] text-slate-600 dark:text-slate-300 font-medium transition-colors"
                >
                  In 7 Days
                </button>
              </div>
            </div>

            {/* Reminder Amount Input */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-amber-500" />
                <span>Pending / Due Amount (₹)</span>
              </label>
              <input
                type="number"
                placeholder="e.g. 1500"
                value={dueAmount}
                onChange={(e) => setDueAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-medium"
              />
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setDueAmount(String(bill.totalAmount || 0))}
                  className="px-2 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-[10px] text-amber-700 dark:text-amber-300 font-medium transition-colors"
                >
                  Full (₹{bill.totalAmount})
                </button>
                <button
                  type="button"
                  onClick={() => setDueAmount(String(Math.round((bill.totalAmount || 0) / 2)))}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-[10px] text-slate-600 dark:text-slate-300 font-medium transition-colors"
                >
                  50% Balance
                </button>
              </div>
            </div>
          </div>

          {/* Custom Note & Remarks Textarea */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <StickyNote className="w-3.5 h-3.5 text-amber-500" />
              <span>Notes & Follow-up Remarks</span>
            </label>
            <textarea
              rows={3}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="e.g. Farmer promised to settle balance next Friday after crop harvest..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 font-medium resize-none leading-relaxed"
            />

            {/* Quick Suggestion Chips */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="text-[10px] font-bold text-slate-400 mr-1">Quick:</span>
              <button
                type="button"
                onClick={() => handleAppendSuggestion('Promised to settle balance on due date')}
                className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-[10px] text-slate-600 dark:text-slate-300 transition-colors"
              >
                + Promised on Due Date
              </button>
              <button
                type="button"
                onClick={() => handleAppendSuggestion('Advance received, balance pending')}
                className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-[10px] text-slate-600 dark:text-slate-300 transition-colors"
              >
                + Advance Received
              </button>
              <button
                type="button"
                onClick={() => handleAppendSuggestion('Call farmer to follow up')}
                className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-[10px] text-slate-600 dark:text-slate-300 transition-colors"
              >
                + Call to Follow Up
              </button>
            </div>
          </div>

          {/* Instant Customer Reminder Dispatch Options */}
          <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200">
                Direct Follow-up Reminder
              </span>
              <span className="text-[10px] text-amber-700 dark:text-amber-300 font-mono">
                Prefills Due & Notes
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleSendWhatsAppReminder}
                className="py-2 px-3 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-emerald-800 dark:text-[#25D366] text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp Reminder</span>
              </button>

              <button
                type="button"
                onClick={handleSendSmsReminder}
                className="py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>SMS Reminder</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-neutral-950/90 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-3">
          {bill.notes ? (
            <button
              type="button"
              onClick={handleClearNote}
              className="px-3 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Note</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-neutral-700 transition-all"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-sora font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Note</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
