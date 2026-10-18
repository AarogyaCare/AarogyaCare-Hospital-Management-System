import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { UserRole } from '../types';
import { AuthModal } from '../components/AuthModal';

interface PortalLayoutProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({ currentRole, onSelectRole }) => {
  const location = useLocation();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isCurrent = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background flex flex-col antialiased">
      {/* 1. Fixed Left Sidebar Desktop */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-surface-container-lowest z-50 flex flex-col shadow-[0_1px_8px_rgba(23,54,93,0.06)] border-r border-surface-container-high transition-transform duration-200 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="h-16 px-space-md flex items-center justify-between border-b border-surface-container-high">
          <Link to="/" className="flex items-center gap-space-sm">
            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[20px]">local_hospital</span>
            </div>
            <div className="flex flex-col">
              <span className="font-title-sm text-title-sm text-primary font-bold">Aarogya Care</span>
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">Clinical Sanctuary</span>
            </div>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded hover:bg-surface-container text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* User Card */}
        <div className="px-space-md py-space-sm border-b border-surface-container-high/60">
          <div className="p-space-sm rounded-xl bg-surface-container-low flex items-center gap-space-sm border border-surface-container-high">
            <div className="w-9 h-9 rounded-xl bg-secondary text-on-secondary flex items-center justify-center font-title-sm text-title-sm font-bold">
              {currentRole === 'patient' ? 'PT' : currentRole.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-title-sm text-title-sm text-on-surface truncate capitalize font-bold">
                {currentRole.replace('_', ' ')} Workspace
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-mono truncate">
                UHID: AC-2024-9104
              </span>
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-space-sm py-space-sm space-y-1 overflow-y-auto">
          <Link
            to="/patient-portal"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-space-sm px-3 py-2 rounded-xl transition-all ${
              isCurrent('/patient-portal')
                ? 'bg-surface-container text-secondary font-title-sm shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">grid_view</span>
            <span className="font-body-sm text-body-sm">Patient EHR Portal</span>
          </Link>

          <Link
            to="/staff/operations"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-space-sm px-3 py-2 rounded-xl transition-all ${
              isCurrent('/staff/operations')
                ? 'bg-primary text-white font-title-sm shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">hub</span>
            <span className="font-body-sm text-body-sm">Operations & Telemetry</span>
          </Link>

          <Link
            to="/doctors"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-space-sm px-3 py-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface rounded-xl transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">stethoscope</span>
            <span className="font-body-sm text-body-sm">Doctor Directory</span>
          </Link>

          <Link
            to="/appointments/new"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-space-sm px-3 py-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface rounded-xl transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">calendar_month</span>
            <span className="font-body-sm text-body-sm">Book Real-Time Slot</span>
          </Link>
        </nav>

        {/* Switch Persona / Exit Link */}
        <div className="p-space-sm border-t border-surface-container-high space-y-1">
          <button
            onClick={() => setAuthModalOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-secondary hover:bg-surface-container text-left text-body-sm font-medium transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">switch_account</span>
            <span>Switch Role Persona</span>
          </button>
          <Link
            to="/"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container text-body-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Exit to Hospital Site</span>
          </Link>
        </div>
      </aside>

      {/* 2. Main Content Area offset by Sidebar */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top Header */}
        <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-md shadow-[0_1px_8px_rgba(23,54,93,0.06)] z-40 flex items-center justify-between px-space-md lg:px-space-lg border-b border-surface-container-high">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-primary hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-[22px]">menu</span>
            </button>
            <div className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md">
              <span className="material-symbols-outlined text-[18px] text-tertiary">verified</span>
              <span className="hidden sm:inline">Chennai Campus • Tertiary Clinical Records Node 04</span>
            </div>
          </div>

          <div className="flex items-center gap-space-sm">
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-title-sm text-title-sm flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">badge</span>
              <span className="capitalize">{currentRole}</span>
            </button>

            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[13px]">
              AC
            </div>
          </div>
        </header>

        {/* Portal Page Outlet */}
        <main className="pt-16 flex-1 bg-background">
          <Outlet />
        </main>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentRole={currentRole}
        onSelectRole={onSelectRole}
      />
    </div>
  );
};
