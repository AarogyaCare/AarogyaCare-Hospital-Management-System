import { useState, useEffect } from 'react';
import { 
  CreditCard, CheckCircle2, AlertCircle, Download, 
  ArrowRight, ShieldCheck, DollarSign, Receipt, QrCode 
} from 'lucide-react';
export interface BillInvoice {
  id: string;
  invoiceNo: string;
  patientName: string;
  uhid: string;
  date: string;
  department: string;
  services: { name: string; cost: number; qty: number }[];
  grossTotal: number;
  insuranceCovered: number;
  taxAmount: number;
  patientPayable: number;
  paymentStatus: 'Paid' | 'Pending Payment' | 'Claim Processing';
  paymentMode?: 'UPI / GPay' | 'HDFC Credit Card' | 'Star Health TPA' | 'Cash Desk';
}
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Billing() {
  const { user } = useAuth();
  const [bills, setBills] = useState<BillInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'Paid' | 'Pending Payment' | 'Claim Processing'>('all');
  const [payingBill, setPayingBill] = useState<BillInvoice | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'UPI' | 'Card' | 'Insurance'>('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptToast, setReceiptToast] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    const request = user.role === 'PATIENT'
      ? api.patientInvoices(user.patientId || user.id)
      : api.invoices();
    request.then((rows: any[]) => setBills(rows.map((b) => ({
      id: b.id, invoiceNo: b.invoice_number || b.id, patientName: b.patient_name || user.name,
      uhid: b.patient_id || '', date: b.created_at ? new Date(b.created_at).toLocaleDateString() : '',
      department: 'Hospital Services', services: (b.items || []).map((item: any) => ({ name: item.description || item.item_type || 'Service', cost: Number(item.unit_price || 0), qty: Number(item.quantity || 1) })),
      grossTotal: Number(b.total_amount || 0), insuranceCovered: Number(b.discount_amount || 0), taxAmount: Number(b.tax_amount || 0),
      patientPayable: Number(b.net_payable || 0), paymentStatus: String(b.status).toUpperCase() === 'PAID' ? 'Paid' : 'Pending Payment'
    } as BillInvoice))))
      .catch((error) => setReceiptToast(`Could not load invoices from backend: ${error.message}`))
      .finally(() => setIsLoading(false));
  }, [user]);

  const filteredBills = bills.filter((b) => {
    if (activeTab === 'all') return true;
    return b.paymentStatus === activeTab;
  });

  const handlePaySubmit = async () => {
    if (!payingBill) return;
    setIsProcessing(true);
    try {
      const response = await api.payInvoice(payingBill.id, payingBill.patientPayable, selectedMethod);
      const status = String(response.status || '').toUpperCase() === 'SUCCESS' ? 'Paid' : 'Pending Payment';
      const paymentMode: BillInvoice['paymentMode'] = selectedMethod === 'UPI' ? 'UPI / GPay' : selectedMethod === 'Card' ? 'HDFC Credit Card' : 'Star Health TPA';
      setBills((prev) => prev.map((b) => b.id === payingBill.id ? { ...b, paymentStatus: status as BillInvoice['paymentStatus'], paymentMode } : b));
      setReceiptToast(`Payment simulation response: ${response.status || 'completed'} for ${payingBill.invoiceNo}.`);
      setPayingBill(null);
    } catch (error) {
      setReceiptToast(`Payment failed: ${error instanceof Error ? error.message : 'Backend error'}`);
    } finally { setIsProcessing(false); }
  };

  const handleDownloadReceipt = (invNo: string) => {
    setReceiptToast(`Receipt download is not available from the backend for invoice ${invNo}.`);
    setTimeout(() => setReceiptToast(null), 3500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#002043] to-[#17365d] text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-teal-500/20 px-3 py-1 rounded-full border border-teal-400/30">Backend Invoice Service</span>
          <h1 className="text-3xl font-extrabold mt-2 tracking-tight">
            Bills & Digital Payments
          </h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-xl">
            View invoices returned by the hospital service and submit a simulated payment transaction.
          </p>
        </div>

        <div className="bg-white/10 border border-white/20 p-4 rounded-2xl flex items-center gap-3"><ShieldCheck className="w-5 h-5 text-teal-300" /><span className="text-xs text-slate-200">Account: {user?.name}</span></div>
      </div>

      {receiptToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{receiptToast}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 text-xs">
        {['all', 'Pending Payment', 'Claim Processing', 'Paid'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-xl font-bold transition border ${
              activeTab === tab
                ? 'bg-[#002043] text-white border-[#002043] shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab === 'all' ? 'All Invoices' : tab}
          </button>
        ))}
      </div>

      {/* Invoices List */}
      {isLoading && <p className="text-sm text-slate-600" role="status">Loading invoices…</p>}
      {receiptToast?.startsWith('Could not load') && <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">{receiptToast}</p>}
      {!isLoading && !receiptToast?.startsWith('Could not load') && bills.length === 0 && <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">No invoices are available for this account.</p>}
      <div className="space-y-4">
        {filteredBills.map((bill) => (
          <div
            key={bill.id}
            className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm hover:shadow-md transition space-y-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-900 text-base">{bill.invoiceNo}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    bill.paymentStatus === 'Paid'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : bill.paymentStatus === 'Pending Payment'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    ● {bill.paymentStatus}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Issued to <strong>{bill.patientName}</strong> ({bill.uhid}) • Department: {bill.department} • Date: {bill.date}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {bill.paymentStatus === 'Pending Payment' ? (
                  <button
                    onClick={() => setPayingBill(bill)}
                    className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Pay Patient Share (₹{bill.patientPayable})</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleDownloadReceipt(bill.invoiceNo)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 hover:text-[#002043] rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Tax Invoice</span>
                  </button>
                )}
              </div>
            </div>

            {/* Service Breakdown Table */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Itemized Medical Services & Tests
              </span>
              <div className="space-y-1.5 text-xs">
                {bill.services.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-slate-700">
                    <span>{item.name} {item.qty > 1 && `(x${item.qty})`}</span>
                    <span className="font-semibold">₹{item.cost * item.qty}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Gross Charges:</span>
                  <span className="font-semibold text-slate-800">₹{bill.grossTotal}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Insurance TPA:</span>
                  <span className="font-semibold text-emerald-700">- ₹{bill.insuranceCovered}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block">Patient Payable:</span>
                  <span className="text-base font-extrabold text-[#002043]">₹{bill.patientPayable}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pay Now Modal */}
      {payingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div>
                <span className="text-xs font-bold text-teal-700 uppercase">Backend Payment Simulation</span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">Submit Payment Simulation</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Invoice {payingBill.invoiceNo} • Amount: <strong className="text-[#002043]">₹{payingBill.patientPayable}</strong>
              </p>
            </div>
            <p className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">This submits a simulated payment to the backend. No card, UPI, or insurance processor is connected.</p>

            {/* Methods */}
            <div className="grid grid-cols-3 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setSelectedMethod('UPI')}
                className={`py-3 rounded-xl border transition ${
                  selectedMethod === 'UPI' ? 'bg-[#002043] text-white border-[#002043]' : 'bg-slate-50 text-slate-700'
                }`}
              >
                UPI / QR
              </button>
              <button
                type="button"
                onClick={() => setSelectedMethod('Card')}
                className={`py-3 rounded-xl border transition ${
                  selectedMethod === 'Card' ? 'bg-[#002043] text-white border-[#002043]' : 'bg-slate-50 text-slate-700'
                }`}
              >
                Credit / Debit
              </button>
              <button
                type="button"
                onClick={() => setSelectedMethod('Insurance')}
                className={`py-3 rounded-xl border transition ${
                  selectedMethod === 'Insurance' ? 'bg-[#002043] text-white border-[#002043]' : 'bg-slate-50 text-slate-700'
                }`}
              >
                TPA Portal
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-700">Payment method is recorded as simulation metadata only. No external payment details are collected.</div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPayingBill(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handlePaySubmit}
                className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
              >
                {isProcessing ? 'Processing Transaction...' : `Confirm Payment of ₹${payingBill.patientPayable}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
