/**
 * AarogyaCare Clinical & Electronic Prescription (E-Rx) Specialty Templates
 * 
 * Modular clinical decision support and prescription templates organized by department/specialty.
 * Unknown specialties fall back gracefully to General Medicine templates.
 */

export interface RxTemplateItem {
  suggestedMedicineName: string;
  dosageForm: string; // e.g. "Tablet", "Capsule", "Syrup", "Ointment", "Drops", "Inhaler"
  dosage: string;     // e.g. "1 Tablet", "5 mL", "2 Puffs", "Apply sparingly"
  route: string;      // e.g. "Oral", "Topical", "Inhalation", "Ophthalmic", "Sublingual"
  frequency: string;  // e.g. "Once daily morning (1-0-0)", "Twice daily after food (1-0-1)"
  durationDays: number;
  calculatedQuantity?: number; // Calculated only when units/schedule are unambiguous
  instructions: string;
  paediatricWeightCheckRequired?: boolean;
}

export interface SpecialtyClinicalTemplate {
  departmentKey: string;
  departmentName: string;
  aliases: string[];
  chiefComplaints: string[];
  examinationFindings: string[];
  diagnoses: { code?: string; name: string }[];
  treatmentPlans: string[];
  diagnosticLabs: { name: string; category: string; sampleType: string; urgency: string }[];
  prescriptions: RxTemplateItem[];
  followUpAdvice: string[];
}

