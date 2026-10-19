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
    <div className="flex flex-col w-full min-h-screen bg-[#FAFAF7] dark:bg-[#111814] text-[#1A2E1A] dark:text-[#E8EDE8] font-sans">
      {/* 1. Reassuring Patient Banner */}
      <div className="w-full bg-[#1A2E1A] text-[#FAFAF7] px-4 lg:px-8 py-2.5">
        <div className="max-w-[1360px] mx-auto flex flex-wrap items-center justify-between gap-2 text-[12px] font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#52B788] animate-pulse"></span>
            <span className="font-semibold text-white">APPOINTMENT SECURELY REGISTERED</span>
            <span className="text-[#A8D5B5] hidden md:inline">
              • SMS & Email confirmation sent to patient contact
            </span>
          </div>
          <span className="text-[#A8D5B5] text-[11px]">
            Chennai Medical Campus
          </span>
        </div>
      </div>

      {/* 2. Main Confirmation Card */}
      <div className="max-w-3xl mx-auto w-full px-4 lg:px-8 py-10">
        <div className="bg-[#FFFFFF] dark:bg-[#1A2420] rounded-3xl p-6 sm:p-10 shadow-md border border-[#E2DDD6] dark:border-[#2E3E34] flex flex-col items-center text-center">
          {/* Success Check Icon */}
          <div className="w-16 h-16 rounded-2xl bg-[#EAF5EE] dark:bg-[#1F2E28] text-[#2D6A4F] dark:text-[#74C69D] flex items-center justify-center mb-4 shadow-sm">
            <span className="material-symbols-outlined text-[36px]">check_circle</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF5EE] dark:bg-[#1F2E28] text-[#2D6A4F] dark:text-[#74C69D] text-[12px] font-semibold mb-2">
            <span>Confirmed & Ready</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-[#1A2E1A] dark:text-[#E8EDE8] tracking-tight">
            Appointment Confirmed!
          </h1>
          <p className="text-[14px] text-[#4A5F4E] dark:text-[#B8CCBC] max-w-md mt-1">
            We look forward to seeing you. Your visit details have been securely saved to your health profile.
          </p>

          {/* Appointment Ticket Box */}
          <div className="w-full bg-[#F5F4EF] dark:bg-[#1F2E28] rounded-2xl p-6 my-6 border border-[#E2DDD6] dark:border-[#2E3E34] text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2DDD6] dark:border-[#2E3E34] gap-2">
              <div>
                <span className="text-[11px] text-[#6B7F6E] dark:text-[#A8D5B5] uppercase font-semibold">Appointment Reference</span>
                <div className="text-lg font-mono font-bold text-[#1A2E1A] dark:text-[#E8EDE8]">
                  {appointmentId || 'AC-APT-2026-10492'}
                </div>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[11px] text-[#6B7F6E] dark:text-[#A8D5B5] uppercase font-semibold">Patient UHID</span>
                <div className="text-[13px] font-mono font-semibold text-[#1A2E1A] dark:text-[#E8EDE8]">
                  {uhid} • S. Rajendran
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-[#E2DDD6] dark:border-[#2E3E34] text-[13px]">
              <div>
                <span className="text-[#6B7F6E] dark:text-[#B8CCBC] block text-[11px]">Consulting Specialist</span>
                <span className="font-bold text-[#1A2E1A] dark:text-[#E8EDE8] text-[15px] block">{doctorName}</span>
                <span className="text-[12px] text-[#2D6A4F] dark:text-[#74C69D] font-medium">Cardiology Clinic</span>
              </div>
              <div>
                <span className="text-[#6B7F6E] dark:text-[#B8CCBC] block text-[11px]">Date & Time</span>
                <span className="font-bold text-[#1A2E1A] dark:text-[#E8EDE8] text-[15px] block">Today, {slotTime}</span>
                <span className="text-[12px] text-[#6B7F6E] dark:text-[#B8CCBC]">
                  {mode === 'IN_PERSON' ? 'Room OPD-104, East Wing, Level 1' : 'Video Call Link will be active 10 mins prior'}
                </span>
              </div>
            </div>

            {/* Reference Link */}
            <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] text-[#6B7F6E] dark:text-[#A8D5B5] uppercase block font-semibold">
                  Secure Digital Check-in Link
                </span>
                <span className="font-mono text-[#2D6A4F] dark:text-[#74C69D] text-[13px] font-semibold">
                  {window.location.origin}/s/{shortCode}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#16201B] border border-[#E2DDD6] dark:border-[#2E3E34] text-[12px] font-semibold text-[#2D6A4F] dark:text-[#74C69D] hover:bg-[#EAF5EE] transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {copied ? 'check' : 'content_copy'}
                </span>
                <span>{copied ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 w-full">
            <Link
              to="/patient-portal"
              className="px-6 py-2.5 rounded-xl bg-[#2D6A4F] text-white font-semibold text-[13px] hover:bg-[#1B4332] shadow-sm transition-all"
            >
              Go to My Health Records
            </Link>
            <Link
              to="/"
              className="px-5 py-2.5 rounded-xl bg-[#F5F4EF] dark:bg-[#1F2E28] text-[#1A2E1A] dark:text-[#E8EDE8] font-semibold text-[13px] hover:bg-[#EFECE6] transition-colors border border-[#E2DDD6] dark:border-[#2E3E34]"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
