import React, { useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';

export const AppointmentConfirmationPage: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const [searchParams] = useSearchParams();

  const doctorName = searchParams.get('doctor') || 'Dr. K. Ramanathan';
  const slotTime = searchParams.get('time') || '10:15 AM';
  const mode = searchParams.get('mode') || 'IN_PERSON';
  const uhid = searchParams.get('uhid') || 'AC-2024-9104';
  const shortCode = 'c9f2k1';

  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/s/${shortCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-background">
      {/* 1. Architecture Simulation Notification */}
      <div className="w-full bg-primary text-on-primary px-gutter-mobile lg:px-margin py-2.5">
        <div className="max-w-[1360px] mx-auto flex flex-wrap items-center justify-between gap-space-sm text-label-sm font-label-sm">
          <div className="flex items-center gap-space-sm">
            <span className="w-2 h-2 rounded-full bg-tertiary-fixed animate-pulse"></span>
            <span className="font-title-sm text-title-sm text-tertiary-fixed">TRANSACTION COMMITTED</span>
            <span className="text-on-primary-container">
              | PostgreSQL slot row locked & updated • Notification outbox row created • Cache invalidated
            </span>
          </div>
          <span className="text-on-primary-container font-mono text-[11px]">
            LATENCY: 8ms • ISOLATION: READ COMMITTED
          </span>
        </div>
      </div>

      {/* 2. Main Confirmation Card */}
      <div className="max-w-3xl mx-auto w-full px-gutter-mobile lg:px-margin py-space-xl">
        <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-10 shadow-lg border border-surface-container-high flex flex-col items-center text-center">
          {/* Success Check Icon */}
          <div className="w-16 h-16 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center mb-4 shadow-sm animate-scaleUp">
            <span className="material-symbols-outlined text-[36px] text-secondary">verified</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container text-secondary font-label-md text-label-md font-semibold mb-2">
            <span>Slot Reservation Guaranteed</span>
          </div>

          <h1 className="page-heading text-primary tracking-tight">
            Appointment Confirmed!
          </h1>
          <p className="body-text text-on-surface-variant max-w-md mt-1">
            Your appointment has been registered with zero double-booking lock protection.
          </p>

          {/* Appointment Ticket Box */}
          <div className="w-full bg-surface-container-low rounded-2xl p-6 my-6 border border-surface-container-high text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-surface-container-high/80 gap-2">
              <div>
                <span className="text-[11px] text-outline uppercase font-semibold">Appointment Reference</span>
                <div className="font-headline-sm text-headline-sm text-primary font-mono font-bold">
                  {appointmentId || 'AC-APT-2026-10492'}
                </div>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[11px] text-outline uppercase font-semibold">UHID / Patient</span>
                <div className="font-title-sm text-title-sm text-primary font-mono">
                  {uhid} • S. Rajendran
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-surface-container-high/80 text-body-sm">
              <div>
                <span className="text-on-surface-variant block text-[12px]">Consulting Specialist</span>
                <span className="font-bold text-primary text-title-sm block">{doctorName}</span>
                <span className="text-[12px] text-secondary font-medium">Cardiology • Chief of Cath Lab</span>
              </div>
              <div>
                <span className="text-on-surface-variant block text-[12px]">Date & Time</span>
                <span className="font-bold text-primary text-title-sm block">Today (Oct 24), {slotTime}</span>
                <span className="text-[12px] text-on-surface-variant">
                  {mode === 'IN_PERSON' ? 'Room OPD-104, East Wing, Level 1' : 'Secure HD Tele-Consult'}
                </span>
              </div>
            </div>

            {/* Short Link reference */}
            <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] text-outline uppercase block font-semibold">
                  Secure Short Reference Link (Authorized)
                </span>
                <span className="font-mono text-secondary text-body-sm font-semibold">
                  {window.location.origin}/s/{shortCode}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg bg-surface-container-highest text-primary font-title-sm text-title-sm hover:bg-secondary hover:text-white transition-colors flex items-center gap-1 self-start sm:self-auto"
              >
                <span className="material-symbols-outlined text-[16px]">content_copy</span>
                <span>{copied ? 'Copied!' : 'Copy Reference'}</span>
              </button>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 w-full">
            <Link
              to="/patient-portal"
              className="px-6 py-2.5 rounded-xl bg-primary text-white font-title-sm hover:bg-secondary transition-colors shadow-sm"
            >
              View in Patient Portal
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-5 py-2.5 rounded-xl bg-surface-container text-primary font-title-sm hover:bg-surface-container-high transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              <span>Print Slip</span>
            </button>
            <Link
              to="/"
              className="px-5 py-2.5 rounded-xl bg-surface-container-low text-on-surface font-title-sm hover:bg-surface-container transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
