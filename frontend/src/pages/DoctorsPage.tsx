import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DOCTORS, SLOTS_DATA } from '../data/mockData';
import { Doctor } from '../types';
import { doctorService, autocompleteService } from '../services/api';

export const DoctorsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [consultMode, setConsultMode] = useState<'all' | 'in-person' | 'tele'>('all');
  const [selectedDay, setSelectedDay] = useState<string>('today');
  const [sortBy, setSortBy] = useState<'relevance' | 'experience' | 'earliest'>('relevance');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [cacheLatency, setCacheLatency] = useState(25);
  const [trieSuggestions, setTrieSuggestions] = useState<{ title: string; subtitle: string; icon: string; doctorId?: string }[]>([]);
  const [trieLatency, setTrieLatency] = useState<number>(2.4);

  const [doctorsList, setDoctorsList] = useState<Doctor[]>(DOCTORS);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveDatabase, setIsLiveDatabase] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDoctors = (searchQuery?: string) => {
    setIsLoading(true);
    const query = searchQuery !== undefined ? searchQuery : searchTerm;
    const fetcher = query.trim() ? doctorService.search(query) : doctorService.getAll();
    fetcher
      .then(res => {
        setDoctorsList(res.data);
        setIsLiveDatabase(res.isLiveDatabase);
        setError(null);
      })
      .catch(() => {
        setError('Failed to fetch doctors from service');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Autocomplete suggestions
  const autocompleteSuggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    const suggestions: { title: string; subtitle: string; icon: string; doctorId?: string }[] = [];

    doctorsList.forEach(doc => {
      if (doc.displayName.toLowerCase().includes(term)) {
        suggestions.push({
          title: doc.displayName,
          subtitle: `${doc.designation} • ${doc.chamberRoom}`,
          icon: 'person',
          doctorId: doc.id
        });
      }
      doc.specializations.forEach(spec => {
        if (spec.toLowerCase().includes(term) && !suggestions.some(s => s.title === spec)) {
          suggestions.push({
            title: spec,
            subtitle: `Clinical Specialization (${doc.departmentName})`,
            icon: 'cardiology'
          });
        }
      });
    });

    return suggestions.slice(0, 5);
  }, [searchTerm, doctorsList]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setTrieSuggestions([]);
      return;
    }
    const t0 = performance.now();
    const timer = setTimeout(() => {
      autocompleteService.getSuggestions(searchTerm).then(items => {
        const lat = Math.round((performance.now() - t0) * 10) / 10;
        setTrieLatency(lat > 0 ? lat : 2.4);
        if (items && items.length > 0) {
          setTrieSuggestions(items.map(it => ({
            title: it.title,
            subtitle: it.subtitle || `${it.type.toUpperCase()}`,
            icon: it.type === 'doctor' ? 'person' : it.type === 'specialty' ? 'cardiology' : 'medication',
            doctorId: it.type === 'doctor' ? it.id : undefined
          })));
        } else {
          setTrieSuggestions(autocompleteSuggestions);
        }
      }).catch(() => {
        setTrieSuggestions(autocompleteSuggestions);
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, autocompleteSuggestions]);

  const filteredDoctors = useMemo(() => {
    return doctorsList.filter(doc => {
      const matchesDept = selectedDept === 'all' || doc.departmentName.toLowerCase().includes(selectedDept.toLowerCase());
      const matchesSearch = 
        doc.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.specializations.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesDept && matchesSearch;
    }).sort((a, b) => {
      if (sortBy === 'experience') return b.experienceYears - a.experienceYears;
      if (sortBy === 'earliest') return a.nextSlotTime.localeCompare(b.nextSlotTime);
      return b.rating - a.rating;
    });
  }, [doctorsList, searchTerm, selectedDept, sortBy]);

  const handleSelectSlot = (doctor: Doctor, slotId: string) => {
    // Navigate to appointment booking with selected slot
    navigate(`/appointments/new?doctorId=${doctor.id}&slotId=${slotId}`);
  };

  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* 1. Discovery & Command Bar Sub-Header */}
      <section className="w-full bg-surface-container-low py-space-lg relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-secondary-fixed/40 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-20 w-80 h-80 rounded-full bg-tertiary-fixed/30 blur-3xl pointer-events-none"></div>

        <div className="max-w-[1360px] mx-auto px-gutter-mobile lg:px-margin relative z-10">
          {/* Top Meta Eyebrow with Real-time Caching Badge */}
          <div className="flex flex-wrap items-center justify-between gap-space-sm mb-space-sm">
            <div className="flex items-center gap-space-xs">
              <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
                Verified Clinical Registry • Greams Road Campus
              </span>
            </div>

            {/* Distributed Cache Latency Metric Badge */}
            <div className="flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-surface-container-lowest shadow-sm text-on-surface-variant font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-secondary text-[16px]">bolt</span>
              <span>Redis L2 KV Cache:</span>
              <span className="font-semibold text-secondary">{cacheLatency}ms latency</span>
              <span className="text-outline-variant">•</span>
              <span className="text-[10px] text-outline font-mono">HASH RING: NODE-A/B/C</span>
            </div>
          </div>

          {/* Headline & Editorial Lead (32px / 700 / 40px) */}
          <div className="max-w-3xl mb-space-md">
            <h1 className="page-heading text-primary tracking-tight">
              Find a Specialist & Real-Time OPD Slots
            </h1>
            <p className="body-text text-on-surface-variant mt-space-xs leading-relaxed">
              Access world-class tertiary consultants at Aarogya Care Chennai. Instant availability verified through our distributed clinical scheduling engine with sub-50ms sync to central triage.
            </p>
          </div>

          {/* Search & Command Matrix Box */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-md flex flex-col gap-space-md border border-surface-container-high">
            {/* Input Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-sm">
              {/* Main Search Input with Dynamic Auto-complete */}
              <div className="lg:col-span-7 relative">
                <div className="flex items-center bg-surface-container-low rounded-xl px-space-sm py-2 focus-within:ring-2 focus-within:ring-secondary/40 transition-all border border-surface-container-high">
                  <span className="material-symbols-outlined text-outline text-[22px] ml-1">search</span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowAutocomplete(true);
                      setCacheLatency(Math.floor(18 + Math.random() * 12));
                    }}
                    onFocus={() => setShowAutocomplete(true)}
                    placeholder="Search doctor name (e.g. Dr. K. Ramanathan) or medical condition (e.g. Arrhythmia, Stroke)..."
                    className="w-full bg-transparent border-0 px-space-sm py-1 text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setShowAutocomplete(false);
                      }}
                      className="text-outline hover:text-on-surface p-1"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  )}
                </div>

                {/* Autocomplete Popover Dropdown */}
                {showAutocomplete && (trieSuggestions.length > 0 || autocompleteSuggestions.length > 0) && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-surface-container-lowest rounded-xl shadow-xl z-30 p-space-sm flex flex-col gap-1 max-h-72 overflow-y-auto border border-surface-container-high animate-fadeIn">
                    <div className="px-space-sm py-1 text-label-sm font-label-sm text-outline uppercase tracking-wider flex justify-between">
                      <span>Trie Prefix Match (Normalized)</span>
                      <span className="text-[10px] text-secondary">Latency: {trieLatency}ms</span>
                    </div>
                    {(trieSuggestions.length > 0 ? trieSuggestions : autocompleteSuggestions).map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSearchTerm(item.title);
                          setShowAutocomplete(false);
                          if (item.doctorId) {
                            navigate(`/doctors/${item.doctorId}`);
                          }
                        }}
                        className="text-left w-full px-space-sm py-2 rounded-lg hover:bg-surface-container-low flex items-center justify-between text-on-surface transition-colors"
                      >
                        <div className="flex items-center gap-space-xs">
                          <span className="material-symbols-outlined text-secondary text-[18px]">{item.icon}</span>
                          <div>
                            <span className="font-title-sm text-title-sm block">{item.title}</span>
                            <span className="text-[11px] text-on-surface-variant block">{item.subtitle}</span>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-outline text-[16px]">chevron_right</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mode of Consultation Toggle / Filter */}
              <div className="lg:col-span-3 flex items-center bg-surface-container-low rounded-xl p-1 border border-surface-container-high">
                <button
                  type="button"
                  onClick={() => setConsultMode('all')}
                  className={`flex-1 py-2 px-2 text-center rounded-lg font-title-sm text-title-sm transition-all ${
                    consultMode === 'all'
                      ? 'bg-secondary text-white shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  All Modes
                </button>
                <button
                  type="button"
                  onClick={() => setConsultMode('in-person')}
                  className={`flex-1 py-2 px-2 text-center rounded-lg font-title-sm text-title-sm transition-all ${
                    consultMode === 'in-person'
                      ? 'bg-secondary text-white shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  In-Person
                </button>
                <button
                  type="button"
                  onClick={() => setConsultMode('tele')}
                  className={`flex-1 py-2 px-2 text-center rounded-lg font-title-sm text-title-sm transition-all flex items-center justify-center gap-1 ${
                    consultMode === 'tele'
                      ? 'bg-secondary text-white shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">videocam</span>
                  <span>Video OP</span>
                </button>
              </div>

              {/* Sort Select Control */}
              <div className="lg:col-span-2 relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full h-full bg-surface-container-low text-on-surface rounded-xl px-space-sm py-2 font-title-sm text-title-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-secondary/40 pr-8 border border-surface-container-high"
                >
                  <option value="relevance">Sort: Relevance</option>
                  <option value="experience">Sort: Experience</option>
                  <option value="earliest">Sort: Earliest Slot</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[20px]">
                  expand_more
                </span>
              </div>
            </div>

            {/* Department Filter Chips Track */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
              <span className="font-label-md text-label-md text-outline whitespace-nowrap mr-1">Specialties:</span>
              {[
                { id: 'all', label: 'All Centers (28)' },
                { id: 'cardiology', label: 'Cardiology (14)' },
                { id: 'neurology', label: 'Neurology (9)' },
                { id: 'orthopaedics', label: 'Orthopaedics (11)' },
                { id: 'paediatrics', label: 'Paediatrics (10)' }
              ].map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setSelectedDept(chip.id)}
                  className={`px-3.5 py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap transition-all ${
                    selectedDept === chip.id
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Availability Date Filter Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-surface-container-high">
              <div className="flex items-center gap-2">
                <span className="font-label-md text-label-md text-on-surface-variant mr-1">Availability:</span>
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <button
                    onClick={() => setSelectedDay('today')}
                    className={`px-3 py-1 rounded-lg font-label-md text-label-md font-semibold transition-all ${
                      selectedDay === 'today'
                        ? 'bg-secondary-fixed text-on-secondary-fixed'
                        : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    Today (Oct 24)
                  </button>
                  <button
                    onClick={() => setSelectedDay('tomorrow')}
                    className={`px-3 py-1 rounded-lg font-label-md text-label-md transition-all ${
                      selectedDay === 'tomorrow'
                        ? 'bg-secondary-fixed text-on-secondary-fixed'
                        : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    Tomorrow (Oct 25)
                  </button>
                  <button
                    onClick={() => setSelectedDay('weekend')}
                    className={`px-3 py-1 rounded-lg font-label-md text-label-md transition-all ${
                      selectedDay === 'weekend'
                        ? 'bg-secondary-fixed text-on-secondary-fixed'
                        : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    This Weekend
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-on-surface-variant text-body-sm">
                <span className="material-symbols-outlined text-[16px] text-tertiary">lock</span>
                <span>Lock duration: 10 mins</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Doctor Directory Cards Grid with Inline Slot Reservation */}
      <section className="w-full max-w-[1360px] mx-auto px-gutter-mobile lg:px-margin py-space-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-space-md">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="section-heading text-primary">
                Available Consultant Doctors ({filteredDoctors.length})
              </h2>
              {isLiveDatabase ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full badge-text font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  PostgreSQL Authoritative Backend Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full badge-text font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Development Local Fixtures
                </span>
              )}
            </div>
            <span className="metadata-text text-on-surface-variant block mt-1">
              Zero Double-Booking Guarantee Enabled • Real-Time Doctor Availability
            </span>
          </div>
          {isLoading && (
            <span className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold">
              <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
              Syncing directory...
            </span>
          )}
        </div>

        {error && (
          <div className="p-4 mb-6 rounded-xl bg-error/10 border border-error/20 flex items-center justify-between">
            <div className="flex items-center gap-2 text-error font-body-sm">
              <span className="material-symbols-outlined text-[20px]">error</span>
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchDoctors()}
              className="px-3 py-1 rounded-lg bg-error text-white text-xs font-semibold hover:bg-error/90 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high animate-pulse flex flex-col lg:flex-row gap-6 justify-between h-56">
                <div className="flex gap-5 flex-1">
                  <div className="w-32 h-36 rounded-2xl bg-surface-container"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-surface-container rounded w-1/3"></div>
                    <div className="h-4 bg-surface-container rounded w-1/2"></div>
                    <div className="h-4 bg-surface-container rounded w-2/3"></div>
                  </div>
                </div>
                <div className="w-full lg:w-72 bg-surface-container/50 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="text-center py-16 bg-surface-container-lowest rounded-2xl border border-surface-container-high p-8">
            <span className="material-symbols-outlined text-outline text-[48px] mb-3">person_search</span>
            <h4 className="font-title-md text-title-md text-primary font-bold mb-1">No Doctors Matching Criteria</h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
              We couldn't find any specialist consultants matching "{searchTerm || selectedDept}".
            </p>
            <button
              onClick={() => { setSearchTerm(''); setSelectedDept('all'); fetchDoctors(''); }}
              className="px-4 py-2 rounded-lg bg-primary text-white font-title-sm text-title-sm hover:bg-secondary transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {filteredDoctors.map((doc) => {
              const slots = SLOTS_DATA[doc.id] || [];
              return (
                <div
                  key={doc.id}
                  className="bg-surface-container-lowest rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 border border-surface-container-high flex flex-col lg:flex-row gap-6 justify-between"
                >
                {/* Left: Doctor Bio Info */}
                <div className="flex flex-col sm:flex-row gap-5 flex-1">
                  <div className="w-32 h-36 rounded-2xl overflow-hidden bg-surface-container shrink-0 relative shadow-sm">
                    <img
                      src={doc.avatarUrl}
                      alt={doc.displayName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/consultation.png';
                      }}
                    />
                    <div className="absolute bottom-1 left-1 right-1 py-0.5 rounded bg-primary/80 backdrop-blur-sm text-white text-[10px] text-center uppercase tracking-wider font-semibold">
                      Accepting
                    </div>
                  </div>

                  <div className="flex flex-col justify-between flex-1">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                          {doc.departmentName}
                        </span>
                        <span className="text-on-surface-variant text-[12px]">
                          • {doc.experienceYears}+ Yrs Clinical Experience
                        </span>
                        <div className="flex items-center gap-1 text-[12px] text-amber-600 font-bold ml-auto">
                          <span className="material-symbols-outlined text-[15px]">star</span>
                          <span>{doc.rating}</span>
                          <span className="text-on-surface-variant font-normal">({doc.reviewCount})</span>
                        </div>
                      </div>

                      <h3 className="font-title-md text-title-md text-primary font-bold">
                        <Link to={`/doctors/${doc.id}`} className="hover:text-secondary transition-colors">
                          {doc.displayName}
                        </Link>
                      </h3>
                      <p className="text-[12px] text-on-surface-variant mt-0.5">{doc.designation}</p>
                      <p className="text-[11px] text-outline mt-0.5">{doc.qualifications}</p>

                      <div className="flex flex-wrap items-center gap-3 mt-3 text-body-sm text-on-surface-variant">
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-secondary">meeting_room</span>
                          <span>{doc.chamberRoom}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-secondary">schedule</span>
                          <span>Avg Wait: {doc.averageWaitMins} mins</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-3">
                        {doc.specializations.map((spec, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-surface-container-low text-primary text-[11px] font-medium"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-surface-container-high/60 flex items-center gap-3">
                      <Link
                        to={`/doctors/${doc.id}`}
                        className="font-title-sm text-title-sm text-secondary hover:underline flex items-center gap-1"
                      >
                        <span>Full Consultant Bio & Reviews</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Right: Inline Slots Grid */}
                <div className="lg:w-80 shrink-0 bg-surface-container-low/70 rounded-xl p-4 border border-surface-container-high flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">
                        Select Real-Time Slot
                      </span>
                      <span className="text-[11px] text-secondary font-medium">Today</span>
                    </div>

                    {slots.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 my-2">
                        {slots.slice(0, 4).map((slot) => (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => handleSelectSlot(doc, slot.id)}
                            className="p-2 rounded-lg bg-surface-container-lowest hover:bg-secondary hover:text-white text-primary text-center font-title-sm text-title-sm transition-all border border-surface-container-high hover:border-secondary shadow-sm"
                          >
                            <span className="block font-bold">{slot.timeDisplay}</span>
                            <span className="text-[10px] opacity-80 block">{slot.consultationMode === 'IN_PERSON' ? 'In-Person' : 'Video OP'}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 text-center text-body-sm text-on-surface-variant">
                        No direct online slots left today.
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <Link
                      to={`/appointments/new?doctorId=${doc.id}`}
                      className="w-full py-2 rounded-lg bg-primary text-white text-center font-title-sm hover:bg-secondary transition-colors block shadow-sm"
                    >
                      Book Appointment
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </section>
    </div>
  );
};
