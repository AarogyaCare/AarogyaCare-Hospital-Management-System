import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star, Calendar, Clock, MapPin, Award,
  GraduationCap, Globe, CheckCircle2, ShieldCheck, ArrowLeft, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { HospitalDoctor, mapDoctorResponse } from '../services/doctorMapping';

const localToday = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
};

export default function DoctorProfile() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState<HospitalDoctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedDate, setSelectedDate] = useState(localToday());
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [consultMode, setConsultMode] = useState<'In-Person OPD' | 'Video Teleconsult'>('In-Person OPD');

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    api.doctors()
      .then((response) => {
        if (!active) return;
        const allDocs = response.items.map(mapDoctorResponse);
        const found = allDocs.find((d) => d.id === doctorId) || allDocs[0];
        setDoctor(found || null);
      })
      .catch((err) => {
        if (active) setLoadError(err instanceof Error ? err.message : 'Failed to load doctor profile');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, [doctorId]);

  useEffect(() => {
    if (!doctor) return;
    api.slots(doctor.id, selectedDate)
      .then((slots) => {
        const available = slots.filter((s: any) => String(s.status).toUpperCase() === 'AVAILABLE');
        setAvailableSlots(available);
        if (available.length > 0) {
          setSelectedSlot(available[0].slot_start);
        } else {
          setSelectedSlot('');
        }
      })
      .catch(() => setAvailableSlots([]));
  }, [doctor, selectedDate]);

  const handleBookNow = () => {
    if (!doctor) return;
    navigate(`/appointments/book?doctor=${doctor.id}&date=${selectedDate}&slot=${encodeURIComponent(selectedSlot)}&mode=${encodeURIComponent(consultMode)}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 text-center text-slate-600 text-sm">
        Loading doctor profile from hospital database…
      </div>
    );
  }

  if (loadError || !doctor) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 text-center space-y-4">
        <p className="text-rose-700 font-semibold">{loadError || 'Doctor not found.'}</p>
        <Link to="/doctors" className="px-4 py-2 bg-[#002043] text-white rounded-xl text-xs font-bold inline-block">
          Return to Doctors Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-8">
      {/* Back button */}
      <Link
        to="/doctors"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#002043] transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Doctor Directory</span>
      </Link>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-10 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Image & Quick Details */}
        <div className="lg:col-span-4 flex flex-col items-center text-center p-6 bg-slate-50/80 rounded-2xl border border-slate-100">
          <img
            src={doctor.imageUrl}
            alt={doctor.name}
            className="w-36 h-36 rounded-3xl object-cover border-4 border-white shadow-md mb-4"
          />
          <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200 uppercase tracking-wide">
            {doctor.departmentName || doctor.specialty}
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-2">{doctor.name}</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">{doctor.title}</p>
          <p className="text-xs text-slate-600 font-semibold mt-1">{doctor.qualification}</p>

          <div className="flex items-center gap-1.5 mt-3 text-sm text-amber-500 font-bold">
            <Star className="w-4 h-4 fill-current" />
            <span>{doctor.rating}</span>
            <span className="text-slate-400 font-normal text-xs">({doctor.reviewCount} verified reviews)</span>
          </div>

          <div className="w-full mt-6 pt-6 border-t border-slate-200 space-y-2 text-xs text-left text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-400">Experience:</span>
              <span className="font-bold text-slate-900">{doctor.experienceYears}+ Years</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Clinic Suite:</span>
              <span className="font-semibold text-slate-900">{doctor.opdRoom}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Languages:</span>
              <span className="font-medium text-slate-800">{doctor.languages.join(', ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Consultation Fee:</span>
              <span className="font-extrabold text-[#002043]">₹{doctor.consultationFee}</span>
            </div>
          </div>
        </div>

        {/* Middle Column: Biography, Education & Accolades */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">About the Specialist</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {doctor.bio}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
              <GraduationCap className="w-4 h-4 text-teal-600" />
              <span>Medical Education &amp; Fellowships</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-600">
              {doctor.education.map((edu, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
                  <span>{edu}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Honours &amp; Clinical Recognitions</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-600">
              {doctor.awards.map((award, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Award className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span>{award}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-100 flex items-center gap-3 text-xs text-teal-900">
            <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0" />
            <span>
              Verified Aarogya Care Grems Road Faculty. Clinical records and slot locks synchronized with backend.
            </span>
          </div>
        </div>

        {/* Right Column: Direct Slot Booking Widget */}
        <div className="lg:col-span-3 bg-gradient-to-b from-[#002043] to-[#17365d] text-white p-6 rounded-3xl shadow-lg space-y-5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300">Fast Appointment</span>
            <h3 className="text-lg font-bold mt-1">Book Consultation</h3>
            <p className="text-xs text-slate-300 mt-1">Direct backend calendar lock with instant SMS confirmation.</p>
          </div>

          {/* Consultation Mode */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Mode of Consultation</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setConsultMode('In-Person OPD')}
                className={`py-2 px-2 rounded-xl text-center font-medium transition ${
                  consultMode === 'In-Person OPD'
                    ? 'bg-teal-500 text-white font-bold'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                In-Person OPD
              </button>
              <button
                type="button"
                onClick={() => setConsultMode('Video Teleconsult')}
                className={`py-2 px-2 rounded-xl text-center font-medium transition ${
                  consultMode === 'Video Teleconsult'
                    ? 'bg-teal-500 text-white font-bold'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                Video Teleconsult
              </button>
            </div>
          </div>

          {/* Date Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          {/* Time Slot Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Available Slots</label>
            {availableSlots.length === 0 ? (
              <p className="text-xs text-amber-300 bg-amber-500/20 p-2.5 rounded-xl border border-amber-400/30">
                No open slots for this date. Please pick another day.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {availableSlots.map((slot) => {
                  const time = slot.slot_start;
                  return (
                    <button
                      key={slot.id || slot.slot_id}
                      type="button"
                      onClick={() => setSelectedSlot(time)}
                      className={`py-2 px-2 rounded-xl text-xs text-center font-medium transition ${
                        selectedSlot === time
                          ? 'bg-white text-[#002043] font-bold shadow-md'
                          : 'bg-white/10 text-slate-300 hover:bg-white/15'
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-xs text-slate-300 mb-4">
              <span>OPD Consultation:</span>
              <span className="text-base font-bold text-white">₹{doctor.consultationFee}</span>
            </div>

            <button
              onClick={handleBookNow}
              disabled={!selectedSlot}
              className="w-full py-3 bg-teal-400 hover:bg-teal-300 disabled:opacity-50 text-[#002043] font-bold text-xs rounded-xl shadow-md transition"
            >
              Confirm &amp; Enter Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
