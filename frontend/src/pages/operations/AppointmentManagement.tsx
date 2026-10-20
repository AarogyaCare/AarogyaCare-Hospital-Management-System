import { useState, useEffect } from 'react';
import {
  Calendar, Clock, User, Filter, Search,
  CheckCircle2, RefreshCw, XCircle, ArrowRight, ShieldCheck, AlertCircle
} from 'lucide-react';
import { api, AppointmentDto } from '../../services/api';
import { HospitalDoctor, mapDoctorResponse } from '../../services/doctorMapping';
import { useAuth } from '../../context/AuthContext';

export default function AppointmentManagement() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [doctors, setDoctors] = useState<HospitalDoctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Reschedule modal
  const [rescheduleApt, setRescheduleApt] = useState<AppointmentDto | null>(null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [newSlotId, setNewSlotId] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('Doctor requested schedule adjustment');
  const [isRescheduling, setIsRescheduling] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [aptRes, docRes] = await Promise.all([
        api.appointments(),
        api.doctors()
      ]);
      setAppointments(aptRes);
      setDoctors(docRes.items.map(mapDoctorResponse));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not fetch appointment directory.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const updated = await api.updateAppointmentStatus(id, newStatus);
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
      showToast(`Updated appointment status to ${newStatus}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Status update failed.', 'error');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const cancelled = await api.cancelAppointment(id);
      setAppointments((prev) => prev.map((a) => (a.id === id ? cancelled : a)));
      showToast(`Cancelled appointment #${id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Cancellation failed.', 'error');
    }
  };

  const openRescheduleModal = async (apt: AppointmentDto) => {
    setRescheduleApt(apt);
    if (!apt.doctor_id) {
      showToast('No doctor linked to this appointment for rescheduling.', 'error');
      return;
    }
    try {
      const slots = await api.slots(apt.doctor_id);
      const available = slots.filter((s: any) => String(s.status).toUpperCase() === 'AVAILABLE');
      setAvailableSlots(available);
      if (available.length > 0) {
        setNewSlotId(available[0].id || available[0].slot_id);
      } else {
        setNewSlotId('');
      }
    } catch {
      setAvailableSlots([]);
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!rescheduleApt || !newSlotId) return;
    setIsRescheduling(true);
    try {
      await api.rescheduleAppointment(rescheduleApt.id, newSlotId, rescheduleReason);
      showToast('Appointment rescheduled successfully.');
      setRescheduleApt(null);
      await loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Reschedule failed.', 'error');
    } finally {
      setIsRescheduling(false);
    }
  };

  const filtered = appointments.filter((apt) => {
    const matchesDoc = selectedDoctor === 'All' || apt.doctor_name === selectedDoctor;
    const matchesStatus = selectedStatus === 'All' || apt.status === selectedStatus;
    const matchesSearch =
      (apt.patient_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (apt.queue_token || '').toLowerCase().includes(search.toLowerCase()) ||
      (apt.appointment_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (apt.department_name || '').toLowerCase().includes(search.toLowerCase());
    return matchesDoc && matchesStatus && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#002043] via-[#002c57] to-[#178B8B] text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-teal-500/20 px-3 py-1 rounded-full border border-teal-400/30">
            Aarogya Central Scheduling Desk
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
            Master Appointment Management
          </h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-xl">
            Hospital-wide outpatient grid, slot utilization metrics, cross-department scheduling, and doctor consult room allocation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <div className="bg-white/10 p-3 rounded-2xl border border-white/20 text-xs">
            <span className="text-slate-300 block text-[10px]">Total Appointments:</span>
            <span className="text-lg font-bold text-white">{appointments.length} Records</span>
          </div>
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

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient, token, or specialty..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#002043]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
          >
            <option value="All">All Specialists</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name} ({d.specialty})
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
          >
            <option value="All">All Statuses</option>
            <option value="BOOKED">BOOKED</option>
            <option value="CHECKED_IN">CHECKED_IN</option>
            <option value="TRIAGED">TRIAGED</option>
            <option value="IN_CONSULTATION">IN_CONSULTATION</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Master Appointment Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Hospital Appointment Schedule</h3>
          <span className="text-xs text-slate-400">{filtered.length} Appointments Displayed</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading appointments...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No appointments found matching your filter criteria.</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Token &amp; Number</th>
                  <th className="px-3 py-3">Patient</th>
                  <th className="px-3 py-3">Specialist &amp; Dept</th>
                  <th className="px-3 py-3">Timing</th>
                  <th className="px-3 py-3">Mode</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((apt) => {
                  const isCancelled = apt.status === 'CANCELLED';
                  const isCompleted = apt.status === 'COMPLETED';
                  return (
                    <tr key={apt.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-[#002043] block">
                          {apt.queue_token || apt.appointment_number}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{apt.id}</span>
                      </td>
                      <td className="px-3 py-3 font-bold text-slate-900">
                        {apt.patient_name || 'Patient'}
                        {apt.reason_for_visit && (
                          <span className="text-slate-500 block text-[10px] font-normal truncate max-w-[150px]">
                            {apt.reason_for_visit}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-semibold text-slate-800 block">{apt.doctor_name || 'Doctor'}</span>
                        <span className="text-[10px] text-teal-700">{apt.department_name || 'OPD'}</span>
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        <span className="font-medium text-slate-800 block">{apt.slot_start || 'Scheduled'}</span>
                        <span className="text-[10px] text-slate-400">{apt.appointment_date}</span>
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {apt.consultation_mode === 'VIDEO' ? 'Teleconsult' : 'In-Person OPD'}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          apt.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          apt.status === 'TRIAGED' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                          apt.status === 'CHECKED_IN' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          apt.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {apt.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isCancelled && !isCompleted && (
                            <>
                              <button
                                type="button"
                                onClick={() => openRescheduleModal(apt)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] transition"
                              >
                                Reschedule
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCancel(apt.id)}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg text-[11px] transition"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {isCompleted && (
                            <span className="text-emerald-700 text-[11px] font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Done</span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {rescheduleApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Reschedule Appointment</h3>
            <p className="text-xs text-slate-500">
              Moving appointment for <strong>{rescheduleApt.patient_name}</strong> with {rescheduleApt.doctor_name}.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Select New Available Slot</label>
                {availableSlots.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
                    No open slots currently available for this doctor.
                  </div>
                ) : (
                  <select
                    value={newSlotId}
                    onChange={(e) => setNewSlotId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {availableSlots.map((s) => (
                      <option key={s.id || s.slot_id} value={s.id || s.slot_id}>
                        {s.slot_start} - {s.slot_end}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Reason for Rescheduling</label>
                <input
                  type="text"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRescheduleApt(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRescheduleSubmit}
                disabled={!newSlotId || isRescheduling}
                className="px-5 py-2 bg-[#002043] hover:bg-[#17365d] disabled:opacity-50 text-white rounded-xl text-xs font-bold"
              >
                {isRescheduling ? 'Rescheduling...' : 'Confirm Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
