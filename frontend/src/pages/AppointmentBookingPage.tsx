import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { DOCTORS } from '../data/mockData';
import { doctorService, appointmentService } from '../services/api';
import { Doctor } from '../types';

export const AppointmentBookingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const doctorIdParam = searchParams.get('doctorId') || 'doc-ramanathan';
  const slotIdParam = searchParams.get('slotId') || '';

  const initialDoc = DOCTORS.find(d => d.id === doctorIdParam) || DOCTORS[0];
  const [doctor, setDoctor] = useState<Doctor>(initialDoc);

  useEffect(() => {
    if (doctorIdParam) {
      doctorService.getById(doctorIdParam).then(doc => {
        if (doc) setDoctor(doc);
      }).catch(() => {});
    }
  }, [doctorIdParam]);

  // Concurrency Lock Countdown Timer
  const [secondsRemaining, setSecondsRemaining] = useState(9 * 60 + 42);
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Form State
  const [consultationMode, setConsultationMode] = useState<'IN_PERSON' | 'TELE_CONSULT'>('IN_PERSON');
  const [patientType, setPatientType] = useState<'EXISTING' | 'NEW'>('EXISTING');
  const [uhid, setUhid] = useState('AC-2024-9104');
  const [patientName, setPatientName] = useState('S. Rajendran');
  const [patientPhone, setPatientPhone] = useState('+91 98401 22314');
  const [reasonForVisit, setReasonForVisit] = useState('Routine review of blood pressure and cardiology follow-up');
  const [vaultConsent, setVaultConsent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Idempotency Key
  const [idempotencyKey] = useState(() => `idemp-${Math.random().toString(36).substring(2, 10)}`);

  const handleConfirmReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const apt = await appointmentService.bookSlot({
        doctorId: doctor.id,
        slotId: slotIdParam || 'slot-1',
        patientUhid: uhid,
        patientName: patientName,
        consultationMode: consultationMode,
        reasonForVisit: reasonForVisit,
        idempotencyKey: idempotencyKey
      });

      navigate(`/appointments/${apt.appointmentNumber || apt.id}/confirmation?doctor=${encodeURIComponent(doctor.displayName)}&time=${encodeURIComponent(apt.slotTime || '10:15 AM')}&mode=${consultationMode}&uhid=${encodeURIComponent(uhid)}&idemp=${idempotencyKey}`);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'The selected doctor slot could not be booked due to a conflict.');
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAFAF7] dark:bg-[#111814] text-[#1A2E1A] dark:text-[#E8EDE8] font-sans">
      {/* 1. Reassuring Patient Banner */}
      <div className="w-full bg-[#1A2E1A] text-[#FAFAF7] px-4 lg:px-8 py-2.5">
        <div className="max-w-[1360px] mx-auto flex flex-wrap items-center justify-between gap-2 text-[12px] font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#52B788] animate-pulse"></span>
            <span className="font-semibold text-white">
              RESERVED TIME HELD FOR YOU
            </span>
            <span className="text-[#A8D5B5] hidden md:inline">
              • Guaranteed no double-booking while you complete your details
            </span>
          </div>
          <div className="flex items-center gap-3 text-[#A8D5B5]">
            <span>Chennai Campus</span>
            <span>•</span>
            <span className="text-white">Instant Confirmation</span>
          </div>
        </div>
      </div>

      {/* 2. Header & Stepper */}
      <div className="w-full bg-[#FFFFFF] dark:bg-[#16201B] py-6 shadow-sm border-b border-[#E2DDD6] dark:border-[#2E3E34]">
        <div className="max-w-[1360px] mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-[#EAF5EE] dark:bg-[#1F2E28] text-[#2D6A4F] dark:text-[#74C69D] text-[11px] font-semibold">
                  Outpatient Clinic
                </span>
                <span className="text-[#6B7F6E] dark:text-[#B8CCBC] text-[12px]">
                  Schedule your consultation
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#1A2E1A] dark:text-[#E8EDE8] tracking-tight">
                Book Your Doctor Visit
              </h1>
            </div>

            {/* Countdown Timer */}
            <div className="flex items-center gap-3 bg-[#F5F4EF] dark:bg-[#1F2E28] px-4 py-2.5 rounded-2xl border border-[#E2DDD6] dark:border-[#2E3E34]">
              <div className="flex flex-col text-right">
                <span className="text-[11px] text-[#6B7F6E] dark:text-[#A8D5B5] uppercase tracking-wider font-semibold">
                  Slot Held For
                </span>
                <span className="text-lg text-[#C44B4B] font-mono font-bold leading-tight">
                  {formatTimer(secondsRemaining)}
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#FDECEA] dark:bg-[#2A1A1A] text-[#C44B4B] flex items-center justify-center">
                <span className="material-symbols-outlined text-[19px]">schedule</span>
              </div>
            </div>
          </div>

          {/* 4-Step Progress Navigation */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#F5F4EF] dark:bg-[#1F2E28] border border-[#E2DDD6] dark:border-[#2E3E34]">
              <div className="w-8 h-8 rounded-xl bg-[#2D6A4F] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                <span className="material-symbols-outlined text-[16px]">check</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-[#6B7F6E] dark:text-[#A8D5B5] uppercase font-bold">Step 1</span>
                <span className="text-[13px] font-semibold text-[#1A2E1A] dark:text-[#E8EDE8] truncate">Doctor Selected</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#F5F4EF] dark:bg-[#1F2E28] border border-[#E2DDD6] dark:border-[#2E3E34]">
              <div className="w-8 h-8 rounded-xl bg-[#2D6A4F] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                <span className="material-symbols-outlined text-[16px]">check</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-[#6B7F6E] dark:text-[#A8D5B5] uppercase font-bold">Step 2</span>
                <span className="text-[13px] font-semibold text-[#1A2E1A] dark:text-[#E8EDE8] truncate">Time Slot Locked</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#2D6A4F] text-white shadow-md relative overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-white text-[#2D6A4F] flex items-center justify-center text-xs font-bold">
                3
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-[#D8F3DC] uppercase font-bold">Current Step</span>
                <span className="text-[13px] font-semibold text-white truncate">Patient Details</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#F5F4EF]/60 dark:bg-[#1F2E28]/60 text-[#7A8E7E] border border-[#E2DDD6] dark:border-[#2E3E34]">
              <div className="w-8 h-8 rounded-xl bg-[#EFECE6] dark:bg-[#2A3A2E] text-[#7A8E7E] flex items-center justify-center text-xs font-bold">
                4
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase font-bold">Step 4</span>
                <span className="text-[13px] font-medium truncate">Confirmation</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Form & Booking Summary Grid */}
      <div className="max-w-[1360px] mx-auto w-full px-4 lg:px-8 py-8">
        <form onSubmit={handleConfirmReservation} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Panel: Intake Form */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {errorMessage && (
              <div className="bg-[#FDECEA] text-[#C44B4B] p-4 rounded-2xl flex items-center gap-3 border border-[#F5BDB8] shadow-sm animate-fadeIn">
                <span className="material-symbols-outlined text-[24px] text-[#C44B4B] shrink-0">error</span>
                <div className="flex flex-col">
                  <span className="text-[14px] font-bold">Appointment Notice</span>
                  <span className="text-[13px]">{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Reassurance Card */}
            <div className="bg-[#FFFFFF] dark:bg-[#1A2420] rounded-2xl p-4 shadow-sm flex items-start gap-3.5 border border-[#E2DDD6] dark:border-[#2E3E34]">
              <div className="w-10 h-10 rounded-xl bg-[#EAF5EE] dark:bg-[#1F2E28] text-[#2D6A4F] dark:text-[#74C69D] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">verified</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[14px] font-bold text-[#1A2E1A] dark:text-[#E8EDE8]">Slot Exclusively Reserved</span>
                <p className="text-[13px] text-[#4A5F4E] dark:text-[#B8CCBC] leading-relaxed">
                  We have reserved this consultation time exclusively for you. Your booking will be instantly confirmed upon submission.
                </p>
              </div>
            </div>

            {/* Mode of Consultation Cards */}
            <div className="bg-[#FFFFFF] dark:bg-[#1A2420] rounded-2xl p-6 shadow-sm border border-[#E2DDD6] dark:border-[#2E3E34]">
              <h3 className="text-[15px] font-bold text-[#1A2E1A] dark:text-[#E8EDE8] mb-3">
                1. Select How You Would Like to Meet
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div
                  onClick={() => setConsultationMode('IN_PERSON')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    consultationMode === 'IN_PERSON'
                      ? 'bg-[#EAF5EE] dark:bg-[#1F2E28] border-[#2D6A4F] shadow-sm'
                      : 'bg-white dark:bg-[#1A2420] border-[#E2DDD6] dark:border-[#2E3E34] hover:border-[#2D6A4F]'
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    checked={consultationMode === 'IN_PERSON'}
                    onChange={() => setConsultationMode('IN_PERSON')}
                    className="mt-1 text-[#2D6A4F]"
                  />
                  <div>
                    <span className="text-[14px] font-bold text-[#1A2E1A] dark:text-[#E8EDE8] block">
                      In-Person Hospital Visit
                    </span>
                    <span className="text-[12px] text-[#4A5F4E] dark:text-[#B8CCBC] block mt-0.5">
                      {doctor.chamberRoom} • Comprehensive examination at clinic
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => setConsultationMode('TELE_CONSULT')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    consultationMode === 'TELE_CONSULT'
                      ? 'bg-[#EAF5EE] dark:bg-[#1F2E28] border-[#2D6A4F] shadow-sm'
                      : 'bg-white dark:bg-[#1A2420] border-[#E2DDD6] dark:border-[#2E3E34] hover:border-[#2D6A4F]'
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    checked={consultationMode === 'TELE_CONSULT'}
                    onChange={() => setConsultationMode('TELE_CONSULT')}
                    className="mt-1 text-[#2D6A4F]"
                  />
                  <div>
                    <span className="text-[14px] font-bold text-[#1A2E1A] dark:text-[#E8EDE8] block">
                      Secure Video Consultation
                    </span>
                    <span className="text-[12px] text-[#4A5F4E] dark:text-[#B8CCBC] block mt-0.5">
                      Online video call from home • Digital prescription included
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Patient Information Form */}
            <div className="bg-[#FFFFFF] dark:bg-[#1A2420] rounded-2xl p-6 shadow-sm border border-[#E2DDD6] dark:border-[#2E3E34]">
              <h3 className="text-[15px] font-bold text-[#1A2E1A] dark:text-[#E8EDE8] mb-4">
                2. Patient Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-[12px] font-semibold text-[#4A5F4E] dark:text-[#A8D5B5] block mb-1.5">
                    Patient Full Name
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2DDD6] dark:border-[#2E3E34] bg-[#FAFAF7] dark:bg-[#16201B] text-[13px] text-[#1A2E1A] dark:text-[#E8EDE8] outline-none focus:border-[#2D6A4F]"
                    required
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-[#4A5F4E] dark:text-[#A8D5B5] block mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2DDD6] dark:border-[#2E3E34] bg-[#FAFAF7] dark:bg-[#16201B] text-[13px] text-[#1A2E1A] dark:text-[#E8EDE8] outline-none focus:border-[#2D6A4F]"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="text-[12px] font-semibold text-[#4A5F4E] dark:text-[#A8D5B5] block mb-1.5">
                  Reason for Visit / Symptoms
                </label>
                <textarea
                  rows={3}
                  value={reasonForVisit}
                  onChange={(e) => setReasonForVisit(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2DDD6] dark:border-[#2E3E34] bg-[#FAFAF7] dark:bg-[#16201B] text-[13px] text-[#1A2E1A] dark:text-[#E8EDE8] outline-none focus:border-[#2D6A4F] resize-none"
                  placeholder="Describe your health concern, symptoms, or follow-up reason..."
                  required
                />
              </div>

              {/* Consent Toggle */}
              <div className="mt-4 pt-3 border-t border-[#E2DDD6] dark:border-[#2E3E34] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[20px] text-[#2D6A4F]">lock</span>
                  <div>
                    <span className="text-[13px] font-bold text-[#1A2E1A] dark:text-[#E8EDE8] block">Health Record Privacy & Sync</span>
                    <span className="text-[11px] text-[#6B7F6E] dark:text-[#B8CCBC] block">Allows your doctor to view previous clinical notes and lab results</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setVaultConsent(!vaultConsent)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    vaultConsent ? 'bg-[#2D6A4F]' : 'bg-[#E2DDD6]'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      vaultConsent ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: Live Booking Summary & Submission */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-[#FFFFFF] dark:bg-[#1A2420] rounded-2xl p-6 shadow-md border border-[#E2DDD6] dark:border-[#2E3E34]">
              <h3 className="text-[16px] font-bold text-[#1A2E1A] dark:text-[#E8EDE8] mb-4 pb-2 border-b border-[#E2DDD6] dark:border-[#2E3E34]">
                Booking Summary
              </h3>

              <div className="flex items-center gap-3 mb-4">
                <img
                  src={doctor.avatarUrl}
                  alt={doctor.displayName}
                  className="w-13 h-13 rounded-xl object-cover shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/consultation.png'; }}
                />
                <div>
                  <h4 className="text-[14px] font-bold text-[#1A2E1A] dark:text-[#E8EDE8]">{doctor.displayName}</h4>
                  <span className="text-[12px] text-[#2D6A4F] dark:text-[#74C69D] font-semibold">{doctor.departmentName}</span>
                  <span className="text-[11px] text-[#6B7F6E] dark:text-[#B8CCBC] block">{doctor.chamberRoom}</span>
                </div>
              </div>

              <div className="space-y-2 py-3 border-y border-[#E2DDD6] dark:border-[#2E3E34] text-[13px]">
                <div className="flex justify-between">
                  <span className="text-[#6B7F6E] dark:text-[#B8CCBC]">Date & Time:</span>
                  <span className="font-bold text-[#1A2E1A] dark:text-[#E8EDE8]">Today, 10:15 AM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7F6E] dark:text-[#B8CCBC]">Consultation Type:</span>
                  <span className="font-semibold text-[#1A2E1A] dark:text-[#E8EDE8]">
                    {consultationMode === 'IN_PERSON' ? 'In-Person Hospital Visit' : 'Video Consultation'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7F6E] dark:text-[#B8CCBC]">Patient ID:</span>
                  <span className="font-mono text-[#1A2E1A] dark:text-[#E8EDE8] font-semibold">{uhid}</span>
                </div>
              </div>

              {/* Fee Breakdown */}
              <div className="py-3 border-b border-[#E2DDD6] dark:border-[#2E3E34] space-y-1.5 text-[13px]">
                <div className="flex justify-between text-[#6B7F6E] dark:text-[#B8CCBC]">
                  <span>Consultation Fee:</span>
                  <span>₹1,000.00</span>
                </div>
                <div className="flex justify-between text-[#6B7F6E] dark:text-[#B8CCBC]">
                  <span>Hospital Care Services:</span>
                  <span>₹100.00</span>
                </div>
                <div className="flex justify-between text-[#6B7F6E] dark:text-[#B8CCBC]">
                  <span>Taxes (5%):</span>
                  <span>₹55.00</span>
                </div>
                <div className="flex justify-between text-[15px] font-bold text-[#1A2E1A] dark:text-[#E8EDE8] pt-2 border-t border-[#E2DDD6] dark:border-[#2E3E34]">
                  <span>Total Due at Visit:</span>
                  <span className="text-[#2D6A4F] dark:text-[#74C69D]">₹1,155.00</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-5 py-3 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold text-[14px] shadow-sm transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    <span>Confirming Appointment...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span>Confirm Appointment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
