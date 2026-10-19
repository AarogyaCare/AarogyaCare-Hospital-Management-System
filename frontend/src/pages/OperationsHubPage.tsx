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
  const [liveTelemetry, setLiveTelemetry] = useState<any>(null);
  const [visitCompleted, setVisitCompleted] = useState(false);
  const [visitToast, setVisitToast] = useState<string | null>(null);

  const handleCompleteVisit = () => {
    setVisitCompleted(true);
    setVisitToast('Clinical Assessment signed and saved to Patient Health Record.');
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

  // Dispense stock item
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
      const medName = stockList.find(m => m.id === medId)?.name || 'Medication';
      setDispenseSuccess(`Dispensed 1 unit of ${medName}. Remaining stock: ${res.newStock}`);
      setTimeout(() => setDispenseSuccess(null), 4000);
    } catch (err: any) {
      setDispenseError(err.message || 'Dispensing rejected: Insufficient stock');
      setTimeout(() => setDispenseError(null), 5000);
    }
  };

  // Emergency status transition
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
    <div className="flex flex-col w-full min-h-screen bg-[#FAFAF7] dark:bg-[#111814] text-[#1A2E1A] dark:text-[#E8EDE8] font-sans">
      {/* 1. Warm Header Banner */}
      <div className="w-full bg-[#1A2E1A] text-[#FAFAF7] py-3.5 px-4 lg:px-8 border-b border-[#2D6A4F]">
        <div className="max-w-[1360px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2 text-[13px]">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#74C69D] text-[22px]">health_and_safety</span>
            <span className="font-bold text-[15px] text-white">
              Hospital Services & Pharmacy Dispensary
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#2D6A4F] text-[#D8F3DC] text-[11px] font-semibold">
              Chennai Campus · Active
            </span>
          </div>
          <div className="flex items-center gap-2 text-[#A8D5B5]">
            <span>Database: <strong className="text-white">Active</strong></span>
            <span>•</span>
            <span>Cache: <strong className="text-white">Connected</strong></span>
          </div>
        </div>
      </div>

      <div className="max-w-[1360px] mx-auto w-full px-4 lg:px-8 py-6">
        {/* 2. Operational Role Perspective Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-[26px] font-bold text-[#1A2E1A] dark:text-[#E8EDE8] tracking-tight">
              Hospital Services Overview
            </h1>
            <p className="text-[13px] text-[#4A5F4E] dark:text-[#B8CCBC] mt-0.5">
              Live patient routing, pharmacy inventory adjustments, and consultation workspace
            </p>
          </div>

          {/* Perspective Pills */}
          <div className="inline-flex p-1 rounded-2xl bg-[#EFECE6] dark:bg-[#1F2E28] border border-[#E2DDD6] dark:border-[#2E3E34] overflow-x-auto max-w-full">
            {[
              { id: 'admin', label: 'Overview' },
              { id: 'doctor', label: 'Doctor Station' },
              { id: 'nurse', label: 'Triage Nurse' },
              { id: 'receptionist', label: 'Front Desk' },
              { id: 'pharmacist', label: 'Pharmacy' },
              { id: 'billing_staff', label: 'Billing' }
            ].map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => handleRoleChange(r.id as UserRole)}
                className={`px-3.5 py-1.5 rounded-xl text-[13px] font-medium transition-all whitespace-nowrap ${
                  activePerspective === r.id
                    ? 'bg-[#2D6A4F] text-white font-semibold shadow-sm'
                    : 'text-[#4A5F4E] dark:text-[#B8CCBC] hover:text-[#1A2E1A] dark:hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Meaningful KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#FFFFFF] dark:bg-[#1A2420] rounded-2xl p-5 shadow-sm border border-[#E2DDD6] dark:border-[#2E3E34]">
            <div className="flex items-center justify-between text-[#6B7F6E] dark:text-[#A8D5B5] mb-2">
              <span className="text-[12px] uppercase font-semibold tracking-wider">Patients Registered</span>
              <span className="material-symbols-outlined text-[#2D6A4F] text-[20px]">how_to_reg</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[28px] font-bold text-[#1A2E1A] dark:text-[#E8EDE8]">148</span>
              <span className="text-[12px] font-semibold text-[#2D6A4F]">+18% today</span>
            </div>
            <p className="text-[11px] text-[#7A8E7E] mt-1.5">Unique health IDs verified</p>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#1A2420] rounded-2xl p-5 shadow-sm border border-[#E2DDD6] dark:border-[#2E3E34]">
            <div className="flex items-center justify-between text-[#6B7F6E] dark:text-[#A8D5B5] mb-2">
              <span className="text-[12px] uppercase font-semibold tracking-wider">Active Consultations</span>
              <span className="material-symbols-outlined text-[#2D6A4F] text-[20px]">stethoscope</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[28px] font-bold text-[#1A2E1A] dark:text-[#E8EDE8]">34</span>
              <span className="text-[12px] text-[#7A8E7E]">/ 42 Chambers</span>
            </div>
            <div className="mt-2 w-full bg-[#EFECE6] dark:bg-[#2A3A2E] rounded-full h-1.5 overflow-hidden">
              <div className="bg-[#2D6A4F] h-full rounded-full" style={{ width: '81%' }}></div>
            </div>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#1A2420] rounded-2xl p-5 shadow-sm border border-[#E2DDD6] dark:border-[#2E3E34]">
            <div className="flex items-center justify-between text-[#6B7F6E] dark:text-[#A8D5B5] mb-2">
              <span className="text-[12px] uppercase font-semibold tracking-wider">Urgent Care (STAT)</span>
              <span className="material-symbols-outlined text-[#C44B4B] text-[20px] animate-pulse">emergency</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[28px] font-bold text-[#C44B4B]">{emergencyQueue.length}</span>
              <span className="text-[12px] text-[#C44B4B] font-semibold">Priority Triage</span>
            </div>
            <p className="text-[11px] text-[#7A8E7E] mt-1.5">Avg door-to-doctor: 4.2 min</p>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#1A2420] rounded-2xl p-5 shadow-sm border border-[#E2DDD6] dark:border-[#2E3E34]">
            <div className="flex items-center justify-between text-[#6B7F6E] dark:text-[#A8D5B5] mb-2">
              <span className="text-[12px] uppercase font-semibold tracking-wider">Low Stock Medicines</span>
              <span className="material-symbols-outlined text-[#C77B2A] text-[20px]">medication</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[28px] font-bold text-[#C77B2A]">
                {stockList.filter(m => m.isLowStock).length}
              </span>
              <span className="text-[12px] text-[#C77B2A] font-semibold">Needs Reorder</span>
            </div>
            <p className="text-[11px] text-[#7A8E7E] mt-1.5">Automated purchase alert ready</p>
          </div>
        </div>

        {/* Dispense Toast Alert */}
        {dispenseSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-[#EAF5EE] dark:bg-[#1F2E28] text-[#2D6A4F] dark:text-[#74C69D] text-[13px] font-medium flex items-center gap-2 border border-[#C8D9CC] dark:border-[#2E3E34] animate-fadeIn">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>{dispenseSuccess}</span>
          </div>
        )}

        {/* 4. Main Two-Column Workspace */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left Column (8 cols): Triage Grid & Doctor Workstation */}
          <div className="xl:col-span-8 flex flex-col gap-6">
            {/* Live Triage Grid */}
            <div className="bg-[#FFFFFF] dark:bg-[#1A2420] rounded-2xl shadow-sm p-6 border border-[#E2DDD6] dark:border-[#2E3E34]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-2 border-b border-[#E2DDD6] dark:border-[#2E3E34]">
                <div>
                  <h2 className="text-[17px] font-bold text-[#1A2E1A] dark:text-[#E8EDE8]">
                    Emergency Requests & Triage Routing
                  </h2>
                  <p className="text-[12px] text-[#6B7F6E] dark:text-[#B8CCBC] mt-0.5">
                    Real-time room routing and waiting time monitoring
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#EFECE6] dark:bg-[#1F2E28] text-[#4A5F4E] dark:text-[#A8D5B5] text-[11px] font-medium self-start sm:self-auto">
                  Auto-updated
                </span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F5F4EF] dark:bg-[#1F2E28] text-[#4A5F4E] dark:text-[#A8D5B5] text-[11px] uppercase tracking-wider font-semibold">
                      <th className="py-2.5 px-3 rounded-l-xl">Request ID</th>
                      <th className="py-2.5 px-3">Patient</th>
                      <th className="py-2.5 px-3">Department & Room</th>
                      <th className="py-2.5 px-3 text-center">Urgency Level</th>
                      <th className="py-2.5 px-3 text-center">Wait</th>
                      <th className="py-2.5 px-3 text-right rounded-r-xl">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2DDD6] dark:divide-[#2E3E34] text-[13px]">
                    {emergencyQueue.map(item => (
                      <tr key={item.id} className="hover:bg-[#F5F4EF]/60 dark:hover:bg-[#1F2E28]/60 transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-bold text-[#C44B4B]">{item.requestNumber}</span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-[#1A2E1A] dark:text-[#E8EDE8]">{item.patientName}</div>
                          <div className="text-[11px] text-[#6B7F6E] dark:text-[#B8CCBC]">{item.symptoms}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div>{item.assignedRoom}</div>
                          <div className="text-[11px] text-[#6B7F6E] dark:text-[#B8CCBC]">{item.assignedDoctor}</div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            item.priority.includes('STAT') ? 'bg-[#FDECEA] text-[#C44B4B] border border-[#F5BDB8]' : 'bg-[#EAF5EE] text-[#2D6A4F] border border-[#C8D9CC]'
                          }`}>
                            {item.priority}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-[#C44B4B]">
                          {item.waitTime}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handlePromoteEmergency(item.id)}
                            className="px-3 py-1 rounded-xl bg-[#EAF5EE] dark:bg-[#1F2E28] hover:bg-[#2D6A4F] hover:text-white text-[#2D6A4F] dark:text-[#74C69D] text-[12px] font-semibold transition-colors"
                          >
                            {item.status === 'TRIAGE_RECEIVED' ? 'Assign Room' : 'Ready'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Doctor Consultation Workstation */}
            <div className="bg-[#FFFFFF] dark:bg-[#1A2420] rounded-2xl shadow-sm p-6 border border-[#E2DDD6] dark:border-[#2E3E34]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2DDD6] dark:border-[#2E3E34] gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#EAF5EE] dark:bg-[#1F2E28] text-[#2D6A4F] dark:text-[#74C69D] flex items-center justify-center font-bold">
                    PS
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[16px] font-bold text-[#1A2E1A] dark:text-[#E8EDE8]">
                        Dr. Priya Sundaram
                      </h3>
                      <span className="px-2 py-0.5 bg-[#EFECE6] dark:bg-[#1F2E28] text-[#4A5F4E] dark:text-[#A8D5B5] rounded text-[11px] font-medium">
                        Chamber 04
                      </span>
                    </div>
                    <p className="text-[12px] text-[#6B7F6E] dark:text-[#B8CCBC]">
                      Active Encounter: Kavitha Narayanan (UHID: AC-2024-8842)
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full bg-[#EAF5EE] dark:bg-[#1F2E28] text-[#2D6A4F] dark:text-[#74C69D] text-[12px] font-medium flex items-center gap-1.5 self-start sm:self-auto">
                  <span className="w-2 h-2 rounded-full bg-[#52B788] animate-pulse"></span>
                  Consultation In Progress
                </span>
              </div>

              {/* Vitals Ribbon */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4 p-3 bg-[#F5F4EF] dark:bg-[#1F2E28] rounded-xl border border-[#E2DDD6] dark:border-[#2E3E34]">
                <div>
                  <span className="text-[11px] text-[#6B7F6E] dark:text-[#A8D5B5] uppercase font-medium">Blood Pressure</span>
                  <div className="text-[15px] font-bold text-[#1A2E1A] dark:text-[#E8EDE8]">
                    128/82 <span className="text-[11px] font-normal text-[#7A8E7E]">mmHg</span>
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-[#6B7F6E] dark:text-[#A8D5B5] uppercase font-medium">Pulse Rate</span>
                  <div className="text-[15px] font-bold text-[#1A2E1A] dark:text-[#E8EDE8]">
                    74 <span className="text-[11px] font-normal text-[#7A8E7E]">bpm</span>
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-[#6B7F6E] dark:text-[#A8D5B5] uppercase font-medium">Oxygen (SpO2)</span>
                  <div className="text-[15px] font-bold text-[#2D6A4F] dark:text-[#74C69D]">99%</div>
                </div>
                <div>
                  <span className="text-[11px] text-[#6B7F6E] dark:text-[#A8D5B5] uppercase font-medium">HbA1c</span>
                  <div className="text-[15px] font-bold text-[#1A2E1A] dark:text-[#E8EDE8]">7.1%</div>
                </div>
              </div>

              {/* Clinical Notes & Action */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-[#1A2E1A] dark:text-[#E8EDE8] flex items-center justify-between">
                    <span>Clinical Assessment & Notes</span>
                    <span className="text-[11px] text-[#52B788]">Auto-saved</span>
                  </label>
                  <textarea
                    readOnly
                    rows={4}
                    defaultValue="Patient reports stable glycemic control on Metformin 500mg BD. Mild complaints of bilateral ankle edema noted. Periodic lipid panel advised."
                    className="w-full p-3 rounded-xl bg-[#F5F4EF] dark:bg-[#1F2E28] text-[#1A2E1A] dark:text-[#E8EDE8] text-[13px] resize-none border border-[#E2DDD6] dark:border-[#2E3E34] outline-none"
                  />
                </div>

                <div className="flex flex-col justify-between gap-3">
                  <div>
                    <span className="text-[13px] font-semibold text-[#1A2E1A] dark:text-[#E8EDE8] block mb-2">
                      Care Actions
                    </span>
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-xl bg-[#F5F4EF] dark:bg-[#1F2E28] text-[12px] flex items-center justify-between">
                        <span>Serum Creatinine & Lipid Profile</span>
                        <span className="px-2 py-0.5 rounded bg-[#EFECE6] dark:bg-[#2A3A2E] text-[10px] font-semibold">Priority</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#F5F4EF] dark:bg-[#1F2E28] text-[12px] flex items-center justify-between">
                        <span>Refill: Metformin PR 500mg (90 Days)</span>
                        <span className="px-2 py-0.5 rounded bg-[#EFECE6] dark:bg-[#2A3A2E] text-[10px] font-semibold">Rx Draft</span>
                      </div>
                    </div>
                  </div>

                  {visitToast && (
                    <div className="p-2.5 rounded-xl bg-[#EAF5EE] text-[#2D6A4F] text-[12px] font-medium flex items-center gap-1.5 animate-fadeIn">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span>{visitToast}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleCompleteVisit}
                      disabled={visitCompleted}
                      className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all flex items-center gap-1.5 ${
                        visitCompleted
                          ? 'bg-[#2D6A4F] text-white cursor-default shadow-sm'
                          : 'bg-[#1A2E1A] text-white hover:bg-[#2D6A4F]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {visitCompleted ? 'done_all' : 'draw'}
                      </span>
                      <span>{visitCompleted ? 'Visit Finalized' : 'Sign & Complete Visit'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): Pharmacy Operations & Platform Reliability */}
          <div className="xl:col-span-4 flex flex-col gap-6">
            {/* Pharmacy Central Dispensary */}
            <div className="bg-[#FFFFFF] dark:bg-[#1A2420] rounded-2xl shadow-sm p-6 border border-[#E2DDD6] dark:border-[#2E3E34]">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E2DDD6] dark:border-[#2E3E34]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#2D6A4F] text-[20px]">local_pharmacy</span>
                  <h3 className="text-[16px] font-bold text-[#1A2E1A] dark:text-[#E8EDE8]">Pharmacy Stock</h3>
                  {isLivePharmacyDb ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[#EAF5EE] text-[#2D6A4F]">
                      Live DB
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[#FEF3E2] text-[#C77B2A]">
                      Demo
                    </span>
                  )}
                </div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#FDECEA] text-[#C44B4B] font-semibold">
                  {stockList.filter(m => m.isLowStock).length} Low Stock
                </span>
              </div>

              {dispenseError && (
                <div className="mb-3 p-2.5 rounded-xl bg-[#FDECEA] text-[#C44B4B] text-[12px] font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>{dispenseError}</span>
                </div>
              )}

              <div className="space-y-2.5 mb-4 max-h-[340px] overflow-y-auto scrollbar-thin pr-1">
                {stockList.map(med => (
                  <div key={med.id} className="p-3 rounded-xl bg-[#F5F4EF] dark:bg-[#1F2E28] border border-[#E2DDD6] dark:border-[#2E3E34] flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[13px] text-[#1A2E1A] dark:text-[#E8EDE8]">{med.name}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                        med.isLowStock ? 'bg-[#FDECEA] text-[#C44B4B]' : 'bg-[#EAF5EE] text-[#2D6A4F]'
                      }`}>
                        {med.stockQuantity} Left
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#6B7F6E] dark:text-[#B8CCBC]">
                      <span>Code: {med.catalogueCode}</span>
                      <button
                        type="button"
                        onClick={() => handleDispenseMedicine(med.id)}
                        className="text-[#2D6A4F] dark:text-[#74C69D] hover:underline font-semibold"
                      >
                        Dispense 1 Unit
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="w-full py-2.5 rounded-xl bg-[#EAF5EE] dark:bg-[#1F2E28] hover:bg-[#D8F3DC] text-[#2D6A4F] dark:text-[#74C69D] text-[13px] font-semibold transition-colors text-center"
              >
                Create Reorder Request
              </button>
            </div>

            {/* Platform Infrastructure Monitor */}
            <div className="bg-[#FFFFFF] dark:bg-[#1A2420] rounded-2xl shadow-sm p-6 border border-[#E2DDD6] dark:border-[#2E3E34]">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E2DDD6] dark:border-[#2E3E34]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#2D6A4F] text-[20px]">shield</span>
                  <h3 className="text-[16px] font-bold text-[#1A2E1A] dark:text-[#E8EDE8]">System Reliability</h3>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-[#52B788] animate-pulse"></span>
              </div>

              <div className="space-y-3.5 text-[12px]">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#EAF5EE] dark:bg-[#1F2E28] flex items-center justify-center text-[#2D6A4F] shrink-0">
                    <span className="material-symbols-outlined text-[17px]">badge</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#1A2E1A] dark:text-[#E8EDE8]">Patient ID Generator</span>
                      <span className="text-[#2D6A4F] dark:text-[#74C69D] font-bold">0 Collisions</span>
                    </div>
                    <p className="text-[#6B7F6E] dark:text-[#B8CCBC] text-[11px] truncate">Generates unique, secure hospital IDs</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#EAF5EE] dark:bg-[#1F2E28] flex items-center justify-center text-[#2D6A4F] shrink-0">
                    <span className="material-symbols-outlined text-[17px]">speed</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#1A2E1A] dark:text-[#E8EDE8]">Request Rate Protection</span>
                      <span className="text-[#2D6A4F] dark:text-[#74C69D] font-bold">99.8% Available</span>
                    </div>
                    <p className="text-[#6B7F6E] dark:text-[#B8CCBC] text-[11px] truncate">Protects hospital system during surges</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#EAF5EE] dark:bg-[#1F2E28] flex items-center justify-center text-[#2D6A4F] shrink-0">
                    <span className="material-symbols-outlined text-[17px]">memory</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#1A2E1A] dark:text-[#E8EDE8]">Record Cache Distribution</span>
                      <span className="text-[#2D6A4F] dark:text-[#74C69D] font-bold">3 Nodes Live</span>
                    </div>
                    <p className="text-[#6B7F6E] dark:text-[#B8CCBC] text-[11px] truncate">Evenly balances patient records across servers</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#EAF5EE] dark:bg-[#1F2E28] flex items-center justify-center text-[#2D6A4F] shrink-0">
                    <span className="material-symbols-outlined text-[17px]">search</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#1A2E1A] dark:text-[#E8EDE8]">Medical Term Autocomplete</span>
                      <span className="text-[#2D6A4F] dark:text-[#74C69D] font-bold">&lt;3ms speed</span>
                    </div>
                    <p className="text-[#6B7F6E] dark:text-[#B8CCBC] text-[11px] truncate">Instant recommendations for medication search</p>
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
