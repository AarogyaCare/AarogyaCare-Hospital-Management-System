export interface PatientRecord {
  id: string;
  uhid: string; // Universal Health ID e.g. AAR-2026-8812
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: string;
  phone: string;
  email: string;
  address: string;
  admissionStatus: 'Outpatient' | 'Inpatient (Ward)' | 'ICU Critical' | 'Discharged';
  bedNumber?: string;
  attendingDoctor: string;
  diagnosis: string;
  allergies: string[];
  vitals: {
    bloodPressure: string;
    heartRate: number;
    oxygenSaturation: number;
    temperature: number;
    respiratoryRate: number;
    lastChecked: string;
  };
  lastVisitDate: string;
}

export const mockPatients: PatientRecord[] = [
  {
    id: 'p-1',
    uhid: 'AAR-2026-9041',
    name: 'Ramesh Sundararajan',
    age: 58,
    gender: 'Male',
    bloodGroup: 'B+ Positive',
    phone: '+91 98401 23456',
    email: 'ramesh.sundar@example.com',
    address: 'No. 42 Anna Nagar West, Chennai 600040',
    admissionStatus: 'Inpatient (Ward)',
    bedNumber: 'Ward 402 - Bed B',
    attendingDoctor: 'Dr. V. Ramanathan',
    diagnosis: 'Post-PTCA Stent Follow-up & Grade II Essential Hypertension',
    allergies: ['Penicillin', 'Sulfa drugs'],
    vitals: {
      bloodPressure: '128/82 mmHg',
      heartRate: 74,
      oxygenSaturation: 98,
      temperature: 98.4,
      respiratoryRate: 16,
      lastChecked: '25 mins ago'
    },
    lastVisitDate: '16 Oct 2026'
  },
  {
    id: 'p-2',
    uhid: 'AAR-2026-8720',
    name: 'Kavitha Radhakrishnan',
    age: 44,
    gender: 'Female',
    bloodGroup: 'O+ Positive',
    phone: '+91 94440 98112',
    email: 'kavitha.radha@example.com',
    address: '15/3 Besant Nagar 2nd Avenue, Chennai 600090',
    admissionStatus: 'Outpatient',
    attendingDoctor: 'Dr. Meenakshi Sundaram',
    diagnosis: 'Intractable Migraine with Visual Aura & Cervical Radiculopathy',
    allergies: ['Aspirin'],
    vitals: {
      bloodPressure: '118/76 mmHg',
      heartRate: 68,
      oxygenSaturation: 99,
      temperature: 98.6,
      respiratoryRate: 14,
      lastChecked: '1 hour ago'
    },
    lastVisitDate: '17 Oct 2026'
  },
  {
    id: 'p-3',
    uhid: 'AAR-2026-7731',
    name: 'Subramanian Natarajan',
    age: 67,
    gender: 'Male',
    bloodGroup: 'A+ Positive',
    phone: '+91 98840 55123',
    email: 'subramanian.n@example.com',
    address: '7B Greenways Road, R.A. Puram, Chennai 600028',
    admissionStatus: 'ICU Critical',
    bedNumber: 'ICU-Bed 04',
    attendingDoctor: 'Dr. S. Jayakumar',
    diagnosis: 'Acute on Chronic Kidney Disease Stage 4 with Hyperkalemia',
    allergies: ['NSAIDs', 'Contrast Dye'],
    vitals: {
      bloodPressure: '142/90 mmHg',
      heartRate: 88,
      oxygenSaturation: 95,
      temperature: 99.1,
      respiratoryRate: 20,
      lastChecked: '10 mins ago'
    },
    lastVisitDate: '18 Oct 2026'
  },
  {
    id: 'p-4',
    uhid: 'AAR-2026-6619',
    name: 'Ananya Deshmukh',
    age: 9,
    gender: 'Female',
    bloodGroup: 'AB+ Positive',
    phone: '+91 97909 33211',
    email: 'deshmukh.family@example.com',
    address: 'Flat 3A, Harrington Court, Shenoy Nagar, Chennai 600030',
    admissionStatus: 'Outpatient',
    attendingDoctor: 'Dr. Shalini Venugopal',
    diagnosis: 'Acute Bronchial Asthma Exacerbation with Seasonal Allergic Rhinitis',
    allergies: ['Peanuts', 'Dust Mites'],
    vitals: {
      bloodPressure: '104/68 mmHg',
      heartRate: 92,
      oxygenSaturation: 97,
      temperature: 98.8,
      respiratoryRate: 22,
      lastChecked: '3 hours ago'
    },
    lastVisitDate: '15 Oct 2026'
  }
];

