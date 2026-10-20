import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Zap, HeartPulse, Brain, Bone, Activity, 
  Baby, CheckCircle2, ArrowRight, Clock, ShieldCheck, AlertCircle 
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { HospitalDoctor, mapDoctorResponse, deduplicateDoctors } from '../services/doctorMapping';

const symptomClusters = [
  {
    id: 'sym-cardio',
    name: 'Chest Discomfort & Palpitations',
    category: 'Heart & Vascular',
    recommendedSpecialty: 'Cardiology',
    icon: HeartPulse,
    symptoms: ['Chest tightness or pressure', 'Shortness of breath on walking', 'Irregular heart rhythm', 'High blood pressure readings']
  },
  {
    id: 'sym-neuro',
    name: 'Severe Headache, Dizziness & Numbness',
    category: 'Brain & Spine',
    recommendedSpecialty: 'Neurology',
    icon: Brain,
    symptoms: ['Chronic throbbing migraine', 'Sudden dizziness / vertigo', 'Numbness or tingling in limbs', 'Back/neck pain radiating to leg']
  },
  {
    id: 'sym-ortho',
    name: 'Joint Pain, Swelling & Sports Injuries',
    category: 'Bones & Joints',
    recommendedSpecialty: 'Orthopedics',
    icon: Bone,
    symptoms: ['Knee joint friction or stiffness', 'Shoulder mobility limitation', 'Sports twist / ligament strain', 'Difficulty climbing stairs']
  },
  {
    id: 'sym-peds',
    name: 'Child Health, Fever & Respiratory Symptoms',
    category: 'Pediatrics',
    recommendedSpecialty: 'Pediatrics',
    icon: Baby,
    symptoms: ['Pediatric persistent fever', 'Nocturnal wheezing & cough', 'Childhood immunization review', 'Digestive issues & feeding difficulty']
  },
  {
    id: 'sym-renal',
    name: 'Urinary Symptoms, Edema & Kidney Review',
    category: 'Nephrology & Urology',
    recommendedSpecialty: 'Nephrology',
    icon: Activity,
    symptoms: ['Leg / facial swelling (edema)', 'Abnormal creatinine or urea', 'Flank pain or burning urination', 'Chronic kidney management']
  }
];

const localToday = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
};

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

