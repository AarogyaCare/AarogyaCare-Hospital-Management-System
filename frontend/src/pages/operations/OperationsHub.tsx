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

  const [updatingEmergencyId, setUpdatingEmergencyId] = useState<string | null>(null);

  const handleUpdateEmergencyStatus = async (id: string, nextStatus: string) => {
    setUpdatingEmergencyId(id);
    try {
      await api.updateEmergency(id, nextStatus);
      setEmergencyList((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: nextStatus } : item))
      );
    } catch (err) {
      console.error('Failed to update emergency status:', err);
    } finally {
      setUpdatingEmergencyId(null);
    }
  };

  const criticalRedCount = emergencyList.filter((e) => e.triage_level === 'RED' || e.priority_score === 1).length;
  const urgentYellowCount = emergencyList.filter((e) => e.triage_level === 'YELLOW' || e.priority_score === 2).length;

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

      {/* 5 Operational Heatmap Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
            <span className="text-xs font-bold text-slate-400 uppercase">Triaged &amp; Vitals</span>
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
            <span className="text-xs font-bold text-slate-400 uppercase">Consultations</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Completed</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#002043]">{completedPatients}</span>
            <span className="text-xs text-slate-400">Encounter Records</span>
          </div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">E-Rx dispatched to dispensary</p>
        </div>

        {/* Acute Emergency Active Queue */}
        <div className="bg-white rounded-3xl border border-rose-200 p-6 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-500 uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              Emergency Intake
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${criticalRedCount > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'}`}>
              {criticalRedCount > 0 ? `${criticalRedCount} Code Red` : 'Standby'}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600">{emergencyList.length}</span>
            <span className="text-xs text-slate-400">Active Cases</span>
          </div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-rose-100">Level-1 Trauma &amp; Acute Bays</p>
        </div>

        {/* Dispensary Stock Alerts */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Stock Alerts</span>
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

      {/* 24/7 Acute Emergency Department Live Intake Telemetry */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <PhoneCall className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">24/7 Emergency &amp; Trauma Intake Telemetry</h2>
              <p className="text-xs text-slate-500">Live resuscitation bay queue, acuity priority scoring, and clinical stabilization tracking</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
              {criticalRedCount} Critical (Red)
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              {urgentYellowCount} Urgent (Yellow)
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {emergencyList.length} Total
            </span>
            <Link
              to="/emergency/command-center"
              className="px-3 py-1 rounded-full text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition flex items-center gap-1 shadow-sm"
            >
              Command Center &rarr;
            </Link>
          </div>
        </div>

        {emergencyList.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No active emergency cases currently in intake queue. Emergency bays on standby.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="py-3 px-3">Acuity / Priority</th>
                  <th className="py-3 px-3">Patient / Inbound Case</th>
                  <th className="py-3 px-3">Chief Complaint / Location</th>
                  <th className="py-3 px-3">Vital Signs Telemetry</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Progression Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {emergencyList.map((item) => {
                  const isRed = item.triage_level === 'RED' || item.priority_score === 1;
                  const isYellow = item.triage_level === 'YELLOW' || item.priority_score === 2;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-black text-[11px] ${
                          isRed
                            ? 'bg-rose-600 text-white shadow-sm'
                            : isYellow
                            ? 'bg-amber-400 text-amber-950'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isRed ? 'bg-white animate-ping' : 'bg-current'}`} />
                          {item.triage_level || (item.priority_score === 1 ? 'RED' : item.priority_score === 2 ? 'YELLOW' : 'GREEN')}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{item.patient_name || 'Emergency Intake'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.contact_number || item.contact_phone || 'Call Log Pending'}
                        </div>
                      </td>
                      <td className="py-3 px-3 max-w-xs">
                        <div className="text-slate-700 font-medium truncate">{item.chief_complaint || item.emergency_type || 'Acute presentation'}</div>
                        {item.location && (
                          <div className="text-[10px] text-teal-700 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            <span>{item.location}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {item.vital_signs || 'Telemetry In-Flight'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                          item.status === 'ADMITTED'
                            ? 'bg-purple-100 text-purple-800'
                            : item.status === 'STABILIZING'
                            ? 'bg-blue-100 text-blue-800'
                            : item.status === 'TRIAGED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800 animate-pulse'
                        }`}>
                          {item.status || 'INCOMING'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          to={`/emergency/incidents/${item.id}`}
                          className="text-teal-700 hover:text-teal-900 font-bold underline mr-2.5 text-[11px]"
                        >
                          Workspace
                        </Link>
                        {item.status === 'INCOMING' && (
                          <button
                            onClick={() => handleUpdateEmergencyStatus(item.id, 'TRIAGED')}
                            disabled={updatingEmergencyId === item.id}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold transition"
                          >
                            Mark Triaged
                          </button>
                        )}
                        {item.status === 'TRIAGED' && (
                          <button
                            onClick={() => handleUpdateEmergencyStatus(item.id, 'STABILIZING')}
                            disabled={updatingEmergencyId === item.id}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition"
                          >
                            Stabilize
                          </button>
                        )}
                        {item.status === 'STABILIZING' && (
                          <button
                            onClick={() => handleUpdateEmergencyStatus(item.id, 'ADMITTED')}
                            disabled={updatingEmergencyId === item.id}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition"
                          >
                            Admit to ICU/Bay
                          </button>
                        )}
                        {item.status === 'ADMITTED' && (
                          <span className="text-[10px] text-emerald-700 font-semibold flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Bay Assigned
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
