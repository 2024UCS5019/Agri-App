'use client';

import React, { useEffect, useState } from 'react';
import { Bill, TractorServiceConfig } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { getLocalTractorServiceConfig } from '@/lib/api';
import { downloadInvoicePDF, shareInvoiceViaWhatsApp } from '@/lib/pdfGenerator';
import {
  X,
  Printer,
  Share2,
  Download,
  CheckCircle2,
  AlertCircle,
  Truck,
  Phone,
} from 'lucide-react';

interface InvoiceModalProps {
  bill: Bill | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ bill, onClose }) => {
  const { t } = useLanguage();
  const [serviceConfig, setServiceConfig] = useState<TractorServiceConfig>(getLocalTractorServiceConfig);

  // Prevent background scrolling and enable ESC key to close
  useEffect(() => {
    if (!bill) return;
    setServiceConfig(getLocalTractorServiceConfig());
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = origOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [bill, onClose]);

  if (!bill) return null;

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amt || 0);
  };

  const isPaid = bill.status === 'Paid';

  const handleDownloadPDF = () => {
    downloadInvoicePDF(bill, undefined, serviceConfig);
  };

  const shareWhatsApp = async () => {
    await shareInvoiceViaWhatsApp(bill, undefined, serviceConfig);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto no-scrollbar animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg my-auto rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden no-scrollbar print:w-full print:max-h-none print:border-none print:shadow-none print:bg-white print:text-black"
      >
        {/* Top Modal Controls (sticky at top, never cut off, hidden on print) */}
        <div className="flex items-center justify-between px-4 py-3 sm:py-3.5 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-neutral-950/90 backdrop-blur-md shrink-0 z-20 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {t.taxInvoice}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={shareWhatsApp}
              className="p-1.5 sm:p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all text-xs flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 active:scale-98"
              title="Download PDF & Share to WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>WhatsApp PDF</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="p-1.5 sm:p-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-800 dark:text-neutral-200 border border-slate-200 dark:border-white/10 font-bold transition-all text-xs flex items-center gap-1.5 shadow-sm active:scale-98"
              title="Download official PDF file directly to device"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={() => window.print()}
              className="hidden sm:flex p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 font-medium transition-all text-xs items-center gap-1.5"
              title="Print Receipt"
            >
              <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white border border-slate-200 dark:border-transparent transition-all shadow-sm"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Body (Smooth internal scroll if screen is short, no scrollbar visible) */}
        <div
          id="invoice-print-area"
          className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-4 sm:space-y-5 print:p-0 print:overflow-visible text-slate-900 dark:text-white no-scrollbar"
        >
          {/* Header Brand */}
          <div className="text-center border-b border-slate-200 dark:border-white/10 pb-4 print:border-gray-300">
            <div className="inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 mb-2 print:bg-gray-100 print:text-black">
              <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase print:text-black">
              {serviceConfig.serviceName || 'MUTHU AGRI TRACTOR SERVICES'}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-neutral-400 mt-0.5 print:text-gray-600">
              {serviceConfig.tagline || 'High Precision Agricultural Cultivation & Machinery'}
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-neutral-500 print:text-gray-500">
              {serviceConfig.location || 'Tamil Nadu, India'} • Operator: {bill.driverName || 'Logesh M'} • Helpline: {serviceConfig.phone || '+91 94433 88123'}
            </p>
          </div>

          {/* Invoice Metadata Row */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-neutral-950/60 p-3 sm:p-3.5 rounded-2xl border border-slate-200 dark:border-white/5 print:bg-gray-50 print:border-gray-200 print:text-black">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-neutral-500 uppercase tracking-wider block print:text-gray-500">{t.invoiceNumber}</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm print:text-black">
                {(bill.billId || '#AGRI-001').replace(/[-_]?2026/g, '')}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 dark:text-neutral-500 uppercase tracking-wider block print:text-gray-500">{t.dateTime}</span>
              <span className="font-semibold text-slate-900 dark:text-white print:text-black">
                {(bill.date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })).replace(/[\s\-/]?2026/g, '').trim()}
              </span>
            </div>
          </div>

          {/* Farmer & Machinery Details */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-500 dark:text-neutral-500 uppercase tracking-wider block print:text-gray-500">{t.customerFarmer}</span>
              <p className="font-bold text-slate-900 dark:text-white text-sm print:text-black">{bill.customerName}</p>
              <p className="text-slate-500 dark:text-neutral-400 flex items-center gap-1 print:text-gray-600 text-xs">
                <Phone className="w-3 h-3 text-slate-400 dark:text-neutral-500" />
                {bill.customerPhone || 'N/A'}
              </p>
            </div>

            <div className="text-right space-y-0.5">
              <span className="text-[10px] text-slate-500 dark:text-neutral-500 uppercase tracking-wider block print:text-gray-500">{t.machineryAttachment}</span>
              <p className="font-bold text-slate-900 dark:text-white text-sm print:text-black">{bill.workType}</p>
              {bill.variant && (
                <p className="text-emerald-600 dark:text-emerald-400 font-medium print:text-emerald-800 text-xs">{bill.variant}</p>
              )}
            </div>
          </div>

          {/* Season, Location & Operator Meta Strip */}
          {(bill.season || bill.location || bill.driverName) && (
            <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-50 dark:bg-neutral-950/70 border border-slate-200 dark:border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] print:bg-gray-50 print:border-gray-200">
              {bill.season && (
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Season / பருவம்</span>
                  <span className="font-semibold text-slate-800 dark:text-neutral-200">{bill.season}</span>
                </div>
              )}
              {bill.location && (
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Field Location</span>
                  <span className="font-semibold text-slate-800 dark:text-neutral-200 truncate block">{bill.location}</span>
                </div>
              )}
              {bill.driverName && (
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Tractor Operator</span>
                  <span className="font-semibold text-slate-800 dark:text-neutral-200">{bill.driverName}</span>
                </div>
              )}
            </div>
          )}

          {/* Calculation Table */}
          <div className="border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden print:border-gray-300">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-neutral-950 text-slate-600 dark:text-neutral-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-white/10 print:bg-gray-100 print:text-black print:border-gray-300">
                <tr>
                  <th className="py-2 px-3 sm:px-4">{t.serviceDescription}</th>
                  <th className="py-2 px-2 text-center">{t.duration}</th>
                  <th className="py-2 px-2 text-center">{t.ratePerHour}</th>
                  <th className="py-2 px-3 sm:px-4 text-right">{t.totalCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 print:divide-gray-200">
                <tr className="text-slate-800 dark:text-neutral-200 print:text-black">
                  <td className="py-2.5 px-3 sm:px-4 font-medium">
                    {bill.workType} Field Service
                    {bill.notes && <div className="text-[10px] text-slate-500 dark:text-neutral-500 print:text-gray-500">{bill.notes}</div>}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono font-bold text-amber-600 dark:text-amber-400 print:text-black">
                    {bill.durationFormatted}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono">
                    ₹{bill.ratePerHour}/hr
                  </td>
                  <td className="py-2.5 px-3 sm:px-4 text-right font-bold text-slate-900 dark:text-white print:text-black">
                    {formatCurrency(bill.totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total & Settlement Status Stamp */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-white/10 print:border-gray-300">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-neutral-500 uppercase tracking-wider block print:text-gray-500">{t.paymentStatus}</span>
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-1 ${
                  isPaid
                    ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40 print:text-emerald-700 print:border-emerald-600'
                    : 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/40 print:text-amber-700 print:border-amber-600'
                }`}
              >
                {isPaid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>{bill.status === 'Paid' ? t.paid : t.pending}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 dark:text-neutral-400 block print:text-gray-600">{t.netTotal}</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 print:text-black">
                {formatCurrency(bill.totalAmount)}
              </span>
            </div>
          </div>

          {/* Final Customer Description Note */}
          {serviceConfig.customerDescription && (
            <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 print:bg-gray-50 print:border-gray-200 print:text-black">
              <span className="font-bold text-[10px] uppercase tracking-wider block text-emerald-700 dark:text-emerald-400 mb-0.5 print:text-gray-600">
                Customer Note:
              </span>
              <p className="italic leading-relaxed">
                {serviceConfig.customerDescription}
              </p>
            </div>
          )}

          {/* Footer Signature */}
          <div className="pt-4 border-t border-slate-200 dark:border-white/5 flex items-center justify-end text-xs text-slate-400 dark:text-neutral-500 print:border-gray-200 print:text-gray-500">
            <div className="text-right">
              <div className="w-24 sm:w-28 border-b border-slate-300 dark:border-white/20 mb-1 ml-auto print:border-gray-400" />
              <p className="font-semibold text-slate-800 dark:text-neutral-300 print:text-black">{t.authorizedDriver}</p>
              <p className="text-[10px] text-slate-500 dark:text-neutral-400 font-medium">{bill.driverName || 'Muthu'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
