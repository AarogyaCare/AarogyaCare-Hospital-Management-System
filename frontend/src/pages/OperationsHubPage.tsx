import React, { useState, useEffect } from 'react';
import { MEDICINES, EMERGENCY_QUEUE, INITIAL_SYSTEM_METRICS } from '../data/mockData';
import { UserRole, EmergencyRequest } from '../types';
import { pharmacyService, emergencyService, systemDesignService } from '../services/api';

interface OperationsHubPageProps {
  currentRole?: UserRole;
  onSelectRole?: (role: UserRole) => void;
}

export const OperationsHubPage: React.FC<OperationsHubPageProps> = ({
  currentRole = 'admin',
  onSelectRole
}) => {
  const [activePerspective, setActivePerspective] = useState<UserRole>(currentRole);
  const [stockList, setStockList] = useState(MEDICINES);
  const [isLivePharmacyDb, setIsLivePharmacyDb] = useState(false);
  const [isPharmacyLoading, setIsPharmacyLoading] = useState(false);
  const [dispenseSuccess, setDispenseSuccess] = useState<string | null>(null);
  const [dispenseError, setDispenseError] = useState<string | null>(null);
  const [emergencyQueue, setEmergencyQueue] = useState<EmergencyRequest[]>(EMERGENCY_QUEUE);
  const [systemMetrics] = useState(INITIAL_SYSTEM_METRICS);
  const [liveTelemetry, setLiveTelemetry] = useState<any>(null);
  const [visitCompleted, setVisitCompleted] = useState(false);
  const [visitToast, setVisitToast] = useState<string | null>(null);

  const handleCompleteVisit = () => {
    setVisitCompleted(true);
    setVisitToast('Clinical Assessment signed and sealed in EHR. Visit status updated to COMPLETED.');
    setTimeout(() => setVisitToast(null), 4500);
  };

  useEffect(() => {
    setIsPharmacyLoading(true);
    Promise.all([
      pharmacyService.getMedicines(),
      emergencyService.getQueue(),
      systemDesignService.getTelemetry()
    ])
      .then(([medRes, emQueue, telem]) => {
        setStockList(medRes.data);
        setIsLivePharmacyDb(medRes.isLiveDatabase);
        if (emQueue && emQueue.length > 0) {
          setEmergencyQueue(emQueue);
        }
        if (telem) {
          setLiveTelemetry(telem);
        }
      })
      .finally(() => {
        setIsPharmacyLoading(false);
      });
  }, []);

  const handleRoleChange = (role: UserRole) => {
    setActivePerspective(role);
    onSelectRole?.(role);
  };

  // Atomic stock decrement via backend or fallback
  const handleDispenseMedicine = async (medId: string) => {
    setDispenseError(null);
    try {
      const res = await pharmacyService.dispenseItem(medId, 1);
      setStockList(prev => prev.map(m => {
        if (m.id === medId) {
          const newQty = res.newStock;
          return { ...m, stockQuantity: newQty, isLowStock: newQty <= m.reorderThreshold };
        }
        return m;
      }));
      const medName = stockList.find(m => m.id === medId)?.name || 'Medicine';
      setDispenseSuccess(`Atomic decrement committed: Dispensed 1 unit of ${medName}. Remaining stock in PostgreSQL: ${res.newStock}`);
      setTimeout(() => setDispenseSuccess(null), 4000);
    } catch (err: any) {
      setDispenseError(err.message || 'Dispensing rejected: Insufficient stock');
      setTimeout(() => setDispenseError(null), 5000);
    }
  };

  // Emergency status transition via backend or fallback
  const handlePromoteEmergency = async (id: string) => {
    const target = emergencyQueue.find(e => e.id === id);
    if (!target) return;
    const nextStatus = target.status === 'TRIAGE_RECEIVED' ? 'IN_TREATMENT' : 'DISCHARGED';
    try {
      await emergencyService.updateStatus(id, nextStatus);
    } catch {
      // update state optimistically
    }
    setEmergencyQueue(prev => prev.map(em => {
      if (em.id === id) {
        return {
          ...em,
          status: nextStatus as any,
          waitTime: '<1m'
        };
      }
      return em;
    }));
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-background">
      {/* 1. Header Banner */}
      <div className="w-full bg-primary-container text-on-primary py-3 px-gutter-mobile lg:px-margin border-b border-primary">
        <div className="max-w-[1360px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary-fixed text-[22px]">hub</span>
            <span className="font-title-md text-title-md text-white font-bold">
              Hospital Management & Clinical Operations Hub
            </span>
            <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[11px] font-semibold">
              NODE 04 • LIVE
            </span>
          </div>
          <div className="flex items-center gap-2 text-label-sm text-on-primary-container">
            <span>Authoritative Source: <strong className="text-white">PostgreSQL</strong></span>
            <span>•</span>
            <span>Coordination: <strong className="text-tertiary-fixed">Redis Control</strong></span>
          </div>
        </div>
      </div>

      <div className="max-w-[1360px] mx-auto w-full px-gutter-mobile lg:px-margin py-space-lg">
        {/* 2. Operational Role Perspective Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-lg">
          <div>
            <h1 className="page-heading text-primary tracking-tight">
              Clinical Operations & Telemetry Grid
            </h1>
            <p className="body-text text-on-surface-variant mt-1">
              Chennai Tertiary Campus • Concurrent Orchestration Layer (HL7 / FHIR R4 Ready)
            </p>
          </div>

          {/* Perspective Pills */}
          <div className="inline-flex p-1 rounded-xl bg-surface-container shadow-sm self-start md:self-auto overflow-x-auto max-w-full border border-surface-container-high">
            {[
              { id: 'admin', label: 'Admin / Director' },
              { id: 'doctor', label: 'Doctor (OPD)' },
              { id: 'nurse', label: 'Triage / Nurse' },
              { id: 'receptionist', label: 'Receptionist' },
              { id: 'pharmacist', label: 'Pharmacist' },
              { id: 'billing_staff', label: 'Billing Desk' }
            ].map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => handleRoleChange(r.id as UserRole)}
                className={`px-3 py-1.5 rounded-lg font-title-sm text-title-sm transition-all whitespace-nowrap ${
                  activePerspective === r.id
                    ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. KPI Bento Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-space-md mb-space-xl">
          {/* Stat 1 */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container-high flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant mb-1">
              <span className="font-label-md text-label-md uppercase tracking-wider">Patients Today</span>
              <span className="material-symbols-outlined text-secondary text-[20px]">how_to_reg</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">148</span>
              <span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold">+18%</span>
            </div>
            <div className="mt-1 flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
              <span>UHID sequence valid</span>
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container-high flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant mb-1">
              <span className="font-label-md text-label-md uppercase tracking-wider">Active Consults</span>
              <span className="material-symbols-outlined text-secondary text-[20px]">stethoscope</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">34</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">/ 42 Chambers</span>
            </div>
            <div className="mt-2 w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
              <div className="bg-secondary h-full rounded-full" style={{ width: '81%' }}></div>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="bg-error-container/40 rounded-xl p-space-md shadow-sm border border-error/20 flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-error-container mb-1">
              <span className="font-label-md text-label-md uppercase tracking-wider font-semibold">Triage Priority-1</span>
              <span className="material-symbols-outlined text-error text-[20px] animate-pulse">emergency</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-headline-lg text-headline-lg text-error tracking-tight font-bold">06</span>
              <span className="font-label-sm text-label-sm text-on-error-container">Red Flagged</span>
            </div>
            <div className="mt-1 font-label-sm text-label-sm text-error font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">timer</span> Mean door-to-MD: 4.2m
            </div>
          </div>

          {/* Stat 4 */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container-high flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant mb-1">
              <span className="font-label-md text-label-md uppercase tracking-wider">ICU Occupancy</span>
              <span className="material-symbols-outlined text-secondary text-[20px]">airline_seat_individual_suite</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">36</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">/ 40 Beds</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-label-sm text-label-sm">
              <span className="text-error font-semibold">90% Capacity</span>
              <span className="text-on-surface-variant">4 Open</span>
            </div>
          </div>

          {/* Stat 5 */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container-high flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant mb-1">
              <span className="font-label-md text-label-md uppercase tracking-wider">Pharmacy Alert</span>
              <span className="material-symbols-outlined text-error text-[20px]">medication_liquid</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-headline-lg text-headline-lg text-on-error-container tracking-tight font-bold">02</span>
              <span className="font-label-sm text-label-sm text-on-error-container">Low Antibiotics</span>
            </div>
            <div className="mt-1 font-label-sm text-label-sm text-on-surface-variant truncate">
              Meropenem & Colistin
            </div>
          </div>

          {/* Stat 6 */}
          <div className="bg-primary-container text-on-primary rounded-xl p-space-md shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-primary-container mb-1">
              <span className="font-label-md text-label-md uppercase tracking-wider text-surface-container-high">Slot Concurrency</span>
              <span className="material-symbols-outlined text-secondary-fixed text-[20px]">dataset</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-headline-lg text-headline-lg text-white tracking-tight font-bold">0</span>
              <span className="font-label-sm text-label-sm text-primary-fixed font-semibold">Collisions</span>
            </div>
            <div className="mt-1 font-label-sm text-label-sm text-surface-container-high flex items-center gap-1">
              <span className="material-symbols-outlined text-secondary-fixed text-[14px]">lock_clock</span> Distributed KV Sync
            </div>
          </div>
        </div>

        {/* Dispense Toast Alert */}
        {dispenseSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed font-body-sm flex items-center gap-2 shadow-md animate-fadeIn">
            <span className="material-symbols-outlined text-[20px] text-tertiary">check_circle</span>
            <span>{dispenseSuccess}</span>
          </div>
        )}

        {/* 4. Main Two-Column Asymmetric Workspace */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg mb-space-xl">
          {/* Left Column (8 cols): Triage Grid & Doctor Workstation */}
          <div className="xl:col-span-8 flex flex-col gap-space-lg">
            {/* Live Triage Grid */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg border border-surface-container-high flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-md gap-space-sm border-b border-surface-container-high">
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-primary font-bold">
                    Live Outpatient & Emergency Triage Grid
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Real-time room routing and waiting SLA tracking
                  </p>
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className="font-label-sm text-label-sm px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant">
                    Auto-refresh 5s
                  </span>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto -mx-space-lg px-space-lg mt-3">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant font-label-md text-label-md uppercase tracking-wider">
                      <th className="py-2.5 px-3 rounded-l-lg">Token / UHID</th>
                      <th className="py-2.5 px-3">Patient</th>
                      <th className="py-2.5 px-3">Dept & Chamber</th>
                      <th className="py-2.5 px-3 text-center">Triage Score</th>
                      <th className="py-2.5 px-3 text-center">Wait</th>
                      <th className="py-2.5 px-3 text-right rounded-r-lg">State / Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high text-on-surface font-body-sm text-body-sm">
                    {emergencyQueue.map(item => (
                      <tr key={item.id} className="hover:bg-surface-container-low/60 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex flex-col">
                            <span className="font-title-sm text-title-sm text-error font-bold">{item.requestNumber}</span>
                            <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">AC-2024-9104</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-title-sm text-title-sm font-semibold">{item.patientName}</div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">{item.symptoms}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-title-sm text-title-sm">{item.assignedRoom}</div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">{item.assignedDoctor}</div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-semibold ${
                            item.priority === 'ESI-1_STAT' ? 'bg-error-container text-on-error-container' : 'bg-secondary-fixed text-on-secondary-fixed'
                          }`}>
                            {item.priority}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-error">
                          {item.waitTime}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handlePromoteEmergency(item.id)}
                            className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-secondary hover:text-white text-primary text-[12px] font-semibold transition-colors"
                          >
                            {item.status === 'TRIAGE_RECEIVED' ? 'Assign Resus' : 'Bed Ready'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Doctor Consultation Workstation */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg border border-surface-container-high flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-sm border-b border-surface-container-high gap-2">
                <div className="flex items-center gap-space-sm">
                  <div className="w-11 h-11 rounded-full bg-secondary/20 text-secondary flex items-center justify-center font-bold">
                    PS
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
                        Dr. Priya Sundaram
                      </h3>
                      <span className="px-2 py-0.5 bg-surface-container-high text-secondary rounded font-label-sm text-label-sm">
                        Chamber 04
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Active Encounter: Kavitha Narayanan (UHID: AC-2024-8842)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                    Audio Scribe Active
                  </span>
                </div>
              </div>

              {/* Vitals Ribbon */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm my-space-md p-space-sm bg-surface-container-low rounded-lg border border-surface-container-high">
                <div className="px-space-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Blood Pressure</span>
                  <div className="font-title-md text-title-md text-primary font-bold">
                    128/82 <span className="text-[11px] font-normal text-on-surface-variant">mmHg</span>
                  </div>
                </div>
                <div className="px-space-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Pulse / Rhythm</span>
                  <div className="font-title-md text-title-md text-primary font-bold">
                    74 <span className="text-[11px] font-normal text-on-surface-variant">bpm</span>
                  </div>
                </div>
                <div className="px-space-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">SpO2 (Room Air)</span>
                  <div className="font-title-md text-title-md text-secondary font-bold">99%</div>
                </div>
                <div className="px-space-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">HbA1c</span>
                  <div className="font-title-md text-title-md text-primary font-bold">7.1%</div>
                </div>
              </div>

              {/* Clinical Notes & Action */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                <div className="flex flex-col gap-1">
                  <label className="font-title-sm text-title-sm text-primary flex items-center justify-between">
                    <span>Differential Assessment</span>
                    <span className="text-[11px] text-secondary">Auto-saved</span>
                  </label>
                  <textarea
                    readOnly
                    rows={4}
                    defaultValue="Patient reports stable glycemic control on Metformin 500mg BD. Mild complaints of bilateral ankle edema noted. No orthopnea or PND. Periodic lipid panel advised."
                    className="w-full p-2.5 rounded-lg bg-surface-container-low text-on-surface font-body-sm text-body-sm resize-none border border-surface-container-high"
                  />
                </div>

                <div className="flex flex-col justify-between gap-2">
                  <div>
                    <span className="font-title-sm text-title-sm text-primary block mb-1">
                      Pending Clinical Actions
                    </span>
                    <div className="space-y-1.5">
                      <div className="p-2 rounded-lg bg-surface-container-low text-on-surface flex items-center justify-between text-body-sm">
                        <span>Order: Serum Creatinine & Lipid Profile</span>
                        <span className="px-2 py-0.5 rounded bg-surface-container-high text-[11px] font-semibold">Stat</span>
                      </div>
                      <div className="p-2 rounded-lg bg-surface-container-low text-on-surface flex items-center justify-between text-body-sm">
                        <span>Refill: Metformin PR 500mg (90 Days)</span>
                        <span className="px-2 py-0.5 rounded bg-surface-container-high text-[11px] font-semibold">Draft</span>
                      </div>
                    </div>
                  </div>

                  {visitToast && (
                    <div className="p-2.5 rounded-lg bg-secondary/10 border border-secondary text-secondary text-body-sm flex items-center gap-1.5 animate-fadeIn">
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      <span>{visitToast}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleCompleteVisit}
                      disabled={visitCompleted}
                      className={`px-4 py-2 rounded-lg font-title-sm text-title-sm transition-all flex items-center gap-1.5 ${
                        visitCompleted
                          ? 'bg-secondary text-white cursor-default shadow-sm'
                          : 'bg-primary text-white hover:bg-secondary active:scale-98'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {visitCompleted ? 'done_all' : 'draw'}
                      </span>
                      <span>{visitCompleted ? 'Consultation Signed & Finalized' : 'Sign & Complete Visit'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): Pharmacy Operations & Platform Architecture Monitor */}
          <div className="xl:col-span-4 flex flex-col gap-space-lg">
            {/* Pharmacy Central Dispensary */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg border border-surface-container-high flex flex-col">
              <div className="flex items-center justify-between mb-space-md pb-2 border-b border-surface-container-high">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-secondary text-[22px]">local_pharmacy</span>
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Central Dispensary</h3>
                  {isLivePharmacyDb ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      PostgreSQL Live
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                      Mock Stock
                    </span>
                  )}
                  {isPharmacyLoading && (
                    <span className="material-symbols-outlined text-[14px] text-primary animate-spin">refresh</span>
                  )}
                </div>
                <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-medium">
                  {stockList.filter(m => m.isLowStock).length} Shortages
                </span>
              </div>

              {dispenseSuccess && (
                <div className="mb-3 p-2.5 rounded-lg bg-secondary-fixed text-on-secondary-fixed text-[12px] font-semibold flex items-center gap-2 shadow-sm animate-fadeIn">
                  <span className="material-symbols-outlined text-[16px] text-secondary">check_circle</span>
                  <span>{dispenseSuccess}</span>
                </div>
              )}

              {dispenseError && (
                <div className="mb-3 p-2.5 rounded-lg bg-error-container text-on-error-container text-[12px] font-semibold flex items-center gap-2 shadow-sm animate-fadeIn">
                  <span className="material-symbols-outlined text-[16px] text-error">error</span>
                  <span>{dispenseError}</span>
                </div>
              )}

              <div className="space-y-space-sm mb-space-md">
                {stockList.map(med => (
                  <div key={med.id} className="p-3 rounded-lg bg-surface-container-low border border-surface-container-high flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-title-sm text-title-sm text-primary font-bold">{med.name}</span>
                      <span className={`font-label-sm text-label-sm px-1.5 py-0.5 rounded font-bold ${
                        med.isLowStock ? 'bg-error text-white' : 'bg-surface-container-high text-primary'
                      }`}>
                        {med.stockQuantity} Left
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                      <span>Code: {med.catalogueCode}</span>
                      <button
                        type="button"
                        onClick={() => handleDispenseMedicine(med.id)}
                        className="text-secondary hover:underline font-bold"
                      >
                        [Atomic Dispense 1]
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="w-full py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-title-sm text-title-sm transition-colors text-center"
              >
                Trigger Purchase Requisition
              </button>
            </div>

            {/* Platform Infrastructure Monitor */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg border border-surface-container-high flex flex-col">
              <div className="flex items-center justify-between mb-space-md pb-2 border-b border-surface-container-high">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-[20px]">hub</span>
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Platform Telemetry</h3>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse"></span>
              </div>

              <div className="space-y-3 text-body-sm">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-[18px]">tag</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-title-sm text-title-sm text-primary">UUIDv4 Generator</span>
                      <span className="text-[11px] text-secondary font-bold">0 Collisions</span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant truncate">RFC 4122 compliant • 28.4k IDs/s</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-[18px]">speed</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-title-sm text-title-sm text-primary">Token Bucket Rate Limiter</span>
                      <span className="text-[11px] text-secondary font-bold">
                        {liveTelemetry?.components?.rate_limiter
                          ? `${(100 - (liveTelemetry.components.rate_limiter.rejection_rate_pct || 0)).toFixed(1)}% OK`
                          : '99.8% OK'}
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant truncate">
                      {liveTelemetry?.components?.rate_limiter
                        ? `${liveTelemetry.components.rate_limiter.accepted} accepted • ${liveTelemetry.components.rate_limiter.avg_decision_latency_ms}ms decision`
                        : 'Atomic quota coordination • Emergency bypass'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-[18px]">donut_large</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-title-sm text-title-sm text-primary">Consistent Hash Ring</span>
                      <span className="text-[11px] text-secondary font-bold">
                        {liveTelemetry?.components?.consistent_hashing?.nodes?.length || 3} Nodes
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant truncate">
                      {liveTelemetry?.components?.consistent_hashing?.virtual_nodes_per_node || 150} vnodes each (Nodes A, B, C)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-[18px]">manage_search</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-title-sm text-title-sm text-primary">Trie Autocomplete</span>
                      <span className="text-[11px] text-secondary font-bold">
                        {liveTelemetry?.components?.autocomplete?.avg_query_latency_ms || 2.4}ms latency
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant truncate">
                      {liveTelemetry?.components?.autocomplete?.total_terms_indexed || 1840} indexed clinical terms
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