export const SPECIALTY_TEMPLATES: Record<string, SpecialtyClinicalTemplate> = {
  general: {
    departmentKey: 'dept-general',
    departmentName: 'General Medicine',
    aliases: ['general medicine', 'internal medicine', 'family medicine', 'general', 'opd'],
    chiefComplaints: [
      'High grade fever with chills and myalgia x 3 days',
      'Generalized fatigue, malaise, and mild dehydration',
      'Persistent dry cough with sore throat x 5 days',
      'Epigastric burning discomfort exacerbated by empty stomach',
      'Acute tension headache and intermittent dizziness'
    ],
    examinationFindings: [
      'Febrile (101.2°F). Hydration fair. Throat congested with bilateral tonsillar erythema. Clear chest on auscultation.',
      'Normotensive. Soft abdomen, mild epigastric tenderness, no organomegaly. Normal bowel sounds.',
      'Conscious, oriented. Clear breath sounds bilaterally, no crepitations or rhonchi. Heart sounds regular S1/S2.'
    ],
    diagnoses: [
      { code: 'J06.9', name: 'Acute Upper Respiratory Tract Infection (URTI)' },
      { code: 'A09.9', name: 'Acute Gastroenteritis with Mild Dehydration' },
      { code: 'K30', name: 'Functional Dyspepsia / Peptic Syndrome' },
      { code: 'R50.9', name: 'Fever of Unknown Origin / Viral Syndrome' },
      { code: 'I10', name: 'Essential Hypertension - Initial Workup' }
    ],
    treatmentPlans: [
      'Oral rehydration therapy, symptomatic antipyretics, adequate oral fluid intake, resting.',
      'Proton-pump inhibitor morning on empty stomach, bland non-spicy diet, avoid NSAIDs.',
      'Broad spectrum viral relief, saline gargling, monitor temperature charting twice daily.'
    ],
    diagnosticLabs: [
      { name: 'Complete Blood Count (CBC) with Platelets', category: 'Hematology', sampleType: 'Whole Blood (EDTA)', urgency: 'ROUTINE' },
      { name: 'Widal Agglutination & Malarial Antigen (Dual)', category: 'Serology', sampleType: 'Serum', urgency: 'ROUTINE' },
      { name: 'Urine Routine & Microscopic Examination', category: 'Pathology', sampleType: 'Mid-stream Urine', urgency: 'ROUTINE' },
      { name: 'Serum Creatinine & Random Blood Sugar', category: 'Biochemistry', sampleType: 'Serum', urgency: 'ROUTINE' }
    ],
    prescriptions: [
      {
        suggestedMedicineName: 'Paracetamol 650mg',
        dosageForm: 'Tablet',
        dosage: '1 Tablet',
        route: 'Oral',
        frequency: 'Three times daily after food (1-1-1)',
        durationDays: 5,
        calculatedQuantity: 15,
        instructions: 'Take with warm water after meals. Do not exceed 4g daily.'
      },
      {
        suggestedMedicineName: 'Amoxicillin 500mg',
        dosageForm: 'Capsule',
        dosage: '1 Capsule',
        route: 'Oral',
        frequency: 'Three times daily (1-1-1)',
        durationDays: 5,
        calculatedQuantity: 15,
        instructions: 'Complete full 5-day antibiotic course even if feeling better.'
      },
      {
        suggestedMedicineName: 'Cetirizine 10mg',
        dosageForm: 'Tablet',
        dosage: '1 Tablet',
        route: 'Oral',
        frequency: 'Once daily at bedtime (0-0-1)',
        durationDays: 5,
        calculatedQuantity: 5,
        instructions: 'May cause drowsiness. Avoid driving or operating machinery.'
      },
      {
        suggestedMedicineName: 'Pantoprazole 40mg',
        dosageForm: 'Tablet',
        dosage: '1 Tablet',
        route: 'Oral',
        frequency: 'Once daily morning (1-0-0)',
        durationDays: 14,
        calculatedQuantity: 14,
        instructions: 'Take 30 minutes before breakfast on an empty stomach.'
      }
    ],
    followUpAdvice: [
      'Review in General Medicine OPD after 5 days if fever persists or symptoms worsen.',
      'Immediate emergency visit if high fever (>103°F), breathlessness, or persistent vomiting develops.'
    ]
  },

  cardio: {
    departmentKey: 'dept-cardio',
    departmentName: 'Cardiology',
    aliases: ['cardiology', 'cardiac', 'heart', 'coronary'],
    chiefComplaints: [
      'Exertional retrosternal chest tightness radiating to left shoulder x 2 weeks',
      'Shortness of breath on mild exertion (NYHA Class II) and bilateral pedal edema',
      'Intermittent palpitations and lightheadedness following climbing stairs',
      'Uncontrolled systolic blood pressure (>150 mmHg) recorded on home monitor'
    ],
    examinationFindings: [
      'BP 146/92 mmHg, HR 78 bpm regular. S1/S2 heard, no murmurs. Minimal bilateral pedal edema.',
      'Pulse 86 bpm regular. JVP not elevated. Bilateral basal fine crepitations. Apex beat in 5th intercostal space MCL.',
      'BP 132/84 mmHg sitting. Peripheral pulses well felt. No carotid bruit. Cardiac auscultation normal.'
    ],
    diagnoses: [
      { code: 'I20.9', name: 'Angina Pectoris, Unspecified / Stable CAD' },
      { code: 'I10', name: 'Essential (Primary) Hypertension - Grade 2' },
      { code: 'I50.9', name: 'Congestive Heart Failure - Compensated' },
      { code: 'I48.91', name: 'Atrial Fibrillation - Rate Controlled' },
      { code: 'E78.5', name: 'Primary Hyperlipidemia / Dyslipidemia' }
    ],
    treatmentPlans: [
      'Initiate antiplatelet and high-intensity statin therapy. Low sodium diet (<2g/day), aerobic exercise 30 min/day.',
      'Optimize antihypertensive regimen. Monitor daily home BP log. Serial ECG and lipid profile check.',
      'Fluid restriction to 1.5 L/day. Daily morning weight tracking. Potassium-sparing diuretic follow-up.'
    ],
    diagnosticLabs: [
      { name: 'Cardiac Troponin-I High Sensitivity (hs-cTnI)', category: 'Cardiology Diagnostics', sampleType: 'Plasma', urgency: 'URGENT' },
      { name: 'Lipid Profile Comprehensive (Chol, HDL, LDL, VLDL, Trig)', category: 'Biochemistry', sampleType: 'Fasting Serum', urgency: 'ROUTINE' },
      { name: '12-Lead Electrocardiogram (ECG) & Echo Doppler', category: 'Cardiology Diagnostics', sampleType: 'Clinical Imaging', urgency: 'ROUTINE' },
      { name: 'Serum Electrolytes (Na+, K+, Cl-, HCO3-)', category: 'Biochemistry', sampleType: 'Serum', urgency: 'ROUTINE' }
    ],
    prescriptions: [
      {
        suggestedMedicineName: 'Atorvastatin 20mg',
        dosageForm: 'Tablet',
        dosage: '1 Tablet',
        route: 'Oral',
        frequency: 'Once daily at bedtime (0-0-1)',
        durationDays: 30,
        calculatedQuantity: 30,
        instructions: 'Take at night. Avoid grapefruit juice.'
      },
      {
        suggestedMedicineName: 'Metoprolol 25mg',
        dosageForm: 'Tablet',
        dosage: '1 Tablet',
        route: 'Oral',
        frequency: 'Twice daily after food (1-0-1)',
        durationDays: 30,
        calculatedQuantity: 60,
        instructions: 'Check pulse before taking. Do not stop abruptly.'
      },
      {
        suggestedMedicineName: 'Amlodipine 5mg',
        dosageForm: 'Tablet',
        dosage: '1 Tablet',
        route: 'Oral',
        frequency: 'Once daily morning (1-0-0)',
        durationDays: 30,
        calculatedQuantity: 30,
        instructions: 'Take in the morning. Report any swelling of feet.'
      },
      {
        suggestedMedicineName: 'Aspirin 75mg',
        dosageForm: 'Tablet',
        dosage: '1 Tablet',
        route: 'Oral',
        frequency: 'Once daily after lunch (0-1-0)',
        durationDays: 30,
        calculatedQuantity: 30,
        instructions: 'Take immediately after food to avoid gastric irritation.'
      }
    ],
    followUpAdvice: [
      'Cardiology OPD follow-up in 4 weeks with home BP chart and repeat lipid profile.',
      'Emergency SOS warning: If chest pain persists >10 minutes or radiates to jaw/arm with sweating, report to ER immediately.'
    ]
  },

  neuro: {
    departmentKey: 'dept-neuro',
    departmentName: 'Neurology',
    aliases: ['neurology', 'neurosurgery', 'brain', 'spine', 'neuro'],
    chiefComplaints: [
      'Unilateral throbbing hemicranial headache with photophobia and nausea x 2 days',
      'Episodes of spinning sensation (vertigo) aggravated by head turning',
      'Bilateral glove-and-stocking numbness with tingling in feet x 3 months',
      'Single generalized tonic-clonic seizure episode, post-ictal confusion resolved'
    ],
    examinationFindings: [
      'GCS 15/15. Cranial nerves II-XII intact. No neck rigidity. Kernig negative. Fundus examination normal.',
      'Dix-Hallpike test positive on right side with torsional nystagmus. Normal cerebellar finger-to-nose testing.',
      'Impaired vibration and fine touch below ankles bilaterally. Deep tendon reflexes symmetrical. Plantar flexor.'
    ],
    diagnoses: [
      { code: 'G43.909', name: 'Migraine without Aura, Intractable' },
      { code: 'H81.10', name: 'Benign Paroxysmal Positional Vertigo (BPPV)' },
      { code: 'G62.9', name: 'Peripheral Neuropathy - Diabetic / Metabolic' },
      { code: 'G40.909', name: 'Epilepsy, Unspecified - Monotherapy Monitoring' }
    ],
    treatmentPlans: [
      'Migraine prophylaxis with lifestyle modifications, regular sleep schedule, avoidance of trigger foods.',
      'Epley repositioning maneuver performed in clinic. Vestibular rehabilitation exercises.',
      'Strict glycemic control, neuroprotective supplements, foot care precautions.'
    ],
    diagnosticLabs: [
      { name: 'Magnetic Resonance Imaging (MRI) Brain + Neuro-Vascular Angio', category: 'Radiology', sampleType: 'Imaging', urgency: 'ROUTINE' },
      { name: 'Electroencephalogram (EEG) 32-Channel Video Recording', category: 'Neurophysiology', sampleType: 'Electrophysiology', urgency: 'ROUTINE' },
      { name: 'Serum Vitamin B12 & Methylmalonic Acid', category: 'Biochemistry', sampleType: 'Serum', urgency: 'ROUTINE' }
    ],
    prescriptions: [
      {
        suggestedMedicineName: 'Paracetamol 650mg',
        dosageForm: 'Tablet',
        dosage: '1 Tablet',
        route: 'Oral',
        frequency: 'SOS / As needed for headache (max 3/day)',
        durationDays: 10,
        calculatedQuantity: 10,
        instructions: 'Take at early onset of headache with plenty of fluids.'
      },
      {
        suggestedMedicineName: 'Pantoprazole 40mg',
        dosageForm: 'Tablet',
        dosage: '1 Tablet',
        route: 'Oral',
        frequency: 'Once daily morning (1-0-0)',
        durationDays: 14,
        calculatedQuantity: 14,
        instructions: 'Take on empty stomach 30 minutes before food.'
      }
    ],
    followUpAdvice: [
      'Review in Neurology Clinic after 2 weeks with completed headache diary.',
      'Seek urgent emergency care if sudden worst headache of life, speech slurring, or weakness occurs.'
    ]
  },

  ortho: {
    departmentKey: 'dept-ortho',
    departmentName: 'Orthopedics & Joint Replacement',
    aliases: ['orthopedics', 'orthopaedics', 'bone', 'joint', 'spine', 'trauma'],
    chiefComplaints: [
      'Bilateral knee pain with joint crepitus, severe while climbing stairs x 6 months',
      'Acute right ankle sprain and swelling following slip while playing sport',
      'Low back pain radiating to left posterior thigh and calf (Sciatica) x 3 weeks',
      'Right shoulder stiffness and nocturnal pain with restricted abduction'
    ],
    examinationFindings: [
      'Bilateral medial joint line tenderness over knees. Mild effusion right knee. Crepitus on passive flexion.',
      'Antalgic gait. Straight Leg Raising (SLR) positive at 45 degrees on left side. Motor power 5/5 both lower limbs.',
      'Swelling and ecchymosis over anterior talofibular ligament. Anterior drawer test mildly positive. Neurovascularly intact.'
    ],
    diagnoses: [
      { code: 'M17.11', name: 'Primary Osteoarthritis, Right Knee (Grade III)' },
      { code: 'M54.5', name: 'Lumbago with Sciatica / Lumbar Radiculopathy' },
      { code: 'S93.401A', name: 'Sprain of Unspecified Ligament of Right Ankle' },
      { code: 'M75.00', name: 'Adhesive Capsulitis (Frozen Shoulder)' }
    ],
    treatmentPlans: [
      'Quadriceps isometric exercises, avoid cross-legged sitting and deep squatting. Glucosamine supplementation.',
      'R.I.C.E protocol (Rest, Ice, Compression, Elevation) for 72 hours. Ankle binder support.',
      'Lumbar core stabilization, avoid lifting heavy weights, ergonomic workplace setup.'
    ],
    diagnosticLabs: [
      { name: 'X-Ray Both Knees AP Standing & Lateral Weight Bearing', category: 'Radiology', sampleType: 'Plain Radiograph', urgency: 'ROUTINE' },
      { name: 'MRI Lumbar Spine with Whole Spine Screening', category: 'Radiology', sampleType: 'Imaging', urgency: 'ROUTINE' },
      { name: 'Serum Uric Acid & ESR / CRP', category: 'Biochemistry', sampleType: 'Serum', urgency: 'ROUTINE' }
    ],
    prescriptions: [
      {
        suggestedMedicineName: 'Paracetamol 650mg',
        dosageForm: 'Tablet',
        dosage: '1 Tablet',
        route: 'Oral',
        frequency: 'Twice daily after food (1-0-1)',
        durationDays: 7,
        calculatedQuantity: 14,
        instructions: 'Take after meals. Mild analgesic for joint discomfort.'
      },
      {
        suggestedMedicineName: 'Pantoprazole 40mg',
        dosageForm: 'Tablet',
        dosage: '1 Tablet',
        route: 'Oral',
        frequency: 'Once daily morning (1-0-0)',
        durationDays: 14,
        calculatedQuantity: 14,
        instructions: 'Take before breakfast for gastroprotection.'
      }
    ],
    followUpAdvice: [
      'Orthopedic review after 2 weeks with radiological films and physiotherapy progress report.',
      'Consult immediately if limb numbness, severe instability, or inability to bear weight occurs.'
    ]
  },

  pedia: {
    departmentKey: 'dept-pedia',
    departmentName: 'Pediatrics & Child Care',
    aliases: ['pediatrics', 'paediatrics', 'child', 'peds', 'neonatal'],
    chiefComplaints: [
      'Fever, irritability, and poor feeding in 8-month infant x 2 days',
      'Nocturnal paroxysmal dry cough with audible expiratory wheeze in 4-year child',
      'Watery stools 4-5 times today, active and passing urine normally',
      'Routine 18-month vaccination and developmental milestone evaluation'
    ],
    examinationFindings: [
      'Weight 14.5 kg. Alert, smiling, well hydrated. Pharynx mild erythema. Tympanic membranes pearly grey.',
      'Expiratory wheeze heard across bilateral lung fields. RR 28/min. Subcostal retractions absent. SpO2 99% on room air.',
      'Anterior fontanelle soft and flat. Skin turgor normal. Abdomen soft, no tenderness.'
    ],
    diagnoses: [
      { code: 'J20.9', name: 'Acute Bronchitis / Viral Wheeze' },
      { code: 'A09', name: 'Infectious Gastroenteritis - No Dehydration' },
      { code: 'J02.9', name: 'Acute Pharyngitis - Viral' },
      { code: 'Z00.129', name: 'Routine Child Health Check & Growth Monitoring' }
    ],
    treatmentPlans: [
      'Frequent small feeds, oral rehydration solution (ORS) after each loose stool, monitor urine output.',
      'Saline nasal drops before feeds. Steam inhalation in bathroom. Humidified environment.',
      'Strict weight-based dosing for all pediatric medications. Never give aspirin to children.'
    ],
    diagnosticLabs: [
      { name: 'Complete Blood Count (Pediatric Micro-Sample)', category: 'Hematology', sampleType: 'Capillary Blood', urgency: 'ROUTINE' },
      { name: 'Stool Routine & Occult Blood', category: 'Microbiology', sampleType: 'Stool Specimen', urgency: 'ROUTINE' },
      { name: 'Chest X-Ray PA View (Pediatric)', category: 'Radiology', sampleType: 'X-Ray', urgency: 'ROUTINE' }
    ],
    prescriptions: [
      {
        suggestedMedicineName: 'Paracetamol 650mg',
        dosageForm: 'Syrup',
        dosage: '5 mL (15mg/kg/dose)',
        route: 'Oral',
        frequency: 'SOS / Every 6 hours as needed for fever >100°F',
        durationDays: 3,
        calculatedQuantity: 1, // 1 bottle
        instructions: 'Use calibrated measuring syringe. Recheck temperature before redosing.',
        paediatricWeightCheckRequired: true
      },
      {
        suggestedMedicineName: 'Amoxicillin 500mg',
        dosageForm: 'Syrup',
        dosage: '5 mL (40mg/kg/day divided BID)',
        route: 'Oral',
        frequency: 'Twice daily after milk (1-0-1)',
        durationDays: 5,
        calculatedQuantity: 1, // 1 bottle
        instructions: 'Reconstitute with boiled and cooled water up to mark. Shake well before use.',
        paediatricWeightCheckRequired: true
      }
    ],
    followUpAdvice: [
      'Pediatric OPD review in 48 hours or sooner if child becomes lethargic or refuses feeds.',
      'Red flags: Labored breathing, grunting, blue lips, unarousable child, or no wet diaper in 6 hours.'
    ]
  },

  derma: {
    departmentKey: 'dept-derma',
    departmentName: 'Dermatology & Cosmetology',
    aliases: ['dermatology', 'skin', 'cosmetology', 'derma'],
    chiefComplaints: [
      'Pruritic erythematous plaques with silvery scales over extensor elbows and knees',
      'Facial inflammatory papules and comedones aggravated by stress x 3 months',
      'Annular itchy scaly rash with active raised erythematous border on trunk',
      'Diffuse hair thinning and telogen shedding following viral illness'
    ],
    examinationFindings: [
      'Well-demarcated erythematous plaques with thick micaceous silvery scales. Auspitz sign positive.',
      'Multiple inflammatory papules and pustules on cheeks and forehead. Grade II acne vulgaris.',
      'Erythematous annular plaque with central clearing and peripheral scale on right flank.'
    ],
    diagnoses: [
      { code: 'L40.0', name: 'Psoriasis Vulgaris - Plaque Type' },
      { code: 'L70.0', name: 'Acne Vulgaris - Papulopustular Grade II' },
      { code: 'B35.4', name: 'Tinea Corporis (Superficial Fungal Infection)' },
      { code: 'L20.9', name: 'Atopic Dermatitis / Eczema' }
    ],
    treatmentPlans: [
      'Liberal application of liquid paraffin/ceramide moisturizer twice daily on damp skin.',
      'Gentle soap-free skin cleanser. Avoid scrubbing face. Non-comedogenic sunscreen SPF 50.',
      'Keep affected areas dry and clean. Wear loose cotton garments. Do not share towels.'
    ],
    diagnosticLabs: [
      { name: 'KOH Wet Mount for Fungal Hyphae', category: 'Microbiology', sampleType: 'Skin Scraping', urgency: 'ROUTINE' },
      { name: 'Serum Ferritin, TSH & Vitamin D3', category: 'Biochemistry', sampleType: 'Serum', urgency: 'ROUTINE' },
      { name: 'Skin Punch Biopsy (Histopathology)', category: 'Histopathology', sampleType: 'Biopsy Core', urgency: 'ROUTINE' }
    ],
    prescriptions: [
      {
        suggestedMedicineName: 'Cetirizine 10mg',
        dosageForm: 'Tablet',
        dosage: '1 Tablet',
        route: 'Oral',
        frequency: 'Once daily at night (0-0-1)',
        durationDays: 14,
        calculatedQuantity: 14,
        instructions: 'Helps control nocturnal skin itching and excoriation.'
      }
    ],
    followUpAdvice: [
      'Review in Dermatology Clinic in 3 weeks to evaluate therapeutic response and tolerance.',
      'Avoid topical over-the-counter steroid creams containing clobetasol or betamethasone.'
    ]
  },

  pulmo: {
    departmentKey: 'dept-pulmo',
    departmentName: 'Pulmonology & Sleep Medicine',
    aliases: ['pulmonology', 'chest', 'respiratory', 'lungs', 'pulmo'],
    chiefComplaints: [
      'Productive cough with yellowish sputum and low-grade evening fever x 2 weeks',
      'Nocturnal dyspnea and wheezing waking patient at 3 AM multiple nights a week',
      'Progressive exertional breathlessness in chronic smoker of 25 pack-years'
    ],
    examinationFindings: [
      'RR 22/min. Chest expansion symmetrical. Scattered polyphonic wheezing heard bilaterally. SpO2 96%.',
      'Barrel-shaped chest, prolonged expiratory phase with decreased breath sounds bilaterally.',
      'Localized bronchial breath sounds with coarse inspiratory crackles over right lower zone.'
    ],
    diagnoses: [
      { code: 'J45.909', name: 'Bronchial Asthma - Moderate Persistent' },
      { code: 'J44.9', name: 'Chronic Obstructive Pulmonary Disease (COPD) with Exacerbation' },
      { code: 'J18.9', name: 'Community-Acquired Pneumonia (CAP) - Unspecified' }
    ],
    treatmentPlans: [
      'Inhaled corticosteroid + long-acting beta2-agonist twice daily using spacer device.',
      'Smoking cessation counseling, pulmonary rehabilitation breathing exercises.',
      'Pneumococcal conjugate (PCV13) and annual influenza vaccination advised.'
    ],
    diagnosticLabs: [
      { name: 'Spirometry Pre- & Post-Bronchodilator (PFT)', category: 'Pulmonary Function', sampleType: 'Physiological', urgency: 'ROUTINE' },
      { name: 'High Resolution Computed Tomography (HRCT) Chest', category: 'Radiology', sampleType: 'CT Imaging', urgency: 'ROUTINE' },
      { name: 'Sputum for Acid Fast Bacilli (AFB) & GeneXpert MTB', category: 'Microbiology', sampleType: 'Early Morning Sputum', urgency: 'ROUTINE' }
    ],
    prescriptions: [
      {
        suggestedMedicineName: 'Amoxicillin 500mg',
        dosageForm: 'Capsule',
        dosage: '1 Capsule',
        route: 'Oral',
        frequency: 'Three times daily (1-1-1)',
        durationDays: 7,
        calculatedQuantity: 21,
        instructions: 'Complete full 7-day course. Report any skin rashes.'
      },
      {
        suggestedMedicineName: 'Cetirizine 10mg',
        dosageForm: 'Tablet',
        dosage: '1 Tablet',
        route: 'Oral',
        frequency: 'Once daily at bedtime (0-0-1)',
        durationDays: 10,
        calculatedQuantity: 10,
        instructions: 'Take at night. Relieves allergic bronchospasm triggers.'
      }
    ],
    followUpAdvice: [
      'Review in Pulmonology Clinic in 10 days with post-treatment spirometry report.',
      'Emergency warning: If severe breathlessness, inability to speak full sentences, or blue fingernails, report immediately to ER.'
    ]
  },

  gastro: {
    departmentKey: 'dept-gastro',
    departmentName: 'Gastroenterology & Hepatology',
    aliases: ['gastroenterology', 'digestive', 'liver', 'hepatology', 'gastro'],
    chiefComplaints: [
      'Severe epigastric burning retrosternal reflux after spicy food x 4 months',
      'Right upper quadrant postprandial dull pain radiating to interscapular region',
      'Altered bowel habits with alternating constipation and loose stools with mucus'
    ],
    examinationFindings: [
      'Abdomen soft, mild epigastric tenderness. Murphy sign negative. No hepatosplenomegaly.',
      'No abdominal distension. Bowel sounds active. Rectal examination normal.'
    ],
    diagnoses: [
      { code: 'K21.9', name: 'Gastro-Esophageal Reflux Disease (GERD) without Esophagitis' },
      { code: 'K80.20', name: 'Calculus of Gallbladder without Cholecystitis' },
      { code: 'K58.0', name: 'Irritable Bowel Syndrome with Constipation (IBS-C)' }
    ],
    treatmentPlans: [
      'Elevation of head end of bed by 6 inches. Avoid lying down within 2 hours of eating.',
      'Avoid high-fat meals, chocolate, caffeine, carbonated beverages, and mint.',
      'High soluble fiber diet, adequate water intake (2.5L/day), stress reduction techniques.'
    ],
    diagnosticLabs: [
      { name: 'Upper GI Diagnostic Video Endoscopy (OGD)', category: 'Endoscopy', sampleType: 'Procedure', urgency: 'ROUTINE' },
      { name: 'Ultrasound Whole Abdomen & Pelvis (Fasting)', category: 'Radiology', sampleType: 'Sonography', urgency: 'ROUTINE' },
      { name: 'Liver Function Test Comprehensive (LFT)', category: 'Biochemistry', sampleType: 'Serum', urgency: 'ROUTINE' }
    ],
    prescriptions: [
      {
        suggestedMedicineName: 'Pantoprazole 40mg',
        dosageForm: 'Tablet',
        dosage: '1 Tablet',
        route: 'Oral',
        frequency: 'Once daily morning (1-0-0)',
        durationDays: 30,
        calculatedQuantity: 30,
        instructions: 'Take 30 minutes before morning breakfast with plain water.'
      }
    ],
    followUpAdvice: [
      'Gastroenterology review in 4 weeks. Report if black stools, difficulty swallowing, or vomiting blood occurs.'
    ]
  },

  nephro: {
    departmentKey: 'dept-nephro',
    departmentName: 'Nephrology & Urology',
    aliases: ['nephrology', 'kidney', 'renal', 'urology', 'nephro'],
    chiefComplaints: [
      'Bilateral lower extremity edema and early morning facial puffiness x 1 month',
      'Burning sensation on micturition with urinary frequency and urgency x 3 days',
      'Elevated serum creatinine (2.1 mg/dL) detected on routine executive health check'
    ],
    examinationFindings: [
      'BP 152/94 mmHg. Bilateral pitting pedal edema up to mid-shin. No costovertebral angle tenderness.',
      'Suprapubic mild tenderness. External genitalia normal. Hydration adequate.'
    ],
    diagnoses: [
      { code: 'N18.30', name: 'Chronic Kidney Disease, Stage 3' },
      { code: 'N39.0', name: 'Urinary Tract Infection (UTI), Site Not Specified' },
      { code: 'N20.1', name: 'Calculus of Ureter / Renal Colic' }
    ],
    treatmentPlans: [
      'Low protein (0.8g/kg/day), low salt (<2g/day) diet. Strict BP control target <130/80 mmHg.',
      'Avoid all NSAID pain medications, aminoglycosides, and iodinated contrast studies.',
      'Liberal hydration (>3 liters/day) for urinary flushing. Alkaline citrate syrup.'
    ],
    diagnosticLabs: [
      { name: 'Serum Creatinine, Blood Urea Nitrogen & eGFR', category: 'Biochemistry', sampleType: 'Serum', urgency: 'ROUTINE' },
      { name: 'Urine Culture & Sensitivity (Colony Count)', category: 'Microbiology', sampleType: 'Clean Catch Midstream', urgency: 'ROUTINE' },
      { name: 'Ultrasound Kidneys, Ureters & Bladder (KUB)', category: 'Radiology', sampleType: 'Sonography', urgency: 'ROUTINE' },
      { name: '24-Hour Urine Protein & Creatinine Clearance', category: 'Biochemistry', sampleType: '24h Urine', urgency: 'ROUTINE' }
    ],
    prescriptions: [
      {
        suggestedMedicineName: 'Amlodipine 5mg',
        dosageForm: 'Tablet',
        dosage: '1 Tablet',
        route: 'Oral',
        frequency: 'Once daily morning (1-0-0)',
        durationDays: 30,
        calculatedQuantity: 30,
        instructions: 'Renally safe calcium channel blocker for BP control.'
      },
      {
        suggestedMedicineName: 'Paracetamol 650mg',
        dosageForm: 'Tablet',
        dosage: '1 Tablet',
        route: 'Oral',
        frequency: 'SOS / As needed for fever or mild flank ache (max 2/day)',
        durationDays: 5,
        calculatedQuantity: 10,
        instructions: 'Safest analgesic in renal impairment. Avoid ibuprofen or diclofenac.'
      }
    ],
    followUpAdvice: [
      'Nephrology OPD follow-up in 3 weeks with repeat serum creatinine and urine culture sensitivity.'
    ]
  },

  ent: {
    departmentKey: 'dept-ent',
    departmentName: 'ENT (Otolaryngology)',
    aliases: ['ent', 'ear', 'nose', 'throat', 'otolaryngology'],
    chiefComplaints: [
      'Severe pain and fullness in left ear with purulent discharge x 4 days',
      'Bilateral nasal obstruction with thick yellowish discharge and facial pressure',
      'Hoarseness of voice in a school teacher persisting for 3 weeks'
    ],
    examinationFindings: [
      'Otoscopy left ear: Tympanic membrane hyperemic, bulging with small central perforation and pulsatile discharge.',
      'Anterior rhinoscopy: Hypertrophied inferior turbinates with purulent post-nasal drip. Maxillary tenderness.',
      'Indirect laryngoscopy: Bilateral vocal cord vocal nodules at junction of anterior and middle third.'
    ],
    diagnoses: [
      { code: 'H66.90', name: 'Acute Otitis Media, Unspecified' },
      { code: 'J01.90', name: 'Acute Rhinosinusitis' },
      { code: 'J38.2', name: 'Vocal Cord Nodules / Chronic Laryngitis' }
    ],
    treatmentPlans: [
      'Keep ear strictly dry. Avoid water entry during bath using cotton smeared with petroleum jelly.',
      'Steam inhalation with menthol thrice daily. Saline nasal irrigation (douche).',
      'Absolute voice rest for 72 hours. Avoid whispering, throat clearing, and shouting.'
    ],
    diagnosticLabs: [
      { name: 'Ear Discharge Pus Swab for Culture & Sensitivity', category: 'Microbiology', sampleType: 'Swab', urgency: 'ROUTINE' },
      { name: 'Pure Tone Audiometry (PTA) & Tympanometry', category: 'Audiology', sampleType: 'Functional', urgency: 'ROUTINE' },
      { name: 'Diagnostic Rigid Nasal Endoscopy (DNE)', category: 'ENT Diagnostics', sampleType: 'Endoscopic', urgency: 'ROUTINE' }
    ],
    prescriptions: [
      {
        suggestedMedicineName: 'Amoxicillin 500mg',
        dosageForm: 'Capsule',
        dosage: '1 Capsule',
        route: 'Oral',
        frequency: 'Three times daily (1-1-1)',
        durationDays: 7,
        calculatedQuantity: 21,
        instructions: 'Take with full glass of water. Complete 7-day antibiotic course.'
      },
      {
        suggestedMedicineName: 'Paracetamol 650mg',
        dosageForm: 'Tablet',
        dosage: '1 Tablet',
        route: 'Oral',
        frequency: 'Twice daily after food (1-0-1)',
        durationDays: 5,
        calculatedQuantity: 10,
        instructions: 'Take after meals for ear and sinus pain.'
      },
      {
        suggestedMedicineName: 'Cetirizine 10mg',
        dosageForm: 'Tablet',
        dosage: '1 Tablet',
        route: 'Oral',
        frequency: 'Once daily at bedtime (0-0-1)',
        durationDays: 10,
        calculatedQuantity: 10,
        instructions: 'Helps reduce allergic nasal mucosal edema.'
      }
    ],
    followUpAdvice: [
      'Review in ENT OPD after 7 days for repeat otoscopy and hearing threshold assessment.'
    ]
  },

  obgyn: {
    departmentKey: 'dept-obgyn',
    departmentName: 'Obstetrics & Gynaecology',
    aliases: ['obgyn', 'obstetrics', 'gynaecology', 'gynecology', 'women'],
    chiefComplaints: [
      'Irregular menstrual cycles (45-60 days) with weight gain and hirsutism x 1 year',
      'Lower abdominal cyclical cramping pain (dysmenorrhea) during menstruation',
      'Routine antenatal first trimester consultation with positive urine pregnancy test'
    ],
    examinationFindings: [
      'BMI 28.4 kg/m2. Mild acanthosis nigricans on nape of neck. Ferriman-Gallwey hirsutism score 8.',
      'Abdomen soft, non-tender. Pelvic bimanual examination normal. Normal external genitalia.'
    ],
    diagnoses: [
      { code: 'E28.2', name: 'Polycystic Ovarian Syndrome (PCOS)' },
      { code: 'N94.6', name: 'Primary Dysmenorrhea' },
      { code: 'Z34.01', name: 'Encounter for Supervision of Normal First Pregnancy' }
    ],
    treatmentPlans: [
      'Lifestyle modification: 150 minutes of moderate aerobic exercise weekly, low glycemic index diet.',
      'Folic acid 5mg supplementation preconception / early pregnancy.',
      'Heat compression to lower abdomen. Hydration and light yoga stretches.'
    ],
    diagnosticLabs: [
      { name: 'Transvaginal / Pelvic Ultrasound (USG)', category: 'Radiology', sampleType: 'Sonography', urgency: 'ROUTINE' },
      { name: 'Antenatal Profile (Blood Group, Hb, HIV, HBsAg, VDRL, RBS, TSH)', category: 'Obstetrics Diagnostics', sampleType: 'Serum & Whole Blood', urgency: 'ROUTINE' },
      { name: 'Serum LH, FSH, Prolactin & Total Testosterone', category: 'Endocrinology', sampleType: 'Fasting Serum', urgency: 'ROUTINE' }
    ],
    prescriptions: [
      {
        suggestedMedicineName: 'Paracetamol 650mg',
        dosageForm: 'Tablet',
        dosage: '1 Tablet',
        route: 'Oral',
        frequency: 'SOS / As needed for menstrual cramps (max 3/day)',
        durationDays: 3,
        calculatedQuantity: 6,
        instructions: 'Take after meals for pelvic cramping.'
      }
    ],
    followUpAdvice: [
      'OB/GYN follow-up in 4 weeks with ultrasound and laboratory profile reports.'
    ]
  }
};

