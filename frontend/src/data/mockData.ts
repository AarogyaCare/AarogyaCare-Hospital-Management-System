import { 
  Department, 
  Doctor, 
  DoctorSlot, 
  Appointment, 
  ClinicalRecord, 
  Medicine, 
  Prescription, 
  Invoice, 
  EmergencyRequest, 
  SystemMetrics 
} from '../types';

export const DEPARTMENTS: Department[] = [
  {
    id: "dept-cardiology",
    code: "CARD",
    name: "Institute of Cardiac Sciences & Interventional Cardiology",
    category: "surgical",
    specialistsCount: 14,
    leadDoctor: "Dr. K. Ramanathan",
    description: "South India's recognized epicenter for complex structural coronary interventions, leadless pacemakers, and zero-delay emergency primary angioplasties.",
    icon: "cardiology",
    tags: ["24/7 Primary PCI", "Hybrid Bi-Plane Cath Lab", "Specialized Valve Clinic", "TAVI / TAVR"]
  },
  {
    id: "dept-neuro",
    code: "NEUR",
    name: "Comprehensive Neurosciences & Acute Stroke Unit",
    category: "medical",
    specialistsCount: 9,
    leadDoctor: "Dr. Rajiv Menon",
    description: "NABH-accredited comprehensive stroke protocol with emergency IV thrombolysis, mechanical thrombectomy, and 24/7 neuro-imaging.",
    icon: "neurology",
    tags: ["<30 Min Door-to-Needle", "Bi-Plane Neuro-Intervention", "Advanced Epilepsy Monitoring"]
  },
  {
    id: "dept-ortho",
    code: "ORTH",
    name: "Centre for Joint Reconstruction, Robotic Spine & Trauma",
    category: "surgical",
    specialistsCount: 11,
    leadDoctor: "Dr. Harish B.",
    description: "Sub-millimeter Mako® robotic joint arthroplasty, complex trauma reconstruction, and minimally invasive endoscopic spine surgeries.",
    icon: "orthopedics",
    tags: ["Mako Robotic Total Knee", "Sports Injury Clinic", "Complex Pelvic Trauma"]
  },
  {
    id: "dept-women-child",
    code: "PEDI",
    name: "Women & Child Health (Maternity, NICU Level-III & Paediatrics)",
    category: "women-child",
    specialistsCount: 10,
    leadDoctor: "Dr. Ananya Iyer",
    description: "Dedicated high-risk fetal medicine, 24-bed Level-III neonatal intensive care, and gentle holistic family-centered birthing suites.",
    icon: "child_care",
    tags: ["Level-III Neonatal ICU", "Foetal Echo & Genetics", "Minimally Invasive Gynae"]
  },
  {
    id: "dept-gastro",
    code: "GAST",
    name: "Gastroenterology, Hepatology & GI Oncology",
    category: "medical",
    specialistsCount: 8,
    leadDoctor: "Dr. Deepa Thomas",
    description: "State-of-the-art therapeutic endoscopy, EUS, ERCP, liver transplantation clinic, and advanced inflammatory bowel disease management.",
    icon: "gastroenterology",
    tags: ["Therapeutic EUS & ERCP", "Liver ICU", "Third Space Endoscopy"]
  },
  {
    id: "dept-emergency",
    code: "EMER",
    name: "24/7 Emergency & Acute Trauma Resuscitation",
    category: "emergency",
    specialistsCount: 12,
    leadDoctor: "Dr. N. Soundararajan",
    description: "Level-1 emergency triage center with dedicated red-zone resuscitation bays, immediate trauma surgical backup, and mobile stroke units.",
    icon: "emergency",
    tags: ["Dedicated Red Bays", "Toxicology & Poison Center", "ACLS Mobile Ambulances"]
  }
];

