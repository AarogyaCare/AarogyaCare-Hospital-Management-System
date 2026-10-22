export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface PatientDto {
  id: string;
  user_id?: string;
  uhid: string;
  name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  address?: string;
  allergies?: string;
  chronic_conditions?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  created_at?: string;
}

export interface CreatePatientDto {
  name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  address?: string;
  allergies?: string;
  chronic_conditions?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

export interface AppointmentDto {
  id: string;
  appointment_number: string;
  patient_id: string;
  patient_name?: string;
  doctor_id: string;
  doctor_name?: string;
  department_name?: string;
  slot_id: string;
  slot_start?: string;
  slot_end?: string;
  status: string;
  reason_for_visit?: string;
  consultation_mode?: string;
  queue_token?: string;
  appointment_date?: string;
  created_at?: string;
  triage_level?: string;
  vital_signs?: string;
  triage_notes?: string;
  triaged_by?: string;
  triaged_at?: string;
  short_url?: string;
}

export interface ClinicalNoteDto {
  id: string;
  patient_id: string;
  appointment_id?: string;
  doctor_id?: string;
  chief_complaint?: string;
  examination_findings?: string;
  diagnosis?: string;
  treatment_plan?: string;
  doctor_notes?: string;
  follow_up_date?: string;
  created_at?: string;
}

export interface PrescriptionItemDto {
  medicine_id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  instructions: string;
  quantity: number;
}

export interface PrescriptionDto {
  id: string;
  prescription_number: string;
  patient_id: string;
  patient_name?: string;
  appointment_id?: string;
  doctor_id?: string;
  doctor_name?: string;
  status: string;
  items: PrescriptionItemDto[];
  created_at?: string;
}

export interface MedicineDto {
  id: string;
  code: string;
  name: string;
  brand_name?: string;
  category: string;
  dosage_form: string;
  strength: string;
  unit_price: number;
  current_stock: number;
  minimum_threshold: number;
  is_low_stock?: boolean;
}

export interface InventoryItemDto {
  id: string;
  code: string;
  name: string;
  brand_name?: string;
  category: string;
  dosage_form: string;
  strength: string;
  unit_price: number;
  current_stock: number;
  minimum_threshold: number;
  stock_status: string;
}

export interface InvoiceItemDto {
  item_type: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface InvoiceDto {
  id: string;
  invoice_number: string;
  patient_id: string;
  patient_name?: string;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  net_payable: number;
  status: string;
  payment_method?: string;
  items: InvoiceItemDto[];
  created_at?: string;
}

export interface EmergencyDto {
  id: string;
  patient_name: string;
  patient_id?: string;
  doctor_id?: string;
  doctor_name?: string;
  appointment_id?: string;
  contact_number?: string;
  triage_level: 'RED' | 'YELLOW' | 'GREEN';
  chief_complaint: string;
  vital_signs?: string;
  status: string;
  priority_score: number;
  notes?: string;
  created_at: string;
}

export interface EmergencyCreatePayload {
  patient_name: string;
  patient_id?: string;
  doctor_id?: string;
  doctor_name?: string;
  contact_number?: string;
  triage_level: string;
  chief_complaint: string;
  vital_signs?: string;
  notes?: string;
  [key: string]: any;
}

export interface AiChatResponse {
  reply?: string;
  success: boolean;
  error?: string;
  model_used?: string;
}

export interface AiStatusResponse {
  configured: boolean;
  model: string;
  message: string;
}

export interface TimelineEventDto {
  timestamp: string;
  author: string;
  role: string;
  event_type: string;
  description: string;
}

export interface InterventionDto {
  id: string;
  timestamp: string;
  author: string;
  role: string;
  type: string;
  notes: string;
  vitals_recorded?: string;
}

export interface EmergencyIncidentDetailDto {
  id: string;
  incident_number: string;
  patient_name: string;
  patient_id?: string;
  contact_number: string;
  triage_level: string;
  chief_complaint: string;
  vital_signs?: string;
  status: string;
  priority_score: number;
  created_at: string;
  updated_at?: string;
  location?: string;
  caller_name?: string;
  emergency_type?: string;
  notes?: string;
  is_provisional?: boolean;
  assigned_doctor_id?: string;
  assigned_doctor_name?: string;
  assigned_nurse_id?: string;
  assigned_nurse_name?: string;
  assigned_bay?: string;
  disposition?: string;
  disposition_notes?: string;
  destination_ward?: string;
  closed_at?: string;
  closed_by?: string;
  timeline: TimelineEventDto[];
  interventions: InterventionDto[];
}

export interface EmergencySurgeStatsDto {
  active_incidents: number;
  critical_red_count: number;
  urgent_yellow_count: number;
  awaiting_triage_count: number;
  stabilizing_count: number;
  allocated_bays_count: number;
}

export interface ArticleSectionDto {
  heading: string;
  content: string;
  bullet_points: string[];
}

export interface ResourcePreviewDto {
  id: string;
  url: string;
  title: string;
  domain: string;
  source_name: string;
  category: string;
  specialty: string;
  published_date: string;
  indexed_at: string;
  content_snippet: string;
  full_text: string;
  sections: ArticleSectionDto[];
  safe_outlinks: string[];
  disclaimer: string;
}

export interface MedicalKnowledgeItemDto {
  id: string;
  url: string;
  title: string;
  domain: string;
  source_name: string;
  category: string;
  specialty: string;
  content_snippet: string;
  indexed_at: string;
  section_count: number;
}

export interface MedicalKnowledgeSearchResponse {
  query: string;
  category: string;
  specialty: string;
  total_results: number;
  items: MedicalKnowledgeItemDto[];
  routed_cache_node: string;
  cache_hit: boolean;
  cache_key: string;
  search_latency_ms: number;
}

export interface KnowledgeSourceDto {
  id: string;
  domain: string;
  name: string;
  seed_url: string;
  status: string;
  last_crawled_at: string;
  documents_count: number;
}


export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('aarogya_access_token');
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, { ...init, headers });
  if (response.status === 401 && !path.endsWith('/auth/login') && !path.endsWith('/auth/register')) {
    window.dispatchEvent(new CustomEvent('aarogya:unauthorized', { detail: { token } }));
  }
  const raw = await response.text();
  let data: any = null;
  if (raw) { try { data = JSON.parse(raw); } catch { data = raw; } }
  if (!response.ok) throw new ApiError(data?.message || data?.error || `Request failed (${response.status})`, response.status);
  return data as T;
}

