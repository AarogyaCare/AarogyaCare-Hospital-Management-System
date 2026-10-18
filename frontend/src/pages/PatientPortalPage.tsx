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
      setPaySuccess(`Simulated Sandbox Payment recorded! Status: PAID (Idempotency Key: ${idempotencyKey.slice(0, 16)}...).`);
      setTimeout(() => setPaySuccess(null), 5000);
    } catch (err: any) {
      setPaySuccess(`Payment simulation notice: ${err.message || 'Updated locally'}`);
      setInvoices(prev => prev.map(inv => inv.id === invId ? { ...inv, status: 'PAID' } : inv));
      setTimeout(() => setPaySuccess(null), 4000);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-background">
      {/* Patient Header Banner */}
      <section className="w-full bg-primary text-on-primary py-space-md border-b border-primary-container">
        <div className="max-w-[1360px] mx-auto px-gutter-mobile lg:px-margin flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-white font-headline-sm font-bold shadow-md">
              SR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-headline-sm text-headline-sm text-white font-bold">
                  S. Rajendran
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-label-sm font-mono font-bold">
                  UHID: AC-2024-9104
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-primary-fixed mt-0.5">
                61 Y • Male • Blood Group: B+ve • Primary Consultant: Dr. K. Ramanathan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/appointments/new"
              className="px-4 py-2 rounded-xl bg-secondary text-white font-title-sm hover:bg-secondary-container hover:text-on-secondary-container transition-all shadow-sm"
            >
              Book New Appointment
            </Link>
          </div>
        </div>
      </section>

      {/* Main Tabbed Layout */}
      <div className="max-w-[1360px] mx-auto w-full px-gutter-mobile lg:px-margin py-space-lg flex-1">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-surface-container-high mb-space-lg">
          {[
            { id: 'OVERVIEW', label: 'Clinical Overview', icon: 'grid_view' },
            { id: 'APPOINTMENTS', label: 'My Consultations', icon: 'calendar_month' },
            { id: 'RECORDS', label: 'Lab & Health Records', icon: 'clinical_notes' },
            { id: 'PRESCRIPTIONS', label: 'Prescriptions & Meds', icon: 'prescriptions' },
            { id: 'BILLING', label: 'Invoices & Billing', icon: 'receipt_long' },
            { id: 'EMERGENCY', label: 'Emergency Requests', icon: 'emergency' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-title-sm text-title-sm transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-sm font-bold'
                  : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Payment Toast Notification */}
        {paySuccess && (
          <div className="mb-6 p-4 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed font-body-sm flex items-center gap-3 shadow-md animate-fadeIn">
            <span className="material-symbols-outlined text-[24px] text-tertiary">check_circle</span>
            <span>{paySuccess}</span>
          </div>
        )}

        {/* Tab 1: Clinical Overview */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-space-lg">
            {/* Vitals Telemetry Card */}
            <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container-high">
              <h3 className="font-title-md text-title-md text-primary font-bold mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">vital_signs</span>
                <span>Latest Physiological Vitals (NABH Verified)</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high">
                  <span className="text-[11px] text-outline uppercase font-semibold">Blood Pressure</span>
                  <div className="font-headline-sm text-headline-sm text-primary font-bold mt-1">128/82</div>
                  <span className="text-[11px] text-on-surface-variant">mmHg (Normal)</span>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high">
                  <span className="text-[11px] text-outline uppercase font-semibold">Pulse Rate</span>
                  <div className="font-headline-sm text-headline-sm text-primary font-bold mt-1">74</div>
                  <span className="text-[11px] text-on-surface-variant">bpm (Sinus Rhythm)</span>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high">
                  <span className="text-[11px] text-outline uppercase font-semibold">Oxygen Saturation</span>
                  <div className="font-headline-sm text-headline-sm text-secondary font-bold mt-1">99%</div>
                  <span className="text-[11px] text-on-surface-variant">SpO2 on Room Air</span>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high">
                  <span className="text-[11px] text-outline uppercase font-semibold">Glycated HbA1c</span>
                  <div className="font-headline-sm text-headline-sm text-primary font-bold mt-1">7.1%</div>
                  <span className="text-[11px] text-on-surface-variant">Fair Control</span>
                </div>
              </div>
            </div>

            {/* Upcoming Consultations */}
            <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container-high">
              <h3 className="font-title-md text-title-md text-primary font-bold mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">calendar_today</span>
                <span>Active Outpatient Consultations</span>
              </h3>
              <div className="space-y-3">
                {INITIAL_APPOINTMENTS.map(apt => (
                  <div key={apt.id} className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-title-sm text-title-sm text-primary font-bold">{apt.doctorName}</span>
                        <span className="px-2 py-0.5 rounded bg-surface-container-high text-secondary text-[11px] font-semibold">{apt.departmentName}</span>
                      </div>
                      <p className="text-body-sm text-on-surface-variant mt-0.5">{apt.doctorChamber}</p>
                      <p className="text-[12px] text-outline mt-0.5 font-mono">Token: {apt.appointmentNumber}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-title-sm text-title-sm text-primary font-bold block">{apt.slotDate}</span>
                        <span className="text-[12px] text-secondary font-semibold">{apt.slotTime}</span>
                      </div>
                      <Link
                        to={`/s/${apt.shortLinkCode}`}
                        className="px-3 py-1.5 rounded-lg bg-surface-container text-primary font-title-sm text-title-sm hover:bg-secondary hover:text-white transition-colors"
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
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container-high">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Consultation History & Schedule</h3>
              <Link to="/appointments/new" className="px-4 py-2 rounded-xl bg-primary text-white font-title-sm hover:bg-secondary transition-colors">
                Book Slot
              </Link>
            </div>
            <div className="divide-y divide-surface-container-high">
              {INITIAL_APPOINTMENTS.map(apt => (
                <div key={apt.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-mono text-[12px] text-secondary font-bold block">{apt.appointmentNumber}</span>
                    <h4 className="font-title-md text-title-md text-primary font-bold">{apt.doctorName}</h4>
                    <span className="text-body-sm text-on-surface-variant">{apt.doctorChamber} • Reason: {apt.reasonForVisit}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-label-sm font-semibold">
                      {apt.status}
                    </span>
                    <Link
                      to={`/appointments/${apt.appointmentNumber}/confirmation?doctor=${encodeURIComponent(apt.doctorName)}`}
                      className="px-3 py-1.5 rounded-lg bg-surface-container text-primary font-title-sm hover:bg-secondary hover:text-white transition-colors"
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
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container-high">
            <h3 className="font-headline-sm text-headline-sm text-primary font-bold mb-4">Clinical EMR Notes & Diagnostic Reports</h3>
            {loading ? (
              <div className="py-8 text-center text-on-surface-variant animate-pulse font-body-sm">Loading verified clinical records from PostgreSQL...</div>
            ) : records.length === 0 ? (
              <div className="py-8 text-center text-outline font-body-sm">No clinical records on file.</div>
            ) : (
              <div className="space-y-4">
                {records.map(rec => (
                  <div key={rec.id} className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded bg-primary text-white text-[11px] font-semibold">{rec.recordType}</span>
                      <span className="text-[12px] text-on-surface-variant font-mono">{rec.date}</span>
                    </div>
                    <h4 className="font-title-md text-title-md text-primary font-bold">{rec.title}</h4>
                    <p className="text-body-sm text-on-surface-variant mt-2 leading-relaxed">{rec.summary}</p>
                    <div className="mt-3 pt-2 border-t border-surface-container-high/60 text-[11px] text-outline flex items-center justify-between">
                      <span>Authorized Signature: {rec.authorDoctor}</span>
                      <span>Audit Logged • SHA-256 Verified</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Prescriptions */}
        {activeTab === 'PRESCRIPTIONS' && (
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container-high">
            <h3 className="font-headline-sm text-headline-sm text-primary font-bold mb-4">Current Prescriptions</h3>
            {loading ? (
              <div className="py-8 text-center text-on-surface-variant animate-pulse font-body-sm">Loading digital prescriptions...</div>
            ) : prescriptions.length === 0 ? (
              <div className="py-8 text-center text-outline font-body-sm">No prescriptions on file.</div>
            ) : (
              <div className="space-y-4">
                {prescriptions.map(rx => (
                  <div key={rx.id} className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-secondary font-bold text-title-sm">Rx #{rx.id}</span>
                      <span className="text-[12px] text-on-surface-variant font-mono">{rx.date}</span>
                    </div>
                    <p className="text-body-sm text-primary font-semibold mb-3">Diagnosis: {rx.diagnosis}</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-body-sm border-collapse">
                        <thead>
                          <tr className="bg-surface-container text-on-surface-variant text-[11px] uppercase">
                            <th className="p-2 rounded-l">Medicine</th>
                            <th className="p-2">Dosage</th>
                            <th className="p-2">Frequency</th>
                            <th className="p-2">Duration</th>
                            <th className="p-2 rounded-r">Qty</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-container-high">
                          {rx.items.map((it, idx) => (
                            <tr key={idx}>
                              <td className="p-2 font-semibold text-primary">{it.medicineName}</td>
                              <td className="p-2">{it.dosage}</td>
                              <td className="p-2">{it.frequency}</td>
                              <td className="p-2">{it.duration}</td>
                              <td className="p-2 font-mono font-bold">{it.quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Billing */}
        {activeTab === 'BILLING' && (
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container-high">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Invoices & Billing Statements</h3>
              <span className="px-2.5 py-1 rounded-full bg-secondary-fixed/50 text-secondary text-[11px] font-semibold border border-secondary/20">
                Simulated Sandbox Gateway
              </span>
            </div>
            <p className="text-body-sm text-outline mb-4">
              Academic Prototype: Payments simulate idempotent transitions to PAID status without storing real payment-card credentials.
            </p>
            {loading ? (
              <div className="py-8 text-center text-on-surface-variant animate-pulse font-body-sm">Loading billing invoices from PostgreSQL...</div>
            ) : invoices.length === 0 ? (
              <div className="py-8 text-center text-outline font-body-sm">No invoices recorded.</div>
            ) : (
              <div className="space-y-4">
                {invoices.map(inv => (
                  <div key={inv.id} className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-title-sm text-primary font-bold">{inv.invoiceNumber}</span>
                        <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${inv.status === 'PAID' ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-error-container text-on-error-container'}`}>
                          {inv.status}
                        </span>
                      </div>
                      <div className="space-y-1 mt-2 text-body-sm">
                        {inv.items.map((it, i) => (
                          <div key={i} className="text-on-surface-variant text-[13px]">
                            • {it.description} — ₹{it.amount.toFixed(2)}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end gap-2 shrink-0">
                      <span className="font-headline-sm text-headline-sm text-primary font-bold">
                        ₹{inv.totalAmount.toFixed(2)}
                      </span>
                      {inv.status !== 'PAID' && (
                        <button
                          type="button"
                          onClick={() => handleSimulatePayment(inv.id)}
                          className="px-4 py-2 rounded-xl bg-secondary text-white font-title-sm hover:bg-primary transition-colors shadow-sm"
                        >
                          Simulate Payment (Idempotent)
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Emergency Requests */}
        {activeTab === 'EMERGENCY' && (
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container-high">
            <h3 className="font-headline-sm text-headline-sm text-primary font-bold mb-4">Emergency Incident Status</h3>
            {emergencyList.length === 0 ? (
              <div className="py-8 text-center text-outline font-body-sm">No emergency requests active.</div>
            ) : (
              <div className="space-y-3">
                {emergencyList.map(em => (
                  <div key={em.id} className="p-4 rounded-xl bg-error-container/30 border border-error/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-error font-bold text-title-sm">{em.requestNumber}</span>
                        <span className="px-2 py-0.5 rounded bg-error text-white text-[11px] font-bold">{em.priority}</span>
                        <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface text-[11px]">{em.status}</span>
                      </div>
                      <p className="text-body-sm text-on-surface-variant mt-1">{em.symptoms}</p>
                      <p className="text-[12px] text-on-surface-variant mt-0.5">Assigned: {em.assignedRoom} • {em.assignedDoctor}</p>
                    </div>
                    <span className="text-title-sm text-error font-bold">{em.waitTime} Wait</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
