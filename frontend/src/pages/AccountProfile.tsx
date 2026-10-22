import { Link } from 'react-router-dom';
import { User, ShieldCheck, Mail, Phone, Hash, ArrowLeft, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AccountProfile() {
  const { user } = useAuth();
  if (!user) return null;

  const roleName = user.role.replace('_', ' ');
  const fields = [
    { label: 'Full Legal Name', value: user.name, icon: User },
    { label: 'Email Address', value: user.email, icon: Mail },
    { label: 'Verified Role', value: roleName, icon: ShieldCheck, badge: true },
    { label: 'Phone Number', value: user.phone || 'Not provided', icon: Phone },
    { label: 'Patient UHID', value: user.uhid || 'Assigned on Admission', icon: Hash },
    { label: 'Account ID', value: user.id, icon: Hash },
  ];

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <section className="max-w-3xl mx-auto px-4 md:px-8 py-12 space-y-6 animate-fade-in">
      <header className="flex items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            Authenticated Profile
          </span>
          <h1 className="text-3xl font-extrabold text-[#002043] mt-2 tracking-tight">Account &amp; Role Settings</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Profile metadata verified by Medora Identity Provider.</p>
        </div>
      </header>

      {/* Profile Card (Frosted Glass) */}
      <div className="rounded-3xl border border-white/80 bg-white/85 backdrop-blur-xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-[#002043] text-white flex items-center justify-center text-xl font-black shadow-md">
            {getInitials(user.name)}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user.name}</h2>
            <p className="text-xs text-slate-500">{user.email}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[10px] font-bold uppercase tracking-wider border border-teal-200">
              {roleName}
            </span>
          </div>
        </div>

        <dl className="divide-y divide-slate-100">
          {fields.map((field) => {
            const Icon = field.icon;
            return (
              <div key={field.label} className="grid sm:grid-cols-[14rem_1fr] gap-2 py-3.5 items-center">
                <dt className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                  <Icon className="w-4 h-4 text-teal-600" />
                  <span>{field.label}</span>
                </dt>
                <dd className="text-xs font-bold text-slate-800 break-all">
                  {field.badge ? (
                    <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 text-[10px] uppercase tracking-wide border border-teal-200">
                      {field.value}
                    </span>
                  ) : (
                    field.value
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-teal-800 text-xs font-bold transition shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return Home</span>
        </Link>
        <Link
          to="/appointments/book"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#002043] hover:bg-[#17365d] text-white text-xs font-bold transition shadow-xs"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Book Consultation</span>
        </Link>
      </div>
    </section>
  );
}