export const DOCTORS: Doctor[] = [
  {
    id: "doc-ramanathan",
    userId: "user-doc-1",
    departmentId: "dept-cardiology",
    departmentName: "Cardiology",
    displayName: "Dr. K. Ramanathan",
    designation: "Director & Chief of Interventional Catheterization",
    qualifications: "MBBS, MD (Med), DM (Card, CMC Vellore), FRCP (Glasg), FACC (USA)",
    chamberRoom: "Room OPD-104, East Wing, Level 1",
    experienceYears: 26,
    rating: 4.96,
    reviewCount: 840,
    opdStatus: "ACCEPTING_PATIENTS",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBJcsF47LmiZsfIF70ubuxVT7tqFo_KbQD-z5oh2GnJntwUBk7KaSDldsofTezpIZnIzzwrRuDwK5dve6uYO_oNSON523szI7mi7HSpkNEM1Hl7m7I4TCnMIhpWdhiTNmGMsXMsc2kDA132YKItnLgX12d5s82_uXBWj46Lj65hqH19KaOsp0pekjc46Is9J3gUtOjONihf0fCTD1Fs1XAy7CL39ZIEy8WOQI3oe4tAd9e63yI2JpB4",
    languages: ["English", "Tamil (தமிழ்)", "Hindi"],
    averageWaitMins: 18,
    specializations: [
      "TAVI / TAVR", 
      "Complex Bifurcation Angioplasty", 
      "Left Main PCI", 
      "Rotational Atherectomy", 
      "Heart Failure & CRT Devices"
    ],
    nextSlotTime: "10:15 AM",
    nextSlotDate: "Today (Oct 24)"
  },
  {
    id: "doc-priya",
    userId: "user-doc-2",
    departmentId: "dept-cardiology",
    departmentName: "Cardiology",
    displayName: "Dr. Priya Sundaram",
    designation: "Senior Consultant Electrophysiologist & Non-Invasive Cardiology",
    qualifications: "MBBS, MD (Internal Med), DNB (Cardiology), FESC",
    chamberRoom: "Room OPD-106, East Wing, Level 1",
    experienceYears: 18,
    rating: 4.92,
    reviewCount: 620,
    opdStatus: "ACCEPTING_PATIENTS",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBPItdmFmDp0muhFoqG0jMwlIVpUcZv-4FPXwdeMMrsCRJGGRG2UKsXBvi1OP7Vds89_0vuXE8ESEjOa42qWxtuap6hfvZM6Br4iiwxoYGmnvtaF7RdBWONeMF2FAGukeVY3K2cgOCvmllX9pAC-nj_4Z7Fe_uRLNMwmKGzC2qTsRd9KFp5WsIX3WBdGgryakz0O89oRw074mwn_-_fI_XCaL0EaeZ8XUEVfXGEPeuM5u0UW90ctbOo",
    languages: ["English", "Tamil (தமிழ்)"],
    averageWaitMins: 15,
    specializations: [
      "Arrhythmia Evaluation", 
      "3D Cardiac Mapping", 
      "Radiofrequency Ablation", 
      "Pacemaker Implantation"
    ],
    nextSlotTime: "11:30 AM",
    nextSlotDate: "Today (Oct 24)"
  },
  {
    id: "doc-srinivasan",
    userId: "user-doc-3",
    departmentId: "dept-cardiology",
    departmentName: "Cardiology",
    displayName: "Dr. M. S. Srinivasan",
    designation: "Consultant Cardiologist & Heart Failure Specialist",
    qualifications: "MBBS, MD, DM (Cardiology, AIIMS)",
    chamberRoom: "Room OPD-108, East Wing, Level 1",
    experienceYears: 14,
    rating: 4.88,
    reviewCount: 410,
    opdStatus: "ACCEPTING_PATIENTS",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuArkuxQQyDErnnGKTTL7Zg45VxMRRbuC6q2PJEUmv09-u_WLMIE41kuBitSvv1qtjXfA4l6abUMQDLysvS-QeDwZrDcXuYf-md6FO4-tWxhH4D1f8-BHlnfQ3kjpTUYTvaCWS7bU79cQ1NH4vVRRh1Ltat5MjGwl64WCPSI1fssZ5fIe6CuZ5z_fjsWQXMDvanbuPFsSQ1V_O03wvzJ9e47i-lZx7h8LiS5USLwX_-asJ5aRpx-rw-e",
    languages: ["English", "Tamil", "Telugu"],
    averageWaitMins: 20,
    specializations: ["Preventive Cardiology", "Advanced Heart Failure", "Cardiomyopathy Clinic"],
    nextSlotTime: "02:00 PM",
    nextSlotDate: "Today (Oct 24)"
  },
  {
    id: "doc-rajiv",
    userId: "user-doc-4",
    departmentId: "dept-neuro",
    departmentName: "Neurology",
    displayName: "Dr. Rajiv Menon",
    designation: "Head of Stroke Services & Interventional Neurologist",
    qualifications: "MBBS, MD (Medicine), DM (Neurology, NIMHANS), FINR",
    chamberRoom: "Room OPD-202, North Wing, Level 2",
    experienceYears: 21,
    rating: 4.95,
    reviewCount: 780,
    opdStatus: "ACCEPTING_PATIENTS",
    avatarUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400",
    languages: ["English", "Tamil", "Malayalam"],
    averageWaitMins: 12,
    specializations: ["Acute Ischemic Stroke", "Mechanical Thrombectomy", "Aneurysm Coiling", "Epilepsy"],
    nextSlotTime: "10:45 AM",
    nextSlotDate: "Today (Oct 24)"
  },
  {
    id: "doc-harish",
    userId: "user-doc-5",
    departmentId: "dept-ortho",
    departmentName: "Orthopaedics",
    displayName: "Dr. Harish B.",
    designation: "Chief Robotic Joint Replacement Surgeon",
    qualifications: "MBBS, MS (Ortho), MCh (Ortho, UK), FACS",
    chamberRoom: "Room OPD-305, West Wing, Level 3",
    experienceYears: 23,
    rating: 4.93,
    reviewCount: 950,
    opdStatus: "ACCEPTING_PATIENTS",
    avatarUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400",
    languages: ["English", "Tamil", "Kannada"],
    averageWaitMins: 15,
    specializations: ["Robotic Knee Replacement", "Hip Resurfacing", "Complex Revisions", "Arthroscopy"],
    nextSlotTime: "03:15 PM",
    nextSlotDate: "Today (Oct 24)"
  },
  {
    id: "doc-ananya",
    userId: "user-doc-6",
    departmentId: "dept-women-child",
    departmentName: "Paediatrics",
    displayName: "Dr. Ananya Iyer",
    designation: "Director of Neonatology & Paediatric Intensive Care",
    qualifications: "MBBS, DCH, DNB (Paed), Fellowship in Neonatology (Australia)",
    chamberRoom: "Room OPD-401, South Wing, Level 4",
    experienceYears: 17,
    rating: 4.97,
    reviewCount: 680,
    opdStatus: "ACCEPTING_PATIENTS",
    avatarUrl: "https://images.unsplash.com/photo-1594824813511-53e34b7f940d?auto=format&fit=crop&q=80&w=400",
    languages: ["English", "Tamil", "Hindi"],
    averageWaitMins: 10,
    specializations: ["Extreme Preterm Care", "Developmental Paediatrics", "Paediatric Critical Care"],
    nextSlotTime: "11:00 AM",
    nextSlotDate: "Today (Oct 24)"
  }
];

