import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Lock, User, Mail, ArrowRight, Phone } from 'lucide-react';
import { useAuth, UserRole } from '../context/AuthContext';
import { api } from '../services/api';

const DEMO_PASSWORD = 'Aarogya#2026Secure';
const demoAccounts = [
  { label: 'System Administrator', role: 'Admin', email: 'admin@aarogyacare.org' },
  { label: 'Dr. Ramanathan Sundaram', role: 'Doctor', email: 'dr.ramanathan@aarogyacare.org' },
  { label: 'Dr. Ananya Sharma', role: 'Doctor', email: 'dr.ananya@aarogyacare.org' },
  { label: 'Dr. Rajesh Kumar', role: 'Doctor', email: 'dr.rajesh@aarogyacare.org' },
  { label: 'Dr. Priya Venkatesh', role: 'Doctor', email: 'dr.priya@aarogyacare.org' },
  { label: 'Front Desk Officer', role: 'Receptionist', email: 'receptionist@aarogyacare.org' },
  { label: 'Head Triage Nurse', role: 'Nurse', email: 'nurse@aarogyacare.org' },
  { label: 'Senior Clinical Pharmacist', role: 'Pharmacist', email: 'pharmacist@aarogyacare.org' },
  { label: 'Chief Billing Officer', role: 'Billing', email: 'billing@aarogyacare.org' },
  { label: 'Rajendran Muthusamy', role: 'Patient', email: 'patient.rajendran@aarogyacare.org' },
];

const dashboards: Record<UserRole, string> = {
  PATIENT: '/portal/dashboard',
  DOCTOR: '/clinical/workspace',
  NURSE: '/nursing/station',
  RECEPTIONIST: '/reception',
  PHARMACIST: '/pharmacy',
  BILLING_STAFF: '/billing/desk',
  ADMIN: '/admin',
};

export default function Login() {
  const [searchParams] = useSearchParams();
  const [isRegistering, setIsRegistering] = useState(() => searchParams.get('mode') === 'register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo;
  const safeReturnTo = returnTo?.startsWith('/') && !returnTo.startsWith('//') ? returnTo : undefined;

  useEffect(() => {
    if (!loading && user) navigate(safeReturnTo || dashboards[user.role], { replace: true });
  }, [loading, navigate, safeReturnTo, user]);

  const authenticate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError('');
    setIsSubmitting(true);
    try {
      const response = isRegistering
        ? await api.register({ email: email.trim(), password, full_name: fullName.trim(), phone: phone.trim() || undefined })
        : await api.login(email.trim(), password);
      if (!response?.access_token) throw new Error('The server did not return an access token.');
      const verifiedUser = await login(response.access_token);
      navigate(safeReturnTo || dashboards[verifiedUser.role], { replace: true });
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = () => {
    setIsRegistering((value) => !value);
    setAuthError('');
  };

  const autofillDemoAccount = (accountEmail: string) => {
    setIsRegistering(false);
    setEmail(accountEmail);
    setPassword(DEMO_PASSWORD);
    setAuthError('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold"><ShieldCheck className="w-4 h-4 text-teal-600" />Aarogya Care Authentication</div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#002043]">{isRegistering ? 'Create a Patient Account' : 'Sign In to Your Account'}</h1>
        <p className="text-slate-500 text-sm max-w-md mx-auto">{isRegistering ? 'Patient registration creates an account with the hospital service.' : 'Sign in with your registered account. Your access is determined by your verified hospital role.'}</p>
      </div>

      <div className="max-w-xl mx-auto bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-lg">
        {authError && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{authError}</div>}
        <form onSubmit={authenticate} className="space-y-4">
          {isRegistering && <>
            <div><label htmlFor="full-name" className="text-sm font-semibold text-slate-700 block mb-1">Full name</label><div className="relative"><User aria-hidden="true" className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" /><input id="full-name" type="text" autoComplete="name" required value={fullName} onChange={(event) => setFullName(event.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002043]" /></div></div>
            <div><label htmlFor="phone" className="text-sm font-semibold text-slate-700 block mb-1">Phone <span className="font-normal text-slate-500">(optional)</span></label><div className="relative"><Phone aria-hidden="true" className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" /><input id="phone" type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002043]" /></div></div>
          </>}
          <div><label htmlFor="email" className="text-sm font-semibold text-slate-700 block mb-1">Email address</label><div className="relative"><Mail aria-hidden="true" className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" /><input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002043]" /></div></div>
          <div><label htmlFor="password" className="text-sm font-semibold text-slate-700 block mb-1">Password</label><div className="relative"><Lock aria-hidden="true" className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" /><input id="password" type="password" autoComplete={isRegistering ? 'new-password' : 'current-password'} minLength={isRegistering ? 8 : undefined} required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002043]" /></div>{isRegistering && <p className="mt-1 text-xs text-slate-500">Use at least 8 characters.</p>}</div>
          <button type="submit" disabled={isSubmitting || loading} className="w-full py-3 bg-[#002043] hover:bg-[#17365d] disabled:opacity-60 text-white text-sm font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"><span>{isSubmitting ? (isRegistering ? 'Creating account…' : 'Signing in…') : (isRegistering ? 'Create Patient Account' : 'Sign In')}</span><ArrowRight className="w-4 h-4 text-teal-300" /></button>
        </form>

        {!isRegistering && <details className="mt-5 rounded-xl border border-slate-200 bg-slate-50">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[#002043] focus:outline-none focus:ring-2 focus:ring-teal-600 rounded-xl">Demo account autofill</summary>
          <div className="border-t border-slate-200 px-4 py-3 space-y-3">
            <p className="text-xs text-slate-600">Synthetic seeded accounts for local evaluation. Shared password: <code className="font-mono font-semibold text-slate-800">{DEMO_PASSWORD}</code></p>
            <div className="grid sm:grid-cols-2 gap-2">
              {demoAccounts.map((account) => <button key={account.email} type="button" onClick={() => autofillDemoAccount(account.email)} className="flex items-start justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left hover:border-teal-500 hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-600">
                <span><span className="block text-xs font-semibold text-slate-800">{account.label}</span><span className="block text-[11px] text-slate-500">{account.email}</span></span>
                <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">{account.role}</span>
              </button>)}
            </div>
            <p className="text-[11px] text-slate-500">Selecting an account only fills the form. Sign in still verifies credentials with the backend and applies that account’s actual permissions.</p>
          </div>
        </details>}

        <div className="pt-5 mt-5 border-t border-slate-100 text-center text-sm text-slate-600">
          {isRegistering ? 'Already registered? ' : 'New patient? '}
          <button type="button" onClick={switchMode} className="text-teal-800 font-bold hover:underline focus:outline-none focus:ring-2 focus:ring-teal-600 rounded">{isRegistering ? 'Sign in' : 'Create a patient account'}</button>
        </div>
        <p className="mt-4 text-xs text-slate-500 text-center">Staff accounts are provisioned by an administrator. Selecting a role does not grant access.</p>
      </div>
      <p className="text-center text-sm text-slate-600"><Link to="/doctors" className="text-teal-800 font-semibold hover:underline">Browse doctors as a guest</Link></p>
    </div>
  );
}