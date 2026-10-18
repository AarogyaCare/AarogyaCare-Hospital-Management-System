import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface HeaderProps {
  onOpenAuth?: () => void;
  onOpenEmergency?: () => void;
  currentUserRole?: string;
  onSelectRole?: (role: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenAuth, 
  onOpenEmergency, 
  currentUserRole = 'patient',
  onSelectRole 
}) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lang, setLang] = useState<'EN' | 'TA'>('EN');

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/95 backdrop-blur-md shadow-[0_1px_8px_rgba(23,54,93,0.06)]">
      {/* 1. Top Trauma & Location Notification Bar */}
      <div className="bg-primary-container text-on-primary py-1.5 transition-colors">
        <div className="max-w-[1360px] mx-auto px-gutter-mobile lg:px-margin flex items-center justify-between font-label-md text-label-md">
          <div className="flex items-center gap-space-lg">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[16px] text-on-primary-container">location_on</span>
              <span>Greams Road, Chennai, Tamil Nadu</span>
            </div>
            <div className="hidden md:flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[16px] text-error-container animate-pulse">emergency</span>
              <span className="text-on-primary-container">24/7 Trauma Care Hotline:</span>
              <button 
                onClick={onOpenEmergency}
                className="font-title-sm text-title-sm text-on-primary hover:underline flex items-center gap-1 focus:outline-none"
              >
                +91 44 2836 0000 / 1066
                <span className="px-1.5 py-0.2 rounded bg-error text-white text-[10px] uppercase font-bold ml-1">STAT</span>
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-space-md">
            <Link 
              to="/login"
              className="hidden sm:flex items-center gap-space-xs text-on-primary hover:text-primary-fixed transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">lock</span>
              <span>Portal Access</span>
            </Link>
            <div className="h-3 w-[1px] bg-outline-variant/30 hidden sm:block"></div>
            <button 
              onClick={() => setLang(l => l === 'EN' ? 'TA' : 'EN')}
              className="flex items-center gap-space-xs text-on-primary-container hover:text-on-primary transition-colors focus:outline-none" 
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">language</span>
              <span className="font-label-md text-label-md">{lang === 'EN' ? 'English (EN)' : 'தமிழ் (TA)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="h-20 max-w-[1360px] mx-auto px-gutter-mobile lg:px-margin flex items-center justify-between gap-4">
        {/* Logo & Brand Identity */}
        <Link to="/" className="flex items-center gap-3 shrink-0 group">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm group-hover:bg-secondary transition-colors">
            <span className="material-symbols-outlined text-[24px]">local_hospital</span>
          </div>
          <div className="flex flex-col">
            <span className="font-brand font-bold text-[20px] text-primary tracking-tight leading-none group-hover:text-secondary transition-colors">
              Aarogya Care
            </span>
            <span className="text-[12px] font-medium text-on-surface-variant uppercase tracking-wider mt-1 leading-[16px]">
              Multispecialty Hospital
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links (14px / 500 / 20px) */}
        <nav className="hidden xl:flex items-center gap-1">
          <Link
            to="/"
            className={`px-3 py-2 rounded-lg nav-item transition-all ${
              isActive('/') && location.pathname === '/'
                ? 'bg-surface-container text-secondary font-semibold'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            Home
          </Link>
          <Link
            to="/specialties"
            className={`px-3 py-2 rounded-lg nav-item transition-all ${
              isActive('/specialties')
                ? 'bg-surface-container text-secondary font-semibold'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            Specialties & CoEs
          </Link>
          <Link
            to="/doctors"
            className={`px-3 py-2 rounded-lg nav-item transition-all ${
              isActive('/doctors')
                ? 'bg-surface-container text-secondary font-semibold'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            Find a Doctor
          </Link>
          <Link
            to="/patient-portal"
            className={`px-3 py-2 rounded-lg nav-item transition-all ${
              isActive('/patient-portal')
                ? 'bg-surface-container text-secondary font-semibold'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            Patient Portal
          </Link>
          <Link
            to="/staff/operations"
            className={`px-3 py-2 rounded-lg nav-item transition-all flex items-center gap-1 ${
              isActive('/staff/operations')
                ? 'bg-primary text-on-primary font-semibold'
                : 'text-primary bg-surface-container-high hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">hub</span>
            <span>Operations Hub</span>
            <span className="w-2 h-2 rounded-full bg-secondary animate-ping ml-0.5"></span>
          </Link>
        </nav>

        {/* Right CTA Actions (14px / 600 / 20px) */}
        <div className="flex items-center gap-space-sm">
          <button
            onClick={onOpenEmergency}
            className="hidden sm:inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-error-container text-error hover:bg-error hover:text-white btn-text transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">emergency</span>
            <span>Emergency</span>
          </button>

          <Link
            to="/patient-portal"
            className="hidden md:inline-flex items-center justify-center px-4 py-2 rounded-lg bg-surface-container-low text-secondary btn-text hover:bg-surface-container hover:text-on-surface transition-all"
          >
            My Workspace
          </Link>

          <Link
            to="/appointments/new"
            className="inline-flex items-center justify-center gap-1.5 px-space-md py-2.5 rounded-lg bg-secondary text-on-secondary btn-text shadow-sm hover:bg-primary-container hover:text-on-primary transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            <span>Book Appointment</span>
          </Link>

          {/* User profile button / Auth trigger */}
          <button 
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 p-1 rounded-full hover:bg-surface-container transition-colors focus:outline-none"
            title={`Active Persona: ${currentUserRole}`}
          >
            <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center ring-2 ring-secondary/30">
              <span className="material-symbols-outlined text-[20px]">person</span>
            </div>
          </button>

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 text-on-surface-variant hover:text-primary focus:outline-none"
          >
            <span className="material-symbols-outlined text-[24px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-surface-container-lowest border-t border-surface-container-high px-4 py-4 space-y-2 shadow-lg animate-fadeIn">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-on-surface font-title-sm hover:bg-surface-container"
          >
            Home
          </Link>
          <Link
            to="/specialties"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-on-surface font-title-sm hover:bg-surface-container"
          >
            Specialties & CoEs
          </Link>
          <Link
            to="/doctors"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-on-surface font-title-sm hover:bg-surface-container"
          >
            Consultant Directory
          </Link>
          <Link
            to="/patient-portal"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-on-surface font-title-sm hover:bg-surface-container"
          >
            Patient Portal & Records
          </Link>
          <Link
            to="/staff/operations"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-secondary font-title-sm bg-surface-container"
          >
            Hospital Operations Hub (Staff Only)
          </Link>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenEmergency?.(); }}
              className="w-full py-2.5 rounded-lg bg-error text-white font-title-sm flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">emergency</span>
              <span>24/7 Emergency Triage Request</span>
            </button>
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 rounded-lg bg-surface-container-low text-primary font-title-sm text-center block hover:bg-surface-container transition-colors"
            >
              Sign In to Portal
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
