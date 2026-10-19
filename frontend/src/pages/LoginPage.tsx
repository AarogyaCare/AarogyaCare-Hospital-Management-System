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
  { role: 'admin', label: 'Director / Admin', name: 'Hospital Director', email: 'admin@aarogyacare.org', icon: 'admin_panel_settings', dept: 'Clinical Operations' },
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawRedirect = searchParams.get('redirect');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

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
          const defaultDest = res.user.role === 'patient' ? '/patient-portal' : '/staff/dashboard';
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
      setErrorMsg('Network error connecting to AarogyaCare authentication service.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPersona = async (persona: QuickPersona) => {
    setEmail(persona.email);
    setPassword('Aarogya#2026Secure');
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const res = await authService.login(persona.email, 'Aarogya#2026Secure');
      if (res.success && res.user) {
        setSuccessMsg(`Signed in as ${res.user.fullName} (${persona.label})`);
        onLoginSuccess(res.user.role);
        const defaultDest = res.user.role === 'patient' ? '/patient-portal' : '/staff/dashboard';
        const destination = redirectTarget || defaultDest;
        setTimeout(() => {
          navigate(destination);
        }, 400);
      } else {
        setErrorMsg(`Unable to sign in: ${res.error || 'Invalid credentials'}`);
      }
    } catch {
      setErrorMsg('Authentication service unreachable.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7] dark:bg-[#111814] text-[#1A2E1A] dark:text-[#E8EDE8] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      {/* Return home link */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 mb-4">
        <Link
          to="/"
          id="return-home-link"
          className="inline-flex items-center gap-1.5 text-[13px] text-[#4A5F4E] dark:text-[#B8CCBC] hover:text-[#1A2E1A] dark:hover:text-white transition-colors font-medium group"
        >
          <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">
            arrow_back
          </span>
          <span>Back to Hospital Website</span>
        </Link>
      </div>

      {/* Main Login Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-[#FFFFFF] dark:bg-[#1A2420] py-8 px-6 sm:px-10 shadow-sm rounded-3xl border border-[#E2DDD6] dark:border-[#2E3E34]">
          {/* Brand Header */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-flex items-center gap-3 justify-center group mb-3">
              <div className="w-11 h-11 rounded-2xl bg-[#2D6A4F] flex items-center justify-center text-white shadow-sm">
                <span className="material-symbols-outlined text-[24px]">health_and_safety</span>
              </div>
              <div className="text-left">
                <span className="font-bold text-[20px] text-[#1A2E1A] dark:text-[#E8EDE8] tracking-tight leading-none block">
                  AarogyaCare
                </span>
                <span className="text-[11px] font-medium text-[#4A5F4E] dark:text-[#A8D5B5] uppercase tracking-wider block mt-1">
                  Care Portal
                </span>
              </div>
            </Link>

            <h1 className="text-[20px] font-bold text-[#1A2E1A] dark:text-[#E8EDE8] tracking-tight mt-2">
              {mode === 'LOGIN' ? 'Welcome Back' : 'Create Patient Profile'}
            </h1>
            <p className="text-[13px] text-[#4A5F4E] dark:text-[#B8CCBC] mt-1">
              {mode === 'LOGIN' 
                ? 'Sign in to access your appointments, health records, or hospital workspace.'
                : 'Register a confidential profile to manage appointments and records.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-[#E2DDD6] dark:border-[#2E3E34] mb-6">
            <button
              type="button"
              id="login-mode-btn"
              onClick={() => { setMode('LOGIN'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 py-2 text-center text-[13px] font-semibold transition-all border-b-2 ${
                mode === 'LOGIN'
                  ? 'border-[#2D6A4F] text-[#2D6A4F] dark:text-[#74C69D]'
                  : 'border-transparent text-[#6B7F6E] dark:text-[#B8CCBC] hover:text-[#1A2E1A]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              id="register-mode-btn"
              onClick={() => { setMode('REGISTER'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 py-2 text-center text-[13px] font-semibold transition-all border-b-2 ${
                mode === 'REGISTER'
                  ? 'border-[#2D6A4F] text-[#2D6A4F] dark:text-[#74C69D]'
                  : 'border-transparent text-[#6B7F6E] dark:text-[#B8CCBC] hover:text-[#1A2E1A]'
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
              className="mb-5 p-3 rounded-2xl bg-[#FDECEA] text-[#C44B4B] text-[13px] flex items-start gap-2.5 animate-fadeIn border border-[#F5BDB8]"
            >
              <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {/* Success Message Alert */}
          {successMsg && (
            <div 
              role="status"
              id="login-success-alert"
              className="mb-5 p-3 rounded-2xl bg-[#EAF5EE] border border-[#C8D9CC] text-[#2D6A4F] dark:text-[#74C69D] text-[13px] flex items-start gap-2.5 animate-fadeIn"
            >
              <span className="material-symbols-outlined text-[18px] shrink-0">check_circle</span>
              <div className="flex-1 font-medium">{successMsg}</div>
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {mode === 'REGISTER' && (
              <div>
                <label 
                  htmlFor="register-fullname"
                  className="block text-[12px] font-semibold text-[#4A5F4E] dark:text-[#A8D5B5] mb-1.5"
                >
                  Full Name <span className="text-[#C44B4B]">*</span>
                </label>
                <input
                  id="register-fullname"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Kavitha Sundaram"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#F5F4EF] dark:bg-[#1F2E28] text-[#1A2E1A] dark:text-[#E8EDE8] text-[13px] border border-[#E2DDD6] dark:border-[#2E3E34] focus:outline-none focus:border-[#2D6A4F] transition-all"
                />
              </div>
            )}

            <div>
              <label 
                htmlFor="login-email"
                className="block text-[12px] font-semibold text-[#4A5F4E] dark:text-[#A8D5B5] mb-1.5"
              >
                Email Address <span className="text-[#C44B4B]">*</span>
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@aarogyacare.org"
                className="w-full h-11 px-3.5 rounded-xl bg-[#F5F4EF] dark:bg-[#1F2E28] text-[#1A2E1A] dark:text-[#E8EDE8] text-[13px] border border-[#E2DDD6] dark:border-[#2E3E34] focus:outline-none focus:border-[#2D6A4F] transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-[12px] font-semibold text-[#4A5F4E] dark:text-[#A8D5B5] mb-1.5"
              >
                Password <span className="text-[#C44B4B]">*</span>
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pl-3.5 pr-10 rounded-xl bg-[#F5F4EF] dark:bg-[#1F2E28] text-[#1A2E1A] dark:text-[#E8EDE8] text-[13px] border border-[#E2DDD6] dark:border-[#2E3E34] focus:outline-none focus:border-[#2D6A4F] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-0 top-0 bottom-0 px-3 flex items-center justify-center text-[#6B7F6E] hover:text-[#1A2E1A] transition-colors focus:outline-none"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {mode === 'REGISTER' && (
              <div>
                <label 
                  htmlFor="register-phone"
                  className="block text-[12px] font-semibold text-[#4A5F4E] dark:text-[#A8D5B5] mb-1.5"
                >
                  Contact Phone (Optional)
                </label>
                <input
                  id="register-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98401 22314"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#F5F4EF] dark:bg-[#1F2E28] text-[#1A2E1A] dark:text-[#E8EDE8] text-[13px] border border-[#E2DDD6] dark:border-[#2E3E34] focus:outline-none focus:border-[#2D6A4F] transition-all"
                />
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                id="login-submit-btn"
                disabled={isLoading}
                className="w-full h-11 rounded-xl bg-[#2D6A4F] text-white font-semibold text-[13px] hover:bg-[#1B4332] transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading && (
                  <span className="material-symbols-outlined text-[18px] animate-spin">
                    progress_activity
                  </span>
                )}
                <span>
                  {isLoading
                    ? 'Signing In...'
                    : mode === 'LOGIN' ? 'Sign In to Portal' : 'Create Patient Account'}
                </span>
              </button>
            </div>
          </form>

          {/* Quick Demo Personas (Convenient 1-click test sign-in) */}
          <div className="mt-8 pt-6 border-t border-[#E2DDD6] dark:border-[#2E3E34]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2D6A4F] dark:text-[#74C69D]">
                Quick Demo Access
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#F5F4EF] dark:bg-[#1F2E28] text-[#4A5F4E] dark:text-[#A8D5B5] font-semibold">
                1-Click
              </span>
            </div>
            <p className="text-[11px] text-[#6B7F6E] dark:text-[#B8CCBC] mb-3">
              Select any role to test the application with verified demo credentials.
            </p>

            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {DEMO_PERSONAS.map((p) => (
                <button
                  key={p.role}
                  type="button"
                  onClick={() => handleSelectPersona(p)}
                  disabled={isLoading}
                  className="p-2.5 rounded-xl text-left bg-[#F5F4EF] dark:bg-[#1F2E28] hover:bg-[#EAF5EE] dark:hover:bg-[#243E28] border border-[#E2DDD6] dark:border-[#2E3E34] hover:border-[#2D6A4F] transition-all flex flex-col justify-between group disabled:opacity-50"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#2D6A4F] dark:text-[#74C69D]">
                      {p.icon}
                    </span>
                    <span className="text-[12px] font-semibold text-[#1A2E1A] dark:text-[#E8EDE8] truncate group-hover:text-[#2D6A4F]">
                      {p.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#6B7F6E] dark:text-[#B8CCBC] truncate mt-1">
                    {p.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
