import { useState } from 'react';
import {
  Users, ShieldCheck, KeyRound, CheckCircle2,
  Search, Plus, Lock, UserCheck, ArrowRight, AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth, UserRole } from '../../context/AuthContext';

interface HospitalStaffRole {
  role: UserRole;
  title: string;
  department: string;
  description: string;
  permissions: {
    readClinicalRecords: boolean;
    writePrescriptions: boolean;
    triageVitals: boolean;
    dispensePharmacy: boolean;
    cashieringBilling: boolean;
    adminGovernance: boolean;
  };
}

const hospitalRoles: HospitalStaffRole[] = [
  {
    role: 'DOCTOR',
    title: 'Consulting Physician / Specialist',
    department: 'Outpatient Department (OPD)',
    description: 'Direct clinical consultations, diagnosis, examination notes, and electronic prescriptions.',
    permissions: { readClinicalRecords: true, writePrescriptions: true, triageVitals: true, dispensePharmacy: false, cashieringBilling: false, adminGovernance: false }
  },
  {
    role: 'NURSE',
    title: 'Head Triage / Charge Nurse',
    department: 'Nursing Station & Inpatient Ward',
    description: 'Patient vitals telemetry, ESI acuity grading, and pre-consultation intake observations.',
    permissions: { readClinicalRecords: true, writePrescriptions: false, triageVitals: true, dispensePharmacy: false, cashieringBilling: false, adminGovernance: false }
  },
  {
    role: 'RECEPTIONIST',
    title: 'Front Desk Registrar',
    department: 'Main Atrium Kiosk',
    description: 'Walk-in patient registration, doctor slot booking, check-in, and queue token issuance.',
    permissions: { readClinicalRecords: false, writePrescriptions: false, triageVitals: false, dispensePharmacy: false, cashieringBilling: true, adminGovernance: false }
  },
  {
    role: 'PHARMACIST',
    title: 'Clinical Pharmacist',
    department: 'Hospital Central Dispensary',
    description: 'Barcode verified e-prescription dispensing, stock intake, and formulary inventory adjustments.',
    permissions: { readClinicalRecords: true, writePrescriptions: false, triageVitals: false, dispensePharmacy: true, cashieringBilling: false, adminGovernance: false }
  },
  {
    role: 'BILLING_STAFF',
    title: 'Billing & TPA Officer',
    department: 'Finance & Cashier Desk',
    description: 'Physical receipt settlement, cashless insurance pre-authorizations, and payment reconciliation.',
    permissions: { readClinicalRecords: false, writePrescriptions: false, triageVitals: false, dispensePharmacy: false, cashieringBilling: true, adminGovernance: false }
  },
  {
    role: 'ADMIN',
    title: 'System Administrator',
    department: 'Hospital Executive Governance',
    description: 'Full administrative access across clinical, operational, infrastructure, and audit modules.',
    permissions: { readClinicalRecords: true, writePrescriptions: true, triageVitals: true, dispensePharmacy: true, cashieringBilling: true, adminGovernance: true }
  }
];

export default function UserRoleManagement() {
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('Aarogya#2026Secure');
  const [newRole, setNewRole] = useState<UserRole>('DOCTOR');
  const [newPhone, setNewPhone] = useState('+91 98401 23456');
  const [newQualification, setNewQualification] = useState('MBBS, MD');
  const [newRoom, setNewRoom] = useState('OPD Suite 204');
  const [newExperience, setNewExperience] = useState(8);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4500);
  };

  const handleCreateStaff = async () => {
    if (!newFullName.trim() || !newEmail.trim() || !newPassword.trim()) {
      showToast('Name, Email, and Password are required.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.createStaff({
        full_name: newFullName.trim(),
        email: newEmail.trim(),
        password: newPassword,
        role: newRole,
        phone: newPhone.trim() || undefined,
        department_id: newRole === 'DOCTOR' ? 'dept-cardio' : undefined,
        room_number: newRole === 'DOCTOR' ? newRoom.trim() : undefined,
        qualification: newRole === 'DOCTOR' ? newQualification.trim() : undefined,
        experience_years: newRole === 'DOCTOR' ? Number(newExperience) : undefined,
      });

      showToast(`Provisioned new ${newRole} account for ${res.full_name} (${res.email}). Credentials active.`);
      setShowAddModal(false);
      setNewFullName('');
      setNewEmail('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Staff account creation failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#002043] via-[#002b54] to-[#106E70] text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-teal-500/20 px-3 py-1 rounded-full border border-teal-400/30">
            Security &amp; Identity Governance
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
            Role-Based Access Control (RBAC) &amp; Staff Accounts
          </h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-xl">
            Spring Security authority matrices, JWT claim validation, and staff account provisioning for clinical and operational wings.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-teal-400 hover:bg-teal-300 text-[#002043] font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Provision Staff Account</span>
        </button>
      </div>

      {toast && (
        <div
          role="alert"
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fadeIn border ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Hospital Role Matrix Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hospitalRoles.map((r) => (
          <div
            key={r.role}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {r.department}
                </span>
                <span className="font-mono text-xs font-extrabold text-[#002043]">
                  {r.role}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">{r.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{r.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Authorized Service Privileges:
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${r.permissions.readClinicalRecords ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className={r.permissions.readClinicalRecords ? 'text-slate-800 font-semibold' : 'text-slate-400'}>EMR Records</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${r.permissions.writePrescriptions ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className={r.permissions.writePrescriptions ? 'text-slate-800 font-semibold' : 'text-slate-400'}>E-Prescriptions</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${r.permissions.triageVitals ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className={r.permissions.triageVitals ? 'text-slate-800 font-semibold' : 'text-slate-400'}>Triage Telemetry</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${r.permissions.dispensePharmacy ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className={r.permissions.dispensePharmacy ? 'text-slate-800 font-semibold' : 'text-slate-400'}>Dispense Meds</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${r.permissions.cashieringBilling ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className={r.permissions.cashieringBilling ? 'text-slate-800 font-semibold' : 'text-slate-400'}>Billing Cashier</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${r.permissions.adminGovernance ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className={r.permissions.adminGovernance ? 'text-slate-800 font-semibold' : 'text-slate-400'}>Audit &amp; Telemetry</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Provisioning Staff Account */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900">Provision Staff Account</h3>
            <p className="text-xs text-slate-500">Registers an authorized hospital employee account in MongoDB with Spring Security roles.</p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Kumar"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Hospital Email Address *</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="rajesh.kumar@aarogyacare.org"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Assign Role *</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="DOCTOR">DOCTOR</option>
                    <option value="NURSE">NURSE</option>
                    <option value="RECEPTIONIST">RECEPTIONIST</option>
                    <option value="PHARMACIST">PHARMACIST</option>
                    <option value="BILLING_STAFF">BILLING_STAFF</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Initial Password *</label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              {newRole === 'DOCTOR' && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-700 font-semibold block mb-1">Qualification</label>
                      <input
                        type="text"
                        value={newQualification}
                        onChange={(e) => setNewQualification(e.target.value)}
                        placeholder="MBBS, MD"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-slate-700 font-semibold block mb-1">OPD Room Number</label>
                      <input
                        type="text"
                        value={newRoom}
                        onChange={(e) => setNewRoom(e.target.value)}
                        placeholder="Suite 204"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">Years of Experience</label>
                    <input
                      type="number"
                      min={1}
                      value={newExperience}
                      onChange={(e) => setNewExperience(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateStaff}
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#002043] hover:bg-[#17365d] disabled:opacity-50 text-white rounded-xl text-xs font-bold"
              >
                {isSubmitting ? 'Provisioning...' : 'Provision Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
