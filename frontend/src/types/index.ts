export type UserRole = 
  | 'patient' 
  | 'doctor' 
  | 'receptionist' 
  | 'nurse' 
  | 'pharmacist' 
  | 'billing_staff' 
  | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
  displayName: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  category: 'surgical' | 'medical' | 'women-child' | 'emergency' | 'diagnostic';
  specialistsCount: number;
  leadDoctor: string;
  description: string;
  icon: string;
  tags: string[];
}

export interface Doctor {
  id: string;
  userId: string;
  departmentId: string;
  departmentName: string;
  displayName: string;
  designation: string;
  qualifications: string;
  chamberRoom: string;
  experienceYears: number;
  rating: number;
  reviewCount: number;
  opdStatus: 'ACCEPTING_PATIENTS' | 'IN_SURGERY' | 'ON_CALL';
  avatarUrl: string;
  languages: string[];
  averageWaitMins: number;
  specializations: string[];
  nextSlotTime: string;
  nextSlotDate: string;
}

export interface DoctorSlot {
  id: string;
  doctorId: string;
  startAt: string;
  endAt: string;
  timeDisplay: string;
  period: 'Morning' | 'Afternoon' | 'Evening';
  status: 'AVAILABLE' | 'LOCKED' | 'BOOKED' | 'CANCELLED';
  consultationMode: 'IN_PERSON' | 'TELE_CONSULT';
}

export interface Appointment {
  id: string;
  appointmentNumber: string;
  patientId: string;
  patientName: string;
  patientUhid: string;
  doctorId: string;
  doctorName: string;
  doctorChamber: string;
  departmentName: string;
  slotId: string;
  slotTime: string;
  slotDate: string;
  consultationMode: 'IN_PERSON' | 'TELE_CONSULT';
  status: 'CONFIRMED' | 'CHECKED_IN' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED';
  shortLinkCode: string;
  reasonForVisit: string;
  createdAt: string;
}

export interface ClinicalRecord {
  id: string;
  patientId: string;
  patientUhid: string;
  authorDoctor: string;
  recordType: 'OPD_NOTE' | 'DISCHARGE_SUMMARY' | 'LAB_RESULT' | 'TRIAGE_VITALS';
  title: string;
  summary: string;
  vitals?: {
    bp: string;
    pulse: string;
    spo2: string;
    temp?: string;
    hba1c?: string;
  };
  date: string;
}

export interface Medicine {
  id: string;
  catalogueCode: string;
  name: string;
  genericName: string;
  dosageForm: string;
  unitPrice: number;
  stockQuantity: number;
  reorderThreshold: number;
  isLowStock: boolean;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  patientUhid: string;
  doctorName: string;
  diagnosis: string;
  status: 'PENDING' | 'PARTIALLY_DISPENSED' | 'DISPENSED';
  items: {
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
  }[];
  date: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  patientUhid: string;
  appointmentId?: string;
  subtotal: number;
  tax: number;
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  items: {
    description: string;
    unitPrice: number;
    quantity: number;
    amount: number;
  }[];
  date: string;
}

export interface EmergencyRequest {
  id: string;
  requestNumber: string;
  patientName: string;
  patientPhone: string;
  symptoms: string;
  priority: 'ESI-1_STAT' | 'ESI-2_EMERGENT' | 'ESI-3_URGENT' | 'ESI-4_LESS_URGENT';
  status: 'TRIAGE_RECEIVED' | 'RESUS_ASSIGNED' | 'BED_ALLOCATED' | 'DISCHARGED';
  assignedRoom: string;
  assignedDoctor: string;
  waitTime: string;
  createdAt: string;
}

export interface SystemMetrics {
  uuidRatePerSec: number;
  rateLimiterAccepted: number;
  rateLimiterRejected: number;
  rateLimiterRejectionRate: number;
  cacheHitRatio: number;
  cacheLookupLatencyMs: number;
  consistentHashNodes: {
    name: string;
    virtualNodes: number;
    status: 'ONLINE' | 'OFFLINE';
    keyCount: number;
  }[];
  trieLatencyMs: number;
  trieIndexedTerms: number;
  shortLinksTotal: number;
  crawlerPagesFetched: number;
}
