import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DOCTORS, SLOTS_DATA } from '../data/mockData';
import { doctorService } from '../services/api';
import { Doctor, DoctorSlot } from '../types';

export const DoctorProfilePage: React.FC = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();

  const initialDoc = DOCTORS.find(d => d.id === doctorId) || DOCTORS[0];
  const [doctor, setDoctor] = useState<Doctor>(initialDoc);
  const [slots, setSlots] = useState<DoctorSlot[]>(() => SLOTS_DATA[initialDoc.id] || SLOTS_DATA['doc-ramanathan'] || []);
  const [selectedSlotId, setSelectedSlotId] = useState<string>(slots[0]?.id || '');
  const [selectedPeriod, setSelectedPeriod] = useState<'All' | 'Morning' | 'Afternoon' | 'Evening'>('All');

  useEffect(() => {
    let mounted = true;
    if (doctorId) {
      Promise.all([
        doctorService.getById(doctorId),
        doctorService.getSlots(doctorId)
      ]).then(([doc, docSlots]) => {
        if (!mounted) return;
        if (doc) setDoctor(doc);
        if (docSlots && docSlots.length > 0) {
          setSlots(docSlots);
          setSelectedSlotId(prev => (prev && docSlots.some(s => s.id === prev) ? prev : docSlots[0].id));
        }
      }).catch(() => {
        // preserve initial
      });
    }
    return () => { mounted = false; };
  }, [doctorId]);

  const filteredSlots = slots.filter(s => {
    if (selectedPeriod === 'All') return true;
    return s.period === selectedPeriod;
  });

  const handleBookNow = () => {
    navigate(`/appointments/new?doctorId=${doctor.id}&slotId=${selectedSlotId}`);
  };

  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* 1. Top Breadcrumb & Credential Header */}
      <section className="w-full bg-surface-container-low py-4 px-margin-mobile md:px-margin border-b border-surface-container-high/60">
        <div className="max-w-[1360px] mx-auto flex flex-wrap items-center justify-between gap-y-2">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <Link to="/doctors" className="hover:text-primary transition-colors">Doctors</Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="font-title-sm text-title-sm text-primary">{doctor.displayName}</span>
          </nav>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-highest text-primary font-label-md text-label-md">
              <span className="material-symbols-outlined text-[15px] text-secondary">verified</span>
              Verified Senior Consultant • NABH Institutional Credentialed
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[14px] text-tertiary">check_circle</span>
              Reg. TNMC #48192
            </span>
          </div>
        </div>
      </section>

      {/* 2. Doctor Hero Profile Card */}
      <section className="w-full px-margin-mobile md:px-margin pt-8 pb-10">
        <div className="max-w-[1360px] mx-auto">
          <div className="bg-surface-container-lowest rounded-2xl shadow-md p-6 sm:p-8 lg:p-10 relative overflow-hidden border border-surface-container-high">
            {/* Ambient Background Gradient */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-fixed/30 rounded-full blur-3xl pointer-events-none -mr-24 -mt-24"></div>

            <div className="relative z-10 flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
              {/* Doctor Portrait & Availability Badge */}
              <div className="w-full sm:w-64 lg:w-72 shrink-0 flex flex-col items-center">
                <div className="relative w-56 sm:w-64 lg:w-72 aspect-[4/5] rounded-2xl overflow-hidden shadow-lg bg-surface-container">
                  <img
                    className="w-full h-full object-cover"
                    src={doctor.avatarUrl}
                    alt={doctor.displayName}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/consultation.png';
                    }}
                  />
                  <div className="absolute bottom-3 left-3 right-3 bg-primary/90 backdrop-blur-md py-2 px-3 rounded-xl flex items-center justify-between text-on-primary">
                    <span className="font-label-sm text-label-sm tracking-wider uppercase">OPD Status</span>
                    <span className="inline-flex items-center gap-1.5 font-title-sm text-title-sm text-tertiary-fixed">
                      <span className="w-2 h-2 rounded-full bg-tertiary-fixed animate-pulse"></span>
                      Accepting Patients
                    </span>
                  </div>
                </div>

                <div className="w-full mt-4 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-surface-container-low text-primary text-center">
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  <span className="font-label-md text-label-md">{doctor.designation}</span>
                </div>
              </div>

              {/* Doctor Key Bio Info */}
              <div className="flex-1 flex flex-col">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-md text-label-md font-semibold">
                    {doctor.experienceYears}+ Years Clinical Excellence
                  </span>
                  <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-md text-label-md">
                    {doctor.departmentName}
                  </span>
                  <span className="inline-flex items-center gap-1 text-on-surface-variant font-label-md text-label-md ml-auto">
                    <span className="material-symbols-outlined text-[16px] text-amber-500">star</span>
                    <strong className="text-on-surface">{doctor.rating}</strong> ({doctor.reviewCount}+ Verified Patient Reviews)
                  </span>
                </div>

                <h1 className="page-heading text-primary tracking-tight">
                  {doctor.displayName}
                </h1>
                <p className="subsection-heading text-secondary mt-1">
                  {doctor.qualifications}
                </p>
                <p className="body-text text-on-surface-variant mt-2 max-w-3xl">
                  {doctor.departmentName} • {doctor.chamberRoom}, Greams Road Main Campus.
                </p>

                {/* Language Pill Bar & Waiting time */}
                <div className="flex flex-wrap items-center gap-4 mt-4 font-body-sm text-body-sm text-on-surface-variant">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-secondary">translate</span>
                    <span className="font-title-sm text-title-sm text-on-surface">Languages:</span>
                    <span>{doctor.languages.join(', ')}</span>
                  </div>
                  <span className="hidden sm:inline text-outline-variant">•</span>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-secondary">schedule</span>
                    <span className="font-title-sm text-title-sm text-on-surface">Average Waiting:</span>
                    <span>{doctor.averageWaitMins} mins</span>
                  </div>
                </div>

                {/* Core Clinical Specializations */}
                <div className="mt-5">
                  <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider block mb-2 font-semibold">
                    Core Clinical Specializations
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {doctor.specializations.map((spec, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 rounded-lg bg-surface-container text-primary font-label-md text-label-md font-medium"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Appointment Schedule & Slot Locking Box */}
                <div className="mt-8 p-6 rounded-2xl bg-surface-container-low border border-surface-container-high">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-surface-container-high gap-2">
                    <div>
                      <h3 className="font-title-md text-title-md text-primary font-bold">
                        Outpatient Schedule: Today (Oct 24)
                      </h3>
                      <p className="text-[12px] text-on-surface-variant">
                        Select a candidate slot below to trigger the 10-minute concurrency reservation lock.
                      </p>
                    </div>

                    <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-lg border border-surface-container-high self-start sm:self-auto">
                      {(['All', 'Morning', 'Afternoon', 'Evening'] as const).map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setSelectedPeriod(p)}
                          className={`px-2.5 py-1 rounded text-label-sm font-semibold transition-all ${
                            selectedPeriod === p ? 'bg-secondary text-white' : 'text-on-surface-variant'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                    {filteredSlots.map(slot => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          selectedSlotId === slot.id
                            ? 'bg-secondary text-white border-secondary shadow-md'
                            : 'bg-surface-container-lowest text-primary border-surface-container-high hover:border-secondary'
                        }`}
                      >
                        <span className="font-bold block text-title-sm">{slot.timeDisplay}</span>
                        <span className="text-[11px] opacity-80 block mt-0.5">
                          {slot.consultationMode === 'IN_PERSON' ? 'In-Person OPD' : 'Video OP'}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-secondary text-[18px]">lock_clock</span>
                      <span>Slot lock active with Redis token bucket protection</span>
                    </div>

                    <button
                      onClick={handleBookNow}
                      className="w-full sm:w-auto px-8 py-3 rounded-xl bg-primary hover:bg-secondary text-white font-title-sm text-title-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <span>Proceed to Intake & UHID</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
