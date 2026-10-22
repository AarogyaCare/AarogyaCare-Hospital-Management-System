import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar, PhoneCall, Stethoscope, ShieldCheck,
  ArrowRight, Award, Users, CheckCircle2,
  MapPin, Clock, Search, ChevronRight, Activity, Zap, Sparkles,
  Video, FlaskConical, Pill, UserCheck, HeartPulse, FileText, ArrowUpRight,
  Heart, Building2, TrendingUp, Globe, Star, Play, Shield
} from 'lucide-react';
import { specialtiesData } from '../data/specialties';
import { api } from '../services/api';
import { HospitalDoctor, mapDoctorResponse } from '../services/doctorMapping';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  const filteredDocs = doctorList.filter((d) =>
    d.name.toLowerCase().includes(searchDoctor.toLowerCase()) ||
    d.departmentName.toLowerCase().includes(searchDoctor.toLowerCase()) ||
    d.specializations.some((s) => s.toLowerCase().includes(searchDoctor.toLowerCase()))
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchDoctor.trim()) {
      navigate(`/doctors?search=${encodeURIComponent(searchDoctor.trim())}`);
    } else {
      navigate('/doctors');
    }
  };

  return (
    <div className="space-y-14 pb-20 animate-fade-in bg-[#fbfdff]">

      {/* ============================================================== */}
      {/* 1. FULL-BLEED CAMPUS HERO (CRISP TEXT & DARK CONTRAST BORDERS)   */}
      {/* ============================================================== */}
      <section className="relative overflow-hidden min-h-[580px] lg:min-h-[620px]">
        {/* Full-bleed Medora Campus Background */}
        <div className="absolute inset-0">
          <img
            src="/medora-hero-bg.jpg"
            alt="Medora Multi Speciality Hospital Campus"
            className="w-full h-full object-cover object-center"
          />
          {/* Left-side contrast shadow for text readability — right side stays 100% natural */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#001830]/75 via-[#001830]/35 to-transparent pointer-events-none" />
        </div>

        {/* Top Status Ticker with dark borders */}
        <div className="relative z-20 bg-slate-950/75 backdrop-blur-md border-b border-slate-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-extrabold text-emerald-300 tracking-wide uppercase text-[11px]">Emergency 24/7 Active</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-200 hidden sm:inline text-[11px]">Helpline: <strong className="text-white font-extrabold">1066 / +91 44 2746 9700</strong></span>
            </div>
            <div className="flex items-center gap-4 text-slate-300 text-[11px] font-medium">
              <span className="hidden md:inline-flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-teal-400" />
                <span className="text-white font-bold">16 OR Suites Online</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-sky-400" />
                <span className="text-white font-bold">Avg Wait &lt; 12m</span>
              </span>
            </div>
          </div>
        </div>

        {/* Main Hero Content — Open layout with high contrast typography & dark bordered pills */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-10 lg:pt-14 pb-24 lg:pb-28">
          <div className="max-w-2xl space-y-6">

            {/* Award Chip with Darker Border & Solid Legibility */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-950/80 backdrop-blur-md border-2 border-slate-800 text-teal-300 text-[11px] font-extrabold tracking-wide shadow-lg">
              <Award className="w-4 h-4 text-teal-300" />
              <span>Newsweek World's Best Hospitals 2026</span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-300">NABH & JCI Certified</span>
            </div>

            {/* Main Headline with Deep Shadow & Rich Contrast */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight drop-shadow-[0_4px_14px_rgba(0,0,0,0.9)]">
              Care Today
              <br />
              <span className="bg-gradient-to-r from-teal-300 via-emerald-300 to-sky-300 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                For a Healthier
              </span>
              <br />
              Tomorrow
            </h1>

            {/* Subtitle with Darker, Solid Font & Crisp Shadow */}
            <p className="text-base sm:text-lg text-slate-100 font-medium leading-relaxed max-w-xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              Chennai's premier quaternary-care super speciality hospital —{' '}
              <strong className="text-white font-black underline decoration-teal-400 decoration-2 underline-offset-4">45+ specialities</strong>,{' '}
              <strong className="text-white font-black underline decoration-teal-400 decoration-2 underline-offset-4">1500+ beds</strong>, and
              world-class robotic surgical excellence. Where every life is invaluable.
            </p>

            {/* CTA Buttons with Dark Borders & Sharp Contrast */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/appointments/book"
                className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white text-sm font-black shadow-xl shadow-teal-900/40 hover:shadow-teal-700/50 border border-teal-400/40 transition-all duration-300 hover:-translate-y-0.5"
              >
                <Calendar className="w-4.5 h-4.5" />
                <span>Book Appointment</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/doctors"
                className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-950/80 backdrop-blur-md border-2 border-slate-700 hover:border-teal-400 text-white text-sm font-extrabold hover:bg-slate-900 transition-all duration-300 shadow-lg"
              >
                <Stethoscope className="w-4 h-4 text-teal-300" />
                <span>Find a Doctor</span>
              </Link>
              <Link
                to="/specialties"
                className="group inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-950/60 backdrop-blur-md border border-slate-700/80 text-white text-sm font-bold hover:border-slate-500 transition-all duration-300 shadow-md"
              >
                <ChevronRight className="w-4 h-4 text-sky-400 group-hover:translate-x-0.5 transition-transform" />
                <span>Explore Specialities</span>
              </Link>
            </div>



          </div>
        </div>

        {/* Small smooth transition to the next section */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#fbfdff] to-transparent pointer-events-none z-20" />
      </section>



      {/* ============================================================== */}
      {/* 2. LEADERSHIP & HOSPITAL PHILOSOPHY (SECOND HERO SECTION)       */}
      {/* ============================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f3f7fb] via-[#eef4f9] to-[#f8fbfd] border-b border-slate-200/80 pt-8 pb-20 px-4 md:px-8">
        {/* Architectural backdrop watermark */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.06] select-none mix-blend-multiply">
          <img
            src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1600&q=80"
            alt=""
            className="w-full h-full object-cover object-center filter grayscale"
          />
        </div>

        {/* Subtle decorative background textures */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-teal-500/5 to-transparent pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-sky-200/30 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-teal-200/25 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Live Hospital Telemetry & Clinical Highlights Bar */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-white/85 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-slate-200/80 shadow-xs text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-bold text-slate-800">24/7 Level-1 Trauma Active</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-600 hidden sm:inline">Emergency Helpline: <strong className="text-rose-600 font-bold">1066 / +91 44 2746 9700</strong></span>
            </div>
            <div className="flex items-center gap-4 text-slate-600">
              <span className="hidden md:inline-flex items-center gap-1.5 font-medium">
                <Activity className="w-3.5 h-3.5 text-teal-600" />
                <span>16 Robotic OR Suites Online</span>
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-sky-600" />
                <span>Avg OPD Wait &lt; 12m</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">

            {/* Left Column: Doctor / Chairman Portrait */}
            <div className="lg:col-span-4 flex justify-center lg:justify-start">
              <div className="relative group">
                {/* Glow ring */}
                <div className="absolute -inset-2 bg-gradient-to-tr from-teal-500/30 via-sky-400/20 to-teal-600/30 rounded-3xl blur-lg opacity-40 group-hover:opacity-70 transition duration-500" />

                {/* Floating Top Badge: Live Teleconsult */}
                <div className="absolute -top-3 -left-3 sm:-left-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-md border border-slate-200/90 flex items-center gap-2 z-20">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-700 tracking-wide">Live Consults Online</span>
                </div>

                {/* Doctor Portrait Frame - Zoomed 15% for warm prominent presence */}
                <div className="relative rounded-3xl overflow-hidden bg-white shadow-xl border-4 border-white w-[260px] sm:w-[300px] h-[340px] sm:h-[380px]">
                  <img
                    src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=700"
                    alt="Dr. V. Ramanathan, Chief Medical Director & Chairman"
                    className="w-full h-full object-cover object-[center_15%] scale-115 group-hover:scale-120 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#002043]/85 via-transparent to-transparent" />

                  {/* Portrait Bottom Caption */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-teal-300">Head of Medical Board</p>
                    <h4 className="font-extrabold text-sm sm:text-base leading-tight">Dr. V. Ramanathan</h4>
                    <p className="text-[10px] text-slate-200">MD, DM (Cardiology), FACC • 28+ Yrs Exp</p>
                  </div>
                </div>

                {/* Floating Experience Badge with Zoomed Icon */}
                <div className="absolute -bottom-3 -right-3 sm:-right-4 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-slate-200 text-[#002043] flex items-center gap-2.5 z-20">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-black text-sm shadow-2xs group-hover:scale-110 transition-transform">
                    ★
                  </div>
                  <div className="text-left">
                    <span className="block text-xs font-black text-[#002043] leading-none">15,000+</span>
                    <span className="text-[9px] text-slate-500 font-semibold">Surgeries Led</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Column: Inspiring Patient-First Quote & Signature */}
            <div className="lg:col-span-5 space-y-4 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                <span>Medora Multi Speciality Hospital, Chennai</span>
              </div>

              {/* Quote Block */}
              <div className="relative">
                <span className="text-5xl sm:text-6xl font-serif text-teal-600/25 absolute -top-5 -left-3 select-none leading-none">“</span>
                <p className="text-slate-700 text-sm sm:text-base lg:text-[1.05rem] leading-relaxed font-normal pt-2 italic relative z-10">
                  Medora's patient-first approach allows teams of super specialist doctors to collaborate
                  seamlessly and arrive at the best possible treatment, customised for each patient in line
                  with our guiding philosophy <strong className="text-[#002043] not-italic font-bold">‘Care Today for a Healthier Tomorrow’</strong>,
                  meaning <span className="text-teal-700 font-semibold not-italic">‘Every Life is Invaluable’</span>.
                </p>
              </div>

              {/* Leadership Signoff */}
              <div className="pt-2 border-t border-slate-200/80">
                <h4 className="text-base sm:text-lg font-extrabold text-[#002043]">
                  Dr. V. Ramanathan
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  Chairman & Chief Medical Director • Medora The Medicity
                </p>
              </div>

              {/* Patient Trust Rating & Action */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <div className="flex items-center gap-2 bg-amber-50/80 border border-amber-200/70 px-3 py-1.5 rounded-xl text-xs">
                  <div className="flex text-amber-500 text-xs">
                    ★★★★★
                  </div>
                  <span className="font-extrabold text-amber-900">4.9/5</span>
                  <span className="text-slate-500 text-[11px]">(24,000+ Reviews)</span>
                </div>
                <Link
                  to="/appointments/book"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book Priority Consult</span>
                </Link>
              </div>

              {/* Quick Trust Pillars */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600 font-medium">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>Quaternary Care</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>Robotic Surgical Suites</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>24/7 Level-1 Trauma</span>
                </span>
              </div>
            </div>

            {/* Right Column: World's Best Hospitals 2026 Award Ribbon Badge */}
            <div className="lg:col-span-3 flex justify-center lg:justify-end">
              <div className="w-[200px] sm:w-[220px] rounded-2xl bg-white p-4 shadow-xl border border-slate-200/90 text-center relative overflow-hidden group hover:shadow-2xl transition duration-300">
                {/* Red Ribbon Top Header */}
                <div className="bg-[#b31919] text-white py-1.5 -mx-4 -mt-4 mb-3 shadow-xs">
                  <div className="flex justify-center gap-1 text-[11px] text-amber-300">
                    ★ ★ ★ ★ ★
                  </div>
                  <p className="text-[10px] font-black tracking-wider uppercase">World's Best</p>
                  <p className="text-[12px] font-black tracking-tight uppercase">Hospitals 2026</p>
                </div>

                {/* Newsweek Branding */}
                <div className="py-2 border-b border-slate-100">
                  <span className="text-xl font-black text-rose-600 tracking-tight font-serif italic">Newsweek</span>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">
                    Powered by <strong className="text-slate-700">statista</strong>
                  </p>
                </div>

                {/* Medora Ribbon Footer */}
                <div className="mt-3 bg-[#b31919] text-white py-1.5 px-2 rounded-lg text-center shadow-xs">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-red-100">Ranked Hospital</p>
                  <p className="text-[11px] font-black tracking-tight">MEDORA THE MEDICITY</p>
                </div>

                <div className="mt-3 text-[10px] text-slate-500 font-medium">
                  NABH & JCI Gold Seal Certified
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

{/* 2. FLOATING MULTI-FUNCTION SEARCH BAR (BRIDGING HERO & CONTENT) */}
      {/* ============================================================== */}
      <section className="max-w-5xl mx-auto px-4 -mt-10 relative z-30">
        <form
          onSubmit={handleSearchSubmit}
          className="bg-white rounded-full p-2 pl-6 shadow-2xl border border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 transition-all hover:border-teal-400"
          style={{
            boxShadow: '0 20px 45px -10px rgba(0, 32, 67, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.9)',
          }}
        >
          <div className="flex items-center gap-3 flex-1 w-full">
            <div className="w-9 h-9 rounded-full bg-teal-500/10 text-teal-700 flex items-center justify-center shrink-0">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search by Doctor Name, Specialty, Condition, or Diagnostic Test..."
              value={searchDoctor}
              onChange={(e) => setSearchDoctor(e.target.value)}
              className="w-full text-xs sm:text-sm text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none py-1"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <button
              type="submit"
              className="px-6 py-3 rounded-full bg-gradient-to-r from-teal-500 via-teal-600 to-[#106E70] hover:from-teal-600 hover:to-[#0f5a5c] text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-teal-500/20 transition transform active:scale-95"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Find a Doctor</span>
            </button>
            <Link
              to="/appointments/book"
              className="px-5 py-3 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-800 font-bold text-xs flex items-center gap-2 transition"
            >
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden md:inline">Book</span> Appointment
            </Link>
          </div>
        </form>
      </section>

      {/* ============================================================== */}
      {/* 3. SCALLOP QUICK-SERVICES STRIP (MEDANTA 7-CARD ARCHITECTURE)  */}
      {/* ============================================================== */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pt-2">
        <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 ${user?.role === 'ADMIN' ? 'xl:grid-cols-8' : 'xl:grid-cols-7'} gap-3 sm:gap-3.5`}>
          {[
            {
              title: 'Get Health Checkup',
              icon: Calendar,
              path: '/specialties',
              color: 'text-teal-700 bg-teal-50',
              bgImage: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=400&q=80',
            },
            {
              title: 'Second Opinion',
              icon: UserCheck,
              path: '/doctors',
              color: 'text-sky-700 bg-sky-50',
              bgImage: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=400&q=80',
            },
            {
              title: 'Virtual Consultation',
              icon: Video,
              path: '/appointments/book',
              color: 'text-blue-700 bg-blue-50',
              bgImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=400&q=80',
            },
            {
              title: 'Homecare Services',
              icon: HeartPulse,
              path: '/portal/dashboard',
              color: 'text-purple-700 bg-purple-50',
              bgImage: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=400&q=80',
            },
            {
              title: 'Book a Test / Diagnostics',
              icon: FlaskConical,
              path: '/portal/medical-records',
              color: 'text-emerald-700 bg-emerald-50',
              bgImage: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=400&q=80',
            },
            {
              title: 'Medicine Delivery',
              icon: Pill,
              path: '/pharmacy',
              color: 'text-amber-700 bg-amber-50',
              bgImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
            },
            {
              title: 'Radiology & Imaging',
              icon: Activity,
              path: '/specialties',
              color: 'text-indigo-700 bg-indigo-50',
              bgImage: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=400&q=80',
            },
            {
              title: 'System Design Labs',
              icon: Zap,
              path: '/lab/rate-limiter',
              color: 'text-rose-700 bg-rose-50',
              bgImage: undefined, // Explicitly no photo background per user requirement!
            },
          ].filter(item => item.title !== 'System Design Labs' || user?.role === 'ADMIN').map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                to={item.path}
                className="relative p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-teal-400 hover:-translate-y-1 transition duration-200 flex flex-col justify-between min-h-[135px] group overflow-hidden"
              >
                {/* Background Image Layer (Non-intrusive, keeps text crisp & 100% readable) */}
                {item.bgImage ? (
                  <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
                    <img
                      src={item.bgImage}
                      alt=""
                      aria-hidden="true"
                      className="w-full h-full object-cover object-center opacity-15 group-hover:opacity-25 group-hover:scale-105 transition-all duration-300 filter saturate-125"
                    />
                    {/* Legibility wash: semi-transparent gradient mask keeping text 100% readable */}
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/85 to-white/60" />
                  </div>
                ) : (
                  /* Technical dot grid background for System Design Labs */
                  <div className="absolute inset-0 z-0 pointer-events-none select-none bg-[radial-gradient(#f43f5e_1px,transparent_1px)] [background-size:12px_12px] opacity-[0.06] group-hover:opacity-[0.12] transition-opacity" />
                )}

                {/* Top-Right Circular Indicator with Arrow */}
                <div className="relative z-10 self-end w-6 h-6 rounded-full bg-white/90 backdrop-blur-xs border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-teal-700 group-hover:bg-teal-50 group-hover:border-teal-300 transition-colors shadow-2xs">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>

                {/* Card Title */}
                <div className="relative z-10 pr-2">
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-teal-950 transition leading-snug drop-shadow-2xs">
                    {item.title}
                  </h4>
                </div>

                {/* Bottom Icon */}
                <div className="relative z-10 mt-3 flex justify-end">
                  <div className={`w-8 h-8 rounded-xl ${item.color} flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform ring-1 ring-black/5`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. MEDORA MULTI SPECIALITY CAMPUS SHOWCASE & CLINICAL STATS    */}
      {/* ============================================================== */}
      <section className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-[#001428] via-[#002043] to-[#002b54] text-white shadow-2xl border border-white/10 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center">

            {/* Left Content Column */}
            <div className="lg:col-span-6 p-8 sm:p-12 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-teal-400/30 text-teal-300 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                <span>Quaternary Referral Campus • Anna Salai, Chennai</span>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-widest text-teal-300">
                  Compassion • Technology • Expertise • Better Lives
                </p>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  World-Class Medical Excellence, <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-sky-200 to-white">
                    Right Here in Chennai.
                  </span>
                </h2>
              </div>

              <p className="text-slate-200 text-xs sm:text-sm leading-relaxed max-w-lg">
                Equipped with South India's most advanced hybrid cath labs, Da Vinci Xi robotic surgery systems,
                and paperless electronic medical telemetry. Delivering uninterrupted clinical emergency care 24 hours a day.
              </p>

              {/* 4 Key Clinical Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                  <p className="text-2xl font-black text-white">650+</p>
                  <p className="text-[10px] text-slate-300 font-medium">Critical Beds</p>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                  <p className="text-2xl font-black text-teal-300">45+</p>
                  <p className="text-[10px] text-slate-300 font-medium">Specialists</p>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                  <p className="text-2xl font-black text-sky-300">&lt;45m</p>
                  <p className="text-[10px] text-slate-300 font-medium">Door-to-Needle</p>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                  <p className="text-2xl font-black text-emerald-300">99.4%</p>
                  <p className="text-[10px] text-slate-300 font-medium">Survival Rate</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/appointments/book"
                  className="px-6 py-3.5 bg-gradient-to-r from-teal-400 to-[#106E70] text-white font-bold rounded-2xl shadow-lg shadow-teal-500/25 flex items-center gap-2 text-xs transition hover:opacity-95"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Reserve OPD Slot</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/specialties"
                  className="px-5 py-3.5 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-2xl border border-white/20 backdrop-blur-md text-xs transition"
                >
                  <span>Explore Specialties</span>
                </Link>
              </div>
            </div>

            {/* Right Image Column: Official Medora Campus Artwork */}
            <div className="lg:col-span-6 relative h-full min-h-[360px] lg:min-h-[460px]">
              <img
                src="/medora-hero.jpg"
                alt="Medora Multi Speciality Hospital Campus & Faculty"
                className="w-full h-full object-cover object-center lg:object-left"
              />
              <div className="hidden lg:block absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#001428] via-[#001428]/60 to-transparent pointer-events-none" />

              {/* Floating Top Badge */}
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-slate-900 text-xs font-bold shadow-lg border border-white/60 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>NABH & JCI Gold Seal Campus</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. CLINICAL CENTRES OF EXCELLENCE (SPECIALIZED DEPARTMENTS)   */}
      {/* ============================================================== */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              Clinical Centres of Excellence
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#002043] mt-2.5 tracking-tight">
              Specialized Medical Departments
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-xl">
              Equipped with latest medical imaging, sterile laminar air-flow operating theatres, and round-the-clock intensive care.
            </p>
          </div>
          <Link
            to="/specialties"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#178B8B] hover:text-[#002043] transition"
          >
            <span>View All Specialties</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {specialtiesData.slice(0, 4).map((spec, index) => {
            const pastelAccents = [
              { bg: 'bg-[#e8faf5]', icon: 'text-teal-700' },
              { bg: 'bg-[#e8f4fd]', icon: 'text-blue-700' },
              { bg: 'bg-[#f0eeff]', icon: 'text-purple-700' },
              { bg: 'bg-[#e4f6f8]', icon: 'text-cyan-700' },
            ][index % 4];

            return (
              <div
                key={spec.id}
                className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs hover:shadow-xl hover:border-teal-300 hover:-translate-y-1 transition duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className={`w-12 h-12 rounded-2xl ${pastelAccents.bg} flex items-center justify-center ${pastelAccents.icon} mb-4 shadow-2xs`}>
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">{spec.name}</h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-3">
                    {spec.shortDesc}
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Head:</span>
                      <span className="font-semibold text-slate-800 truncate max-w-[140px]">{spec.headOfDept.split(',')[0]}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Capacity:</span>
                      <span className="font-medium text-slate-800">{spec.bedCapacity} Beds</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-800">{spec.doctorCount} Doctors</span>
                  <Link
                    to={`/appointments/book?dept=${spec.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-[#002043] transition"
                  >
                    <span>Book OPD</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================== */}
      {/* 6. CONSULTANT FACULTY ROSTER SEARCH                           */}
      {/* ============================================================== */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                Senior Consultants On Duty
              </span>
              <h3 className="text-2xl font-extrabold text-[#002043] mt-2 tracking-tight">
                Find Your Specialist
              </h3>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchDoctor}
                onChange={(e) => setSearchDoctor(e.target.value)}
                placeholder="Search consultant or department..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none focus:bg-white shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocs.slice(0, 3).map((doc) => (
              <div
                key={doc.id}
                className="rounded-3xl border border-slate-200/80 bg-white overflow-hidden shadow-xs hover:shadow-lg transition duration-200 flex flex-col justify-between"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <img
                      src={doc.imageUrl}
                      alt={doc.name}
                      className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shadow-2xs shrink-0"
                    />
                    <div>
                      <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 uppercase tracking-wide">
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

                  <div className="mt-4 pt-4 border-t border-slate-100 text-xs space-y-1.5 text-slate-600">
                    <p><span className="text-slate-400">Experience:</span> <span className="font-semibold text-slate-800">{doc.experienceYears}+ Years</span></p>
                    <p><span className="text-slate-400">OPD Room:</span> <span className="font-medium text-slate-800">{doc.opdRoom}</span></p>
                    <p><span className="text-slate-400">Schedule:</span> <span className="text-teal-700 font-medium">{doc.availability}</span></p>
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Fee</span>
                    <span className="text-base font-extrabold text-[#002043]">₹{doc.consultationFee}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/doctors/${doc.id}`}
                      className="px-3.5 py-1.5 border border-slate-300 text-slate-700 hover:text-[#002043] text-xs font-semibold rounded-xl transition"
                    >
                      Profile
                    </Link>
                    <Link
                      to={`/appointments/book?doctor=${doc.id}`}
                      className="px-4 py-1.5 bg-[#002043] hover:bg-[#17365d] text-white text-xs font-bold rounded-xl shadow-xs transition"
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
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-300 hover:border-teal-600 text-slate-800 font-bold text-xs rounded-2xl shadow-xs transition"
            >
              <span>Explore All Hospital Specialists</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 7. CAMPUS LOCATION & SYSTEM DESIGN LAB BANNER                  */}
      {/* ============================================================== */}
      <section className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="bg-[#002043] text-white rounded-3xl p-8 md:p-12 shadow-xl grid grid-cols-1 lg:grid-cols-3 gap-8 border border-white/10">
          <div>
            <div className="flex items-center gap-2 text-teal-300 text-xs font-bold uppercase tracking-wider mb-2">
              <MapPin className="w-4 h-4" />
              <span>Campus Location</span>
            </div>
            <h3 className="text-2xl font-bold">Medora Quaternary Campus</h3>
            <p className="text-slate-300 text-xs mt-3 leading-relaxed">
              No. 21 Medora, Off Anna Salai, Thousand Lights, Chennai, Tamil Nadu 600006. Located 4.2 km from Chennai Central Railway Station.
            </p>
            <div className="mt-6 flex flex-col gap-2 text-xs">
              <span className="text-slate-300">OPD Registration: 07:30 AM - 08:00 PM</span>
              <span className="text-slate-300">Emergency & Pharmacy: 24 Hours Open</span>
              <span className="text-teal-300 font-semibold">Valet Parking & Buggy Transport Available</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-teal-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Clock className="w-4 h-4" />
              <span>Patient Visiting Hours</span>
            </div>
            <h3 className="text-2xl font-bold">Inpatient & ICU Policies</h3>
            <p className="text-slate-300 text-xs mt-3 leading-relaxed">
              To safeguard infection control and recovery for our post-operative patients:
            </p>
            <div className="mt-4 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between border-b border-white/10 pb-1.5">
                <span>General Wards:</span>
                <span className="font-semibold text-white">04:30 PM - 07:00 PM</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-1.5">
                <span>Intensive Care (ICU/CCU):</span>
                <span className="font-semibold text-white">11:00 AM - 12:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span>Private Suites:</span>
                <span className="font-semibold text-white">10:00 AM - 08:00 PM</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 rounded-2xl p-6 border border-white/15 backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <Sparkles className="w-4 h-4" />
                <span>UCS3513 System Design Lab</span>
              </div>
              <h4 className="text-lg font-bold text-white mt-1.5">Hospital Distributed Architecture</h4>
              <p className="text-slate-300 text-xs mt-2 leading-relaxed">
                Explore real-time algorithmic telemetry powering Medora: Token Bucket Rate Limiting, Consistent Hash Ring partition, and Distributed Autocomplete Trie.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-white/15 flex items-center justify-between">
              <span className="text-xs text-teal-300 font-semibold">7 Interactive Labs</span>
              <Link
                to="/lab/rate-limiter"
                className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold rounded-xl transition"
              >
                Launch Lab →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
