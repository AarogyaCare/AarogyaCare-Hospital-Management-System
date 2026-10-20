import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Pill, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

type RecordItem = {
  id: string;
  chief_complaint?: string;
  diagnosis?: string;
  examination_findings?: string;
  treatment_plan?: string;
  doctor_notes?: string;
  created_at?: string;
  follow_up_date?: string;
};

type PrescriptionItem = {
  medicine_name?: string;
  dosage?: string;
  frequency?: string;
  duration_days?: number;
  quantity?: number;
  instructions?: string;
};

type Prescription = {
  id: string;
  prescription_number?: string;
  doctor_name?: string;
  status?: string;
  created_at?: string;
  items?: PrescriptionItem[];
};

export default function MedicalRecords() {
  const { user } = useAuth();
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    let active = true;
    const patientId = user.role === 'PATIENT' ? user.patientId || user.id : undefined;
    const recordsRequest = api.records(patientId);
    const prescriptionsRequest = patientId ? api.prescriptions(patientId) : Promise.resolve([]);
    void Promise.all([recordsRequest, prescriptionsRequest])
      .then(([recordRows, prescriptionRows]) => {
        if (!active) return;
        setRecords(recordRows);
        setPrescriptions(prescriptionRows);
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load medical information.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-8">
      <div className="bg-gradient-to-r from-[#002043] to-[#17365d] text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase text-teal-200">Authenticated Health Records</span>
          <h1 className="text-3xl font-extrabold mt-2">Medical Records &amp; Prescriptions</h1>
          <p className="text-slate-300 text-sm mt-2">Clinical information shown here is retrieved from the hospital service.</p>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-white/10 border border-white/20 p-4 text-sm"><ShieldCheck className="w-5 h-5 text-teal-300" /><span>{user?.name}</span></div>
      </div>

      {loading && <p className="text-sm text-slate-600" role="status">Loading your records…</p>}
      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">Could not load medical information: {error}</p>}

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[#002043] flex items-center gap-2"><FileText className="w-5 h-5" />Clinical records</h2>
        {!loading && !error && records.length === 0 && <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">No clinical records are available for this account.</p>}
        {records.map((record) => <article key={record.id} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2">
          <div className="flex flex-wrap justify-between gap-2"><h3 className="font-bold text-slate-900">{record.diagnosis || record.chief_complaint || 'Clinical consultation'}</h3><time className="text-xs text-slate-500">{record.created_at ? new Date(record.created_at).toLocaleDateString() : 'Date unavailable'}</time></div>
          {record.chief_complaint && <p className="text-sm text-slate-700"><strong>Chief complaint:</strong> {record.chief_complaint}</p>}
          {record.examination_findings && <p className="text-sm text-slate-700"><strong>Examination:</strong> {record.examination_findings}</p>}
          {record.treatment_plan && <p className="text-sm text-slate-700"><strong>Treatment plan:</strong> {record.treatment_plan}</p>}
          {record.doctor_notes && <p className="text-sm text-slate-700"><strong>Notes:</strong> {record.doctor_notes}</p>}
          {record.follow_up_date && <p className="text-xs text-slate-500">Follow-up: {record.follow_up_date}</p>}
        </article>)}
      </section>

      {user?.role === 'PATIENT' && <section className="space-y-4">
        <h2 className="text-xl font-bold text-[#002043] flex items-center gap-2"><Pill className="w-5 h-5" />Prescriptions</h2>
        {!loading && !error && prescriptions.length === 0 && <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">No prescriptions are available for this account.</p>}
        {prescriptions.map((prescription) => <article key={prescription.id} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
          <div className="flex flex-wrap justify-between gap-2"><h3 className="font-bold text-slate-900">{prescription.prescription_number || 'Prescription'}</h3><span className="text-xs text-teal-800">{prescription.status || 'Status unavailable'}</span></div>
          <p className="text-xs text-slate-500">{prescription.doctor_name || 'Prescribing clinician'}{prescription.created_at ? ` · ${new Date(prescription.created_at).toLocaleDateString()}` : ''}</p>
          <ul className="divide-y divide-slate-100">{(prescription.items || []).map((item, index) => <li key={`${item.medicine_name}-${index}`} className="py-2 text-sm text-slate-700"><strong>{item.medicine_name || 'Medicine'}</strong>{item.dosage ? ` · ${item.dosage}` : ''}{item.frequency ? ` · ${item.frequency}` : ''}{item.duration_days ? ` · ${item.duration_days} days` : ''}{item.instructions ? <p className="text-xs text-slate-500 mt-1">{item.instructions}</p> : null}</li>)}</ul>
        </article>)}
      </section>}

      <Link to="/portal/dashboard" className="inline-flex text-sm font-semibold text-teal-800 hover:underline">Back to dashboard</Link>
    </div>
  );
}