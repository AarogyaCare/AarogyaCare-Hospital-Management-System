import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, Activity, Users, ShieldCheck, DollarSign,
  TrendingUp, Award, ArrowRight, Settings, FileSpreadsheet, Cpu, RefreshCw, Sparkles
} from 'lucide-react';
import { api } from '../../services/api';

export default function AdministratorDashboard() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    totalRevenue: 0,
    paidRevenue: 0,
    totalDoctors: 0,
    totalMedicines: 0,
    lowStockMedicines: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [togglingDocId, setTogglingDocId] = useState<string | null>(null);

  const handleToggleOnCall = async (doctorId: string, currentVal: boolean) => {
    setTogglingDocId(doctorId);
    try {
      await api.toggleDoctorOnCall(doctorId, !currentVal);
      setDoctorsList((prev) =>
        prev.map((d) => (d.id === doctorId ? { ...d, is_on_call: !currentVal } : d))
      );
    } catch (err) {
      alert('Failed to update doctor on-call status');
    } finally {
      setTogglingDocId(null);
    }
  };

  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      const [patientsRes, aptsRes, invoicesRes, docsRes, invRes] = await Promise.allSettled([
        api.patients(),
        api.appointments(),
        api.invoices(),
        api.doctors(),
        api.inventory(),
      ]);

      const patients = patientsRes.status === 'fulfilled' ? patientsRes.value : [];
      const appointments = aptsRes.status === 'fulfilled' ? aptsRes.value : [];
      const invoices = invoicesRes.status === 'fulfilled' ? invoicesRes.value : [];
      const docs = docsRes.status === 'fulfilled' ? docsRes.value.items : [];
      const inventory = invRes.status === 'fulfilled' ? invRes.value : [];

      const totalRev = invoices.reduce((sum, inv) => sum + Number(inv.net_payable || inv.total_amount || 0), 0);
      const paidRev = invoices
        .filter((inv) => String(inv.status).toUpperCase() === 'PAID')
        .reduce((sum, inv) => sum + Number(inv.net_payable || inv.total_amount || 0), 0);

      const lowStock = inventory.filter((item) => item.current_stock <= item.minimum_threshold).length;

      setStats({
        totalPatients: patients.length,
        totalAppointments: appointments.length,
        totalRevenue: totalRev,
        paidRevenue: paidRev,
        totalDoctors: docs.length,
        totalMedicines: inventory.length,
        lowStockMedicines: lowStock,
      });
      setDoctorsList(docs);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadMetrics();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6 animate-fade-in">
      {/* Executive Banner */}
      <div className="bg-gradient-to-r from-[#002043] via-[#002a50] to-[#178B8B] text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-white/10">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-teal-400/30">
            Executive Leadership Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
            Hospital Administration &amp; Governance
          </h1>
          <p className="text-slate-200 text-xs md:text-sm mt-1 max-w-xl">
            Real-time analytics and governance telemetry synchronized with Spring Boot &amp; MongoDB database.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadMetrics}
            disabled={isLoading}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition flex items-center gap-1.5 text-xs font-semibold backdrop-blur-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          <Link
            to="/lab/rate-limiter"
            className="px-3.5 py-2 bg-teal-500/30 hover:bg-teal-500/50 border border-teal-400/40 text-teal-200 rounded-xl text-xs font-semibold backdrop-blur-md transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            <span>System Design Labs</span>
          </Link>
          <Link
            to="/operations/emergency"
            className="px-3.5 py-2 bg-rose-600/30 hover:bg-rose-600/50 border border-rose-400/40 text-rose-200 rounded-xl text-xs font-semibold backdrop-blur-md transition flex items-center gap-1.5"
          >
            <span>🚨 Emergency Desk</span>
          </Link>
          <Link
            to="/admin/users"
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-md transition"
          >
            RBAC &amp; Roles
          </Link>
          <Link
            to="/admin/system-health"
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-md transition"
          >
            System Telemetry
          </Link>
          <Link
            to="/admin/reports"
            className="px-3.5 py-2 bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-300 hover:to-teal-400 text-[#002043] rounded-xl text-xs font-bold transition shadow-xs"
          >
            Audit Trails
          </Link>
        </div>
      </div>

      {/* 4 Executive Real Metrics KPI Cards (Pastel Glass Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-white/80 bg-white/85 backdrop-blur-xl p-6 shadow-sm space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Registered Patients</span>
          <p className="text-3xl font-black text-[#002043]">{isLoading ? '...' : stats.totalPatients}</p>
          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>Universal Health ID Indexed</span>
          </span>
          <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-100">Live MongoDB Master Index</p>
        </div>

        <div className="rounded-3xl border border-white/80 bg-white/85 backdrop-blur-xl p-6 shadow-sm space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Hospital Encounters</span>
          <p className="text-3xl font-black text-teal-700">{isLoading ? '...' : stats.totalAppointments}</p>
          <span className="text-xs font-semibold text-teal-700 flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            <span>{stats.totalDoctors} Consulting Faculty</span>
          </span>
          <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-100">OPD &amp; In-Person Consultations</p>
        </div>

        <div className="rounded-3xl border border-white/80 bg-white/85 backdrop-blur-xl p-6 shadow-sm space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Billed Revenue</span>
          <p className="text-3xl font-black text-[#002043]">₹{isLoading ? '...' : stats.totalRevenue.toLocaleString()}</p>
          <span className="text-xs font-semibold text-emerald-600 font-bold">
            Settled: ₹{stats.paidRevenue.toLocaleString()}
          </span>
          <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-100">Live Financial Ledger</p>
        </div>

        <div className="rounded-3xl border border-white/80 bg-white/85 backdrop-blur-xl p-6 shadow-sm space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Formulary &amp; Inventory</span>
          <p className="text-3xl font-black text-emerald-600">{isLoading ? '...' : stats.totalMedicines}</p>
          <span className={`text-xs font-semibold flex items-center gap-1 ${
            stats.lowStockMedicines > 0 ? 'text-rose-600' : 'text-emerald-600'
          }`}>
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{stats.lowStockMedicines} Low Stock Alerts</span>
          </span>
          <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-100">Synchronized Pharmacy Stock</p>
        </div>
      </div>

      {/* Clinical Volume & Governance Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Governance & Hospital System Links */}
        <div className="rounded-3xl border border-white/80 bg-white/85 backdrop-blur-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Administrative Governance Modules</h3>
            <span className="text-xs text-teal-700 font-bold">Fast Access</span>
          </div>

          <div className="space-y-3 mt-3">
            <Link
              to="/admin/users"
              className="p-4 bg-slate-50/80 hover:bg-teal-50/50 rounded-2xl border border-slate-200/80 transition flex items-center justify-between text-xs group"
            >
              <div>
                <h4 className="font-bold text-slate-900 group-hover:text-teal-900">Staff &amp; Role-Based Access (RBAC)</h4>
                <p className="text-slate-500 text-[11px] mt-0.5">Provision and manage staff accounts and roles (Doctor, Nurse, Receptionist, Pharmacist, Billing)</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-700 transition" />
            </Link>

            <Link
              to="/admin/system-health"
              className="p-4 bg-slate-50/80 hover:bg-teal-50/50 rounded-2xl border border-slate-200/80 transition flex items-center justify-between text-xs group"
            >
              <div>
                <h4 className="font-bold text-slate-900 group-hover:text-teal-900">Distributed System Architecture Health</h4>
                <p className="text-slate-500 text-[11px] mt-0.5">Real-time Spring Boot, MongoDB ping, Redis health telemetry, and cluster status</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-700 transition" />
            </Link>

            <Link
              to="/admin/reports"
              className="p-4 bg-slate-50/80 hover:bg-teal-50/50 rounded-2xl border border-slate-200/80 transition flex items-center justify-between text-xs group"
            >
              <div>
                <h4 className="font-bold text-slate-900 group-hover:text-teal-900">Clinical Audit Trail &amp; Medico-Legal Logs</h4>
                <p className="text-slate-500 text-[11px] mt-0.5">Aggregated audit log of triage events, consultation notes, dispensing, and billing</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-700 transition" />
            </Link>

            <Link
              to="/lab/rate-limiter"
              className="p-4 bg-teal-50/80 hover:bg-teal-100/70 rounded-2xl border border-teal-200/80 transition flex items-center justify-between text-xs group"
            >
              <div>
                <h4 className="font-bold text-teal-950 group-hover:text-teal-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>UCS3513 System Design Labs (7 Interactive Simulations)</span>
                </h4>
                <p className="text-teal-700/80 text-[11px] mt-0.5">Rate limiter, Consistent Hash Ring, Snowflake IDs, LSM store, Web crawler, and Autocomplete Trie</p>
              </div>
              <ArrowRight className="w-4 h-4 text-teal-600 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Emergency On-Call Doctor Duty Management */}
      <div className="rounded-3xl border border-white/80 bg-white/85 backdrop-blur-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900">🚨 Emergency On-Call Doctor Duty Roster</span>
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                {doctorsList.filter((d) => d.is_on_call).length} On-Call Now
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Designate emergency doctors on active on-call duty for immediate patient assignment and intake.
            </p>
          </div>
          <Link
            to="/operations/emergency"
            className="text-xs text-rose-700 hover:text-rose-900 font-bold underline"
          >
            Open Emergency Desk &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
          {doctorsList.map((doc) => (
            <div
              key={doc.id}
              className={`p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
                doc.is_on_call
                  ? 'bg-rose-50/60 border-rose-200 ring-1 ring-rose-300'
                  : 'bg-slate-50/70 border-slate-200'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900 truncate">
                    {doc.full_name || 'Dr. Specialist'}
                  </span>
                  {doc.is_on_call && (
                    <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded text-[9px] font-black uppercase tracking-wider">
                      ON-CALL
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  {doc.department_name || 'General'} &bull; {doc.room_number || 'OPD'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {doc.qualification || 'Consultant Specialist'}
                </p>
              </div>

              <button
                type="button"
                disabled={togglingDocId === doc.id}
                onClick={() => handleToggleOnCall(doc.id, !!doc.is_on_call)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  doc.is_on_call
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                }`}
              >
                {togglingDocId === doc.id
                  ? 'Updating...'
                  : doc.is_on_call
                  ? 'Active On-Call'
                  : 'Set On-Call'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Operational Overview */}
        <div className="rounded-3xl border border-white/80 bg-white/85 backdrop-blur-xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Hospital Operations Snapshot</h3>
              <Link to="/operations/hub" className="text-xs text-teal-700 font-bold hover:underline">View Operations Hub</Link>
            </div>

            <div className="space-y-3 mt-3 text-xs">
              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Outpatient Department (OPD) Scheduling</span>
                  <span className="text-slate-500 text-[11px]">{stats.totalAppointments} consultations recorded in master system</span>
                </div>
                <Link to="/operations/appointments" className="px-3.5 py-1.5 bg-[#002043] hover:bg-[#17365d] text-white rounded-xl font-bold text-[11px] transition">
                  Manage
                </Link>
              </div>

              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Pharmacy &amp; Dispensary Control</span>
                  <span className="text-slate-500 text-[11px]">{stats.totalMedicines} formulary drugs ({stats.lowStockMedicines} alerts)</span>
                </div>
                <Link to="/pharmacy" className="px-3.5 py-1.5 bg-[#002043] hover:bg-[#17365d] text-white rounded-xl font-bold text-[11px] transition">
                  Dispensary
                </Link>
              </div>

              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Patient Records &amp; EMR</span>
                  <span className="text-slate-500 text-[11px]">{stats.totalPatients} verified universal medical charts</span>
                </div>
                <Link to="/emr/patients" className="px-3.5 py-1.5 bg-[#002043] hover:bg-[#17365d] text-white rounded-xl font-bold text-[11px] transition">
                  Open EMR
                </Link>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-100/80 rounded-2xl text-xs text-slate-600 flex items-center justify-between border border-slate-200/60">
            <span>Medora Quaternary Referral Campus: Chennai</span>
            <span className="font-mono text-emerald-700 font-bold">API Telemetry: Connected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
