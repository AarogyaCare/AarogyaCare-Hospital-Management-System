import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, FileText, CreditCard, CircleAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

type LoadState<T> = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: T[] };
type DashboardData = {
  appointments: LoadState<any>;
  records: LoadState<any>;
  prescriptions: LoadState<any>;
  invoices: LoadState<any>;
};

const pending = (): LoadState<any> => ({ status: 'loading' });
const requestState = async (request: Promise<any[]>): Promise<LoadState<any>> => {
  try {
    const result = await request;
    if (!Array.isArray(result)) throw new Error('The server returned an unexpected response.');
    return { status: 'ready', data: result };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : 'Unable to load this information.' };
  }
};

function DataSection({ title, href, state, renderRow }: {
  title: string;
  href: string;
  state: LoadState<any>;
  renderRow: (row: any) => string;
}) {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold text-[#002043]">{title}</h2>
        <Link to={href} className="text-xs font-semibold text-teal-800 hover:underline">View all</Link>
      </div>
      {state.status === 'loading' && <p className="text-sm text-slate-500" role="status">Loading…</p>}
      {state.status === 'error' && <p className="text-sm text-rose-700" role="alert">Could not load this information: {state.message}</p>}
      {state.status === 'ready' && state.data.length === 0 && <p className="text-sm text-slate-500">No records available.</p>}
      {state.status === 'ready' && state.data.length > 0 && <ul className="divide-y divide-slate-100">{state.data.slice(0, 3).map((row, index) => <li key={row.id || row.appointment_id || row.invoice_id || index} className="py-2 text-sm text-slate-700">{renderRow(row)}</li>)}</ul>}
    </section>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({ appointments: pending(), records: pending(), prescriptions: pending(), invoices: pending() });

  useEffect(() => {
    if (!user) return;
    let active = true;
    const load = async () => {
      const appointmentPromise = requestState(api.appointments());
      const recordPromise = requestState(api.records());
      const prescriptionPromise = user.patientId
        ? requestState(api.prescriptions(user.patientId))
        : Promise.resolve<LoadState<any>>({ status: 'error', message: 'No patient profile is linked to this account.' });
      const invoicePromise = user.patientId
        ? requestState(api.patientInvoices(user.patientId))
        : Promise.resolve<LoadState<any>>({ status: 'error', message: 'No patient profile is linked to this account.' });
      const [appointments, records, prescriptions, invoices] = await Promise.all([appointmentPromise, recordPromise, prescriptionPromise, invoicePromise]);
      if (active) setData({ appointments, records, prescriptions, invoices });
    };
    void load();
    return () => { active = false; };
  }, [user]);

  if (!user) return null;
  const role = user.role.replace('_', ' ');

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-8">
      <header className="bg-gradient-to-r from-[#002043] to-[#178B8B] text-white p-6 sm:p-8 rounded-3xl shadow-xl">
        <p className="text-xs uppercase font-bold text-teal-200">Patient Portal</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">Welcome, {user.name}</h1>
        <p className="text-sm text-slate-200 mt-2">Your account role is verified as {role}.{user.uhid ? ` Patient ID: ${user.uhid}.` : ''}</p>
        <div className="flex flex-wrap gap-2 mt-5">
          <Link to="/appointments/book" className="px-4 py-2 bg-white text-[#002043] rounded-lg text-sm font-semibold hover:bg-teal-50">Book an appointment</Link>
          <Link to="/doctors" className="px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-sm font-semibold hover:bg-white/20">Find a doctor</Link>
        </div>
      </header>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <DataSection title="Appointments" href="/portal/appointments" state={data.appointments} renderRow={(row) => `${row.doctor_name || 'Appointment'} · ${row.slot_start || row.status || 'Scheduled'}`} />
        <DataSection title="Medical records" href="/portal/medical-records" state={data.records} renderRow={(row) => row.diagnosis || row.chief_complaint || 'Clinical record'} />
        <DataSection title="Prescriptions" href="/portal/medical-records" state={data.prescriptions} renderRow={(row) => `${row.prescription_number || 'Prescription'} · ${row.status || 'Available'}`} />
        <DataSection title="Invoices" href="/portal/billing" state={data.invoices} renderRow={(row) => `${row.invoice_number || 'Invoice'} · ${row.status || row.payment_status || 'Available'}`} />
      </div>

      <section className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
        <CircleAlert className="w-5 h-5 shrink-0" />
        <p>Dashboard information is loaded from your authenticated account. Clinical measurements and transactions appear only when returned by the hospital service.</p>
      </section>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link to="/portal/appointments" className="inline-flex items-center gap-2 text-[#002043] font-semibold"><CalendarDays className="w-4 h-4" />Appointments</Link>
        <Link to="/portal/medical-records" className="inline-flex items-center gap-2 text-[#002043] font-semibold"><FileText className="w-4 h-4" />Records and prescriptions</Link>
        <Link to="/portal/billing" className="inline-flex items-center gap-2 text-[#002043] font-semibold"><CreditCard className="w-4 h-4" />Invoices</Link>
      </div>
    </main>
  );
}