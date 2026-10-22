import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Pill, ShieldCheck, FlaskConical, ArrowLeft, Calendar, Stethoscope, CheckCircle2, Clock } from 'lucide-react';
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

type LabOrderItem = {
  id: string;
  order_number?: string;
  test_name: string;
  test_category?: string;
  sample_type?: string;
  status: string;
  urgency?: string;
  result_value?: string;
  unit?: string;
  reference_range?: string;
  clinical_remarks?: string;
  technician_notes?: string;
  performed_by?: string;
  reviewed_by?: string;
  doctor_name?: string;
  ordered_at?: string;
  completed_at?: string;
};

export default function MedicalRecords() {
  const { user } = useAuth();
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [labOrders, setLabOrders] = useState<LabOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    let active = true;
    const patientId = user.role === 'PATIENT' ? user.patientId || user.id : undefined;
    const recordsRequest = api.records(patientId);
    const prescriptionsRequest = patientId ? api.prescriptions(patientId) : Promise.resolve([]);
    const labsRequest = patientId ? api.patientLabOrders(patientId) : api.myLabOrders();
    void Promise.all([recordsRequest, prescriptionsRequest, labsRequest])
      .then(([recordRows, prescriptionRows, labRows]) => {
        if (!active) return;
        setRecords(recordRows);
        setPrescriptions(prescriptionRows);
        setLabOrders(labRows || []);
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load medical information.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-8 animate-fade-in">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-[#002043] via-[#002b54] to-[#178B8B] text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-white/10">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-teal-400/30">
            Electronic Medical Records
          </span>
          <h1 className="text-3xl font-extrabold mt-2.5 tracking-tight">
            Medical Records &amp; Clinical Orders
          </h1>
          <p className="text-slate-200 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
            Consolidated outpatient summaries, digital prescriptions, and diagnostic pathology reports.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-3.5 text-xs self-start md:self-auto">
          <ShieldCheck className="w-5 h-5 text-teal-300 shrink-0" />
          <div>
            <span className="font-bold text-white block">{user?.name}</span>
            <span className="text-[10px] text-teal-200 uppercase font-semibold">NABH EMR Level-2 Verified</span>
          </div>
        </div>
      </div>

      {loading && (
        <div className="p-8 text-center text-slate-500 text-xs font-semibold">
          Synchronizing clinical records from hospital EMR...
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs font-semibold text-rose-800 shadow-xs" role="alert">
          Could not load medical information: {error}
        </div>
      )}

      {/* Clinical Notes Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-100 flex items-center justify-center text-teal-800 shadow-xs">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#002043]">Outpatient Consultation Notes</h2>
            <p className="text-xs text-slate-500">Documented by attending physician during clinic visits</p>
          </div>
        </div>

        {!loading && !error && records.length === 0 && (
          <div className="rounded-3xl border border-white/80 bg-white/80 backdrop-blur-xl p-6 text-xs text-slate-500 text-center shadow-xs">
            No clinical records are currently logged for this patient profile.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {records.map((record) => (
            <article
              key={record.id}
              className="rounded-3xl border border-white/80 bg-white/85 backdrop-blur-xl p-6 space-y-3 shadow-sm hover:shadow-md transition"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm">
                  {record.diagnosis || record.chief_complaint || 'Clinical consultation'}
                </h3>
                <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                  {record.created_at ? new Date(record.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date recorded'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-700">
                {record.chief_complaint && (
                  <p><strong className="text-slate-900">Chief complaint:</strong> {record.chief_complaint}</p>
                )}
                {record.examination_findings && (
                  <p><strong className="text-slate-900">Clinical Examination:</strong> {record.examination_findings}</p>
                )}
                {record.treatment_plan && (
                  <p><strong className="text-slate-900">Treatment Plan:</strong> {record.treatment_plan}</p>
                )}
                {record.doctor_notes && (
                  <p className="text-slate-500 italic mt-1">&ldquo;{record.doctor_notes}&rdquo;</p>
                )}
              </div>

              {record.follow_up_date && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-teal-700 font-bold">Recommended Follow-up:</span>
                  <span className="font-semibold text-slate-800">{record.follow_up_date}</span>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* Prescriptions Section */}
      {user?.role === 'PATIENT' && (
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-800 shadow-xs">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#002043]">Digital Prescriptions</h2>
              <p className="text-xs text-slate-500">Pharmacy-dispensable digital medication orders</p>
            </div>
          </div>

          {!loading && !error && prescriptions.length === 0 && (
            <div className="rounded-3xl border border-white/80 bg-white/80 backdrop-blur-xl p-6 text-xs text-slate-500 text-center shadow-xs">
              No prescriptions are recorded on file.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prescriptions.map((prescription) => (
              <article
                key={prescription.id}
                className="rounded-3xl border border-white/80 bg-white/85 backdrop-blur-xl p-6 space-y-3 shadow-sm hover:shadow-md transition"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {prescription.prescription_number || 'Rx Order'}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Prescribed by {prescription.doctor_name || 'Attending Physician'}
                      {prescription.created_at ? ` · ${new Date(prescription.created_at).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 text-[10px] font-bold uppercase tracking-wider border border-teal-200">
                    {prescription.status || 'Active'}
                  </span>
                </div>

                <ul className="divide-y divide-slate-100">
                  {(prescription.items || []).map((item, index) => (
                    <li key={`${item.medicine_name}-${index}`} className="py-2.5 text-xs text-slate-800">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-900 font-bold">{item.medicine_name || 'Medication'}</strong>
                        <span className="text-[11px] text-teal-700 font-semibold">{item.dosage || ''}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {item.frequency || 'Daily'} · {item.duration_days ? `${item.duration_days} days` : 'Ongoing'}
                      </p>
                      {item.instructions && (
                        <p className="text-[11px] text-slate-600 bg-slate-50 px-2 py-1 rounded-md mt-1.5 border border-slate-100">
                          {item.instructions}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Diagnostic Laboratory Orders */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-800 shadow-xs">
            <FlaskConical className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#002043]">Diagnostic Pathology &amp; Lab Orders</h2>
            <p className="text-xs text-slate-500">Automated biochemistry, hematology, and microbiology reports</p>
          </div>
        </div>

        {!loading && !error && labOrders.length === 0 && (
          <div className="rounded-3xl border border-white/80 bg-white/80 backdrop-blur-xl p-6 text-xs text-slate-500 text-center shadow-xs">
            No diagnostic orders logged for this patient profile.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {labOrders.map((lab) => (
            <article
              key={lab.id}
              className="rounded-3xl border border-white/80 bg-white/85 backdrop-blur-xl p-6 space-y-3 shadow-sm hover:shadow-md transition"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">{lab.test_name}</h3>
                  {lab.order_number && (
                    <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                      {lab.order_number}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  lab.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                  lab.status === 'SAMPLE_COLLECTED' ? 'bg-amber-100 text-amber-800' :
                  'bg-teal-50 text-teal-800 border border-teal-200'
                }`}>
                  {lab.status || 'ORDERED'}
                </span>
              </div>

              <p className="text-[11px] text-slate-500">
                {lab.test_category ? `${lab.test_category} · ` : ''}
                {lab.sample_type ? `Sample: ${lab.sample_type} · ` : ''}
                {lab.ordered_at ? `Ordered ${new Date(lab.ordered_at).toLocaleDateString()}` : ''}
                {lab.doctor_name ? ` by ${lab.doctor_name}` : ''}
              </p>

              {lab.result_value ? (
                <div className="p-3.5 bg-gradient-to-r from-teal-50/70 to-emerald-50/50 border border-teal-200/80 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 font-semibold">Reported Value:</span>
                    <span className="text-sm font-black text-teal-900">
                      {lab.result_value} {lab.unit || ''}
                    </span>
                  </div>
                  {lab.reference_range && (
                    <div className="text-[11px] text-slate-500">
                      Reference Interval: <span className="font-mono text-slate-700">{lab.reference_range}</span>
                    </div>
                  )}
                  {lab.clinical_remarks && (
                    <p className="text-xs text-slate-700 pt-1 border-t border-teal-100">
                      <strong>Pathologist Remarks:</strong> {lab.clinical_remarks}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  Sample received in lab. Verification in progress.
                </p>
              )}
            </article>
          ))}
        </div>
      </section>

      <div className="pt-2">
        <Link
          to="/portal/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:text-teal-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Patient Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
