import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Lock, User, Mail, ArrowRight, Phone, Calendar, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth, UserRole } from '../context/AuthContext';
import { api } from '../services/api';

const DEMO_PASSWORD = 'Aarogya#2026Secure';
const demoAccounts = [
  { label: 'System Administrator', role: 'Admin', email: 'admin@aarogyacare.org', badge: 'bg-navy-100 text-slate-800' },
  { label: 'Dr. Ramanathan Sundaram', role: 'Doctor', email: 'dr.ramanathan@aarogyacare.org', badge: 'bg-teal-50 text-teal-800' },
  { label: 'Dr. Ananya Sharma', role: 'Doctor', email: 'dr.ananya@aarogyacare.org', badge: 'bg-teal-50 text-teal-800' },
  { label: 'Dr. Rajesh Kumar', role: 'Doctor', email: 'dr.rajesh@aarogyacare.org', badge: 'bg-teal-50 text-teal-800' },
  { label: 'Dr. Priya Venkatesh', role: 'Doctor', email: 'dr.priya@aarogyacare.org', badge: 'bg-teal-50 text-teal-800' },
  { label: 'Front Desk Officer', role: 'Receptionist', email: 'receptionist@aarogyacare.org', badge: 'bg-amber-50 text-amber-800' },
  { label: 'Head Triage Nurse', role: 'Nurse', email: 'nurse@aarogyacare.org', badge: 'bg-emerald-50 text-emerald-800' },
  { label: 'Senior Clinical Pharmacist', role: 'Pharmacist', email: 'pharmacist@aarogyacare.org', badge: 'bg-purple-50 text-purple-800' },
  { label: 'Chief Billing Officer', role: 'Billing', email: 'billing@aarogyacare.org', badge: 'bg-sky-50 text-sky-800' },
  { label: 'Rajendran Muthusamy', role: 'Patient', email: 'patient.rajendran@aarogyacare.org', badge: 'bg-blue-50 text-blue-800' },
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
  const [dob, setDob] = useState('');
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
        ? await api.register({
            email: email.trim(),
            password,
            full_name: fullName.trim(),
            phone: phone.trim() || undefined,
            date_of_birth: dob ? dob.trim() : undefined,
          })
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
    <div className="relative min-h-[calc(100vh-120px)] flex items-center justify-center py-12 md:py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Hospital Hero Image with Cinematic Overlay */}
      <div className="absolute inset-0 z-0 select-none">
        <img
          src="/medora-hero.jpg"
          alt="Medora Hospital Campus Background"
          className="w-full h-full object-cover object-center filter brightness-[0.70] contrast-[1.05]"
        />
        {/* Dual Gradient Scrim: Deep navy and teal tone overlay to guarantee crystal-clear contrast and readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#001428]/85 via-[#002043]/80 to-[#001730]/90 backdrop-blur-[3px]" />

        {/* Soft ambient radial glow spots */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-teal-500/15 blur-3xl pointer-events-none animate-float-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[420px] h-[420px] rounded-full bg-sky-500/15 blur-3xl pointer-events-none animate-float-medium" />
      </div>

      {/* Foreground Auth Container */}
      <div className="relative z-10 w-full max-w-xl mx-auto space-y-6 animate-fade-in">
        {/* Title Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-teal-200 text-xs font-bold shadow-lg">
            <ShieldCheck className="w-4 h-4 text-teal-300" />
            <span>Medora Digital Hospital Authentication</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-sm">
            {isRegistering ? 'Create Your Patient Account' : 'Sign In to Medora Portal'}
          </h1>
          <p className="text-slate-200 text-xs sm:text-sm max-w-md mx-auto leading-relaxed drop-shadow-xs">
            {isRegistering
              ? 'Register to view clinical summaries, track appointments, and access digital prescriptions.'
              : 'Access clinical consultations, appointments, medical records, and billing with role-based access.'}
          </p>
        </div>

        {/* Main Glassmorphic Auth Card */}
        <div
          className="rounded-3xl p-6 sm:p-10 border border-white/60 bg-white/92 backdrop-blur-2xl shadow-2xl transition-all"
          style={{
            boxShadow: '0 30px 70px -15px rgba(0, 20, 40, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.8), inset 0 1px 2px rgba(255, 255, 255, 0.95)',
          }}
        >
          {authError && (
            <div
              role="alert"
              className="mb-5 rounded-2xl border border-rose-300 bg-rose-50/95 px-4 py-3 text-xs font-semibold text-rose-900 animate-slide-up flex items-start gap-2.5 shadow-sm"
            >
              <span className="text-rose-600 font-bold">●</span>
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={authenticate} className="space-y-4">
            {isRegistering && (
              <>
                <div>
                  <label htmlFor="full-name" className="text-xs font-bold text-slate-800 block mb-1.5 uppercase tracking-wide">
                    Full Legal Name
                  </label>
                  <div className="relative">
                    <User aria-hidden="true" className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="full-name"
                      type="text"
                      autoComplete="name"
                      required
                      placeholder="e.g. Sivasankari Muthusamy"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/85 border border-slate-200/90 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white focus:border-transparent transition shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="text-xs font-bold text-slate-800 block mb-1.5 uppercase tracking-wide">
                    Phone Number <span className="font-normal text-slate-400 lowercase">(optional)</span>
                  </label>
                  <div className="relative">
                    <Phone aria-hidden="true" className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/85 border border-slate-200/90 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white focus:border-transparent transition shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="dob" className="text-xs font-bold text-slate-800 block mb-1.5 uppercase tracking-wide">
                    Date of Birth
                  </label>
                  <input
                    id="dob"
                    type="date"
                    required
                    max={new Date().toISOString().slice(0, 10)}
                    value={dob}
                    onChange={(event) => setDob(event.target.value)}
                    className="w-full px-4 py-3 bg-white/85 border border-slate-200/90 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white focus:border-transparent transition shadow-xs"
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="text-xs font-bold text-slate-800 block mb-1.5 uppercase tracking-wide">
                Hospital Registered Email
              </label>
              <div className="relative">
                <Mail aria-hidden="true" className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@aarogyacare.org or patient@domain.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/85 border border-slate-200/90 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white focus:border-transparent transition shadow-xs"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="text-xs font-bold text-slate-800 block mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <Lock aria-hidden="true" className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="password"
                  type="password"
                  autoComplete={isRegistering ? 'new-password' : 'current-password'}
                  minLength={isRegistering ? 8 : undefined}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/85 border border-slate-200/90 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white focus:border-transparent transition shadow-xs"
                />
              </div>
              {isRegistering && <p className="mt-1 text-[11px] text-slate-500 font-medium">Must be at least 8 characters.</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full py-3.5 bg-gradient-to-r from-teal-500 via-teal-600 to-[#002043] hover:from-teal-600 hover:to-[#0f2c52] disabled:opacity-60 text-white text-sm font-bold rounded-xl shadow-lg shadow-teal-500/25 transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
            >
              <span>
                {isSubmitting
                  ? isRegistering
                    ? 'Creating patient account…'
                    : 'Authenticating…'
                  : isRegistering
                  ? 'Create Patient Account'
                  : 'Sign In to Portal'}
              </span>
              <ArrowRight className="w-4 h-4 text-teal-200" />
            </button>
          </form>

          {/* Demo Account Autofill Accordion */}
          {!isRegistering && (
            <details className="mt-6 rounded-2xl border border-slate-200/90 bg-slate-50/90 overflow-hidden shadow-xs">
              <summary className="cursor-pointer px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#002043] hover:bg-slate-100/70 transition focus:outline-none focus:ring-2 focus:ring-teal-500 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>Instant Demo Account Fill (1-Click)</span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium lowercase">click to expand</span>
              </summary>
              <div className="border-t border-slate-200/90 p-4 space-y-3 bg-white/70">
                <p className="text-[11px] text-slate-600">
                  Synthetic seed accounts for local evaluation. Standard password:{' '}
                  <code className="font-mono font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60">{DEMO_PASSWORD}</code>
                </p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {demoAccounts.map((account) => (
                    <button
                      key={account.email}
                      type="button"
                      onClick={() => autofillDemoAccount(account.email)}
                      className="flex items-start justify-between gap-2 p-2.5 rounded-xl border border-slate-200/90 bg-white text-left hover:border-teal-400 hover:bg-teal-50/60 hover:shadow-xs transition"
                    >
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-slate-900 truncate">{account.label}</span>
                        <span className="block text-[10px] text-slate-500 truncate">{account.email}</span>
                      </div>
                      <span className="shrink-0 rounded-md bg-teal-100/70 text-teal-800 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                        {account.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </details>
          )}

          <div className="pt-6 mt-6 border-t border-slate-200/80 text-center text-xs text-slate-700 font-medium">
            {isRegistering ? 'Already registered with Medora? ' : 'New patient to Medora? '}
            <button
              type="button"
              onClick={switchMode}
              className="text-teal-700 hover:text-teal-900 font-bold hover:underline focus:outline-none focus:ring-2 focus:ring-teal-500 rounded"
            >
              {isRegistering ? 'Sign In Instead' : 'Register a Patient Account'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-300 drop-shadow-xs">
          <Link to="/doctors" className="text-teal-200 hover:text-white font-semibold underline transition">
            Browse Doctor Directory as a Guest →
          </Link>
        </p>
      </div>
    </div>
  );
}
