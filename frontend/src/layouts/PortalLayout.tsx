import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Calendar, Users, Stethoscope, Pill, FileText,
  CreditCard, AlertCircle, ChevronLeft, ChevronRight,
  Search, Bell, Sun, Moon, LogOut, Building2, Activity,
  Menu, X, ExternalLink, ShieldCheck, Cpu, Sparkles
} from 'lucide-react';
import { UserRole } from '../types';
import { authService } from '../services/api';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
  category?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', path: '/staff/dashboard', icon: <LayoutDashboard className="w-4.5 h-4.5" />, category: 'Core' },
  { label: 'Patients', path: '/patient-portal', icon: <Users className="w-4.5 h-4.5" />, category: 'Hospital' },
  { label: 'Appointments', path: '/appointments/new', icon: <Calendar className="w-4.5 h-4.5" />, category: 'Hospital' },
  { label: 'Find a Doctor', path: '/doctors', icon: <Stethoscope className="w-4.5 h-4.5" />, category: 'Hospital' },
  { label: 'Departments', path: '/specialties', icon: <Building2 className="w-4.5 h-4.5" />, category: 'Hospital' },
  { label: 'Pharmacy & Triage', path: '/staff/operations', icon: <Activity className="w-4.5 h-4.5" />, category: 'Services' },
  { label: 'System Design Lab', path: '/staff/system-design-lab', icon: <Cpu className="w-4.5 h-4.5" />, category: 'Engineering' },
];

