import React from 'react';
import { Link } from 'react-router-dom';
import { DEPARTMENTS, DOCTORS } from '../data/mockData';
import { SpecialtyCard } from '../components/SpecialtyCard';

export const HomePage: React.FC = () => {
  return (
    <div className="flex flex-col w-full">
      {/* 1. Two-Column Hero Section */}
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-surface-container-low/60 via-background to-background py-space-lg lg:py-space-xl">
        <div className="max-w-[1360px] mx-auto px-gutter-mobile lg:px-margin">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg lg:gap-space-xl items-center">
            {/* Left Column: Copy & Actions */}
            <div className="lg:col-span-6 flex flex-col items-start gap-space-md">
              {/* Eyebrow Pill */}
              <div className="inline-flex items-center gap-space-xs px-3.5 py-1 rounded-full bg-secondary-fixed/40 text-on-secondary-fixed font-label-md text-label-md">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                <span>CARE THAT PUTS YOU FIRST • CHENNAI CAMPUS</span>
              </div>

              {/* Main Headline (32px / 700 / 40px) */}
              <h1 className="page-heading text-primary tracking-tight">
                Expert healthcare for every stage of life.
              </h1>

              {/* Supporting Text */}
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
                Discover experienced specialists, coordinated hospital services, and a simpler way to manage your healthcare journey in Chennai with real-time slot lock protection.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-space-sm w-full pt-space-xs">
                <Link
                  to="/appointments/new"
                  className="inline-flex items-center justify-center gap-space-xs px-space-lg py-3 rounded-lg bg-primary text-on-primary font-title-md text-title-md shadow-md hover:bg-secondary transition-all active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                  <span>Book an Appointment</span>
                </Link>
                <Link
                  to="/specialties"
                  className="inline-flex items-center justify-center gap-space-xs px-space-md py-3 rounded-lg bg-surface-container text-secondary font-title-md text-title-md hover:bg-surface-container-high transition-all"
                >
                  <span>Explore Our Specialties</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </Link>
              </div>

              {/* Reassurance Badge & Token Architecture */}
              <div className="w-full mt-space-sm pt-space-sm flex flex-col gap-2 border-t border-surface-container-highest/60">
                <div className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
                  <span className="material-symbols-outlined text-[18px] text-secondary">verified_user</span>
                  <span>Appointments, consultations, and patient records in one synchronized system.</span>
                </div>
                <div className="flex items-center gap-space-xs text-on-tertiary-fixed-variant bg-tertiary-fixed/30 px-3 py-1.5 rounded-lg w-fit">
                  <span className="material-symbols-outlined text-[16px] text-tertiary">bolt</span>
                  <span className="font-label-sm text-label-sm font-semibold">
                    Instant confirmation protection • Low latency slot locking with PostgreSQL & Redis
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Visual & Live Status Card */}
            <div className="lg:col-span-6 relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[580px] rounded-2xl overflow-hidden shadow-xl bg-surface-container">
                <img
                  alt="Physician conducting compassionate patient consultation at Aarogya Care Chennai"
                  className="w-full h-[420px] lg:h-[480px] object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAD0hUGkI9DhsAeTer9bbOG-2oqohVEXy_rdgYp9MXTrSWYkZkmm_54Hw25YKpdmT6YO1RaTpVbNYJm3pvVvEVsOSKHtMXJ03ifs_wEyHOQhyx4dpQfayw8z6MMUUkmJDBbHxsalU2DCL1GI_Y1NmRkqOjUIvItHlJt9xPDY73TpEvjgmI9bm0lzFz9_Es53FcCG09ZbTB-3IpeoP8w19SqPYI8Chqn1sr1TToDyYkv17kcM_RhQrkh"
                  onError={(e) => {
                    // Fallback to local asset if remote fails
                    (e.target as HTMLImageElement).src = '/consultation.png';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-transparent to-transparent"></div>

                {/* Overlaid Live Consultation Card */}
                <div className="absolute bottom-4 left-4 right-4 bg-surface-container-lowest/95 backdrop-blur-md rounded-xl p-space-md shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-sm">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined text-[22px]">medical_services</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-label-md text-label-md text-secondary font-semibold">
                        <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                        <span>Live Slot Sync Active</span>
                      </div>
                      <div className="font-title-sm text-title-sm text-primary">Dr. Priya Sundaram • Cardiology</div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant">Next OPD Consultation: Today, 3:30 PM</div>
                    </div>
                  </div>
                  <div className="self-end sm:self-center">
                    <Link
                      to="/doctors"
                      className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm whitespace-nowrap hover:bg-secondary hover:text-white transition-colors"
                    >
                      Lock Slot
                    </Link>
                  </div>
                </div>
              </div>

              {/* Decorative accent blur behind image */}
              <div className="absolute -top-8 -right-8 w-64 h-64 bg-secondary-fixed/50 rounded-full blur-3xl -z-10 pointer-events-none"></div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Hospital Service Highlights */}
      <section className="w-full bg-surface-container-lowest py-space-lg shadow-sm">
        <div className="max-w-[1360px] mx-auto px-gutter-mobile lg:px-margin">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-md">
            {/* Highlight 1 */}
            <div className="flex flex-col gap-2 p-space-sm rounded-xl hover:bg-surface-container-low transition-colors">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[22px]">groups</span>
              </div>
              <span className="font-title-md text-title-md text-primary">Experienced Specialists</span>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Over 28+ clinical departments led by accomplished senior consultants.
              </p>
            </div>

            {/* Highlight 2 */}
            <div className="flex flex-col gap-2 p-space-sm rounded-xl hover:bg-surface-container-low transition-colors">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[22px]">calendar_today</span>
              </div>
              <span className="font-title-md text-title-md text-primary">Outpatient Consults</span>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Same-day slot reservations with automated token protection safeguards.
              </p>
            </div>

            {/* Highlight 3 */}
            <div className="flex flex-col gap-2 p-space-sm rounded-xl hover:bg-surface-container-low transition-colors">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[22px]">emergency</span>
              </div>
              <span className="font-title-md text-title-md text-primary">24/7 Trauma Care</span>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Dedicated acute resuscitation bays with immediate sub-specialist dispatch.
              </p>
            </div>

            {/* Highlight 4 */}
            <div className="flex flex-col gap-2 p-space-sm rounded-xl hover:bg-surface-container-low transition-colors">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[22px]">medication</span>
              </div>
              <span className="font-title-md text-title-md text-primary">Central Pharmacy</span>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Transactional inventory control ensuring real-time stock verification.
              </p>
            </div>

            {/* Highlight 5 */}
            <div className="flex flex-col gap-2 p-space-sm rounded-xl hover:bg-surface-container-low transition-colors">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[22px]">health_and_safety</span>
              </div>
              <span className="font-title-md text-title-md text-primary">Patient Records</span>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Encrypted clinical summaries, lab results, and auditable data protection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Featured Centres of Excellence */}
      <section className="w-full py-space-xl bg-background">
        <div className="max-w-[1360px] mx-auto px-gutter-mobile lg:px-margin">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-space-lg">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[22px]">workspace_premium</span>
                <span className="font-label-md text-label-md text-secondary font-bold uppercase tracking-wider">
                  Apex Clinical Units
                </span>
              </div>
              <h2 className="section-heading text-primary tracking-tight mt-1">
                Centres of Excellence
              </h2>
            </div>
            <Link
              to="/specialties"
              className="inline-flex items-center gap-1 btn-text text-secondary hover:text-primary transition-colors"
            >
              <span>View All 28 Specialties</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DEPARTMENTS.slice(0, 3).map((dept) => (
              <SpecialtyCard key={dept.id} department={dept} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. Featured Consultant Doctors */}
      <section className="w-full py-space-xl bg-surface-container-low/50 border-t border-surface-container-high">
        <div className="max-w-[1360px] mx-auto px-gutter-mobile lg:px-margin">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-space-lg">
            <div>
              <span className="font-label-md text-label-md text-secondary font-bold uppercase tracking-wider">
                Senior Faculty & Consultants
              </span>
              <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight mt-1">
                Meet Our Leading Specialists
              </h2>
            </div>
            <Link
              to="/doctors"
              className="inline-flex items-center gap-1 font-title-sm text-title-sm text-secondary hover:text-primary transition-colors"
            >
              <span>Explore Doctor Directory</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DOCTORS.slice(0, 3).map((doctor) => (
              <div
                key={doctor.id}
                className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-surface-container-high flex flex-col"
              >
                <div className="relative h-56 bg-surface-container">
                  <img
                    src={doctor.avatarUrl}
                    alt={doctor.displayName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/consultation.png';
                    }}
                  />
                  <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full bg-primary/90 text-white font-label-sm text-label-sm backdrop-blur-sm flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-tertiary-fixed animate-pulse"></span>
                    <span>Accepting Patients</span>
                  </div>
                </div>

                <div className="p-space-md flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-label-sm text-label-sm text-secondary font-semibold">
                        {doctor.departmentName}
                      </span>
                      <div className="flex items-center gap-1 text-[12px] text-amber-600 font-semibold">
                        <span className="material-symbols-outlined text-[14px]">star</span>
                        <span>{doctor.rating}</span>
                        <span className="text-on-surface-variant font-normal">({doctor.reviewCount})</span>
                      </div>
                    </div>
                    <h3 className="font-title-md text-title-md text-primary font-bold">
                      {doctor.displayName}
                    </h3>
                    <p className="text-[12px] text-on-surface-variant mt-1 line-clamp-1">
                      {doctor.designation}
                    </p>
                    <p className="text-[11px] text-outline mt-0.5">
                      {doctor.qualifications}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-[12px] text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px] text-secondary">meeting_room</span>
                      <span>{doctor.chamberRoom}</span>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-surface-container-high flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-outline uppercase block">Next Available Slot</span>
                      <span className="font-title-sm text-title-sm text-primary font-bold">{doctor.nextSlotTime}</span>
                    </div>
                    <Link
                      to={`/doctors/${doctor.id}`}
                      className="px-4 py-2 rounded-lg bg-primary text-white font-title-sm text-title-sm hover:bg-secondary transition-colors"
                    >
                      View & Book
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Distributed Architecture & Telemetry Section */}
      <section className="w-full py-space-xl bg-primary text-on-primary">
        <div className="max-w-[1360px] mx-auto px-gutter-mobile lg:px-margin">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-center">
            <div className="lg:col-span-7 flex flex-col gap-space-sm">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container text-primary-fixed font-label-md text-label-md w-fit">
                <span className="material-symbols-outlined text-[16px] text-tertiary-fixed">hub</span>
                <span>SYSTEM DESIGN LAB PROTOTYPE</span>
              </div>
              <h2 className="font-headline-lg text-headline-lg text-white tracking-tight">
                Built for High Concurrency & Uncompromising Correctness
              </h2>
              <p className="font-body-md text-body-md text-on-primary-container leading-relaxed">
                Aarogya Care combines PostgreSQL transactional guarantees with distributed token-bucket rate limiting, 3-node consistent-hash Redis caching, and normalized Trie autocomplete.
              </p>
              <div className="grid grid-cols-3 gap-4 pt-space-sm">
                <div className="p-3 rounded-xl bg-primary-container/60 border border-primary-container">
                  <span className="font-headline-md text-headline-md text-white font-bold block">100%</span>
                  <span className="text-[12px] text-on-primary-container">PostgreSQL Durable Writes</span>
                </div>
                <div className="p-3 rounded-xl bg-primary-container/60 border border-primary-container">
                  <span className="font-headline-md text-headline-md text-tertiary-fixed font-bold block">0</span>
                  <span className="text-[12px] text-on-primary-container">Negative Stock / Double Dispense</span>
                </div>
                <div className="p-3 rounded-xl bg-primary-container/60 border border-primary-container">
                  <span className="font-headline-md text-headline-md text-secondary-container font-bold block">&lt;4ms</span>
                  <span className="text-[12px] text-on-primary-container">Trie Autocomplete Latency</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md p-space-lg rounded-2xl bg-surface-container-lowest text-on-surface shadow-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
                  <span className="font-title-sm text-title-sm text-primary font-bold">Platform Status Monitor</span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[11px] font-semibold">STAGE A/B READY</span>
                </div>
                <div className="space-y-2 text-body-sm">
                  <div className="flex justify-between py-1 border-b border-surface-container-high/60">
                    <span className="text-on-surface-variant">PostgreSQL Source of Truth:</span>
                    <span className="font-semibold text-primary">Connected (23 Tables)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-surface-container-high/60">
                    <span className="text-on-surface-variant">Redis Control Rate Limiter:</span>
                    <span className="font-semibold text-secondary">Token Bucket Active</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-surface-container-high/60">
                    <span className="text-on-surface-variant">Consistent Hash Ring:</span>
                    <span className="font-semibold text-primary">Nodes A / B / C (150 vnodes)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-on-surface-variant">Emergency Triage Queue:</span>
                    <span className="font-semibold text-error">Dedicated Overload Path</span>
                  </div>
                </div>
                <Link
                  to="/staff/operations"
                  className="block w-full py-2.5 rounded-xl bg-primary text-white text-center font-title-sm hover:bg-secondary transition-colors mt-2"
                >
                  Open Operations Telemetry Hub
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
