import { useState, useEffect } from 'react';
import {
  CreditCard, DollarSign, Receipt, CheckCircle2,
  Search, ShieldCheck, Download, Plus, ArrowRight, RefreshCw, AlertCircle, FileText
} from 'lucide-react';
import { api, InvoiceDto, PatientDto } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const standardBillableServices = [
  { type: 'CONSULTATION', description: 'Senior Consultant OPD Medical Review', price: 800 },
  { type: 'LABORATORY', description: 'Complete Blood Count (CBC) Diagnostic Assay', price: 450 },
  { type: 'PHARMACY', description: 'Outpatient Formulary Medication Dispensing', price: 620 },
  { type: 'NURSING_TRIAGE', description: 'Nursing Station Vitals, SpO2 & Telemetry Assessment', price: 250 },
  { type: 'EMERGENCY', description: 'Emergency Department Stabilization & Acuity Care', price: 1500 },
];

export default function BillingFinancialDesk() {
  const { user } = useAuth();
  const [bills, setBills] = useState<InvoiceDto[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'PENDING' | 'PAID'>('all');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Invoice creation modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [patientIdInput, setPatientIdInput] = useState('');
  const [availablePatients, setAvailablePatients] = useState<PatientDto[]>([]);
  const [selectedServiceIndex, setSelectedServiceIndex] = useState(0);
  const [customPrice, setCustomPrice] = useState(800);
  const [customQuantity, setCustomQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(40);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4500);
  };

  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      const [invData, patData] = await Promise.allSettled([
        api.invoices(),
        api.patients()
      ]);
      if (invData.status === 'fulfilled') setBills(invData.value);
      if (patData.status === 'fulfilled') {
        setAvailablePatients(patData.value);
        if (patData.value.length > 0 && !patientIdInput) {
          setPatientIdInput(patData.value[0].id);
        }
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not fetch invoices ledger.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadInvoices();
  }, []);

  const handleSettlePayment = async (invoice: InvoiceDto, method: 'CASH' | 'CARD' | 'INSURANCE_TPA') => {
    setIsProcessing(invoice.id);
    try {
      const amount = Number(invoice.net_payable || invoice.total_amount || 0);
      const res = await api.payInvoice(invoice.id, amount, method);
      showToast(`Settled invoice #${invoice.invoice_number || invoice.id} via ${method}. Payment status: ${res.status || 'COMPLETED'}`);
      await loadInvoices();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Payment settlement failed.', 'error');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleCreateInvoiceSubmit = async () => {
    if (!patientIdInput.trim()) {
      showToast('Please select or specify a valid patient ID.', 'error');
      return;
    }
    const template = standardBillableServices[selectedServiceIndex];
    setIsCreatingInvoice(true);
    try {
      const created = await api.createInvoice({
        patient_id: patientIdInput.trim(),
        items: [
          {
            description: template.description,
            item_type: template.type,
            unit_price: Number(customPrice),
            quantity: Number(customQuantity)
          }
        ],
        discount_amount: Number(discount),
        tax_amount: Number(tax)
      });
      showToast(`Generated invoice #${created.invoice_number} for ₹${created.net_payable}.`);
      setShowCreateModal(false);
      await loadInvoices();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create invoice.', 'error');
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  const filteredBills = bills.filter((b) => {
    const matchesTab = activeTab === 'all' || String(b.status).toUpperCase() === activeTab;
    const matchesSearch =
      (b.invoice_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.patient_name || '').toLowerCase().includes(search.toLowerCase()) ||
      b.patient_id.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const totalCollected = bills
    .filter((b) => String(b.status).toUpperCase() === 'PAID')
    .reduce((sum, b) => sum + Number(b.net_payable || b.total_amount || 0), 0);

  const totalPending = bills
    .filter((b) => String(b.status).toUpperCase() !== 'PAID')
    .reduce((sum, b) => sum + Number(b.net_payable || b.total_amount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* Financial Desk Banner */}
      <div className="bg-gradient-to-r from-[#002043] via-[#002c57] to-[#178B8B] text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-teal-300">
            <CreditCard className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black">Billing &amp; Financial Operations</h1>
              <span className="px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-200 text-[10px] font-bold">
                Counter 02 • Finance Wing
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Cashier: <strong>{user?.name || 'Finance Officer'}</strong> • Hospital Revenue Ledger &amp; Cashless TPA Settlement
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl transition flex items-center gap-1.5 text-xs font-bold shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Issue Hospital Invoice</span>
          </button>
          <button
            onClick={loadInvoices}
            disabled={isLoading}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <div className="bg-white/10 p-3 rounded-2xl border border-white/20 text-xs flex items-center gap-4">
            <div>
              <span className="text-slate-300 block text-[10px]">Settled Collections:</span>
              <span className="text-base font-extrabold text-white">₹{totalCollected.toLocaleString()}</span>
            </div>
            <div className="border-l border-white/20 pl-4">
              <span className="text-slate-300 block text-[10px]">Outstanding / Pending:</span>
              <span className="text-base font-extrabold text-amber-300">₹{totalPending.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Simulated Gateway Note */}
      <div className="bg-sky-50 border border-sky-200 p-4 rounded-2xl text-xs text-sky-900 flex items-center gap-2.5">
        <ShieldCheck className="w-4 h-4 text-sky-700 shrink-0" />
        <span>
          <strong>Simulated Payment Gateway:</strong> In-counter settlement tests server-side idempotency, concurrency locks, and ledger reconciliation without hitting external banking gateways.
        </span>
      </div>

      {toast && (
        <div
          role="alert"
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fadeIn border ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Invoices List */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Hospital Billing Ledger</h2>
            <p className="text-xs text-slate-500">Inpatient and Outpatient financial statements requiring counter settlement or TPA sign-off.</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-48 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search invoice or patient..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div className="flex gap-1 text-xs">
              {(['all', 'PENDING', 'PAID'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    activeTab === tab ? 'bg-[#002043] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab === 'all' ? 'All' : tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading billing ledger...</div>
        ) : filteredBills.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No invoices found.</div>
        ) : (
          <div className="space-y-4">
            {filteredBills.map((bill) => {
              const isPaid = String(bill.status).toUpperCase() === 'PAID';
              const payable = Number(bill.net_payable || bill.total_amount || 0);
              return (
                <div
                  key={bill.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {bill.invoice_number || bill.id}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isPaid
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {bill.status}
                      </span>
                      <span className="text-slate-400">
                        {bill.created_at ? new Date(bill.created_at).toLocaleDateString() : ''}
                      </span>
                    </div>

                    <p className="text-slate-700 font-semibold">
                      Patient: {bill.patient_name || 'Patient'} <span className="font-mono text-slate-400 font-normal">({bill.patient_id})</span>
                    </p>

                    {bill.items && bill.items.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {bill.items.map((item, idx) => (
                          <span key={idx} className="bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[11px] text-slate-600">
                            {item.description || item.item_type} (₹{item.total_price || item.unit_price})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col md:items-end gap-2 shrink-0">
                    <div>
                      <span className="text-[10px] text-slate-400 block md:text-right uppercase">Net Amount Payable</span>
                      <span className="text-lg font-black text-[#002043]">₹{payable.toFixed(2)}</span>
                    </div>

                    {!isPaid ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSettlePayment(bill, 'CASH')}
                          disabled={isProcessing === bill.id}
                          className="px-3 py-1.5 bg-[#002043] hover:bg-[#17365d] disabled:opacity-50 text-white rounded-xl font-bold transition flex items-center gap-1"
                        >
                          <Receipt className="w-3.5 h-3.5 text-teal-300" />
                          <span>Cash Counter</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSettlePayment(bill, 'CARD')}
                          disabled={isProcessing === bill.id}
                          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl font-bold transition flex items-center gap-1"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Card / POS</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSettlePayment(bill, 'INSURANCE_TPA')}
                          disabled={isProcessing === bill.id}
                          className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100 disabled:opacity-50 text-slate-700 rounded-xl font-bold transition"
                        >
                          TPA Cashless
                        </button>
                      </div>
                    ) : (
                      <span className="text-emerald-700 font-bold text-xs flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Settled &amp; Reconciled</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Issue Hospital Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-4 animate-scaleUp text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Issue Hospital Invoice</h3>
                <p className="text-[11px] text-slate-500">Billable hospital charge for consultation, lab, pharmacy, or nursing.</p>
              </div>
              <FileText className="w-6 h-6 text-teal-600" />
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Target Patient</label>
                {availablePatients.length > 0 ? (
                  <select
                    value={patientIdInput}
                    onChange={(e) => setPatientIdInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  >
                    {availablePatients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.uhid})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={patientIdInput}
                    onChange={(e) => setPatientIdInput(e.target.value)}
                    placeholder="Enter Patient ID (e.g. pat-1)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                )}
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Billable Service Category</label>
                <select
                  value={selectedServiceIndex}
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    setSelectedServiceIndex(idx);
                    setCustomPrice(standardBillableServices[idx].price);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                >
                  {standardBillableServices.map((svc, i) => (
                    <option key={svc.type} value={i}>
                      {svc.type}: {svc.description} (Standard: ₹{svc.price})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={customQuantity}
                    onChange={(e) => setCustomQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Discount Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">GST / Tax Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={tax}
                    onChange={(e) => setTax(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-teal-900 flex justify-between items-center font-bold">
                <span>Calculated Net Payable:</span>
                <span className="text-sm">
                  ₹{Math.max(0, customPrice * customQuantity - discount + tax).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateInvoiceSubmit}
                disabled={isCreatingInvoice}
                className="px-5 py-2 bg-[#002043] hover:bg-[#17365d] disabled:opacity-50 text-white rounded-xl text-xs font-bold"
              >
                {isCreatingInvoice ? 'Generating...' : 'Issue & Persist Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