export interface AppointmentRecord {
  id: string;
  tokenNumber: string;
  patientName: string;
  patientUhid: string;
  doctorName: string;
  department: string;
  timeSlot: string;
  date: string;
  mode: 'In-Person OPD' | 'Video Teleconsult' | 'Emergency Priority';
  status: 'Waiting' | 'In Consultation' | 'Completed' | 'Cancelled';
  room: string;
  type: 'First Consultation' | 'Follow-up' | 'Report Review';
}

export const mockAppointments: AppointmentRecord[] = [
  {
    id: 'apt-101',
    tokenNumber: 'AAR-01',
    patientName: 'Ramesh Sundararajan',
    patientUhid: 'AAR-2026-9041',
    doctorName: 'Dr. V. Ramanathan',
    department: 'Cardiology',
    timeSlot: '09:30 AM',
    date: '18 Oct 2026',
    mode: 'In-Person OPD',
    status: 'In Consultation',
    room: 'Suite 204',
    type: 'Follow-up'
  },
  {
    id: 'apt-102',
    tokenNumber: 'AAR-02',
    patientName: 'Kavitha Radhakrishnan',
    patientUhid: 'AAR-2026-8720',
    doctorName: 'Dr. Meenakshi Sundaram',
    department: 'Neurology',
    timeSlot: '10:00 AM',
    date: '18 Oct 2026',
    mode: 'In-Person OPD',
    status: 'Waiting',
    room: 'Suite 310',
    type: 'First Consultation'
  },
  {
    id: 'apt-103',
    tokenNumber: 'AAR-03',
    patientName: 'Nalini Chandrasekhar',
    patientUhid: 'AAR-2026-5542',
    doctorName: 'Dr. K. S. Balaraman',
    department: 'Orthopedics',
    timeSlot: '10:30 AM',
    date: '18 Oct 2026',
    mode: 'In-Person OPD',
    status: 'Waiting',
    room: 'Suite 102',
    type: 'Report Review'
  },
  {
    id: 'apt-104',
    tokenNumber: 'AAR-04',
    patientName: 'Subramanian Natarajan',
    patientUhid: 'AAR-2026-7731',
    doctorName: 'Dr. S. Jayakumar',
    department: 'Nephrology',
    timeSlot: '11:15 AM',
    date: '18 Oct 2026',
    mode: 'Emergency Priority',
    status: 'In Consultation',
    room: 'ICU-Bed 04',
    type: 'Follow-up'
  },
  {
    id: 'apt-105',
    tokenNumber: 'AAR-05',
    patientName: 'Ananya Deshmukh',
    patientUhid: 'AAR-2026-6619',
    doctorName: 'Dr. Shalini Venugopal',
    department: 'Pediatrics',
    timeSlot: '11:45 AM',
    date: '18 Oct 2026',
    mode: 'Video Teleconsult',
    status: 'Waiting',
    room: 'Virtual Clinic 2',
    type: 'Follow-up'
  }
];

export interface PrescriptionItem {
  id: string;
  medicineName: string;
  strength: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  status: 'Dispensed' | 'Pending Pharmacy' | 'Out of Stock';
  patientName: string;
  prescribedBy: string;
  date: string;
}