export const SLOTS_DATA: Record<string, DoctorSlot[]> = {
  "doc-ramanathan": [
    { id: "slot-r1", doctorId: "doc-ramanathan", startAt: "2026-10-24T10:15:00+05:30", endAt: "2026-10-24T10:30:00+05:30", timeDisplay: "10:15 AM", period: "Morning", status: "AVAILABLE", consultationMode: "IN_PERSON" },
    { id: "slot-r2", doctorId: "doc-ramanathan", startAt: "2026-10-24T10:30:00+05:30", endAt: "2026-10-24T10:45:00+05:30", timeDisplay: "10:30 AM", period: "Morning", status: "AVAILABLE", consultationMode: "IN_PERSON" },
    { id: "slot-r3", doctorId: "doc-ramanathan", startAt: "2026-10-24T10:45:00+05:30", endAt: "2026-10-24T11:00:00+05:30", timeDisplay: "10:45 AM", period: "Morning", status: "AVAILABLE", consultationMode: "TELE_CONSULT" },
    { id: "slot-r4", doctorId: "doc-ramanathan", startAt: "2026-10-24T11:00:00+05:30", endAt: "2026-10-24T11:15:00+05:30", timeDisplay: "11:00 AM", period: "Morning", status: "AVAILABLE", consultationMode: "IN_PERSON" },
    { id: "slot-r5", doctorId: "doc-ramanathan", startAt: "2026-10-24T14:30:00+05:30", endAt: "2026-10-24T14:45:00+05:30", timeDisplay: "02:30 PM", period: "Afternoon", status: "AVAILABLE", consultationMode: "IN_PERSON" },
    { id: "slot-r6", doctorId: "doc-ramanathan", startAt: "2026-10-24T15:00:00+05:30", endAt: "2026-10-24T15:15:00+05:30", timeDisplay: "03:00 PM", period: "Afternoon", status: "AVAILABLE", consultationMode: "TELE_CONSULT" },
    { id: "slot-r7", doctorId: "doc-ramanathan", startAt: "2026-10-24T17:00:00+05:30", endAt: "2026-10-24T17:15:00+05:30", timeDisplay: "05:00 PM", period: "Evening", status: "AVAILABLE", consultationMode: "IN_PERSON" }
  ],
  "doc-priya": [
    { id: "slot-p1", doctorId: "doc-priya", startAt: "2026-10-24T11:30:00+05:30", endAt: "2026-10-24T11:45:00+05:30", timeDisplay: "11:30 AM", period: "Morning", status: "AVAILABLE", consultationMode: "IN_PERSON" },
    { id: "slot-p2", doctorId: "doc-priya", startAt: "2026-10-24T11:45:00+05:30", endAt: "2026-10-24T12:00:00+05:30", timeDisplay: "11:45 AM", period: "Morning", status: "AVAILABLE", consultationMode: "TELE_CONSULT" },
    { id: "slot-p3", doctorId: "doc-priya", startAt: "2026-10-24T15:30:00+05:30", endAt: "2026-10-24T15:45:00+05:30", timeDisplay: "03:30 PM", period: "Afternoon", status: "AVAILABLE", consultationMode: "IN_PERSON" }
  ]
};

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: "apt-10492",
    appointmentNumber: "AC-APT-2026-10492",
    patientId: "pat-rajendran",
    patientName: "S. Rajendran",
    patientUhid: "AC-2024-9104",
    doctorId: "doc-ramanathan",
    doctorName: "Dr. K. Ramanathan",
    doctorChamber: "Room OPD-104, East Wing",
    departmentName: "Cardiology",
    slotId: "slot-r1",
    slotTime: "10:15 AM",
    slotDate: "Today (Oct 24)",
    consultationMode: "IN_PERSON",
    status: "CONFIRMED",
    shortLinkCode: "c9f2k1",
    reasonForVisit: "Persistent chest heaviness and post-angioplasty follow-up",
    createdAt: "2026-10-24T09:42:00+05:30"
  },
  {
    id: "apt-10490",
    appointmentNumber: "AC-APT-2026-10490",
    patientId: "pat-kavitha",
    patientName: "Kavitha Narayanan",
    patientUhid: "AC-2024-8842",
    doctorId: "doc-priya",
    doctorName: "Dr. Priya Sundaram",
    doctorChamber: "Room OPD-106, East Wing",
    departmentName: "Cardiology",
    slotId: "slot-p1",
    slotTime: "11:30 AM",
    slotDate: "Today (Oct 24)",
    consultationMode: "IN_PERSON",
    status: "IN_CONSULTATION",
    shortLinkCode: "p8v3m2",
    reasonForVisit: "Palpitations and Holter monitor review",
    createdAt: "2026-10-24T08:30:00+05:30"
  }
];

