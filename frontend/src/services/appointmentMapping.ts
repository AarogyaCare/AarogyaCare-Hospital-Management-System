export interface AppointmentView {
  id: string;
  tokenNumber: string;
  patientId: string;
  patientName: string;
  patientUhid: string;
  doctorId: string;
  doctorName: string;
  department: string;
  room: string;
  date: string;
  timeSlot: string;
  mode: string;
  reason: string;
  status: string;
}

export function formatAppointmentDate(value: unknown, legacySlotStart?: unknown, createdAt?: unknown): string {
  const dateValue = typeof value === 'string' ? value.trim() : '';
  if (dateValue && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    const [year, month, day] = dateValue.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString();
  }
  if (dateValue) {
    const parsedDate = new Date(dateValue);
    if (!Number.isNaN(parsedDate.getTime())) return parsedDate.toLocaleDateString();
  }

  const legacyValue = typeof legacySlotStart === 'string' ? legacySlotStart.trim() : '';
  if (/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(legacyValue)) {
    const parsedDate = new Date(legacyValue);
    if (!Number.isNaN(parsedDate.getTime())) return parsedDate.toLocaleDateString();
  }

  const createdValue = typeof createdAt === 'string' ? createdAt.trim() : '';
  if (createdValue) {
    const parsedDate = new Date(createdValue);
    if (!Number.isNaN(parsedDate.getTime())) return parsedDate.toLocaleDateString();
  }

  return 'Date not recorded';
}

function formatAppointmentTime(value: unknown): string {
  const timeValue = typeof value === 'string' ? value.trim() : '';
  if (!timeValue) return 'Time unavailable';
  if (/^\d{1,2}:\d{2}\s*[ap]m$/i.test(timeValue)) return timeValue.replace(/\s+/g, ' ').toUpperCase();
  const parsedDate = new Date(timeValue);
  return Number.isNaN(parsedDate.getTime())
    ? timeValue
    : parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function mapStatus(status: unknown): string {
  const value = String(status ?? '').toUpperCase();
  const statuses: Record<string, string> = {
    SCHEDULED: 'Waiting',
    BOOKED: 'Waiting',
    CONFIRMED: 'Waiting',
    CHECKED_IN: 'Waiting',
    IN_PROGRESS: 'In Consultation',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    NO_SHOW: 'No Show',
  };
  return statuses[value] || (value ? value.replaceAll('_', ' ') : 'Status unavailable');
}

export function mapAppointmentResponse(appointment: any): AppointmentView {
  return {
    id: String(appointment.id || ''),
    tokenNumber: String(appointment.queue_token || appointment.appointment_number || 'Token unavailable'),
    patientId: String(appointment.patient_id || ''),
    patientName: String(appointment.patient_name || 'Patient name unavailable'),
    patientUhid: String(appointment.patient_uhid || 'UHID unavailable'),
    doctorId: String(appointment.doctor_id || ''),
    doctorName: String(appointment.doctor_name || 'Doctor unavailable'),
    department: String(appointment.department_name || 'Department unavailable'),
    room: String(appointment.room_number || 'Room unavailable'),
    date: formatAppointmentDate(appointment.appointment_date, appointment.slot_start, appointment.created_at),
    timeSlot: formatAppointmentTime(appointment.slot_start),
    mode: String(appointment.consultation_mode || 'Consultation mode unavailable'),
    reason: String(appointment.reason_for_visit || ''),
    status: mapStatus(appointment.status),
  };
}