export const mockPrescriptions: PrescriptionItem[] = [
  {
    id: 'rx-501',
    medicineName: 'Acorvas (Atorvastatin)',
    strength: '20 mg',
    dosage: '1 tablet',
    frequency: 'Once Daily at Bedtime (0-0-1)',
    duration: '30 Days',
    instructions: 'Take after dinner with water. Avoid grapefruit.',
    status: 'Dispensed',
    patientName: 'Ramesh Sundararajan',
    prescribedBy: 'Dr. V. Ramanathan',
    date: '16 Oct 2026'
  },
  {
    id: 'rx-502',
    medicineName: 'Telma-H (Telmisartan + HCTZ)',
    strength: '40/12.5 mg',
    dosage: '1 tablet',
    frequency: 'Once Daily Morning (1-0-0)',
    duration: '30 Days',
    instructions: 'Take after breakfast. Monitor BP weekly.',
    status: 'Dispensed',
    patientName: 'Ramesh Sundararajan',
    prescribedBy: 'Dr. V. Ramanathan',
    date: '16 Oct 2026'
  },
  {
    id: 'rx-503',
    medicineName: 'Topamac (Topiramate)',
    strength: '25 mg',
    dosage: '1 tablet',
    frequency: 'Twice Daily (1-0-1)',
    duration: '15 Days',
    instructions: 'Take with food. Stay well hydrated.',
    status: 'Pending Pharmacy',
    patientName: 'Kavitha Radhakrishnan',
    prescribedBy: 'Dr. Meenakshi Sundaram',
    date: '17 Oct 2026'
  },
  {
    id: 'rx-504',
    medicineName: 'Montair LC (Montelukast + Levocetirizine)',
    strength: '10/5 mg',
    dosage: '1 chewable tablet',
    frequency: 'Once at night (0-0-1)',
    duration: '14 Days',
    instructions: 'May cause mild drowsiness.',
    status: 'Pending Pharmacy',
    patientName: 'Ananya Deshmukh',
    prescribedBy: 'Dr. Shalini Venugopal',
    date: '18 Oct 2026'
  }
];

export interface BillInvoice {
  id: string;
  invoiceNo: string;
  patientName: string;
  uhid: string;
  date: string;
  department: string;
  services: { name: string; cost: number; qty: number }[];
  grossTotal: number;
  insuranceCovered: number;
  taxAmount: number;
  patientPayable: number;
  paymentStatus: 'Paid' | 'Pending Payment' | 'Claim Processing';
  paymentMode?: 'UPI / GPay' | 'HDFC Credit Card' | 'Star Health TPA' | 'Cash Desk';
}

export const mockBills: BillInvoice[] = [
  {
    id: 'bill-1',
    invoiceNo: 'INV-AAR-2026-10492',
    patientName: 'Ramesh Sundararajan',
    uhid: 'AAR-2026-9041',
    date: '16 Oct 2026',
    department: 'Cardiology',
    services: [
      { name: 'Senior Consultant Cardiology Evaluation', cost: 1200, qty: 1 },
      { name: '12-Lead Electrocardiogram (ECG)', cost: 450, qty: 1 },
      { name: '2D Echocardiogram with Doppler Study', cost: 2800, qty: 1 },
      { name: 'Lipid Profile Comprehensive & HbA1c Panel', cost: 1350, qty: 1 }
    ],
    grossTotal: 5800,
    insuranceCovered: 4500,
    taxAmount: 0,
    patientPayable: 1300,
    paymentStatus: 'Paid',
    paymentMode: 'UPI / GPay'
  },
  {
    id: 'bill-2',
    invoiceNo: 'INV-AAR-2026-10518',
    patientName: 'Kavitha Radhakrishnan',
    uhid: 'AAR-2026-8720',
    date: '17 Oct 2026',
    department: 'Neurology',
    services: [
      { name: 'Chief Neurosurgeon Consultation', cost: 1400, qty: 1 },
      { name: 'MRI Brain 3-Tesla High Resolution Plain & Contrast', cost: 8500, qty: 1 },
      { name: 'EEG Video Telemetry 2-Hour Study', cost: 3200, qty: 1 }
    ],
    grossTotal: 13100,
    insuranceCovered: 10000,
    taxAmount: 0,
    patientPayable: 3100,
    paymentStatus: 'Pending Payment'
  },
  {
    id: 'bill-3',
    invoiceNo: 'INV-AAR-2026-10530',
    patientName: 'Subramanian Natarajan',
    uhid: 'AAR-2026-7731',
    date: '18 Oct 2026',
    department: 'Nephrology & ICU',
    services: [
      { name: 'ICU Critical Care Day-1 Bed & Monitoring', cost: 9500, qty: 1 },
      { name: 'Emergency Hemodialysis High-Flux Filter Session', cost: 4200, qty: 1 },
      { name: 'Arterial Blood Gas (ABG) & Renal Profile Stat', cost: 2100, qty: 2 }
    ],
    grossTotal: 17900,
    insuranceCovered: 15000,
    taxAmount: 0,
    patientPayable: 2900,
    paymentStatus: 'Claim Processing',
    paymentMode: 'Star Health TPA'
  }
];

