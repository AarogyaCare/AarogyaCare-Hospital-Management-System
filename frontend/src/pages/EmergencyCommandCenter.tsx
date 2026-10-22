import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Flame, Clock, Bed, UserCheck, Search, Filter,
  PlusCircle, RefreshCw, ChevronRight, CheckCircle2, ShieldAlert,
  ArrowUpRight, HeartPulse, Stethoscope, PhoneCall
} from 'lucide-react';
import { api, EmergencySurgeStatsDto } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface EmergencyIncidentItem {
  id: string;
  incident_number?: string;
  patient_name: string;
  patient_id?: string;
  contact_number?: string;
  triage_level: string; // RED, YELLOW, GREEN
  chief_complaint: string;
  vital_signs?: string;
  status: string;
  priority_score: number;
  created_at: string;
  location?: string;
  caller_name?: string;
  emergency_type?: string;
  notes?: string;
  is_provisional?: boolean;
  assigned_doctor_name?: string;
  assigned_nurse_name?: string;
  assigned_bay?: string;
  disposition?: string;
}

export default function EmergencyCommandCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [incidents, setIncidents] = useState<EmergencyIncidentItem[]>([]);
  const [stats, setStats] = useState<EmergencySurgeStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [triageFilter, setTriageFilter] = useState('ALL');

  // Intake Modal
  const [intakeModalOpen, setIntakeModalOpen] = useState(false);
  const [submittingIntake, setSubmittingIntake] = useState(false);
  const [intakeForm, setIntakeForm] = useState({
    patient_name: '',
    is_unidentified: false,
    contact_number: '',
    triage_level: 'RED',
    chief_complaint: '',
    vital_signs: '',
    location: 'Main Emergency Entrance',
    caller_name: '',
    emergency_type: 'ACUTE_TRAUMA',
    notes: '',
  });

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [queueData, statsData] = await Promise.all([
        api.emergencyQueue(),
        api.emergencyStats().catch(() => null)
      ]);
      setIncidents((queueData as any[]) || []);
      if (statsData) setStats(statsData);
    } catch (err) {
      console.error('Failed to load emergency command center data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleCreateIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingIntake(true);
    try {
      const payload = {
        patient_name: intakeForm.is_unidentified ? 'Unidentified Trauma Victim' : intakeForm.patient_name,
        contact_number: intakeForm.contact_number || '+91 99999 00000',
        triage_level: intakeForm.triage_level,
        chief_complaint: intakeForm.chief_complaint,
        vital_signs: intakeForm.vital_signs,
        location: intakeForm.location,
        caller_name: intakeForm.caller_name || (intakeForm.is_unidentified ? 'Trauma Rescue Team' : ''),
        emergency_type: intakeForm.emergency_type,
        notes: intakeForm.notes,
      };

      const res = await api.createEmergency(payload);
      setIntakeModalOpen(false);
      setIntakeForm({
        patient_name: '',
        is_unidentified: false,
        contact_number: '',
        triage_level: 'RED',
        chief_complaint: '',
        vital_signs: '',
        location: 'Main Emergency Entrance',
        caller_name: '',
        emergency_type: 'ACUTE_TRAUMA',
        notes: '',
      });
      await loadData();
      if (res?.id) {
        navigate(`/emergency/incidents/${res.id}`);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to log emergency intake');
    } finally {
      setSubmittingIntake(false);
    }
  };

  // Filter incidents
  const filteredIncidents = incidents.filter(inc => {
    const isTerminal = ['DISCHARGED', 'CANCELLED', 'DECEASED'].includes(inc.status?.toUpperCase());
    if (statusFilter === 'ACTIVE' && isTerminal) return false;
    if (statusFilter !== 'ALL' && statusFilter !== 'ACTIVE' && inc.status?.toUpperCase() !== statusFilter) return false;
    if (triageFilter !== 'ALL' && inc.triage_level?.toUpperCase() !== triageFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = inc.patient_name?.toLowerCase().includes(q);
      const matchInc = inc.incident_number?.toLowerCase().includes(q);
      const matchComplaint = inc.chief_complaint?.toLowerCase().includes(q);
      const matchBay = inc.assigned_bay?.toLowerCase().includes(q);
      const matchDoc = inc.assigned_doctor_name?.toLowerCase().includes(q);
      return matchName || matchInc || matchComplaint || matchBay || matchDoc;
    }
    return true;
  });

  const getTriageBadge = (level: string) => {
    switch (level?.toUpperCase()) {
      case 'RED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
            <Flame className="w-3.5 h-3.5 text-rose-600" />
            ESI-1 RED (CRITICAL)
          </span>
        );
      case 'YELLOW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            ESI-2/3 YELLOW (URGENT)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ESI-4/5 GREEN (NON-URGENT)
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'INCOMING':
        return <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">AWAITING TRIAGE</span>;
      case 'TRIAGED':
        return <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">BAY ALLOCATED</span>;
      case 'STABILIZING':
        return <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">STABILIZING / TX</span>;
      case 'ADMITTED':
        return <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">ADMITTED</span>;
      case 'TRANSFERRED':
        return <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">TRANSFERRED</span>;
      case 'DISCHARGED':
        return <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">DISCHARGED</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  const calculateWaitTime = (createdAtStr: string) => {
    try {
      const created = new Date(createdAtStr).getTime();
      const diffMins = Math.floor((Date.now() - created) / 60000);
      if (diffMins < 1) return 'Just arrived';
      if (diffMins < 60) return `${diffMins}m ago`;
      const hrs = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hrs}h ${mins}m ago`;
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F9] text-slate-900 pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#001730] via-[#002B49] to-[#0A3D62] text-white px-4 md:px-8 py-5 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-rose-600/30 border border-rose-500/50 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">Emergency Incident Command Center</h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE SURGE ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Departmental Acuity Monitoring, Resuscitation Bay Orchestration &amp; Emergency Clinical Lifecycles
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-teal-400' : ''}`} />
              Sync
            </button>
            <button
              onClick={() => setIntakeModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30 transition transform hover:-translate-y-0.5"
            >
              <PlusCircle className="w-4 h-4" />
              Log Rapid Emergency Intake
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6 space-y-6">
        {/* Surge Telemetry Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Active Incidents */}
          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Incidents</span>
              <HeartPulse className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {stats?.active_incidents ?? incidents.filter(i => !['DISCHARGED', 'CANCELLED', 'DECEASED'].includes(i.status)).length}
            </div>
            <span className="text-[11px] text-slate-500 mt-1">In ER acute workflow</span>
          </div>

          {/* Critical Red */}
          <div className="bg-rose-50/70 rounded-xl p-4 border border-rose-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-rose-700 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Critical (ESI-1)</span>
              <Flame className="w-4 h-4 text-rose-600 animate-bounce" />
            </div>
            <div className="text-2xl font-black text-rose-700">
              {stats?.critical_red_count ?? incidents.filter(i => i.triage_level === 'RED' && !['DISCHARGED', 'CANCELLED', 'DECEASED'].includes(i.status)).length}
            </div>
            <span className="text-[11px] text-rose-600 font-medium mt-1">Immediate resuscitation</span>
          </div>

          {/* Urgent Yellow */}
          <div className="bg-amber-50/70 rounded-xl p-4 border border-amber-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-700 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Urgent (ESI-2/3)</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-800">
              {stats?.urgent_yellow_count ?? incidents.filter(i => i.triage_level === 'YELLOW' && !['DISCHARGED', 'CANCELLED', 'DECEASED'].includes(i.status)).length}
            </div>
            <span className="text-[11px] text-amber-700 mt-1">High acuity care</span>
          </div>

          {/* Awaiting Triage */}
          <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-blue-700 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Awaiting Triage</span>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {stats?.awaiting_triage_count ?? incidents.filter(i => i.status === 'INCOMING').length}
            </div>
            <span className="text-[11px] text-blue-600 mt-1">Inbound / front desk</span>
          </div>

          {/* Allocated Bays */}
          <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-700 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Bays Occupied</span>
              <Bed className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-900">
              {stats?.allocated_bays_count ?? incidents.filter(i => i.assigned_bay && !['DISCHARGED', 'CANCELLED', 'DECEASED'].includes(i.status)).length}
            </div>
            <span className="text-[11px] text-emerald-600 mt-1">Active bay assignments</span>
          </div>
        </div>

        {/* Filters and Queue Controls */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by ID, name, bay, or complaint..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 self-start md:self-auto">
              <span className="text-xs text-slate-500 font-medium mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Status:
              </span>
              {[
                { id: 'ACTIVE', label: 'Active Queue' },
                { id: 'INCOMING', label: 'Awaiting Triage' },
                { id: 'TRIAGED', label: 'Bay Allocated' },
                { id: 'STABILIZING', label: 'Stabilizing' },
                { id: 'ADMITTED', label: 'Admitted' },
                { id: 'ALL', label: 'All History' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition ${
                    statusFilter === tab.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Acuity Filter */}
            <div className="flex items-center gap-1 self-start md:self-auto">
              {['ALL', 'RED', 'YELLOW', 'GREEN'].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setTriageFilter(lvl)}
                  className={`px-2 py-0.5 text-[11px] rounded font-semibold transition ${
                    triageFilter === lvl
                      ? 'bg-teal-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Incident Queue Table / Cards */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">
              Emergency Incidents Queue ({filteredIncidents.length})
            </h2>
            <span className="text-xs text-slate-500">Auto-refreshing every 5s</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-600 mb-2" />
              <p className="text-xs">Loading emergency telemetry queue...</p>
            </div>
          ) : filteredIncidents.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-slate-700">No matching emergency incidents</p>
              <p className="text-xs text-slate-500 mt-1">Queue is currently clear for the selected filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">Incident ID</th>
                    <th className="py-3 px-4">Patient / Identity</th>
                    <th className="py-3 px-4">Acuity</th>
                    <th className="py-3 px-4">Complaint &amp; Vitals</th>
                    <th className="py-3 px-4">Care Team &amp; Bay</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Wait Time</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredIncidents.map(inc => (
                    <tr
                      key={inc.id}
                      className={`hover:bg-slate-50/80 transition ${
                        inc.triage_level === 'RED' && inc.status === 'INCOMING' ? 'bg-rose-50/40' : ''
                      }`}
                    >
                      {/* Incident ID */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {inc.incident_number || inc.id.substring(0, 8)}
                      </td>

                      {/* Patient Identity */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{inc.patient_name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {inc.is_provisional && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              PROVISIONAL
                            </span>
                          )}
                          <span className="text-[11px] text-slate-500">{inc.contact_number}</span>
                        </div>
                      </td>

                      {/* Acuity */}
                      <td className="py-3 px-4">
                        {getTriageBadge(inc.triage_level)}
                      </td>

                      {/* Complaint & Vitals */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-medium text-slate-800 truncate" title={inc.chief_complaint}>
                          {inc.chief_complaint || 'N/A'}
                        </div>
                        {inc.vital_signs && (
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                            {inc.vital_signs}
                          </div>
                        )}
                      </td>

                      {/* Care Team & Bay */}
                      <td className="py-3 px-4">
                        {inc.assigned_bay ? (
                          <div className="flex items-center gap-1 font-semibold text-teal-800">
                            <Bed className="w-3.5 h-3.5 text-teal-600" />
                            {inc.assigned_bay}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned bay</span>
                        )}
                        {inc.assigned_doctor_name && (
                          <div className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                            <Stethoscope className="w-3 h-3 text-slate-400" />
                            {inc.assigned_doctor_name}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {getStatusBadge(inc.status)}
                      </td>

                      {/* Wait Time */}
                      <td className="py-3 px-4 text-slate-500 text-[11px] font-mono">
                        {calculateWaitTime(inc.created_at)}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/emergency/incidents/${inc.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition"
                        >
                          Workspace
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Rapid Intake Modal */}
      {intakeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Log Rapid Emergency Intake</h3>
              </div>
              <button
                onClick={() => setIntakeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateIntake} className="space-y-4 text-xs">
              {/* Unidentified checkbox */}
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="unidentifiedCheck"
                  checked={intakeForm.is_unidentified}
                  onChange={e => setIntakeForm({ ...intakeForm, is_unidentified: e.target.checked })}
                  className="rounded border-amber-400 text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <label htmlFor="unidentifiedCheck" className="text-amber-900 font-medium cursor-pointer">
                  Unidentified / Unconscious trauma victim (Provisionally Registered)
                </label>
              </div>

              {!intakeForm.is_unidentified && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Patient Full Name</label>
                  <input
                    type="text"
                    required={!intakeForm.is_unidentified}
                    placeholder="e.g. Ramesh Kumar"
                    value={intakeForm.patient_name}
                    onChange={e => setIntakeForm({ ...intakeForm, patient_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={intakeForm.contact_number}
                    onChange={e => setIntakeForm({ ...intakeForm, contact_number: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Triage Acuity Level</label>
                  <select
                    value={intakeForm.triage_level}
                    onChange={e => setIntakeForm({ ...intakeForm, triage_level: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none font-semibold text-rose-700 bg-white"
                  >
                    <option value="RED">RED — ESI-1 (Resuscitation / Polytrauma)</option>
                    <option value="YELLOW">YELLOW — ESI-2/3 (Emergent / Urgent)</option>
                    <option value="GREEN">GREEN — ESI-4/5 (Non-urgent)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chief Complaint / Trauma Mechanism *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Severe motor vehicle collision, chest pain radiating to jaw, severe diaphoresis"
                  value={intakeForm.chief_complaint}
                  onChange={e => setIntakeForm({ ...intakeForm, chief_complaint: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Vital Signs</label>
                  <input
                    type="text"
                    placeholder="BP: 80/50, HR: 130, SpO2: 89%"
                    value={intakeForm.vital_signs}
                    onChange={e => setIntakeForm({ ...intakeForm, vital_signs: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Arrival Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Main Ambulance Bay"
                    value={intakeForm.location}
                    onChange={e => setIntakeForm({ ...intakeForm, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIntakeModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingIntake}
                  className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md shadow-rose-900/20 transition flex items-center gap-1.5"
                >
                  {submittingIntake ? 'Registering...' : 'Confirm Emergency Intake'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
