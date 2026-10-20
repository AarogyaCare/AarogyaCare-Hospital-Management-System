import { useState, useEffect } from 'react';
import {
  FolderArchive, Search, User, FileText, Activity,
  Plus, CheckCircle2, ShieldCheck, Heart, AlertCircle, ArrowRight,
  Pill, FlaskConical, Receipt, RefreshCw, Clock
} from 'lucide-react';
import { api, PatientDto, ClinicalNoteDto, PrescriptionDto, InvoiceDto } from '../../services/api';
import { calculatePatientAge } from '../../utils/age';
import { useAuth } from '../../context/AuthContext';

const standardLabTests = [
  { name: 'Complete Blood Count (CBC)', category: 'Hematology', sample: 'Whole Blood (EDTA)' },
  { name: 'Comprehensive Metabolic Panel (CMP)', category: 'Biochemistry', sample: 'Serum' },
  { name: 'Lipid Profile Panel', category: 'Biochemistry', sample: 'Serum' },
  { name: 'Cardiac Troponin-I Rapid Assay', category: 'Cardiology Diagnostics', sample: 'Plasma' },
  { name: 'HbA1c Glycated Hemoglobin', category: 'Endocrinology', sample: 'Whole Blood' },
  { name: 'Renal Function Test (RFT)', category: 'Biochemistry', sample: 'Serum' },
  { name: 'Liver Function Test (LFT)', category: 'Biochemistry', sample: 'Serum' },
  { name: 'Urinalysis with Microscopic Exam', category: 'Clinical Pathology', sample: 'Midstream Urine' }
];