export interface InventoryItem {
  id: string;
  drugCode: string;
  name: string;
  category: 'Cardiovascular' | 'Neurology' | 'Antibiotics' | 'Emergency / Critical' | 'Orthopedic' | 'IV Fluids';
  currentStock: number;
  reorderLevel: number;
  unit: string;
  batchNumber: string;
  expiryDate: string;
  unitPrice: number;
  status: 'Adequate' | 'Low Stock' | 'Critical Shortage';
}

export const mockPharmacyInventory: InventoryItem[] = [
  {
    id: 'inv-01',
    drugCode: 'MED-CV-101',
    name: 'Atorvastatin 20mg Tablets',
    category: 'Cardiovascular',
    currentStock: 1420,
    reorderLevel: 500,
    unit: 'Tablets',
    batchNumber: 'ATV-2603',
    expiryDate: 'Dec 2027',
    unitPrice: 12.5,
    status: 'Adequate'
  },
  {
    id: 'inv-02',
    drugCode: 'MED-EM-088',
    name: 'Inj. Adrenaline 1mg/1ml (Ampoule)',
    category: 'Emergency / Critical',
    currentStock: 48,
    reorderLevel: 100,
    unit: 'Ampoules',
    batchNumber: 'ADR-8812',
    expiryDate: 'Nov 2026',
    unitPrice: 38.0,
    status: 'Low Stock'
  },
  {
    id: 'inv-03',
    drugCode: 'MED-NE-204',
    name: 'Levetiracetam 500mg IV Infusion',
    category: 'Neurology',
    currentStock: 18,
    reorderLevel: 60,
    unit: 'Vials',
    batchNumber: 'LEV-9011',
    expiryDate: 'Aug 2027',
    unitPrice: 285.0,
    status: 'Critical Shortage'
  },
  {
    id: 'inv-04',
    drugCode: 'MED-AB-405',
    name: 'Inj. Piperacillin + Tazobactam 4.5g',
    category: 'Antibiotics',
    currentStock: 340,
    reorderLevel: 150,
    unit: 'Vials',
    batchNumber: 'PTZ-3321',
    expiryDate: 'Mar 2028',
    unitPrice: 420.0,
    status: 'Adequate'
  },
  {
    id: 'inv-05',
    drugCode: 'MED-IV-110',
    name: 'Normal Saline 0.9% IV 500ml',
    category: 'IV Fluids',
    currentStock: 2800,
    reorderLevel: 800,
    unit: 'Bottles',
    batchNumber: 'NS-5509',
    expiryDate: 'Jan 2029',
    unitPrice: 42.0,
    status: 'Adequate'
  }
];