export const MEDICINES: Medicine[] = [
  {
    id: "med-1",
    catalogueCode: "MRP-8841",
    name: "Meropenem Inj 1g",
    genericName: "Meropenem Trihydrate",
    dosageForm: "Vial (IV Infusion)",
    unitPrice: 1250.00,
    stockQuantity: 12,
    reorderThreshold: 20,
    isLowStock: true
  },
  {
    id: "med-2",
    catalogueCode: "COL-9012",
    name: "Colistin 2 M.I.U",
    genericName: "Colistimethate Sodium",
    dosageForm: "Vial (IV Infusion)",
    unitPrice: 1840.00,
    stockQuantity: 6,
    reorderThreshold: 15,
    isLowStock: true
  },
  {
    id: "med-3",
    catalogueCode: "ENX-3310",
    name: "Enoxaparin 40mg PFS",
    genericName: "Enoxaparin Sodium Low Molecular Weight Heparin",
    dosageForm: "Prefilled Syringe",
    unitPrice: 480.00,
    stockQuantity: 240,
    reorderThreshold: 50,
    isLowStock: false
  },
  {
    id: "med-4",
    catalogueCode: "MET-500",
    name: "Metformin PR 500mg",
    genericName: "Metformin Hydrochloride Prolonged Release",
    dosageForm: "Tablet",
    unitPrice: 4.50,
    stockQuantity: 1200,
    reorderThreshold: 200,
    isLowStock: false
  },
  {
    id: "med-5",
    catalogueCode: "ATV-20",
    name: "Atorvastatin 20mg",
    genericName: "Atorvastatin Calcium",
    dosageForm: "Tablet",
    unitPrice: 12.00,
    stockQuantity: 850,
    reorderThreshold: 150,
    isLowStock: false
  }
];

