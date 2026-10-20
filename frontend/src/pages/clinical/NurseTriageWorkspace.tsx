import { useState, useEffect } from 'react';
import {
  HeartPulse, Activity, AlertTriangle, ShieldCheck,
  CheckCircle2, Clock, User, Bed, Thermometer, RefreshCw, AlertCircle, Save
} from 'lucide-react';
import { api, AppointmentDto } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function NurseTriageWorkspace() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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
        if (refreshed) setSelectedAppointment(refreshed);
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
              Charge Nurse: <strong>{user?.name || 'Sister Priya, RN'}</strong> • Real-Time Vitals Telemetry &amp; ESI Acuity Triage
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

      {/* Grid: Patients Queue vs Live Triage Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Patient Intake Queue (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Patients Awaiting Triage &amp; Vitals</h3>
            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Live Intake
            </span>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading intake queue...</div>
          ) : appointments.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No appointments scheduled for intake.</div>
          ) : (
            <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
              {appointments.map((apt) => {
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

        {/* Triage Form (7 cols) */}
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
                    Consultant: <strong>{selectedAppointment.doctor_name || 'Assigned Doctor'}</strong> ({selectedAppointment.department_name || 'OPD'})
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