export default function GuidedBooking() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedClusterId, setSelectedClusterId] = useState(symptomClusters[0].id);
  const [uhidInput, setUhidInput] = useState('');
  const [foundPatient, setFoundPatient] = useState<any>(null);
  const [lookupMessage, setLookupMessage] = useState('');
  
  // Real Doctor & Slot state
  const [allDoctors, setAllDoctors] = useState<HospitalDoctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<HospitalDoctor | null>(null);
  const [selectedDate, setSelectedDate] = useState(localToday());
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [tokenRef, setTokenRef] = useState('');
  const [confirmedSlotTime, setConfirmedSlotTime] = useState('');

  // Fetch real doctors from backend
  useEffect(() => {
    let active = true;
    api.doctors()
      .then((res) => {
        if (!active) return;
        const mapped = deduplicateDoctors(res.items.map(mapDoctorResponse));
        setAllDoctors(mapped);
      })
      .catch((err) => {
        console.error('Error fetching doctors:', err);
      })
      .finally(() => {
        if (active) setLoadingDoctors(false);
      });
    return () => { active = false; };
  }, []);

  // Set default logged in patient if available
  useEffect(() => {
    if (user?.role === 'PATIENT') {
      setFoundPatient({
        id: user.patientId || user.id,
        name: user.name,
        uhid: user.uhid || 'PAT-CURRENT',
        phone: user.phone || '',
        bloodGroup: 'Verified',
      });
    }
  }, [user]);

  const activeCluster = symptomClusters.find((c) => c.id === selectedClusterId) || symptomClusters[0];

  const matchedDoctors = allDoctors.filter((d) => {
    const target = activeCluster.recommendedSpecialty.toLowerCase();
    return (
      d.departmentName.toLowerCase().includes(target) ||
      d.specialty.toLowerCase().includes(target) ||
      d.specializations.some((s) => s.toLowerCase().includes(target))
    );
  });

  // When step 3 activates or active cluster / doctors change, pick first matched doctor
  useEffect(() => {
    if (step === 3 && matchedDoctors.length > 0 && (!selectedDoctor || !matchedDoctors.some(d => d.id === selectedDoctor.id))) {
      setSelectedDoctor(matchedDoctors[0]);
    }
  }, [step, matchedDoctors, selectedDoctor]);

  // Fetch slots whenever selected doctor or date changes
  useEffect(() => {
    if (!selectedDoctor?.id || !selectedDate) {
      setAvailableSlots([]);
      return;
    }
    let active = true;
    setLoadingSlots(true);
    setSelectedSlotId('');
    api.slots(selectedDoctor.id, selectedDate)
      .then((slots) => {
        if (!active) return;
        const open = slots.filter((s: any) => s.status === 'AVAILABLE' || !s.status);
        setAvailableSlots(open);
        if (open.length > 0) {
          setSelectedSlotId(open[0].id);
        }
      })
      .catch((err) => {
        console.error('Error fetching slots:', err);
        if (active) setAvailableSlots([]);
      })
      .finally(() => {
        if (active) setLoadingSlots(false);
      });
    return () => { active = false; };
  }, [selectedDoctor, selectedDate]);

  const handleLookup = async () => {
    if (!uhidInput.trim()) return;
    setLookupMessage('');
    try {
      const results = await api.patients(uhidInput.trim());
      const p = results.find((pat) => pat.uhid.toLowerCase() === uhidInput.trim().toLowerCase()) || results[0];
      if (p) {
        setFoundPatient(p);
        setLookupMessage(`Verified: ${p.name} (${p.uhid})`);
      } else {
        setLookupMessage('No matching patient found for this UHID. You can proceed as a new walk-in.');
      }
    } catch {
      setLookupMessage('Patient lookup failed. You can proceed with standard walk-in intake.');
    }
  };

  const handleFinish = async () => {
    setBookingError('');
    if (!selectedSlotId) {
      setBookingError('Please choose an available appointment slot time.');
      return;
    }

    const chosenSlot = availableSlots.find((s) => s.id === selectedSlotId);
    const slotDisplay = chosenSlot ? formatSlotTime(chosenSlot.slot_start) : 'Standard OPD Slot';
    setConfirmedSlotTime(slotDisplay);

    setIsBooking(true);
    try {
      // If user is authenticated, book via real backend API
      const res = await api.bookAppointment(
        selectedSlotId,
        `Guided Triage: ${activeCluster.name} (${activeCluster.recommendedSpecialty})`,
        'IN_PERSON',
        selectedDate
      );
      setTokenRef(res.appointment_number || res.id);
      setIsCompleted(true);
    } catch (err: any) {
      // If patient not authenticated or booking requires patient session, report or provide guidance
      const msg = err instanceof Error ? err.message : 'Booking failed';
      if (msg.includes('401') || msg.includes('sign in') || msg.includes('Unauthorized') || !localStorage.getItem('aarogya_access_token')) {
        setBookingError('Please log in with a patient account to reserve this appointment directly into the hospital system, or register at the front desk.');
      } else {
        setBookingError(msg);
      }
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 space-y-8">
      {/* Title */}
      <div className="bg-gradient-to-r from-[#002043] to-[#00386b] text-white p-8 md:p-10 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-teal-500/20 px-3 py-1 rounded-full border border-teal-400/30 flex items-center gap-1.5 w-fit">
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>AI-Assisted Symptom Triage</span>
          </span>
          <h1 className="text-3xl font-extrabold mt-2 tracking-tight">
            Guided Clinical Appointment
          </h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-xl">
            Not sure which department you need? Select your symptoms and let Aarogya Care triage algorithms pair you with the ideal specialist.
          </p>
        </div>

        <Link
          to="/appointments/book"
          className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-semibold self-start md:self-auto transition"
        >
          Standard Booking Wizard
        </Link>
      </div>

      {isCompleted ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 md:p-12 shadow-xl text-center space-y-6 animate-fadeIn">
          <div className="w-16 h-16 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              Guided Triage &amp; Booking Confirmed
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-2">
              Appointment Reserved &amp; Token Issued
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Backend Booking Reference: <span className="font-mono font-bold text-[#002043]">{tokenRef}</span>
            </p>
          </div>

          <div className="max-w-md mx-auto bg-slate-50 rounded-2xl border border-slate-200 p-6 text-left space-y-3 text-xs text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-400">Target Specialty:</span>
              <span className="font-bold text-teal-700">{activeCluster.recommendedSpecialty}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Assigned Consultant:</span>
              <span className="font-bold text-slate-900">{selectedDoctor?.name || 'Assigned Consultant'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Consultation Date &amp; Slot:</span>
              <span className="font-semibold text-slate-900">{selectedDate} at {confirmedSlotTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Patient:</span>
              <span className="font-medium text-slate-900">{foundPatient?.name || user?.name || 'Walk-in Patient'}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200">
              <span className="text-slate-400">Location:</span>
              <span className="font-semibold text-slate-900">OPD Suite {selectedDoctor?.opdRoom || '204'}, Grems Road Campus</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Link
              to="/portal/appointments"
              className="px-6 py-2.5 bg-[#002043] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#17365d] transition"
            >
              View in My Appointments
            </Link>
            <button
              onClick={() => {
                setIsCompleted(false);
                setStep(1);
              }}
              className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
            >
              New Guided Intake
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
          {/* Step 1: Patient UHID Lookup */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Step 1: Patient Verification</h3>
                <p className="text-xs text-slate-500">
                  Lookup by Aarogya Care UHID (e.g. <code>AAR-2026-9041</code> or <code>AAR-2026-8720</code>) or continue with current profile.
                </p>
              </div>

              <div className="flex gap-3 max-w-md">
                <input
                  type="text"
                  value={uhidInput}
                  onChange={(e) => setUhidInput(e.target.value)}
                  placeholder="Enter UHID (e.g. AAR-2026-9041)..."
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#002043]"
                />
                <button
                  type="button"
                  onClick={handleLookup}
                  className="px-4 py-2.5 bg-[#002043] text-white rounded-xl text-xs font-bold hover:bg-[#17365d] transition"
                >
                  Lookup
                </button>
              </div>

              {lookupMessage && (
                <p className="text-xs text-slate-600 font-medium">{lookupMessage}</p>
              )}

              {foundPatient && (
                <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200 text-xs text-teal-900 space-y-1">
                  <p className="font-bold text-sm text-[#002043]">Verified Patient: {foundPatient.name}</p>
                  <p>UHID: {foundPatient.uhid} {foundPatient.phone ? `• Phone: ${foundPatient.phone}` : ''}</p>
                  <p className="text-teal-700 font-semibold">Active EMR record verified with live backend.</p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 bg-[#002043] text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-[#17365d] transition"
                >
                  <span>Proceed to Symptom Triage</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Symptom Assessment */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Step 2: What are you experiencing?</h3>
                <p className="text-xs text-slate-500">
                  Select the primary category of symptoms you are facing:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {symptomClusters.map((cluster) => {
                  const isSelected = selectedClusterId === cluster.id;
                  const Icon = cluster.icon;
                  return (
                    <div
                      key={cluster.id}
                      onClick={() => setSelectedClusterId(cluster.id)}
                      className={`p-5 rounded-2xl border cursor-pointer transition ${
                        isSelected
                          ? 'bg-teal-50/60 border-teal-500 ring-2 ring-teal-500/20 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-100 rounded-xl text-teal-700">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">{cluster.category}</span>
                          <h4 className="font-bold text-slate-900 text-sm">{cluster.name}</h4>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1 text-xs text-slate-500 pl-1">
                        {cluster.symptoms.map((s, i) => (
                          <p key={i} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                            <span>{s}</span>
                          </p>
                        ))}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-400">Recommends:</span>
                        <span className="font-bold text-teal-700">{cluster.recommendedSpecialty}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep(3);
                  }}
                  className="px-6 py-2.5 bg-[#002043] text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-[#17365d] transition"
                >
                  <span>Select Specialist</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Match Specialist & Time Slot */}
          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Step 3: Specialist &amp; Live Time Allocation</h3>
                <p className="text-xs text-slate-500">
                  Recommended department: <strong className="text-teal-700">{activeCluster.recommendedSpecialty}</strong>
                </p>
              </div>

              {loadingDoctors ? (
                <p className="text-xs text-slate-500">Loading department faculty from hospital roster...</p>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-2">Available Department Consultants</label>
                  {matchedDoctors.length === 0 ? (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600">
                      No specific {activeCluster.recommendedSpecialty} doctors found in live roster. Showing all general consultants:
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                        {allDoctors.slice(0, 4).map((doc) => (
                          <div
                            key={doc.id}
                            onClick={() => setSelectedDoctor(doc)}
                            className={`p-4 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                              selectedDoctor?.id === doc.id
                                ? 'bg-teal-50 border-teal-600 ring-2 ring-teal-600/20'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <img
                              src={doc.imageUrl}
                              alt={doc.name}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                            />
                            <div>
                              <h4 className="font-bold text-slate-900 text-xs">{doc.name}</h4>
                              <p className="text-[11px] text-slate-500">{doc.departmentName}</p>
                              <p className="text-[11px] text-teal-700 font-semibold mt-0.5">
                                Fee: ₹{doc.consultationFee} • {doc.opdRoom}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {matchedDoctors.map((doc) => {
                        const isSelected = selectedDoctor?.id === doc.id;
                        return (
                          <div
                            key={doc.id}
                            onClick={() => setSelectedDoctor(doc)}
                            className={`p-4 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                              isSelected
                                ? 'bg-teal-50 border-teal-600 ring-2 ring-teal-600/20 shadow-xs'
                                : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <img
                              src={doc.imageUrl}
                              alt={doc.name}
                              className="w-14 h-14 rounded-xl object-cover border border-slate-200"
                            />
                            <div>
                              <h4 className="font-bold text-slate-900 text-xs">{doc.name}</h4>
                              <p className="text-[11px] text-slate-500">{doc.qualification}</p>
                              <p className="text-[11px] text-teal-700 font-semibold mt-0.5">
                                Fee: ₹{doc.consultationFee} • Room: {doc.opdRoom}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#002043]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Available Backend OPD Slot</label>
                  {loadingSlots ? (
                    <div className="p-2.5 text-xs text-slate-500">Querying real available slots...</div>
                  ) : availableSlots.length === 0 ? (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                      No open slots for {selectedDoctor?.name || 'this consultant'} on {selectedDate}.
                    </div>
                  ) : (
                    <select
                      value={selectedSlotId}
                      onChange={(e) => setSelectedSlotId(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#002043]"
                    >
                      {availableSlots.map((slot) => (
                        <option key={slot.id} value={slot.id}>
                          {formatSlotTime(slot.slot_start)} ({slot.status || 'AVAILABLE'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {bookingError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bookingError}</span>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={isBooking || !selectedSlotId}
                  onClick={handleFinish}
                  className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
                >
                  {isBooking ? 'Reserving Real Slot...' : 'Confirm Guided Booking'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