export const CLINICAL_RECORDS: ClinicalRecord[] = [
  {
    id: "rec-1",
    patientId: "pat-rajendran",
    patientUhid: "AC-2024-9104",
    authorDoctor: "Dr. K. Ramanathan",
    recordType: "OPD_NOTE",
    title: "Cardiology Review & ECG Interpretation",
    summary: "Patient evaluated for recurrent mild exertion chest tightness. Baseline 12-lead ECG demonstrates sinus rhythm at 72 bpm, no fresh ST-T changes. Coronary angiography advised if symptoms persist on dual antiplatelet therapy.",
    vitals: {
      bp: "128/82 mmHg",
      pulse: "74 bpm",
      spo2: "99%",
      temp: "98.4 F",
      hba1c: "7.1%"
    },
    date: "2026-10-24"
  },
  {
    id: "rec-2",
    patientId: "pat-rajendran",
    patientUhid: "AC-2024-9104",
    authorDoctor: "Dr. M. S. Srinivasan",
    recordType: "LAB_RESULT",
    title: "Complete Lipid Profile & Serum Creatinine",
    summary: "Total Cholesterol: 168 mg/dL, LDL: 84 mg/dL, Triglycerides: 142 mg/dL. Serum Creatinine: 1.02 mg/dL, eGFR: 88 mL/min/1.73m2. Renal function stable.",
    date: "2026-10-18"
  }
];

