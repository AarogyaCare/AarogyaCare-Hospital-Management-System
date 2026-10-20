import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, Search, Star, MapPin,
  CheckCircle2, ArrowRight, Video, User, ShieldCheck, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { HospitalDoctor, mapDoctorResponse, deduplicateDoctors } from '../services/doctorMapping';

const localToday = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
};

export default function Booking() {
  const [doctorList, setDoctorList] = useState<HospitalDoctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<HospitalDoctor | null>(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [selectedDate, setSelectedDate] = useState(localToday());
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [consultMode, setConsultMode] = useState<'In-Person OPD' | 'Video Teleconsult'>('In-Person OPD');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    api.doctors()
      .then((res) => {
        if (!active) return;
        const docs = deduplicateDoctors(res.items.map(mapDoctorResponse));
        setDoctorList(docs);
        if (docs.length > 0) {
          setSelectedDoctor(docs[0]);
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load doctors');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedDoctor) return;
    api.slots(selectedDoctor.id, selectedDate)
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
  }, [selectedDoctor, selectedDate]);

  const filteredDoctors = doctorList.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.departmentName.toLowerCase().includes(search.toLowerCase()) ||
      doc.specializations.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    const matchesSpecialty =
      selectedSpecialty === 'All' ||
      doc.departmentName.toLowerCase().includes(selectedSpecialty.toLowerCase()) ||
      doc.specializations.some((s) => s.toLowerCase().includes(selectedSpecialty.toLowerCase()));
    return matchesSearch && matchesSpecialty;
  });

  const handleProceed = () => {
    if (!selectedDoctor) return;
    navigate(
      `/appointments/book?doctor=${selectedDoctor.id}&date=${selectedDate}&slot=${encodeURIComponent(
        selectedSlot
      )}&mode=${encodeURIComponent(consultMode)}`
    );
  };

  const specialties = ['All', ...new Set(doctorList.map((d) => d.departmentName))];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-8">
      {/* Title */}
      <div className="bg-gradient-to-r from-[#002043] to-[#17365d] text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-teal-500/20 px-3 py-1 rounded-full border border-teal-400/30">
            Aarogya Care Central OPD
          </span>
          <h1 className="text-3xl font-extrabold mt-2 tracking-tight">
            Doctor Directory &amp; Live Booking
          </h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-xl">
            Select an attending specialist to inspect real-time schedule availability and reserve temporary slot locks.
          </p>
        </div>
        <Link
          to="/appointments/guided"
          className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-semibold self-start md:self-auto transition"
        >
          Need Guided Triage?
        </Link>
      </div>

      {isLoading && <p className="text-sm text-slate-600 text-center py-10">Loading real-time faculty roster…</p>}
      {error && <p className="text-sm text-rose-600 text-center py-4">{error}</p>}

      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Doctor Selection List (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Search & Specialty Filter */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search doctor or specialty..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#002043] focus:outline-none"
                />
              </div>

              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
              >
                {specialties.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* List of doctors */}
            {isLoading ? (
              <div className="p-10 text-center text-slate-500 text-xs bg-slate-50 rounded-2xl border border-slate-200">
                <RefreshCw className="w-5 h-5 text-teal-600 animate-spin mx-auto mb-2" />
                <span>Loading department faculty roster from central hospital database...</span>
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-xs bg-slate-50 rounded-2xl border border-slate-200">
                <p className="font-semibold text-slate-700">No consultants found for this department filter.</p>
                <p className="mt-1">Try selecting "All" or clearing your search term to see all available faculty.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDoctors.map((doc) => {
                const isSelected = selectedDoctor?.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoctor(doc)}
                    className={`p-5 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-teal-50/50 border-[#178B8B] shadow-md ring-2 ring-[#178B8B]/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={doc.imageUrl}
                        alt={doc.name}
                        className="w-16 h-16 rounded-2xl object-cover border border-slate-200"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 uppercase">
                            {doc.departmentName || doc.specialty}
                          </span>
                          <span className="text-xs text-amber-500 font-semibold flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-current" />
                            {doc.rating}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm mt-1">{doc.name}</h3>
                        <p className="text-xs text-slate-500">{doc.qualification}</p>
                        <p className="text-xs text-slate-600 font-medium mt-1">
                          {doc.opdRoom} • <span className="text-[#002043] font-bold">₹{doc.consultationFee}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-block ${
                          isSelected
                            ? 'bg-[#002043] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>

          {/* Right Column: Slot Selection and Instant Summary (5 cols) */}
          <div className="lg:col-span-5 sticky top-24 bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-lg space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                Direct OPD Reserve
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-2">Appointment Details</h2>
              <p className="text-xs text-slate-500">Pick consultation mode, preferred date, and verified open slot.</p>
            </div>

            {selectedDoctor && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <img
                  src={selectedDoctor.imageUrl}
                  alt={selectedDoctor.name}
                  className="w-12 h-12 rounded-xl object-cover"
                />
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">{selectedDoctor.name}</h4>
                  <p className="text-[11px] text-teal-700 font-medium">{selectedDoctor.departmentName}</p>
                  <p className="text-[11px] text-slate-500">{selectedDoctor.opdRoom}</p>
                </div>
              </div>
            )}

            {/* Mode selection */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2">Mode of Consultation</label>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setConsultMode('In-Person OPD')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2 transition ${
                    consultMode === 'In-Person OPD'
                      ? 'border-[#178B8B] bg-teal-50/60 text-[#002043] font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <User className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>In-Person OPD</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConsultMode('Video Teleconsult')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2 transition ${
                    consultMode === 'Video Teleconsult'
                      ? 'border-[#178B8B] bg-teal-50/60 text-[#002043] font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Video className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>Teleconsult</span>
                </button>
              </div>
            </div>

            {/* Date selection */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2">Consultation Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#002043]"
              />
            </div>

            {/* Slot selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700">Available Time Slots</label>
                <span className="text-[10px] text-teal-700 font-bold">Live Synchronized</span>
              </div>

              {availableSlots.length === 0 ? (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-xs">
                  No slots available for this doctor on {selectedDate}.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {availableSlots.map((slot) => {
                    const time = slot.slot_start;
                    const isSelected = selectedSlot === time;
                    return (
                      <button
                        key={slot.id || slot.slot_id}
                        type="button"
                        onClick={() => setSelectedSlot(time)}
                        className={`py-2 px-3 rounded-xl text-xs text-center font-medium transition ${
                          isSelected
                            ? 'bg-[#002043] text-white font-bold shadow-xs'
                            : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={handleProceed}
              disabled={!selectedSlot || !selectedDoctor}
              className="w-full py-3.5 bg-[#002043] hover:bg-[#17365d] disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              <span>Continue to Intake Wizard</span>
              <ArrowRight className="w-4 h-4 text-teal-300" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
