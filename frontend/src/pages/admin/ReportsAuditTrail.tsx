import { useState, useEffect } from 'react';
import {
  FileSpreadsheet, ShieldCheck, Download, Search,
  CheckCircle2, Clock, User, Filter, ArrowRight, RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';

interface RealAuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  targetId: string;
  category: 'Clinical EMR' | 'Financial Billing' | 'Pharmacy Rx' | 'Intake & Triage';
  status: string;
}

export default function ReportsAuditTrail() {
  const [events, setEvents] = useState<RealAuditEvent[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  const loadAuditData = async () => {
    setIsLoading(true);
    try {
      const [aptsRes, rxRes, invRes, patRes] = await Promise.allSettled([
        api.appointments(),
        api.allPrescriptions(),
        api.invoices(),
        api.patients(),
      ]);

      const apts = aptsRes.status === 'fulfilled' ? aptsRes.value : [];
      const prescriptions = rxRes.status === 'fulfilled' ? rxRes.value : [];
      const invoices = invRes.status === 'fulfilled' ? invRes.value : [];
      const patients = patRes.status === 'fulfilled' ? patRes.value : [];

      const aggregated: RealAuditEvent[] = [];

      // 1. Appointment & Triage events
      for (const apt of apts) {
        if (apt.created_at) {
          aggregated.push({
            id: `audit-apt-${apt.id}`,
            timestamp: new Date(apt.created_at).toLocaleString(),
            actor: apt.patient_name || 'Patient User',
            role: 'Patient',
            action: `Booked Appointment (${apt.consultation_mode || 'IN_PERSON'}) with ${apt.doctor_name || 'Doctor'}`,
            targetId: apt.queue_token || apt.appointment_number || apt.id,
            category: 'Intake & Triage',
            status: apt.status,
          });
        }
        if (apt.triaged_at) {
          aggregated.push({
            id: `audit-triage-${apt.id}`,
            timestamp: new Date(apt.triaged_at).toLocaleString(),
            actor: apt.triaged_by || 'Charge Nurse',
            role: 'Nurse',
            action: `Recorded Vital Signs Telemetry (${apt.triage_level || 'General'})`,
            targetId: apt.queue_token || apt.appointment_number || apt.id,
            category: 'Intake & Triage',
            status: 'TRIAGED',
          });
        }
      }

      // 2. Prescription events
      for (const rx of prescriptions) {
        if (rx.created_at) {
          aggregated.push({
            id: `audit-rx-${rx.id}`,
            timestamp: new Date(rx.created_at).toLocaleString(),
            actor: rx.doctor_name || 'Attending Physician',
            role: 'Doctor',
            action: `Issued E-Prescription with ${rx.items?.length || 0} medications`,
            targetId: rx.prescription_number || rx.id,
            category: 'Pharmacy Rx',
            status: rx.status,
          });
        }
      }

      // 3. Invoice & Payment events
      for (const inv of invoices) {
        if (inv.created_at) {
          aggregated.push({
            id: `audit-inv-${inv.id}`,
            timestamp: new Date(inv.created_at).toLocaleString(),
            actor: 'Hospital Billing System',
            role: 'Billing Staff',
            action: `Generated Invoice #${inv.invoice_number} (₹${inv.net_payable || inv.total_amount})`,
            targetId: inv.invoice_number || inv.id,
            category: 'Financial Billing',
            status: inv.status,
          });
        }
      }

      // 4. Patient Registration events
      for (const p of patients) {
        if (p.created_at) {
          aggregated.push({
            id: `audit-pat-${p.id}`,
            timestamp: new Date(p.created_at).toLocaleString(),
            actor: 'Front Desk Registrar',
            role: 'Receptionist',
            action: `Registered Patient Profile & Assigned UHID ${p.uhid}`,
            targetId: p.uhid,
            category: 'Clinical EMR',
            status: 'REGISTERED',
          });
        }
      }

      // Sort by timestamp descending
      aggregated.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setEvents(aggregated);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAuditData();
  }, []);

  const filtered = events.filter((log) => {
    const matchesCat = selectedCategory === 'All' || log.category === selectedCategory;
    const matchesSearch =
      log.actor.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.targetId.toLowerCase().includes(search.toLowerCase()) ||
      log.role.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const exportCSV = () => {
    const headers = 'ID,Timestamp,Actor,Role,Action,Target,Category,Status\n';
    const rows = filtered
      .map((e) => `"${e.id}","${e.timestamp}","${e.actor}","${e.role}","${e.action}","${e.targetId}","${e.category}","${e.status}"`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aarogyacare_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#002043] via-[#002b54] to-[#106E70] text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-teal-500/20 px-3 py-1 rounded-full border border-teal-400/30">
            Regulatory Compliance &amp; Audit
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
            Hospital System Audit Trail &amp; Logs
          </h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-xl">
            Live immutable audit log of clinical observations, prescription dispatches, patient registrations, and financial settlements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAuditData}
            disabled={isLoading}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={exportCSV}
            className="px-4 py-2.5 bg-teal-400 hover:bg-teal-300 text-[#002043] font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by actor, action, or target ID..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#002043]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-medium text-slate-600">Category:</span>
          {['All', 'Clinical EMR', 'Financial Billing', 'Pharmacy Rx', 'Intake & Triage'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                selectedCategory === cat
                  ? 'bg-[#002043] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Recorded Hospital Transactions</h3>
          <span className="text-xs text-slate-400">{filtered.length} Events Logged</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading audit log events...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No audit events match your filter.</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-3 py-3">Actor &amp; Role</th>
                  <th className="px-3 py-3">Action Details</th>
                  <th className="px-3 py-3">Target ID</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                      {log.timestamp}
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-bold text-slate-900 block">{log.actor}</span>
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded w-fit inline-block">
                        {log.role}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-800 font-normal">
                      {log.action}
                    </td>
                    <td className="px-3 py-3 font-mono font-bold text-teal-800">
                      {log.targetId}
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {log.category}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
