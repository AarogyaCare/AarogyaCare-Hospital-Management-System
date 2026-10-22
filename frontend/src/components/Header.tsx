import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  PhoneCall, MapPin, Award, Calendar, Activity, Menu, X,
  ChevronDown, LogOut, UserRound, LayoutDashboard, Sparkles,
  ShieldCheck, Stethoscope
} from 'lucide-react';
import { useAuth, UserRole } from '../context/AuthContext';

const dashboards: Record<UserRole, { label: string; path: string }> = {
  PATIENT: { label: 'Patient Dashboard', path: '/portal/dashboard' },
  DOCTOR: { label: 'Doctor Workspace', path: '/clinical/workspace' },
  NURSE: { label: 'Nursing Station', path: '/nursing/station' },
  RECEPTIONIST: { label: 'Reception Desk', path: '/reception' },
  PHARMACIST: { label: 'Pharmacy', path: '/pharmacy' },
  BILLING_STAFF: { label: 'Billing Desk', path: '/billing/desk' },
  ADMIN: { label: 'Administration', path: '/admin' },
};

const roleModules: Record<UserRole, { name: string; path: string }[]> = {
  PATIENT: [
    { name: 'My Appointments', path: '/portal/appointments' },
    { name: 'Medical Records', path: '/portal/medical-records' },
    { name: 'Invoices', path: '/portal/billing' },
    { name: 'Emergency SOS', path: '/portal/emergency' },
    { name: 'Health Knowledge', path: '/portal/knowledge' },
  ],
  DOCTOR: [
    { name: 'Clinical', path: '/clinical/workspace' },
    { name: 'Emergency Desk', path: '/operations/emergency' },
    { name: 'Emergency Center', path: '/emergency/command-center' },
    { name: 'Medical Knowledge', path: '/clinical/knowledge' },
    { name: 'Patient Records', path: '/emr/patients' },
    { name: 'Appointments', path: '/operations/appointments' },
  ],
  NURSE: [
    { name: 'Triage', path: '/nursing/station' },
    { name: 'Emergency Center', path: '/emergency/command-center' },
    { name: 'Clinical Guidelines', path: '/clinical/knowledge' },
    { name: 'Patient Records', path: '/emr/patients' },
  ],
  RECEPTIONIST: [
    { name: 'Reception', path: '/reception' },
    { name: 'Emergency Desk', path: '/operations/emergency' },
    { name: 'Emergency Center', path: '/emergency/command-center' },
    { name: 'Operations', path: '/operations/hub' },
    { name: 'Appointments', path: '/operations/appointments' },
  ],
  PHARMACIST: [{ name: 'Pharmacy', path: '/pharmacy' }],
  BILLING_STAFF: [{ name: 'Billing', path: '/billing/desk' }],
  ADMIN: [
    { name: 'Administration', path: '/admin' },
    { name: 'Emergency Desk', path: '/operations/emergency' },
    { name: 'Emergency Center', path: '/emergency/command-center' },
    { name: 'Knowledge Sources', path: '/admin/knowledge-sources' },
    { name: 'User Management', path: '/admin/users' },
    { name: 'System Health', path: '/admin/system-health' },
    { name: 'Audit Reports', path: '/admin/reports' },
  ],
};

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [labMenuOpen, setLabMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const dashboard = user && dashboards[user.role] ? dashboards[user.role] : null;
  const authenticatedLinks = user && roleModules[user.role] ? roleModules[user.role] : [];
  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Specialties', path: '/specialties' },
    { name: 'Doctors', path: '/doctors' },
    ...(!user ? [{ name: 'Health Knowledge', path: '/portal/knowledge' }] : []),
    ...(user && dashboard ? authenticatedLinks.filter((link) => link.path !== dashboard.path) : []),
  ];
  const labLinks = [
    { name: 'Rate Limiter', path: '/lab/rate-limiter', desc: 'Token bucket algorithm' },
    { name: 'Consistent Hashing', path: '/lab/consistent-hashing', desc: 'MD5 virtual node ring' },
    { name: 'Key-Value Store', path: '/lab/key-value-store', desc: 'LSM-tree memtable & SST' },
    { name: 'Unique ID Generator', path: '/lab/unique-id-generator', desc: '64-bit Snowflake ID' },
    { name: 'URL Shortener', path: '/lab/url-shortener', desc: 'Base62 CRC32 collision' },
    { name: 'Web Crawler', path: '/lab/web-crawler', desc: 'Safe BFS domain boundary' },
    { name: 'Autocomplete', path: '/lab/autocomplete', desc: 'Trie prefix frequency rank' },
  ];

  const signOut = async () => {
    setAccountMenuOpen(false);
    setMobileMenuOpen(false);
    await logout();
    navigate('/', { replace: true });
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <>
      {/* Top Clinical & Accreditation Strip */}
      <div className="bg-[#001730] text-slate-300 text-[11px] py-1.5 px-4 md:px-8 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-teal-400" />
            <span>Medora Clinical Campus, Thousand Lights, Chennai - 600006</span>
          </span>
          <div className="flex items-center gap-4">
            <a
              href="tel:1066"
              className="flex items-center gap-1.5 text-rose-300 hover:text-rose-200 font-semibold transition"
            >
              <PhoneCall className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>24/7 Acute Emergency: 1066 / +91 44 2829 0000</span>
            </a>
            <span className="hidden sm:flex items-center gap-1 border-l border-slate-700/80 pl-3 text-slate-400">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>NABH &amp; JCI Gold Seal Campus</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Glassmorphism Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-white/60 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 md:px-8 min-h-[4.5rem] flex items-center justify-between gap-4">
          {/* Medora Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group shrink-0" aria-label="Medora home">
            <img
              src="/medora-logo.png"
              alt="Medora"
              className="h-10 object-contain group-hover:scale-105 transition-transform duration-200"
            />
          </Link>

          {/* Desktop Navigation Links */}
          <nav aria-label="Main navigation" className="hidden xl:flex items-center gap-1 text-sm font-medium text-slate-700">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'text-[#002043] bg-teal-50/80 text-teal-900 border border-teal-200/60 shadow-xs'
                      : 'hover:text-[#002043] hover:bg-slate-100/70'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            {/* System Design Lab Dropdown - Interactive Simulations (Admin Only) */}
            {user?.role === 'ADMIN' && (
              <div className="relative">
              <button
                type="button"
                onClick={() => setLabMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={labMenuOpen}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  location.pathname.startsWith('/lab/')
                    ? 'text-teal-900 bg-teal-50/80 border border-teal-200/60'
                    : 'hover:text-[#002043] hover:bg-slate-100/70'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>System Design Lab</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${labMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {labMenuOpen && (
                <div
                  role="menu"
                  aria-label="System Design Lab"
                  className="absolute left-0 top-full mt-2 w-72 rounded-2xl border border-white/60 bg-white/95 backdrop-blur-2xl p-2 shadow-xl animate-scale-in z-50"
                  style={{
                    boxShadow: '0 20px 45px -10px rgba(0, 32, 67, 0.15), 0 0 0 1px rgba(226, 232, 240, 0.8)',
                  }}
                >
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-teal-700">7 Interactive Labs</p>
                    <p className="text-[11px] text-slate-500">Live distributed architecture simulations</p>
                  </div>
                  {labLinks.map((link, index) => (
                    <Link
                      key={link.path}
                      role="menuitem"
                      to={link.path}
                      onClick={() => setLabMenuOpen(false)}
                      className={`block px-3 py-2 rounded-xl text-xs transition ${
                        location.pathname === link.path
                          ? 'bg-teal-50 text-teal-900 font-bold'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-[#002043]'
                      }`}
                    >
                      <div className="font-semibold text-slate-900 flex items-center justify-between">
                        <span>{index + 1}. {link.name}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{link.desc}</p>
                    </Link>
                  ))}
                </div>
              )}
              </div>
            )}
          </nav>

          {/* User Account / Action CTAs */}
          <div className="hidden xl:flex items-center gap-2.5">
            {user && dashboard ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((open) => !open)}
                  aria-haspopup="menu"
                  aria-expanded={accountMenuOpen}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white/80 hover:bg-white border border-slate-200/80 rounded-2xl shadow-xs transition focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-teal-500 to-[#002043] text-white flex items-center justify-center font-bold text-[11px] shadow-xs">
                    {getInitials(user.name)}
                  </div>
                  <div className="flex flex-col text-left max-w-32">
                    <span className="truncate text-xs font-bold text-slate-900">{user.name}</span>
                    <span className="text-[9px] uppercase tracking-wider font-bold text-teal-700">
                      {user.role.replace('_', ' ')}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
                </button>

                {accountMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/60 p-2 z-50 text-xs animate-scale-in"
                    style={{
                      boxShadow: '0 20px 45px -10px rgba(0, 32, 67, 0.15), 0 0 0 1px rgba(226, 232, 240, 0.8)',
                    }}
                  >
                    <div className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 mb-1.5">
                      <p className="font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-teal-100/70 text-teal-800 text-[10px] font-bold uppercase tracking-wider">
                        {user.role.replace('_', ' ')}
                      </span>
                    </div>
                    <Link
                      role="menuitem"
                      to={dashboard.path}
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-teal-50 hover:text-teal-900 font-medium transition"
                    >
                      <LayoutDashboard className="w-4 h-4 text-teal-600" />
                      <span>{dashboard.label}</span>
                    </Link>
                    <Link
                      role="menuitem"
                      to="/portal/profile"
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-teal-50 hover:text-teal-900 font-medium transition"
                    >
                      <UserRound className="w-4 h-4 text-teal-600" />
                      <span>Profile & Settings</span>
                    </Link>
                    <div className="border-t border-slate-100 my-1" />
                    <button
                      role="menuitem"
                      type="button"
                      onClick={() => void signOut()}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-semibold transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/portal/login"
                  state={{ returnTo: location.pathname === '/' ? undefined : location.pathname + location.search }}
                  className="px-4 py-2 text-xs font-bold text-[#002043] hover:bg-slate-100 rounded-xl transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/portal/login?mode=register"
                  className="px-3.5 py-2 text-xs font-bold text-teal-800 bg-teal-50/80 hover:bg-teal-100/80 border border-teal-200/80 rounded-xl transition"
                >
                  Register
                </Link>
              </div>
            )}

            <Link
              to="/portal/emergency"
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition transform hover:-translate-y-0.5 shrink-0"
            >
              <PhoneCall className="w-3.5 h-3.5 animate-pulse text-white" />
              <span>Emergency SOS</span>
            </Link>

            {!user && (
              <Link
                to="/appointments/book"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-500/20 transition transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Book Appointment</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex items-center gap-1 xl:hidden">
            <Link
              to="/portal/emergency"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg shadow-sm mr-1"
            >
              <PhoneCall className="w-3 h-3 animate-pulse" />
              <span>SOS</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="p-2 text-slate-700 hover:bg-slate-100 rounded-xl transition"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-Down Menu */}
        {mobileMenuOpen && (
          <nav aria-label="Mobile navigation" className="xl:hidden bg-white/95 backdrop-blur-2xl border-t border-slate-200/80 px-4 py-4 space-y-2 animate-slide-up">
            <Link
              to="/portal/emergency"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold bg-rose-600 text-white shadow-sm"
            >
              <PhoneCall className="w-4 h-4 animate-pulse" />
              <span>24/7 Emergency SOS</span>
            </Link>

            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                {link.name}
              </Link>
            ))}

            {user?.role === 'ADMIN' && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setLabMenuOpen((open) => !open)}
                  aria-expanded={labMenuOpen}
                  className="flex w-full items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold text-teal-900 bg-teal-50/70"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <span>System Design Labs</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${labMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {labMenuOpen && (
                  <div className="mt-1 space-y-1 pl-4 border-l-2 border-teal-200 ml-4 py-1">
                    {labLinks.map((link, index) => (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setLabMenuOpen(false);
                        }}
                        className="block px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-teal-50"
                      >
                        {index + 1}. {link.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              {user && dashboard ? (
                <>
                  <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <p className="font-bold text-slate-900">{user.name}</p>
                    <p className="text-[10px] text-teal-700 font-semibold uppercase">{user.role.replace('_', ' ')}</p>
                  </div>
                  <Link
                    to={dashboard.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-sm font-semibold text-[#002043] hover:bg-slate-100"
                  >
                    {dashboard.label}
                  </Link>
                  <Link
                    to="/portal/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Profile & Settings
                  </Link>
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="text-left px-3.5 py-2 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/portal/login"
                    state={{ returnTo: location.pathname === '/' ? undefined : location.pathname + location.search }}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 bg-[#002043] text-white rounded-xl text-sm font-bold shadow-sm"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/portal/login?mode=register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 text-teal-800 bg-teal-50 rounded-xl text-sm font-bold border border-teal-200"
                  >
                    Create Account
                  </Link>
                </>
              )}

              {!user && (
                <Link
                  to="/appointments/book"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl text-sm font-bold shadow-md shadow-teal-500/20"
                >
                  Book OPD Appointment
                </Link>
              )}
            </div>
          </nav>
        )}
      </header>
    </>
  );
}