export const api = {
  // Auth
  login: (email: string, password: string) => apiRequest<any>('/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (payload: unknown) => apiRequest<any>('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => apiRequest<any>('/api/v1/auth/me'),
  logout: () => apiRequest<any>('/api/v1/auth/logout', { method: 'POST' }),
  createStaff: (payload: unknown) => apiRequest<any>('/api/v1/auth/staff', { method: 'POST', body: JSON.stringify(payload) }),

  // Doctors & Department
  doctors: (deptId?: string, search?: string, onCall?: boolean) =>
    apiRequest<{ items: any[]; total: number }>(
      `/api/v1/doctors?limit=50${deptId ? `&department_id=${encodeURIComponent(deptId)}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}${onCall !== undefined ? `&on_call=${onCall}` : ''}`
    ),
  onCallDoctors: () => apiRequest<{ items: any[]; total: number }>('/api/v1/doctors?on_call=true&limit=50'),
  toggleDoctorOnCall: (id: string, isOnCall: boolean) =>
    apiRequest<any>(`/api/v1/doctors/${encodeURIComponent(id)}/oncall`, {
      method: 'PATCH',
      body: JSON.stringify({ is_on_call: isOnCall }),
    }),
  doctor: (id: string) => apiRequest<any>(`/api/v1/doctors/${encodeURIComponent(id)}`),
  slots: (id: string, date?: string) => apiRequest<any[]>(`/api/v1/doctors/${encodeURIComponent(id)}/slots${date ? `?date=${encodeURIComponent(date)}` : ''}`),
  departments: () => apiRequest<any[]>('/api/v1/departments'),
  specializations: () => apiRequest<any[]>('/api/v1/specializations'),

  // Appointments
  appointments: () => apiRequest<AppointmentDto[]>('/api/v1/appointments'),
  appointment: (id: string) => apiRequest<AppointmentDto>(`/api/v1/appointments/${encodeURIComponent(id)}`),
  bookAppointment: (slotId: string, reason: string, mode: string, appointmentDate: string, patientId?: string) =>
    apiRequest<AppointmentDto>('/api/v1/appointments', {
      method: 'POST',
      headers: { 'Idempotency-Key': crypto.randomUUID() },
      body: JSON.stringify({
        slot_id: slotId,
        reason_for_visit: reason,
        consultation_mode: mode,
        appointment_date: appointmentDate,
        ...(patientId ? { patient_id: patientId } : {})
      })
    }),
  cancelAppointment: (id: string) => apiRequest<AppointmentDto>(`/api/v1/appointments/${encodeURIComponent(id)}/cancel`, { method: 'POST' }),
  rescheduleAppointment: (id: string, slotId: string, reason?: string, newDate?: string) =>
    apiRequest<AppointmentDto>(`/api/v1/appointments/${encodeURIComponent(id)}/reschedule`, {
      method: 'POST',
      body: JSON.stringify({ new_slot_id: slotId, reason, new_appointment_date: newDate })
    }),
  updateAppointmentStatus: (id: string, status: string) =>
    apiRequest<AppointmentDto>(`/api/v1/appointments/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),
  recordTriage: (id: string, payload: { triage_level: string; vital_signs: string; triage_notes: string }) =>
    apiRequest<AppointmentDto>(`/api/v1/appointments/${encodeURIComponent(id)}/triage`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getAppointmentNotes: (id: string) => apiRequest<ClinicalNoteDto[]>(`/api/v1/appointments/${encodeURIComponent(id)}/notes`),
  addClinicalNote: (id: string, payload: { chief_complaint?: string; examination_findings?: string; diagnosis?: string; treatment_plan?: string; doctor_notes?: string; follow_up_date?: string }) =>
    apiRequest<ClinicalNoteDto>(`/api/v1/appointments/${encodeURIComponent(id)}/notes`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getAppointmentPrescriptions: (id: string) => apiRequest<PrescriptionDto[]>(`/api/v1/appointments/${encodeURIComponent(id)}/prescriptions`),
  createAppointmentPrescription: (id: string, payload: { items: PrescriptionItemDto[] }) =>
    apiRequest<PrescriptionDto>(`/api/v1/appointments/${encodeURIComponent(id)}/prescriptions`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Patients & EMR
  patients: (search?: string) => apiRequest<PatientDto[]>(`/api/v1/patients${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  registerPatient: (payload: CreatePatientDto) => apiRequest<PatientDto>('/api/v1/patients', { method: 'POST', body: JSON.stringify(payload) }),
  patient: (id: string) => apiRequest<PatientDto>(`/api/v1/patients/${encodeURIComponent(id)}`),
  patientRecords: (id: string) => apiRequest<ClinicalNoteDto[]>(`/api/v1/patients/${encodeURIComponent(id)}/records`),
  patientPrescriptions: (id: string) => apiRequest<PrescriptionDto[]>(`/api/v1/patients/${encodeURIComponent(id)}/prescriptions`),
  patientInvoices: (id: string) => apiRequest<InvoiceDto[]>(`/api/v1/patients/${encodeURIComponent(id)}/invoices`),
  patientLabOrders: (id: string) => apiRequest<any[]>(`/api/v1/patients/${encodeURIComponent(id)}/lab-orders`),
  records: (patientId?: string) => apiRequest<ClinicalNoteDto[]>(patientId ? `/api/v1/patients/${encodeURIComponent(patientId)}/records` : '/api/v1/patients/me'),
  prescriptions: (patientId: string) => apiRequest<PrescriptionDto[]>(`/api/v1/patients/${encodeURIComponent(patientId)}/prescriptions`),
  myRecords: () => apiRequest<ClinicalNoteDto[]>('/api/v1/patients/me'),
  myPrescriptions: () => apiRequest<PrescriptionDto[]>('/api/v1/patients/me/prescriptions'),
  myInvoices: () => apiRequest<InvoiceDto[]>('/api/v1/patients/me/invoices'),
  myLabOrders: () => apiRequest<any[]>('/api/v1/patients/me/lab-orders'),
  myProfile: () => apiRequest<PatientDto>('/api/v1/patients/me/profile'),
  updateMyProfile: (payload: Partial<CreatePatientDto>) => apiRequest<PatientDto>('/api/v1/patients/me/profile', { method: 'PATCH', body: JSON.stringify(payload) }),
  updatePatientProfile: (id: string, payload: Partial<CreatePatientDto>) => apiRequest<PatientDto>('/api/v1/patients/' + encodeURIComponent(id), { method: 'PATCH', body: JSON.stringify(payload) }),

  // Prescriptions & Pharmacy
  allPrescriptions: (status?: string) => apiRequest<PrescriptionDto[]>(`/api/v1/prescriptions${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  dispensePrescription: (id: string) =>
    apiRequest<PrescriptionDto>(`/api/v1/prescriptions/${encodeURIComponent(id)}/dispense`, {
      method: 'POST',
      headers: { 'Idempotency-Key': crypto.randomUUID() }
    }),
  updatePrescriptionStatus: (id: string, status: string) =>
    apiRequest<PrescriptionDto>(`/api/v1/prescriptions/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),
  medicines: () => apiRequest<MedicineDto[]>('/api/v1/medicines'),
  inventory: () => apiRequest<InventoryItemDto[]>('/api/v1/pharmacy/inventory'),
  adjustStock: (medicineId: string, adjustmentType: string, quantity: number, referenceId?: string) =>
    apiRequest<any>('/api/v1/pharmacy/stock-adjustments', {
      method: 'POST',
      headers: { 'Idempotency-Key': crypto.randomUUID() },
      body: JSON.stringify({ medicine_id: medicineId, adjustment_type: adjustmentType, quantity, reference_id: referenceId })
    }),

  // Billing
  invoices: () => apiRequest<InvoiceDto[]>('/api/v1/billing/invoices'),
  invoice: (id: string) => apiRequest<InvoiceDto>(`/api/v1/billing/invoices/${encodeURIComponent(id)}`),
  createInvoice: (payload: unknown) => apiRequest<InvoiceDto>('/api/v1/billing/invoices', { method: 'POST', body: JSON.stringify(payload) }),
  payInvoice: (invoiceId: string, amount: number, method: string, idempotencyKey?: string) => {
    const key = idempotencyKey || crypto.randomUUID();
    return apiRequest<any>('/api/v1/billing/payments/simulate', {
      method: 'POST',
      headers: { 'Idempotency-Key': key },
      body: JSON.stringify({ invoice_id: invoiceId, amount, payment_method: method, idempotency_key: key })
    });
  },

  // Lab Orders
  labOrders: (status?: string) => apiRequest<any[]>(`/api/v1/lab/orders${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  createLabOrder: (payload: unknown) => apiRequest<any>('/api/v1/lab/orders', { method: 'POST', body: JSON.stringify(payload) }),
  labOrder: (id: string) => apiRequest<any>(`/api/v1/lab/orders/${encodeURIComponent(id)}`),
  updateLabStatus: (id: string, payload: unknown) => apiRequest<any>(`/api/v1/lab/orders/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: JSON.stringify(payload) }),
  recordLabResult: (id: string, payload: unknown) => apiRequest<any>(`/api/v1/lab/orders/${encodeURIComponent(id)}/results`, { method: 'POST', body: JSON.stringify(payload) }),

  // Emergency Response & Command Center
  emergencyQueue: (status?: string) =>
    apiRequest<EmergencyDto[]>(
      `/api/v1/emergency/requests${status ? `?status=${encodeURIComponent(status)}` : ''}`
    ),
  doctorEmergencyQueue: (doctorId: string) =>
    apiRequest<EmergencyDto[]>(`/api/v1/emergency/doctor/${encodeURIComponent(doctorId)}`),
  emergencyDetail: (id: string) =>
    apiRequest<EmergencyIncidentDetailDto>(`/api/v1/emergency/requests/${encodeURIComponent(id)}`),
  createEmergency: (payload: EmergencyCreatePayload | any) =>
    apiRequest<EmergencyDto>('/api/v1/emergency/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateEmergency: (id: string, status: string) =>
    apiRequest<EmergencyDto>(`/api/v1/emergency/requests/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  updateEmergencyStatus: (
    id: string,
    payload: { status: string; doctor_id?: string; doctor_notes?: string }
  ) =>
    apiRequest<EmergencyDto>(`/api/v1/emergency/requests/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  assignEmergencyCareTeam: (
    id: string,
    payload: { doctor_id?: string; doctor_name?: string; nurse_id?: string; nurse_name?: string; bay?: string }
  ) =>
    apiRequest<EmergencyIncidentDetailDto>(
      `/api/v1/emergency/requests/${encodeURIComponent(id)}/assign`,
      { method: 'PATCH', body: JSON.stringify(payload) }
    ),
  recordEmergencyIntervention: (
    id: string,
    payload: { type: string; notes: string; vitals?: string }
  ) =>
    apiRequest<EmergencyIncidentDetailDto>(
      `/api/v1/emergency/requests/${encodeURIComponent(id)}/interventions`,
      { method: 'POST', body: JSON.stringify(payload) }
    ),
  reassessEmergencyAcuity: (
    id: string,
    payload: { triage_level: string; reason: string; vital_signs?: string }
  ) =>
    apiRequest<EmergencyIncidentDetailDto>(
      `/api/v1/emergency/requests/${encodeURIComponent(id)}/reassess`,
      { method: 'PATCH', body: JSON.stringify(payload) }
    ),
  concludeEmergencyDisposition: (
    id: string,
    payload: { disposition: string; destination_ward?: string; notes?: string }
  ) =>
    apiRequest<EmergencyIncidentDetailDto>(
      `/api/v1/emergency/requests/${encodeURIComponent(id)}/disposition`,
      { method: 'POST', body: JSON.stringify(payload) }
    ),
  activePatientEmergency: () =>
    apiRequest<EmergencyIncidentDetailDto | null>('/api/v1/emergency/patient/active'),
  emergencyStats: () => apiRequest<EmergencySurgeStatsDto>('/api/v1/emergency/stats'),

  // Labs & System Design
  autocomplete: (q: string, limit = 10) => apiRequest<any>(`/api/v1/autocomplete?q=${encodeURIComponent(q)}&limit=${limit}`),
  autocompleteStats: () => apiRequest<any>('/api/v1/autocomplete/stats'),
  rebuildAutocomplete: () => apiRequest<any>('/api/v1/autocomplete/rebuild', { method: 'POST' }),
  createShortLink: (payload: unknown) => apiRequest<any>('/api/v1/short-links', { method: 'POST', body: JSON.stringify(payload) }),
  resolveShortLink: (code: string) => apiRequest<any>(`/api/v1/short-links/${encodeURIComponent(code)}`),
  crawlerJob: (payload: unknown) => apiRequest<any>('/api/v1/crawler/jobs', { method: 'POST', body: JSON.stringify(payload) }),
  crawlerSearch: (q: string) => apiRequest<any>(`/api/v1/crawler/search?q=${encodeURIComponent(q)}`),
  crawlerStats: () => apiRequest<any>('/api/v1/crawler/stats'),
  hashNodes: () => apiRequest<any>('/api/v1/system-design/hashring/nodes'),
  addHashNode: (name: string) => apiRequest<any>('/api/v1/system-design/hashring/nodes', { method: 'POST', body: JSON.stringify({ name }) }),
  removeHashNode: (name: string) => apiRequest<any>(`/api/v1/system-design/hashring/nodes/${encodeURIComponent(name)}`, { method: 'DELETE' }),
  hashRoute: (key: string) => apiRequest<any>(`/api/v1/system-design/hashring/route?key=${encodeURIComponent(key)}`),
  telemetry: () => apiRequest<any>('/api/v1/system-design/telemetry'),
  rateLimitMetrics: () => apiRequest<any>('/api/v1/system-design/ratelimiter/metrics'),
  idBenchmark: (count: number) => apiRequest<any>('/api/v1/system-design/ids/benchmark', { method: 'POST', body: JSON.stringify({ sample_size: count }) }),


  
  // Medora AI Assistant
  aiStatus: () =>
    apiRequest<AiStatusResponse>('/api/v1/ai/status'),

  aiChat: (message: string) =>
    apiRequest<AiChatResponse>('/api/v1/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  // Medical Knowledge & Consistent Hash Cache Routing
  searchKnowledge: (q?: string, category?: string, specialty?: string) => {
    const params = new URLSearchParams();

    if (q) params.set('q', q);
    if (category && category !== 'ALL') {
      params.set('category', category);
    }
    if (specialty && specialty !== 'ALL') {
      params.set('specialty', specialty);
    }

    const qs = params.toString();

    return apiRequest<MedicalKnowledgeSearchResponse>(
      `/api/v1/knowledge/search${qs ? `?${qs}` : ''}`,
    );
  },

  knowledgeResource: (id: string) =>
    apiRequest<ResourcePreviewDto>(
      `/api/v1/knowledge/resources/${encodeURIComponent(id)}`,
    ),

  knowledgeSources: () =>
    apiRequest<KnowledgeSourceDto[]>('/api/v1/knowledge/sources'),

  addKnowledgeSource: (payload: {
    domain: string;
    name: string;
    seed_url: string;
  }) =>
    apiRequest<KnowledgeSourceDto>('/api/v1/knowledge/sources', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteKnowledgeSource: (id: string) =>
    apiRequest<{
      status: string;
      source_id: string;
      message: string;
    }>(`/api/v1/knowledge/sources/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  triggerKnowledgeCrawl: (payload: {
    seed_urls?: string[];
    max_depth?: number;
    max_pages?: number;
  }) =>
    apiRequest<any>('/api/v1/knowledge/crawl', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  knowledgeCacheStats: () =>
    apiRequest<{ hashring: any; crawler: any }>(
      '/api/v1/knowledge/cache/stats',
    ),
};

