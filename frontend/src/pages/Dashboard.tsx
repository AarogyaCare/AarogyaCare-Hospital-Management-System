import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays, FileText, CreditCard, CircleAlert,
  ArrowRight, ShieldCheck, Clock, User, Pill, CheckCircle2,
  AlertTriangle, Sparkles, Activity
} from 'lucide-react';
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

function DataSection({
  title,
  href,
  icon: Icon,
  accent,
  state,
  renderRow,
}: {
  title: string;
  href: string;
  icon: any;
  accent: { bg: string; text: string; border: string };
  state: LoadState<any>;
  renderRow: (row: any) => { primary: string; secondary?: string; badge?: string };
}) {
  return (
    <section className="rounded-3xl border border-white/80 bg-white/85 backdrop-blur-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl ${accent.bg} ${accent.text} flex items-center justify-center shadow-xs`}>
              <Icon className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-[#002043] text-sm">{title}</h2>
          </div>
          <Link to={href} className="text-xs font-bold text-teal-800 hover:text-teal-900 transition flex items-center gap-1">
            <span>View all</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {state.status === 'loading' && (
          <div className="space-y-2.5 py-2">
            <div className="h-4 skeleton rounded-lg w-3/4" />
            <div className="h-4 skeleton rounded-lg w-1/2" />
            <div className="h-4 skeleton rounded-lg w-2/3" />
          </div>
        )}

        {state.status === 'error' && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{state.message}</span>
          </div>
        )}

        {state.status === 'ready' && state.data.length === 0 && (
          <div className="py-6 text-center text-xs text-slate-400">
            No records available at this time.
          </div>
        )}

        {state.status === 'ready' && state.data.length > 0 && (
          <ul className="divide-y divide-slate-100">
            {state.data.slice(0, 3).map((row, index) => {
              const item = renderRow(row);
              return (
                <li key={row.id || row.appointment_id || row.invoice_id || index} className="py-2.5 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{item.primary}</p>
                    {item.secondary && (
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">{item.secondary}</p>
                    )}
                  </div>
                  {item.badge && (
                    <span className="shrink-0 px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 text-[10px] font-bold uppercase tracking-wider border border-teal-200">
                      {item.badge}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="pt-4 border-t border-slate-100 mt-4">
        <span className="text-[10px] text-slate-400 block font-medium">
          {state.status === 'ready' ? `${state.data.length} total entries recorded` : 'Telemetry synching'}
        </span>
      </div>
    </section>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({
    appointments: pending(),
    records: pending(),
    prescriptions: pending(),
    invoices: pending(),
  });

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
      const [appointments, records, prescriptions, invoices] = await Promise.all([
        appointmentPromise,
        recordPromise,
        prescriptionPromise,
        invoicePromise,
      ]);
      if (active) setData({ appointments, records, prescriptions, invoices });
    };
    void load();
    return () => { active = false; };
  }, [user]);

  if (!user) return null;
  const role = user.role.replace('_', ' ');

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-8 animate-fade-in">
      {/* Top Welcome Header Card */}
      <header className="relative overflow-hidden bg-gradient-to-r from-[#002043] via-[#002b54] to-[#178B8B] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-white/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-teal-200 text-xs font-bold border border-white/20">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
              <span>Medora Patient EMR Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {user.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 max-w-xl leading-relaxed">
              Verified clinical role: <strong className="text-white uppercase">{role}</strong>.
              {user.uhid ? ` UHID / Hospital Record Number: ${user.uhid}.` : ''} All medical summaries are cryptographically synced with the authoritative hospital core.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/appointments/book"
              className="px-4 py-2.5 bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/20 transition transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Book OPD Appointment
            </Link>
            <Link
              to="/doctors"
              className="px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl text-xs font-semibold text-white backdrop-blur-md transition"
            >
              Consultant Directory
            </Link>
          </div>
        </div>
      </header>

      {/* Grid of 4 Pastel Glass Cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <DataSection
          title="Appointments"
          href="/portal/appointments"
          icon={CalendarDays}
          accent={{ bg: 'bg-[#e8faf5]', text: 'text-teal-700', border: 'border-teal-200' }}
          state={data.appointments}
          renderRow={(row) => ({
            primary: row.doctor_name || 'OPD Appointment',
            secondary: row.slot_start ? new Date(row.slot_start).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : (row.appointment_date || 'Scheduled'),
            badge: row.status || 'CONFIRMED',
          })}
        />
        <DataSection
          title="Medical Records"
          href="/portal/medical-records"
          icon={FileText}
          accent={{ bg: 'bg-[#e8f4fd]', text: 'text-blue-700', border: 'border-blue-200' }}
          state={data.records}
          renderRow={(row) => ({
            primary: row.diagnosis || row.chief_complaint || 'Clinical Note',
            secondary: row.created_at ? new Date(row.created_at).toLocaleDateString() : 'Recorded in EMR',
            badge: row.follow_up_date ? 'Follow-up Set' : 'Completed',
          })}
        />
        <DataSection
          title="Prescriptions"
          href="/portal/medical-records"
          icon={Pill}
          accent={{ bg: 'bg-[#f0eeff]', text: 'text-purple-700', border: 'border-purple-200' }}
          state={data.prescriptions}
          renderRow={(row) => ({
            primary: row.prescription_number || 'Rx Item',
            secondary: `${(row.items || []).length} medication(s) prescribed`,
            badge: row.status || 'ACTIVE',
          })}
        />
        <DataSection
          title="Invoices & Bills"
          href="/portal/billing"
          icon={CreditCard}
          accent={{ bg: 'bg-[#e4f6f8]', text: 'text-cyan-700', border: 'border-cyan-200' }}
          state={data.invoices}
          renderRow={(row) => ({
            primary: row.invoice_number || 'Tax Invoice',
            secondary: `₹${row.net_payable ?? row.total_amount ?? 0}`,
            badge: row.status || 'PAID',
          })}
        />
      </div>

      {/* Clinical Telemetry Notice */}
      <section className="flex items-start gap-3 rounded-2xl border border-teal-200/80 bg-teal-50/70 p-4 text-xs text-teal-900 shadow-xs">
        <CircleAlert className="w-5 h-5 shrink-0 text-teal-700 mt-0.5" />
        <p className="leading-relaxed">
          Dashboard information is pulled directly from the authenticated MongoDB store. Hospital telemetry and clinical encounter histories update in real-time as consultations and pharmacy dispenses are processed.
        </p>
      </section>

      {/* Quick Navigation Shortcuts */}
      <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-700 pt-2">
        <Link
          to="/portal/appointments"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/80 hover:bg-white border border-slate-200/80 shadow-xs hover:text-teal-700 transition"
        >
          <CalendarDays className="w-4 h-4 text-teal-600" />
          <span>My Appointments</span>
        </Link>
        <Link
          to="/portal/medical-records"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/80 hover:bg-white border border-slate-200/80 shadow-xs hover:text-teal-700 transition"
        >
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Records & Prescriptions</span>
        </Link>
        <Link
          to="/portal/billing"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/80 hover:bg-white border border-slate-200/80 shadow-xs hover:text-teal-700 transition"
        >
          <CreditCard className="w-4 h-4 text-purple-600" />
          <span>Invoices & Receipts</span>
        </Link>
      </div>
    </main>
  );
}
