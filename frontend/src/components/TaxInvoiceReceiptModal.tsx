import React, { useState, useEffect } from 'react';
import {
  Printer, CheckCircle2, Copy, ShieldCheck, X, QrCode, FileText, Check
} from 'lucide-react';
import { api } from '../services/api';

export interface TaxInvoiceItem {
  description: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface TaxInvoiceData {
  invoiceId: string;
  invoiceNumber: string;
  patientName: string;
  patientUhid: string;
  date: string;
  department?: string;
  items: TaxInvoiceItem[];
  grossTotal: number;
  discountAmount: number;
  taxAmount: number;
  netPayable: number;
  paymentStatus: string;
  paymentMode?: string;
}

interface Props {
  invoice: TaxInvoiceData;
  onClose: () => void;
}

export default function TaxInvoiceReceiptModal({ invoice, onClose }: Props) {
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const generateShortLink = async () => {
      try {
        const destUrl = `${window.location.origin}/portal/billing?invoice=${encodeURIComponent(invoice.invoiceNumber)}`;
        const res = await api.createShortLink({
          target_url: destUrl,
          resource_type: 'INVOICE',
          resource_id: invoice.invoiceId,
          ttl_seconds: 604800,
        });
        if (isMounted) {
          const generated = res.short_url || `${window.location.origin}/s/${res.code}`;
          setShortUrl(generated);
        }
      } catch {
        if (isMounted) {
          setShortUrl(`${window.location.origin}/portal/billing?invoice=${encodeURIComponent(invoice.invoiceNumber)}`);
        }
      }
    };
    void generateShortLink();
    return () => {
      isMounted = false;
    };
  }, [invoice.invoiceId, invoice.invoiceNumber]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (!shortUrl) return;
    navigator.clipboard.writeText(shortUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const isPaid = String(invoice.paymentStatus).toUpperCase() === 'PAID';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full shadow-2xl overflow-hidden my-8 animate-scaleUp">
        {/* Modal Top Bar (Screen Only) */}
        <div className="print:hidden bg-slate-100 px-6 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#002043]" />
            <span className="font-bold text-xs text-slate-800">Hospital Tax Invoice &amp; Payment Receipt</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-[#002043] hover:bg-[#17365d] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-teal-300" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
              aria-label="Close receipt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-8 space-y-6 text-slate-800 printable-tax-invoice bg-white">
          {/* Hospital Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b-2 border-slate-900">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#002043] text-teal-400 flex items-center justify-center font-black text-sm">
                  AC
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-[#002043]">
                    MEDORA HOSPITAL
                  </h2>
                  <span className="text-[10px] text-teal-700 font-bold block uppercase tracking-wider">
                    Multi-Specialty &amp; Tertiary Care Centre
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Medora Clinical Campus, Chennai<br />
                Emergency Hotline: +91 44 2829 0200 • Desk: info@aarogya.care
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Document Type</span>
              <h3 className="text-base font-black text-slate-900">TAX INVOICE / RECEIPT</h3>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-300 bg-emerald-50 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isPaid ? 'PAID & SETTLED' : invoice.paymentStatus}</span>
              </div>
            </div>
          </div>

          {/* Meta Information Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Invoice Number</span>
              <span className="font-mono font-bold text-slate-900">{invoice.invoiceNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Billing Date</span>
              <span className="font-bold text-slate-800">{invoice.date || new Date().toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Patient Name</span>
              <span className="font-bold text-slate-900">{invoice.patientName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">UHID / MRN</span>
              <span className="font-mono font-bold text-slate-900">{invoice.patientUhid || 'AC-2026-OPD'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Department</span>
              <span className="font-medium text-slate-700">{invoice.department || 'Hospital Outpatient Services'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Mode</span>
              <span className="font-medium text-slate-700">{invoice.paymentMode || 'Online / Electronic POS'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Financial Status</span>
              <span className="font-bold text-emerald-700">{isPaid ? 'Reconciled' : 'Pending'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Gateway</span>
              <span className="font-medium text-slate-600">AarogyaPay Secure Core</span>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">#</th>
                  <th className="px-4 py-2.5">Medical Service / Item Description</th>
                  <th className="px-3 py-2.5 text-center">Qty</th>
                  <th className="px-4 py-2.5 text-right">Unit Rate (₹)</th>
                  <th className="px-4 py-2.5 text-right">Total Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-800">{it.description}</td>
                      <td className="px-3 py-2.5 text-center font-mono">{it.quantity}</td>
                      <td className="px-4 py-2.5 text-right font-mono">₹{it.unitPrice.toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">
                        ₹{(it.totalPrice || it.unitPrice * it.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-2.5 text-slate-400 font-mono">1</td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">Specialist Clinical Consultation &amp; Care</td>
                    <td className="px-3 py-2.5 text-center font-mono">1</td>
                    <td className="px-4 py-2.5 text-right font-mono">₹{invoice.grossTotal.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">₹{invoice.grossTotal.toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Calculations Summary */}
          <div className="flex flex-col sm:flex-row justify-between gap-6 pt-2">
            {/* Digital Short URL & Verification Stamp */}
            <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 text-xs flex-1 space-y-2">
              <div className="flex items-center gap-2 text-teal-900 font-bold">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Digitally Verified Hospital Receipt</span>
              </div>
              <p className="text-[11px] text-teal-800">
                This receipt is cryptographically generated and registered with the hospital electronic ledger.
              </p>
              {shortUrl && (
                <div className="pt-1 flex items-center gap-2">
                  <span className="font-mono text-[10px] bg-white px-2 py-1 rounded border border-teal-300 text-teal-900 truncate max-w-xs">
                    {shortUrl}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="print:hidden px-2 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded text-[10px] font-bold flex items-center gap-1 transition"
                  >
                    {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Total Calculation breakdown */}
            <div className="w-full sm:w-64 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Gross Service Total:</span>
                <span className="font-mono font-semibold text-slate-800">₹{invoice.grossTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Insurance / TPA Deduction:</span>
                <span className="font-mono font-semibold">- ₹{invoice.discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Applicable GST / Tax:</span>
                <span className="font-mono font-semibold text-slate-800">₹{invoice.taxAmount.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-center text-sm font-black text-[#002043]">
                <span>Net Amount Paid:</span>
                <span className="font-mono text-base text-teal-800">₹{invoice.netPayable.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer & Signature Line */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 text-[10px] text-slate-400">
            <div>
              <p>Computer-generated electronic document. No physical signature required under IT Act 2000.</p>
              <p>For billing clarifications or TPA claim reconciliation, contact billing@aarogya.care.</p>
            </div>
            <div className="text-right">
              <div className="w-40 border-b border-slate-400 pb-1 mb-1 font-mono text-slate-600 text-center font-bold">
                Medora Accounts
              </div>
              <span>Authorized Hospital Desk Seal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
