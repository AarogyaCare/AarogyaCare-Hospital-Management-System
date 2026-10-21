export interface Specialty {
  id: string;
  name: string;
  shortDesc: string;
  fullDesc: string;
  headOfDept: string;
  iconName: string;
  doctorCount: number;
  bedCapacity: number;
  featured: boolean;
  commonConditions: string[];
}

export const specialtiesData: Specialty[] = [
  {
    id: 'cardiology',
    name: 'Cardiology & Cardiac Surgery',
    shortDesc: 'Advanced coronary interventions, electrophysiology, and comprehensive heart care.',
    fullDesc: 'The Aarogya Heart Centre at Medora provides 24/7 primary angioplasty, hybrid catheterization laboratories, complex bypass surgeries, and heart failure management with cutting-edge hemodynamic monitoring.',
    headOfDept: 'Dr. V. Ramanathan, MD, DM (Cardiology), FACC',
    iconName: 'HeartPulse',
    doctorCount: 8,
    bedCapacity: 64,
    featured: true,
    commonConditions: ['Coronary Artery Disease', 'Arrhythmia', 'Heart Failure', 'Hypertension', 'Valvular Heart Disease']
  },
  {
    id: 'neurology',
    name: 'Neurology & Neurosurgery',
    shortDesc: 'Comprehensive neurovascular intervention, epilepsy clinic, and minimally invasive spine surgery.',
    fullDesc: 'Equipped with biplane neuro-angiography, intraoperative neuromonitoring, and Chennai’s premier stroke thrombectomy unit operating under a strict 45-minute door-to-needle time standard.',
    headOfDept: 'Dr. Meenakshi Sundaram, MCh (Neurosurgery)',
    iconName: 'Brain',
    doctorCount: 6,
    bedCapacity: 48,
    featured: true,
    commonConditions: ['Acute Ischemic Stroke', 'Migraine & Headache Disorders', 'Epilepsy', 'Parkinsonism', 'Spine Herniation']
  },
  {
    id: 'orthopedics',
    name: 'Orthopedics & Joint Replacement',
    shortDesc: 'Robotic-assisted total knee & hip replacement, sports medicine, and trauma reconstruction.',
    fullDesc: 'Centre of excellence featuring Mako Robotic arm joint replacement, arthroscopic ligament repairs, and specialized pediatric orthopedic corrections led by international faculty.',
    headOfDept: 'Dr. K. S. Balaraman, MS (Ortho), MCh',
    iconName: 'Bone',
    doctorCount: 7,
    bedCapacity: 52,
    featured: true,
    commonConditions: ['Osteoarthritis', 'ACL/Meniscus Tears', 'Trauma Fractures', 'Spinal Stenosis', 'Rotator Cuff Injuries']
  },
  {
    id: 'oncology',
    name: 'Medical & Surgical Oncology',
    shortDesc: 'Precision genomic cancer therapies, stereotactic radiotherapy, and multidisciplinary tumor boards.',
    fullDesc: 'A comprehensive cancer institute integrating organ-specific surgical oncology, day-care chemotherapy suites, molecular diagnostics, and compassionate palliative support.',
    headOfDept: 'Dr. Preetha Balakrishnan, MD (Oncology), ESMO Fellow',
    iconName: 'Activity',
    doctorCount: 5,
    bedCapacity: 40,
    featured: true,
    commonConditions: ['Breast Cancer', 'Gastrointestinal Malignancies', 'Hematologic Cancers', 'Lung Cancer', 'Gynecologic Cancers']
  },
  {
    id: 'nephrology',
    name: 'Nephrology & Renal Transplant',
    shortDesc: 'Dialysis suites with ultra-pure endotoxin filtration, glomerulonephritis care, and kidney transplants.',
    fullDesc: 'High-volume renal transplant center with over 1,200 successful live and deceased donor transplants, 40-station hemodialysis unit, and peritoneal dialysis home-training center.',
    headOfDept: 'Dr. S. Jayakumar, DM (Nephrology), FRCP',
    iconName: 'ActivitySquare',
    doctorCount: 4,
    bedCapacity: 36,
    featured: false,
    commonConditions: ['Chronic Kidney Disease', 'Glomerulonephritis', 'Polycystic Kidney Disease', 'Renal Failure', 'Diabetic Nephropathy']
  },
  {
    id: 'gastroenterology',
    name: 'Gastroenterology & Hepatology',
    shortDesc: 'Diagnostic and therapeutic endoscopy, ERCP, endoscopic ultrasound, and fatty liver clinic.',
    fullDesc: 'State-of-the-art digestive disease center offering advanced lumen-apposing metal stents (LAMS), third-space endoscopy (POEM), and liver failure intensive care.',
    headOfDept: 'Dr. R. Ananthakrishnan, DM (Gastro)',
    iconName: 'Stethoscope',
    doctorCount: 5,
    bedCapacity: 38,
    featured: false,
    commonConditions: ['Liver Cirrhosis', 'GERD & Peptic Ulcers', 'Ulcerative Colitis & Crohn’s', 'Pancreatitis', 'Gallstones']
  },
  {
    id: 'pediatrics',
    name: 'Pediatrics & Neonatal Intensive Care',
    shortDesc: 'Level III NICU, pediatric subspecialty clinics, developmental assessments, and immunization.',
    fullDesc: 'Dedicated pediatric surgical care, neonatal transport ambulances, and multidisciplinary child health clinics focusing on preventive and acute childhood illnesses.',
    headOfDept: 'Dr. Shalini Venugopal, MD (Peds), DNB',
    iconName: 'Baby',
    doctorCount: 6,
    bedCapacity: 34,
    featured: false,
    commonConditions: ['Neonatal Jaundice', 'Pediatric Asthma', 'Congenital Anomalies', 'Childhood Infections', 'Growth Delay']
  },
  {
    id: 'emergency',
    name: 'Emergency & Critical Care Medicine',
    shortDesc: '24/7 Level-1 trauma resuscitation, triage system, critical care outreach, and aeromedical support.',
    fullDesc: 'A 24-bed acute resuscitation bay with dedicated CT scanner, point-of-care ultrasound, emergency ultrasound certification, and dedicated chest pain / trauma triage bays.',
    headOfDept: 'Dr. D. Christopher, MRCEM (UK), FACEM',
    iconName: 'ShieldAlert',
    doctorCount: 10,
    bedCapacity: 28,
    featured: true,
    commonConditions: ['Polytrauma', 'Cardiac Arrest', 'Severe Sepsis', 'Acute Respiratory Distress', 'Poisoning & Toxicology']
  }
];

export const specialties = specialtiesData.map(s => s.name);
