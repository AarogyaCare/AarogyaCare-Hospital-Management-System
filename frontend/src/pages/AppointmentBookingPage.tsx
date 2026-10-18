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
    <div className="flex flex-col w-full min-h-screen">
      {/* 1. System Architecture Simulation Banner */}
      <div className="w-full bg-primary text-on-primary px-gutter-mobile lg:px-margin py-2.5">
        <div className="max-w-[1360px] mx-auto flex flex-wrap items-center justify-between gap-space-sm text-label-sm font-label-sm">
          <div className="flex items-center gap-space-sm">
            <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-tertiary-fixed animate-pulse"></span>
            <span className="font-title-sm text-title-sm tracking-wide text-tertiary-fixed">
              DISTRIBUTED CONCURRENCY ENGINE
            </span>
            <span className="text-on-primary-container hidden md:inline">
              | Redis Slot Lock (TTL: 600s) • UUIDv4 Generation • Token Bucket Quotas
            </span>
          </div>
          <div className="flex items-center gap-space-md text-on-primary-container">
            <span>Region: <strong className="text-on-primary">ap-south-1 (Chennai DC)</strong></span>
            <span>Latency: <strong className="text-tertiary-fixed font-title-sm">14ms</strong></span>
            <span className="px-2 py-0.5 rounded bg-surface-container-high/20 text-tertiary-fixed font-label-sm">
              Sandbox Active
            </span>
          </div>
        </div>
      </div>

      {/* 2. Hero-style Stepper Header */}
      <div className="w-full bg-surface-container-low py-space-lg shadow-sm border-b border-surface-container-high/70">
        <div className="max-w-[1360px] mx-auto px-gutter-mobile lg:px-margin">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm">
                  Outpatient Clinical Intake
                </span>
                <span className="text-on-surface-variant font-body-sm text-body-sm">
                  • High-Throughput Booking Gateway
                </span>
              </div>
              <h1 className="page-heading text-primary tracking-tight">
                Clinical Appointment Reservation
              </h1>
            </div>

            {/* Countdown Timer */}
            <div className="flex items-center gap-3 bg-surface-container-lowest px-4 py-2.5 rounded-xl shadow-sm border border-surface-container-high">
              <div className="flex flex-col text-right">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Slot Lock Expiry
                </span>
                <span className="font-headline-sm text-headline-sm text-error font-mono font-bold">
                  {formatTimer(secondsRemaining)}
                </span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-error-container text-on-error-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px] text-error">lock_clock</span>
              </div>
            </div>
          </div>

          {/* 4-Step Progress Navigation */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm relative">
            <div className="flex items-center gap-space-sm p-space-sm rounded-xl bg-surface-container-lowest shadow-sm opacity-90 border border-surface-container-high">
              <div className="w-8 h-8 rounded-lg bg-secondary text-on-secondary flex items-center justify-center font-title-sm text-title-sm shadow-sm">
                <span className="material-symbols-outlined text-[18px]">check</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Step 01</span>
                <span className="font-title-sm text-title-sm text-primary truncate">Doctor & Specialty</span>
              </div>
            </div>

            <div className="flex items-center gap-space-sm p-space-sm rounded-xl bg-surface-container-lowest shadow-sm opacity-90 border border-surface-container-high">
              <div className="w-8 h-8 rounded-lg bg-secondary text-on-secondary flex items-center justify-center font-title-sm text-title-sm shadow-sm">
                <span className="material-symbols-outlined text-[18px]">check</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Step 02</span>
                <span className="font-title-sm text-title-sm text-primary truncate">Slot Locked</span>
              </div>
            </div>

            <div className="flex items-center gap-space-sm p-space-sm rounded-xl bg-primary text-on-primary shadow-md relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-secondary-container"></div>
              <div className="w-8 h-8 rounded-lg bg-surface-container-lowest text-primary flex items-center justify-center font-title-sm text-title-sm font-bold">
                3
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-primary-fixed uppercase">Active Stage</span>
                <span className="font-title-sm text-title-sm text-on-primary truncate">Patient Intake & UHID</span>
              </div>
            </div>

            <div className="flex items-center gap-space-sm p-space-sm rounded-xl bg-surface-container-lowest/60 text-on-surface-variant border border-surface-container-high/60">
              <div className="w-8 h-8 rounded-lg bg-surface-container-high text-on-surface-variant flex items-center justify-center font-title-sm text-title-sm">
                4
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Step 04</span>
                <span className="font-title-sm text-title-sm text-on-surface-variant truncate">Order Confirmation</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Form & Booking Summary Grid */}
      <div className="max-w-[1360px] mx-auto w-full px-gutter-mobile lg:px-margin py-space-xl">
        <form onSubmit={handleConfirmReservation} className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
          {/* Left Panel: Intake Form */}
          <div className="lg:col-span-8 flex flex-col gap-space-lg">
            {errorMessage && (
              <div className="bg-error-container text-on-error-container p-4 rounded-xl flex items-center gap-3 border border-error/30 shadow-sm animate-fadeIn">
                <span className="material-symbols-outlined text-[24px] text-error shrink-0">error</span>
                <div className="flex flex-col">
                  <span className="font-title-sm text-title-sm font-bold text-error">Booking Reservation Conflict</span>
                  <span className="text-body-sm text-on-error-container">{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Concurrency Lock Live Status Card */}
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-start gap-space-md border border-surface-container-high">
              <div className="w-10 h-10 rounded-lg bg-tertiary text-on-tertiary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">verified_user</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-title-sm text-title-sm text-primary font-bold">Concurrency Lock Active</span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-mono text-[11px]">
                    TOKEN: redis_lock_{doctor.id}_slot_1015am
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  This candidate slot is locked exclusively for your session. Final booking commits atomically in a single PostgreSQL transaction.
                </p>
              </div>
            </div>

            {/* Mode of Consultation Cards */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-container-high">
              <h3 className="font-title-md text-title-md text-primary font-bold mb-3">
                1. Select Consultation Modality
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setConsultationMode('IN_PERSON')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    consultationMode === 'IN_PERSON'
                      ? 'bg-surface-container-high border-secondary shadow-sm'
                      : 'bg-surface-container-lowest border-surface-container-high hover:border-secondary'
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    checked={consultationMode === 'IN_PERSON'}
                    onChange={() => setConsultationMode('IN_PERSON')}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-title-sm text-title-sm text-primary block font-semibold">
                      In-Person OPD Consult
                    </span>
                    <span className="text-[12px] text-on-surface-variant block mt-0.5">
                      {doctor.chamberRoom} • Comprehensive physical evaluation
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => setConsultationMode('TELE_CONSULT')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    consultationMode === 'TELE_CONSULT'
                      ? 'bg-surface-container-high border-secondary shadow-sm'
                      : 'bg-surface-container-lowest border-surface-container-high hover:border-secondary'
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    checked={consultationMode === 'TELE_CONSULT'}
                    onChange={() => setConsultationMode('TELE_CONSULT')}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-title-sm text-title-sm text-primary block font-semibold">
                      HD Video Tele-Consult
                    </span>
                    <span className="text-[12px] text-on-surface-variant block mt-0.5">
                      Encrypted browser link delivered via SMS & short-url
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Patient Identification: UHID vs New Registration */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-container-high">
              <div className="flex items-center justify-between mb-4 border-b border-surface-container-high pb-3">
                <h3 className="font-title-md text-title-md text-primary font-bold">
                  2. Patient Identification & UHID
                </h3>
                <div className="flex items-center gap-1 bg-surface-container p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPatientType('EXISTING')}
                    className={`px-3 py-1 rounded-lg text-label-sm font-semibold transition-all ${
                      patientType === 'EXISTING' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant'
                    }`}
                  >
                    Existing UHID
                  </button>
                  <button
                    type="button"
                    onClick={() => setPatientType('NEW')}
                    className={`px-3 py-1 rounded-lg text-label-sm font-semibold transition-all ${
                      patientType === 'NEW' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant'
                    }`}
                  >
                    New Patient
                  </button>
                </div>
              </div>

              {patientType === 'EXISTING' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-label-md text-label-md text-on-surface-variant mb-1">
                        Hospital UHID Number
                      </label>
                      <input
                        type="text"
                        value={uhid}
                        onChange={(e) => setUhid(e.target.value)}
                        className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-on-surface font-title-sm focus:outline-none focus:ring-2 focus:ring-secondary border border-surface-container-high"
                        placeholder="e.g. AC-2024-9104"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-label-md text-label-md text-on-surface-variant mb-1">
                        Patient Full Name
                      </label>
                      <input
                        type="text"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-on-surface font-title-sm focus:outline-none focus:ring-2 focus:ring-secondary border border-surface-container-high"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-label-md text-label-md text-on-surface-variant mb-1">
                      Registered Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-on-surface font-title-sm focus:outline-none focus:ring-2 focus:ring-secondary border border-surface-container-high"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-label-md text-label-md text-on-surface-variant mb-1">
                        Full Legal Name
                      </label>
                      <input
                        type="text"
                        placeholder="First and Last Name"
                        className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-on-surface font-title-sm focus:outline-none focus:ring-2 focus:ring-secondary border border-surface-container-high"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-label-md text-label-md text-on-surface-variant mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-on-surface font-title-sm focus:outline-none focus:ring-2 focus:ring-secondary border border-surface-container-high"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <label className="block font-label-md text-label-md text-on-surface-variant mb-1">
                  Reason for Visit / Presenting Clinical Complaint
                </label>
                <textarea
                  value={reasonForVisit}
                  onChange={(e) => setReasonForVisit(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-xl bg-surface-container-low text-on-surface font-body-sm focus:outline-none focus:ring-2 focus:ring-secondary border border-surface-container-high resize-none"
                  placeholder="Describe your health concern, symptoms, or follow-up reason..."
                  required
                />
              </div>

              {/* Consent Toggle */}
              <div className="mt-4 pt-3 border-t border-surface-container-high flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-secondary">security</span>
                  <div>
                    <span className="font-title-sm text-title-sm text-primary block">Consent for Clinical EHR Record Sync</span>
                    <span className="text-[11px] text-on-surface-variant block">Allows attending specialist 72-hour access to clinical notes and vitals</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setVaultConsent(!vaultConsent)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    vaultConsent ? 'bg-secondary' : 'bg-surface-variant'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      vaultConsent ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: Live Booking Summary & Submission */}
          <div className="lg:col-span-4 flex flex-col gap-space-md">
            <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-md border border-surface-container-high">
              <h3 className="font-title-md text-title-md text-primary font-bold mb-4 pb-2 border-b border-surface-container-high">
                Appointment Summary
              </h3>

              <div className="flex items-center gap-3 mb-4">
                <img
                  src={doctor.avatarUrl}
                  alt={doctor.displayName}
                  className="w-14 h-14 rounded-xl object-cover shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/consultation.png'; }}
                />
                <div>
                  <h4 className="font-title-sm text-title-sm text-primary font-bold">{doctor.displayName}</h4>
                  <span className="text-[12px] text-secondary font-semibold">{doctor.departmentName}</span>
                  <span className="text-[11px] text-on-surface-variant block">{doctor.chamberRoom}</span>
                </div>
              </div>

              <div className="space-y-2 py-3 border-y border-surface-container-high text-body-sm">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Consultation Slot:</span>
                  <span className="font-bold text-primary">Today (Oct 24), 10:15 AM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Modality:</span>
                  <span className="font-semibold text-primary">
                    {consultationMode === 'IN_PERSON' ? 'In-Person OPD' : 'HD Tele-Consult'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Patient UHID:</span>
                  <span className="font-mono text-primary font-bold">{uhid}</span>
                </div>
              </div>

              {/* Fee Breakdown */}
              <div className="py-3 border-b border-surface-container-high space-y-1.5 text-body-sm">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Consultant Fee:</span>
                  <span>₹1,000.00</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Hospital Facility & Telemetry:</span>
                  <span>₹100.00</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>GST (5%):</span>
                  <span>₹55.00</span>
                </div>
                <div className="flex justify-between text-title-md font-bold text-primary pt-2 border-t border-surface-container-high/60">
                  <span>Total Amount:</span>
                  <span>₹1,155.00</span>
                </div>
              </div>

              {/* Idempotency Footer */}
              <div className="mt-3 p-2.5 rounded-lg bg-surface-container-low text-[11px] text-on-surface-variant flex items-center justify-between">
                <span>Idempotency Key:</span>
                <span className="font-mono text-primary font-bold truncate max-w-[140px]">{idempotencyKey}</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 py-3 rounded-xl bg-primary hover:bg-secondary text-white font-title-sm text-title-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    <span>Reserving Slot in PostgreSQL...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span>Confirm & Complete Booking</span>
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