export const PRESCRIPTIONS: Prescription[] = [
  {
    id: "rx-9810",
    patientId: "pat-rajendran",
    patientName: "S. Rajendran",
    patientUhid: "AC-2024-9104",
    doctorName: "Dr. K. Ramanathan",
    diagnosis: "Coronary Artery Disease (Post-PTCA status), Hypertension, Dyslipidemia",
    status: "PENDING",
    items: [
      { medicineName: "Atorvastatin 20mg", dosage: "20mg", frequency: "0-0-1 (Night)", duration: "30 Days", quantity: 30 },
      { medicineName: "Metoprolol Succinate ER 25mg", dosage: "25mg", frequency: "1-0-0 (Morning)", duration: "30 Days", quantity: 30 },
      { medicineName: "Ecosprin 75mg", dosage: "75mg", frequency: "0-1-0 (After Lunch)", duration: "30 Days", quantity: 30 }
    ],
    date: "2026-10-24"
  }
];

export const INVOICES: Invoice[] = [
  {
    id: "inv-2024-8841",
    invoiceNumber: "INV-AC-2024-8841",
    patientId: "pat-rajendran",
    patientName: "S. Rajendran",
    patientUhid: "AC-2024-9104",
    appointmentId: "apt-10492",
    subtotal: 1200.00,
    tax: 60.00,
    totalAmount: 1260.00,
    status: "PAID",
    items: [
      { description: "Senior Consultant OPD Consultation (Dr. K. Ramanathan)", unitPrice: 1000.00, quantity: 1, amount: 1000.00 },
      { description: "12-Lead Diagnostic Electrocardiogram (ECG)", unitPrice: 200.00, quantity: 1, amount: 200.00 }
    ],
    date: "2026-10-24"
  }
];

export const EMERGENCY_QUEUE: EmergencyRequest[] = [
  {
    id: "em-091",
    requestNumber: "EM-091",
    patientName: "S. Rajendran",
    patientPhone: "+91 98401 22314",
    symptoms: "Severe acute substernal crushing chest pain radiating to left arm, diaphoresis",
    priority: "ESI-1_STAT",
    status: "RESUS_ASSIGNED",
    assignedRoom: "Resus Bay 02",
    assignedDoctor: "Dr. N. Soundararajan",
    waitTime: "2m",
    createdAt: "10:38 AM"
  },
  {
    id: "em-092",
    requestNumber: "EM-092",
    patientName: "Meenakshi Sundaram",
    patientPhone: "+91 94440 98112",
    symptoms: "Sudden onset dyspnea on minimal exertion, bilateral basal crepitations",
    priority: "ESI-2_EMERGENT",
    status: "TRIAGE_RECEIVED",
    assignedRoom: "Triage Bed 04",
    assignedDoctor: "Dr. M. S. Srinivasan",
    waitTime: "5m",
    createdAt: "10:35 AM"
  },
  {
    id: "em-093",
    requestNumber: "EM-093",
    patientName: "Arun Kumar Verma",
    patientPhone: "+91 97910 44321",
    symptoms: "Post-viral arthralgia, high spiking fever (102.4 F), dehydration",
    priority: "ESI-3_URGENT",
    status: "TRIAGE_RECEIVED",
    assignedRoom: "Acute Care Bay 07",
    assignedDoctor: "Dr. Harish B.",
    waitTime: "9m",
    createdAt: "10:31 AM"
  }
];

export const INITIAL_SYSTEM_METRICS: SystemMetrics = {
  uuidRatePerSec: 24500,
  rateLimiterAccepted: 14280,
  rateLimiterRejected: 14,
  rateLimiterRejectionRate: 0.098,
  cacheHitRatio: 88.4,
  cacheLookupLatencyMs: 3.2,
  consistentHashNodes: [
    { name: "Node-A (Redis 6379)", virtualNodes: 150, status: "ONLINE", keyCount: 4210 },
    { name: "Node-B (Redis 6380)", virtualNodes: 150, status: "ONLINE", keyCount: 4340 },
    { name: "Node-C (Redis 6381)", virtualNodes: 150, status: "ONLINE", keyCount: 4180 }
  ],
  trieLatencyMs: 2.8,
  trieIndexedTerms: 1840,
  shortLinksTotal: 1248,
  crawlerPagesFetched: 240
};