export default function PatientManagementEMR() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<PatientDto[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientDto | null>(null);
  const [search, setSearch] = useState('');
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [activeTab, setActiveTab] = useState<'notes' | 'prescriptions' | 'lab' | 'invoices'>('notes');

  // Sub-records for selected patient
  const [clinicalNotes, setClinicalNotes] = useState<ClinicalNoteDto[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionDto[]>([]);
  const [labOrders, setLabOrders] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // New patient modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newGender, setNewGender] = useState('Male');
  const [newBloodGroup, setNewBloodGroup] = useState('O+');
  const [newDob, setNewDob] = useState('1990-01-01');
  const [newAddress, setNewAddress] = useState('Chennai, Tamil Nadu');
  const [newAllergies, setNewAllergies] = useState('None Reported');
  const [newChronicConditions, setNewChronicConditions] = useState('None');
  const [newEmergencyName, setNewEmergencyName] = useState('');
  const [newEmergencyPhone, setNewEmergencyPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Lab Order Modal
  const [showOrderLabModal, setShowOrderLabModal] = useState(false);
  const [selectedTestIdx, setSelectedTestIdx] = useState(0);
  const [orderUrgency, setOrderUrgency] = useState<'ROUTINE' | 'URGENT' | 'STAT'>('ROUTINE');
  const [isOrderingLab, setIsOrderingLab] = useState(false);

  // Record Lab Result Modal
  const [selectedOrderForResults, setSelectedOrderForResults] = useState<any | null>(null);
  const [resValue, setResValue] = useState('');
  const [resUnit, setResUnit] = useState('g/dL');
  const [resRefRange, setResRefRange] = useState('13.0 - 17.5 g/dL');
  const [resRemarks, setResRemarks] = useState('Within expected physiological limits.');
  const [isSavingResult, setIsSavingResult] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4500);
  };

  const loadPatients = async (query = '') => {
    setIsLoadingPatients(true);
    try {
      const data = await api.patients(query);
      setPatients(data);
      if (data.length > 0 && !selectedPatient) {
        void selectPatient(data[0]);
      } else if (selectedPatient) {
        const refreshed = data.find((p) => p.id === selectedPatient.id);
        if (refreshed) setSelectedPatient(refreshed);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not fetch patient directory.', 'error');
    } finally {
      setIsLoadingPatients(false);
    }
  };

  useEffect(() => {
    void loadPatients();
  }, []);

  const selectPatient = async (patient: PatientDto) => {
    setSelectedPatient(patient);
    setIsLoadingDetails(true);

    try {
      const [notesRes, rxRes, labRes, invRes] = await Promise.allSettled([
        api.patientRecords(patient.id),
        api.patientPrescriptions(patient.id),
        api.patientLabOrders(patient.id),
        api.patientInvoices(patient.id),
      ]);

      if (notesRes.status === 'fulfilled') setClinicalNotes(notesRes.value);
      else setClinicalNotes([]);

      if (rxRes.status === 'fulfilled') setPrescriptions(rxRes.value);
      else setPrescriptions([]);

      if (labRes.status === 'fulfilled') setLabOrders(labRes.value);
      else setLabOrders([]);

      if (invRes.status === 'fulfilled') setInvoices(invRes.value);
      else setInvoices([]);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleCreatePatient = async () => {
    if (!newName.trim()) {
      showToast('Patient name is required.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await api.registerPatient({
        name: newName.trim(),
        phone: newPhone.trim() || undefined,
        email: newEmail.trim() || undefined,
        gender: newGender,
        blood_group: newBloodGroup,
        date_of_birth: newDob,
        address: newAddress.trim() || undefined,
        allergies: newAllergies.trim() || undefined,
        chronic_conditions: newChronicConditions.trim() || undefined,
        emergency_contact_name: newEmergencyName.trim() || undefined,
        emergency_contact_phone: newEmergencyPhone.trim() || undefined,
      });

      showToast(`Registered patient ${created.name} with UHID: ${created.uhid}`);
      setShowAddModal(false);
      setNewName('');
      setNewPhone('');
      setNewEmail('');
      await loadPatients();
      void selectPatient(created);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Registration failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateLabOrderSubmit = async () => {
    if (!selectedPatient) return;
    const test = standardLabTests[selectedTestIdx];
    setIsOrderingLab(true);
    try {
      const order = await api.createLabOrder({
        patient_id: selectedPatient.id,
        test_name: test.name,
        test_category: test.category,
        sample_type: test.sample,
        urgency: orderUrgency,
      });
      showToast(`Diagnostic order created: ${order.test_name} (#${order.order_number || order.id})`);
      setShowOrderLabModal(false);
      const updated = await api.patientLabOrders(selectedPatient.id);
      setLabOrders(updated);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create lab order.', 'error');
    } finally {
      setIsOrderingLab(false);
    }
  };

  const handleCollectSample = async (orderId: string, sampleType: string) => {
    if (!selectedPatient) return;
    try {
      await api.updateLabStatus(orderId, {
        status: 'SAMPLE_COLLECTED',
        sample_type: sampleType || 'Specimen'
      });
      showToast('Sample collected and sent to pathology analyzer.');
      const updated = await api.patientLabOrders(selectedPatient.id);
      setLabOrders(updated);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Sample collection update failed.', 'error');
    }
  };

  const handleRecordResultSubmit = async () => {
    if (!selectedOrderForResults || !selectedPatient) return;
    if (!resValue.trim()) {
      showToast('Result value cannot be blank.', 'error');
      return;
    }
    setIsSavingResult(true);
    try {
      await api.recordLabResult(selectedOrderForResults.id, {
        result_value: resValue.trim(),
        unit: resUnit.trim(),
        reference_range: resRefRange.trim(),
        clinical_remarks: resRemarks.trim(),
        technician_notes: 'Verified & released by Pathology Faculty'
      });
      showToast(`Diagnostic results released for ${selectedOrderForResults.test_name}.`);
      setSelectedOrderForResults(null);
      const updated = await api.patientLabOrders(selectedPatient.id);
      setLabOrders(updated);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to record lab result.', 'error');
    } finally {
      setIsSavingResult(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* EMR Banner */}
      <div className="bg-gradient-to-r from-[#002043] via-[#002c57] to-[#178B8B] text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-teal-300">
            <FolderArchive className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black">Electronic Medical Records (EMR)</h1>
              <span className="px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-200 text-[10px] font-bold">
                Live Backend Charts
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Comprehensive patient charts, longitudinal encounter histories, and diagnostic repositories.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl transition flex items-center gap-1.5 text-xs font-bold shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>New Patient Chart</span>
          </button>
          <button
            onClick={() => void loadPatients(search)}
            disabled={isLoadingPatients}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPatients ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
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
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Main EMR Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: Patient Directory */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                void loadPatients(e.target.value);
              }}
              placeholder="Search by UHID, name, phone..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#002043]"
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {isLoadingPatients ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading directory...</div>
            ) : patients.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No patients found.</div>
            ) : (
              patients.map((p) => {
                const isSelected = selectedPatient?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => void selectPatient(p)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition text-xs ${
                      isSelected
                        ? 'bg-teal-50 border-teal-600 ring-2 ring-teal-600/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{p.name}</span>
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        {p.uhid}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex gap-2">
                      <span>{p.gender || 'N/A'}, {calculatePatientAge(p.date_of_birth).formattedAge}</span>
                      <span>•</span>
                      <span>{p.blood_group || 'Blood N/A'}</span>
                      <span>•</span>
                      <span>{p.phone || 'No phone'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Longitudinal Patient Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
          {!selectedPatient ? (
            <div className="p-16 text-center text-slate-400 text-xs">
              Select a patient from the directory to review their comprehensive clinical records.
            </div>
          ) : (
            <>
              {/* Patient Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-slate-900">{selectedPatient.name}</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                      {selectedPatient.uhid}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Age: <strong className="text-teal-900">{calculatePatientAge(selectedPatient.date_of_birth).formattedAge}</strong> (DOB: {selectedPatient.date_of_birth || 'N/A'}) • Gender: {selectedPatient.gender} • Blood Group: <strong>{selectedPatient.blood_group || 'O+'}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">
                    Address: {selectedPatient.address || 'Chennai'}
                  </span>
                </div>
              </div>

              {/* Vitals & Medical Badges */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Contact Phone</span>
                  <span className="font-bold text-slate-900">{selectedPatient.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Email Address</span>
                  <span className="font-bold text-slate-900 truncate block">{selectedPatient.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Known Allergies</span>
                  <span className="font-bold text-rose-700 truncate block">{selectedPatient.allergies || 'None'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Chronic Conditions</span>
                  <span className="font-bold text-amber-700 truncate block">{selectedPatient.chronic_conditions || 'None'}</span>
                </div>
              </div>

              {/* Tabs for EMR Sections */}
              <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('notes')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'notes' ? 'bg-[#002043] text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Clinical Notes ({clinicalNotes.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('prescriptions')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'prescriptions' ? 'bg-[#002043] text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Pill className="w-3.5 h-3.5" />
                  <span>Prescriptions ({prescriptions.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('lab')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'lab' ? 'bg-[#002043] text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>Lab Orders ({labOrders.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('invoices')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'invoices' ? 'bg-[#002043] text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Invoices ({invoices.length})</span>
                </button>
              </div>

              {isLoadingDetails ? (
                <div className="p-8 text-center text-xs text-slate-500">Loading patient records...</div>
              ) : (
                <div className="space-y-3">
                  {/* Tab 1: Clinical Notes */}
                  {activeTab === 'notes' && (
                    <div className="space-y-3 text-xs">
                      {clinicalNotes.length === 0 ? (
                        <p className="p-6 text-center text-slate-500 bg-slate-50 rounded-2xl">
                          No clinical consultation notes recorded for this patient yet.
                        </p>
                      ) : (
                        clinicalNotes.map((note) => (
                          <div key={note.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                              <span className="font-bold text-slate-900 text-sm">{note.diagnosis || 'Clinical Encounter'}</span>
                              <span className="text-[10px] text-slate-500">
                                {note.created_at ? new Date(note.created_at).toLocaleDateString() : ''}
                              </span>
                            </div>
                            {note.chief_complaint && <p className="text-slate-700"><strong>Chief complaint:</strong> {note.chief_complaint}</p>}
                            {note.examination_findings && <p className="text-slate-700"><strong>Examination:</strong> {note.examination_findings}</p>}
                            {note.treatment_plan && <p className="text-slate-700"><strong>Plan:</strong> {note.treatment_plan}</p>}
                            {note.doctor_notes && <p className="text-slate-500 italic">Doctor notes: {note.doctor_notes}</p>}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Tab 2: Prescriptions */}
                  {activeTab === 'prescriptions' && (
                    <div className="space-y-3 text-xs">
                      {prescriptions.length === 0 ? (
                        <p className="p-6 text-center text-slate-500 bg-slate-50 rounded-2xl">
                          No prescriptions recorded for this patient.
                        </p>
                      ) : (
                        prescriptions.map((rx) => (
                          <div key={rx.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-slate-900">{rx.prescription_number || rx.id}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                                {rx.status}
                              </span>
                            </div>
                            <p className="text-slate-500 text-[11px]">Doctor: {rx.doctor_name || 'Clinician'}</p>
                            <div className="space-y-1">
                              {rx.items?.map((item, idx) => (
                                <div key={idx} className="bg-white p-2 rounded-xl border border-slate-100 flex justify-between">
                                  <span>{item.medicine_name} • {item.dosage} ({item.frequency})</span>
                                  <span className="font-bold">Qty: {item.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Tab 3: Lab Orders */}
                  {activeTab === 'lab' && (
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center pb-2">
                        <span className="font-bold text-slate-800">Diagnostic Investigations</span>
                        <button
                          type="button"
                          onClick={() => setShowOrderLabModal(true)}
                          className="px-3 py-1.5 bg-[#002043] hover:bg-[#17365d] text-white rounded-xl font-bold flex items-center gap-1 text-[11px]"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Order Diagnostic Test</span>
                        </button>
                      </div>

                      {labOrders.length === 0 ? (
                        <p className="p-6 text-center text-slate-500 bg-slate-50 rounded-2xl">
                          No laboratory test orders recorded.
                        </p>
                      ) : (
                        labOrders.map((order) => {
                          const isOrdered = order.status === 'ORDERED';
                          const isCollected = order.status === 'SAMPLE_COLLECTED';
                          const isCompleted = order.status === 'COMPLETED';

                          return (
                            <div key={order.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className="font-bold text-slate-900 text-sm block">{order.test_name || 'Diagnostic Test'}</span>
                                  <div className="text-[10px] text-slate-500 flex gap-2 mt-0.5">
                                    <span>#{order.order_number || order.id}</span>
                                    <span>•</span>
                                    <span>Category: {order.test_category || 'General'}</span>
                                    <span>•</span>
                                    <span>Specimen: {order.sample_type || 'Blood'}</span>
                                  </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  isCollected ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {order.status || 'ORDERED'}
                                </span>
                              </div>

                              {/* Completed Lab Results Display */}
                              {isCompleted && (
                                <div className="p-3 bg-white rounded-xl border border-emerald-100 text-slate-800 space-y-1 mt-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-500 text-[11px]">Observed Result:</span>
                                    <span className="font-bold text-emerald-800 text-sm">
                                      {order.result_value} {order.unit || ''}
                                    </span>
                                  </div>
                                  {order.reference_range && (
                                    <div className="flex justify-between text-[11px] text-slate-500">
                                      <span>Standard Reference:</span>
                                      <span>{order.reference_range}</span>
                                    </div>
                                  )}
                                  {order.clinical_remarks && (
                                    <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                                      <strong>Pathologist Remarks:</strong> {order.clinical_remarks}
                                    </div>
                                  )}
                                  <div className="text-[10px] text-slate-400 pt-1 flex justify-between">
                                    <span>Reviewed by: {order.reviewed_by || 'Pathologist'}</span>
                                    <span>Released: {order.released_at ? new Date(order.released_at).toLocaleString() : 'Yes'}</span>
                                  </div>
                                </div>
                              )}

                              {/* Workflow Actions */}
                              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                                {isOrdered && (
                                  <button
                                    type="button"
                                    onClick={() => handleCollectSample(order.id, order.sample_type)}
                                    className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[11px] font-semibold"
                                  >
                                    Collect Specimen
                                  </button>
                                )}
                                {isCollected && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedOrderForResults(order);
                                      setResValue('');
                                      setResUnit(order.test_name.includes('CBC') ? 'g/dL' : 'mg/dL');
                                      setResRefRange('Normal physiological range');
                                      setResRemarks('Results verified against automated pathology analyzer.');
                                    }}
                                    className="px-3 py-1 bg-[#002043] hover:bg-[#17365d] text-white rounded-lg text-[11px] font-semibold"
                                  >
                                    Enter &amp; Release Results
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* Tab 4: Invoices */}
                  {activeTab === 'invoices' && (
                    <div className="space-y-3 text-xs">
                      {invoices.length === 0 ? (
                        <p className="p-6 text-center text-slate-500 bg-slate-50 rounded-2xl">
                          No invoices generated for this patient yet.
                        </p>
                      ) : (
                        invoices.map((inv) => (
                          <div key={inv.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center">
                            <div>
                              <span className="font-mono font-bold text-slate-900 block">{inv.invoice_number || inv.id}</span>
                              <span className="text-[10px] text-slate-500">Net Payable: ₹{Number(inv.net_payable || inv.total_amount || 0).toFixed(2)}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {inv.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add New Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900">Register New Hospital Patient (EMR Intake)</h3>
            <p className="text-xs text-slate-500">Initializes digital patient chart with universal health ID (UHID) in MongoDB.</p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. S. Meenakshi"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+91 98401 23456"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="patient@example.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Gender</label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Blood Group</label>
                  <select
                    value={newBloodGroup}
                    onChange={(e) => setNewBloodGroup(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-semibold">Date of Birth</label>
                    {newDob && (
                      <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                        {calculatePatientAge(newDob).formattedAge}
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    value={newDob}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setNewDob(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Residential Address</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Street, City, State"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Known Allergies</label>
                  <input
                    type="text"
                    value={newAllergies}
                    onChange={(e) => setNewAllergies(e.target.value)}
                    placeholder="e.g. Penicillin, Peanuts"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Chronic Conditions</label>
                  <input
                    type="text"
                    value={newChronicConditions}
                    onChange={(e) => setNewChronicConditions(e.target.value)}
                    placeholder="e.g. Type-2 Diabetes, Hypertension"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Emergency Contact Name</label>
                  <input
                    type="text"
                    value={newEmergencyName}
                    onChange={(e) => setNewEmergencyName(e.target.value)}
                    placeholder="Next of kin name"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Emergency Contact Phone</label>
                  <input
                    type="tel"
                    value={newEmergencyPhone}
                    onChange={(e) => setNewEmergencyPhone(e.target.value)}
                    placeholder="+91 98401 00000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
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
                onClick={handleCreatePatient}
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#002043] hover:bg-[#17365d] disabled:opacity-50 text-white rounded-xl text-xs font-bold"
              >
                {isSubmitting ? 'Registering...' : 'Register & Open EMR'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Diagnostic Lab Test Modal */}
      {showOrderLabModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 max-w-md w-full shadow-2xl space-y-4 text-xs animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Order Diagnostic Lab Investigation</h3>
                <p className="text-[11px] text-slate-500">Patient: <strong>{selectedPatient.name}</strong> ({selectedPatient.uhid})</p>
              </div>
              <FlaskConical className="w-6 h-6 text-teal-600" />
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Select Diagnostic Test</label>
                <select
                  value={selectedTestIdx}
                  onChange={(e) => setSelectedTestIdx(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {standardLabTests.map((t, i) => (
                    <option key={t.name} value={i}>
                      {t.name} ({t.category} - {t.sample})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Clinical Urgency Level</label>
                <select
                  value={orderUrgency}
                  onChange={(e) => setOrderUrgency(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="ROUTINE">ROUTINE - Standard Batch Processing</option>
                  <option value="URGENT">URGENT - High Priority (Within 2 Hours)</option>
                  <option value="STAT">STAT - Emergency Immediate (Within 30 Mins)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowOrderLabModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateLabOrderSubmit}
                disabled={isOrderingLab}
                className="px-5 py-2 bg-[#002043] hover:bg-[#17365d] disabled:opacity-50 text-white rounded-xl text-xs font-bold"
              >
                {isOrderingLab ? 'Transmitting Order...' : 'Dispatch Lab Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Lab Result Modal */}
      {selectedOrderForResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 max-w-md w-full shadow-2xl space-y-4 text-xs animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record &amp; Release Lab Result</h3>
                <p className="text-[11px] text-slate-500">Order #{selectedOrderForResults.order_number}: <strong>{selectedOrderForResults.test_name}</strong></p>
              </div>
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Result Value *</label>
                  <input
                    type="text"
                    value={resValue}
                    onChange={(e) => setResValue(e.target.value)}
                    placeholder="e.g. 14.2, 98, Normal"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Measurement Unit</label>
                  <input
                    type="text"
                    value={resUnit}
                    onChange={(e) => setResUnit(e.target.value)}
                    placeholder="e.g. g/dL, mg/dL, %"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Reference Range</label>
                <input
                  type="text"
                  value={resRefRange}
                  onChange={(e) => setResRefRange(e.target.value)}
                  placeholder="e.g. 13.0 - 17.5 g/dL"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Pathologist Remarks</label>
                <textarea
                  rows={2}
                  value={resRemarks}
                  onChange={(e) => setResRemarks(e.target.value)}
                  placeholder="Clinical evaluation of test results..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedOrderForResults(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRecordResultSubmit}
                disabled={isSavingResult || !resValue.trim()}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold"
              >
                {isSavingResult ? 'Releasing...' : 'Release & Notify Patient'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
