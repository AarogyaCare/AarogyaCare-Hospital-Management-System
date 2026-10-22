import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ShieldAlert, HeartPulse, Bed, Stethoscope, User,
  Clock, AlertTriangle, Flame, CheckCircle2, PlusCircle, Activity,
  FileText, ArrowRight, UserCheck, CheckSquare
} from 'lucide-react';
import { api, EmergencyIncidentDetailDto } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function IncidentDetailWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [incident, setIncident] = useState<EmergencyIncidentDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    doctor_id: '',
    doctor_name: '',
    nurse_id: '',
    nurse_name: '',
    bay: 'Resuscitation Bay 1'
  });

  const [interventionModalOpen, setInterventionModalOpen] = useState(false);
  const [interventionForm, setInterventionForm] = useState({
    type: 'IV_RESUSCITATION',
    notes: '',
    vitals: ''
  });

  const [reassessModalOpen, setReassessModalOpen] = useState(false);
  const [reassessForm, setReassessForm] = useState({
    triage_level: 'YELLOW',
    reason: '',
    vital_signs: ''
  });

  const [dispositionModalOpen, setDispositionModalOpen] = useState(false);
  const [dispositionForm, setDispositionForm] = useState({
    disposition: 'ADMITTED',
    destination_ward: 'Intensive Care Unit (ICU-1)',
    notes: ''
  });

  const [actionLoading, setActionLoading] = useState(false);

  const loadIncident = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.emergencyDetail(id);
      setIncident(data);
      // Prepopulate assign form
      setAssignForm({
        doctor_id: data.assigned_doctor_id || 'doc-1',
        doctor_name: data.assigned_doctor_name || 'Dr. Priya Swaminathan',
        nurse_id: data.assigned_nurse_id || 'user-n1',
        nurse_name: data.assigned_nurse_name || 'Trauma Nurse Lakshmi',
        bay: data.assigned_bay || 'Resuscitation Bay 1'
      });
      setReassessForm(prev => ({
        ...prev,
        triage_level: data.triage_level || 'YELLOW',
        vital_signs: data.vital_signs || ''
      }));
    } catch (err: any) {
      setError(err.message || 'Failed to load emergency incident workspace');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadIncident();
  }, [loadIncident]);

  const handleAssignCareTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setActionLoading(true);
    try {
      const updated = await api.assignEmergencyCareTeam(id, assignForm);
      setIncident(updated);
      setAssignModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update care team and bay');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setActionLoading(true);
    try {
      const updated = await api.recordEmergencyIntervention(id, interventionForm);
      setIncident(updated);
      setInterventionModalOpen(false);
      setInterventionForm({ type: 'IV_RESUSCITATION', notes: '', vitals: '' });
    } catch (err: any) {
      alert(err.message || 'Failed to record clinical intervention');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReassessAcuity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setActionLoading(true);
    try {
      const updated = await api.reassessEmergencyAcuity(id, reassessForm);
      setIncident(updated);
      setReassessModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to reassess clinical acuity');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConcludeDisposition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setActionLoading(true);
    try {
      const updated = await api.concludeEmergencyDisposition(id, dispositionForm);
      setIncident(updated);
      setDispositionModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to conclude emergency disposition');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F4F9] flex items-center justify-center p-6 text-slate-500">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-2" />
          <p className="text-xs font-semibold">Opening Emergency Incident Workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="min-h-screen bg-[#F0F4F9] p-8">
        <div className="max-w-xl mx-auto bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900 mb-1">Unable to Load Incident</h2>
          <p className="text-xs text-slate-500 mb-4">{error || 'Incident record could not be found.'}</p>
          <Link
            to="/emergency/command-center"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Command Center
          </Link>
        </div>
      </div>
    );
  }

  const isClosed = ['ADMITTED', 'TRANSFERRED', 'DISCHARGED', 'DECEASED', 'CANCELLED'].includes(incident.status?.toUpperCase());

  return (
    <div className="min-h-screen bg-[#F0F4F9] text-slate-900 pb-16">
      {/* Workspace Header */}
      <div className="bg-[#001730] text-white px-4 md:px-8 py-4 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/emergency/command-center"
              className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition"
              title="Return to Command Center"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-teal-400 bg-teal-950/80 px-2.5 py-0.5 rounded text-xs border border-teal-800/60">
                  {incident.incident_number || incident.id.substring(0, 8)}
                </span>
                <h1 className="text-lg md:text-xl font-bold tracking-tight text-white">
                  {incident.patient_name}
                </h1>
                {incident.is_provisional && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    PROVISIONAL PATIENT
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Arrival: {new Date(incident.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} | Location: {incident.location || 'ER Entrance'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Acuity Badge */}
            <div className="px-3 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 bg-slate-800/80">
              {incident.triage_level === 'RED' ? (
                <>
                  <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
                  <span className="text-rose-400">ESI-1 RED (CRITICAL)</span>
                </>
              ) : incident.triage_level === 'YELLOW' ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-300">ESI-2/3 YELLOW (URGENT)</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">ESI-4/5 GREEN (STABLE)</span>
                </>
              )}
            </div>

            {/* Status progression indicator */}
            <div className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-800 border border-slate-700 text-slate-200">
              STATUS: <span className="text-teal-300 font-mono">{incident.status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: 2/3 width Clinical Actions & Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Disposition Banner if Closed */}
            {isClosed && (
              <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-300 shadow-sm flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-emerald-900">
                    Incident Concluded: {incident.disposition || incident.status}
                  </h3>
                  <p className="text-xs text-emerald-800 mt-1">
                    Destination Ward: <strong className="font-semibold">{incident.destination_ward || 'Not specified'}</strong>
                  </p>
                  {incident.disposition_notes && (
                    <p className="text-xs text-emerald-700 mt-1 italic">
                      Notes: &ldquo;{incident.disposition_notes}&rdquo;
                    </p>
                  )}
                  <p className="text-[11px] text-emerald-600 mt-2 font-mono">
                    Signed off by {incident.closed_by || 'Attending Physician'} at{' '}
                    {incident.closed_at ? new Date(incident.closed_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A'}
                  </p>
                </div>
              </div>
            )}

            {/* Card 1: Clinical Triage & Vital Signs */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-rose-600" />
                  <h2 className="text-sm font-bold text-slate-900">Clinical Triage &amp; Presenting Vitals</h2>
                </div>
                {!isClosed && (
                  <button
                    onClick={() => setReassessModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Reassess Acuity
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Chief Complaint:</span>
                  <p className="text-slate-900 font-semibold mt-0.5">{incident.chief_complaint || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Recorded Vital Signs:</span>
                  <p className="text-slate-900 font-mono font-bold mt-0.5 text-rose-700">
                    {incident.vital_signs || 'Pending clinical vitals recording'}
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2: Care Team & Resuscitation Bay Allocation */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Bed className="w-5 h-5 text-teal-600" />
                  <h2 className="text-sm font-bold text-slate-900">Care Team &amp; Bay Allocation</h2>
                </div>
                {!isClosed && (
                  <button
                    onClick={() => setAssignModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 transition"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Assign / Reallocate
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-[11px] font-semibold">Allocated Bay / Bed</span>
                  <p className="text-sm font-bold text-teal-900 mt-1 flex items-center gap-1.5">
                    <Bed className="w-4 h-4 text-teal-600" />
                    {incident.assigned_bay || 'Unassigned'}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-[11px] font-semibold">Attending Doctor</span>
                  <p className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-slate-500" />
                    {incident.assigned_doctor_name || 'Unassigned'}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-[11px] font-semibold">Primary Trauma Nurse</span>
                  <p className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-slate-500" />
                    {incident.assigned_nurse_name || 'Unassigned'}
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3: Clinical Resuscitation & Interventions Log */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  <h2 className="text-sm font-bold text-slate-900">
                    Clinical Resuscitation &amp; Interventions ({incident.interventions?.length || 0})
                  </h2>
                </div>
                {!isClosed && (
                  <button
                    onClick={() => setInterventionModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300 transition"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Record Intervention
                  </button>
                )}
              </div>

              {incident.interventions && incident.interventions.length > 0 ? (
                <div className="space-y-3">
                  {incident.interventions.map((inter, idx) => (
                    <div
                      key={inter.id || idx}
                      className="bg-purple-50/50 p-3.5 rounded-xl border border-purple-100 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-200 text-purple-900 font-mono">
                            {inter.type}
                          </span>
                          <span className="font-semibold text-slate-800">{inter.notes}</span>
                        </div>
                        {inter.vitals_recorded && (
                          <div className="text-[11px] text-purple-800 font-mono">
                            Vitals at intervention: {inter.vitals_recorded}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-500">
                          By: <strong className="font-medium text-slate-700">{inter.author}</strong> ({inter.role})
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {new Date(inter.timestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 text-xs">
                  No clinical interventions recorded yet. Click &ldquo;Record Intervention&rdquo; to log IV fluids, medications, or resuscitation actions.
                </div>
              )}
            </div>

            {/* Card 4: Clinical Disposition Actions (if not closed) */}
            {!isClosed && (
              <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Conclude Incident &amp; Clinical Disposition</h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Sign off admission to ICU/Ward, transfer to tertiary care, or discharge with audit verification.
                  </p>
                </div>
                <button
                  onClick={() => setDispositionModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold shadow-md transition"
                >
                  Conclude Disposition
                </button>
              </div>
            )}
          </div>

          {/* Right Column: 1/3 width Audit Trail & Chronological Timeline */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-700" />
                  <h2 className="text-sm font-bold text-slate-900">Incident Audit Timeline</h2>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">{incident.timeline?.length || 0} events</span>
              </div>

              {incident.timeline && incident.timeline.length > 0 ? (
                <div className="relative border-l-2 border-slate-200 ml-3 space-y-5 my-2">
                  {incident.timeline.map((evt, idx) => (
                    <div key={idx} className="relative pl-5 text-xs">
                      {/* Timeline dot */}
                      <span className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-teal-600 border-2 border-white shadow-sm" />

                      <div className="flex items-center justify-between gap-1 text-[10px] text-slate-400 font-mono">
                        <span>{new Date(evt.timestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">{evt.role}</span>
                      </div>

                      <div className="font-bold text-slate-800 text-[11px] mt-0.5">
                        {evt.event_type}
                      </div>

                      <p className="text-slate-600 mt-0.5 leading-relaxed">
                        {evt.description}
                      </p>

                      <div className="text-[10px] text-slate-400 mt-0.5">
                        By: <span className="font-medium text-slate-600">{evt.author}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-slate-400 text-xs">
                  No timeline events recorded.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal 1: Assign Care Team & Bay */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-3 pb-2 border-b border-slate-200">
              Assign Care Team &amp; Bay
            </h3>
            <form onSubmit={handleAssignCareTeam} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Allocated Bay / Bed</label>
                <select
                  value={assignForm.bay}
                  onChange={e => setAssignForm({ ...assignForm, bay: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none font-semibold text-teal-800"
                >
                  <option value="Resuscitation Bay 1">Resuscitation Bay 1 (Code Red Priority)</option>
                  <option value="Resuscitation Bay 2">Resuscitation Bay 2 (Code Red Priority)</option>
                  <option value="Trauma Bay A">Trauma Bay A</option>
                  <option value="Trauma Bay B">Trauma Bay B</option>
                  <option value="Acute Bay 3">Acute Bay 3</option>
                  <option value="Acute Bay 4">Acute Bay 4</option>
                  <option value="Fast Track Bay 1">Fast Track Bay 1 (Non-urgent)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Attending Physician</label>
                <input
                  type="text"
                  required
                  placeholder="Doctor Name"
                  value={assignForm.doctor_name}
                  onChange={e => setAssignForm({ ...assignForm, doctor_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trauma Nurse</label>
                <input
                  type="text"
                  required
                  placeholder="Nurse Name"
                  value={assignForm.nurse_name}
                  onChange={e => setAssignForm({ ...assignForm, nurse_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold"
                >
                  {actionLoading ? 'Saving...' : 'Save Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Record Clinical Intervention */}
      {interventionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-3 pb-2 border-b border-slate-200">
              Record Clinical Resuscitation / Intervention
            </h3>
            <form onSubmit={handleRecordIntervention} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Intervention Type</label>
                <select
                  value={interventionForm.type}
                  onChange={e => setInterventionForm({ ...interventionForm, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none font-semibold text-purple-900"
                >
                  <option value="IV_RESUSCITATION">IV Fluid Resuscitation (NS / RL Bolus)</option>
                  <option value="MEDICATION_ADMINISTERED">Emergency Medication (Epinephrine, TXA, Analgesia)</option>
                  <option value="AIRWAY_MANAGEMENT">Airway &amp; Oxygenation (High Flow O2 / Intubation)</option>
                  <option value="DEFIBRILLATION_CPR">CPR / Defibrillation Cycle</option>
                  <option value="HEMOSTASIS_WOUND">Direct Pressure / Hemostasis / Wound Dressing</option>
                  <option value="DIAGNOSTIC_POINT_OF_CARE">Point-of-Care Blood Gas / FAST Ultrasound</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Action Description &amp; Dosage *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Infused 1000ml Ringer Lactate under pressure. Administered Tranexamic Acid 1g IV."
                  value={interventionForm.notes}
                  onChange={e => setInterventionForm({ ...interventionForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vitals Post-Intervention (Optional)</label>
                <input
                  type="text"
                  placeholder="BP: 95/60, HR: 105, SpO2: 96%"
                  value={interventionForm.vitals}
                  onChange={e => setInterventionForm({ ...interventionForm, vitals: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInterventionModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  {actionLoading ? 'Saving...' : 'Record Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Reassess Acuity */}
      {reassessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-3 pb-2 border-b border-slate-200">
              Clinical Acuity Reassessment
            </h3>
            <form onSubmit={handleReassessAcuity} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Triage Acuity Level</label>
                <select
                  value={reassessForm.triage_level}
                  onChange={e => setReassessForm({ ...reassessForm, triage_level: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold"
                >
                  <option value="RED">RED — ESI-1 (Critical Polytrauma / Resuscitation)</option>
                  <option value="YELLOW">YELLOW — ESI-2/3 (Urgent / Hemodynamically Stable)</option>
                  <option value="GREEN">GREEN — ESI-4/5 (Stable / Ambulatory)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinical Justification / Reason *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Hemodynamically stabilized post volume resuscitation. Mental status improved to GCS 15."
                  value={reassessForm.reason}
                  onChange={e => setReassessForm({ ...reassessForm, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Updated Vital Signs</label>
                <input
                  type="text"
                  placeholder="BP: 110/70, HR: 88, SpO2: 99%"
                  value={reassessForm.vital_signs}
                  onChange={e => setReassessForm({ ...reassessForm, vital_signs: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReassessModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  {actionLoading ? 'Updating...' : 'Update Acuity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Conclude Disposition */}
      {dispositionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-3 pb-2 border-b border-slate-200">
              Conclude Emergency Disposition &amp; Handover
            </h3>
            <form onSubmit={handleConcludeDisposition} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Final Disposition</label>
                <select
                  value={dispositionForm.disposition}
                  onChange={e => setDispositionForm({ ...dispositionForm, disposition: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold"
                >
                  <option value="ADMITTED">ADMITTED (Inpatient Ward / ICU)</option>
                  <option value="TRANSFERRED">TRANSFERRED (Tertiary Specialty Facility)</option>
                  <option value="DISCHARGED">DISCHARGED (Home with Discharge Advice)</option>
                  <option value="DECEASED">DECEASED</option>
                </select>
              </div>

              {dispositionForm.disposition === 'ADMITTED' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Destination Ward / Unit</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Intensive Care Unit (ICU-2) or Ortho Ward"
                    value={dispositionForm.destination_ward}
                    onChange={e => setDispositionForm({ ...dispositionForm, destination_ward: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              )}

              {dispositionForm.disposition === 'TRANSFERRED' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Receiving Hospital / Specialty Unit</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Government General Hospital Neurotrauma"
                    value={dispositionForm.destination_ward}
                    onChange={e => setDispositionForm({ ...dispositionForm, destination_ward: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinical Handover Summary / Advice *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Patient stabilized. Transferred to ICU-2 under Dr. Swaminathan for continuous cardiac monitoring."
                  value={dispositionForm.notes}
                  onChange={e => setDispositionForm({ ...dispositionForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDispositionModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold"
                >
                  {actionLoading ? 'Finalizing...' : 'Sign Off Disposition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
