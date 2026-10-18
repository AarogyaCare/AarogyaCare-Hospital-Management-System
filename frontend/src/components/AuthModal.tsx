import React, { useState } from 'react';
import { UserRole } from '../types';
import { authService } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onSelectRole
}) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('patient.rajendran@aarogyacare.org');
  const [password, setPassword] = useState('Aarogya#2026Secure');
  const [fullName, setFullName] = useState('S. Rajendran');
  const [phone, setPhone] = useState('+91 98401 22314');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickPersonas: { role: UserRole; label: string; desc: string; icon: string; email: string }[] = [
    { role: 'patient', label: 'Patient', desc: 'S. Rajendran (UHID: AC-2024-9104)', icon: 'person', email: 'patient.rajendran@aarogyacare.org' },
    { role: 'doctor', label: 'Doctor (OPD)', desc: 'Dr. Priya Sundaram (Cardiology Ch 04)', icon: 'stethoscope', email: 'dr.priya@aarogyacare.org' },
    { role: 'nurse', label: 'Triage / Nurse', desc: 'Emergency Level-1 Resus Desk', icon: 'vital_signs', email: 'nurse@aarogyacare.org' },
    { role: 'receptionist', label: 'Receptionist', desc: 'Front Desk OPD Token Intake', icon: 'desk', email: 'receptionist@aarogyacare.org' },
    { role: 'pharmacist', label: 'Pharmacist', desc: 'Central Dispensary Stock Control', icon: 'medication', email: 'pharmacist@aarogyacare.org' },
    { role: 'billing_staff', label: 'Billing Desk', desc: 'Invoices & Simulated Payments', icon: 'receipt_long', email: 'billing@aarogyacare.org' },
    { role: 'admin', label: 'Admin / Director', desc: 'System Telemetry & Hash Ring Control', icon: 'admin_panel_settings', email: 'admin@aarogyacare.org' },
  ];

  const handlePersonaClick = async (p: typeof quickPersonas[0]) => {
    setEmail(p.email);
    setPassword('Aarogya#2026Secure');
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await authService.login(p.email, 'Aarogya#2026Secure');
      if (res.success && res.user) {
        onSelectRole(res.user.role);
        setSuccessMsg(`Authenticated as ${res.user.fullName} (${p.label})`);
        setTimeout(() => {
          onClose();
        }, 350);
      } else {
        setErrorMsg(`Authentication failed for ${p.label}: ${res.error || 'Invalid credentials'}`);
      }
    } catch {
      setErrorMsg(`Unable to connect to authentication server for ${p.label}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (mode === 'LOGIN') {
      const res = await authService.login(email, password);
      setIsLoading(false);
      if (res.success && res.user) {
        setSuccessMsg(`Welcome back, ${res.user.fullName}!`);
        onSelectRole(res.user.role);
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        setErrorMsg(res.error || 'Authentication failed. Please verify credentials.');
      }
    } else {
      const res = await authService.register({
        email,
        password,
        fullName,
        phone
      });
      setIsLoading(false);
      if (res.success && res.user) {
        setSuccessMsg(`Account created successfully! Welcome, ${res.user.fullName}`);
        onSelectRole(res.user.role);
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        setErrorMsg(res.error || 'Registration failed. Email might already exist.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-surface-container-high animate-scaleUp">
        {/* Modal Header */}
        <div className="bg-primary-container text-on-primary p-space-md flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[18px]">lock</span>
            </div>
            <div>
              <h3 className="font-title-md text-title-md">
                Clinical Sanctuary Portal Access
              </h3>
              <p className="text-label-sm text-on-primary-container">
                Role-Based Access Control (RBAC) Gateway
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-on-primary-container hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Quick Persona Switcher (DEV Only - Academic Demo) */}
        {import.meta.env.DEV && (
          <div className="p-space-md bg-surface-container-low border-b border-surface-container-high">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold block mb-2">
              Instant Test Persona Switcher (DEV Only)
            </span>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
              {quickPersonas.map((p) => (
                <button
                  key={p.role}
                  type="button"
                  onClick={() => handlePersonaClick(p)}
                  className={`p-2 rounded-xl text-left border transition-all flex flex-col justify-between ${
                    currentRole === p.role 
                      ? 'bg-secondary text-white border-secondary shadow-sm'
                      : 'bg-surface-container-lowest text-on-surface border-surface-container-high hover:border-secondary'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">{p.icon}</span>
                    <span className="font-title-sm text-title-sm font-semibold truncate">{p.label}</span>
                  </div>
                  <span className={`text-[10px] truncate mt-1 ${currentRole === p.role ? 'text-primary-fixed' : 'text-on-surface-variant'}`}>
                    {p.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Auth Credentials Form */}
        <div className="p-space-lg space-y-space-md">
          <div className="flex items-center justify-between border-b border-surface-container-high pb-2">
            <span className="font-title-sm text-title-sm text-primary font-bold">
              {mode === 'LOGIN' ? 'Verify Credentials' : 'Create Patient Account'}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setMode('LOGIN'); setErrorMsg(null); }}
                className={`text-label-sm font-semibold px-2.5 py-1 rounded-lg transition-all ${mode === 'LOGIN' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => { setMode('REGISTER'); setErrorMsg(null); }}
                className={`text-label-sm font-semibold px-2.5 py-1 rounded-lg transition-all ${mode === 'REGISTER' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
              >
                Register
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-error-container text-on-error-container text-body-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-error">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded-xl bg-secondary/10 border border-secondary text-secondary text-body-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'REGISTER' && (
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-sm focus:outline-none focus:ring-2 focus:ring-secondary border border-surface-container-high"
                  required
                />
              </div>
            )}

            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-1">
                Normalized Email / Login
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-sm focus:outline-none focus:ring-2 focus:ring-secondary border border-surface-container-high"
                required
              />
            </div>

            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-sm focus:outline-none focus:ring-2 focus:ring-secondary border border-surface-container-high"
                required
              />
            </div>

            {mode === 'REGISTER' && (
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-1">
                  Mobile Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-sm focus:outline-none focus:ring-2 focus:ring-secondary border border-surface-container-high"
                />
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-lg bg-primary text-white font-title-sm hover:bg-secondary transition-all shadow-md active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
                {mode === 'LOGIN' ? 'Authenticate & Issue JWT' : 'Create Account in PostgreSQL'}
              </button>
            </div>

            <div className="pt-3 text-center border-t border-surface-container-high/60">
              <a
                href="/login"
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                  window.location.href = '/login';
                }}
                className="text-[12px] text-secondary hover:text-primary font-medium inline-flex items-center gap-1 transition-colors"
              >
                <span>Prefer dedicated login page? Go to Standalone Login</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
