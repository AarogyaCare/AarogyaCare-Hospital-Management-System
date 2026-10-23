import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Calendar, Clock, User, CheckCircle2, ArrowRight, ArrowLeft, 
  ShieldCheck, AlertCircle, Phone, Mail, MapPin, QrCode, Sparkles, Search,
  Copy, Check, ExternalLink
} from 'lucide-react';
import { specialtiesData } from '../data/specialties';
import { api, PatientDto } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { HospitalDoctor, mapDoctorResponse, deduplicateDoctors } from '../services/doctorMapping';
import { calculatePatientAge } from '../utils/age';
import AutocompleteSearch from '../components/AutocompleteSearch';

const formatSlotTime = (value: unknown) => {
  const slotStart = String(value ?? '').trim();
  if (/^\d{1,2}:\d{2}\s*[ap]m$/i.test(slotStart)) {
    return slotStart.replace(/\s+/g, ' ').toUpperCase();
  }

  const date = new Date(slotStart);
  return Number.isNaN(date.getTime())
    ? slotStart
    : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const localToday = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
};

export default function BookAppointment() {
  const { user, refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const initialDoctorId = searchParams.get('doctor') || '';
  const initialSpecialty = searchParams.get('specialty') || '';
  const initialDate = searchParams.get('date') || localToday();
  const initialSlot = searchParams.get('slot') || '';
  const initialMode = searchParams.get('mode') || 'In-Person OPD';

  const [currentStep, setCurrentStep] = useState(0);

  // Form states
  const [selectedSpecialty, setSelectedSpecialty] = useState(initialSpecialty);
  const [selectedDoctorId, setSelectedDoctorId] = useState(initialDoctorId);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [doctorList, setDoctorList] = useState<HospitalDoctor[]>([]);
  const [isDoctorsLoading, setIsDoctorsLoading] = useState(true);
  const [doctorLoadError, setDoctorLoadError] = useState('');
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedTime, setSelectedTime] = useState(initialSlot);
  const [consultMode, setConsultMode] = useState(initialMode);

  // Patient details
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [symptoms, setSymptoms] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [bookingError, setBookingError] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  // Staff Patient Search & Selection (RECEPTIONIST / ADMIN)
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientDto | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<PatientDto[]>([]);
  const [isSearchingPatient, setIsSearchingPatient] = useState(false);

  const handlePatientSearch = async (query: string) => {
    setPatientSearch(query);
    if (!query.trim()) {
      setPatientSearchResults([]);
      return;
    }
    setIsSearchingPatient(true);
    try {
      const results = await api.patients(query.trim());
      setPatientSearchResults(results);
    } catch {
      setPatientSearchResults([]);
    } finally {
      setIsSearchingPatient(false);
    }
  };

  const handleSelectPatient = (p: PatientDto) => {
    setSelectedPatient(p);
    setSelectedPatientId(p.id);
    setPatientSearchResults([]);
    setFullName(p.name);
    setPhone(p.phone || '');
    setEmail(p.email || '');
    setDob(p.date_of_birth || '');
    setGender(p.gender || 'Male');
  };

  const handleClearSelectedPatient = () => {
    setSelectedPatient(null);
    setSelectedPatientId('');
    setFullName('');
    setPhone('');
    setEmail('');
    setDob('');
    setGender('Male');
  };

  const calculatedAge = calculatePatientAge(dob);

  // Slot Lock Countdown Timer (5:00 minutes)
  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(() => {
    if (user?.role !== 'PATIENT') return;
    setFullName(user.name);
    setPhone(user.phone || '');
    setEmail(user.email);
    // Auto-fill DOB from profile if verified and non-placeholder
    if (user.dateOfBirth && user.dateOfBirth !== '1990-01-01') {
      setDob(user.dateOfBirth);
    } else {
      setDob('');
    }
    if (user.gender) {
      setGender(user.gender);
    }
  }, [user]);

  useEffect(() => {
    if (isConfirmed) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isConfirmed]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  useEffect(() => {
    let active = true;
    api.doctors()
      .then((response) => {
        if (!active) return;
        const backendDoctors = deduplicateDoctors(response.items.map(mapDoctorResponse));
        setDoctorList(backendDoctors);
        const initialDoctor = backendDoctors.find((item) => item.id === initialDoctorId)
          || backendDoctors.find((item) => !initialSpecialty || item.departmentName.toLowerCase().includes(initialSpecialty.toLowerCase()) || item.specializations.some((specialty) => specialty.toLowerCase().includes(initialSpecialty.toLowerCase())))
          || backendDoctors[0];
        if (initialDoctor) {
          setSelectedDoctorId(initialDoctor.id);
          setDoctorSearch(initialDoctor.name);
          setSelectedSpecialty(initialSpecialty || initialDoctor.departmentName);
        }
      })
      .catch((error) => { if (active) setDoctorLoadError(error instanceof Error ? error.message : 'Could not load doctors.'); })
      .finally(() => { if (active) setIsDoctorsLoading(false); });
    return () => { active = false; };
  }, [initialDoctorId, initialSpecialty]);

  const doctor = doctorList.find((item) => item.id === selectedDoctorId) || doctorList[0];
  useEffect(() => {
    if (!selectedDoctorId || !selectedDate) {
      setAvailableSlots([]);
      return;
    }
    let active = true;
    api.slots(selectedDoctorId, selectedDate)
      .then((slots) => {
        if (!active) return;
        const available = slots.filter((s: any) => String(s.status).toUpperCase() === 'AVAILABLE');
        setAvailableSlots(available);
        if (selectedTime && !available.some((s: any) => formatSlotTime(s.slot_start) === formatSlotTime(selectedTime))) {
          setSelectedTime('');
        }
      })
      .catch(() => {
        if (active) setAvailableSlots([]);
      });
    return () => { active = false; };
  }, [selectedDoctorId, selectedDate]);

  const filteredDoctors = doctorList.filter((d) =>
    selectedSpecialty ? d.departmentName.includes(selectedSpecialty) || d.specializations.some((specialty) => specialty.includes(selectedSpecialty)) : true
  );

  const specialties = [...new Set(doctorList.flatMap((item) => [item.departmentName, ...item.specializations]))];

  const steps = [
    { title: 'Specialty & Doctor', desc: 'Select consultant' },
    { title: 'Date & Slot', desc: 'Lock timing' },
    { title: 'Patient Details', desc: 'UHID or new intake' },
    { title: 'Review & Confirm', desc: 'Instant pass' },
  ];

  const handleConfirm = async () => {
    if (isBooking) return;
    setBookingError('');
    if (!localStorage.getItem('aarogya_access_token')) {
      setBookingError('Please sign in with a patient account before booking. The booking must be linked to an authenticated patient record.');
      return;
    }
    const matching = availableSlots.find((slot) => {
      return formatSlotTime(slot.slot_start) === formatSlotTime(selectedTime);
    });
    if (!matching) {
      setBookingError('The selected time slot is unavailable for this date. Please pick another available slot.');
      return;
    }
    if (user?.role !== 'PATIENT' && !selectedPatientId) {
      setBookingError('Please search and select a registered patient before booking. Staff cannot book appointments against their own profile.');
      return;
    }
    setIsBooking(true);
    try {
      // Persist DOB to patient profile before booking if newly provided or updated (patient self-service only)
      if (user?.role === 'PATIENT' && dob && dob !== user.dateOfBirth) {
        try {
          await api.updateMyProfile({ date_of_birth: dob, gender });
          if (refreshUser) {
            await refreshUser();
          }
        } catch (profileErr) {
          console.warn('Profile DOB sync notice:', profileErr);
        }
      }

      const created = await api.bookAppointment(
        matching.id,
        symptoms || 'General consultation',
        consultMode === 'Video Teleconsult' ? 'VIDEO' : 'IN_PERSON',
        selectedDate,
        user?.role !== 'PATIENT' ? selectedPatientId : undefined
      );
      setBookingRef(created.appointment_number || created.id);
      setShortUrl(created.short_url || '');
      setIsConfirmed(true);
    } catch (error: any) {
      const status = error?.status;
      const msg = error instanceof Error ? error.message : 'Appointment booking failed.';
      if (status === 409 || msg.toLowerCase().includes('already booked')) {
        setBookingError('This time slot has already been booked for the selected date. Please choose a different slot or date.');
      } else if (msg.toLowerCase().includes('past') || msg.toLowerCase().includes('passed')) {
        setBookingError(msg);
      } else if (status === 400) {
        setBookingError(msg);
      } else if (status >= 500) {
        setBookingError('The appointment booking service is temporarily unavailable. Please try again in a few moments.');
      } else {
        setBookingError(msg);
      }
    } finally {
      setIsBooking(false);
    }
  };

  const isStepValid = () => {
    if (currentStep === 0) return selectedSpecialty && selectedDoctorId;
    if (currentStep === 1) return selectedDate && selectedTime;
    if (currentStep === 2) {
      if (user?.role !== 'PATIENT' && !selectedPatientId) return false;
      return fullName.trim().length > 2 && phone.trim().length >= 10 && Boolean(dob) && calculatePatientAge(dob).isValid;
    }
    return true;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#002043] via-[#002b54] to-[#178B8B] text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/10">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-teal-500/20 px-3 py-1 rounded-full border border-teal-400/30">
            Medora Clinical OPD
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-2 tracking-tight">
            Appointment Booking Wizard
          </h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1">
            Real-time multi-step slot reservation with guaranteed consultation allocation.
          </p>
        </div>

        {/* Slot Lock Countdown Indicator */}
        {!isConfirmed && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl flex items-center gap-3 self-start md:self-auto">
            <Clock className="w-5 h-5 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
            <div>
              <span className="text-[10px] text-slate-300 block font-medium">Slot Hold Expiration:</span>
              <span className="text-sm font-mono font-bold text-amber-300">{formatTimer(timeLeft)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Wizard Progress Stepper */}
      {!isConfirmed && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {steps.map((s, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border transition ${
                idx === currentStep
                  ? 'bg-white border-[#178B8B] shadow-sm ring-2 ring-[#178B8B]/20'
                  : idx < currentStep
                  ? 'bg-teal-50/50 border-teal-200'
                  : 'bg-white/60 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx === currentStep
                      ? 'bg-[#002043] text-white'
                      : idx < currentStep
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {idx < currentStep ? '✓' : idx + 1}
                </span>
                <span className="text-xs font-bold text-slate-800">{s.title}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 pl-8">{s.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation View */}
      {isConfirmed ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 md:p-12 shadow-xl space-y-8 text-center animate-fadeIn">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Appointment Confirmed
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-2">
              You're Booked at Medora!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Token SMS and digital consultation pass sent to <strong>{phone}</strong>.
            </p>
          </div>

          {/* Pass Card */}
          <div className="max-w-md mx-auto bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 p-6 text-left space-y-4">
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Booking Reference</span>
                <p className="text-lg font-mono font-bold text-[#002043]">{bookingRef}</p>
                <p className="text-xs font-semibold text-teal-700">Token: AAR-{Math.floor(10 + Math.random() * 80)}</p>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <QrCode className="w-10 h-10 text-slate-800" />
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">Patient Name:</span>
                <span className="font-bold text-slate-900">{fullName} {selectedPatient?.uhid ? `(${selectedPatient.uhid})` : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Attending Specialist:</span>
                <span className="font-bold text-[#002043]">{doctor.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Department:</span>
                <span className="font-medium text-slate-800">{doctor.specialty}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date & Slot:</span>
                <span className="font-bold text-teal-700">{selectedDate} at {selectedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mode & Venue:</span>
                <span className="font-semibold text-slate-800">{consultMode} • {doctor.opdRoom}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-400">Consultation Fee:</span>
                <span className="font-bold text-[#002043]">{doctor.consultationFee > 0 ? `₹${doctor.consultationFee} (Pay at desk or online)` : 'Pay at desk or online'}</span>
              </div>

              {shortUrl && (
                <div className="pt-3 border-t border-slate-200">
                  <div className="bg-teal-50/90 rounded-2xl p-3 border border-teal-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="overflow-hidden max-w-[260px]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block">Digital Pass Short Link</span>
                      <a
                        href={shortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-teal-900 font-bold hover:underline truncate block"
                      >
                        {shortUrl}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(shortUrl);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 3000);
                      }}
                      className="px-2.5 py-1 bg-white text-teal-800 hover:bg-teal-100 text-xs font-bold rounded-lg border border-teal-300 shadow-2xs transition flex items-center gap-1 shrink-0"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to={user?.role === 'RECEPTIONIST' ? '/reception' : user?.role === 'ADMIN' ? '/operations/appointments' : '/portal/appointments'}
              className="px-6 py-3 bg-[#002043] hover:bg-[#17365d] text-white text-xs font-bold rounded-xl shadow-md transition"
            >
              {user?.role === 'RECEPTIONIST' ? 'Return to Reception Desk' : user?.role === 'ADMIN' ? 'Manage Appointments' : 'View in Patient Portal'}
            </Link>
            <button
              onClick={() => {
                setIsConfirmed(false);
                setCurrentStep(0);
                setSelectedTime('');
                setBookingError('');
                setSymptoms('');
                setShortUrl('');
                setSelectedDate(localToday());
              }}
              className="px-6 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition"
            >
              Book Another Appointment
            </button>
          </div>
        </div>
      ) : (
        /* Wizard Form Container */
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
          {/* STEP 0: Specialty & Doctor */}
          {currentStep === 0 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Step 1: Choose Specialty & Doctor</h3>
                <p className="text-xs text-slate-500">Pick from our quaternary medical specialties and consultants.</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">Medical Specialty</label>
                <select
                  value={selectedSpecialty}
                  onChange={(e) => {
                    setSelectedSpecialty(e.target.value);
                    const matching = doctorList.find((d) => d.specialty.toLowerCase().includes(e.target.value.toLowerCase()) || d.specialties.some((s) => s.toLowerCase().includes(e.target.value.toLowerCase())));
                    if (matching) setSelectedDoctorId(matching.id);
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#002043]"
                >
                  {specialtiesData.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">Available Specialists</label>
                <AutocompleteSearch
                  value={doctorSearch}
                  onChange={(value) => {
                    setDoctorSearch(value);
                    if (!doctorList.some((item) => item.name.toLowerCase() === value.toLowerCase())) setSelectedDoctorId('');
                  }}
                  onSelect={(suggestion) => {
                    if (suggestion.type === 'DOCTOR') {
                      setSelectedDoctorId(suggestion.id);
                      setDoctorSearch(suggestion.text);
                      setSelectedTime('');
                    } else {
                      setSelectedSpecialty(suggestion.text);
                    }
                  }}
                  allowedTypes={['DOCTOR', 'DEPARTMENT', 'SPECIALIZATION']}
                  placeholder="Search for a specialist..."
                  className="mb-3"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredDoctors.map((doc) => {
                    const isSelected = selectedDoctorId === doc.id;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => { setSelectedDoctorId(doc.id); setDoctorSearch(doc.name); setSelectedTime(''); }}
                        className={`p-4 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                          isSelected
                            ? 'bg-teal-50 border-[#178B8B] ring-2 ring-[#178B8B]/20 shadow-xs'
                            : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <img
                          src={doc.imageUrl}
                          alt={doc.name}
                          className="w-14 h-14 rounded-xl object-cover border border-slate-200"
                        />
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900 text-xs">{doc.name}</h4>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{doc.qualification}</p>
                          <p className="text-[11px] text-teal-700 font-semibold mt-0.5">
                            ₹{doc.consultationFee} • {doc.opdRoom}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: Date, Slot & Consultation Mode */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Step 2: Consultation Timing & Mode</h3>
                <p className="text-xs text-slate-500">Selected consultant: <strong>{doctor.name}</strong> ({doctor.specialty})</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">Consultation Mode</label>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  {['In-Person OPD', 'Video Teleconsult'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setConsultMode(mode)}
                      className={`py-3 px-4 rounded-xl text-xs font-bold transition border ${
                        consultMode === mode
                          ? 'bg-[#002043] text-white border-[#002043] shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">Preferred Appointment Date</label>
                <input
                  type="date"
                  min={localToday()}
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedTime('');
                    setBookingError('');
                  }}
                  className="w-full max-w-sm px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">Available Time Slots</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {availableSlots.map((slot) => {
                    const time = formatSlotTime(slot.slot_start);
                    const isSelected = selectedTime === time;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={`py-2 px-2 text-center rounded-xl text-xs font-bold transition border ${
                          isSelected
                            ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                  {availableSlots.length === 0 && (
                    <p className="col-span-full text-xs text-slate-500">No backend slots are currently available for this doctor.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Patient Details */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Step 3: Patient Information</h3>
                <p className="text-xs text-slate-500">{user?.role === 'PATIENT' ? 'Patient details are prefilled from your verified account.' : 'Search and select a registered patient for this booking.'}</p>
              </div>

              {/* Staff Patient Lookup (RECEPTIONIST / ADMIN) */}
              {user?.role !== 'PATIENT' && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      Staff Patient Lookup
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 mt-1">Search &amp; Select Registered Patient *</h4>
                    <p className="text-[11px] text-slate-500">
                      Select an existing patient to attach to this booking. To register an unrecorded walk-in patient, use the Reception Desk.
                    </p>
                  </div>

                  {!selectedPatient ? (
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={patientSearch}
                        onChange={(e) => handlePatientSearch(e.target.value)}
                        placeholder="Search patient by UHID, Name, or Phone..."
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#002043]"
                      />
                      {isSearchingPatient && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">Searching...</span>
                      )}

                      {patientSearchResults.length > 0 && (
                        <div className="mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white shadow-lg text-xs">
                          {patientSearchResults.map((p) => (
                            <div
                              key={p.id}
                              onClick={() => handleSelectPatient(p)}
                              className="p-2.5 hover:bg-teal-50 cursor-pointer flex items-center justify-between transition"
                            >
                              <div>
                                <span className="font-bold text-slate-900">{p.name}</span>
                                <span className="text-slate-400 text-[11px] ml-2">UHID: {p.uhid}</span>
                              </div>
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                {p.phone || p.blood_group || p.date_of_birth}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-teal-900">{selectedPatient.name}</span>
                          <span className="font-mono font-bold text-[10px] text-teal-700 bg-white px-1.5 py-0.5 rounded border border-teal-200">
                            {selectedPatient.uhid}
                          </span>
                        </div>
                        <span className="text-[11px] text-teal-700">
                          DOB: {selectedPatient.date_of_birth || 'N/A'} • {selectedPatient.gender} • {selectedPatient.phone || 'No phone'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearSelectedPatient}
                        className="text-xs text-rose-600 hover:underline font-semibold"
                      >
                        Change Patient
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Full Patient Name *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Sundar"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#002043]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Mobile Phone (for SMS Token) *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98400 12345"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#002043]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="patient@example.com"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#002043]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-700">Date of Birth (DOB) *</label>
                      {calculatedAge.isValid && (
                        <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                          Age: {calculatedAge.formattedAge}
                        </span>
                      )}
                    </div>
                    <input
                      type="date"
                      value={dob}
                      max={localToday()}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#002043]"
                    />
                    {!calculatedAge.isValid && dob && (
                      <p className="text-[10px] text-rose-500 mt-1 font-medium">{calculatedAge.error}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Chief Complaint / Symptoms (Optional)</label>
                <textarea
                  rows={2}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="e.g. Follow-up for chest tightness, high BP readings..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Review & Summary */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Step 4: Review Your Booking</h3>
                <p className="text-xs text-slate-500">Verify all appointment parameters prior to confirmation.</p>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700">
                  <div>
                    <span className="text-slate-400 block">Doctor & Specialty</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">{doctor.name}</span>
                    <span className="text-teal-700 font-medium">{doctor.specialty}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Appointment Date & Slot</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">{selectedDate}</span>
                    <span className="text-teal-700 font-medium">{selectedTime} • {consultMode}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Patient Information</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">{fullName} {selectedPatient?.uhid ? `(UHID: ${selectedPatient.uhid})` : ''}</span>
                    <span className="text-slate-500">{phone} • {gender}, {calculatedAge.isValid ? calculatedAge.formattedAge : 'Age N/A'} (DOB: {dob})</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Hospital Venue / Suite</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">{doctor.opdRoom}</span>
                    <span className="text-slate-500">Medora Campus, Chennai</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Estimated Consultation Fee:</span>
                  <span className="text-base font-extrabold text-[#002043]">{doctor.consultationFee > 0 ? `₹${doctor.consultationFee}` : 'Fee on Consultation'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Nav Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              disabled={currentStep === 0}
              onClick={() => setCurrentStep((s) => s - 1)}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                disabled={!isStepValid()}
                onClick={() => setCurrentStep((s) => s + 1)}
                className="px-6 py-2.5 bg-[#002043] hover:bg-[#17365d] text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5 transition"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                {bookingError && <div role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{bookingError}</div>}
                <button
                type="button"
                onClick={handleConfirm}
                disabled={isBooking}
                className="px-8 py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-500/25 flex items-center gap-2 transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isBooking ? 'Saving appointment…' : 'Confirm & Lock Appointment'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
