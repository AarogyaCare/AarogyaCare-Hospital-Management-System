import { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle, HeartPulse, Activity, User, Phone, Clock,
  CheckCircle2, Plus, RefreshCw, AlertCircle, ShieldAlert,
  ChevronRight, Stethoscope, Search, Check, Filter, UserCheck, ArrowRight
} from 'lucide-react';
import { api, EmergencyDto, PatientDto, EmergencyCreatePayload } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function EmergencyDesk() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<EmergencyDto[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Filter state
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'RED' | 'YELLOW' | 'GREEN'>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Intake Form state
  const [patientMode, setPatientMode] = useState<'REGISTERED' | 'WALKIN'>('WALKIN');
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState<PatientDto[]>([]);
  const [isSearchingPatient, setIsSearchingPatient] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientDto | null>(null);

  // Form fields
  const [patientName, setPatientName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [triageLevel, setTriageLevel] = useState<'RED' | 'YELLOW' | 'GREEN'>('RED');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [bp, setBp] = useState('120/80');
  const [hr, setHr] = useState('88');
  const [spo2, setSpo2] = useState('98%');
  const [temp, setTemp] = useState('98.6°F');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [onlyOnCall, setOnlyOnCall] = useState(true);

  // Doctor assignment modal / quick action state
  const [assigningCaseId, setAssigningCaseId] = useState<string | null>(null);
  const [assignDoctorId, setAssignDoctorId] = useState('');
  const [assignDoctorNotes, setAssignDoctorNotes] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [queueData, doctorsRes] = await Promise.all([
        api.emergencyQueue(),
        api.doctors()
      ]);
      setRequests(queueData || []);
      const docItems = doctorsRes?.items || [];
      setDoctors(docItems);
      // Auto-select first on-call doctor if available
      const firstOnCall = docItems.find((d: any) => d.is_on_call);
      if (firstOnCall && !selectedDoctorId) {
        setSelectedDoctorId(firstOnCall.id);
      } else if (docItems.length > 0 && !selectedDoctorId) {
        setSelectedDoctorId(docItems[0].id);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to fetch emergency queue.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    const interval = setInterval(() => {
      void loadData();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Search registered patients
  useEffect(() => {
    if (!patientSearch.trim() || patientMode !== 'REGISTERED') {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingPatient(true);
      try {
        const res = await api.patients(patientSearch.trim());
        setSearchResults(res || []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearchingPatient(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearch, patientMode]);

  const handleSelectPatient = (p: PatientDto) => {
    setSelectedPatient(p);
    setPatientName(p.name);
    setContactNumber(p.phone || '');
    setSearchResults([]);
    setPatientSearch('');
  };

  const filteredDoctors = useMemo(() => {
    if (onlyOnCall) {
      const onCallList = doctors.filter((d) => d.is_on_call);
      return onCallList.length > 0 ? onCallList : doctors;
    }
    return doctors;
  }, [doctors, onlyOnCall]);

  const handleSubmitIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      showToast('Please provide the emergency patient name.', 'error');
      return;
    }
    if (!chiefComplaint.trim()) {
      showToast('Please describe the emergency chief complaint.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const doc = doctors.find((d) => d.id === selectedDoctorId);
      const vitalsCombined = `BP: ${bp}, HR: ${hr} bpm, SpO2: ${spo2}, Temp: ${temp}`;
      const payload: EmergencyCreatePayload = {
        patient_name: patientName.trim(),
        patient_id: selectedPatient ? selectedPatient.id : undefined,
        doctor_id: selectedDoctorId || undefined,
        doctor_name: doc ? (doc.full_name || 'Dr. Assigned') : undefined,
        contact_number: contactNumber.trim() || undefined,
        triage_level: triageLevel,
        chief_complaint: chiefComplaint.trim(),
        vital_signs: vitalsCombined,
        notes: notes.trim() || undefined,
      };

      await api.createEmergency(payload);
      showToast(`Emergency patient registered successfully and assigned to ${doc?.full_name || 'Emergency Wing'}!`);

      // Reset form
      setPatientName('');
      setContactNumber('');
      setSelectedPatient(null);
      setChiefComplaint('');
      setNotes('');
      setTriageLevel('RED');
      await loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to register emergency request.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string, notesText?: string) => {
    try {
      await api.updateEmergencyStatus(id, {
        status,
        doctor_notes: notesText
      });
      showToast(`Status updated to ${status}`);
      await loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Status update failed.', 'error');
    }
  };

  const handleAssignDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningCaseId || !assignDoctorId) return;

    setIsAssigning(true);
    try {
      const doc = doctors.find((d) => d.id === assignDoctorId);
      await api.updateEmergencyStatus(assigningCaseId, {
        status: 'ASSIGNED',
        doctor_id: assignDoctorId,
        doctor_notes: assignDoctorNotes ? `Assigned to ${doc?.full_name}: ${assignDoctorNotes}` : undefined,
      });
      showToast(`Doctor ${doc?.full_name || ''} assigned to emergency case!`);
      setAssigningCaseId(null);
      setAssignDoctorId('');
      setAssignDoctorNotes('');
      await loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to assign doctor.', 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (filterLevel !== 'ALL' && r.triage_level !== filterLevel) return false;
      if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;
      return true;
    });
  }, [requests, filterLevel, filterStatus]);

  const activeCount = requests.filter((r) => r.status !== 'DISCHARGED').length;
  const redCount = requests.filter((r) => r.triage_level === 'RED' && r.status !== 'DISCHARGED').length;
  const yellowCount = requests.filter((r) => r.triage_level === 'YELLOW' && r.status !== 'DISCHARGED').length;
  const onCallCount = doctors.filter((d) => d.is_on_call).length;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#990000] via-[#5c0000] to-[#002043] text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-rose-300 animate-pulse">
            <HeartPulse className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black">Emergency Services &amp; Triage Center</h1>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-400/30 text-[10px] font-bold">
                TRAUMA &amp; ACUTE CARE WING
              </span>
            </div>
            <p className="text-xs text-rose-200 mt-0.5">
              Rapid Patient Registration ? Direct On-Call Doctor Assignment ? Immediate Clinical Handover
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm px-3.5 py-2 rounded-2xl border border-white/10 text-xs font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping" />
            <span><strong>{activeCount}</strong> Active Emergencies</span>
            <span className="text-white/40">|</span>
            <span className="text-rose-300"><strong>{redCount}</strong> RED</span>
            <span className="text-white/40">|</span>
            <span className="text-teal-300"><strong>{onCallCount}</strong> Doctors On-Call</span>
          </div>
        </div>
      </div>

      {toast && (
        <div
          role="alert"
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fadeIn border ${
            toast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Main Grid: Left = Intake & Assignment Form, Right = Emergency Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Register & Assign */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h2 className="text-base font-bold text-slate-800">Emergency Intake &amp; Doctor Assignment</h2>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 bg-rose-100 text-rose-700 rounded-lg">
              Priority Bypass
            </span>
          </div>

          <form onSubmit={handleSubmitIntake} className="space-y-4">
            {/* Patient Mode Toggle */}
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setPatientMode('WALKIN');
                  setSelectedPatient(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  patientMode === 'WALKIN'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Walk-In / Immediate Trauma
              </button>
              <button
                type="button"
                onClick={() => setPatientMode('REGISTERED')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  patientMode === 'REGISTERED'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Existing Patient (UHID)
              </button>
            </div>

            {/* Existing Patient Search if mode is REGISTERED */}
            {patientMode === 'REGISTERED' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Search Patient (Name / UHID / Phone)</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    placeholder="Type name, UHID e.g. U-1001..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500"
                  />
                  {isSearchingPatient && (
                    <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin absolute right-3 top-2.5" />
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-lg divide-y divide-slate-100">
                    {searchResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPatient(p)}
                        className="w-full text-left p-2.5 hover:bg-rose-50/50 transition flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-800">{p.name}</p>
                          <p className="text-[10px] text-slate-500">
                            <strong>{p.uhid || p.id}</strong> ? {p.gender}, {p.blood_group || 'Blood Grp Unknown'}
                          </p>
                        </div>
                        <Check className="w-4 h-4 text-rose-500" />
                      </button>
                    ))}
                  </div>
                )}

                {selectedPatient && (
                  <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200/60 flex items-center justify-between text-xs">
                    <div>
                      <p className="text-rose-900">
                        Selected: <strong className="font-bold">{selectedPatient.name}</strong>
                      </p>
                      <p className="text-[10px] text-rose-700">
                        UHID: <strong className="font-bold">{selectedPatient.uhid || selectedPatient.id}</strong> ? {selectedPatient.phone}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatient(null);
                        setPatientName('');
                      }}
                      className="text-xs text-rose-600 hover:text-rose-800 font-semibold underline"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Patient Name and Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. John Doe / Unconscious Male"
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Contact / Bystander Phone</label>
                <input
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Triage Level Selection */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Triage Severity Level *</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTriageLevel('RED')}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    triageLevel === 'RED'
                      ? 'bg-rose-600 text-white border-rose-700 shadow-md ring-2 ring-rose-400'
                      : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  <p className="text-xs font-black">RED</p>
                  <p className="text-[10px] leading-tight opacity-90">Immediate (Resuscitation)</p>
                </button>
                <button
                  type="button"
                  onClick={() => setTriageLevel('YELLOW')}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    triageLevel === 'YELLOW'
                      ? 'bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-300'
                      : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <p className="text-xs font-black">YELLOW</p>
                  <p className="text-[10px] leading-tight opacity-90">Emergent (15-30m)</p>
                </button>
                <button
                  type="button"
                  onClick={() => setTriageLevel('GREEN')}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    triageLevel === 'GREEN'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <p className="text-xs font-black">GREEN</p>
                  <p className="text-[10px] leading-tight opacity-90">Non-Urgent / Stable</p>
                </button>
              </div>
            </div>

            {/* Chief Complaint */}
            <div>
              <label className="text-xs font-bold text-slate-700">Chief Complaint &amp; Mechanism of Injury *</label>
              <textarea
                required
                rows={2}
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="e.g. Acute severe chest pain radiating to left arm, shortness of breath, diaphoresis..."
                className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Vital Signs Grid */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Vital Signs at Intake</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold">BP (mmHg)</span>
                  <input
                    type="text"
                    value={bp}
                    onChange={(e) => setBp(e.target.value)}
                    placeholder="120/80"
                    className="w-full mt-0.5 px-2 py-1.5 text-xs border border-slate-200 rounded-lg text-center font-bold"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold">HR (bpm)</span>
                  <input
                    type="text"
                    value={hr}
                    onChange={(e) => setHr(e.target.value)}
                    placeholder="88"
                    className="w-full mt-0.5 px-2 py-1.5 text-xs border border-slate-200 rounded-lg text-center font-bold"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold">SpO2</span>
                  <input
                    type="text"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    placeholder="98%"
                    className="w-full mt-0.5 px-2 py-1.5 text-xs border border-slate-200 rounded-lg text-center font-bold"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold">Temp</span>
                  <input
                    type="text"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                    placeholder="98.6°F"
                    className="w-full mt-0.5 px-2 py-1.5 text-xs border border-slate-200 rounded-lg text-center font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Assign Specific Doctor */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-rose-600" />
                  Assign Emergency On-Call Doctor *
                </label>
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyOnCall}
                    onChange={(e) => setOnlyOnCall(e.target.checked)}
                    className="w-3.5 h-3.5 text-rose-600 rounded"
                  />
                  <span>On-Call Only</span>
                </label>
              </div>

              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium focus:outline-none focus:border-rose-500"
              >
                <option value="">-- Select On-Call / Emergency Doctor --</option>
                {filteredDoctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.is_on_call ? '🚨 [ON-CALL] ' : ''}{d.full_name || 'Dr. Specialist'} — {d.department_name || 'Emergency'} ({d.room_number || 'Trauma Bay'})
                  </option>
                ))}
              </select>

              <p className="text-[10px] text-slate-500">
                Selected doctor will receive an instant emergency priority token and case alert on their Clinical Workspace.
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-bold text-slate-700">Triage / Handover Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional bystander report, allergies, airway status..."
                className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-xl font-bold text-xs shadow-lg shadow-rose-600/30 transition flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Registering &amp; Dispatching...</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  <span>Register &amp; Dispatch to Emergency Doctor</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Section: Active Emergency Queue */}
        <div className="lg:col-span-7 space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Filter className="w-4 h-4 text-slate-500" />
              <span>Filter Queue:</span>
            </div>

            {/* Triage filters */}
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <button
                onClick={() => setFilterLevel('ALL')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterLevel === 'ALL'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Levels
              </button>
              <button
                onClick={() => setFilterLevel('RED')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterLevel === 'RED'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                RED ({requests.filter((r) => r.triage_level === 'RED').length})
              </button>
              <button
                onClick={() => setFilterLevel('YELLOW')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterLevel === 'YELLOW'
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                YELLOW ({requests.filter((r) => r.triage_level === 'YELLOW').length})
              </button>
              <button
                onClick={() => setFilterLevel('GREEN')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterLevel === 'GREEN'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                GREEN ({requests.filter((r) => r.triage_level === 'GREEN').length})
              </button>
            </div>

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs px-2.5 py-1 border border-slate-200 rounded-lg bg-slate-50 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="INCOMING">INCOMING</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="ATTENDING">ATTENDING</option>
              <option value="STABILIZED">STABILIZED</option>
              <option value="ADMITTED">ADMITTED</option>
              <option value="DISCHARGED">DISCHARGED</option>
            </select>
          </div>

          {/* List of Emergency Requests */}
          {isLoading && requests.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-100">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-rose-500" />
              <p className="text-xs font-semibold">Loading live emergency cases...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-100">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500 opacity-60" />
              <p className="text-sm font-bold text-slate-700">No emergency cases in this view</p>
              <p className="text-xs text-slate-500 mt-1">All incoming emergency cases are attended or stabilized.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((req) => {
                const isRed = req.triage_level === 'RED';
                const isYellow = req.triage_level === 'YELLOW';

                return (
                  <div
                    key={req.id}
                    className={`bg-white rounded-2xl p-4.5 border transition-all shadow-sm ${
                      isRed
                        ? 'border-rose-300 ring-1 ring-rose-200 bg-rose-50/20'
                        : isYellow
                        ? 'border-amber-300 bg-amber-50/15'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                      {/* Patient & ID info in bold */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                              isRed
                                ? 'bg-rose-600 text-white animate-pulse'
                                : isYellow
                                ? 'bg-amber-500 text-white'
                                : 'bg-emerald-600 text-white'
                            }`}
                          >
                            {req.triage_level}
                          </span>
                          <span className="text-sm text-slate-900 font-bold">
                            {req.patient_name}
                          </span>
                          <span className="text-xs text-slate-500 font-bold">
                            ({req.patient_id ? req.patient_id : 'EMG-WALKIN'})
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          <strong>Complaint:</strong> {req.chief_complaint}
                        </p>
                      </div>

                      {/* Status badge */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            req.status === 'ATTENDING'
                              ? 'bg-blue-100 text-blue-800 animate-pulse'
                              : req.status === 'STABILIZED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : req.status === 'ASSIGNED'
                              ? 'bg-purple-100 text-purple-800'
                              : req.status === 'ADMITTED'
                              ? 'bg-indigo-100 text-indigo-800'
                              : req.status === 'DISCHARGED'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                    </div>

                    {/* Vitals & Assigned Doctor Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2.5 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <Activity className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="font-medium truncate">
                          <strong>Vitals:</strong> {req.vital_signs || 'Not recorded'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-1.5 truncate">
                          <Stethoscope className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span className="truncate">
                            Doctor:{' '}
                            <strong className="font-bold text-slate-800">
                              {req.doctor_name || 'Unassigned'}
                            </strong>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAssigningCaseId(req.id);
                            setAssignDoctorId(req.doctor_id || '');
                          }}
                          className="text-[10px] text-teal-700 hover:text-teal-900 font-bold underline shrink-0"
                        >
                          {req.doctor_id ? 'Change' : 'Assign'}
                        </button>
                      </div>
                    </div>

                    {req.notes && (
                      <p className="text-[11px] text-slate-500 bg-amber-50/60 p-2 rounded-lg border border-amber-100 my-2">
                        <strong>Notes:</strong> {req.notes}
                      </p>
                    )}

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                      <span className="text-[10px] text-slate-400">
                        Time: {req.created_at ? new Date(req.created_at).toLocaleTimeString() : 'Just now'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {req.status !== 'ATTENDING' && req.status !== 'DISCHARGED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(req.id, 'ATTENDING')}
                            className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition"
                          >
                            Mark Attending
                          </button>
                        )}
                        {req.status === 'ATTENDING' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(req.id, 'STABILIZED')}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition"
                          >
                            Mark Stabilized
                          </button>
                        )}
                        {req.status !== 'ADMITTED' && req.status !== 'DISCHARGED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(req.id, 'ADMITTED')}
                            className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-bold transition"
                          >
                            Admit
                          </button>
                        )}
                        {req.status !== 'DISCHARGED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(req.id, 'DISCHARGED')}
                            className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-bold transition"
                          >
                            Discharge
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Doctor Assignment Modal */}
      {assigningCaseId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-sm">Assign Emergency Doctor</h3>
              </div>
              <button
                onClick={() => setAssigningCaseId(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignDoctor} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Select Doctor</label>
                <select
                  required
                  value={assignDoctorId}
                  onChange={(e) => setAssignDoctorId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium focus:outline-none focus:border-teal-500"
                >
                  <option value="">-- Choose Doctor --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.is_on_call ? '🚨 [ON-CALL] ' : ''}{d.full_name || 'Dr. Specialist'} — {d.department_name || 'Emergency'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Assignment Note</label>
                <input
                  type="text"
                  value={assignDoctorNotes}
                  onChange={(e) => setAssignDoctorNotes(e.target.value)}
                  placeholder="e.g. STAT bedside evaluation requested"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setAssigningCaseId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigning || !assignDoctorId}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
