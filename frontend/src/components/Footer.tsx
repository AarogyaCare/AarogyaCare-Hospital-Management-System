import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-primary text-on-primary pt-space-xl pb-space-lg mt-auto border-t border-primary-container">
      <div className="max-w-[1360px] mx-auto px-gutter-mobile lg:px-margin">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-space-lg mb-space-xl">
          {/* Col 1: Brand & Clinical Accreditation */}
          <div className="lg:col-span-2 flex flex-col gap-space-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-on-secondary shadow-md">
                <span className="material-symbols-outlined text-[24px]">local_hospital</span>
              </div>
              <div className="flex flex-col">
                <span className="font-brand font-bold text-[20px] text-white tracking-tight leading-none">
                  Aarogya Care
                </span>
                <span className="text-[12px] font-medium text-primary-fixed uppercase tracking-wider mt-1 leading-[16px]">
                  Multispecialty Hospital • Chennai
                </span>
              </div>
            </div>
            <p className="body-text text-on-primary-container leading-relaxed max-w-sm mt-2">
              Premier tertiary and quaternary healthcare ecosystem in South India. Advancing patient outcomes through sub-specialist collaboration, rapid-access triage, and distributed clinical fault-tolerance.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <div className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary text-label-sm font-label-sm flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-tertiary-fixed">verified</span>
                <span>NABH Accredited</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary text-label-sm font-label-sm flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-tertiary-fixed">workspace_premium</span>
                <span>JCI Gold Seal Standards</span>
              </div>
            </div>
          </div>

          {/* Col 2: Centres of Excellence */}
          <div className="flex flex-col gap-2">
            <h4 className="font-title-sm text-title-sm text-primary-fixed uppercase tracking-wider mb-2">
              Centres of Excellence
            </h4>
            <Link to="/specialties" className="text-body-sm text-on-primary-container hover:text-white transition-colors">
              Cardiac Sciences & Interventional PCI
            </Link>
            <Link to="/specialties" className="text-body-sm text-on-primary-container hover:text-white transition-colors">
              Comprehensive Neurosciences & Stroke
            </Link>
            <Link to="/specialties" className="text-body-sm text-on-primary-container hover:text-white transition-colors">
              Robotic Joint Reconstruction
            </Link>
            <Link to="/specialties" className="text-body-sm text-on-primary-container hover:text-white transition-colors">
              Women & Child (Level-III NICU)
            </Link>
            <Link to="/specialties" className="text-body-sm text-on-primary-container hover:text-white transition-colors">
              Organ Transplant & Hepatology
            </Link>
          </div>

          {/* Col 3: Quick Patient Services */}
          <div className="flex flex-col gap-2">
            <h4 className="font-title-sm text-title-sm text-primary-fixed uppercase tracking-wider mb-2">
              Patient Services
            </h4>
            <Link to="/doctors" className="text-body-sm text-on-primary-container hover:text-white transition-colors">
              Find a Consultant Doctor
            </Link>
            <Link to="/appointments/new" className="text-body-sm text-on-primary-container hover:text-white transition-colors">
              Book Real-Time Slot
            </Link>
            <Link to="/patient-portal" className="text-body-sm text-on-primary-container hover:text-white transition-colors">
              Access Patient Health Records (EHR)
            </Link>
            <Link to="/patient-portal" className="text-body-sm text-on-primary-container hover:text-white transition-colors">
              Digital Prescriptions & Invoices
            </Link>
            <Link to="/staff/operations" className="text-body-sm text-on-primary-container hover:text-white transition-colors">
              Clinical Operations & Telemetry Hub
            </Link>
          </div>

          {/* Col 4: 24/7 Campus & Emergency */}
          <div className="flex flex-col gap-2">
            <h4 className="font-title-sm text-title-sm text-error-container uppercase tracking-wider mb-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-error-container animate-pulse">emergency</span>
              <span>24/7 Emergency & Trauma</span>
            </h4>
            <div className="p-space-sm rounded-xl bg-primary-container/80 border border-primary-container flex flex-col gap-1">
              <span className="font-label-sm text-label-sm text-on-primary-container">Acute Trauma Resuscitation:</span>
              <a href="tel:+914428360000" className="font-title-md text-title-md text-white hover:underline">
                +91 44 2836 0000
              </a>
              <span className="text-[11px] text-primary-fixed font-mono">Door-to-Cath &lt;45 min protocol</span>
            </div>
            <div className="text-body-sm text-on-primary-container mt-1">
              Main Campus: 21 Greams Road, Thousand Lights, Chennai 600006, Tamil Nadu
            </div>
          </div>
        </div>

        {/* Academic Prototype Notice & Invariant Disclaimer */}
        <div className="pt-space-md border-t border-primary-container/70 flex flex-col md:flex-row items-center justify-between gap-space-sm text-label-sm text-label-sm text-on-primary-container">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span>Aarogya Care Scalable Hospital Management System Prototype (Design Phase Stage A/B/C/D)</span>
          </div>
          <div className="text-center md:text-right text-[11px]">
            Synthetic patient and transaction data only. Emergency intake and notification outbox items are simulated.
          </div>
        </div>
      </div>
    </footer>
  );
};
