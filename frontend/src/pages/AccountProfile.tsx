import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AccountProfile() {
  const { user } = useAuth();
  if (!user) return null;

  const roleName = user.role.replace('_', ' ');
  const fields = [
    { label: 'Full name', value: user.name },
    { label: 'Email address', value: user.email },
    { label: 'Role', value: roleName },
    { label: 'Phone', value: user.phone || 'Not provided' },
    { label: 'Account ID', value: user.id },
  ];

  return (
    <section className="max-w-3xl mx-auto px-4 md:px-8 py-10 space-y-6">
      <header>
        <p className="text-xs font-bold uppercase text-teal-700">Account</p>
        <h1 className="text-3xl font-extrabold text-[#002043] mt-1">My Profile</h1>
        <p className="text-sm text-slate-600 mt-2">Profile information verified by Aarogya Care.</p>
      </header>
      <dl className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
        {fields.map((field) => <div key={field.label} className="grid sm:grid-cols-[12rem_1fr] gap-1 px-5 py-4">
          <dt className="text-sm text-slate-500">{field.label}</dt>
          <dd className="text-sm font-semibold text-slate-800 break-all">{field.value}</dd>
        </div>)}
      </dl>
      <p className="text-xs text-slate-500">Profile editing is not available in this application.</p>
      <Link to="/" className="inline-flex px-4 py-2 rounded-lg bg-[#002043] text-white text-sm font-semibold hover:bg-[#17365d]">Return Home</Link>
    </section>
  );
}
