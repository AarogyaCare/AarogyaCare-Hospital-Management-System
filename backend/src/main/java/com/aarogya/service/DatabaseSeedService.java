package com.aarogya.service;

import com.aarogya.model.*;
import com.aarogya.repository.*;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class DatabaseSeedService {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseSeedService.class);
    private static final String MASTER_PASSWORD = "Aarogya#2026Secure";

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DepartmentRepository departmentRepository;
    private final SpecializationRepository specializationRepository;
    private final DoctorRepository doctorRepository;
    private final DoctorSlotRepository slotRepository;
    private final MedicineRepository medicineRepository;
    private final AppointmentRepository appointmentRepository;
    private final ClinicalRecordRepository recordRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final LabOrderRepository labOrderRepository;
    private final EmergencyRequestRepository emergencyRepository;
    private final PasswordEncoder passwordEncoder;
    private final org.springframework.core.env.Environment env;

    public DatabaseSeedService(
            UserRepository userRepository,
            PatientRepository patientRepository,
            DepartmentRepository departmentRepository,
            SpecializationRepository specializationRepository,
            DoctorRepository doctorRepository,
            DoctorSlotRepository slotRepository,
            MedicineRepository medicineRepository,
            AppointmentRepository appointmentRepository,
            ClinicalRecordRepository recordRepository,
            PrescriptionRepository prescriptionRepository,
            InvoiceRepository invoiceRepository,
            PaymentRepository paymentRepository,
            LabOrderRepository labOrderRepository,
            EmergencyRequestRepository emergencyRepository,
            PasswordEncoder passwordEncoder,
            org.springframework.core.env.Environment env) {
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.departmentRepository = departmentRepository;
        this.specializationRepository = specializationRepository;
        this.doctorRepository = doctorRepository;
        this.slotRepository = slotRepository;
        this.medicineRepository = medicineRepository;
        this.appointmentRepository = appointmentRepository;
        this.recordRepository = recordRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.labOrderRepository = labOrderRepository;
        this.emergencyRepository = emergencyRepository;
        this.passwordEncoder = passwordEncoder;
        this.env = env;
    }

    @PostConstruct
    public void seedInitialData() {
        try {
            seedDepartmentsAndSpecializations();
            seedMedicines();
            if (isProductionEnvironment()) {
                logger.info("Production profile active: Skipping privileged master demo accounts and synthetic clinical records.");
                return;
            }
            seedUsersAndProfiles();
            seedInitialAppointmentsAndRecords();
            seedEmergencyQueue();
            logger.info("Aarogya Care synthetic database seeding completed successfully.");
        } catch (Exception ex) {
            logger.error("Error during initial synthetic database seeding", ex);
        }
    }

    private boolean isProductionEnvironment() {
        if (env != null) {
            for (String profile : env.getActiveProfiles()) {
                if ("prod".equalsIgnoreCase(profile) || "production".equalsIgnoreCase(profile)) {
                    return true;
                }
            }
        }
        String appEnv = System.getenv("APP_ENV");
        String springEnv = System.getenv("SPRING_PROFILES_ACTIVE");
        return "prod".equalsIgnoreCase(appEnv) || "production".equalsIgnoreCase(appEnv)
                || "prod".equalsIgnoreCase(springEnv) || "production".equalsIgnoreCase(springEnv);
    }

    private void seedDepartmentsAndSpecializations() {
        if (departmentRepository.findById("dept-cardio").isPresent()) return;

        List<DepartmentDocument> depts = List.of(
            new DepartmentDocument("dept-cardio", "CARDIO", "Cardiology", "Specialized cardiac care, coronary intervention, and arrhythmia diagnostics.", "Heart"),
            new DepartmentDocument("dept-neuro", "NEURO", "Neurology", "Comprehensive neuro-diagnostics, stroke intervention, and brain injury care.", "Brain"),
            new DepartmentDocument("dept-ortho", "ORTHO", "Orthopedics & Joint Replacement", "Robotic joint reconstruction, spinal surgery, and musculoskeletal rehabilitation.", "Bone"),
            new DepartmentDocument("dept-pedia", "PEDIA", "Pediatrics & Child Care", "Neonatal intensive care, developmental tracking, and pediatric acute treatment.", "Baby"),
            new DepartmentDocument("dept-emergency", "EMERGENCY", "Emergency & Trauma Care", "24/7 Level-1 trauma response, acute critical stabilization, and rapid resuscitation.", "Siren")
        );
        departmentRepository.saveAll(depts);

        List<SpecializationDocument> specs = List.of(
            new SpecializationDocument("spec-1", "dept-cardio", "Interventional Cardiology"),
            new SpecializationDocument("spec-2", "dept-cardio", "Heart Failure Management"),
            new SpecializationDocument("spec-3", "dept-neuro", "Stroke Intervention"),
            new SpecializationDocument("spec-4", "dept-neuro", "Epileptology"),
            new SpecializationDocument("spec-5", "dept-ortho", "Robotic Joint Replacement"),
            new SpecializationDocument("spec-6", "dept-ortho", "Spine Surgery"),
            new SpecializationDocument("spec-7", "dept-pedia", "Neonatal ICU Care"),
            new SpecializationDocument("spec-8", "dept-pedia", "Pediatric Pulmonology")
        );
        specializationRepository.saveAll(specs);
    }

    private void seedUsersAndProfiles() {
        if (userRepository.findById("user-admin").isPresent()) {
            UserDocument existingBilling = userRepository.findById("user-billing").orElse(null);
            if (existingBilling != null && !"billing_staff".equals(existingBilling.getRole())) {
                existingBilling.setRole("billing_staff");
                userRepository.save(existingBilling);
            }
            ensureDoctorConsultationFees();
            return;
        }

        String encodedMaster = passwordEncoder.encode(MASTER_PASSWORD);

        // 1. Admin
        UserDocument admin = new UserDocument("user-admin", "admin@aarogyacare.org", encodedMaster, "System Administrator", "admin", "+91 98765 43210");
        userRepository.save(admin);

        // 2. Doctor Ramanathan
        UserDocument docUser1 = new UserDocument("user-doc-1", "dr.ramanathan@aarogyacare.org", encodedMaster, "Dr. Ramanathan Sundaram", "doctor", "+91 98765 43211");
        userRepository.save(docUser1);
        DoctorDocument doc1 = new DoctorDocument(
            "doc-1",
            "user-doc-1",
            "dept-cardio",
            "MD, DM (Cardiology), FACC",
            18,
            "OPD-102",
            4.9,
            List.of("Interventional Cardiology", "Coronary Angioplasty", "Arrhythmia"),
            1200.0
        );
        doctorRepository.save(doc1);
        seedSlotsForDoctor("doc-1", "OPD-102");

        // 3. Doctor Ananya
        UserDocument docUser2 = new UserDocument("user-doc-2", "dr.ananya@aarogyacare.org", encodedMaster, "Dr. Ananya Sharma", "doctor", "+91 98765 43212");
        userRepository.save(docUser2);
        DoctorDocument doc2 = new DoctorDocument(
            "doc-2",
            "user-doc-2",
            "dept-neuro",
            "MD, DM (Neurology)",
            14,
            "OPD-204",
            4.8,
            List.of("Stroke Intervention", "Neuropathy", "Epileptology"),
            1400.0
        );
        doctorRepository.save(doc2);
        seedSlotsForDoctor("doc-2", "OPD-204");

        // 4. Doctor Rajesh
        UserDocument docUser3 = new UserDocument("user-doc-3", "dr.rajesh@aarogyacare.org", encodedMaster, "Dr. Rajesh Kumar", "doctor", "+91 98765 43213");
        userRepository.save(docUser3);
        DoctorDocument doc3 = new DoctorDocument(
            "doc-3",
            "user-doc-3",
            "dept-ortho",
            "MS (Ortho), M.Ch (Joints)",
            16,
            "OPD-301",
            4.9,
            List.of("Robotic Joint Replacement", "Spine Decompression", "Trauma"),
            1100.0
        );
        doctorRepository.save(doc3);
        seedSlotsForDoctor("doc-3", "OPD-301");

        // 5. Doctor Priya
        UserDocument docUser4 = new UserDocument("user-doc-4", "dr.priya@aarogyacare.org", encodedMaster, "Dr. Priya Venkatesh", "doctor", "+91 98765 43214");
        userRepository.save(docUser4);
        DoctorDocument doc4 = new DoctorDocument(
            "doc-4",
            "user-doc-4",
            "dept-pedia",
            "MD (Pediatrics), DCH",
            11,
            "OPD-105",
            4.7,
            List.of("Neonatal Critical Care", "Pediatric Allergy", "Immunology"),
            1000.0
        );
        doctorRepository.save(doc4);
        seedSlotsForDoctor("doc-4", "OPD-105");

        // 6. Receptionist
        UserDocument receptionist = new UserDocument("user-receptionist", "receptionist@aarogyacare.org", encodedMaster, "Front Desk Officer", "receptionist", "+91 98765 43215");
        userRepository.save(receptionist);

        // 7. Nurse / Triage
        UserDocument nurse = new UserDocument("user-nurse", "nurse@aarogyacare.org", encodedMaster, "Head Triage Nurse", "nurse", "+91 98765 43216");
        userRepository.save(nurse);

        // 8. Pharmacist
        UserDocument pharmacist = new UserDocument("user-pharmacist", "pharmacist@aarogyacare.org", encodedMaster, "Senior Clinical Pharmacist", "pharmacist", "+91 98765 43217");
        userRepository.save(pharmacist);

        // 9. Billing Desk (Role matches Spring Security ROLE_BILLING_STAFF)
        UserDocument billing = new UserDocument("user-billing", "billing@aarogyacare.org", encodedMaster, "Chief Billing Officer", "billing_staff", "+91 98765 43218");
        userRepository.save(billing);

        // 10. Patient Rajendran
        UserDocument patientUser = new UserDocument("user-patient-1", "patient.rajendran@aarogyacare.org", encodedMaster, "Rajendran Muthusamy", "patient", "+91 98765 43219");
        userRepository.save(patientUser);
        PatientDocument patient = new PatientDocument(
            "pat-1",
            "user-patient-1",
            "AC-2026-00101",
            "1985-06-15",
            "Male",
            "O+"
        );
        patient.setEmergencyContactName("Kavitha Rajendran");
        patient.setEmergencyContactPhone("+91 98765 43220");
        patient.setAllergies("Penicillin (Mild urticaria)");
        patient.setChronicConditions("Hypertension (Stage 1)");
        patient.setAddress("42 Anna Salai, Chennai, TN, India");
        patientRepository.save(patient);
    }

    private void seedSlotsForDoctor(String doctorId, String roomNumber) {
        String[] slotStarts = {
            "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM",
            "11:30 AM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM"
        };
        String[] slotEnds = {
            "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
            "12:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM"
        };

        for (int i = 0; i < slotStarts.length; i++) {
            String slotId = "slot-" + doctorId + "-" + (i + 1);
            DoctorSlotDocument slot = slotRepository.findById(slotId).orElse(null);
            if (slot == null) {
                slot = new DoctorSlotDocument(
                    slotId,
                    doctorId,
                    slotStarts[i],
                    slotEnds[i],
                    "AVAILABLE",
                    roomNumber
                );
                slotRepository.save(slot);
            } else {
                boolean changed = false;
                if (!"AVAILABLE".equalsIgnoreCase(slot.getStatus()) && !"BLOCKED".equalsIgnoreCase(slot.getStatus())) {
                    slot.setStatus("AVAILABLE");
                    changed = true;
                }
                if (!slotEnds[i].equals(slot.getSlotEnd())) {
                    slot.setSlotEnd(slotEnds[i]);
                    changed = true;
                }
                if (changed) {
                    slotRepository.save(slot);
                }
            }
        }
    }

    private void seedMedicines() {
        if (medicineRepository.findById("med-1").isPresent()) return;

        List<MedicineDocument> meds = List.of(
            new MedicineDocument("med-1", "MED-PCM-650", "Paracetamol 650mg", "Dolo 650", "Analgesic", "TABLET", "650mg", 32.50, 500, 50),
            new MedicineDocument("med-2", "MED-AMX-500", "Amoxicillin 500mg", "Augmentin", "Antibiotic", "CAPSULE", "500mg", 120.00, 250, 30),
            new MedicineDocument("med-3", "MED-ATV-20", "Atorvastatin 20mg", "Lipitor", "Cardiovascular", "TABLET", "20mg", 85.00, 300, 40),
            new MedicineDocument("med-4", "MED-MET-500", "Metformin 500mg", "Glucophage", "Antidiabetic", "TABLET", "500mg", 45.00, 400, 50),
            new MedicineDocument("med-5", "MED-PAN-40", "Pantoprazole 40mg", "Pan 40", "Antacid", "TABLET", "40mg", 65.00, 350, 30),
            new MedicineDocument("med-6", "MED-AZI-500", "Azithromycin 500mg", "Zithromax", "Antibiotic", "TABLET", "500mg", 110.00, 15, 20) // low stock
        );
        medicineRepository.saveAll(meds);
    }

    private void seedInitialAppointmentsAndRecords() {
        String slotId = "slot-doc-1-1";
        // Ensure slot template remains AVAILABLE; appointment collection tracks booking.
        DoctorSlotDocument slot = slotRepository.findById(slotId).orElse(null);
        if (slot != null && !"AVAILABLE".equals(slot.getStatus()) && !"BLOCKED".equals(slot.getStatus())) {
            slot.setStatus("AVAILABLE");
            slotRepository.save(slot);
        }

        AppointmentDocument apt = appointmentRepository.findById("apt-seed-1").orElse(null);
        if (apt == null) {
            apt = new AppointmentDocument(
                "apt-seed-1",
                "APT-2026-001",
                "pat-1",
                "doc-1",
                slotId,
                "Routine cardiology health checkup and hypertension review.",
                "IN_PERSON",
                "Q-101"
            );
            apt.setStatus("CONFIRMED");
            apt.setAppointmentDate(java.time.LocalDate.now().toString());
        }
        if (apt.getTriageLevel() == null) {
            apt.setCheckedInAt(java.time.Instant.now().minus(java.time.Duration.ofMinutes(50)));
            apt.setTriageLevel("ESI-3");
            apt.setVitalSigns("BP: 138/88 mmHg, Pulse: 78 bpm, SpO2: 98%, Temp: 98.4 F, RR: 16 bpm");
            apt.setTriageNotes("Patient alert, oriented x 3. Reports intermittent exertional chest discomfort.");
            apt.setTriagedBy("nurse@aarogyacare.org");
            apt.setTriagedAt(java.time.Instant.now().minus(java.time.Duration.ofMinutes(40)));
            appointmentRepository.save(apt);
        }

        // Clinical Record
        if (recordRepository.findById("rec-seed-1").isEmpty()) {
            ClinicalRecordDocument record = new ClinicalRecordDocument(
                "rec-seed-1",
                "pat-1",
                "apt-seed-1",
                "doc-1",
                "Exertional dyspnea and periodic palpitations over the last 3 weeks.",
                "BP 138/88 mmHg, Heart Rate 78 bpm regular. S1/S2 heard, no murmurs.",
                "Stage 1 Essential Hypertension with mild sinus tachycardia.",
                "Lifestyle modification, low sodium intake, aerobic exercise.",
                "Maintain twice-daily BP log. Follow up in 4 weeks.",
                "2026-11-15"
            );
            recordRepository.save(record);
        }

        // Prescription
        if (prescriptionRepository.findById("rx-seed-1").isEmpty()) {
            PrescriptionDocument.PrescriptionItem item1 = new PrescriptionDocument.PrescriptionItem(
                "med-3", "Atorvastatin 20mg", "20mg", "Once Daily at Bedtime", 30, "Take after dinner", 30
            );
            PrescriptionDocument.PrescriptionItem item2 = new PrescriptionDocument.PrescriptionItem(
                "med-5", "Pantoprazole 40mg", "40mg", "Once Daily Morning", 15, "Take empty stomach", 15
            );
            PrescriptionDocument rx = new PrescriptionDocument(
                "rx-seed-1",
                "RX-2026-001",
                "pat-1",
                "apt-seed-1",
                "doc-1",
                List.of(item1, item2)
            );
            prescriptionRepository.save(rx);
        }

        // Invoices and Reconciled Payment
        InvoiceDocument inv1 = invoiceRepository.findById("inv-seed-1").orElse(null);
        if (inv1 == null) {
            InvoiceDocument.InvoiceItem invItem1 = new InvoiceDocument.InvoiceItem("Specialist Consultation Fee", "CONSULTATION", 800.0, 1, 800.0);
            InvoiceDocument.InvoiceItem invItem2 = new InvoiceDocument.InvoiceItem("Electrocardiogram (ECG 12-Lead)", "DIAGNOSTICS", 450.0, 1, 450.0);
            inv1 = new InvoiceDocument(
                "inv-seed-1",
                "INV-2026-001",
                "pat-1",
                "apt-seed-1",
                1250.0,
                0.0,
                62.50,
                1312.50,
                List.of(invItem1, invItem2)
            );
            inv1.setStatus("PAID");
            invoiceRepository.save(inv1);
        } else if (!"PAID".equals(inv1.getStatus())) {
            inv1.setStatus("PAID");
            invoiceRepository.save(inv1);
        }

        if (paymentRepository.findById("pay-seed-1").isEmpty()) {
            PaymentDocument pay = new PaymentDocument(
                "pay-seed-1",
                "inv-seed-1",
                1312.50,
                "UPI",
                "UPI-TXN-20261020-001",
                "IDEMP-SEED-PAY-001",
                "SUCCESS"
            );
            paymentRepository.save(pay);
        }

        // Additional Pending Invoice for billing desk testing
        if (invoiceRepository.findById("inv-seed-2").isEmpty()) {
            InvoiceDocument.InvoiceItem inv2Item1 = new InvoiceDocument.InvoiceItem("Lipid Profile Complete", "DIAGNOSTICS", 500.0, 1, 500.0);
            InvoiceDocument.InvoiceItem inv2Item2 = new InvoiceDocument.InvoiceItem("Follow-up Cardiac Evaluation", "CONSULTATION", 600.0, 1, 600.0);
            InvoiceDocument inv2 = new InvoiceDocument(
                "inv-seed-2",
                "INV-2026-002",
                "pat-1",
                "apt-seed-1",
                1100.0,
                0.0,
                55.0,
                1155.0,
                List.of(inv2Item1, inv2Item2)
            );
            inv2.setStatus("PENDING");
            invoiceRepository.save(inv2);
        }

        // Laboratory Orders (Completed + In Progress)
        if (labOrderRepository.findById("lab-seed-1").isEmpty()) {
            LabOrderDocument lab1 = new LabOrderDocument(
                "lab-seed-1",
                "LAB-2026-001",
                "pat-1",
                "apt-seed-1",
                "doc-1",
                "Lipid Profile Complete",
                "BIOCHEMISTRY",
                "SERUM",
                "ROUTINE"
            );
            lab1.setStatus("COMPLETED");
            lab1.setResultValue("Total Chol: 210 mg/dL, HDL: 42 mg/dL, LDL: 138 mg/dL, Triglycerides: 160 mg/dL");
            lab1.setUnit("mg/dL");
            lab1.setReferenceRange("Total Chol < 200, HDL > 40, LDL < 100, TG < 150");
            lab1.setClinicalRemarks("Borderline hyperlipidemia noted. Lifestyle modifications recommended.");
            lab1.setTechnicianNotes("Fasting sample verified, non-hemolyzed.");
            lab1.setPerformedBy("nurse@aarogyacare.org");
            lab1.setReviewedBy("dr.ramanathan@aarogyacare.org");
            lab1.setOrderedAt(java.time.Instant.now().minus(java.time.Duration.ofHours(4)));
            lab1.setSampleCollectedAt(java.time.Instant.now().minus(java.time.Duration.ofHours(3)));
            lab1.setCompletedAt(java.time.Instant.now().minus(java.time.Duration.ofHours(1)));
            lab1.setReleasedAt(java.time.Instant.now().minus(java.time.Duration.ofMinutes(45)));
            labOrderRepository.save(lab1);
        }

        if (labOrderRepository.findById("lab-seed-2").isEmpty()) {
            LabOrderDocument lab2 = new LabOrderDocument(
                "lab-seed-2",
                "LAB-2026-002",
                "pat-1",
                "apt-seed-1",
                "doc-1",
                "Complete Blood Count (CBC)",
                "HEMATOLOGY",
                "BLOOD",
                "ROUTINE"
            );
            lab2.setStatus("SAMPLE_COLLECTED");
            lab2.setTechnicianNotes("Sample barcoded and transferred to hematology analyzer rack.");
            lab2.setOrderedAt(java.time.Instant.now().minus(java.time.Duration.ofHours(2)));
            lab2.setSampleCollectedAt(java.time.Instant.now().minus(java.time.Duration.ofMinutes(30)));
            labOrderRepository.save(lab2);
        }
    }

    private void seedEmergencyQueue() {
        if (emergencyRepository.findById("em-1").isPresent()) return;

        List<EmergencyRequestDocument> list = List.of(
            new EmergencyRequestDocument("em-1", "Kavitha R.", "pat-1", "+91 98765 43220", "RED", "Acute chest pain, diaphoresis, radiating left arm pain", "BP: 85/55, HR: 122, SpO2: 91%"),
            new EmergencyRequestDocument("em-2", "Murugan Velu", null, "+91 98765 43221", "YELLOW", "High velocity road traffic collision, right tibial deformity", "BP: 125/82, HR: 92, SpO2: 98%"),
            new EmergencyRequestDocument("em-3", "Deepa Sundar", null, "+91 98765 43222", "GREEN", "Superficial glass laceration right forearm, active bleeding controlled", "BP: 118/76, HR: 74, SpO2: 99%")
        );
        emergencyRepository.saveAll(list);
    }
    private void ensureDoctorConsultationFees() {
        Map<String, Double> knownFees = Map.of(
            "doc-1", 1200.0,
            "doc-2", 1400.0,
            "doc-3", 1100.0,
            "doc-4", 1000.0
        );
        for (Map.Entry<String, Double> entry : knownFees.entrySet()) {
            doctorRepository.findById(entry.getKey()).ifPresent(doc -> {
                if (Math.abs(doc.getConsultationFee() - entry.getValue()) > 0.001) {
                    doc.setConsultationFee(entry.getValue());
                    doctorRepository.save(doc);
                }
            });
        }
        for (DoctorDocument doc : doctorRepository.findAll()) {
            if (!knownFees.containsKey(doc.getId()) && doc.getConsultationFee() <= 0.0) {
                doc.setConsultationFee(800.0);
                doctorRepository.save(doc);
            }
        }
    }
}