interface PortalLayoutProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({ currentRole, onSelectRole }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('aarogya_dark_mode') === 'true'; } catch { return false; }
  });
  const [notifications] = useState(2);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Apply dark mode class
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    try { localStorage.setItem('aarogya_dark_mode', String(darkMode)); } catch {}
  }, [darkMode]);

  // Close mobile on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === '/staff/dashboard') return location.pathname === '/staff/dashboard';
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const roleDisplay = currentRole.replace(/_/g, ' ');
  const roleInitials = currentRole === 'patient' ? 'PT' : currentRole.substring(0, 2).toUpperCase();

  /* ── Sidebar Content ── */
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#FAFAF7] dark:bg-[#16201B] text-[#1A2E1A] dark:text-[#E8EDE8]">
      {/* Brand */}
      <div className={`flex items-center border-b border-[#E2DDD6] dark:border-[#2E3E34] h-16 px-4 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-[#2D6A4F] flex items-center justify-center text-white shadow-sm">
              <span className="font-bold text-[14px]">A</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-[15px] text-[#1A2E1A] dark:text-[#E8EDE8] tracking-tight">AarogyaCare</span>
              <span className="text-[10px] text-[#4A5F4E] dark:text-[#7A9E82] uppercase tracking-wider mt-0.5 font-medium">Care Portal</span>
            </div>
          </Link>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-xl bg-[#2D6A4F] text-white flex items-center justify-center">
            <span className="font-bold text-[14px]">A</span>
          </div>
        )}
        {/* Desktop collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className={`hidden lg:flex items-center justify-center w-6 h-6 rounded-full bg-[#EFECE6] hover:bg-[#E5E0D5] dark:bg-[#1F2E28] dark:hover:bg-[#2A3A2E] transition-colors text-[#4A5F4E] dark:text-[#A8D5B5] ${collapsed ? 'mx-auto' : ''}`}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* User Card */}
      <div className={`px-3 py-3 border-b border-[#E2DDD6] dark:border-[#2E3E34] ${collapsed ? 'flex justify-center' : ''}`}>
        {collapsed ? (
          <div className="w-9 h-9 rounded-xl bg-[#2D6A4F] text-white flex items-center justify-center font-bold text-[12px] shadow-sm" title={`${roleDisplay} Workspace`}>
            {roleInitials}
          </div>
        ) : (
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#F5F4EF] dark:bg-[#1F2E28] border border-[#E2DDD6] dark:border-[#2E3E34]">
            <div className="w-9 h-9 rounded-xl bg-[#2D6A4F] text-white flex items-center justify-center font-bold text-[12px] shrink-0 shadow-sm">
              {roleInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#1A2E1A] dark:text-[#E8EDE8] capitalize truncate">{roleDisplay}</p>
              <p className="text-[11px] text-[#4A5F4E] dark:text-[#7A9E82] truncate">Hospital Staff Member</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2 space-y-1">
        {NAV_ITEMS.map((item, idx) => {
          const active = isActive(item.path);
          const showCategoryHeader = !collapsed && (idx === 0 || NAV_ITEMS[idx - 1].category !== item.category);

          return (
            <React.Fragment key={item.path}>
              {showCategoryHeader && (
                <p className="text-[10px] font-bold text-[#6B7F6E] dark:text-[#7A9E82] uppercase tracking-wider px-3 pb-1 pt-2.5">
                  {item.category}
                </p>
              )}
              <Link
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all group relative ${
                  active
                    ? 'bg-[#2D6A4F] text-white shadow-sm font-medium'
                    : 'text-[#4A5F4E] dark:text-[#B8CCBC] hover:text-[#1A2E1A] dark:hover:text-white hover:bg-[#EAF5EE] dark:hover:bg-[#1F2E28]'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <span className={`shrink-0 ${active ? 'text-white' : 'text-[#4A5F4E] dark:text-[#7A9E82] group-hover:text-[#2D6A4F] dark:group-hover:text-[#74C69D]'}`}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <span className="text-[13px] leading-none">{item.label}</span>
                )}
                {!collapsed && item.badge && item.badge > 0 && (
                  <span className="ml-auto text-[10px] font-bold bg-[#C44B4B] text-white w-5 h-5 rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            </React.Fragment>
          );
        })}

        {!collapsed && (
          <>
            <div className="border-t border-[#E2DDD6] dark:border-[#2E3E34] my-3" />
            <p className="text-[10px] font-bold text-[#6B7F6E] dark:text-[#7A9E82] uppercase tracking-wider px-3 pb-1">
              Public Portal
            </p>
            <Link
              to="/"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#4A5F4E] dark:text-[#B8CCBC] hover:text-[#1A2E1A] dark:hover:text-white hover:bg-[#EAF5EE] dark:hover:bg-[#1F2E28] transition-colors"
            >
              <ExternalLink className="w-4 h-4 shrink-0 text-[#6B7F6E]" />
              <span className="text-[13px] font-medium">Hospital Website</span>
            </Link>
          </>
        )}
      </nav>

      {/* Footer Controls */}
      <div className={`p-3 border-t border-[#E2DDD6] dark:border-[#2E3E34] space-y-1 ${collapsed ? 'flex flex-col items-center gap-1.5' : ''}`}>
        <button
          onClick={() => setDarkMode(d => !d)}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#4A5F4E] dark:text-[#B8CCBC] hover:bg-[#EAF5EE] dark:hover:bg-[#1F2E28] transition-colors w-full ${collapsed ? 'justify-center' : ''}`}
          title={darkMode ? 'Switch to warm light theme' : 'Switch to calm dark theme'}
        >
          {darkMode ? <Sun className="w-4 h-4 shrink-0 text-[#E8B042]" /> : <Moon className="w-4 h-4 shrink-0 text-[#2D6A4F]" />}
          {!collapsed && <span className="text-[13px] font-medium">{darkMode ? 'Light Theme' : 'Dark Theme'}</span>}
        </button>
        <button
          onClick={handleLogout}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#C44B4B] dark:text-[#F87171] hover:bg-[#FDECEA] dark:hover:bg-[#2A1A1A] transition-colors w-full ${collapsed ? 'justify-center' : ''}`}
          title="Sign out"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="text-[13px] font-medium">Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-[#FAFAF7] dark:bg-[#111814] flex antialiased transition-colors duration-300 font-sans`}>

      {/* ── Mobile Sidebar Overlay ── */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
              className="fixed left-0 top-0 h-full w-72 bg-[#FAFAF7] dark:bg-[#16201B] z-50 shadow-2xl border-r border-[#E2DDD6] dark:border-[#2E3E34] lg:hidden"
            >
              <div className="absolute right-3 top-3">
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-[#4A5F4E] hover:bg-[#EFECE6] dark:hover:bg-[#1F2E28]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Desktop Sidebar ── */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="hidden lg:flex flex-col fixed left-0 top-0 h-full bg-[#FAFAF7] dark:bg-[#16201B] border-r border-[#E2DDD6] dark:border-[#2E3E34] z-30 overflow-hidden"
      >
        <SidebarContent />
      </motion.aside>

      {/* ── Main Area ── */}
      <motion.div
        animate={{ paddingLeft: collapsed ? 64 : 240 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="hidden lg:block min-w-0 flex-1"
      >
        {/* Top Bar */}
        <header className="fixed top-0 right-0 h-16 bg-[#FAFAF7]/95 dark:bg-[#111814]/95 backdrop-blur-md border-b border-[#E2DDD6] dark:border-[#2E3E34] z-20 flex items-center px-6 gap-4"
          style={{ left: collapsed ? 64 : 240, transition: 'left 0.25s ease' }}>
          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A8E7E]" />
            <input
              type="text"
              placeholder="Search patients, doctors, appointments…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#F5F4EF] dark:bg-[#1F2E28] border border-[#E2DDD6] dark:border-[#2E3E34] text-[13px] text-[#1A2E1A] dark:text-[#E8EDE8] placeholder-[#7A8E7E] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition-all"
            />
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            {/* Notifications */}
            <button className="relative p-2 rounded-xl text-[#4A5F4E] dark:text-[#B8CCBC] hover:bg-[#F5F4EF] dark:hover:bg-[#1F2E28] transition-colors" title="Notifications">
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C44B4B]" />
              )}
            </button>

            {/* Role badge */}
            <div className="px-3 py-1.5 rounded-xl bg-[#EAF5EE] dark:bg-[#1F2E28] border border-[#C8D9CC] dark:border-[#2E3E34] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#2D6A4F] animate-pulse" />
              <span className="text-[12px] font-semibold text-[#2D6A4F] dark:text-[#74C69D] capitalize">{roleDisplay}</span>
            </div>

            {/* User avatar */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(o => !o)}
                className="w-9 h-9 rounded-full bg-[#2D6A4F] text-white font-bold text-[13px] flex items-center justify-center hover:bg-[#1B4332] shadow-sm transition-colors"
              >
                {roleInitials}
              </button>
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 w-56 bg-[#FAFAF7] dark:bg-[#1A2420] rounded-2xl shadow-xl border border-[#E2DDD6] dark:border-[#2E3E34] overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b border-[#E2DDD6] dark:border-[#2E3E34]">
                      <p className="text-[13px] font-semibold text-[#1A2E1A] dark:text-[#E8EDE8] capitalize">{roleDisplay}</p>
                      <p className="text-[12px] text-[#4A5F4E] dark:text-[#7A9E82]">Active Session</p>
                    </div>
                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => { setUserMenuOpen(false); setDarkMode(d => !d); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-[#1A2E1A] dark:text-[#E8EDE8] hover:bg-[#F5F4EF] dark:hover:bg-[#1F2E28] transition-colors"
                      >
                        {darkMode ? <Sun className="w-4 h-4 text-[#E8B042]" /> : <Moon className="w-4 h-4 text-[#2D6A4F]" />}
                        {darkMode ? 'Light Theme' : 'Dark Theme'}
                      </button>
                      <button
                        onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-[#C44B4B] hover:bg-[#FDECEA] dark:hover:bg-[#2A1A1A] transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Outlet */}
        <main className="pt-16 min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </motion.div>

      {/* ── Mobile Layout ── */}
      <div className="lg:hidden flex flex-col flex-1 min-w-0">
        {/* Mobile Top Bar */}
        <header className="fixed top-0 left-0 right-0 h-16 bg-[#FAFAF7]/95 dark:bg-[#111814]/95 backdrop-blur-md border-b border-[#E2DDD6] dark:border-[#2E3E34] z-30 flex items-center px-4 gap-3">
          <button onClick={() => setMobileSidebarOpen(true)} className="p-2 rounded-xl text-[#4A5F4E] hover:bg-[#F5F4EF] dark:hover:bg-[#1F2E28]">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#2D6A4F] text-white flex items-center justify-center font-bold text-[12px]">
              A
            </div>
            <span className="font-bold text-[16px] text-[#1A2E1A] dark:text-[#E8EDE8]">AarogyaCare</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setDarkMode(d => !d)}
              className="p-2 rounded-xl text-[#4A5F4E] hover:bg-[#F5F4EF] dark:hover:bg-[#1F2E28]"
            >
              {darkMode ? <Sun className="w-4.5 h-4.5 text-[#E8B042]" /> : <Moon className="w-4.5 h-4.5 text-[#2D6A4F]" />}
            </button>
            <button className="relative p-2 rounded-xl text-[#4A5F4E] hover:bg-[#F5F4EF] dark:hover:bg-[#1F2E28]">
              <Bell className="w-4.5 h-4.5" />
              {notifications > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C44B4B]" />}
            </button>
          </div>
        </header>

        <main className="pt-16">
          <Outlet />
        </main>
      </div>

      {/* Click-away for user menu */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
      )}
    </div>
  );
};
