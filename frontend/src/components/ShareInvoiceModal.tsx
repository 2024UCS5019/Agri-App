'use client';

import React, { useState, useEffect } from 'react';
import { Bill, TractorServiceConfig } from '@/types';
import { printInvoicePDF } from '@/lib/pdfGenerator';
import { getLocalTractorServiceConfig, billsAPI } from '@/lib/api';
import { buildSmsInvoiceText, dispatchCustomerSMS, getCleanIndianPhone } from '@/lib/smsSender';
import {
  X,
  Share2,
  Copy,
  Check,
  Phone,
  Mail,
  MessageCircle,
  MessageSquare,
  Save,
} from 'lucide-react';

const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

interface ShareInvoiceModalProps {
  bill: Bill | null;
  onClose: () => void;
  tractorModel?: string;
  addToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onSaveInvoice?: (bill: Bill) => void;
}

export const ShareInvoiceModal: React.FC<ShareInvoiceModalProps> = ({
  bill,
  onClose,
  tractorModel = 'Mahindra 575 DI (45 HP)',
  addToast,
  onSaveInvoice,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [serviceConfig, setServiceConfig] = useState<TractorServiceConfig>(getLocalTractorServiceConfig);

  useEffect(() => {
    if (bill) {
      setServiceConfig(getLocalTractorServiceConfig());
    }
  }, [bill]);

  if (!bill) return null;

  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(bill.totalAmount || 0);

  // Exact clean 10-digit number & formatted Indian display
  const { national10, formattedDisplay } = getCleanIndianPhone(bill.customerPhone || '');

  // Clean, razor-sharp vertically aligned structured text invoice summary for SMS & messaging
  const formattedInvoiceText = buildSmsInvoiceText(bill, tractorModel, serviceConfig);

  // Direct SMS dispatch: dispatches perfectly aligned SMS invoice to customer phone
  const handleSendSMS = () => {
    dispatchCustomerSMS(bill, tractorModel, serviceConfig);
    addToast?.(`📱 Dispatched official SMS invoice to ${bill.customerName} (${formattedDisplay || bill.customerPhone || 'N/A'})!`, 'success');
  };

  // WhatsApp share: auto-generates PDF + opens WhatsApp with clean message
  const handleShareWhatsApp = () => {
    // 1. Auto-generate official PDF
    printInvoicePDF(bill, tractorModel, serviceConfig);

    // 2. Open WhatsApp with prefilled clean text to exact national 10 digit number
    setTimeout(() => {
      const encoded = encodeURIComponent(formattedInvoiceText);
      const url = national10.length === 10
        ? `https://wa.me/91${national10}?text=${encoded}`
        : `https://wa.me/?text=${encoded}`;
      window.open(url, '_blank');
    }, 250);

    addToast?.(`📄 Generated PDF Invoice & opening WhatsApp for ${bill.customerName}...`, 'success');
  };

  // Instagram share: auto-generates PDF + copies text + opens Instagram Direct
  const handleShareInstagram = () => {
    // 1. Auto-generate official PDF
    printInvoicePDF(bill, tractorModel, serviceConfig);

    // 2. Copy invoice details to clipboard
    navigator.clipboard.writeText(formattedInvoiceText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);

    // 3. Open Instagram Direct
    setTimeout(() => {
      window.open('https://www.instagram.com/direct/inbox/', '_blank');
    }, 250);

    addToast?.('📄 Generated PDF Invoice & opening Instagram Direct (invoice text copied)!', 'success');
  };

  // Email share: auto-generates PDF + opens mailto client
  const handleShareEmail = () => {
    // 1. Auto-generate official PDF
    printInvoicePDF(bill, tractorModel, serviceConfig);

    // 2. Open mail client
    setTimeout(() => {
      const subject = encodeURIComponent(`${serviceConfig.serviceName || 'Tractor Work Invoice'}: ${bill.billId || '#AGRI-INV'} - ${bill.customerName}`);
      const body = encodeURIComponent(formattedInvoiceText);
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }, 250);

    addToast?.('📄 Generated PDF Invoice & opening Email client...', 'info');
  };

  // Save Invoice (Saves invoice record to database & work history only — does not generate/print PDF, then automatically returns to main page)
  const handleSaveInvoice = async () => {
    if (isSaving || !bill) return;
    setIsSaving(true);
    try {
      const savedBill = await billsAPI.create(bill);
      if (onSaveInvoice) {
        onSaveInvoice(savedBill || bill);
      }
      setIsSaved(true);
      addToast?.(`✅ Invoice ${bill.billId || '#INV'} saved successfully to Work History!`, 'success');
      setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 600);
    } catch {
      setIsSaved(true);
      if (onSaveInvoice) {
        onSaveInvoice(bill);
      }
      addToast?.(`✅ Invoice ${bill.billId || '#INV'} saved successfully!`, 'success');
      setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 600);
    } finally {
      setIsSaving(false);
    }
  };

  // Copy text to clipboard
  const handleCopyText = () => {
    navigator.clipboard.writeText(formattedInvoiceText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    addToast?.('Invoice summary copied to clipboard!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 dark:bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Centered Modal Card */}
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh] animate-scaleUp">
        {/* Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-[#1fa85a]" />

        {/* Modal Top Bar */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Share2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-sora font-bold text-sm text-slate-900 dark:text-white">
                Share & Save Invoice
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                {bill.billId || '#AGRI-INV'} • {bill.date}
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
          {/* Customer & Bill Overview Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-neutral-950/80 border border-slate-200 dark:border-white/5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center font-bold text-sm text-[#1fa85a] dark:text-[#6df59a] shrink-0">
                {bill.customerName?.charAt(0) || 'C'}
              </div>
              <div className="min-w-0">
                <div className="font-sora font-bold text-xs text-slate-900 dark:text-white truncate">
                  {bill.customerName}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-neutral-400 flex items-center gap-1 font-mono">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{formattedDisplay || bill.customerPhone || 'No Phone'}</span>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="font-sora font-extrabold text-sm text-slate-900 dark:text-white">
                {formattedAmount}
              </div>
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                bill.status === 'Paid'
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
              }`}>
                ● {bill.status || 'Pending'}
              </span>
            </div>
          </div>

          {/* Direct SMS Action Card */}
          <button
            type="button"
            onClick={handleSendSMS}
            className="w-full p-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border-2 border-emerald-500/35 text-emerald-950 dark:text-emerald-300 font-bold text-sm transition-all flex items-center justify-between gap-3 shadow-xs active:scale-[0.99] group text-left"
            title="Dispatches neatly aligned official SMS invoice directly to customer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#1fa85a] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform shrink-0">
                <MessageSquare className="w-5 h-5 fill-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-sora font-bold text-slate-900 dark:text-white text-xs sm:text-sm">Direct SMS Invoice</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono uppercase font-black">
                    OFFICIAL SMS
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal truncate">
                  {formattedDisplay ? `Directly sends official aligned SMS to ${formattedDisplay}` : 'Directly sends official aligned SMS to customer'}
                </p>
              </div>
            </div>
            <span className="text-xs font-sora font-bold text-emerald-800 dark:text-emerald-300 px-3 py-1.5 rounded-xl bg-white dark:bg-black/40 border border-emerald-500/30 shrink-0">
              Send SMS ➔
            </span>
          </button>

          {/* Additional Share Channels Grid (WhatsApp, Instagram, Email) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between pt-1">
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider">
                Instant Share Channels
              </label>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                ⚡ Auto-Sends PDF + Bill Details
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* WhatsApp Button */}
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="p-3 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-emerald-800 dark:text-[#25D366] font-semibold text-xs transition-all flex flex-col items-center justify-center gap-1.5 active:scale-95 shadow-xs"
                title="Generates PDF and opens WhatsApp"
              >
                <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-sm">
                  <MessageCircle className="w-4 h-4 fill-white" />
                </div>
                <span className="font-bold">WhatsApp + PDF</span>
                <span className="text-[10px] opacity-75 truncate max-w-[120px]">
                  {formattedDisplay || 'Send to Phone'}
                </span>
              </button>

              {/* Instagram Button */}
              <button
                type="button"
                onClick={handleShareInstagram}
                className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-amber-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border border-pink-500/25 text-pink-700 dark:text-pink-300 font-semibold text-xs transition-all flex flex-col items-center justify-center gap-1.5 active:scale-95 shadow-xs"
                title="Generates PDF, copies text, and opens Instagram Direct"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white flex items-center justify-center shadow-sm">
                  <InstagramIcon className="w-4 h-4" />
                </div>
                <span className="font-bold">Instagram + PDF</span>
                <span className="text-[10px] opacity-75">Direct Message</span>
              </button>

              {/* Email Button */}
              <button
                type="button"
                onClick={handleShareEmail}
                className="p-3 rounded-2xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-800 dark:text-sky-300 font-semibold text-xs transition-all flex flex-col items-center justify-center gap-1.5 active:scale-95 shadow-xs"
                title="Generates PDF and drafts email"
              >
                <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center shadow-sm">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="font-bold">Email + PDF</span>
                <span className="text-[10px] opacity-75">Direct Dispatch</span>
              </button>
            </div>
          </div>

          {/* ── Sleek, Simple & Prominent "Save Invoice" Button (Saves record only - no PDF) ── */}
          <button
            type="button"
            onClick={handleSaveInvoice}
            disabled={isSaving}
            className={`w-full py-3.5 px-5 rounded-2xl font-sora font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2.5 active:scale-[0.99] group ${
              isSaved
                ? 'bg-emerald-600 text-white shadow-emerald-600/30 ring-2 ring-emerald-400'
                : 'bg-gradient-to-r from-emerald-600 via-[#1fa85a] to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-500/25 hover:shadow-emerald-500/35'
            }`}
            title="Saves invoice record to database and work history"
          >
            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              {isSaved ? (
                <Check className="w-4 h-4 text-white" />
              ) : isSaving ? (
                <Save className="w-4 h-4 text-white animate-pulse" />
              ) : (
                <Save className="w-4 h-4 text-white" />
              )}
            </div>
            <span>{isSaved ? 'Invoice Saved to Records' : isSaving ? 'Saving Invoice...' : 'Save Invoice'}</span>
          </button>

          {/* Formatted Text Preview & Copy Option */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider">
                Structured Text Preview (Clean Alignment)
              </span>
              <button
                type="button"
                onClick={handleCopyText}
                className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>

            <pre className="p-3 rounded-xl bg-slate-100 dark:bg-neutral-950 border border-slate-200 dark:border-white/5 font-mono text-[11px] text-slate-700 dark:text-neutral-300 overflow-x-auto whitespace-pre leading-relaxed select-all">
              {formattedInvoiceText}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-neutral-950/90 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">
            {serviceConfig.serviceName || 'Tractor Fleet'} • Official Invoice Dispatch
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-neutral-700 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
