import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, PhoneCall, Stethoscope, ShieldCheck, 
  ArrowRight, Award, Users, CheckCircle2, 
  MapPin, Clock, Search, ChevronRight, Activity, Zap
} from 'lucide-react';
import { specialtiesData } from '../data/specialties';
import { api } from '../services/api';
import { HospitalDoctor, mapDoctorResponse } from '../services/doctorMapping';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'surgical'>('all');
  const [searchDoctor, setSearchDoctor] = useState('');
  const [doctorList, setDoctorList] = useState<HospitalDoctor[]>([]);

  useEffect(() => {
    let active = true;
    api.doctors()
      .then((res) => {
        if (!active) return;
        setDoctorList(res.items.map(mapDoctorResponse));
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const filteredDocs = doctorList.filter(d => 
    d.name.toLowerCase().includes(searchDoctor.toLowerCase()) ||
    d.departmentName.toLowerCase().includes(searchDoctor.toLowerCase()) ||
    d.specializations.some((s) => s.toLowerCase().includes(searchDoctor.toLowerCase()))
  );

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#002043] via-[#002952] to-[#001730] text-white pt-12 pb-24 px-4 md:px-8">
        {/* Subtle grid backdrop */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Hero Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-400/30 text-teal-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
              <span>Medora Clinical Campus, Chennai</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-white">
              Expert healthcare for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-sky-300 to-white">
                every stage of life.
              </span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl">
              Bringing together world-renowned physicians, precision robotic surgery, and a 650-bed quaternary referral infrastructure in central Chennai. Delivering compassionate patient care backed by real-time clinical telemetry.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/appointments/book"
                className="px-6 py-3.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/25 flex items-center gap-2.5 transition transform hover:-translate-y-0.5"
              >
                <Calendar className="w-4 h-4" />
                <span>Book an Appointment</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/specialties"
                className="px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl border border-white/20 backdrop-blur-sm transition flex items-center gap-2"
              >
                <span>Explore Our Specialties</span>
              </Link>

              <Link
                to="/appointments/guided"
                className="px-4 py-3.5 text-teal-300 hover:text-white text-sm font-semibold flex items-center gap-1.5 transition"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Symptom Triage Wizard</span>
              </Link>
            </div>

            {/* Key Clinical Badges */}
            <div className="pt-6 border-t border-white/10 grid grid-cols-3 gap-4 text-left">
              <div>
                <p className="text-2xl sm:text-3xl font-black text-white">650+</p>
                <p className="text-xs text-slate-400 mt-0.5">Critical & Inpatient Beds</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-teal-300">&lt; 45 min</p>
                <p className="text-xs text-slate-400 mt-0.5">Stroke Intervention Door-to-Needle</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-sky-300">99.4%</p>
                <p className="text-xs text-slate-400 mt-0.5">Cardiac Resuscitation Success</p>
              </div>
            </div>
          </div>

          {/* Right Hero Column: Clinical Consultation Image & Floating Status */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20 bg-slate-800">
              <img
                src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800"
                alt="Medora Medora Doctor Consultation"
                className="w-full h-[440px] object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

              {/* Floating card 1: Doctor on Duty */}
              <div className="absolute top-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3.5 rounded-2xl shadow-lg border border-white/40 flex items-center justify-between text-slate-900">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-800 font-bold text-sm">
                    VR
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Dr. V. Ramanathan</h5>
                    <p className="text-[11px] text-teal-700 font-medium">Head of Cardiology • OPD Suite 204</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Available Now
                </span>
              </div>

              {/* Floating card 2: Medora Campus Accreditation */}
              <div className="absolute bottom-4 left-4 right-4 bg-[#001730]/90 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-white flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                    <Award className="w-4 h-4" />
                    <span>JCI & NABH Gold Seal Campus</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Medora, Thousand Lights, Chennai</p>
                </div>
                <Link
                  to="/doctors"
                  className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold rounded-lg transition"
                >
                  Meet Faculty
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Action Navigation Strip */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 -mt-16 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: 'Book OPD Appointment',
              desc: 'Select preferred consultant, date & real-time time slot',
              path: '/appointments/book',
              icon: Calendar,
              bg: 'bg-white',
              accent: 'text-teal-600',
              cta: 'Choose Slot'
            },
            {
              title: 'Symptom Triage Wizard',
              desc: 'Interactive guided intake to route your specific condition',
              path: '/appointments/guided',
              icon: Zap,
              bg: 'bg-white',
              accent: 'text-blue-600',
              cta: 'Start Triage'
            },
            {
              title: 'Patient Digital Portal',
              desc: 'Access discharge summaries, lab tests & digital prescriptions',
              path: '/portal/dashboard',
              icon: ShieldCheck,
              bg: 'bg-white',
              accent: 'text-emerald-600',
              cta: 'View EMR'
            },
            {
              title: '24/7 Acute Emergency',
              desc: 'Medora resuscitation unit, trauma & ambulance',
              path: 'tel:1066',
              icon: PhoneCall,
              bg: 'bg-rose-50 border-rose-200',
              accent: 'text-rose-600',
              cta: 'Dial 1066'
            },
          ].map((action, i) => {
            const Icon = action.icon;
            const className = `p-6 rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition duration-200 ${action.bg} flex flex-col justify-between group`;
            const content = <>
                <div>
                  <div className={`w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center ${action.accent} mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-[#002043] transition">
                    {action.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    {action.desc}
                  </p>
                </div>
                <div className={`mt-5 text-xs font-bold flex items-center gap-1.5 ${action.accent}`}>
                  <span>{action.cta}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </>;
            return action.path.startsWith('tel:')
              ? <a key={i} href={action.path} className={className}>{content}</a>
              : <Link key={i} to={action.path} className={className}>{content}</Link>;
          })}
        </div>
      </section>

      {/* Featured Clinical Specialties */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
              Clinical Excellence
            </span>
            <h2 className="text-3xl font-extrabold text-[#002043] mt-2">
              Centres of Medical Excellence
            </h2>
            <p className="text-slate-600 text-sm mt-1 max-w-xl">
              Specialized departments operating under NABH clinical protocols and international infection control standards.
            </p>
          </div>
          <Link
            to="/specialties"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#178B8B] hover:text-[#002043] transition"
          >
            <span>View All 8+ Specialties</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {specialtiesData.slice(0, 4).map((spec) => (
            <div
              key={spec.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-teal-400 transition flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#178B8B] mb-4">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-base">{spec.name}</h4>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-3">
                  {spec.shortDesc}
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Head of Dept:</span>
                    <span className="font-medium text-slate-800 truncate max-w-[150px]">{spec.headOfDept.split(',')[0]}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Doctors:</span>
                    <span className="font-semibold text-slate-800">{spec.doctorCount} Specialists</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Bed Capacity:</span>
                    <span className="font-semibold text-teal-700">{spec.bedCapacity} Beds</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100">
                <Link
                  to={`/specialties#${spec.id}`}
                  className="text-xs font-semibold text-slate-700 hover:text-[#002043]"
                >
                  Department Info
                </Link>
                <Link
                  to="/appointments/book"
                  className="px-3 py-1.5 bg-[#002043] hover:bg-[#17365d] text-white text-xs font-semibold rounded-lg transition"
                >
                  Consult
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Doctors & Fast Search */}
      <section className="bg-gradient-to-b from-slate-100/70 to-white py-16 px-4 md:px-8 border-y border-slate-200">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                Senior Consultants
              </span>
              <h2 className="text-3xl font-extrabold text-[#002043] mt-2">
                Distinguished Medical Faculty
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                Leading researchers, clinical innovators, and experienced surgeons at Medora.
              </p>
            </div>

            {/* Quick search input */}
            <div className="w-full md:w-72 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchDoctor}
                onChange={(e) => setSearchDoctor(e.target.value)}
                placeholder="Search doctor or specialty..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#002043] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocs.slice(0, 3).map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <img
                      src={doc.imageUrl}
                      alt={doc.name}
                      className="w-18 h-18 rounded-2xl object-cover border border-slate-200 shadow-sm"
                    />
                    <div>
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 uppercase tracking-wide">
                        {(doc.departmentName || doc.specialty || 'General').split('&')[0]}
                      </span>
                      <h4 className="font-bold text-slate-900 text-base mt-1.5">{doc.name}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1">{doc.title}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-amber-500 font-semibold">
                        <span>★ {doc.rating}</span>
                        <span className="text-slate-400 font-normal">({doc.reviewCount} reviews)</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 text-xs space-y-1 text-slate-600">
                    <p><span className="text-slate-400">Experience:</span> <span className="font-semibold text-slate-800">{doc.experienceYears}+ Years</span></p>
                    <p><span className="text-slate-400">OPD Room:</span> <span className="font-medium text-slate-800">{doc.opdRoom}</span></p>
                    <p><span className="text-slate-400">Schedule:</span> <span className="text-teal-700 font-medium">{doc.availability}</span></p>
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Fee</span>
                    <span className="text-sm font-bold text-[#002043]">₹{doc.consultationFee}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/doctors/${doc.id}`}
                      className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:text-[#002043] text-xs font-semibold rounded-lg transition"
                    >
                      Profile
                    </Link>
                    <Link
                      to={`/appointments/book?doctor=${doc.id}`}
                      className="px-3.5 py-1.5 bg-[#002043] hover:bg-[#17365d] text-white text-xs font-semibold rounded-lg shadow-sm transition"
                    >
                      Book Slot
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-2">
            <Link
              to="/doctors"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-300 hover:border-[#002043] text-slate-800 font-semibold text-xs rounded-xl shadow-xs transition"
            >
              <span>Explore All Hospital Specialists</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Campus Location & Visiting Hours */}
      <section className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="bg-[#002043] text-white rounded-3xl p-8 md:p-12 shadow-xl grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-2">
              <MapPin className="w-4 h-4" />
              <span>Campus Location</span>
            </div>
            <h3 className="text-2xl font-bold">Medora Clinical Campus</h3>
            <p className="text-slate-300 text-xs mt-3 leading-relaxed">
              No. 21 Medora, Off Anna Salai, Thousand Lights, Chennai, Tamil Nadu 600006. Located 4.2 km from Chennai Central Railway Station.
            </p>
            <div className="mt-6 flex flex-col gap-2 text-xs">
              <span className="text-slate-300">OPD Registration: 07:30 AM - 08:00 PM</span>
              <span className="text-slate-300">Emergency & Pharmacy: 24 Hours Open</span>
              <span className="text-teal-300 font-medium">Valet Parking & Patient Golf Cart Service Available</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Clock className="w-4 h-4" />
              <span>Patient Visiting Hours</span>
            </div>
            <h3 className="text-2xl font-bold">Inpatient & ICU Policies</h3>
            <p className="text-slate-300 text-xs mt-3 leading-relaxed">
              To safeguard infection control and healing for our post-operative patients:
            </p>
            <div className="mt-4 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between border-b border-white/10 pb-1.5">
                <span>General Wards:</span>
                <span className="font-semibold text-white">04:30 PM - 07:00 PM</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-1.5">
                <span>Intensive Care (ICU/CCU):</span>
                <span className="font-semibold text-white">11:00 AM - 12:00 PM (1 Attendant)</span>
              </div>
              <div className="flex justify-between">
                <span>Private Suites:</span>
                <span className="font-semibold text-white">10:00 AM - 08:00 PM</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 rounded-2xl p-6 border border-white/15 backdrop-blur-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-amber-300">System Design Laboratory</span>
              <h4 className="text-lg font-bold text-white mt-1">Hospital Software Engineering</h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Explore the distributed architecture powering Medora: Rate Limiters, Consistent Hashing, LSM Key-Value store, and Unique Snowflake ID generators.
              </p>
            </div>
            <Link
              to="/lab/rate-limiter"
              className="mt-6 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              <span>Launch System Design Lab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
