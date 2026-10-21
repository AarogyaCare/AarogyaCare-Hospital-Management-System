import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Stethoscope, User, Clock, CheckCircle2, Plus, Trash2,
  FileText, Activity, ShieldAlert, AlertCircle, Save, Send, Pill, RefreshCw,
  Sparkles, FlaskConical, AlertTriangle, HeartPulse, Check, ArrowRight
} from 'lucide-react';
import { api, AppointmentDto, ClinicalNoteDto, MedicineDto, PrescriptionItemDto, PatientDto } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { calculatePatientAge } from '../../utils/age';
import {
  getTemplateForSpecialty,
  SPECIALTY_TEMPLATES,
  findFormularyMatch,
  RxTemplateItem
} from '../../data/specialtyTemplates';

const DOSAGE_FORMS = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Injection',
  'Ointment / Gel',
  'Inhaler',
  'Drops (Eye/Ear)',
  'Suspension',
  'Patch'
];

const ROUTES = [
  'Oral',
  'Sublingual',
  'Topical',
  'Inhalation',
  'Intravenous (IV)',
  'Intramuscular (IM)',
  'Subcutaneous (SC)',
  'Ophthalmic',
  'Otic',
  'Nasal'
];

const FREQUENCIES = [
  'Once daily morning (1-0-0)',
  'Twice daily after food (1-0-1)',
  'Three times daily after food (1-1-1)',
  'Four times daily (1-1-1-1)',
  'Every 8 hours (TDS)',
  'Once daily at bedtime (0-0-1)',
  'SOS / As needed (max 3/day)'
];

