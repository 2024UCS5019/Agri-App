import { Bill, TractorServiceConfig } from '@/types';
import { getLocalTractorServiceConfig } from '@/lib/api';

/**
 * Normalizes Indian phone numbers, eliminating duplicate 91 prefixes.
 * Returns national 10-digit, E.164 (+91...), and formatted display strings.
 */
export const getCleanIndianPhone = (
  raw: string = ''
): { national10: string; fullE164: string; formattedDisplay: string } => {
  const digits = (raw || '').replace(/\D/g, '');
  let national10 = digits;
  if (digits.length === 12 && digits.startsWith('91')) {
    national10 = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    national10 = digits.slice(1);
  } else if (digits.length > 10) {
    national10 = digits.slice(-10);
  }

  const isTen = national10.length === 10;
  const fullE164 = isTen ? `+91${national10}` : national10 ? `+${national10}` : '';
  const formattedDisplay = isTen
    ? `+91 ${national10.slice(0, 5)} ${national10.slice(5)}`
    : national10
    ? `+91 ${national10}`
    : '';

  return { national10, fullE164, formattedDisplay };
};

/**
 * Formats a clean, professional, and razor-sharp vertically aligned SMS invoice.
 * Every label is padded to exactly 10 characters so all colons align vertically at column 11.
 */
export const buildSmsInvoiceText = (
  bill: Partial<Bill>,
  tractorModel: string = 'Mahindra 575 DI (45 HP)',
  customConfig?: TractorServiceConfig
): string => {
  const config = customConfig || getLocalTractorServiceConfig();
  const serviceName = (config.serviceName || 'ALM AGRO WORKS').toUpperCase();
  const helpline = config.phone || '+91 94433 88123';
  const customDesc = config.customerDescription || 'Official field session and billing invoice.';

  const billId = (bill.billId || '#AGRI-INV').replace(/[-_]?2026/g, '');
  const billDate = (
    bill.date ||
    new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  )
    .replace(/[\s\-/]?2026/g, '')
    .trim();

  const customer = (bill.customerName || 'Valued Farmer').trim();
  const phoneInfo = getCleanIndianPhone(bill.customerPhone || '');
  const phoneDisplay = phoneInfo.formattedDisplay || phoneInfo.national10 || (bill.customerPhone || 'N/A').trim();
  const driver = (bill.driverName || 'Operator').trim();
  const implement = bill.workType
    ? `${bill.workType}${bill.variant ? ` (${bill.variant})` : ''}`
    : 'Rotavator';
  const duration = bill.durationFormatted || '0h 00m';
  const rate = bill.ratePerHour ? `Rs. ${bill.ratePerHour} / hr` : 'Rs. 900 / hr';

  const amountFormatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(bill.totalAmount || 0);

  const status = (bill.status || 'Pending').toUpperCase();

  // Razor-sharp alignment: Each label padded to 10 characters before ':'
  const lines: (string | null)[] = [
    '================================',
    `${serviceName} - WORK INVOICE`,
    '================================',
    `Bill No   : ${billId}`,
    `Date      : ${billDate}`,
    '--------------------------------',
    `Customer  : ${customer}`,
    `Phone     : ${phoneDisplay}`,
    bill.location ? `Field     : ${bill.location.trim()}` : null,
    bill.season ? `Season    : ${bill.season.trim()}` : null,
    `Tractor   : ${tractorModel}`,
    `Operator  : ${driver}`,
    `Implement : ${implement}`,
    `Duration  : ${duration}`,
    `Rate      : ${rate}`,
    '--------------------------------',
    `TOTAL DUE : ${amountFormatted}`,
    `STATUS    : ${status}`,
    '--------------------------------',
    customDesc,
    `Thank you for partnering with ${config.serviceName || 'our fleet'}!`,
    `Helpline  : ${helpline}`,
    '================================',
  ];

  return lines.filter(Boolean).join('\n');
};

/**
 * Directly dispatches the official SMS invoice to the customer's phone number.
 * Opens the native SMS messenger without blank popup tabs prefilled with the clean aligned message.
 */
export const dispatchCustomerSMS = (
  bill: Partial<Bill>,
  tractorModel: string = 'Mahindra 575 DI (45 HP)',
  customConfig?: TractorServiceConfig
): { success: boolean; url: string; text: string; cleanPhone: string; national10: string; fullE164: string } => {
  const config = customConfig || getLocalTractorServiceConfig();
  const text = buildSmsInvoiceText(bill, tractorModel, config);
  const { national10, fullE164 } = getCleanIndianPhone(bill.customerPhone || '');

  if (typeof window === 'undefined') {
    return { success: false, url: '', text, cleanPhone: national10, national10, fullE164 };
  }

  // Cross-platform iOS vs Android SMS URI
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const delimiter = isIOS ? '&' : '?';

  // Recipient: exact clean E.164 phone (+91XXXXXXXXXX)
  const recipient = fullE164;

  const smsUrl = recipient
    ? `sms:${recipient}${delimiter}body=${encodeURIComponent(text)}`
    : `sms:${delimiter}body=${encodeURIComponent(text)}`;

  try {
    // Open standard SMS scheme WITHOUT target="_blank" so it does not open a blank browser window
    const anchor = document.createElement('a');
    anchor.href = smsUrl;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } catch {
    try {
      window.location.href = smsUrl;
    } catch {
      // browser blocked
    }
  }

  // Also notify backend API asynchronously for audit logging / gateway
  try {
    const apiBase =
      (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
      'http://localhost:5000/api';
    fetch(`${apiBase}/bills/send-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: bill.customerName,
        customerPhone: fullE164 || bill.customerPhone,
        billId: bill.billId,
        totalAmount: bill.totalAmount,
        smsText: text,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {
      // Ignore background backend network errors if offline
    });
  } catch {
    // ignore
  }

  return { success: true, url: smsUrl, text, cleanPhone: national10, national10, fullE164 };
};
