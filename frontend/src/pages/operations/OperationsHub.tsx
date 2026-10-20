import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, Activity, Bed, Zap, PhoneCall,
  ShieldCheck, AlertTriangle, CheckCircle2, Clock, MapPin, RefreshCw
} from 'lucide-react';
import { api, AppointmentDto } from '../../services/api';

export default function OperationsHub() {
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [emergencyList, setEmergencyList] = useState<any[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadOperationsTelemetry = async () => {
    setRefreshing(true);
    try {
      const [aptRes, emergRes, invRes] = await Promise.allSettled([
        api.appointments(),
        api.emergencyQueue(),
        api.inventory(),
      ]);

      if (aptRes.status === 'fulfilled') setAppointments(aptRes.value);
      if (emergRes.status === 'fulfilled') setEmergencyList(emergRes.value);
      if (invRes.status === 'fulfilled') {
        setInventoryAlerts(invRes.value.filter((i) => i.current_stock <= i.minimum_threshold).length);
      }
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadOperationsTelemetry();
  }, []);

  const waitingPatients = appointments.filter((a) => a.status === 'BOOKED' || a.status === 'CHECKED_IN').length;
  const triagedPatients = appointments.filter((a) => a.status === 'TRIAGED').length;
  const completedPatients = appointments.filter((a) => a.status === 'COMPLETED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* Hub Banner */}
      <div className="bg-gradient-to-r from-[#002043] via-[#00264a] to-[#106E70] text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-teal-500/20 px-3 py-1 rounded-full border border-teal-400/30">
            Real-Time Hospital Command Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
            Hospital Operations &amp; Capacity Telemetry
          </h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-xl">
            Live telemetry monitoring OPD queue velocity, triage throughput, dispensary alerts, and emergency intake.
          </p>
        </div>

        <button
          onClick={loadOperationsTelemetry}
          disabled={refreshing}
          className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 self-start md:self-auto"
        >
          <Zap className={`w-4 h-4 text-teal-300 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Syncing...' : 'Sync Telemetry'}</span>
        </button>
      </div>

      {/* 4 Main Operational Heatmap Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Waiting at Desk */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Awaiting Intake</span>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">Atrium</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#002043]">{waitingPatients}</span>
            <span className="text-xs text-slate-400">Patients</span>
          </div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">Checked-in or scheduled walk-ins</p>
        </div>

        {/* In Triage */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Triaged &amp; Vitals Ready</span>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">Tower B</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-teal-700">{triagedPatients}</span>
            <span className="text-xs text-slate-400">Patients</span>
          </div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">Broadcast to Doctor OPD Suites</p>
        </div>

        {/* Consultations Completed */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Consultations Signed</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Completed</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#002043]">{completedPatients}</span>
            <span className="text-xs text-slate-400">Encounter Records</span>
          </div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">E-Rx dispatched to dispensary</p>
        </div>

        {/* Emergency & Dispensary Alerts */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Dispensary Stock Alerts</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
              inventoryAlerts > 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
            }`}>
              {inventoryAlerts > 0 ? 'Action Needed' : 'Normal'}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600">{inventoryAlerts}</span>
            <span className="text-xs text-slate-400">Low Stock Drugs</span>
          </div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">Automatic replenishment flagged</p>
        </div>
      </div>

      {/* Operational Station Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/reception"
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-teal-500 transition group space-y-2"
        >
          <Building2 className="w-8 h-8 text-teal-600 mb-2" />
          <h3 className="font-bold text-slate-900 group-hover:text-[#002043]">Reception Front Desk</h3>
          <p className="text-xs text-slate-500">Walk-in patient registration, doctor slot booking, and queue token printing.</p>
        </Link>

        <Link
          to="/nursing/station"
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-teal-500 transition group space-y-2"
        >
          <Activity className="w-8 h-8 text-indigo-600 mb-2" />
          <h3 className="font-bold text-slate-900 group-hover:text-[#002043]">Nurse Triage Station</h3>
          <p className="text-xs text-slate-500">ESI acuity evaluation and live vital signs telemetry recording.</p>
        </Link>

        <Link
          to="/pharmacy"
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-teal-500 transition group space-y-2"
        >
          <ShieldCheck className="w-8 h-8 text-emerald-600 mb-2" />
          <h3 className="font-bold text-slate-900 group-hover:text-[#002043]">Pharmacy &amp; Inventory</h3>
          <p className="text-xs text-slate-500">Barcode verified E-Rx dispensing and formulary stock management.</p>
        </Link>
      </div>
    </div>
  );
}
