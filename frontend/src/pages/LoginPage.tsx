import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/api';
import { UserRole } from '../types';

interface LoginPageProps {
  onLoginSuccess: (role: UserRole) => void;
}

interface QuickPersona {
  role: UserRole;
  label: string;
  name: string;
  email: string;
  icon: string;
  dept: string;
}

const DEMO_PERSONAS: QuickPersona[] = [
  { role: 'patient', label: 'Patient', name: 'S. Rajendran', email: 'patient.rajendran@aarogyacare.org', icon: 'person', dept: 'UHID: AC-2024-9104' },
  { role: 'doctor', label: 'Doctor (OPD)', name: 'Dr. Priya Sundaram', email: 'dr.priya@aarogyacare.org', icon: 'stethoscope', dept: 'Cardiology (Chamber 04)' },
  { role: 'pharmacist', label: 'Chief Pharmacist', name: 'Suresh Pharmacist', email: 'pharmacist@aarogyacare.org', icon: 'medication', dept: 'Central Dispensary' },
  { role: 'billing_staff', label: 'Billing Desk', name: 'Ramesh Billing', email: 'billing@aarogyacare.org', icon: 'receipt_long', dept: 'Cashier & Invoicing' },
  { role: 'nurse', label: 'Triage Nurse', name: 'Sister Deepa', email: 'nurse@aarogyacare.org', icon: 'vital_signs', dept: 'Emergency Triage Bay' },
  { role: 'receptionist', label: 'Receptionist', name: 'Anita Desk Officer', email: 'receptionist@aarogyacare.org', icon: 'desk', dept: 'Outpatient Front Desk' },
  { role: 'admin', label: 'System Admin', name: 'System Administrator', email: 'admin@aarogyacare.org', icon: 'admin_panel_settings', dept: 'Executive IT & Telemetry' },
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawRedirect = searchParams.get('redirect');
  // Prevent open redirect vulnerabilities: only allow relative paths starting with a single '/'
  const redirectTarget = (rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')) 
    ? rawRedirect 
    : null;

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Validate form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Client-side validation
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email address and password.');
      return;
    }

    if (mode === 'REGISTER' && !fullName.trim()) {
      setErrorMsg('Full name is required for patient registration.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'LOGIN') {
        const res = await authService.login(email.trim(), password);
        if (res.success && res.user) {
          setSuccessMsg(`Welcome back, ${res.user.fullName}! Redirecting to portal...`);
          onLoginSuccess(res.user.role);
          const defaultDest = res.user.role === 'patient' ? '/patient-portal' : '/staff/operations';
          const destination = redirectTarget || defaultDest;
          setTimeout(() => {
            navigate(destination);
          }, 450);
        } else {
          setErrorMsg(res.error || 'Authentication failed. Please verify your email and password.');
        }
      } else {
        const res = await authService.register({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          phone: phone.trim() || undefined
        });
        if (res.success && res.user) {
          setSuccessMsg(`Account created successfully! Welcome, ${res.user.fullName}`);
          onLoginSuccess(res.user.role);
          const destination = redirectTarget || '/patient-portal';
          setTimeout(() => {
            navigate(destination);
          }, 450);
        } else {
          setErrorMsg(res.error || 'Registration failed. An account with this email may already exist.');
        }
      }
    } catch {
      setErrorMsg('Network error connecting to Aarogya Care authentication service.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Persona Authentication (DEV Only - Strictly authenticates through backend API)
  const handleSelectPersona = async (persona: QuickPersona) => {
    setEmail(persona.email);
    setPassword('Aarogya#2026Secure');
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const res = await authService.login(persona.email, 'Aarogya#2026Secure');
      if (res.success && res.user) {
        setSuccessMsg(`Authenticated as ${res.user.fullName} (${persona.label})`);
        onLoginSuccess(res.user.role);
        const defaultDest = res.user.role === 'patient' ? '/patient-portal' : '/staff/operations';
        const destination = redirectTarget || defaultDest;
        setTimeout(() => {
          navigate(destination);
        }, 400);
      } else {
        setErrorMsg(`Unable to authenticate demo persona: ${res.error || 'Invalid credentials'}`);
      }
    } catch {
      setErrorMsg('Authentication service unreachable.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-low flex flex-col justify-center py-12 sm:px-6 lg:px-8 antialiased">
      {/* Return home link */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 mb-4">
        <Link
          to="/"
          id="return-home-link"
          className="inline-flex items-center gap-1.5 text-body-sm text-on-surface-variant hover:text-primary transition-colors font-medium group"
        >
          <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">
            arrow_back
          </span>
          <span>Back to Hospital Home</span>
        </Link>
      </div>

      {/* Main Login Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-surface-container-lowest py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-surface-container-high">
          {/* Brand Header */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-flex items-center gap-3 justify-center group mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm group-hover:bg-secondary transition-colors">
                <span className="material-symbols-outlined text-[28px]">local_hospital</span>
              </div>
              <div className="text-left">
                <span className="font-brand font-bold text-[22px] text-primary tracking-tight leading-none block">
                  Aarogya Care
                </span>
                <span className="text-[12px] font-medium text-on-surface-variant uppercase tracking-wider block mt-1">
                  Multispecialty Hospital
                </span>
              </div>
            </Link>

            <h1 className="text-headline-sm font-bold text-primary tracking-tight mt-2">
              {mode === 'LOGIN' ? 'Welcome back' : 'Register Patient Account'}
            </h1>
            <p className="text-body-sm text-on-surface-variant mt-1.5">
              {mode === 'LOGIN' 
                ? 'Sign in to access your confidential EHR medical records, consultant scheduling, or hospital operations hub.'
                : 'Create a synthetic patient profile for real-time OPD appointments and clinical records.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-surface-container-high mb-6">
            <button
              type="button"
              id="login-mode-btn"
              onClick={() => { setMode('LOGIN'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 py-2 text-center text-title-sm font-semibold transition-all border-b-2 ${
                mode === 'LOGIN'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              id="register-mode-btn"
              onClick={() => { setMode('REGISTER'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 py-2 text-center text-title-sm font-semibold transition-all border-b-2 ${
                mode === 'REGISTER'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              New Patient
            </button>
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div 
              role="alert"
              id="login-error-alert"
              className="mb-5 p-3 rounded-xl bg-error-container text-on-error-container text-body-sm flex items-start gap-2.5 animate-fadeIn border border-error/20"
            >
              <span className="material-symbols-outlined text-[20px] text-error shrink-0">error</span>
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {/* Success Message Alert */}
          {successMsg && (
            <div 
              role="status"
              id="login-success-alert"
              className="mb-5 p-3 rounded-xl bg-secondary/10 border border-secondary text-secondary text-body-sm flex items-start gap-2.5 animate-fadeIn"
            >
              <span className="material-symbols-outlined text-[20px] text-secondary shrink-0">check_circle</span>
              <div className="flex-1 font-medium">{successMsg}</div>
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {mode === 'REGISTER' && (
              <div>
                <label 
                  htmlFor="register-fullname"
                  className="block text-label-md font-semibold text-on-surface mb-1.5"
                >
                  Full Name <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <input
                    id="register-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. S. Rajendran"
                    required
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface text-body-sm border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-on-surface-variant/60"
                  />
                </div>
              </div>
            )}

            <div>
              <label 
                htmlFor="login-email"
                className="block text-label-md font-semibold text-on-surface mb-1.5"
              >
                Email Address <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@aarogyacare.org"
                  autoComplete="email"
                  required
                  className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface text-body-sm border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-on-surface-variant/60"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label 
                  htmlFor="login-password"
                  className="block text-label-md font-semibold text-on-surface"
                >
                  Password <span className="text-error">*</span>
                </label>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete={mode === 'LOGIN' ? 'current-password' : 'new-password'}
                  required
                  className="w-full h-11 pl-3.5 pr-11 rounded-xl bg-surface-container-low text-on-surface text-body-sm border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-on-surface-variant/60 font-sans"
                />
                <button
                  type="button"
                  id="password-visibility-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-0 top-0 bottom-0 px-3 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {mode === 'REGISTER' && (
              <div>
                <label 
                  htmlFor="register-phone"
                  className="block text-label-md font-semibold text-on-surface mb-1.5"
                >
                  Contact Phone (Optional)
                </label>
                <input
                  id="register-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98401 22314"
                  className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface text-body-sm border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-on-surface-variant/60"
                />
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                id="login-submit-btn"
                disabled={isLoading}
                className="w-full h-11 rounded-xl bg-primary text-white font-title-sm hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all shadow-md active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading && (
                  <span className="material-symbols-outlined text-[18px] animate-spin">
                    progress_activity
                  </span>
                )}
                <span>
                  {isLoading 
                    ? 'Verifying Credentials...' 
                    : mode === 'LOGIN' ? 'Sign In' : 'Create Account'}
                </span>
              </button>
            </div>
          </form>

          {/* Quick Demo Personas (Academic Demo - Only rendered in DEV mode) */}
          {import.meta.env.DEV && (
            <div className="mt-8 pt-6 border-t border-surface-container-high">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                  Synthetic Test Personas (Academic RBAC)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono">
                  DEV ONLY
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant mb-3 leading-relaxed">
                Click any role to authenticate automatically with verified synthetic credentials. Roles are enforced strictly by backend JWT verification.
              </p>

              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {DEMO_PERSONAS.map((p) => (
                  <button
                    key={p.role}
                    type="button"
                    onClick={() => handleSelectPersona(p)}
                    disabled={isLoading}
                    className="p-2 rounded-xl text-left bg-surface-container-low hover:bg-surface-container border border-surface-container-high hover:border-secondary transition-all flex flex-col justify-between group disabled:opacity-50"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-primary group-hover:text-secondary transition-colors">
                        {p.icon}
                      </span>
                      <span className="text-title-sm font-semibold text-primary truncate group-hover:text-secondary">
                        {p.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-on-surface-variant truncate mt-1">
                      {p.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Security & PHI notice */}
          <div className="mt-6 pt-4 border-t border-surface-container-high/60 text-center">
            <p className="text-[11px] text-on-surface-variant leading-tight">
              Protected Health Information (PHI) portal. Session tokens expire after 24 hours. All access events are cryptographically recorded in the system audit trail.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
