import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HeartPulse, Brain, Bone, Activity, Stethoscope,
  Baby, ShieldAlert, ActivitySquare, Search, ArrowRight
} from 'lucide-react';
import { specialtiesData } from '../data/specialties';
import AutocompleteSearch from '../components/AutocompleteSearch';

export default function Specialties() {
  const [search, setSearch] = useState('');

  const filtered = specialtiesData.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.shortDesc.toLowerCase().includes(search.toLowerCase()) ||
      s.commonConditions.some((c) => c.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch;
  });

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'HeartPulse': return <HeartPulse className="w-6 h-6 text-rose-500" />;
      case 'Brain': return <Brain className="w-6 h-6 text-purple-600" />;
      case 'Bone': return <Bone className="w-6 h-6 text-amber-600" />;
      case 'Activity': return <Activity className="w-6 h-6 text-teal-600" />;
      case 'ActivitySquare': return <ActivitySquare className="w-6 h-6 text-sky-600" />;
      case 'Baby': return <Baby className="w-6 h-6 text-indigo-600" />;
      case 'ShieldAlert': return <ShieldAlert className="w-6 h-6 text-red-500" />;
      default: return <Stethoscope className="w-6 h-6 text-teal-600" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-10 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#002043] via-[#002b54] to-[#178B8B] text-white p-8 md:p-12 rounded-3xl shadow-xl border border-white/10">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-teal-400/30">
          Medora Quaternary Referral Campus
        </span>
        <h1 className="text-3xl md:text-5xl font-extrabold mt-3 tracking-tight">
          Clinical Specialties &amp; Centres of Excellence
        </h1>
        <p className="text-slate-200 text-xs sm:text-base mt-2 max-w-2xl leading-relaxed">
          Quaternary medical and surgical departments equipped with Da Vinci robotic suites, catheterization laboratories, and sterile ICU wards.
        </p>

        {/* Search */}
        <AutocompleteSearch
          value={search}
          onChange={setSearch}
          onSelect={(suggestion) => {
            setSearch(suggestion.text);
            const element = document.getElementById(suggestion.id) || document.getElementById(
              specialtiesData.find((item) => item.name.toLowerCase() === suggestion.text.toLowerCase())?.id || ''
            );
            element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          allowedTypes={['DEPARTMENT', 'SPECIALIZATION']}
          placeholder="Search symptoms or departments (e.g. stroke, arrhythmia, robotic knee, asthma)..."
          className="mt-8 max-w-xl"
          inputClassName="bg-white rounded-2xl py-3 text-sm"
        />
      </div>

      {/* Specialties Grid (Frosted Glass Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filtered.map((spec) => (
          <div
            id={spec.id}
            key={spec.id}
            className="rounded-3xl border border-white/80 bg-white/85 backdrop-blur-xl p-8 shadow-sm hover:shadow-lg hover:border-teal-400 transition flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-teal-50/80 border border-teal-100 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    {getIcon(spec.iconName)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-teal-800 transition">
                      {spec.name}
                    </h3>
                    <p className="text-xs text-teal-700 font-semibold">{spec.doctorCount} Senior Consultants</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-slate-100/90 text-slate-700 text-xs font-bold rounded-full border border-slate-200/60">
                  {spec.bedCapacity} Beds
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 mt-4 leading-relaxed">
                {spec.fullDesc}
              </p>

              {/* Head of department */}
              <div className="mt-5 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 text-xs text-slate-700">
                <span className="text-slate-400 block font-semibold text-[10px] uppercase tracking-wider">
                  Head of Clinical Department
                </span>
                <span className="font-bold text-slate-900 mt-0.5 block">{spec.headOfDept}</span>
              </div>

              {/* Conditions treated */}
              <div className="mt-5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Specialized Focus Areas &amp; Conditions
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {spec.commonConditions.map((cond, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-teal-50/80 text-teal-900 text-xs font-semibold border border-teal-200/60"
                    >
                      {cond}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between">
              <Link
                to={`/doctors?specialty=${encodeURIComponent(spec.name)}`}
                className="text-xs font-bold text-slate-700 hover:text-teal-800 flex items-center gap-1.5 transition"
              >
                <span>View Department Specialists</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                to={`/appointments/book?specialty=${encodeURIComponent(spec.name)}`}
                className="px-4 py-2 bg-[#002043] hover:bg-[#17365d] text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                Book OPD Visit
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