/**
 * Helper to match doctor department/specialty to the appropriate template.
 * Falls back to General Medicine if specialty is unknown.
 */
export function getTemplateForSpecialty(departmentOrSpecialty?: string): SpecialtyClinicalTemplate {
  if (!departmentOrSpecialty) return SPECIALTY_TEMPLATES.general;

  const clean = departmentOrSpecialty.toLowerCase().trim();
  for (const template of Object.values(SPECIALTY_TEMPLATES)) {
    if (
      template.departmentName.toLowerCase().includes(clean) ||
      clean.includes(template.departmentName.toLowerCase()) ||
      template.aliases.some((alias) => clean.includes(alias) || alias.includes(clean))
    ) {
      return template;
    }
  }

  return SPECIALTY_TEMPLATES.general;
}

export interface FormularyMedicineLike {
  id: string;
  name: string;
  brand_name?: string;
  dosage_form?: string;
  strength?: string;
  current_stock?: number;
}

/**
 * Matches a suggested medicine name from a clinical template against the real hospital formulary inventory.
 */
export function findFormularyMatch<T extends FormularyMedicineLike>(
  suggestedName: string,
  medicines: T[]
): T | undefined {
  if (!suggestedName || !medicines || medicines.length === 0) return undefined;
  const cleanSug = suggestedName.toLowerCase().replace(/[^a-z0-9]/g, ' ');
  const words = cleanSug.split(/\s+/).filter((w) => w.length > 2);

  // 1. Direct contains match on name or brand
  const direct = medicines.find(
    (m) =>
      m.name.toLowerCase().includes(cleanSug) ||
      cleanSug.includes(m.name.toLowerCase()) ||
      (m.brand_name && (m.brand_name.toLowerCase().includes(cleanSug) || cleanSug.includes(m.brand_name.toLowerCase())))
  );
  if (direct) return direct;

  // 2. Best token overlap match
  let bestMed: T | undefined;
  let bestScore = 0;
  for (const med of medicines) {
    const medLower = `${med.name} ${med.brand_name || ''} ${med.strength || ''}`.toLowerCase();
    let score = 0;
    for (const w of words) {
      if (medLower.includes(w)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMed = med;
    }
  }

  return bestScore > 0 ? bestMed : medicines[0];
}
