import { Bill, TractorServiceConfig } from '@/types';
import { getLocalTractorServiceConfig } from './api';

export function generateInvoiceHTML(
  bill: Bill,
  tractorModel: string = 'Mahindra 575 DI (45 HP)',
  serviceConfig?: TractorServiceConfig
): string {
  const config = serviceConfig || getLocalTractorServiceConfig();
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(bill.totalAmount || 0);

  const isPaid = bill.status === 'Paid';

  const safeId = (bill.billId || 'INV-AGRI').replace('#', '');
  const safeCustomer = (bill.customerName || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
  const safeBrand = (config.serviceName || 'Tractor_Fleet').replace(/[^a-zA-Z0-9]/g, '_');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${safeBrand}_Invoice_${safeId}_${safeCustomer}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      color: #111111;
      background: #ffffff;
      margin: 0;
      padding: 20px;
      line-height: 1.4;
      font-size: 13pt;
    }
    .invoice-card {
      max-width: 780px;
      margin: 0 auto;
      border: 2px solid #1b5e20;
      padding: 30px;
      border-radius: 6px;
      background: #ffffff;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #1b5e20;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .brand-title {
      font-size: 22pt;
      font-weight: bold;
      color: #1b5e20;
      letter-spacing: 0.5px;
      margin: 0;
      text-transform: uppercase;
    }
    .brand-sub {
      font-size: 11pt;
      color: #444444;
      margin-top: 4px;
    }
    .invoice-meta {
      text-align: right;
    }
    .invoice-num {
      font-size: 16pt;
      font-weight: bold;
      color: #1b5e20;
    }
    .invoice-date {
      font-size: 11pt;
      color: #555555;
      margin-top: 4px;
    }
    .info-grid {
      display: table;
      width: 100%;
      margin-bottom: 20px;
      border-collapse: collapse;
    }
    .info-col {
      display: table-cell;
      width: 50%;
      vertical-align: top;
      padding-right: 15px;
    }
    .info-col:last-child {
      padding-right: 0;
      padding-left: 15px;
      border-left: 1px solid #e0e0e0;
    }
    .section-title {
      font-size: 11pt;
      font-weight: bold;
      color: #1b5e20;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #1b5e20;
      padding-bottom: 3px;
      margin-bottom: 8px;
    }
    .data-row {
      margin-bottom: 5px;
      font-size: 11.5pt;
    }
    .data-label {
      font-weight: bold;
      color: #333333;
      display: inline-block;
      width: 120px;
    }
    .data-val {
      color: #111111;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 25px 0 15px 0;
    }
    .items-table th {
      background-color: #f1f8e9;
      border: 1px solid #1b5e20;
      color: #1b5e20;
      padding: 9px 12px;
      font-size: 11.5pt;
      text-align: left;
      font-weight: bold;
      text-transform: uppercase;
    }
    .items-table td {
      border: 1px solid #c8e6c9;
      padding: 10px 12px;
      font-size: 11.5pt;
    }
    .items-table tr:nth-child(even) {
      background-color: #fafafa;
    }
    .summary-wrap {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-top: 15px;
    }
    .payment-badge-box {
      margin-top: 10px;
    }
    .status-pill {
      display: inline-block;
      padding: 6px 16px;
      font-size: 12pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-radius: 4px;
    }
    .status-paid {
      background: #e8f5e9;
      color: #1b5e20;
      border: 1.5px solid #1b5e20;
    }
    .status-pending {
      background: #fff3e0;
      color: #c62828;
      border: 1.5px solid #c62828;
    }
    .totals-table {
      width: 280px;
      border: 1px solid #1b5e20;
      background: #f9fbe7;
      border-collapse: collapse;
    }
    .totals-table td {
      padding: 8px 12px;
      font-size: 11.5pt;
    }
    .total-grand-row {
      border-top: 2px solid #1b5e20;
      background: #e8f5e9;
      font-size: 13pt;
      font-weight: bold;
      color: #1b5e20;
    }
    .footer-signatures {
      margin-top: 60px;
      display: flex;
      justify-content: space-between;
      border-top: 1px dashed #777777;
      padding-top: 15px;
    }
    .sig-block {
      text-align: center;
      width: 210px;
    }
    .sig-line {
      margin-top: 45px;
      border-top: 1px solid #222222;
      padding-top: 5px;
      font-weight: bold;
      font-size: 11pt;
    }
    .print-note {
      text-align: center;
      font-size: 9pt;
      color: #777777;
      margin-top: 25px;
    }
    @media print {
      body {
        padding: 0;
        background: none;
      }
      .invoice-card {
        border: 1.5px solid #1b5e20;
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <!-- Header Row -->
    <div class="header-row">
      <div>
        <h1 class="brand-title">${config.serviceName}</h1>
        <div class="brand-sub">${config.tagline}</div>
        <div class="brand-sub">${config.location} • Ph: ${config.phone}${config.gstin ? ` • Reg/GST: ${config.gstin}` : ''}</div>
      </div>
      <div class="invoice-meta">
        <div class="invoice-num">${(bill.billId || '#AGRI-INV').replace(/[-_]?2026/g, '')}</div>
        <div class="invoice-date">Date: ${(bill.date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })).replace(/[\s\-/]?2026/g, '').trim()}</div>
        <div class="invoice-date" style="font-size: 10pt; color: #777;">Official Work Invoice</div>
      </div>
    </div>

    <!-- Customer & Machinery Information -->
    <div class="info-grid">
      <div class="info-col">
        <div class="section-title">Farmer / Customer Details</div>
        <div class="data-row">
          <span class="data-label">Farmer Name:</span>
          <span class="data-val"><strong>${bill.customerName}</strong></span>
        </div>
        <div class="data-row">
          <span class="data-label">Mobile Number:</span>
          <span class="data-val">${bill.customerPhone || 'N/A'}</span>
        </div>
        ${bill.location ? `
        <div class="data-row">
          <span class="data-label">Field Location:</span>
          <span class="data-val">${bill.location}</span>
        </div>` : ''}
        ${bill.season ? `
        <div class="data-row">
          <span class="data-label">Crop Season:</span>
          <span class="data-val">${bill.season}</span>
        </div>` : ''}
      </div>

      <div class="info-col">
        <div class="section-title">Machinery & Operator</div>
        <div class="data-row">
          <span class="data-label">Tractor Model:</span>
          <span class="data-val">${tractorModel}</span>
        </div>
        <div class="data-row">
          <span class="data-label">Operator/Driver:</span>
          <span class="data-val"><strong>${bill.driverName || 'Logesh M'}</strong></span>
        </div>
        <div class="data-row">
          <span class="data-label">Work Type:</span>
          <span class="data-val">${bill.workType} ${bill.variant ? `(${bill.variant})` : ''}</span>
        </div>
        <div class="data-row">
          <span class="data-label">Session Status:</span>
          <span class="data-val">Completed Session</span>
        </div>
      </div>
    </div>

    <!-- Line Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 8%;">S.No</th>
          <th style="width: 44%;">Description of Farm Work</th>
          <th style="width: 16%; text-align: center;">Duration</th>
          <th style="width: 16%; text-align: right;">Rate / Hour</th>
          <th style="width: 16%; text-align: right;">Total (INR)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align: center;">1</td>
          <td>
            <strong>${bill.workType}</strong> ${bill.variant ? `- ${bill.variant}` : ''}
            <div style="font-size: 10pt; color: #555; margin-top: 2px;">
              Agricultural tractor operational run for field cultivation/harvest
            </div>
          </td>
          <td style="text-align: center; font-weight: bold;">${bill.durationFormatted}</td>
          <td style="text-align: right;">₹${bill.ratePerHour}/hr</td>
          <td style="text-align: right; font-weight: bold;">${formattedAmount}</td>
        </tr>
      </tbody>
    </table>

    <!-- Summary Box & Settlement Status -->
    <div class="summary-wrap">
      <div class="payment-badge-box">
        <div style="font-size: 11pt; color: #555; margin-bottom: 5px;">Payment Settlement Status:</div>
        <span class="status-pill ${isPaid ? 'status-paid' : 'status-pending'}">
          ${isPaid ? '✔ Payment Received (Paid)' : '⏳ Payment Pending (Due)'}
        </span>
        ${bill.notes ? `<div style="font-size: 10.5pt; color: #666; margin-top: 8px; max-width: 380px;"><em>Notes: ${bill.notes}</em></div>` : ''}
      </div>

      <table class="totals-table">
        <tr>
          <td>Subtotal Amount:</td>
          <td style="text-align: right;">${formattedAmount}</td>
        </tr>
        <tr>
          <td>Tax / Service Cess:</td>
          <td style="text-align: right;">₹0.00</td>
        </tr>
        <tr class="total-grand-row">
          <td>Grand Total:</td>
          <td style="text-align: right;">${formattedAmount}</td>
        </tr>
      </table>
    </div>

    <!-- Customer Description & Official Signatures -->
    ${config.customerDescription ? `
    <div style="margin-top: 20px; padding: 10px 14px; background: #f1f8e9; border-left: 3px solid #1b5e20; font-size: 10.5pt; color: #2e7d32;">
      <strong>Note to Customer:</strong> ${config.customerDescription}
    </div>` : ''}

    <div class="footer-signatures">
      <div class="sig-block">
        <div class="sig-line">Farmer / Customer Signature</div>
      </div>
      <div class="sig-block">
        <div style="color: #1b5e20; font-weight: bold; font-size: 11pt;">${config.serviceName}</div>
        <div class="sig-line">Authorized Signatory / Seal</div>
      </div>
    </div>

    <div class="print-note">
      This is a verified computer-generated tax invoice issued by ${config.serviceName}. Times New Roman Official Format.
    </div>
  </div>
</body>
</html>`;
}

/**
 * Triggers the browser print dialog with the clean Times New Roman PDF invoice template.
 * Users can print or save directly as PDF.
 */
export function printInvoicePDF(bill: Bill, tractorModel?: string, serviceConfig?: TractorServiceConfig) {
  const html = generateInvoiceHTML(bill, tractorModel, serviceConfig);
  const printWindow = window.open('', '_blank', 'width=850,height=950');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  } else {
    // Fallback: create hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 2000);
      }, 400);
    }
  }
}
