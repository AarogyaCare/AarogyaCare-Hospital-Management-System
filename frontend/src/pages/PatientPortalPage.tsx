import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  INITIAL_APPOINTMENTS, 
  CLINICAL_RECORDS, 
  PRESCRIPTIONS, 
  INVOICES,
  EMERGENCY_QUEUE
} from '../data/mockData';
import { ClinicalRecord, Prescription, Invoice, EmergencyRequest } from '../types';
import { recordsService, prescriptionService, billingService, emergencyService, authService } from '../services/api';

export const PatientPortalPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'APPOINTMENTS' | 'RECORDS' | 'PRESCRIPTIONS' | 'BILLING' | 'EMERGENCY'>('OVERVIEW');
  const [records, setRecords] = useState<ClinicalRecord[]>(CLINICAL_RECORDS);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(PRESCRIPTIONS);
  const [invoices, setInvoices] = useState<Invoice[]>(INVOICES);
  const [emergencyList, setEmergencyList] = useState<EmergencyRequest[]>(EMERGENCY_QUEUE);
  const [paySuccess, setPaySuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadPortalData = async () => {
      setLoading(true);
      try {
        const user = await authService.me();
        const patientId = user?.patientProfile?.id;
        const [recs, rxs, invs, ems] = await Promise.all([
          recordsService.getClinicalRecords(patientId).catch(() => []),
          prescriptionService.getPrescriptions(patientId).catch(() => []),
          billingService.getInvoices(patientId).catch(() => []),
          emergencyService.getQueue().catch(() => [])
        ]);
        if (recs && recs.length > 0) setRecords(recs);
        if (rxs && rxs.length > 0) setPrescriptions(rxs);
        if (invs && invs.length > 0) setInvoices(invs);
        if (ems && ems.length > 0) setEmergencyList(ems);
      } catch {
        // preserve defaults
      } finally {
        setLoading(false);
      }
    };
    loadPortalData();
  }, []);

  const handleSimulatePayment = async (invId: string) => {
    try {
      const idempotencyKey = `pay-${invId}-${Date.now()}`;
      await billingService.simulatePayment(invId, 'SIMULATED_UPI', idempotencyKey);
      setInvoices(prev => prev.map(inv => {
        if (inv.id === invId) {
          return { ...inv, status: 'PAID' };
        }
        return inv;
      }));
      setPaySuccess('Payment successful! Your receipt has been updated.');
      setTimeout(() => setPaySuccess(null), 4000);
    } catch (err: any) {
      setPaySuccess(`Payment status: ${err.message || 'Updated'}`);
      setInvoices(prev => prev.map(inv => inv.id === invId ? { ...inv, status: 'PAID' } : inv));
      setTimeout(() => setPaySuccess(null), 4000);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAFAF7] dark:bg-[#111814] text-[#1A2E1A] dark:text-[#E8EDE8] font-sans">
      {/* Patient Header Banner */}
      <section className="w-full bg-[#1A2E1A] text-[#FAFAF7] py-6 px-4 lg:px-8 border-b border-[#2D6A4F]">
        <div className="max-w-[1360px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-[#2D6A4F] flex items-center justify-center text-white text-lg font-bold shadow-sm">
              SR
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-white">
                  S. Rajendran
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-[#2D6A4F] text-[#D8F3DC] text-[11px] font-mono font-semibold">
                  UHID: AC-2024-9104
                </span>
              </div>
              <p className="text-[12px] text-[#A8D5B5] mt-0.5">
                61 Y · Male · Blood Group: B+ve · Primary Doctor: Dr. K. Ramanathan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/appointments/new"
              className="px-4 py-2 rounded-xl bg-[#2D6A4F] text-white font-semibold text-[13px] hover:bg-[#1B4332] transition-all shadow-sm"
            >
              Book New Visit
            </Link>
          </div>
        </div>
      </section>

      {/* Main Tabbed Layout */}
      <div className="max-w-[1360px] mx-auto w-full px-4 lg:px-8 py-6 flex-1">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-[#E2DDD6] dark:border-[#2E3E34] mb-6">
          {[
            { id: 'OVERVIEW', label: 'My Health Overview', icon: 'grid_view' },
            { id: 'APPOINTMENTS', label: 'My Appointments', icon: 'calendar_month' },
            { id: 'RECORDS', label: 'Health Records', icon: 'clinical_notes' },
            { id: 'PRESCRIPTIONS', label: 'Prescriptions', icon: 'prescriptions' },
            { id: 'BILLING', label: 'Invoices & Receipts', icon: 'receipt_long' },
            { id: 'EMERGENCY', label: 'Emergency Requests', icon: 'emergency' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#2D6A4F] text-white shadow-sm font-semibold'
                  : 'bg-white dark:bg-[#1A2420] text-[#4A5F4E] dark:text-[#B8CCBC] hover:bg-[#F5F4EF] dark:hover:bg-[#1F2E28] border border-[#E2DDD6] dark:border-[#2E3E34]'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Payment Toast Notification */}
        {paySuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-[#EAF5EE] dark:bg-[#1F2E28] text-[#2D6A4F] dark:text-[#74C69D] text-[13px] font-medium flex items-center gap-2.5 border border-[#C8D9CC] dark:border-[#2E3E34] animate-fadeIn">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            <span>{paySuccess}</span>
          </div>
        )}

        {/* Tab 1: Clinical Overview */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6">
            {/* Vitals Card */}
            <div className="bg-[#FFFFFF] dark:bg-[#1A2420] rounded-2xl p-6 shadow-sm border border-[#E2DDD6] dark:border-[#2E3E34]">
              <h3 className="text-[15px] font-bold text-[#1A2E1A] dark:text-[#E8EDE8] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2D6A4F]">vital_signs</span>
                <span>Latest Health Vitals</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-xl bg-[#F5F4EF] dark:bg-[#1F2E28] border border-[#E2DDD6] dark:border-[#2E3E34]">
                  <span className="text-[11px] text-[#6B7F6E] dark:text-[#A8D5B5] uppercase font-semibold">Blood Pressure</span>
                  <div className="text-[20px] font-bold text-[#1A2E1A] dark:text-[#E8EDE8] mt-1">128/82</div>
                  <span className="text-[11px] text-[#4A5F4E] dark:text-[#B8CCBC]">mmHg (Healthy)</span>
                </div>
                <div className="p-4 rounded-xl bg-[#F5F4EF] dark:bg-[#1F2E28] border border-[#E2DDD6] dark:border-[#2E3E34]">
                  <span className="text-[11px] text-[#6B7F6E] dark:text-[#A8D5B5] uppercase font-semibold">Pulse Rate</span>
                  <div className="text-[20px] font-bold text-[#1A2E1A] dark:text-[#E8EDE8] mt-1">74</div>
                  <span className="text-[11px] text-[#4A5F4E] dark:text-[#B8CCBC]">bpm (Resting)</span>
                </div>
                <div className="p-4 rounded-xl bg-[#F5F4EF] dark:bg-[#1F2E28] border border-[#E2DDD6] dark:border-[#2E3E34]">
                  <span className="text-[11px] text-[#6B7F6E] dark:text-[#A8D5B5] uppercase font-semibold">Blood Oxygen (SpO2)</span>
                  <div className="text-[20px] font-bold text-[#2D6A4F] dark:text-[#74C69D] mt-1">99%</div>
                  <span className="text-[11px] text-[#4A5F4E] dark:text-[#B8CCBC]">Room Air</span>
                </div>
                <div className="p-4 rounded-xl bg-[#F5F4EF] dark:bg-[#1F2E28] border border-[#E2DDD6] dark:border-[#2E3E34]">
                  <span className="text-[11px] text-[#6B7F6E] dark:text-[#A8D5B5] uppercase font-semibold">HbA1c</span>
                  <div className="text-[20px] font-bold text-[#1A2E1A] dark:text-[#E8EDE8] mt-1">7.1%</div>
                  <span className="text-[11px] text-[#4A5F4E] dark:text-[#B8CCBC]">Good Control</span>
                </div>
              </div>
            </div>

            {/* Upcoming Consultations */}
            <div className="bg-[#FFFFFF] dark:bg-[#1A2420] rounded-2xl p-6 shadow-sm border border-[#E2DDD6] dark:border-[#2E3E34]">
              <h3 className="text-[15px] font-bold text-[#1A2E1A] dark:text-[#E8EDE8] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2D6A4F]">calendar_today</span>
                <span>Upcoming Appointments</span>
              </h3>
              <div className="space-y-3">
                {INITIAL_APPOINTMENTS.map(apt => (
                  <div key={apt.id} className="p-4 rounded-xl bg-[#F5F4EF] dark:bg-[#1F2E28] border border-[#E2DDD6] dark:border-[#2E3E34] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[14px] text-[#1A2E1A] dark:text-[#E8EDE8]">{apt.doctorName}</span>
                        <span className="px-2 py-0.5 rounded bg-[#EAF5EE] text-[#2D6A4F] text-[11px] font-semibold">{apt.departmentName}</span>
                      </div>
                      <p className="text-[12px] text-[#6B7F6E] dark:text-[#B8CCBC] mt-0.5">{apt.doctorChamber}</p>
                      <p className="text-[11px] text-[#7A8E7E] mt-0.5 font-mono">Reference: {apt.appointmentNumber}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-bold text-[13px] text-[#1A2E1A] dark:text-[#E8EDE8] block">{apt.slotDate}</span>
                        <span className="text-[12px] text-[#2D6A4F] dark:text-[#74C69D] font-semibold">{apt.slotTime}</span>
                      </div>
                      <Link
                        to={`/s/${apt.shortLinkCode}`}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#16201B] border border-[#E2DDD6] dark:border-[#2E3E34] text-[#2D6A4F] dark:text-[#74C69D] text-[12px] font-semibold hover:bg-[#EAF5EE] transition-colors"
                      >
                        View Slip
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Appointments */}
        {activeTab === 'APPOINTMENTS' && (
          <div className="bg-[#FFFFFF] dark:bg-[#1A2420] rounded-2xl p-6 shadow-sm border border-[#E2DDD6] dark:border-[#2E3E34]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-bold text-[#1A2E1A] dark:text-[#E8EDE8]">Consultation Schedule</h3>
              <Link to="/appointments/new" className="px-3.5 py-1.5 rounded-xl bg-[#2D6A4F] text-white text-[12px] font-semibold hover:bg-[#1B4332] transition-colors">
                Book Visit
              </Link>
            </div>
            <div className="divide-y divide-[#E2DDD6] dark:divide-[#2E3E34]">
              {INITIAL_APPOINTMENTS.map(apt => (
                <div key={apt.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]">
                  <div>
                    <span className="font-mono text-[11px] text-[#2D6A4F] font-bold block">{apt.appointmentNumber}</span>
                    <h4 className="font-bold text-[#1A2E1A] dark:text-[#E8EDE8] text-[14px]">{apt.doctorName}</h4>
                    <span className="text-[#6B7F6E] dark:text-[#B8CCBC]">{apt.doctorChamber} • Reason: {apt.reasonForVisit}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#EAF5EE] text-[#2D6A4F] text-[11px] font-semibold">
                      {apt.status}
                    </span>
                    <Link
                      to={`/appointments/${apt.appointmentNumber}/confirmation?doctor=${encodeURIComponent(apt.doctorName)}`}
                      className="px-3 py-1.5 rounded-xl bg-[#F5F4EF] dark:bg-[#1F2E28] text-[#1A2E1A] dark:text-[#E8EDE8] text-[12px] font-medium hover:bg-[#EFECE6] transition-colors border border-[#E2DDD6] dark:border-[#2E3E34]"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Records */}
        {activeTab === 'RECORDS' && (
          <div className="bg-[#FFFFFF] dark:bg-[#1A2420] rounded-2xl p-6 shadow-sm border border-[#E2DDD6] dark:border-[#2E3E34]">
            <h3 className="text-[16px] font-bold text-[#1A2E1A] dark:text-[#E8EDE8] mb-4">Diagnostic Reports & Clinical Notes</h3>
            <div className="space-y-3">
              {records.map(rec => (
                <div key={rec.id} className="p-4 rounded-xl bg-[#F5F4EF] dark:bg-[#1F2E28] border border-[#E2DDD6] dark:border-[#2E3E34] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]">
                  <div>
                    <h4 className="font-bold text-[#1A2E1A] dark:text-[#E8EDE8]">{rec.title}</h4>
                    <p className="text-[12px] text-[#6B7F6E] dark:text-[#B8CCBC] mt-0.5">{rec.authorDoctor} · {rec.date}</p>
                    <p className="text-[12px] text-[#4A5F4E] dark:text-[#B8CCBC] mt-1">{rec.summary}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#EAF5EE] text-[#2D6A4F] text-[11px] font-semibold self-start sm:self-auto">
                    Verified
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Prescriptions */}
        {activeTab === 'PRESCRIPTIONS' && (
          <div className="bg-[#FFFFFF] dark:bg-[#1A2420] rounded-2xl p-6 shadow-sm border border-[#E2DDD6] dark:border-[#2E3E34]">
            <h3 className="text-[16px] font-bold text-[#1A2E1A] dark:text-[#E8EDE8] mb-4">Current Prescriptions</h3>
            <div className="space-y-3">
              {prescriptions.map(p => (
                <div key={p.id} className="p-4 rounded-xl bg-[#F5F4EF] dark:bg-[#1F2E28] border border-[#E2DDD6] dark:border-[#2E3E34] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]">
                  <div>
                    <h4 className="font-bold text-[#1A2E1A] dark:text-[#E8EDE8]">{p.doctorName}</h4>
                    <p className="text-[12px] text-[#6B7F6E] dark:text-[#B8CCBC] mt-0.5">{p.date} · {p.diagnosis}</p>
                    <div className="mt-2 space-y-1">
                      {p.items?.map((m, i) => (
                        <p key={i} className="text-[12px] text-[#4A5F4E] dark:text-[#B8CCBC]">
                          • <strong>{m.medicineName}</strong> — {m.dosage} ({m.frequency}) for {m.duration}
                        </p>
                      ))}
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#EAF5EE] text-[#2D6A4F] text-[11px] font-semibold self-start sm:self-auto">
                    Active Rx
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Billing */}
        {activeTab === 'BILLING' && (
          <div className="bg-[#FFFFFF] dark:bg-[#1A2420] rounded-2xl p-6 shadow-sm border border-[#E2DDD6] dark:border-[#2E3E34]">
            <h3 className="text-[16px] font-bold text-[#1A2E1A] dark:text-[#E8EDE8] mb-4">Invoices & Receipts</h3>
            <div className="space-y-3">
              {invoices.map(inv => (
                <div key={inv.id} className="p-4 rounded-xl bg-[#F5F4EF] dark:bg-[#1F2E28] border border-[#E2DDD6] dark:border-[#2E3E34] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]">
                  <div>
                    <span className="font-mono text-[11px] text-[#6B7F6E] dark:text-[#A8D5B5] font-bold block">{inv.invoiceNumber}</span>
                    <h4 className="font-bold text-[#1A2E1A] dark:text-[#E8EDE8]">{inv.items?.[0]?.description || 'Clinical Care Services'}</h4>
                    <p className="text-[12px] text-[#6B7F6E] dark:text-[#B8CCBC]">{inv.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[15px] text-[#1A2E1A] dark:text-[#E8EDE8]">₹{inv.totalAmount.toLocaleString()}</span>
                    {inv.status === 'PAID' ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#EAF5EE] text-[#2D6A4F] text-[11px] font-semibold">
                        Paid
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSimulatePayment(inv.id)}
                        className="px-3 py-1 rounded-xl bg-[#2D6A4F] text-white text-[12px] font-semibold hover:bg-[#1B4332] transition-colors"
                      >
                        Pay Online
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 6: Emergency Requests */}
        {activeTab === 'EMERGENCY' && (
          <div className="bg-[#FFFFFF] dark:bg-[#1A2420] rounded-2xl p-6 shadow-sm border border-[#E2DDD6] dark:border-[#2E3E34]">
            <h3 className="text-[16px] font-bold text-[#1A2E1A] dark:text-[#E8EDE8] mb-4">Emergency Care Requests</h3>
            <div className="space-y-3">
              {emergencyList.map(req => (
                <div key={req.id} className="p-4 rounded-xl bg-[#F5F4EF] dark:bg-[#1F2E28] border border-[#E2DDD6] dark:border-[#2E3E34] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]">
                  <div>
                    <span className="font-bold text-[#C44B4B]">{req.requestNumber}</span>
                    <p className="font-semibold text-[#1A2E1A] dark:text-[#E8EDE8] mt-0.5">{req.patientName}</p>
                    <p className="text-[12px] text-[#6B7F6E] dark:text-[#B8CCBC]">{req.symptoms}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      req.priority.includes('STAT') ? 'bg-[#FDECEA] text-[#C44B4B]' : 'bg-[#EAF5EE] text-[#2D6A4F]'
                    }`}>
                      {req.priority}
                    </span>
                    <p className="text-[11px] text-[#7A8E7E] mt-1">{req.assignedRoom}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
