import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, Users, Printer, PhoneCall, AlertTriangle,
  CheckCircle2, Clock, MapPin, Search, ArrowRight, ShieldAlert, Plus, RefreshCw, AlertCircle
} from 'lucide-react';
import { api, AppointmentDto, PatientDto, CreatePatientDto } from '../../services/api';
import { HospitalDoctor, mapDoctorResponse, deduplicateDoctors } from '../../services/doctorMapping';
import { calculatePatientAge } from '../../utils/age';
import { useAuth } from '../../context/AuthContext';

export default function ReceptionFrontDesk() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<HospitalDoctor[]>([]);
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [emergencyAlert, setEmergencyAlert] = useState(false);

  // Walk-In Patient Intake & Token
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState<PatientDto[]>([]);
  const [isSearchingPatient, setIsSearchingPatient] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientDto | null>(null);

  // New Patient Registration Modal
  const [showRegModal, setShowRegModal] = useState(false);
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regGender, setRegGender] = useState('Male');
  const [regBloodGroup, setRegBloodGroup] = useState('O+');
  const [regDob, setRegDob] = useState('1990-01-01');
  const [isRegistering, setIsRegistering] = useState(false);

  // Walk-in booking
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [reasonForVisit, setReasonForVisit] = useState('General Walk-In OPD Consultation');
  const [isBooking, setIsBooking] = useState(false);
  const [lastIssuedToken, setLastIssuedToken] = useState<AppointmentDto | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4500);
  };

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [docRes, aptRes] = await Promise.all([api.doctors(), api.appointments()]);
      const mappedDocs = deduplicateDoctors(docRes.items.map(mapDoctorResponse));
      setDoctors(mappedDocs);
      setAppointments(aptRes);
      if (mappedDocs.length > 0 && !selectedDoctorId) {
        setSelectedDoctorId(mappedDocs[0].id);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not fetch reception data.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadInitialData();
  }, []);

  // When selected doctor changes, fetch available slots for today
  useEffect(() => {
    if (!selectedDoctorId) return;
    const today = new Date().toISOString().slice(0, 10);
    api.slots(selectedDoctorId, today)
      .then((slots) => {
        const available = slots.filter((s: any) => String(s.status).toUpperCase() === 'AVAILABLE');
        setAvailableSlots(available);
        if (available.length > 0) {
          setSelectedSlotId(available[0].id || available[0].slot_id);
        } else {
          setSelectedSlotId('');
        }
      })
      .catch(() => setAvailableSlots([]));
  }, [selectedDoctorId]);

  const handlePatientSearch = async (query: string) => {
    setPatientSearch(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearchingPatient(true);
    try {
      const results = await api.patients(query.trim());
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearchingPatient(false);
    }
  };

  const handleRegisterPatient = async () => {
    if (!regName.trim()) {
      showToast('Patient name is required.', 'error');
      return;
    }
    setIsRegistering(true);
    try {
      const newPatient = await api.registerPatient({
        name: regName.trim(),
        phone: regPhone.trim() || undefined,
        email: regEmail.trim() || undefined,
        gender: regGender,
        blood_group: regBloodGroup,
        date_of_birth: regDob,
      });
      setSelectedPatient(newPatient);
      setShowRegModal(false);
      setRegName('');
      setRegPhone('');
      setRegEmail('');
      showToast(`Registered patient ${newPatient.name} with UHID: ${newPatient.uhid}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Patient registration failed.', 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleIssueTokenAndBook = async () => {
    if (!selectedPatient) {
      showToast('Please search or register a patient first.', 'error');
      return;
    }
    if (!selectedSlotId) {
      showToast('No available slot selected for this doctor. Please pick another consultant.', 'error');
      return;
    }
    setIsBooking(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const appointment = await api.bookAppointment(
        selectedSlotId,
        reasonForVisit,
        'IN_PERSON',
        today,
        selectedPatient.id
      );

      // Auto check-in the walk-in patient
      const checkedIn = await api.updateAppointmentStatus(appointment.id, 'CHECKED_IN');
      setLastIssuedToken(checkedIn);
      showToast(`Issued Queue Token ${checkedIn.queue_token || checkedIn.appointment_number} for ${selectedPatient.name}.`);

      // Refresh appointments and slots
      const [aptRes, slotsRes] = await Promise.all([
        api.appointments(),
        api.slots(selectedDoctorId, today)
      ]);
      setAppointments(aptRes);
      const available = slotsRes.filter((s: any) => String(s.status).toUpperCase() === 'AVAILABLE');
      setAvailableSlots(available);
      setSelectedSlotId(available[0]?.id || '');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to issue token.', 'error');
    } finally {
      setIsBooking(false);
    }
  };

  const handleCheckIn = async (aptId: string) => {
    try {
      const updated = await api.updateAppointmentStatus(aptId, 'CHECKED_IN');
      setAppointments((prev) => prev.map((a) => (a.id === aptId ? updated : a)));
      showToast(`Checked in patient. Token: ${updated.queue_token || updated.appointment_number}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Check-in failed.', 'error');
    }
  };

  const triggerEmergencyAlert = async () => {
    setEmergencyAlert(true);
    try {
const res = await api.createEmergency({
        caller_name: 'Reception Front Desk',
        patient_name: 'Code Red Trauma Patient (Bay 1)',
        contact_phone: '+91 44 2829 0000',
        contact_number: '+91 44 2829 0000',
        emergency_type: 'TRAUMA_CODE_RED',
        location: 'Medora Main Entrance Bay',
        severity_level: 'CRITICAL',
        triage_level: 'RED',
        chief_complaint: 'Inbound code red trauma alert triggered by front desk receptionist.',
        vital_signs: 'BP: Critical, HR: Tachycardic, SpO2: Pending',
        notes: 'Inbound code red trauma alert triggered by front desk receptionist.'
      });
      showToast(`RED CODE DISPATCHED (#${res?.id ? res.id.slice(0, 8) : 'ACTIVE'}): Trauma bay, crash cart, and on-call team alerted.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Emergency alert broadcast failed. Call ER extension 108 immediately.', 'error');
    }
    setTimeout(() => setEmergencyAlert(false), 5000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* Front-desk Banner */}
      <div className="bg-gradient-to-r from-[#002043] via-[#00284d] to-[#178B8B] text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-teal-300">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black">Reception &amp; Front-Desk Workspace</h1>
              <span className="px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-200 text-[10px] font-bold">
                Main Atrium Kiosk
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Attendant: <strong>{user?.name || 'Reception Staff'}</strong> • Live Patient Intake &amp; Token Queuing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/emergency/command-center"
            className="p-2.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl transition flex items-center gap-1.5 text-xs font-bold shadow-md"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Command Center</span>
          </Link>
          <button
            onClick={loadInitialData}
            disabled={isLoading}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={triggerEmergencyAlert}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg ${
              emergencyAlert
                ? 'bg-rose-600 text-white animate-bounce'
                : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-400/30'
            }`}
          >
            <PhoneCall className="w-4 h-4 text-rose-400 animate-pulse" />
            <span>{emergencyAlert ? 'Trauma Code Active!' : 'Simulate Code Red Emergency'}</span>
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

      {/* Grid: Walk-In Intake & Token Issuance vs Live Doctor OPD & Queue Board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Token Issuance & Patient Intake (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Walk-In Intake &amp; Token Generator
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-2">Print OPD Queue Slip</h2>
            <p className="text-xs text-slate-500">Search existing patient UHID or register walk-in patient, assign doctor slot, and issue queue token.</p>
          </div>

          {/* Patient Search Section */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 block">Step 1: Patient Identification</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => handlePatientSearch(e.target.value)}
                  placeholder="Search by UHID, Name, or Phone..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowRegModal(true)}
                className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>

            {/* Search results dropdown */}
            {searchResults.length > 0 && !selectedPatient && (
              <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white shadow-md text-xs">
                {searchResults.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedPatient(p);
                      setSearchResults([]);
                    }}
                    className="p-2.5 hover:bg-teal-50 cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{p.name}</span>
                      <span className="text-slate-400 text-[11px] ml-2">UHID: {p.uhid}</span>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{p.phone || p.blood_group}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Patient Card */}
            {selectedPatient && (
              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-teal-900">{selectedPatient.name}</span>
                    <span className="font-mono font-bold text-[10px] text-teal-700 bg-white px-1.5 py-0.5 rounded border border-teal-200">
                      {selectedPatient.uhid}
                    </span>
                  </div>
                  <span className="text-[11px] text-teal-700">
                    {calculatePatientAge(selectedPatient.date_of_birth).formattedAge} • {selectedPatient.gender} • {selectedPatient.phone || 'No phone'} • Blood: {selectedPatient.blood_group || 'N/A'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPatient(null)}
                  className="text-xs text-rose-600 hover:underline font-semibold"
                >
                  Change
                </button>
              </div>
            )}
          </div>

          {/* Doctor & Slot Selection */}
          <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
            <label className="font-bold text-slate-700 block">Step 2: Assign Consultant &amp; Slot</label>

            <div>
              <label className="text-slate-500 block mb-1">Consulting Specialist</label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} • {d.specialty} ({d.opdRoom})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-500 block mb-1">Available OPD Slot</label>
              {availableSlots.length === 0 ? (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px]">
                  No open slots found for this doctor today.
                </div>
              ) : (
                <select
                  value={selectedSlotId}
                  onChange={(e) => setSelectedSlotId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  {availableSlots.map((s) => (
                    <option key={s.id || s.slot_id} value={s.id || s.slot_id}>
                      {s.slot_start} - {s.slot_end} (Status: {s.status})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="text-slate-500 block mb-1">Chief Reason for Walk-In</label>
              <input
                type="text"
                value={reasonForVisit}
                onChange={(e) => setReasonForVisit(e.target.value)}
                placeholder="e.g. Acute knee pain, fever review..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <button
              type="button"
              onClick={handleIssueTokenAndBook}
              disabled={!selectedPatient || !selectedSlotId || isBooking}
              className="w-full py-3 bg-[#002043] hover:bg-[#17365d] disabled:opacity-50 text-white rounded-xl font-bold shadow-md transition flex items-center justify-center gap-2 mt-2"
            >
              <Printer className="w-4 h-4 text-teal-300" />
              <span>{isBooking ? 'Generating Token...' : 'Print Token & Check-In'}</span>
            </button>
          </div>

          {/* Last Issued Token Slip */}
          {lastIssuedToken && (
            <div className="p-4 bg-teal-50 border border-teal-300 rounded-2xl space-y-2 text-xs animate-fadeIn">
              <div className="flex items-center justify-between border-b border-teal-200 pb-2">
                <span className="font-bold text-teal-900">Medora OPD Token Slip</span>
                <span className="font-mono font-black text-lg text-[#002043]">
                  {lastIssuedToken.queue_token || lastIssuedToken.appointment_number}
                </span>
              </div>
              <p className="text-teal-900 font-semibold">Patient: {lastIssuedToken.patient_name}</p>
              <p className="text-teal-800 text-[11px]">Consultant: {lastIssuedToken.doctor_name} ({lastIssuedToken.department_name})</p>
              <p className="text-slate-600 text-[10px]">Time: {lastIssuedToken.slot_start || 'Immediate OPD'} • Status: {lastIssuedToken.status}</p>
            </div>
          )}
        </div>

        {/* Live Doctor OPD Status & Queue Board (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Live Atrium Check-In Queue</h3>
              <p className="text-xs text-slate-500">Confirm arrival and mark patients as Checked-In for triage.</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              ● Active Roster
            </span>
          </div>

          {/* Queue Table */}
          {appointments.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No scheduled patients in today's intake.</div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{apt.patient_name || 'Patient'}</span>
                      <span className="font-mono text-[10px] font-bold text-[#002043] bg-white px-2 py-0.5 rounded border border-slate-200">
                        {apt.queue_token || apt.appointment_number}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        apt.status === 'CHECKED_IN' ? 'bg-blue-100 text-blue-800' :
                        apt.status === 'TRIAGED' ? 'bg-indigo-100 text-indigo-800' :
                        apt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {apt.status}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Specialist: <strong>{apt.doctor_name}</strong> • Slot: {apt.slot_start || apt.appointment_date}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {apt.status === 'BOOKED' && (
                      <button
                        type="button"
                        onClick={() => handleCheckIn(apt.id)}
                        className="px-3.5 py-1.5 bg-[#002043] hover:bg-[#17365d] text-white rounded-xl font-bold text-xs transition"
                      >
                        Check-In
                      </button>
                    )}
                    {apt.status === 'CHECKED_IN' && (
                      <span className="text-blue-700 font-semibold text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ready for Triage</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Patient Registration Modal */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Walk-In Patient Quick Registration</h3>
            <p className="text-xs text-slate-500">Creates official patient profile in backend database and generates unique UHID.</p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Full Name *</label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Senthil Nathan"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+91 98401 23456"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Blood Group</label>
                  <select
                    value={regBloodGroup}
                    onChange={(e) => setRegBloodGroup(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Gender</label>
                  <select
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-semibold">Date of Birth</label>
                    {regDob && (
                      <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                        {calculatePatientAge(regDob).formattedAge}
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    value={regDob}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setRegDob(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="patient@example.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRegModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRegisterPatient}
                disabled={isRegistering}
                className="px-5 py-2 bg-[#002043] hover:bg-[#17365d] disabled:opacity-50 text-white rounded-xl text-xs font-bold"
              >
                {isRegistering ? 'Registering...' : 'Register Patient'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
