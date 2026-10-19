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
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#FAFAF7]/95 dark:bg-[#111814]/95 backdrop-blur-md shadow-sm border-b border-[#E2DDD6] dark:border-[#2E3E34] transition-colors">
      {/* 1. Warm Top Emergency & Location Bar */}
      <div className="bg-[#1A2E1A] text-[#FAFAF7] py-1.5 transition-colors">
        <div className="max-w-[1360px] mx-auto px-4 lg:px-8 flex items-center justify-between text-[12px] font-medium">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 text-[#D8F3DC]">
              <span className="material-symbols-outlined text-[16px]">location_on</span>
              <span>Greams Road, Chennai, Tamil Nadu</span>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E57373] animate-pulse"></span>
              <span className="text-[#A8D5B5]">24/7 Emergency Care:</span>
              <button 
                onClick={onOpenEmergency}
                className="font-semibold text-white hover:underline flex items-center gap-1 focus:outline-none"
              >
                +91 44 2836 0000 / 1066
                <span className="px-1.5 py-0.5 rounded bg-[#C44B4B] text-white text-[10px] uppercase font-bold ml-1">Priority</span>
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              to="/login"
              className="hidden sm:flex items-center gap-1.5 text-[#D8F3DC] hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">lock</span>
              <span>Staff & Patient Sign In</span>
            </Link>
            <div className="h-3 w-[1px] bg-white/20 hidden sm:block"></div>
            <button 
              onClick={() => setLang(l => l === 'EN' ? 'TA' : 'EN')}
              className="flex items-center gap-1 text-[#A8D5B5] hover:text-white transition-colors focus:outline-none"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">language</span>
              <span>{lang === 'EN' ? 'English (EN)' : 'தமிழ் (TA)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="h-18 max-w-[1360px] mx-auto px-4 lg:px-8 flex items-center justify-between gap-4">
        {/* Logo & Brand Identity */}
        <Link to="/" className="flex items-center gap-3 shrink-0 group">
          <div className="w-10 h-10 rounded-xl bg-[#2D6A4F] flex items-center justify-center text-white shadow-sm group-hover:bg-[#1B4332] transition-colors">
            <span className="material-symbols-outlined text-[22px]">health_and_safety</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[20px] text-[#1A2E1A] dark:text-[#E8EDE8] tracking-tight leading-none group-hover:text-[#2D6A4F] transition-colors font-sans">
              AarogyaCare
            </span>
            <span className="text-[11px] font-medium text-[#4A5F4E] dark:text-[#7A9E82] uppercase tracking-wider mt-1 leading-[14px]">
              Human-Centered Healthcare
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden xl:flex items-center gap-1">
          <Link
            to="/"
            className={`px-3 py-2 rounded-xl text-[14px] font-medium transition-all ${
              isActive('/') && location.pathname === '/'
                ? 'bg-[#EAF5EE] dark:bg-[#1F2E28] text-[#2D6A4F] dark:text-[#74C69D] font-semibold'
                : 'text-[#4A5F4E] dark:text-[#B8CCBC] hover:text-[#1A2E1A] dark:hover:text-white hover:bg-[#F5F4EF] dark:hover:bg-[#1A2420]'
            }`}
          >
            Home
          </Link>
          <Link
            to="/specialties"
            className={`px-3 py-2 rounded-xl text-[14px] font-medium transition-all ${
              isActive('/specialties')
                ? 'bg-[#EAF5EE] dark:bg-[#1F2E28] text-[#2D6A4F] dark:text-[#74C69D] font-semibold'
                : 'text-[#4A5F4E] dark:text-[#B8CCBC] hover:text-[#1A2E1A] dark:hover:text-white hover:bg-[#F5F4EF] dark:hover:bg-[#1A2420]'
            }`}
          >
            Departments
          </Link>
          <Link
            to="/doctors"
            className={`px-3 py-2 rounded-xl text-[14px] font-medium transition-all ${
              isActive('/doctors')
                ? 'bg-[#EAF5EE] dark:bg-[#1F2E28] text-[#2D6A4F] dark:text-[#74C69D] font-semibold'
                : 'text-[#4A5F4E] dark:text-[#B8CCBC] hover:text-[#1A2E1A] dark:hover:text-white hover:bg-[#F5F4EF] dark:hover:bg-[#1A2420]'
            }`}
          >
            Find a Doctor
          </Link>
          <Link
            to="/patient-portal"
            className={`px-3 py-2 rounded-xl text-[14px] font-medium transition-all ${
              isActive('/patient-portal')
                ? 'bg-[#EAF5EE] dark:bg-[#1F2E28] text-[#2D6A4F] dark:text-[#74C69D] font-semibold'
                : 'text-[#4A5F4E] dark:text-[#B8CCBC] hover:text-[#1A2E1A] dark:hover:text-white hover:bg-[#F5F4EF] dark:hover:bg-[#1A2420]'
            }`}
          >
            Health Records
          </Link>
          <Link
            to="/staff/dashboard"
            className={`px-3 py-2 rounded-xl text-[14px] font-medium transition-all flex items-center gap-1.5 ${
              isActive('/staff/dashboard')
                ? 'bg-[#2D6A4F] text-white font-semibold shadow-sm'
                : 'text-[#4A5F4E] dark:text-[#B8CCBC] hover:text-[#1A2E1A] dark:hover:text-white hover:bg-[#F5F4EF] dark:hover:bg-[#1A2420]'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">dashboard</span>
            <span>Hospital Overview</span>
          </Link>
          <Link
            to="/staff/operations"
            className={`px-3 py-2 rounded-xl text-[14px] font-medium transition-all flex items-center gap-1.5 ${
              isActive('/staff/operations')
                ? 'bg-[#1A2E1A] text-white font-semibold'
                : 'text-[#2D6A4F] dark:text-[#74C69D] bg-[#EAF5EE] dark:bg-[#1F2E28] hover:bg-[#D8F3DC] dark:hover:bg-[#243E28]'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">local_pharmacy</span>
            <span>Pharmacy & Triage</span>
          </Link>
          <Link
            to="/staff/system-design-lab"
            className={`px-3 py-2 rounded-xl text-[14px] font-medium transition-all flex items-center gap-1.5 ${
              isActive('/staff/system-design-lab')
                ? 'bg-[#1A2E1A] text-white font-semibold'
                : 'text-[#6B7F6E] dark:text-[#A8D5B5] hover:text-[#1A2E1A] hover:bg-[#F5F4EF] dark:hover:bg-[#1A2420]'
            }`}
            title="Interactive Distributed Systems Lab"
          >
            <span className="material-symbols-outlined text-[17px]">memory</span>
            <span>Design Lab</span>
          </Link>
        </nav>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenEmergency}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FDECEA] dark:bg-[#2A1A1A] text-[#C44B4B] dark:text-[#F87171] hover:bg-[#C44B4B] hover:text-white text-[13px] font-semibold border border-[#F5BDB8] dark:border-[#4A2A2A] transition-all"
          >
            <span className="material-symbols-outlined text-[17px]">emergency</span>
            <span>Emergency</span>
          </button>

          <Link
            to="/appointments/new"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#2D6A4F] text-white text-[13px] font-semibold shadow-sm hover:bg-[#1B4332] transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[17px]">calendar_month</span>
            <span>Book Visit</span>
          </Link>

          {/* User profile button / Auth trigger */}
          <button 
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 p-1 rounded-full hover:bg-[#F5F4EF] dark:hover:bg-[#1F2E28] transition-colors focus:outline-none"
            title={`Active Persona: ${currentUserRole}`}
          >
            <div className="w-9 h-9 rounded-full bg-[#1A2E1A] text-white flex items-center justify-center ring-2 ring-[#74C69D]/30">
              <span className="material-symbols-outlined text-[19px]">person</span>
            </div>
          </button>

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 text-[#4A5F4E] dark:text-[#B8CCBC] hover:text-[#1A2E1A] focus:outline-none rounded-lg"
          >
            <span className="material-symbols-outlined text-[24px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#FAFAF7] dark:bg-[#16201B] border-t border-[#E2DDD6] dark:border-[#2E3E34] px-4 py-4 space-y-2 shadow-lg animate-fadeIn">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-[#1A2E1A] dark:text-[#E8EDE8] font-medium hover:bg-[#F5F4EF] dark:hover:bg-[#1F2E28]"
          >
            Home
          </Link>
          <Link
            to="/specialties"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-[#1A2E1A] dark:text-[#E8EDE8] font-medium hover:bg-[#F5F4EF] dark:hover:bg-[#1F2E28]"
          >
            Departments & Specialties
          </Link>
          <Link
            to="/doctors"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-[#1A2E1A] dark:text-[#E8EDE8] font-medium hover:bg-[#F5F4EF] dark:hover:bg-[#1F2E28]"
          >
            Find a Doctor
          </Link>
          <Link
            to="/patient-portal"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-[#1A2E1A] dark:text-[#E8EDE8] font-medium hover:bg-[#F5F4EF] dark:hover:bg-[#1F2E28]"
          >
            Health Records & Patient Portal
          </Link>
          <Link
            to="/staff/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-[#2D6A4F] dark:text-[#74C69D] font-medium bg-[#EAF5EE] dark:bg-[#1F2E28]"
          >
            Hospital Overview
          </Link>
          <Link
            to="/staff/operations"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-[#1A2E1A] dark:text-[#E8EDE8] font-medium hover:bg-[#F5F4EF] dark:hover:bg-[#1F2E28]"
          >
            Pharmacy & Emergency Services
          </Link>
          <Link
            to="/staff/system-design-lab"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-[#1A2E1A] dark:text-[#E8EDE8] font-medium hover:bg-[#F5F4EF] dark:hover:bg-[#1F2E28]"
          >
            System Design Lab
          </Link>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenEmergency?.(); }}
              className="w-full py-2.5 rounded-xl bg-[#C44B4B] text-white font-medium flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">emergency</span>
              <span>24/7 Emergency Request</span>
            </button>
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#EAF5EE] dark:bg-[#1F2E28] text-[#2D6A4F] dark:text-[#74C69D] font-medium text-center block hover:bg-[#D8F3DC] transition-colors"
            >
              Sign In to Portal
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
