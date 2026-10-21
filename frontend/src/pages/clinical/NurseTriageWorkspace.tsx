import { useState, useEffect } from 'react';
import {
  HeartPulse, Activity, AlertTriangle, ShieldCheck,
  CheckCircle2, Clock, User, Bed, Thermometer, RefreshCw, AlertCircle, Save,
  Search, FlaskConical, Check, ChevronRight
} from 'lucide-react';
import { api, AppointmentDto } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export interface PatientLabItem {
  id: string;
  order_number?: string;
  test_name: string;
  test_category?: string;
  sample_type?: string;
  urgency?: string;
  status: string;
  result_value?: string;
  result_unit?: string;
  reference_range?: string;
  ordered_at?: string;
  doctor_name?: string;
}

export default function NurseTriageWorkspace() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'AWAITING' | 'URGENT' | 'TRIAGED'>('ALL');

  // Lab Coordination state
  const [patientLabOrders, setPatientLabOrders] = useState<PatientLabItem[]>([]);
  const [isLoadingLabs, setIsLoadingLabs] = useState(false);
  const [collectingLabId, setCollectingLabId] = useState<string | null>(null);

  // Triage inputs
  const [triageLevel, setTriageLevel] = useState<'ESI-1' | 'ESI-2' | 'ESI-3' | 'ESI-4' | 'ESI-5'>('ESI-3');
  const [bpSystolic, setBpSystolic] = useState('120');
  const [bpDiastolic, setBpDiastolic] = useState('80');
  const [heartRate, setHeartRate] = useState('74');
  const [spo2, setSpo2] = useState('98');
  const [temperature, setTemperature] = useState('98.6');
  const [respiratoryRate, setRespiratoryRate] = useState('16');
  const [triageNotes, setTriageNotes] = useState('');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4500);
  };

  const loadAppointments = async () => {
    setIsLoading(true);
    try {
      const data = await api.appointments();
      setAppointments(data);
      if (data.length > 0 && !selectedAppointment) {
        selectAppointment(data[0]);
      } else if (selectedAppointment) {
        const refreshed = data.find((a) => a.id === selectedAppointment.id);
        if (refreshed) selectAppointment(refreshed);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not load appointment queue.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAppointments();
  }, []);

  const loadPatientLabs = async (patientId: string) => {
    if (!patientId) {
      setPatientLabOrders([]);
      return;
    }
    setIsLoadingLabs(true);
    try {
      const orders = await api.patientLabOrders(patientId);
      setPatientLabOrders(orders || []);
    } catch {
      setPatientLabOrders([]);
    } finally {
      setIsLoadingLabs(false);
    }
  };

  const selectAppointment = (apt: AppointmentDto) => {
    setSelectedAppointment(apt);
    if (apt.triage_level && ['ESI-1', 'ESI-2', 'ESI-3', 'ESI-4', 'ESI-5'].includes(apt.triage_level)) {
      setTriageLevel(apt.triage_level as any);
    } else {
      setTriageLevel('ESI-3');
    }

    if (apt.triage_notes) {
      setTriageNotes(apt.triage_notes);
    } else {
      setTriageNotes('');
    }

    // Try to extract existing vitals if recorded
    if (apt.vital_signs) {
      const bpMatch = apt.vital_signs.match(/BP:\s*(\d+)\/(\d+)/i);
      if (bpMatch) {
        setBpSystolic(bpMatch[1]);
        setBpDiastolic(bpMatch[2]);
      }
      const hrMatch = apt.vital_signs.match(/HR:\s*(\d+)/i);
      if (hrMatch) setHeartRate(hrMatch[1]);
      const spo2Match = apt.vital_signs.match(/SpO2:\s*(\d+)/i);
      if (spo2Match) setSpo2(spo2Match[1]);
      const tempMatch = apt.vital_signs.match(/Temp:\s*([\d.]+)/i);
      if (tempMatch) setTemperature(tempMatch[1]);
      const rrMatch = apt.vital_signs.match(/RR:\s*(\d+)/i);
      if (rrMatch) setRespiratoryRate(rrMatch[1]);
    } else {
      setBpSystolic('120');
      setBpDiastolic('80');
      setHeartRate('74');
      setSpo2('98');
      setTemperature('98.6');
      setRespiratoryRate('16');
    }

    if (apt.patient_id) {
      void loadPatientLabs(apt.patient_id);
    }
  };

  const handleRecordTriage = async () => {
    if (!selectedAppointment) return;
    setIsSubmitting(true);
    try {
      const vitalsString = `BP: ${bpSystolic}/${bpDiastolic} mmHg, HR: ${heartRate} bpm, SpO2: ${spo2}%, Temp: ${temperature}°F, RR: ${respiratoryRate}/min`;

      await api.recordTriage(selectedAppointment.id, {
        triage_level: triageLevel,
        vital_signs: vitalsString,
        triage_notes: triageNotes || 'Triage vitals recorded at nursing station.',
      });

      // Update status to TRIAGED if it was BOOKED or CHECKED_IN
      if (selectedAppointment.status === 'BOOKED' || selectedAppointment.status === 'CHECKED_IN') {
        await api.updateAppointmentStatus(selectedAppointment.id, 'TRIAGED');
      }

      showToast(`Triage assessment recorded for ${selectedAppointment.patient_name || 'patient'}. Telemetry broadcast to OPD Suite.`);
      await loadAppointments();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to record triage vitals.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCollectSample = async (orderId: string, testName: string) => {
    setCollectingLabId(orderId);
    try {
      await api.updateLabStatus(orderId, { status: 'SAMPLE_COLLECTED' });
      showToast(`Specimen collected for ${testName}. Sample labeled and routed to Central Diagnostic Lab.`);
      if (selectedAppointment?.patient_id) {
        await loadPatientLabs(selectedAppointment.patient_id);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update sample collection status.', 'error');
    } finally {
      setCollectingLabId(null);
    }
  };

  const getTriageBadge = (level?: string) => {
    switch (level) {
      case 'ESI-1':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold';
      case 'ESI-2':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
      case 'ESI-3':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 font-bold';
      case 'ESI-4':
        return 'bg-blue-100 text-blue-800 border-blue-300 font-medium';
      case 'ESI-5':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-medium';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300 font-normal';
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (filterTab === 'AWAITING') {
      if (apt.status === 'TRIAGED' || Boolean(apt.triage_level)) return false;
    } else if (filterTab === 'URGENT') {
      if (apt.triage_level !== 'ESI-1' && apt.triage_level !== 'ESI-2') return false;
    } else if (filterTab === 'TRIAGED') {
      if (apt.status !== 'TRIAGED' && !apt.triage_level) return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const patName = (apt.patient_name || '').toLowerCase();
    const token = (apt.queue_token || apt.appointment_number || '').toLowerCase();
    const docName = (apt.doctor_name || '').toLowerCase();
    return patName.includes(q) || token.includes(q) || docName.includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* Station Banner */}
      <div className="bg-gradient-to-r from-[#002043] via-[#00284d] to-[#106E70] text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-teal-300">
            <HeartPulse className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black">Nurse &amp; Triage Station</h1>
              <span className="px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-200 text-[10px] font-bold">
                Tower B • Station 4
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Charge Nurse: <strong>{user?.name || 'Sister Priya, RN'}</strong> • Real-Time Vitals Telemetry, ESI Acuity &amp; Phlebotomy Intake
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAppointments}
            disabled={isLoading}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <div className="bg-white/10 p-3 rounded-2xl border border-white/20 text-xs">
            <span className="text-slate-300 block text-[10px]">Active Queue:</span>
            <span className="text-sm font-extrabold text-white">{appointments.length} Patients</span>
          </div>
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

      {/* Grid: Intake Queue vs Triage & Lab Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Patient Intake Queue (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Patient Intake Queue</h3>
                <p className="text-xs text-slate-500">OPD Outpatient arrivals awaiting vitals registration.</p>
              </div>
              <span className="text-xs font-bold font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {filteredAppointments.length}
              </span>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 text-[11px] pt-1">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'AWAITING', label: 'Awaiting' },
                { id: 'URGENT', label: 'Urgent (ESI 1-2)' },
                { id: 'TRIAGED', label: 'Triaged' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFilterTab(t.id as any)}
                  className={`px-2 py-1 rounded-lg font-bold transition ${
                    filterTab === t.id
                      ? 'bg-[#002043] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Queue Search Input */}
            <div className="relative pt-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient, token, doctor..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#002043]"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading triage queue...</div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No patients found for this intake filter.</div>
          ) : (
            <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
              {filteredAppointments.map((apt) => {
                const isSelected = selectedAppointment?.id === apt.id;
                return (
                  <div
                    key={apt.id}
                    onClick={() => selectAppointment(apt)}
                    className={`p-4 rounded-2xl border cursor-pointer transition ${
                      isSelected
                        ? 'bg-teal-50/70 border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                        : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">{apt.patient_name || 'Patient'}</span>
                        <span className="font-mono text-[10px] text-teal-800 font-bold bg-white px-2 py-0.5 rounded border border-teal-200">
                          {apt.queue_token || apt.appointment_number}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] border ${getTriageBadge(apt.triage_level)}`}>
                        {apt.triage_level || 'Untriaged'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                      <span>Doctor: {apt.doctor_name || 'Consultant'}</span>
                      <span className="font-semibold text-slate-700">{apt.status}</span>
                    </div>

                    {apt.vital_signs && (
                      <p className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg mt-2 truncate font-mono">
                        {apt.vital_signs}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Triage Form & Clinical Labs (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
          {!selectedAppointment ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              Please select a patient from the queue to record triage observation and vital signs.
            </div>
          ) : (
            <>
              {/* Patient Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      Token: {selectedAppointment.queue_token || selectedAppointment.appointment_number}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${getTriageBadge(selectedAppointment.triage_level)}`}>
                      {selectedAppointment.triage_level || 'Awaiting Triage'}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mt-1">{selectedAppointment.patient_name || 'Patient'}</h2>
                  <p className="text-xs text-slate-500">
                    Consultant: <strong>{selectedAppointment.doctor_name || 'Assigned Doctor'}</strong> ({selectedAppointment.department_name || 'OPD'}) • UHID: {selectedAppointment.patient_id}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRecordTriage}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 bg-[#002043] hover:bg-[#17365d] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Save className="w-3.5 h-3.5 text-teal-300" />
                  <span>{isSubmitting ? 'Recording...' : 'Save & Broadcast Vitals'}</span>
                </button>
              </div>

              {/* Triage Acuity Level Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 block">
                  Emergency Severity Index (ESI) Triage Level
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  {[
                    { id: 'ESI-1', label: '1 - Resuscitation', desc: 'Immediate life-saving' },
                    { id: 'ESI-2', label: '2 - Emergent', desc: 'High risk / severe pain' },
                    { id: 'ESI-3', label: '3 - Urgent', desc: 'Multiple resources needed' },
                    { id: 'ESI-4', label: '4 - Less Urgent', desc: 'One resource needed' },
                    { id: 'ESI-5', label: '5 - Non-Urgent', desc: 'Clinic evaluation' },
                  ].map((level) => (
                    <button
                      key={level.id}
                      type="button"
                      onClick={() => setTriageLevel(level.id as any)}
                      className={`p-3 rounded-2xl border text-left transition ${
                        triageLevel === level.id
                          ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-600/20'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <span className="font-bold text-slate-900 block">{level.label}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{level.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Vital Signs Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-teal-600" />
                  <span>Vital Signs Measurements</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Blood Pressure (Systolic / Diastolic)</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={bpSystolic}
                        onChange={(e) => setBpSystolic(e.target.value)}
                        placeholder="120"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                      <span className="text-slate-400 font-bold">/</span>
                      <input
                        type="number"
                        value={bpDiastolic}
                        onChange={(e) => setBpDiastolic(e.target.value)}
                        placeholder="80"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Heart Rate (bpm)</label>
                    <input
                      type="number"
                      value={heartRate}
                      onChange={(e) => setHeartRate(e.target.value)}
                      placeholder="72"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">SpO2 Oxygen Saturation (%)</label>
                    <input
                      type="number"
                      value={spo2}
                      onChange={(e) => setSpo2(e.target.value)}
                      placeholder="98"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Body Temperature (°F)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                      placeholder="98.6"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Respiratory Rate (/min)</label>
                    <input
                      type="number"
                      value={respiratoryRate}
                      onChange={(e) => setRespiratoryRate(e.target.value)}
                      placeholder="16"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Triage Notes */}
              <div className="space-y-1.5 text-xs">
                <label className="font-semibold text-slate-700 block">
                  Nurse Clinical Observation &amp; Triage Notes
                </label>
                <textarea
                  rows={3}
                  value={triageNotes}
                  onChange={(e) => setTriageNotes(e.target.value)}
                  placeholder="Patient fully conscious, alert. Reports dizziness since morning. No acute diaphoresis..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#002043]"
                />
              </div>

              {/* Diagnostic Laboratory Coordination & Phlebotomy Specimen Draw */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-teal-600" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Diagnostic Laboratory Orders &amp; Specimen Collection
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {patientLabOrders.length} Investigation(s)
                  </span>
                </div>

                {isLoadingLabs ? (
                  <p className="text-xs text-slate-500 py-2">Loading active diagnostic orders...</p>
                ) : patientLabOrders.length === 0 ? (
                  <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    No active lab test orders for this patient. Doctors can prescribe investigations during consultation.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {patientLabOrders.map((lab) => {
                      const isOrdered = lab.status === 'ORDERED';
                      const isCollected = lab.status === 'SAMPLE_COLLECTED';
                      const isCompleted = lab.status === 'COMPLETED';

                      return (
                        <div
                          key={lab.id}
                          className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{lab.test_name}</span>
                              {lab.order_number && (
                                <span className="font-mono text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                  {lab.order_number}
                                </span>
                              )}
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isCompleted
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isCollected
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-indigo-100 text-indigo-800'
                              }`}>
                                {lab.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              {lab.test_category || 'Investigation'} • Sample: {lab.sample_type || 'Blood'}
                              {lab.urgency === 'STAT' && (
                                <span className="ml-1 text-rose-600 font-bold uppercase">● STAT Urgent</span>
                              )}
                            </p>
                            {isCompleted && lab.result_value && (
                              <p className="text-[11px] text-emerald-800 font-semibold">
                                Result: {lab.result_value} {lab.result_unit} (Ref: {lab.reference_range || 'Normal'})
                              </p>
                            )}
                          </div>

                          <div className="shrink-0">
                            {isOrdered ? (
                              <button
                                type="button"
                                onClick={() => handleCollectSample(lab.id, lab.test_name)}
                                disabled={collectingLabId === lab.id}
                                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs"
                              >
                                <FlaskConical className="w-3.5 h-3.5" />
                                <span>{collectingLabId === lab.id ? 'Collecting...' : 'Collect Specimen'}</span>
                              </button>
                            ) : isCollected ? (
                              <span className="text-amber-700 font-semibold text-[11px] flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                                <Check className="w-3 h-3" />
                                <span>Specimen In Transit</span>
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Verified Assay</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Previously Recorded Triage Telemetry if available */}
              {selectedAppointment.triaged_at && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                  <span>
                    Last recorded by: <strong>{selectedAppointment.triaged_by || 'Nursing Staff'}</strong>
                  </span>
                  <span>
                    {new Date(selectedAppointment.triaged_at).toLocaleString()}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
