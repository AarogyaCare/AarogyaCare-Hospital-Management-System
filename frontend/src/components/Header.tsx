import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  PhoneCall, MapPin, Award, Calendar, Activity, Menu, X,
  ChevronDown, LogOut, UserRound, LayoutDashboard,
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
  ],
  DOCTOR: [
    { name: 'Clinical', path: '/clinical/workspace' },
    { name: 'Patient Records', path: '/emr/patients' },
    { name: 'Appointments', path: '/operations/appointments' },
  ],
  NURSE: [
    { name: 'Triage', path: '/nursing/station' },
    { name: 'Patient Records', path: '/emr/patients' },
  ],
  RECEPTIONIST: [
    { name: 'Reception', path: '/reception' },
    { name: 'Operations', path: '/operations/hub' },
    { name: 'Appointments', path: '/operations/appointments' },
  ],
  PHARMACIST: [{ name: 'Pharmacy', path: '/pharmacy' }],
  BILLING_STAFF: [{ name: 'Billing', path: '/billing/desk' }],
  ADMIN: [
    { name: 'Administration', path: '/admin' },
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
  const dashboard = user ? dashboards[user.role] : null;
  const authenticatedLinks = user ? roleModules[user.role] : [];
  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Specialties', path: '/specialties' },
    { name: 'Doctors', path: '/doctors' },
    ...(user && dashboard ? authenticatedLinks.filter((link) => link.path !== dashboard.path) : []),
  ];
  const labLinks = [
    { name: 'Rate Limiter', path: '/lab/rate-limiter' },
    { name: 'Consistent Hashing', path: '/lab/consistent-hashing' },
    { name: 'Key-Value Store', path: '/lab/key-value-store' },
    { name: 'Unique ID Generator', path: '/lab/unique-id-generator' },
    { name: 'URL Shortener', path: '/lab/url-shortener' },
    { name: 'Web Crawler', path: '/lab/web-crawler' },
    { name: 'Autocomplete', path: '/lab/autocomplete' },
  ];

  const signOut = async () => {
    setAccountMenuOpen(false);
    setMobileMenuOpen(false);
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <>
      <div className="bg-[#001730] text-slate-300 text-[11px] py-1.5 px-4 md:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-teal-400" />Grems Road Clinical Campus, Thousand Lights, Chennai - 600006</span>
          <div className="flex items-center gap-4">
            <a href="tel:1066" className="flex items-center gap-1.5 text-rose-300 hover:text-rose-200 font-semibold transition"><PhoneCall className="w-3.5 h-3.5 text-rose-400" />24/7 Trauma Emergency: 1066 / +91 44 2829 0000</a>
            <span className="hidden sm:flex items-center gap-1 border-l border-slate-700 pl-3 text-slate-400"><Award className="w-3.5 h-3.5 text-amber-400" />NABH &amp; JCI Accredited</span>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 min-h-[4.5rem] flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3 group shrink-0" aria-label="AarogyaCare home">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#002043] to-[#178B8B] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform"><Activity className="w-6 h-6" /></div>
            <div>
              <div className="flex items-center gap-2"><span className="text-lg font-bold tracking-tight text-[#002043]">Aarogya<span className="text-[#178B8B]">Care</span></span><span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-teal-50 text-[#178B8B] border border-teal-200">Campus</span></div>
              <p className="text-[10px] font-medium text-slate-500 uppercase">Grems Road • Chennai</p>
            </div>
          </Link>

          <nav aria-label="Main navigation" className="hidden xl:flex items-center gap-1 text-sm font-medium text-slate-700">
            {navLinks.map((link) => <Link key={link.path} to={link.path} aria-current={location.pathname === link.path ? 'page' : undefined} className={`px-2.5 py-2 rounded-lg transition ${location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path)) ? 'text-[#002043] font-semibold bg-slate-100' : 'hover:text-[#002043] hover:bg-slate-50'}`}>{link.name}</Link>)}
            <div className="relative">
              <button type="button" onClick={() => setLabMenuOpen((open) => !open)} aria-haspopup="menu" aria-expanded={labMenuOpen} className={`flex items-center gap-1 px-2.5 py-2 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-teal-600 ${location.pathname.startsWith('/lab/') ? 'text-[#002043] font-semibold bg-slate-100' : 'hover:text-[#002043] hover:bg-slate-50'}`}>
                Design Lab <ChevronDown className={`w-3.5 h-3.5 transition-transform ${labMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {labMenuOpen && <div role="menu" aria-label="System Design Lab" className="absolute left-0 top-full mt-2 w-56 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl">
                {labLinks.map((link, index) => <Link key={link.path} role="menuitem" to={link.path} onClick={() => setLabMenuOpen(false)} aria-current={location.pathname === link.path ? 'page' : undefined} className="block px-3 py-2 text-xs text-slate-700 hover:bg-teal-50 hover:text-[#002043] focus:outline-none focus:bg-teal-50">{index + 1}. {link.name}</Link>)}
              </div>}
            </div>
          </nav>

          <div className="hidden xl:flex items-center gap-2">
            {user && dashboard ? (
              <div className="relative">
                <button type="button" onClick={() => setAccountMenuOpen((open) => !open)} aria-haspopup="menu" aria-expanded={accountMenuOpen} className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-600">
                  <UserRound className="w-4 h-4 text-[#002043]" /><span className="max-w-36 truncate">{user.name}</span><span className="text-[10px] text-teal-700">{user.role.replace('_', ' ')}</span><ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                {accountMenuOpen && <div role="menu" className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-slate-100"><p className="font-semibold text-slate-800 truncate">{user.name}</p><p className="text-slate-500 truncate">{user.email}</p><p className="text-teal-700 mt-1">{user.role.replace('_', ' ')}</p></div>
                  <Link role="menuitem" to={dashboard.path} onClick={() => setAccountMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 hover:bg-teal-50"><LayoutDashboard className="w-4 h-4" />My Dashboard</Link>
                  <Link role="menuitem" to="/portal/profile" onClick={() => setAccountMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 hover:bg-teal-50"><UserRound className="w-4 h-4" />My Profile</Link>
                  <button role="menuitem" type="button" onClick={() => void signOut()} className="w-full text-left flex items-center gap-2 px-3 py-2 text-rose-700 hover:bg-rose-50"><LogOut className="w-4 h-4" />Logout</button>
                </div>}
              </div>
            ) : <div className="flex items-center gap-2"><Link to="/portal/login" state={{ returnTo: location.pathname === '/' ? undefined : location.pathname + location.search }} className="px-4 py-2 bg-[#002043] hover:bg-[#17365d] text-white text-xs font-semibold rounded-xl">Login</Link><Link to="/portal/login?mode=register" className="px-3 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-50 rounded-xl">Register</Link></div>}
            {!user && <Link to="/appointments/book" className="flex items-center gap-1.5 px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-xl shadow-sm"><Calendar className="w-3.5 h-3.5" />Book Appointment</Link>}
          </div>

          <div className="flex items-center gap-1 xl:hidden">
            <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg" aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileMenuOpen}>{mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
          </div>
        </div>

        {mobileMenuOpen && <nav aria-label="Mobile navigation" className="xl:hidden bg-white border-t border-slate-200 px-4 py-4 space-y-1">
          {navLinks.map((link) => <Link key={link.path} to={link.path} onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100">{link.name}</Link>)}
          <div>
            <button type="button" onClick={() => setLabMenuOpen((open) => !open)} aria-expanded={labMenuOpen} className="flex w-full items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold text-[#002043] hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600">
              Design Lab <ChevronDown className={`w-4 h-4 transition-transform ${labMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {labMenuOpen && <div className="ml-3 border-l border-teal-200 pl-3 py-1">
              {labLinks.map((link, index) => <Link key={link.path} to={link.path} onClick={() => { setMobileMenuOpen(false); setLabMenuOpen(false); }} aria-current={location.pathname === link.path ? 'page' : undefined} className="block px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-teal-50 hover:text-[#002043]">{index + 1}. {link.name}</Link>)}
            </div>}
          </div>
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {user && dashboard ? <><div className="px-3 text-xs text-slate-600">{user.name} · {user.role.replace('_', ' ')}</div><Link to={dashboard.path} onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-sm text-[#002043]">My Dashboard</Link><Link to="/portal/profile" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-sm text-slate-700">My Profile</Link><button type="button" onClick={() => void signOut()} className="text-left px-3 py-2 text-sm text-rose-700">Logout</button></> : <><Link to="/portal/login" state={{ returnTo: location.pathname === '/' ? undefined : location.pathname + location.search }} onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-2.5 bg-[#002043] text-white rounded-xl text-sm font-semibold">Login</Link><Link to="/portal/login?mode=register" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-2.5 text-teal-800 rounded-xl text-sm font-semibold">Register</Link></>}
            {!user && <Link to="/appointments/book" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-2.5 bg-teal-700 text-white rounded-xl text-sm font-semibold">Book Appointment</Link>}
          </div>
        </nav>}
      </header>
    </>
  );
}