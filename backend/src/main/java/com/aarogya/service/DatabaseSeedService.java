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
    private final EmergencyRequestRepository emergencyRepository;
    private final PasswordEncoder passwordEncoder;

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
            EmergencyRequestRepository emergencyRepository,
            PasswordEncoder passwordEncoder) {
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
        this.emergencyRepository = emergencyRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostConstruct
    public void seedInitialData() {
        try {
            seedDepartmentsAndSpecializations();
            seedUsersAndProfiles();
            seedMedicines();
            seedInitialAppointmentsAndRecords();
            seedEmergencyQueue();
            logger.info("Aarogya Care synthetic database seeding completed successfully.");
        } catch (Exception ex) {
            logger.error("Error during initial synthetic database seeding", ex);
        }
    }

    private void seedDepartmentsAndSpecializations() {
        if (departmentRepository.count() > 0) return;

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
        if (userRepository.count() > 0) return;

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
            List.of("Interventional Cardiology", "Coronary Angioplasty", "Arrhythmia")
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
            List.of("Stroke Intervention", "Neuropathy", "Epileptology")
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
            List.of("Robotic Joint Replacement", "Spine Decompression", "Trauma")
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
            List.of("Neonatal Critical Care", "Pediatric Allergy", "Immunology")
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

        // 9. Billing Desk
        UserDocument billing = new UserDocument("user-billing", "billing@aarogyacare.org", encodedMaster, "Chief Billing Officer", "billing", "+91 98765 43218");
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
        String[] slotTimes = {
            "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM",
            "11:30 AM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM"
        };

        for (int i = 0; i < slotTimes.length; i++) {
            String slotId = "slot-" + doctorId + "-" + (i + 1);
            DoctorSlotDocument slot = new DoctorSlotDocument(
                slotId,
                doctorId,
                slotTimes[i],
                slotTimes[i].replace("00", "30").replace("30", "00"),
                "AVAILABLE",
                roomNumber
            );
            slotRepository.save(slot);
        }
    }

    private void seedMedicines() {
        if (medicineRepository.count() > 0) return;

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
        if (appointmentRepository.count() > 0) return;

        // Book slot 1 for doc-1
        String slotId = "slot-doc-1-1";
        DoctorSlotDocument slot = slotRepository.findById(slotId).orElse(null);
        if (slot != null) {
            slot.setStatus("BOOKED");
            slotRepository.save(slot);
        }

        AppointmentDocument apt = new AppointmentDocument(
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
        appointmentRepository.save(apt);

        // Clinical Record
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

        // Prescription
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

        // Invoice
        InvoiceDocument.InvoiceItem invItem1 = new InvoiceDocument.InvoiceItem("Specialist Consultation Fee", "CONSULTATION", 800.0, 1, 800.0);
        InvoiceDocument.InvoiceItem invItem2 = new InvoiceDocument.InvoiceItem("Electrocardiogram (ECG 12-Lead)", "DIAGNOSTICS", 450.0, 1, 450.0);
        InvoiceDocument inv = new InvoiceDocument(
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
        invoiceRepository.save(inv);
    }

    private void seedEmergencyQueue() {
        if (emergencyRepository.count() > 0) return;

        List<EmergencyRequestDocument> list = List.of(
            new EmergencyRequestDocument("em-1", "Kavitha R.", "pat-1", "+91 98765 43220", "RED", "Acute chest pain, diaphoresis, radiating left arm pain", "BP: 85/55, HR: 122, SpO2: 91%"),
            new EmergencyRequestDocument("em-2", "Murugan Velu", null, "+91 98765 43221", "YELLOW", "High velocity road traffic collision, right tibial deformity", "BP: 125/82, HR: 92, SpO2: 98%"),
            new EmergencyRequestDocument("em-3", "Deepa Sundar", null, "+91 98765 43222", "GREEN", "Superficial glass laceration right forearm, active bleeding controlled", "BP: 118/76, HR: 74, SpO2: 99%")
        );
        emergencyRepository.saveAll(list);
    }
}
