import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Star, Calendar, ArrowRight, Filter } from 'lucide-react';
import { api } from '../services/api';
import { HospitalDoctor, mapDoctorResponse, deduplicateDoctors } from '../services/doctorMapping';

export default function Doctors() {
  const [searchParams] = useSearchParams();
  const initialSpecialty = searchParams.get('specialty') || 'All';

  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState(initialSpecialty);
  const [doctorList, setDoctorList] = useState<HospitalDoctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  useEffect(() => {
    let active = true;
    api.doctors()
      .then((response) => { if (active) setDoctorList(deduplicateDoctors(response.items.map(mapDoctorResponse))); })
      .catch((error) => { if (active) setLoadError(error instanceof Error ? error.message : 'Could not load doctors.'); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = doctorList.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.departmentName.toLowerCase().includes(search.toLowerCase()) ||
      doc.specializations.some((specialty) => specialty.toLowerCase().includes(search.toLowerCase())) ||
      doc.qualification.toLowerCase().includes(search.toLowerCase());

    const matchesSpecialty =
      selectedSpecialty === 'All' ||
      doc.departmentName.toLowerCase().includes(selectedSpecialty.toLowerCase()) ||
      doc.specializations.some((specialty) => specialty.toLowerCase().includes(selectedSpecialty.toLowerCase()));

    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#002043] to-[#17365d] text-white p-8 md:p-10 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-teal-500/20 px-3 py-1 rounded-full border border-teal-400/30">
            Medical Faculty Directory
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold mt-2 tracking-tight">
            Consult Our Senior Specialists
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Choose from leading department directors, robotic surgeons, and interventional consultants at Medora Clinical Campus.
          </p>
        </div>

        <Link
          to="/doctors/booking"
          className="px-5 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold text-xs rounded-xl shadow-md transition self-start md:self-auto flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          <span>Interactive Booking View</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by doctor name, credential, or specialty..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#002043] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-600 font-medium">Department:</span>
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#002043]"
          >
            <option value="All">All Clinical Specialties</option>
            {[...new Set(doctorList.map((doctor) => doctor.departmentName))].map((specialty) => (
              <option key={specialty} value={specialty}>{specialty}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Doctors Grid */}
      {isLoading && <p className="text-sm text-slate-600" role="status">Loading doctors from the hospital service…</p>}
      {loadError && <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">Could not load doctors: {loadError}</p>}
      {!isLoading && !loadError && filtered.length === 0 && <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">No doctors match this search.</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((doc) => (
          <div
            key={doc.id}
            className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg hover:border-teal-400 transition flex flex-col justify-between"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div aria-hidden="true" className="w-20 h-20 rounded-2xl border border-slate-200 bg-teal-50 text-teal-800 flex items-center justify-center text-xl font-bold">{doc.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('')}</div>
                <div className="flex-1">
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 uppercase tracking-wide">
                    {doc.departmentName}
                  </span>
                  <h3 className="font-bold text-slate-900 text-lg mt-1">{doc.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{doc.qualification}</p>
                  {doc.rating !== null && <div className="flex items-center gap-1.5 mt-1 text-xs text-amber-500 font-semibold"><Star className="w-3.5 h-3.5 fill-current" /><span>{doc.rating}</span></div>}
                </div>
              </div>

              <div className="mt-5 space-y-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Clinical Role:</span>
                  <span className="font-semibold text-slate-800 text-right truncate max-w-[180px]">{doc.specializations.join(', ') || 'Not specified'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Experience:</span>
                  <span className="font-semibold text-slate-800">{doc.experienceYears === null ? 'Not listed' : `${doc.experienceYears} Years`}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Room / Suite:</span>
                  <span className="font-medium text-slate-800">{doc.roomNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Languages:</span>
                  <span className="font-medium text-slate-700">Not listed</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span className="text-slate-400">Schedule:</span>
                  <span className="font-semibold text-teal-700">Check available slots</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 mt-4 leading-relaxed line-clamp-2">Doctor record retrieved from the hospital service.</p>
            </div>

            <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">OPD Fee</span>
                <span className="text-base font-extrabold text-[#002043]">Not listed</span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to={`/doctors/${doc.id}`}
                  className="px-3 py-2 border border-slate-300 text-slate-700 hover:text-[#002043] text-xs font-semibold rounded-xl hover:bg-slate-100 transition"
                >
                  View Profile
                </Link>
                <Link
                  to={`/appointments/book?doctor=${doc.id}`}
                  className="px-3.5 py-2 bg-[#002043] hover:bg-[#17365d] text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  Book Slot
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
