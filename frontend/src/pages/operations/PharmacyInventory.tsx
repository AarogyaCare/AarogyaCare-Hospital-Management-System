import { useState, useEffect } from 'react';
import {
  Pill, AlertTriangle, CheckCircle2, Search,
  Package, RefreshCw, Barcode, ShieldCheck, ArrowRight, Plus, AlertCircle
} from 'lucide-react';
import { api, InventoryItemDto, PrescriptionDto } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function PharmacyInventory() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItemDto[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionDto[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'PENDING' | 'DISPENSED'>('all');
  const [isDispensing, setIsDispensing] = useState<string | null>(null);

  // Stock Adjustment Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustMedId, setAdjustMedId] = useState('');
  const [adjustType, setAdjustType] = useState<'RESTOCK' | 'AUDIT_ADJUSTMENT' | 'DISPENSE'>('RESTOCK');
  const [adjustQty, setAdjustQty] = useState(50);
  const [adjustRef, setAdjustRef] = useState('TNMSC Supplier Consignment');
  const [isAdjusting, setIsAdjusting] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [invData, rxData] = await Promise.all([
        api.inventory(),
        api.allPrescriptions()
      ]);
      setInventory(invData);
      setPrescriptions(rxData);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not fetch pharmacy records.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleDispenseRx = async (id: string) => {
    setIsDispensing(id);
    try {
      const dispensed = await api.dispensePrescription(id);
      showToast(`Successfully dispensed & verified prescription #${dispensed.prescription_number || id}. Stock decremented in pharmacy ledger.`);
      await loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Dispensing failed. Check inventory levels.', 'error');
    } finally {
      setIsDispensing(null);
    }
  };

  const handleStockAdjustment = async () => {
    if (!adjustMedId) return;
    setIsAdjusting(true);
    try {
      await api.adjustStock(adjustMedId, adjustType, Number(adjustQty), adjustRef);
      showToast(`Stock updated: ${adjustType} of ${adjustQty} units recorded.`);
      setShowAdjustModal(false);
      await loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Stock adjustment failed.', 'error');
    } finally {
      setIsAdjusting(false);
    }
  };

  const filteredInventory = inventory.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    (item.code && item.code.toLowerCase().includes(search.toLowerCase())) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPrescriptions = prescriptions.filter((rx) => {
    if (activeTab === 'all') return true;
    return String(rx.status).toUpperCase() === activeTab;
  });

  const lowStockCount = inventory.filter((i) => i.current_stock <= i.minimum_threshold).length;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* Pharmacy Banner */}
      <div className="bg-gradient-to-r from-[#002043] via-[#002952] to-[#178B8B] text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-teal-300">
            <Pill className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black">Pharmacy &amp; Drug Inventory</h1>
              <span className="px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-200 text-[10px] font-bold">
                Main Dispensary 24/7
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Staff: <strong>{user?.name || 'Lead Pharmacist'}</strong> • Barcode E-Rx Dispensing &amp; Live Stock Control
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <span className={`px-3 py-1.5 border rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
            lowStockCount > 0 ? 'bg-rose-500/20 border-rose-400/30 text-rose-300' : 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300'
          }`}>
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{lowStockCount} Low Stock Alerts</span>
          </span>
          <button
            onClick={() => {
              if (inventory.length > 0) setAdjustMedId(inventory[0].id);
              setShowAdjustModal(true);
            }}
            className="px-3.5 py-2 bg-teal-400 hover:bg-teal-300 text-[#002043] font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Stock In / Adjust</span>
          </button>
        </div>
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

      {/* Grid: Dispense Queue vs Drug Stock Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Dispense Queue (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">E-Rx Dispensing Queue</h3>
              <p className="text-xs text-slate-500">Doctor orders requiring verification &amp; packaging.</p>
            </div>
            <div className="flex gap-1 text-[11px]">
              {(['all', 'PENDING', 'DISPENSED'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    activeTab === tab ? 'bg-[#002043] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab === 'all' ? 'All' : tab}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading prescription queue...</div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No prescriptions found for this filter.</div>
          ) : (
            <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
              {filteredPrescriptions.map((rx) => {
                const isDispensed = String(rx.status).toUpperCase() === 'DISPENSED';
                return (
                  <div
                    key={rx.id}
                    className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        {rx.prescription_number || `Rx-${rx.id.slice(-6)}`}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isDispensed
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {rx.status}
                      </span>
                    </div>

                    <p className="text-slate-600 text-[11px]">
                      Doctor: <strong>{rx.doctor_name || 'Clinician'}</strong> • Patient ID: {rx.patient_id}
                    </p>

                    {/* Prescribed Items list */}
                    <div className="py-1 space-y-1">
                      {rx.items?.map((item, idx) => (
                        <div key={idx} className="bg-white p-2 rounded-xl border border-slate-100 flex items-center justify-between text-[11px]">
                          <div>
                            <span className="font-bold text-slate-800">{item.medicine_name}</span>
                            <span className="text-slate-500 block text-[10px]">{item.dosage} • {item.frequency} ({item.duration_days}d)</span>
                          </div>
                          <span className="font-mono font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded">
                            Qty: {item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex justify-between items-center border-t border-slate-100">
                      <span className="text-[10px] text-slate-400">
                        {rx.created_at ? new Date(rx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                      {!isDispensed ? (
                        <button
                          type="button"
                          onClick={() => handleDispenseRx(rx.id)}
                          disabled={isDispensing === rx.id}
                          className="px-3.5 py-1.5 bg-[#002043] hover:bg-[#17365d] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                        >
                          <Barcode className="w-3.5 h-3.5 text-teal-300" />
                          <span>{isDispensing === rx.id ? 'Dispensing...' : 'Verify & Dispense'}</span>
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Dispensed</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Drug Stock Inventory Monitor (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Hospital Pharmacy Formulary &amp; Stock</h3>
              <p className="text-xs text-slate-500">Real-time inventory levels synchronized with Spring Boot &amp; MongoDB.</p>
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search drug or code..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#002043]"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading inventory records...</div>
          ) : filteredInventory.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No inventory items matching query.</div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Medicine &amp; Code</th>
                    <th className="px-3 py-3">Category</th>
                    <th className="px-3 py-3">Dosage / Strength</th>
                    <th className="px-3 py-3 text-right">Unit Price</th>
                    <th className="px-3 py-3 text-right">In Stock</th>
                    <th className="px-3 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInventory.map((item) => {
                    const isLow = item.current_stock <= item.minimum_threshold;
                    const isCritical = item.current_stock === 0;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5">
                          <span className="font-bold text-slate-900 block">{item.name}</span>
                          <span className="font-mono text-[10px] text-slate-400">{item.code}</span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">{item.category}</td>
                        <td className="px-3 py-2.5 text-slate-600">{item.dosage_form} • {item.strength}</td>
                        <td className="px-3 py-2.5 text-right font-medium text-slate-800">₹{item.unit_price.toFixed(2)}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-slate-900">
                          <span className={isCritical ? 'text-rose-600 font-black' : isLow ? 'text-amber-600' : 'text-emerald-700'}>
                            {item.current_stock}
                          </span>
                          <span className="text-slate-400 text-[10px] block">Min: {item.minimum_threshold}</span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isCritical
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : isLow
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}>
                            {item.stock_status || (isCritical ? 'OUT OF STOCK' : isLow ? 'LOW STOCK' : 'IN STOCK')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Pharmacy Stock Adjustment</h3>
            <p className="text-xs text-slate-500">Record stock addition, audit adjustments, or manual restock.</p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Medicine</label>
                <select
                  value={adjustMedId}
                  onChange={(e) => setAdjustMedId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {inventory.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.code}) - Current: {i.current_stock}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Transaction Type</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="RESTOCK">RESTOCK (Inbound Consignment)</option>
                  <option value="AUDIT_ADJUSTMENT">AUDIT_ADJUSTMENT (Cycle Count)</option>
                  <option value="DISPENSE">DISPENSE (Manual Override)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Reference / Note</label>
                <input
                  type="text"
                  value={adjustRef}
                  onChange={(e) => setAdjustRef(e.target.value)}
                  placeholder="e.g. TNMSC Batch #88192"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStockAdjustment}
                disabled={isAdjusting}
                className="px-5 py-2 bg-[#002043] hover:bg-[#17365d] disabled:opacity-50 text-white rounded-xl text-xs font-bold"
              >
                {isAdjusting ? 'Updating Stock...' : 'Save Stock Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