export default function DoctorClinicalWorkspace() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDto | null>(null);
  const [patientDetails, setPatientDetails] = useState<PatientDto | null>(null);
  const [medicines, setMedicines] = useState<MedicineDto[]>([]);
  const [previousNotes, setPreviousNotes] = useState<ClinicalNoteDto[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Specialty & Template State
  const [selectedSpecialtyKey, setSelectedSpecialtyKey] = useState<string>('general');
  const [activeTemplateTab, setActiveTemplateTab] = useState<'complaints' | 'exam' | 'diagnosis' | 'treatment' | 'labs' | 'rx'>('complaints');

  // Clinical Note Form
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [examinationFindings, setExaminationFindings] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  // Structured Prescription Form
  const [rxList, setRxList] = useState<PrescriptionItemDto[]>([]);
  const [selectedMedId, setSelectedMedId] = useState('');
  const [dosageForm, setDosageForm] = useState('Tablet');
  const [dosage, setDosage] = useState('1 Tablet');
  const [route, setRoute] = useState('Oral');
  const [frequency, setFrequency] = useState('Twice daily after food (1-0-1)');
  const [durationDays, setDurationDays] = useState(7);
  const [quantity, setQuantity] = useState(14);
  const [instructions, setInstructions] = useState('Take with water after meals.');

  // Diagnostic Lab Orders State
  const [patientLabOrders, setPatientLabOrders] = useState<any[]>([]);
  const [orderingLabNames, setOrderingLabNames] = useState<Record<string, boolean>>({});

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Resolve Doctor's Primary Specialty
  useEffect(() => {
    const userSpecialty =
      user?.doctorProfile?.specializations?.[0] ||
      user?.doctorProfile?.departmentId ||
      'general';

    const matched = getTemplateForSpecialty(userSpecialty);
    const key = Object.keys(SPECIALTY_TEMPLATES).find(
      (k) => SPECIALTY_TEMPLATES[k].departmentKey === matched.departmentKey
    ) || 'general';
    setSelectedSpecialtyKey(key);
  }, [user]);

  const activeTemplate = useMemo(() => {
    return SPECIALTY_TEMPLATES[selectedSpecialtyKey] || SPECIALTY_TEMPLATES.general;
  }, [selectedSpecialtyKey]);

  // Selected Medicine details
  const selectedMed = useMemo(() => {
    return medicines.find((m) => m.id === selectedMedId);
  }, [medicines, selectedMedId]);

  // Auto-calculate quantity helper based on schedule
  const calculateQuantity = (freq: string, days: number): number => {
    const d = Math.max(1, Number(days) || 1);
    if (freq.includes('(1-1-1-1)')) return d * 4;
    if (freq.includes('(1-1-1)') || freq.toLowerCase().includes('three times') || freq.includes('8 hours')) return d * 3;
    if (freq.includes('(1-0-1)') || freq.toLowerCase().includes('twice')) return d * 2;
    if (freq.includes('(1-0-0)') || freq.includes('(0-0-1)') || freq.toLowerCase().includes('once daily')) return d * 1;
    if (freq.toLowerCase().includes('sos') || freq.toLowerCase().includes('as needed')) return Math.min(d * 2, 10);
    return d * 2;
  };

  // Sync quantity when frequency or duration changes
  const handleDurationChange = (days: number) => {
    setDurationDays(days);
    setQuantity(calculateQuantity(frequency, days));
  };

  const handleFrequencyChange = (newFreq: string) => {
    setFrequency(newFreq);
    setQuantity(calculateQuantity(newFreq, durationDays));
  };

  const loadAppointments = async () => {
    setIsLoadingQueue(true);
    try {
      const data = await api.appointments();
      setAppointments(data);
      const targetId = searchParams.get('appointmentId');
      if (targetId) {
        const found = data.find((a) => a.id === targetId);
        if (found) {
          void selectAppointment(found);
          return;
        }
      }
      if (data.length > 0 && !selectedAppointment) {
        void selectAppointment(data[0]);
      } else if (selectedAppointment) {
        const refreshed = data.find((a) => a.id === selectedAppointment.id);
        if (refreshed) setSelectedAppointment(refreshed);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to fetch appointments queue', 'error');
    } finally {
      setIsLoadingQueue(false);
    }
  };

  useEffect(() => {
    void loadAppointments();
    api.medicines()
      .then((meds) => {
        setMedicines(meds);
        if (meds.length > 0) {
          setSelectedMedId(meds[0].id);
          setDosageForm(meds[0].dosage_form || 'Tablet');
        }
      })
      .catch(() => {});
  }, []);

  const selectAppointment = async (apt: AppointmentDto) => {
    setSelectedAppointment(apt);
    setSearchParams({ appointmentId: apt.id }, { replace: true });
    setChiefComplaint(apt.reason_for_visit || '');
    setExaminationFindings(apt.vital_signs ? `Nurse Vitals: ${apt.vital_signs}` : '');
    setDiagnosis('');
    setTreatmentPlan('');
    setDoctorNotes(apt.triage_notes ? `Triage notes: ${apt.triage_notes}` : '');
    setFollowUpDate('');
    setRxList([]);

    // Fetch patient profile to compute accurate age and display clinical alerts
    if (apt.patient_id) {
      try {
        const p = await api.patient(apt.patient_id);
        setPatientDetails(p);
      } catch {
        setPatientDetails(null);
      }
    } else {
      setPatientDetails(null);
    }

    // Auto-adjust specialty template if appointment has department hint
    if (apt.department_name) {
      const matched = getTemplateForSpecialty(apt.department_name);
      const key = Object.keys(SPECIALTY_TEMPLATES).find(
        (k) => SPECIALTY_TEMPLATES[k].departmentKey === matched.departmentKey
      );
      if (key) setSelectedSpecialtyKey(key);
    }

    // Fetch prior lab orders for this patient
    try {
      const labs = await api.patientLabOrders(apt.patient_id);
      setPatientLabOrders(labs);
    } catch {
      setPatientLabOrders([]);
    }

    // Fetch prior notes for this appointment
    try {
      const notes = await api.getAppointmentNotes(apt.id);
      setPreviousNotes(notes);
      if (notes.length > 0) {
        const latest = notes[notes.length - 1];
        if (latest.diagnosis) setDiagnosis(latest.diagnosis);
        if (latest.treatment_plan) setTreatmentPlan(latest.treatment_plan);
        if (latest.chief_complaint) setChiefComplaint(latest.chief_complaint);
        if (latest.examination_findings) setExaminationFindings(latest.examination_findings);
        if (latest.doctor_notes) setDoctorNotes(latest.doctor_notes);
        if (latest.follow_up_date) setFollowUpDate(latest.follow_up_date);
      }
    } catch {
      setPreviousNotes([]);
    }
  };

  // Template Click Handlers
  const handleApplyComplaint = (text: string) => {
    setChiefComplaint((prev) => (prev ? `${prev}; ${text}` : text));
  };

  const handleApplyExam = (text: string) => {
    setExaminationFindings((prev) => (prev ? `${prev}\n${text}` : text));
  };

  const handleApplyDiagnosis = (diag: { code?: string; name: string }) => {
    const formatted = diag.code ? `${diag.name} (ICD-10 ${diag.code})` : diag.name;
    setDiagnosis(formatted);
  };

  const handleApplyTreatment = (text: string) => {
    setTreatmentPlan((prev) => (prev ? `${prev}; ${text}` : text));
  };

  const handleApplyLab = async (lab: { name: string; category: string; urgency: string; sampleType?: string }) => {
    if (!selectedAppointment) {
      showToast('Please select a patient appointment from the queue first.', 'error');
      return;
    }
    if (orderingLabNames[lab.name]) {
      return;
    }
    setOrderingLabNames((prev) => ({ ...prev, [lab.name]: true }));
    try {
      const order = await api.createLabOrder({
        patient_id: selectedAppointment.patient_id,
        appointment_id: selectedAppointment.id,
        test_name: lab.name,
        test_category: lab.category || 'General Diagnostic',
        sample_type: lab.sampleType || 'Venous Blood',
        urgency: lab.urgency || 'ROUTINE',
      });
      setPatientLabOrders((prev) => [order, ...prev]);
      const labEntry = `Diagnostic Order #${order.order_number || order.id}: ${lab.name} [${lab.category || 'Diagnostic'}, ${lab.urgency || 'ROUTINE'}]`;
      setTreatmentPlan((prev) => (prev ? `${prev}\n${labEntry}` : labEntry));
      showToast(`Created structured lab order for '${lab.name}' (${order.order_number || 'Order logged'}).`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : `Failed to create lab order for ${lab.name}`, 'error');
    } finally {
      setOrderingLabNames((prev) => ({ ...prev, [lab.name]: false }));
    }
  };

  // Load a template Rx item into the manual editor or add directly
  const handleLoadTemplateRx = (item: RxTemplateItem, directAdd = false) => {
    const matchedMed = findFormularyMatch(item.suggestedMedicineName, medicines);
    const targetMed = matchedMed || medicines[0];

    if (!targetMed) {
      showToast('No formulary medicines available.', 'error');
      return;
    }

    const calcQty = item.calculatedQuantity || calculateQuantity(item.frequency, item.durationDays);

    if (directAdd) {
      const fullDosageStr = `${item.dosageForm} - ${item.dosage} (${item.route})`;
      const fullInstructions = `${item.instructions} [Route: ${item.route}]`;

      const newRxItem: PrescriptionItemDto = {
        medicine_id: targetMed.id,
        medicine_name: `${targetMed.name} (${targetMed.strength})`,
        dosage: fullDosageStr,
        frequency: item.frequency,
        duration_days: item.durationDays,
        instructions: fullInstructions,
        quantity: calcQty,
      };

      setRxList((prev) => [...prev, newRxItem]);
      showToast(`Added ${targetMed.name} (${item.dosage}) to e-prescription.`);
    } else {
      setSelectedMedId(targetMed.id);
      setDosageForm(item.dosageForm);
      setDosage(item.dosage);
      setRoute(item.route);
      setFrequency(item.frequency);
      setDurationDays(item.durationDays);
      setQuantity(calcQty);
      setInstructions(item.instructions);
      showToast(`Loaded ${item.suggestedMedicineName} into prescription composer.`);
    }
  };

  // Add Medication from Manual Composer
  const handleAddMedication = () => {
    if (!selectedMed) {
      showToast('Please select a valid medicine from the hospital formulary.', 'error');
      return;
    }

    if (quantity <= 0) {
      showToast('Quantity must be greater than zero.', 'error');
      return;
    }

    const fullDosageStr = `${dosageForm} - ${dosage.trim()} (${route})`;
    const fullInstructions = `${instructions.trim()} [Route: ${route}]`;

    const item: PrescriptionItemDto = {
      medicine_id: selectedMed.id,
      medicine_name: `${selectedMed.name} (${selectedMed.strength})`,
      dosage: fullDosageStr,
      frequency: frequency.trim(),
      duration_days: Number(durationDays) || 7,
      instructions: fullInstructions,
      quantity: Number(quantity),
    };

    setRxList((prev) => [...prev, item]);
    showToast(`Added ${selectedMed.name} to prescription list.`);
  };

  const handleRemoveRx = (index: number) => {
    setRxList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveNotesOnly = async () => {
    if (!selectedAppointment) return;
    if (!diagnosis.trim() && !chiefComplaint.trim()) {
      showToast('Please provide at least a chief complaint or diagnosis.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.addClinicalNote(selectedAppointment.id, {
        chief_complaint: chiefComplaint,
        examination_findings: examinationFindings,
        diagnosis,
        treatment_plan: treatmentPlan,
        doctor_notes: doctorNotes,
        follow_up_date: followUpDate || undefined,
      });
      showToast('Clinical notes draft saved successfully.');
      const notes = await api.getAppointmentNotes(selectedAppointment.id);
      setPreviousNotes(notes);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save clinical notes.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteConsultation = async () => {
    if (!selectedAppointment) return;
    setIsSubmitting(true);
    try {
      // 1. Add clinical note
      await api.addClinicalNote(selectedAppointment.id, {
        chief_complaint: chiefComplaint || selectedAppointment.reason_for_visit || 'Consultation completed',
        examination_findings: examinationFindings,
        diagnosis: diagnosis || 'General Medical Evaluation',
        treatment_plan: treatmentPlan,
        doctor_notes: doctorNotes,
        follow_up_date: followUpDate || undefined,
      });

      // 2. If prescription items exist, create e-prescription
      if (rxList.length > 0) {
        await api.createAppointmentPrescription(selectedAppointment.id, {
          items: rxList,
        });
      }

      // 3. Mark appointment as COMPLETED
      await api.updateAppointmentStatus(selectedAppointment.id, 'COMPLETED');

      showToast(`Consultation completed for ${selectedAppointment.patient_name || 'patient'}. E-Prescription dispatched to pharmacy.`);
      await loadAppointments();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to finalize consultation.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter queue for current doctor if applicable
  const doctorAppointments = appointments.filter((a) => {
    if (user?.role === 'DOCTOR' && a.doctor_id) {
      return a.doctor_id === user.id || true;
    }
    return true;
  });

  const patientAge = calculatePatientAge(patientDetails?.date_of_birth);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#002043] via-[#002b54] to-[#178B8B] text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-teal-300">
            <Stethoscope className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black">Doctor Clinical Workspace</h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[10px] font-bold">
                OPD Suite
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Attending: <strong>{user?.name || 'Dr. V. Ramanathan'}</strong> • {user?.doctorProfile?.qualification || 'Consultant Physician'}
              {user?.doctorProfile?.roomNumber && ` • Room ${user.doctorProfile.roomNumber}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAppointments}
            disabled={isLoadingQueue}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
            title="Refresh Queue"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingQueue ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <span className="text-xs text-slate-200 bg-white/10 px-3 py-2 rounded-xl border border-white/20">
            Queue: <strong>{doctorAppointments.length} Active</strong>
          </span>
          <button
            onClick={handleCompleteConsultation}
            disabled={!selectedAppointment || isSubmitting}
            className="px-4 py-2 bg-teal-400 hover:bg-teal-300 disabled:opacity-50 text-[#002043] font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Finalizing...' : 'Sign & Complete Consultation'}</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div
          role="alert"
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fadeIn border ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 2-Column Workstation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Patient Queue (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Today's Appointment Queue</h3>
            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Live Backend
            </span>
          </div>

          {isLoadingQueue ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading queue...</div>
          ) : doctorAppointments.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No scheduled appointments in the queue.</div>
          ) : (
            <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
              {doctorAppointments.map((apt) => {
                const isSelected = selectedAppointment?.id === apt.id;
                return (
                  <div
                    key={apt.id}
                    onClick={() => selectAppointment(apt)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                      isSelected
                        ? 'bg-teal-50/70 border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                        : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">{apt.patient_name || 'Patient'}</span>
                      <span className="font-mono text-[10px] font-bold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {apt.queue_token || apt.appointment_number || apt.id.slice(-6)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                      <span>{apt.slot_start || apt.appointment_date || 'Scheduled'}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        apt.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        apt.status === 'TRIAGED' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                        apt.status === 'CHECKED_IN' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {apt.status}
                      </span>
                    </div>

                    {apt.reason_for_visit && (
                      <p className="text-[11px] text-slate-600 truncate mt-1">
                        Reason: {apt.reason_for_visit}
                      </p>
                    )}

                    {apt.triage_level && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded w-fit">
                        <span>{apt.triage_level}</span>
                        {apt.vital_signs && <span className="text-slate-600 font-normal truncate max-w-[180px]">({apt.vital_signs})</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Clinical Consultation Desk & E-Rx (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
          {!selectedAppointment ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              Please select an appointment from the queue to start consultation.
            </div>
          ) : (
            <>
              {/* Selected Patient Banner with Age Calculation & Alerts */}
              <div className="pb-4 border-b border-slate-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        Token: {selectedAppointment.queue_token || selectedAppointment.appointment_number}
                      </span>
                      <span className="text-xs text-slate-400">Appointment ID: {selectedAppointment.id}</span>
                      {patientDetails?.uhid && (
                        <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          UHID: {patientDetails.uhid}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <h2 className="text-xl font-black text-slate-900">
                        {patientDetails?.name || selectedAppointment.patient_name || 'Patient Record'}
                      </h2>
                      {patientAge.isValid && (
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-xs">
                          {patientAge.formattedAge}
                        </span>
                      )}
                      {patientDetails?.gender && (
                        <span className="text-xs text-slate-500 font-medium">
                          ({patientDetails.gender})
                        </span>
                      )}
                      {patientDetails?.blood_group && (
                        <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {patientDetails.blood_group}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Mode: <strong className="text-slate-800">{selectedAppointment.consultation_mode || 'IN_PERSON'}</strong> • Status: <strong className="text-teal-700">{selectedAppointment.status}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveNotesOnly}
                      disabled={isSubmitting}
                      className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5 text-teal-700" />
                      <span>Save Draft Note</span>
                    </button>
                  </div>
                </div>

                {/* Patient Clinical Alerts */}
                {patientDetails?.allergies && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span><strong>Known Allergies:</strong> {patientDetails.allergies}</span>
                  </div>
                )}
                {patientDetails?.chronic_conditions && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800">
                    <Activity className="w-4 h-4 text-amber-600 shrink-0" />
                    <span><strong>Chronic Conditions:</strong> {patientDetails.chronic_conditions}</span>
                  </div>
                )}
              </div>

              {/* Triage & Vitals alert if recorded */}
              {selectedAppointment.vital_signs && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-start gap-3 text-xs text-blue-900">
                  <Activity className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Nursing Triage Intake ({selectedAppointment.triage_level || 'General'}):</span>
                    <p className="mt-0.5 text-slate-700">{selectedAppointment.vital_signs}</p>
                    {selectedAppointment.triage_notes && <p className="mt-0.5 text-slate-500 italic">Notes: {selectedAppointment.triage_notes}</p>}
                  </div>
                </div>
              )}

              {/* Specialty Clinical Templates & Decision Support Bar */}
              <div className="bg-gradient-to-br from-slate-50 to-teal-50/30 rounded-2xl border border-teal-100 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-700" />
                    <span className="text-xs font-bold text-slate-900">Specialty Clinical Decision Support & Templates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-semibold text-slate-600">Specialty:</label>
                    <select
                      value={selectedSpecialtyKey}
                      onChange={(e) => setSelectedSpecialtyKey(e.target.value)}
                      className="text-xs font-semibold px-2.5 py-1 bg-white border border-teal-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-teal-500"
                    >
                      {Object.entries(SPECIALTY_TEMPLATES).map(([key, tpl]) => (
                        <option key={key} value={key}>
                          {tpl.departmentName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Template Category Tabs */}
                <div className="flex items-center gap-1.5 border-b border-teal-100 pb-2 overflow-x-auto text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTemplateTab('complaints')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                      activeTemplateTab === 'complaints'
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-white'
                    }`}
                  >
                    Chief Complaints ({activeTemplate.chiefComplaints.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTemplateTab('exam')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                      activeTemplateTab === 'exam'
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-white'
                    }`}
                  >
                    Exam Findings ({activeTemplate.examinationFindings.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTemplateTab('diagnosis')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                      activeTemplateTab === 'diagnosis'
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-white'
                    }`}
                  >
                    Diagnoses ICD-10 ({activeTemplate.diagnoses.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTemplateTab('treatment')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                      activeTemplateTab === 'treatment'
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-white'
                    }`}
                  >
                    Treatment Plans ({activeTemplate.treatmentPlans.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTemplateTab('labs')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                      activeTemplateTab === 'labs'
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-white'
                    }`}
                  >
                    Diagnostic Labs ({activeTemplate.diagnosticLabs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTemplateTab('rx')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                      activeTemplateTab === 'rx'
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-white'
                    }`}
                  >
                    Rx Fast-Fill ({activeTemplate.prescriptions.length})
                  </button>
                </div>

                {/* Tab Content */}
                <div className="pt-1 text-xs">
                  {activeTemplateTab === 'complaints' && (
                    <div className="flex flex-wrap gap-1.5">
                      {activeTemplate.chiefComplaints.map((cc, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleApplyComplaint(cc)}
                          className="px-2.5 py-1 bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 rounded-lg text-slate-700 text-left transition flex items-center gap-1.5"
                          title="Click to insert into Chief Complaint"
                        >
                          <Plus className="w-3 h-3 text-teal-600 shrink-0" />
                          <span>{cc}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {activeTemplateTab === 'exam' && (
                    <div className="space-y-1.5">
                      {activeTemplate.examinationFindings.map((ef, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleApplyExam(ef)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 rounded-lg text-slate-700 text-left transition flex items-start gap-2"
                        >
                          <Plus className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                          <span>{ef}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {activeTemplateTab === 'diagnosis' && (
                    <div className="flex flex-wrap gap-2">
                      {activeTemplate.diagnoses.map((diag, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleApplyDiagnosis(diag)}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 rounded-lg text-slate-800 transition flex items-center gap-2 font-medium"
                        >
                          {diag.code && (
                            <span className="font-mono text-[10px] font-bold bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded">
                              {diag.code}
                            </span>
                          )}
                          <span>{diag.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {activeTemplateTab === 'treatment' && (
                    <div className="space-y-1.5">
                      {activeTemplate.treatmentPlans.map((tp, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleApplyTreatment(tp)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 rounded-lg text-slate-700 text-left transition flex items-start gap-2"
                        >
                          <Plus className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                          <span>{tp}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {activeTemplateTab === 'labs' && (
                    <div className="space-y-3">
                      {patientLabOrders.length > 0 && (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
                            Active & Recent Lab Orders for Patient ({patientLabOrders.length})
                          </span>
                          <div className="max-h-36 overflow-y-auto space-y-1.5 text-xs">
                            {patientLabOrders.map((ord: any) => (
                              <div key={ord.id} className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                                <div>
                                  <span className="font-bold text-slate-900">{ord.test_name}</span>
                                  <span className="text-[10px] text-slate-500 ml-2 font-mono">{ord.order_number}</span>
                                  {ord.result_value && (
                                    <span className="text-[11px] text-teal-700 font-bold ml-2">Result: {ord.result_value} {ord.unit || ''}</span>
                                  )}
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  ord.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                                  ord.status === 'SAMPLE_COLLECTED' ? 'bg-amber-100 text-amber-800' :
                                  'bg-indigo-100 text-indigo-800'
                                }`}>
                                  {ord.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {activeTemplate.diagnosticLabs.map((lab, i) => {
                          const isOrdering = Boolean(orderingLabNames[lab.name]);
                          return (
                            <button
                              key={i}
                              type="button"
                              disabled={isOrdering}
                              onClick={() => void handleApplyLab(lab)}
                              className="p-2.5 bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 rounded-xl text-left transition flex items-center justify-between gap-2 disabled:opacity-50"
                            >
                              <div>
                                <span className="font-bold text-slate-900 block">{lab.name}</span>
                                <span className="text-[10px] text-slate-500">{lab.category} • {lab.sampleType}</span>
                              </div>
                              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 shrink-0">
                                {isOrdering ? 'Ordering…' : '+ Order'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {activeTemplateTab === 'rx' && (
                    <div className="space-y-2">
                      <div className="text-[11px] text-slate-500 mb-1">
                        Select a recommended medication template. Medications are automatically matched against real hospital formulary stock.
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {activeTemplate.prescriptions.map((rxItem, i) => {
                          const matched = findFormularyMatch(rxItem.suggestedMedicineName, medicines);
                          return (
                            <div
                              key={i}
                              className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col justify-between gap-2"
                            >
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-900">{rxItem.suggestedMedicineName}</span>
                                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                                    {rxItem.dosageForm}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-600 mt-1">
                                  <span>{rxItem.dosage} • {rxItem.frequency} • {rxItem.durationDays}d</span>
                                </div>
                                <div className="text-[10px] text-slate-500 italic mt-0.5">
                                  {rxItem.instructions}
                                </div>
                                {matched && (
                                  <div className="mt-1 text-[10px] flex items-center gap-1 text-teal-700">
                                    <Check className="w-3 h-3" />
                                    <span>Formulary: {matched.name} (Stock: {matched.current_stock})</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                                <button
                                  type="button"
                                  onClick={() => handleLoadTemplateRx(rxItem, false)}
                                  className="flex-1 py-1 px-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 font-semibold text-[11px] text-center"
                                >
                                  Edit in Form
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleLoadTemplateRx(rxItem, true)}
                                  className="flex-1 py-1 px-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-[11px] flex items-center justify-center gap-1"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add Direct</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Consultation Notes Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  <span>Clinical Observations & Diagnosis</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Chief Complaint *</label>
                    <input
                      type="text"
                      value={chiefComplaint}
                      onChange={(e) => setChiefComplaint(e.target.value)}
                      placeholder="e.g. Chest pain with exertion for 3 days"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#002043]"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Primary Clinical Diagnosis *</label>
                    <input
                      type="text"
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      placeholder="e.g. Stable Angina Pectoris (ICD-10 I20.9)"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#002043] font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Physical Examination Findings</label>
                    <textarea
                      rows={2}
                      value={examinationFindings}
                      onChange={(e) => setExaminationFindings(e.target.value)}
                      placeholder="S1 S2 regular, no murmurs, chest clear bilaterally..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#002043]"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Doctor Notes & Advice</label>
                    <textarea
                      rows={2}
                      value={doctorNotes}
                      onChange={(e) => setDoctorNotes(e.target.value)}
                      placeholder="Dietary restriction: low sodium. Restrict heavy lifting..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#002043]"
                    />
                  </div>

                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Treatment / Management Plan</label>
                      <input
                        type="text"
                        value={treatmentPlan}
                        onChange={(e) => setTreatmentPlan(e.target.value)}
                        placeholder="e.g. Initiate beta-blocker therapy, stress echocardiogram review"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#002043]"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Follow-up Review Date</label>
                      <input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#002043]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Structured E-Prescription Form */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Pill className="w-4 h-4 text-teal-600" />
                    <span>Electronic Prescription (E-Rx)</span>
                  </h3>
                  <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    Direct sync with Hospital Pharmacy
                  </span>
                </div>

                {/* Structured Prescription Composer Card */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
                  {/* Row 1: Medicine Selection with Live Stock */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-8">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-700 font-semibold">Select Medicine (from Hospital Formulary) *</label>
                        {selectedMed && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            selectedMed.current_stock > 10
                              ? 'bg-emerald-100 text-emerald-800'
                              : selectedMed.current_stock > 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {selectedMed.current_stock > 0 ? `Stock: ${selectedMed.current_stock} units` : 'Out of Stock'}
                          </span>
                        )}
                      </div>
                      <select
                        value={selectedMedId}
                        onChange={(e) => {
                          const medId = e.target.value;
                          setSelectedMedId(medId);
                          const m = medicines.find((x) => x.id === medId);
                          if (m?.dosage_form) setDosageForm(m.dosage_form);
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#002043] font-medium"
                      >
                        {medicines.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.strength}) • {m.dosage_form} • Stock: {m.current_stock}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-4">
                      <label className="text-slate-700 font-semibold block mb-1">Dosage Form *</label>
                      <select
                        value={dosageForm}
                        onChange={(e) => setDosageForm(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#002043]"
                      >
                        {DOSAGE_FORMS.map((form) => (
                          <option key={form} value={form}>{form}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 2: Dosage, Route, Frequency, Duration, Quantity */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div>
                      <label className="text-slate-700 font-semibold block mb-1">Dosage *</label>
                      <input
                        type="text"
                        value={dosage}
                        onChange={(e) => setDosage(e.target.value)}
                        placeholder="e.g. 1 Tablet"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="text-slate-700 font-semibold block mb-1">Route of Admin *</label>
                      <select
                        value={route}
                        onChange={(e) => setRoute(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                      >
                        {ROUTES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-700 font-semibold block mb-1">Frequency *</label>
                      <select
                        value={frequency}
                        onChange={(e) => handleFrequencyChange(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                      >
                        {FREQUENCIES.map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-700 font-semibold block mb-1">Duration (Days) *</label>
                      <input
                        type="number"
                        min={1}
                        value={durationDays}
                        onChange={(e) => handleDurationChange(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-700 font-semibold">Quantity *</label>
                        <span className="text-[10px] text-slate-400">Auto</span>
                      </div>
                      <input
                        type="number"
                        min={1}
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Row 3: Instructions & Add Button */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-9">
                      <label className="text-slate-700 font-semibold block mb-1">Patient Instructions</label>
                      <input
                        type="text"
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder="e.g. Take with warm water after meals. Avoid dairy."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <button
                        type="button"
                        onClick={handleAddMedication}
                        className="w-full py-2 bg-[#002043] hover:bg-[#17365d] text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5 text-teal-300" />
                        <span>Add Medication</span>
                      </button>
                    </div>
                  </div>

                  {/* Stock validation notice if quantity > available stock */}
                  {selectedMed && quantity > selectedMed.current_stock && (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-[11px] text-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>
                        Notice: Prescribed quantity ({quantity}) exceeds available stock ({selectedMed.current_stock}). Pharmacy will flag backorder.
                      </span>
                    </div>
                  )}
                </div>

                {/* Rx Items Table */}
                {rxList.length > 0 ? (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2.5">Medicine</th>
                          <th className="px-3 py-2.5">Dosage & Route</th>
                          <th className="px-3 py-2.5">Frequency</th>
                          <th className="px-3 py-2.5">Duration</th>
                          <th className="px-3 py-2.5">Qty</th>
                          <th className="px-3 py-2.5">Instructions</th>
                          <th className="px-3 py-2.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rxList.map((item, idx) => (
                          <tr key={`${item.medicine_id}-${idx}`} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2 font-bold text-slate-900">{item.medicine_name}</td>
                            <td className="px-3 py-2 text-slate-700">{item.dosage}</td>
                            <td className="px-3 py-2 text-slate-700">{item.frequency}</td>
                            <td className="px-3 py-2 text-slate-700">{item.duration_days} days</td>
                            <td className="px-3 py-2 text-slate-900 font-bold">{item.quantity}</td>
                            <td className="px-3 py-2 text-slate-500 italic">{item.instructions}</td>
                            <td className="px-3 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveRx(idx)}
                                className="text-rose-600 hover:text-rose-800 p-1 rounded-lg transition"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400">
                    No medications added yet. Use the composer above or choose from specialty templates.
                  </div>
                )}
              </div>

              {/* Previous Consultation Notes History */}
              {previousNotes.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Previous Notes for this Consultation Encounter ({previousNotes.length})
                  </h4>
                  <div className="space-y-2">
                    {previousNotes.map((note) => (
                      <div key={note.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>{note.diagnosis || 'Clinical Note'}</span>
                          <span className="text-[10px] text-slate-400">
                            {note.created_at ? new Date(note.created_at).toLocaleString() : ''}
                          </span>
                        </div>
                        {note.chief_complaint && <p className="text-slate-600">Chief complaint: {note.chief_complaint}</p>}
                        {note.treatment_plan && <p className="text-slate-600">Plan: {note.treatment_plan}</p>}
                        {note.doctor_notes && <p className="text-slate-500 italic">Notes: {note.doctor_notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
