import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  HeartPulse, Brain, Bone, Activity, Stethoscope, 
  Baby, ShieldAlert, ActivitySquare, Search, ArrowRight, CheckCircle2 
} from 'lucide-react';
import { specialtiesData } from '../data/specialties';

export default function Specialties() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filtered = specialtiesData.filter((s) => {
    const matchesSearch = 
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.shortDesc.toLowerCase().includes(search.toLowerCase()) ||
      s.commonConditions.some(c => c.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch;
  });

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'HeartPulse': return <HeartPulse className="w-6 h-6 text-rose-500" />;
      case 'Brain': return <Brain className="w-6 h-6 text-purple-500" />;
      case 'Bone': return <Bone className="w-6 h-6 text-amber-500" />;
      case 'Activity': return <Activity className="w-6 h-6 text-emerald-500" />;
      case 'ActivitySquare': return <ActivitySquare className="w-6 h-6 text-sky-500" />;
      case 'Baby': return <Baby className="w-6 h-6 text-indigo-500" />;
      case 'ShieldAlert': return <ShieldAlert className="w-6 h-6 text-red-500" />;
      default: return <Stethoscope className="w-6 h-6 text-teal-500" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#002043] to-[#17365d] text-white p-8 md:p-12 rounded-3xl shadow-xl">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-teal-500/20 px-3 py-1 rounded-full border border-teal-400/30">
          Medora • Medora Campus
        </span>
        <h1 className="text-3xl md:text-5xl font-extrabold mt-3 tracking-tight">
          Clinical Specialties & Centers
        </h1>
        <p className="text-slate-300 text-sm md:text-base mt-2 max-w-2xl leading-relaxed">
          Quaternary medical and surgical departments with state-of-the-art robotic suites, dedicated intensive care units, and clinical research fellowships.
        </p>

        {/* Search */}
        <div className="mt-8 max-w-xl relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search condition (e.g. stroke, arrhythmia, arthritis, asthma) or department..."
            className="w-full pl-11 pr-4 py-3 bg-white text-slate-800 rounded-xl shadow-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
        </div>
      </div>

      {/* Specialties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filtered.map((spec) => (
          <div
            id={spec.id}
            key={spec.id}
            className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-lg hover:border-teal-400 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-xs">
                    {getIcon(spec.iconName)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{spec.name}</h3>
                    <p className="text-xs text-teal-700 font-semibold">{spec.doctorCount} Senior Consultants</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
                  {spec.bedCapacity} Beds
                </span>
              </div>

              <p className="text-sm text-slate-600 mt-4 leading-relaxed">
                {spec.fullDesc}
              </p>

              {/* Head of department */}
              <div className="mt-5 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700">
                <span className="text-slate-400 block font-medium">Head of Clinical Department</span>
                <span className="font-bold text-slate-900 mt-0.5 block">{spec.headOfDept}</span>
              </div>

              {/* Conditions treated */}
              <div className="mt-5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">
                  Specialized Focus Areas & Conditions
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {spec.commonConditions.map((cond, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 text-xs font-medium border border-teal-200/60"
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
                className="text-xs font-semibold text-slate-700 hover:text-[#002043] flex items-center gap-1.5"
              >
                <span>View Department Doctors</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                to={`/appointments/book?specialty=${encodeURIComponent(spec.name)}`}
                className="px-4 py-2 bg-[#002043] hover:bg-[#17365d] text-white text-xs font-bold rounded-xl shadow-sm transition"
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
