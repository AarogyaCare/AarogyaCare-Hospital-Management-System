import { useState, useEffect } from 'react';
import { 
  CreditCard, CheckCircle2, AlertCircle, Download, 
  ArrowRight, ShieldCheck, DollarSign, Receipt, QrCode, Printer,
  Sparkles, Building
} from 'lucide-react';
import TaxInvoiceReceiptModal from '../components/TaxInvoiceReceiptModal';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

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

export default function Billing() {
  const { user } = useAuth();
  const [bills, setBills] = useState<BillInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'Paid' | 'Pending Payment' | 'Claim Processing'>('all');
  const [payingBill, setPayingBill] = useState<BillInvoice | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<BillInvoice | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'UPI' | 'Card' | 'Insurance'>('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptToast, setReceiptToast] = useState<string | null>(null);
  const [paymentAttemptKeys, setPaymentAttemptKeys] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    const request = user.role === 'PATIENT'
      ? api.patientInvoices(user.patientId || user.id)
      : api.invoices();
    request.then((rows: any[]) => setBills(rows.map((b) => ({
      id: b.id,
      invoiceNo: b.invoice_number || b.id,
      patientName: b.patient_name || user.name,
      uhid: b.patient_id || '',
      date: b.created_at ? new Date(b.created_at).toLocaleDateString() : '',
      department: 'Hospital Services',
      services: (b.items || []).map((item: any) => ({
        name: item.description || item.item_type || 'Service',
        cost: Number(item.unit_price || 0),
        qty: Number(item.quantity || 1)
      })),
      grossTotal: Number(b.total_amount || 0),
      insuranceCovered: Number(b.discount_amount || 0),
      taxAmount: Number(b.tax_amount || 0),
      patientPayable: Number(b.net_payable || 0),
      paymentStatus: String(b.status).toUpperCase() === 'PAID' ? 'Paid' : 'Pending Payment'
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
    const attemptKey = paymentAttemptKeys[payingBill.id] || `pay-key-${payingBill.id}-${crypto.randomUUID()}`;
    if (!paymentAttemptKeys[payingBill.id]) {
      setPaymentAttemptKeys((prev) => ({ ...prev, [payingBill.id]: attemptKey }));
    }

    try {
      const response = await api.payInvoice(payingBill.id, payingBill.patientPayable, selectedMethod, attemptKey);
      const status = String(response.status || '').toUpperCase() === 'SUCCESS' ? 'Paid' : 'Pending Payment';
      const paymentMode: BillInvoice['paymentMode'] = selectedMethod === 'UPI' ? 'UPI / GPay' : selectedMethod === 'Card' ? 'HDFC Credit Card' : 'Star Health TPA';
      setBills((prev) => prev.map((b) => b.id === payingBill.id ? { ...b, paymentStatus: status as BillInvoice['paymentStatus'], paymentMode } : b));
      setReceiptToast(`Payment processed: status ${response.status || 'completed'} for invoice ${payingBill.invoiceNo}.`);
      setPayingBill(null);
      setPaymentAttemptKeys((prev) => {
        const next = { ...prev };
        delete next[payingBill.id];
        return next;
      });
    } catch (error) {
      setReceiptToast(`Payment failed: ${error instanceof Error ? error.message : 'Backend error'}. You may retry safely.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenReceipt = (bill: BillInvoice) => {
    setSelectedReceipt(bill);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#002043] via-[#002b54] to-[#178B8B] text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-white/10">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-teal-400/30">
            Financial &amp; Revenue Services
          </span>
          <h1 className="text-3xl font-extrabold mt-2.5 tracking-tight">
            Bills &amp; Digital Invoices
          </h1>
          <p className="text-slate-200 text-xs md:text-sm mt-1 max-w-xl leading-relaxed">
            Itemized clinical charges, TPA insurance deductibles, GST receipts, and verified digital payment records.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-3 self-start md:self-auto">
          <ShieldCheck className="w-5 h-5 text-teal-300 shrink-0" />
          <div>
            <span className="text-xs font-bold text-white block">Patient: {user?.name}</span>
            <span className="text-[10px] text-teal-200 uppercase font-semibold">Idempotent Payment Engine</span>
          </div>
        </div>
      </div>

      {receiptToast && (
        <div className="p-4 bg-emerald-50/90 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-xs animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{receiptToast}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 text-xs overflow-x-auto pb-1">
        {['all', 'Pending Payment', 'Claim Processing', 'Paid'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-xl font-bold transition duration-150 border ${
              activeTab === tab
                ? 'bg-[#002043] text-white border-[#002043] shadow-xs'
                : 'bg-white/80 backdrop-blur-md text-slate-700 border-slate-200 hover:bg-white'
            }`}
          >
            {tab === 'all' ? 'All Invoices' : tab}
          </button>
        ))}
      </div>

      {/* Invoices List */}
      {isLoading && (
        <div className="p-12 text-center text-slate-500 text-xs font-semibold">
          Synchronizing hospital invoices from billing database...
        </div>
      )}

      {!isLoading && bills.length === 0 && (
        <div className="rounded-3xl border border-white/80 bg-white/80 backdrop-blur-xl p-12 text-center space-y-2 shadow-xs">
          <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No invoices generated</h3>
          <p className="text-xs text-slate-500">No pending or settled invoices were returned for this account.</p>
        </div>
      )}

      <div className="space-y-5">
        {filteredBills.map((bill) => (
          <div
            key={bill.id}
            className="rounded-3xl border border-white/80 bg-white/85 backdrop-blur-xl p-6 md:p-8 shadow-sm hover:shadow-md transition space-y-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-900 text-base">{bill.invoiceNo}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    bill.paymentStatus === 'Paid'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : bill.paymentStatus === 'Pending Payment'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}>
                    ● {bill.paymentStatus}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Patient: <strong className="font-extrabold text-slate-900">{bill.patientName}</strong> <span className="font-mono text-slate-600 font-bold ml-1">({bill.uhid})</span> • {bill.department} • {bill.date}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {bill.paymentStatus === 'Pending Payment' ? (
                  <button
                    onClick={() => setPayingBill(bill)}
                    className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-500/20 transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Pay Patient Share (₹{bill.patientPayable})</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenReceipt(bill)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 hover:text-[#002043] rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-50 transition"
                  >
                    <Printer className="w-3.5 h-3.5 text-teal-600" />
                    <span>View &amp; Print Tax Receipt</span>
                  </button>
                )}
              </div>
            </div>

            {/* Service Breakdown */}
            <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
                Itemized Medical Services &amp; Diagnostic Charges
              </span>
              <div className="space-y-2 text-xs">
                {bill.services.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-slate-700">
                    <span>{item.name} {item.qty > 1 && `(x${item.qty})`}</span>
                    <span className="font-semibold text-slate-900">₹{item.cost * item.qty}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200/80 grid grid-cols-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Gross Hospital Charges:</span>
                  <span className="font-bold text-slate-800">₹{bill.grossTotal}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Insurance TPA Discount:</span>
                  <span className="font-bold text-emerald-700">- ₹{bill.insuranceCovered}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[11px]">Net Patient Payable:</span>
                  <span className="text-lg font-black text-[#002043]">₹{bill.patientPayable}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pay Now Simulation Modal */}
      {payingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/80 p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5 animate-scale-in">
            <div>
              <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">
                Digital Payment Gateway
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">Submit Payment Simulation</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Invoice {payingBill.invoiceNo} • Amount Due: <strong className="text-teal-800 text-sm">₹{payingBill.patientPayable}</strong>
              </p>
            </div>

            <p className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 leading-snug">
              This initiates an idempotent payment request directly to the Spring Boot billing service.
            </p>

            <div className="grid grid-cols-3 gap-2 text-xs font-bold">
              {(['UPI', 'Card', 'Insurance'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setSelectedMethod(method)}
                  className={`py-3 rounded-xl border transition ${
                    selectedMethod === method
                      ? 'bg-[#002043] text-white border-[#002043] shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {method === 'UPI' ? 'UPI / QR' : method === 'Card' ? 'Credit/Debit' : 'TPA Desk'}
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPayingBill(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handlePaySubmit}
                className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/20 transition disabled:opacity-50"
              >
                {isProcessing ? 'Processing Transaction...' : `Confirm Payment (₹${payingBill.patientPayable})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tax Invoice & Digital Receipt Modal */}
      {selectedReceipt && (
        <TaxInvoiceReceiptModal
          invoice={{
            invoiceId: selectedReceipt.id,
            invoiceNumber: selectedReceipt.invoiceNo,
            patientName: selectedReceipt.patientName,
            patientUhid: selectedReceipt.uhid,
            date: selectedReceipt.date,
            department: selectedReceipt.department,
            items: selectedReceipt.services.map((s) => ({
              description: s.name,
              quantity: s.qty,
              unitPrice: s.cost,
              totalPrice: s.cost * s.qty,
            })),
            grossTotal: selectedReceipt.grossTotal,
            discountAmount: selectedReceipt.insuranceCovered,
            taxAmount: selectedReceipt.taxAmount,
            netPayable: selectedReceipt.patientPayable,
            paymentStatus: selectedReceipt.paymentStatus,
            paymentMode: selectedReceipt.paymentMode || 'Online Payment Gateway',
          }}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
}
