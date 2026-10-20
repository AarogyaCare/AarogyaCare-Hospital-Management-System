import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, Clock, MapPin, User, CheckCircle2, 
  XCircle, RefreshCw, Plus, ArrowRight, ShieldCheck, AlertCircle 
} from 'lucide-react';
import { api, AppointmentDto } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { mapAppointmentResponse, AppointmentView, formatAppointmentDate } from '../services/appointmentMapping';

export interface AppointmentRecord {
  id: string;
  tokenNumber: string;
  patientName: string;
  patientUhid: string;
  doctorName: string;
  department: string;
  timeSlot: string;
  date: string;
  mode: string;
  status: 'Waiting' | 'In Consultation' | 'Completed' | 'Cancelled';
  room: string;
  type: string;
}

type PatientAppointmentRecord = AppointmentRecord & { doctorId?: string };

const mapToPatientRecord = (apt: AppointmentDto): PatientAppointmentRecord => {
  const mapped: AppointmentView = mapAppointmentResponse(apt);
  return {
    id: mapped.id,
    tokenNumber: mapped.tokenNumber,
    patientName: mapped.patientName,
    patientUhid: mapped.patientUhid,
    doctorName: mapped.doctorName,
    department: mapped.department,
    doctorId: mapped.doctorId,
    timeSlot: mapped.timeSlot,
    date: mapped.date,
    mode: mapped.mode,
    status: (['Waiting', 'In Consultation', 'Completed', 'Cancelled'].includes(mapped.status)
      ? mapped.status
      : 'Waiting') as PatientAppointmentRecord['status'],
    room: mapped.room || 'OPD-102',
    type: 'Consultation',
  };
};

export default function PatientAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<PatientAppointmentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Waiting' | 'In Consultation' | 'Completed'>('All');
  const [rescheduleApt, setRescheduleApt] = useState<PatientAppointmentRecord | null>(null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [newSlot, setNewSlot] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    api.appointments()
      .then((rows: AppointmentDto[]) => {
        setAppointments(rows.map(mapToPatientRecord));
      })
      .catch((error: Error) => {
        setNotice(`Could not load appointments from backend: ${error.message}`);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const filtered = appointments.filter((apt) => {
    if (activeFilter === 'All') return true;
    return apt.status === activeFilter;
  });

  const handleCancel = async (id: string) => {
    try {
      await api.cancelAppointment(id);
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'Cancelled' } : a)));
      setNotice(`Appointment was cancelled in the backend.`);
    } catch (error) {
      setNotice(`Cancellation failed: ${error instanceof Error ? error.message : 'Backend error'}`);
    }
    setTimeout(() => setNotice(null), 4000);
  };

  const loadRescheduleSlots = async (appointment: PatientAppointmentRecord) => {
    const doctorId = appointment.doctorId;
    if (!doctorId) {
      setNotice('Rescheduling is unavailable because this appointment has no linked doctor slot.');
      return;
    }
    try {
      const slots = await api.slots(doctorId);
      const available = slots.filter((slot: any) => String(slot.status).toUpperCase() === 'AVAILABLE' || !slot.status);
      setAvailableSlots(available);
      setNewSlot(available[0]?.id || available[0]?.slot_id || '');
      setRescheduleApt(appointment);
    } catch (error) {
      setNotice(`Could not load available slots: ${error instanceof Error ? error.message : 'Backend error'}`);
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!rescheduleApt || !newSlot) return;
    try {
      await api.rescheduleAppointment(rescheduleApt.id, newSlot);
      const rows = await api.appointments();
      setAppointments(rows.map(mapToPatientRecord));
      setNotice('Appointment rescheduled successfully.');
      setRescheduleApt(null);
    } catch (error) {
      setNotice(`Rescheduling failed: ${error instanceof Error ? error.message : 'Backend error'}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#002043] to-[#17365d] text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-teal-500/20 px-3 py-1 rounded-full border border-teal-400/30">
            Patient Portal Desk
          </span>
          <h1 className="text-3xl font-extrabold mt-2 tracking-tight">
            Welcome back, {user?.name?.trim().split(/\s+/)[0] || 'patient'}!<br />
            <span className="text-2xl">My Hospital Appointments</span>
          </h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-xl">
            Here&apos;s an overview of your appointments, OPD status, and available booking actions.
          </p>
        </div>

        <Link
          to="/appointments/book"
          className="px-5 py-3 bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Book New Appointment</span>
        </Link>
      </div>

      {notice && (
        <div className="p-4 bg-teal-50 border border-teal-300 text-teal-900 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>{notice}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {['All', 'Waiting', 'In Consultation', 'Completed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab as any)}
            className={`px-4 py-2 rounded-xl font-bold transition border ${
              activeFilter === tab
                ? 'bg-[#002043] text-white border-[#002043] shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="p-12 text-center text-slate-500 text-sm">
          Loading appointments from hospital service...
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No appointments found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You currently have no scheduled appointments in this category.
          </p>
          <Link
            to="/appointments/book"
            className="inline-block px-4 py-2 bg-[#002043] text-white text-xs font-bold rounded-xl mt-2 hover:bg-[#17365d]"
          >
            Schedule Consultation
          </Link>
        </div>
      )}

      {/* Appointments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((apt) => (
          <div
            key={apt.id}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {apt.department}
                </span>
                <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  Token: {apt.tokenNumber}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-base">{apt.doctorName}</h3>
                <p className="text-xs text-slate-500">{apt.type} • {apt.mode}</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Date:</span>
                  <span className="font-semibold text-slate-900">{apt.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Time Slot:</span>
                  <span className="font-bold text-teal-700">{apt.timeSlot}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Clinic Suite:</span>
                  <span className="font-medium text-slate-800">{apt.room} (Grems Road)</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span className="text-slate-400">Status:</span>
                  <span className={`font-bold ${
                    apt.status === 'In Consultation' ? 'text-blue-600' :
                    apt.status === 'Waiting' ? 'text-amber-600' :
                    apt.status === 'Completed' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    ● {apt.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              {user && ['PATIENT', 'RECEPTIONIST', 'ADMIN'].includes(user.role) && apt.status !== 'Cancelled' && apt.status !== 'Completed' ? (
                <>
                  <button
                    onClick={() => void loadRescheduleSlots(apt)}
                    className="text-slate-600 hover:text-[#002043] font-semibold flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reschedule</span>
                  </button>
                  <button
                    onClick={() => handleCancel(apt.id)}
                    className="text-rose-600 hover:text-rose-700 font-semibold"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <span className="text-slate-400 text-xs italic">No modifications permitted</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Reschedule Modal */}
      {rescheduleApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Reschedule Consultation</h3>
            <p className="text-xs text-slate-500">
              Moving appointment with <strong>{rescheduleApt.doctorName}</strong>.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1" htmlFor="reschedule-slot">Available backend slot</label>
              <select
                id="reschedule-slot"
                value={newSlot}
                onChange={(e) => setNewSlot(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                {availableSlots.map((slot: any) => <option key={slot.id || slot.slot_id} value={slot.id || slot.slot_id}>{slot.slot_start || 'Time unavailable'}{slot.slot_end ? `–${slot.slot_end}` : ''}</option>)}
              </select>
              {availableSlots.length === 0 && <p className="mt-2 text-xs text-amber-700">No available slots were returned for this doctor.</p>}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setRescheduleApt(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Dismiss
              </button>
              <button
                onClick={() => void handleRescheduleSubmit()}
                disabled={!newSlot}
                className="px-4 py-2 bg-[#002043] text-white rounded-xl text-xs font-bold hover:bg-[#17365d] disabled:opacity-50"
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
