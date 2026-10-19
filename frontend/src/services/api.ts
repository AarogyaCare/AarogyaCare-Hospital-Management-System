import { 
  DEPARTMENTS, 
  DOCTORS, 
  SLOTS_DATA, 
  INITIAL_APPOINTMENTS, 
  CLINICAL_RECORDS, 
  PRESCRIPTIONS, 
  INVOICES, 
  MEDICINES, 
  EMERGENCY_QUEUE,
  INITIAL_SYSTEM_METRICS
} from '../data/mockData';
import { 
  Doctor, 
  Department, 
  DoctorSlot, 
  Appointment, 
  ClinicalRecord, 
  Prescription, 
  Invoice, 
  Medicine, 
  EmergencyRequest, 
  SystemMetrics,
  UserRole
} from '../types';
import { getDepartmentIcon } from '../utils/iconMap';

/**
 * Aarogya Care Service Layer
 * 
 * Clean API boundary separating UI presentation from data fetching.
 * Connects to the FastAPI backend endpoints (/api/v1/...) with graceful
 * fallback to mock fixtures if the backend server is unreachable.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const SIMULATE_LATENCY_MS = 100;

const delay = (ms: number = SIMULATE_LATENCY_MS) => 
  new Promise(resolve => setTimeout(resolve, ms));

async function fetchFromBackend<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        ...options?.headers
      }
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const departmentService = {
  async getAll(): Promise<{ data: Department[]; isLiveDatabase: boolean }> {
    const backendData = await fetchFromBackend<any[]>('/api/v1/departments');
    if (backendData && Array.isArray(backendData) && backendData.length > 0) {
      const mapped: Department[] = backendData.map(d => ({
        id: d.id,
        code: d.code,
        name: d.name,
        category: (d.code === 'EMERGENCY' ? 'emergency' : d.code === 'PEDIA' ? 'women-child' : d.code === 'ORTHO' ? 'surgical' : 'medical') as any,
        specialistsCount: 8,
        leadDoctor: 'Clinical Lead Specialist',
        description: d.description || 'Specialized clinical excellence and tertiary diagnostics.',
        icon: getDepartmentIcon(d.icon, d.name, d.code),
        tags: [d.code, 'Consultation', 'Inpatient Care']
      }));
      return { data: mapped, isLiveDatabase: true };
    }
    await delay();
    return { data: [...DEPARTMENTS], isLiveDatabase: false };
  },

  async getById(id: string): Promise<Department | undefined> {
    const { data } = await this.getAll();
    return data.find(d => d.id === id || d.code.toLowerCase() === id.toLowerCase());
  }
};

export const doctorService = {
  async getAll(departmentId?: string): Promise<{ data: Doctor[]; isLiveDatabase: boolean }> {
    const endpoint = departmentId 
      ? `/api/v1/doctors?limit=50&department_id=${encodeURIComponent(departmentId)}`
      : '/api/v1/doctors?limit=50';
    
    const backendData = await fetchFromBackend<{ items: any[]; total: number }>(endpoint);
    if (backendData && Array.isArray(backendData.items) && backendData.items.length > 0) {
      const mapped: Doctor[] = backendData.items.map(d => {
        // Find existing mock image if matching by name, else clean medical portrait
        const existing = DOCTORS.find(doc => doc.displayName.toLowerCase().includes(d.full_name.toLowerCase()) || d.full_name.toLowerCase().includes(doc.displayName.toLowerCase()));
        return {
          id: d.id,
          userId: d.user_id,
          departmentId: d.department_id,
          departmentName: d.department_name,
          displayName: d.full_name,
          designation: d.qualification,
          qualifications: d.qualification,
          chamberRoom: d.room_number || 'Consultation Suite',
          experienceYears: d.experience_years,
          rating: d.rating,
          reviewCount: 142,
          opdStatus: 'ACCEPTING_PATIENTS' as const,
          avatarUrl: existing ? existing.avatarUrl : 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
          languages: ['English', 'Tamil'],
          averageWaitMins: 15,
          specializations: d.specializations.length > 0 ? d.specializations : ['General Consultation'],
          nextSlotTime: '10:15 AM',
          nextSlotDate: 'Today'
        };
      });
      return { data: mapped, isLiveDatabase: true };
    }
    await delay();
    return { data: [...DOCTORS], isLiveDatabase: false };
  },

  async search(query: string): Promise<{ data: Doctor[]; isLiveDatabase: boolean }> {
    const q = query.trim();
    if (!q) return this.getAll();

    const backendData = await fetchFromBackend<{ items: any[]; total: number }>(`/api/v1/doctors?search=${encodeURIComponent(q)}&limit=50`);
    if (backendData && Array.isArray(backendData.items)) {
      const mapped: Doctor[] = backendData.items.map(d => {
        const existing = DOCTORS.find(doc => doc.displayName.toLowerCase().includes(d.full_name.toLowerCase()));
        return {
          id: d.id,
          userId: d.user_id,
          departmentId: d.department_id,
          departmentName: d.department_name,
          displayName: d.full_name,
          designation: d.qualification,
          qualifications: d.qualification,
          chamberRoom: d.room_number || 'Consultation Suite',
          experienceYears: d.experience_years,
          rating: d.rating,
          reviewCount: 142,
          opdStatus: 'ACCEPTING_PATIENTS' as const,
          avatarUrl: existing ? existing.avatarUrl : 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
          languages: ['English', 'Tamil'],
          averageWaitMins: 15,
          specializations: d.specializations.length > 0 ? d.specializations : ['General Consultation'],
          nextSlotTime: '10:15 AM',
          nextSlotDate: 'Today'
        };
      });
      return { data: mapped, isLiveDatabase: true };
    }

    await delay(50);
    const lower = q.toLowerCase();
    const fallback = DOCTORS.filter(d => 
      d.displayName.toLowerCase().includes(lower) ||
      d.departmentName.toLowerCase().includes(lower) ||
      d.specializations.some(s => s.toLowerCase().includes(lower))
    );
    return { data: fallback, isLiveDatabase: false };
  },

  async getById(id: string): Promise<Doctor | undefined> {
    const backendData = await fetchFromBackend<any>(`/api/v1/doctors/${id}`);
    if (backendData && backendData.id) {
      const existing = DOCTORS.find(doc => doc.displayName.toLowerCase().includes(backendData.full_name.toLowerCase()));
      return {
        id: backendData.id,
        userId: backendData.user_id,
        departmentId: backendData.department_id,
        departmentName: backendData.department_name,
        displayName: backendData.full_name,
        designation: backendData.qualification,
        qualifications: backendData.qualification,
        chamberRoom: backendData.room_number || 'Consultation Suite',
        experienceYears: backendData.experience_years,
        rating: backendData.rating,
        reviewCount: 142,
        opdStatus: 'ACCEPTING_PATIENTS' as const,
        avatarUrl: existing ? existing.avatarUrl : 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
        languages: ['English', 'Tamil'],
        averageWaitMins: 15,
        specializations: backendData.specializations && backendData.specializations.length > 0 ? backendData.specializations : ['General Consultation'],
        nextSlotTime: '10:15 AM',
        nextSlotDate: 'Today'
      };
    }
    const { data } = await this.getAll();
    return data.find(d => d.id === id);
  },

  async getSlots(doctorId: string): Promise<DoctorSlot[]> {
    const backendData = await fetchFromBackend<any[]>(`/api/v1/doctors/${doctorId}/slots`);
    if (backendData && Array.isArray(backendData) && backendData.length > 0) {
      return backendData.map(s => {
        const startTime = new Date(s.start_time);
        const timeDisplay = isNaN(startTime.getTime()) ? '10:15 AM' : startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const hours = isNaN(startTime.getTime()) ? 10 : startTime.getHours();
        const period: 'Morning' | 'Afternoon' | 'Evening' = hours < 12 ? 'Morning' : hours < 17 ? 'Afternoon' : 'Evening';
        return {
          id: s.id,
          doctorId: s.doctor_id,
          startAt: s.start_time || new Date().toISOString(),
          endAt: s.end_time || new Date().toISOString(),
          timeDisplay: timeDisplay,
          period: period,
          consultationMode: s.consultation_mode || 'IN_PERSON',
          status: s.status,
          slotFee: 1000
        };
      });
    }
    await delay();
    return SLOTS_DATA[doctorId] || SLOTS_DATA['doc-ramanathan'] || [];
  }
};

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  phone?: string;
  patientProfile?: {
    id: string;
    uhid: string;
  };
  doctorProfile?: {
    id: string;
    registrationNumber: string;
  };
}

export const authService = {
  getToken(): string | null {
    return localStorage.getItem('aarogya_access_token');
  },

  setToken(token: string): void {
    localStorage.setItem('aarogya_access_token', token);
  },

  clearToken(): void {
    localStorage.removeItem('aarogya_access_token');
  },

  async login(email: string, password: string): Promise<{ success: boolean; token?: string; user?: UserProfile; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.message || 'Login failed' };
      }
      this.setToken(data.access_token);
      const user: UserProfile = {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role as UserRole,
        fullName: data.user.full_name,
        phone: data.user.phone,
        patientProfile: data.user.patient_profile,
        doctorProfile: data.user.doctor_profile
      };
      return { success: true, token: data.access_token, user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  async register(payload: { email: string; password: string; fullName: string; phone?: string }): Promise<{ success: boolean; token?: string; user?: UserProfile; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: payload.email,
          password: payload.password,
          full_name: payload.fullName,
          phone: payload.phone
        })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.message || 'Registration failed' };
      }
      this.setToken(data.access_token);
      const user: UserProfile = {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role as UserRole,
        fullName: data.user.full_name,
        phone: data.user.phone,
        patientProfile: data.user.patient_profile
      };
      return { success: true, token: data.access_token, user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  async me(): Promise<UserProfile | null> {
    const token = this.getToken();
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        this.clearToken();
        return null;
      }
      const data = await res.json();
      return {
        id: data.id,
        email: data.email,
        role: data.role as UserRole,
        fullName: data.full_name,
        phone: data.phone,
        patientProfile: data.patient_profile,
        doctorProfile: data.doctor_profile
      };
    } catch {
      return null;
    }
  },

  async getCurrentUser(): Promise<UserProfile | null> {
    return this.me();
  },

  async logout(): Promise<void> {
    const token = this.getToken();
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch {
        // ignore network error
      }
    }
    this.clearToken();
  }
};

export const pharmacyService = {
  async getMedicines(search?: string, lowStockOnly?: boolean): Promise<{ data: Medicine[]; isLiveDatabase: boolean }> {
    let url = '/api/v1/medicines?limit=50';
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (lowStockOnly) url += '&low_stock_only=true';

    const backendData = await fetchFromBackend<any>(url);
    const rawList = Array.isArray(backendData) ? backendData : (Array.isArray(backendData?.items) ? backendData.items : []);
    if (rawList.length > 0) {
      const mapped: Medicine[] = rawList.map((m: any) => ({
        id: m.id,
        catalogueCode: m.code,
        name: m.name,
        genericName: m.brand_name || m.generic_name || m.name,
        dosageForm: m.dosage_form,
        unitPrice: m.unit_price,
        stockQuantity: m.current_stock ?? m.stock_quantity ?? 0,
        reorderThreshold: m.minimum_threshold ?? m.reorder_threshold ?? 50,
        isLowStock: m.is_low_stock ?? ((m.current_stock ?? m.stock_quantity ?? 0) <= (m.minimum_threshold ?? m.reorder_threshold ?? 50))
      }));
      return { data: mapped, isLiveDatabase: true };
    }

    await delay();
    let result = [...MEDICINES];
    if (lowStockOnly) result = result.filter(m => m.isLowStock);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(m => m.name.toLowerCase().includes(q) || m.genericName.toLowerCase().includes(q));
    }
    return { data: result, isLiveDatabase: false };
  },

  async getInventory(search?: string, lowStockOnly?: boolean): Promise<{ items: Medicine[]; total: number }> {
    const token = authService.getToken();
    if (token) {
      try {
        let url = `${API_BASE_URL}/api/v1/pharmacy/inventory?limit=50`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (lowStockOnly) url += `&low_stock_only=true`;
        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const items = (data.items || []).map((m: any) => ({
            id: m.id,
            catalogueCode: m.code,
            name: m.name,
            genericName: m.generic_name || m.name,
            dosageForm: m.dosage_form,
            unitPrice: m.unit_price,
            stockQuantity: m.stock_quantity,
            reorderThreshold: m.reorder_threshold,
            isLowStock: m.is_low_stock
          }));
          return { items, total: data.total || items.length };
        }
      } catch {
        // fallback
      }
    }
    const { data } = await this.getMedicines(search, lowStockOnly);
    return { items: data, total: data.length };
  },

  async adjustStock(medicineId: string, quantity: number, movementType: string = 'MANUAL_CORRECTION', notes?: string): Promise<Medicine> {
    const token = authService.getToken();
    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/pharmacy/stock-adjustments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            medicine_id: medicineId,
            quantity,
            movement_type: movementType,
            notes: notes || 'Stock adjustment via Operations Hub'
          })
        });
        if (res.ok) {
          const m = await res.json();
          return {
            id: m.id,
            catalogueCode: m.code,
            name: m.name,
            genericName: m.generic_name || m.name,
            dosageForm: m.dosage_form,
            unitPrice: m.unit_price,
            stockQuantity: m.stock_quantity,
            reorderThreshold: m.reorder_threshold,
            isLowStock: m.is_low_stock
          };
        } else {
          const err = await res.json();
          throw new Error(err.message || 'Stock adjustment failed');
        }
      } catch (err: any) {
        if (err.message) throw err;
      }
    }
    await delay(150);
    const med = MEDICINES.find(m => m.id === medicineId);
    if (!med) throw new Error("Medicine not found");
    med.stockQuantity += quantity;
    med.isLowStock = med.stockQuantity <= med.reorderThreshold;
    return med;
  },

  async dispenseItem(medicineId: string, quantity: number = 1): Promise<{ success: boolean; newStock: number }> {
    const token = authService.getToken();
    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/pharmacy/stock-adjustments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            medicine_id: medicineId,
            quantity: -quantity,
            movement_type: 'DISPENSE',
            notes: 'Dispensed via Pharmacy Operations'
          })
        });
        if (res.ok) {
          const updated = await res.json();
          return { success: true, newStock: updated.stock_quantity };
        } else {
          const err = await res.json();
          throw new Error(err.message || 'Dispensing failed');
        }
      } catch (err: any) {
        if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
          throw err;
        }
      }
    }
    await delay(200);
    const med = MEDICINES.find(m => m.id === medicineId);
    if (!med) throw new Error("Medicine not found");
    if (med.stockQuantity < quantity) throw new Error("Insufficient stock in inventory");
    med.stockQuantity -= quantity;
    med.isLowStock = med.stockQuantity < med.reorderThreshold;
    return { success: true, newStock: med.stockQuantity };
  }
};

export const appointmentService = {
  async getAll(): Promise<Appointment[]> {
    const token = authService.getToken();
    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/appointments`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const raw = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : []);
          if (raw.length > 0) {
            return raw.map((item: any) => {
              const timeVal = item.slot_start || item.slot_time;
              const dateObj = timeVal ? new Date(timeVal) : null;
              return {
                id: item.id,
                appointmentNumber: item.appointment_number || `AC-APT-${item.id?.substring(0, 5)}`,
                patientId: item.patient_id,
                patientName: item.patient_name || 'Patient',
                patientUhid: item.patient_uhid || 'AC-2024-9104',
                doctorId: item.doctor_id,
                doctorName: item.doctor_name || 'Doctor In-Charge',
                doctorChamber: item.doctor_chamber || 'Consultation Suite 04',
                departmentName: item.department_name || 'Clinical Care',
                slotId: item.slot_id,
                slotTime: (dateObj && !isNaN(dateObj.getTime())) ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:15 AM',
                slotDate: (dateObj && !isNaN(dateObj.getTime())) ? dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Today',
                consultationMode: item.consultation_mode || 'IN_PERSON',
                status: item.status || 'CONFIRMED',
                shortLinkCode: 'c9f2k1',
                reasonForVisit: item.reason_for_visit || 'Consultation',
                createdAt: item.created_at || new Date().toISOString()
              };
            });
          }
        }
      } catch {
        // fallback
      }
    }
    await delay();
    return [...INITIAL_APPOINTMENTS];
  },
  async getById(id: string): Promise<Appointment | undefined> {
    const token = authService.getToken();
    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/appointments/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const item = await res.json();
          return {
            id: item.id,
            appointmentNumber: item.appointment_number,
            patientId: item.patient_id,
            patientName: item.patient_name || 'Patient',
            patientUhid: item.patient_uhid || 'AC-2024-XXXX',
            doctorId: item.doctor_id,
            doctorName: item.doctor_name,
            doctorChamber: item.doctor_chamber || 'Consultation Suite',
            departmentName: item.department_name || 'Clinical Care',
            slotId: item.slot_id,
            slotTime: item.slot_time ? new Date(item.slot_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:15 AM',
            slotDate: item.slot_time ? new Date(item.slot_time).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Today',
            consultationMode: item.consultation_mode,
            status: item.status,
            shortLinkCode: 'c9f2k1',
            reasonForVisit: item.reason_for_visit,
            createdAt: item.created_at
          };
        }
      } catch {
        // fallback
      }
    }
    await delay();
    return INITIAL_APPOINTMENTS.find(a => a.id === id || a.appointmentNumber === id);
  },
  async bookSlot(params: {
    doctorId: string;
    slotId: string;
    patientUhid: string;
    patientName: string;
    consultationMode: 'IN_PERSON' | 'TELE_CONSULT';
    reasonForVisit: string;
    idempotencyKey?: string;
  }): Promise<Appointment> {
    const token = authService.getToken();
    if (token) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        };
        if (params.idempotencyKey) {
          headers['Idempotency-Key'] = params.idempotencyKey;
        }

        const res = await fetch(`${API_BASE_URL}/api/v1/appointments`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            slot_id: params.slotId,
            reason_for_visit: params.reasonForVisit,
            consultation_mode: params.consultationMode
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || `Booking failed with status ${res.status}`);
        }

        return {
          id: data.id,
          appointmentNumber: data.appointment_number,
          patientId: data.patient_id,
          patientName: data.patient_name || params.patientName,
          patientUhid: params.patientUhid,
          doctorId: data.doctor_id,
          doctorName: data.doctor_name,
          doctorChamber: data.doctor_chamber || 'Consultation Suite',
          departmentName: data.department_name || 'Clinical Care',
          slotId: data.slot_id,
          slotTime: data.slot_time ? new Date(data.slot_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:15 AM',
          slotDate: data.slot_time ? new Date(data.slot_time).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Today',
          consultationMode: data.consultation_mode,
          status: data.status,
          shortLinkCode: 'c9f2k1',
          reasonForVisit: data.reason_for_visit,
          createdAt: data.created_at
        };
      } catch (err: any) {
        if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
          throw err;
        }
      }
    }

    await delay(350);
    const doctor = DOCTORS.find(d => d.id === params.doctorId) || DOCTORS[0];
    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      appointmentNumber: `AC-APT-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      patientId: 'pat-current',
      patientName: params.patientName,
      patientUhid: params.patientUhid,
      doctorId: doctor.id,
      doctorName: doctor.displayName,
      doctorChamber: doctor.chamberRoom,
      departmentName: doctor.departmentName,
      slotId: params.slotId,
      slotTime: '10:15 AM',
      slotDate: 'Today (Oct 24)',
      consultationMode: params.consultationMode,
      status: 'CONFIRMED',
      shortLinkCode: 'c9f2k1',
      reasonForVisit: params.reasonForVisit,
      createdAt: new Date().toISOString()
    };
    return newApt;
  },

  async cancel(appointmentId: string, reason: string): Promise<boolean> {
    const token = authService.getToken();
    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/appointments/${appointmentId}/cancel`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ cancellation_reason: reason })
        });
        return res.ok;
      } catch {
        return false;
      }
    }
    return true;
  },

  async reschedule(appointmentId: string, newSlotId: string, reason?: string): Promise<boolean> {
    const token = authService.getToken();
    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/appointments/${appointmentId}/reschedule`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ new_slot_id: newSlotId, reason })
        });
        return res.ok;
      } catch {
        return false;
      }
    }
    return true;
  }
};

export const recordsService = {
  async getClinicalRecords(patientIdOrUhid?: string): Promise<ClinicalRecord[]> {
    const token = authService.getToken();
    if (token) {
      try {
        // Try /api/v1/patients/me first or if UUID provided, /api/v1/patients/{id}/records
        const endpoint = (patientIdOrUhid && patientIdOrUhid.includes('-') && patientIdOrUhid.length > 20)
          ? `${API_BASE_URL}/api/v1/patients/${patientIdOrUhid}/records`
          : `${API_BASE_URL}/api/v1/patients/me`;
        
        const res = await fetch(endpoint, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // If response is profile with records, or paginated records
          const rawItems = Array.isArray(data.items) ? data.items : [];
          if (rawItems.length > 0) {
            return rawItems.map((r: any) => ({
              id: r.id,
              patientId: r.patient_id,
              patientUhid: patientIdOrUhid || 'AC-2024-9104',
              authorDoctor: r.doctor_name || 'Dr. Attending Physician',
              recordType: (r.record_type || 'OPD_NOTE') as any,
              title: r.title,
              summary: r.description,
              date: r.recorded_at ? new Date(r.recorded_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'
            }));
          }
        }
      } catch {
        // fallback
      }
    }
    await delay();
    return CLINICAL_RECORDS.filter(r => r.patientUhid === patientIdOrUhid || !patientIdOrUhid);
  },

  async createConsultationNote(appointmentId: string, note: { title: string; description: string; record_type?: string; is_confidential?: boolean }): Promise<any> {
    const token = authService.getToken();
    if (token) {
      const res = await fetch(`${API_BASE_URL}/api/v1/appointments/${appointmentId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: note.title,
          description: note.description,
          record_type: note.record_type || 'CLINICAL_NOTE',
          is_confidential: note.is_confidential || false
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create consultation note');
      }
      return await res.json();
    }
    await delay(200);
    return { success: true };
  },

  async getAppointmentNotes(appointmentId: string): Promise<any[]> {
    const token = authService.getToken();
    if (token) {
      const res = await fetch(`${API_BASE_URL}/api/v1/appointments/${appointmentId}/notes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        return await res.json();
      }
    }
    return [];
  },

  async getPrescriptions(patientIdOrUhid?: string): Promise<Prescription[]> {
    return prescriptionService.getPrescriptions(patientIdOrUhid);
  },

  async getInvoices(patientIdOrUhid?: string): Promise<Invoice[]> {
    return billingService.getInvoices(patientIdOrUhid);
  }
};

export const prescriptionService = {
  async getPrescriptions(patientIdOrUhid?: string): Promise<Prescription[]> {
    const token = authService.getToken();
    if (token && patientIdOrUhid && patientIdOrUhid.includes('-') && patientIdOrUhid.length > 20) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/patients/${patientIdOrUhid}/prescriptions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            return list.map((p: any) => ({
              id: p.prescription_number || p.id,
              patientId: p.patient_id,
              patientName: p.patient_name || 'Patient',
              patientUhid: patientIdOrUhid,
              doctorName: p.doctor_name || 'Attending Physician',
              diagnosis: p.diagnosis || 'Clinical Consultation',
              status: p.status,
              items: (p.items || []).map((it: any) => ({
                medicineName: it.medicine_name || 'Medicine',
                dosage: it.dosage,
                frequency: it.frequency,
                duration: `${it.duration_days} days`,
                quantity: it.quantity
              })),
              date: p.created_at ? new Date(p.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today'
            }));
          }
        }
      } catch {
        // fallback
      }
    }
    await delay();
    return PRESCRIPTIONS.filter(p => p.patientUhid === patientIdOrUhid || !patientIdOrUhid);
  },

  async createPrescription(appointmentId: string, payload: any): Promise<any> {
    const token = authService.getToken();
    if (token) {
      const res = await fetch(`${API_BASE_URL}/api/v1/appointments/${appointmentId}/prescriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Prescription creation failed');
      }
      return await res.json();
    }
    await delay(200);
    return { success: true };
  },

  async updateStatus(prescriptionId: string, status: string): Promise<any> {
    const token = authService.getToken();
    if (token) {
      const res = await fetch(`${API_BASE_URL}/api/v1/prescriptions/${prescriptionId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update prescription status');
      }
      return await res.json();
    }
    return { success: true, status };
  }
};

export const billingService = {
  async getInvoices(patientIdOrUhid?: string): Promise<Invoice[]> {
    const token = authService.getToken();
    if (token && patientIdOrUhid && patientIdOrUhid.includes('-') && patientIdOrUhid.length > 20) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/patients/${patientIdOrUhid}/invoices`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            return list.map((inv: any) => ({
              id: inv.id,
              invoiceNumber: inv.invoice_number,
              patientId: inv.patient_id,
              patientName: inv.patient_name || 'Patient',
              patientUhid: patientIdOrUhid,
              appointmentId: inv.appointment_id,
              subtotal: inv.total_amount,
              tax: inv.tax_amount,
              totalAmount: inv.net_amount,
              status: inv.status,
              items: (inv.items || []).map((it: any) => ({
                description: it.description,
                unitPrice: it.unit_price,
                quantity: it.quantity,
                amount: it.total_price
              })),
              date: inv.created_at ? new Date(inv.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today'
            }));
          }
        }
      } catch {
        // fallback
      }
    }
    await delay();
    return INVOICES.filter(i => i.patientUhid === patientIdOrUhid || !patientIdOrUhid);
  },

  async createInvoice(payload: any, idempotencyKey?: string): Promise<any> {
    const token = authService.getToken();
    if (token) {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      if (idempotencyKey) {
        headers['Idempotency-Key'] = idempotencyKey;
      }
      const res = await fetch(`${API_BASE_URL}/api/v1/billing/invoices`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Invoice creation failed');
      }
      return await res.json();
    }
    return { success: true };
  },

  async simulatePayment(invoiceId: string, paymentMethod: string = 'SIMULATED_UPI', idempotencyKey?: string): Promise<any> {
    const token = authService.getToken();
    if (token) {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      if (idempotencyKey) {
        headers['Idempotency-Key'] = idempotencyKey;
      }
      const res = await fetch(`${API_BASE_URL}/api/v1/billing/payments/simulate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          invoice_id: invoiceId,
          payment_method: paymentMethod
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Payment simulation failed');
      }
      return await res.json();
    }
    await delay(300);
    return { status: 'PAID', invoice_id: invoiceId };
  }
};

export const emergencyService = {
  async getQueue(statusFilter?: string): Promise<EmergencyRequest[]> {
    const token = authService.getToken();
    if (token) {
      try {
        const url = statusFilter 
          ? `${API_BASE_URL}/api/v1/emergency/requests?status=${encodeURIComponent(statusFilter)}`
          : `${API_BASE_URL}/api/v1/emergency/requests`;
        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            return list.map((e: any) => ({
              id: e.id,
              requestNumber: `EM-${(e.id || '').substring(0, 4).toUpperCase()}`,
              patientName: e.patient_name,
              patientPhone: e.contact_number || '+91 99999 00000',
              symptoms: e.chief_complaint,
              priority: (e.triage_level === 'RED' ? 'ESI-1_STAT' : e.triage_level === 'YELLOW' ? 'ESI-3_URGENT' : 'ESI-4_LESS_URGENT') as any,
              status: (e.status === 'INCOMING' ? 'TRIAGE_RECEIVED' : e.status) as any,
              assignedRoom: e.triage_level === 'RED' ? 'Resus Bay 01' : 'Triage Bay 02',
              assignedDoctor: 'Dr. Emergency Staff In-Charge',
              waitTime: '<2 mins',
              createdAt: e.created_at ? new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'
            }));
          }
        }
      } catch {
        // fallback
      }
    }
    await delay();
    return [...EMERGENCY_QUEUE];
  },

  async submitRequest(req: Partial<EmergencyRequest>): Promise<EmergencyRequest> {
    const token = authService.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const triageLevel = (req.priority === 'ESI-1_STAT' || req.priority === 'ESI-2_EMERGENT') ? 'RED' : (req.priority === 'ESI-3_URGENT' ? 'YELLOW' : 'GREEN');

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/emergency/requests`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          patient_name: req.patientName || 'Trauma Patient',
          contact_number: req.patientPhone || '+91 99999 00000',
          chief_complaint: req.symptoms || 'Acute clinical incident',
          triage_level: triageLevel,
          vital_signs: 'BP 120/80, Pulse 78'
        })
      });
      if (res.ok) {
        const data = await res.json();
        return {
          id: data.id,
          requestNumber: `EM-${data.id.substring(0, 4).toUpperCase()}`,
          patientName: data.patient_name,
          patientPhone: data.contact_number || '+91 99999 00000',
          symptoms: data.chief_complaint,
          priority: req.priority || 'ESI-1_STAT',
          status: 'TRIAGE_RECEIVED',
          assignedRoom: triageLevel === 'RED' ? 'Resus Bay 01' : 'Triage Bay 04',
          assignedDoctor: 'Dr. Emergency Duty In-Charge',
          waitTime: '<2 mins',
          createdAt: 'Just now'
        };
      }
    } catch {
      // fallback
    }

    await delay(250);
    const created: EmergencyRequest = {
      id: `em-${Date.now()}`,
      requestNumber: req.requestNumber || `EM-${Math.floor(100 + Math.random() * 900)}`,
      patientName: req.patientName || 'Trauma Patient',
      patientPhone: req.patientPhone || '+91 99999 00000',
      symptoms: req.symptoms || 'Acute clinical incident',
      priority: req.priority || 'ESI-1_STAT',
      status: 'TRIAGE_RECEIVED',
      assignedRoom: req.priority === 'ESI-1_STAT' ? 'Resus Bay 01' : 'Triage Bay 04',
      assignedDoctor: 'Dr. N. Soundararajan (Duty In-Charge)',
      waitTime: '<2 mins',
      createdAt: 'Just now'
    };
    EMERGENCY_QUEUE.unshift(created);
    return created;
  },

  async updateStatus(requestId: string, status: string, room?: string, doctor?: string): Promise<any> {
    const token = authService.getToken();
    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/emergency/requests/${requestId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status,
            assigned_room: room,
            assigned_doctor: doctor
          })
        });
        if (res.ok) {
          return await res.json();
        }
      } catch {
        // fallback
      }
    }
    return { success: true, status };
  }
};

export const operationsService = {
  async getSystemMetrics(): Promise<SystemMetrics> {
    await delay(80);
    return { ...INITIAL_SYSTEM_METRICS };
  }
};

export interface AutocompleteItem {
  id?: string;
  title: string;
  type: string;
  subtitle?: string;
  url?: string;
  score?: number;
}

export const autocompleteService = {
  async getSuggestions(query: string, category?: string, limit: number = 8): Promise<AutocompleteItem[]> {
    if (!query || !query.trim()) return [];
    try {
      let url = `${API_BASE_URL}/api/v1/autocomplete?q=${encodeURIComponent(query.trim())}&limit=${limit}`;
      if (category) url += `&category=${encodeURIComponent(category)}`;
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // fallback
    }
    return [];
  },
  async getStats(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/autocomplete/stats`);
      if (res.ok) return await res.json();
    } catch {}
    return { total_terms_indexed: 1840, avg_query_latency_ms: 2.8 };
  }
};

export const shortLinkService = {
  async create(payload: {
    resource_type: string;
    resource_id: string;
    destination_path: string;
    scope?: string;
    ttl_seconds?: number;
  }): Promise<any> {
    const token = authService.getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/api/v1/short-links`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to generate short link');
    return await res.json();
  },
  async resolve(code: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/short-links/${code}`);
      if (res.status === 410) {
        return { status: 'REVOKED' };
      }
      if (!res.ok) {
        return { status: 'NOT_FOUND' };
      }
      const data = await res.json();
      return { status: data.revoked ? 'REVOKED' : 'AUTHORIZED', ...data };
    } catch {
      return { status: code === 'revoked-test' ? 'REVOKED' : 'AUTHORIZED' };
    }
  },
  async revoke(code: string): Promise<any> {
    const token = authService.getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/api/v1/short-links/${code}/revoke`, {
      method: 'PATCH',
      headers
    });
    if (!res.ok) throw new Error('Failed to revoke short link');
    return await res.json();
  },
  async createShortLink(targetUrl: string): Promise<any> {
    return this.create({
      resource_type: 'REPORT',
      resource_id: 'rep-' + Date.now(),
      destination_path: targetUrl
    });
  },
  async resolveShortLink(code: string): Promise<any> {
    return this.resolve(code);
  }
};

export const crawlerService = {
  async submitJob(seedUrl: string): Promise<any> {
    const token = authService.getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/api/v1/crawler/jobs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ seed_url: seedUrl })
    });
    if (!res.ok) throw new Error('Failed to submit crawl job');
    return await res.json();
  },
  async search(query: string): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/crawler/search?q=${encodeURIComponent(query)}`);
      if (res.ok) return await res.json();
    } catch {}
    return [];
  },
  async getStats(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/crawler/stats`);
      if (res.ok) return await res.json();
    } catch {}
    return { ssrf_protection: 'ACTIVE' };
  }
};

export const systemDesignService = {
  async getTelemetry(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/system-design/telemetry`);
      if (res.ok) return await res.json();
    } catch {}
    return null;
  },

  async benchmarkIds(sampleSize: number = 20000): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/system-design/ids/benchmark?sample_size=${sampleSize}`, {
        method: 'POST'
      });
      if (res.ok) return await res.json();
    } catch {}
    return null;
  },

  async getRateLimiterMetrics(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/system-design/ratelimiter/metrics`);
      if (res.ok) return await res.json();
    } catch {}
    return null;
  },

  async getHashRingNodes(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/system-design/hashring/nodes`);
      if (res.ok) return await res.json();
    } catch {}
    return null;
  },

  async addHashRingNode(name: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/system-design/hashring/nodes?name=${encodeURIComponent(name)}`, {
        method: 'POST'
      });
      if (res.ok) return await res.json();
    } catch {}
    return null;
  },

  async removeHashRingNode(name: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/system-design/hashring/nodes/${encodeURIComponent(name)}`, {
        method: 'DELETE'
      });
      if (res.ok) return await res.json();
    } catch {}
    return null;
  },

  async routeHashRingKey(key: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/system-design/hashring/route?key=${encodeURIComponent(key)}`);
      if (res.ok) return await res.json();
    } catch {}
    return null;
  },

  async simulateHashRing(nodeToRemove: string = 'redis-cache-c', sampleKeyCount: number = 1000): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/system-design/hashring/simulate?nodeToRemove=${encodeURIComponent(nodeToRemove)}&sampleKeyCount=${sampleKeyCount}`, {
        method: 'POST'
      });
      if (res.ok) return await res.json();
    } catch {}
    return null;
  },

  async rebuildAutocomplete(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/autocomplete/rebuild`, { method: 'POST' });
      if (res.ok) return await res.json();
    } catch {}
    return null;
  },

  async routeHashKey(key: string): Promise<any> {
    return this.routeHashRingKey(key);
  },

  async simulateRebalance(node: string): Promise<any> {
    return this.simulateHashRing(node);
  }
};

