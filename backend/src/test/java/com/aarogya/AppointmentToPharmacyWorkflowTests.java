package com.aarogya;

import com.aarogya.dto.AppointmentDtos;
import com.aarogya.dto.PharmacyDtos;
import com.aarogya.dto.PrescriptionDtos;
import com.aarogya.exception.Exceptions;
import com.aarogya.model.DoctorDocument;
import com.aarogya.model.DoctorSlotDocument;
import com.aarogya.model.MedicineDocument;
import com.aarogya.model.PatientDocument;
import com.aarogya.repository.DoctorRepository;
import com.aarogya.repository.DoctorSlotRepository;
import com.aarogya.repository.MedicineRepository;
import com.aarogya.repository.PatientRepository;
import com.aarogya.security.UserPrincipal;
import com.aarogya.service.AppointmentService;
import com.aarogya.service.PatientRecordService;
import com.aarogya.service.PharmacyService;
import com.aarogya.systemdesign.cache.CacheService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class AppointmentToPharmacyWorkflowTests {

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private PatientRecordService recordService;

    @Autowired
    private PharmacyService pharmacyService;

    @Autowired
    private DoctorSlotRepository slotRepository;

    @Autowired
    private MedicineRepository medicineRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private CacheService cacheService;

    private UserPrincipal patientPrincipal;
    private UserPrincipal doctorPrincipal;
    private UserPrincipal pharmacistPrincipal;

    private String testDoctorId;
    private String testSlotId;
    private String testMedicineId;
    private String bookingDate;

    @BeforeEach
    void setUp() {
        String testId = UUID.randomUUID().toString().substring(0, 8);
        testDoctorId = "doc-wf-" + testId;
        testSlotId = "slot-wf-" + testId;
        testMedicineId = "med-wf-" + testId;
        bookingDate = LocalDate.now().plusDays(3).toString();

        String patientUserId = "user-pat-wf-" + testId;
        String doctorUserId = "user-doc-wf-" + testId;

        patientPrincipal = new UserPrincipal(
                patientUserId,
                "patient." + testId + "@test.org",
                "pass",
                "patient",
                "Workflow Patient " + testId,
                true
        );

        doctorPrincipal = new UserPrincipal(
                doctorUserId,
                "doctor." + testId + "@test.org",
                "pass",
                "doctor",
                "Dr. Workflow Specialist " + testId,
                true
        );

        pharmacistPrincipal = new UserPrincipal(
                "user-pharm-wf-" + testId,
                "pharmacist." + testId + "@test.org",
                "pass",
                "pharmacist",
                "Workflow Pharmacist " + testId,
                true
        );

        // Provision Doctor, Slot, Patient, Medicine
        doctorRepository.save(new DoctorDocument(
                testDoctorId,
                doctorUserId,
                "dept-cardio",
                "MD, Cardiology",
                12,
                "OPD-401",
                4.9,
                List.of("Cardiology")
        ));

        patientRepository.save(new PatientDocument(
                "pat-wf-" + testId,
                patientUserId,
                "AC-WF-" + testId,
                "1990-01-01",
                "Male",
                "B+"
        ));

        slotRepository.save(new DoctorSlotDocument(
                testSlotId,
                testDoctorId,
                "10:00 AM",
                "10:30 AM",
                "AVAILABLE",
                "OPD-401"
        ));

        medicineRepository.save(new MedicineDocument(
                testMedicineId,
                "MED-WF-" + testId,
                "Workflow Cefixime " + testId,
                "Cefi-200",
                "Antibiotic",
                "TABLET",
                "200mg",
                45.0,
                50, // Initial stock 50
                10
        ));
    }

    @Test
    @DisplayName("End-to-End Workflow: Booking -> Consultation -> E-Rx -> Queue -> Dispensing -> Cache Invalidation")
    void testCompleteAppointmentToPharmacyWorkflow() {
        // Step 1: Patient books an appointment
        AppointmentDtos.BookAppointmentRequest bookReq = new AppointmentDtos.BookAppointmentRequest(
                testSlotId,
                "Persistent cough and fever",
                "IN_PERSON",
                bookingDate
        );
        AppointmentDtos.AppointmentResponse bookedApt = appointmentService.bookAppointment(
                patientPrincipal,
                bookReq,
                "wf-book-key-" + UUID.randomUUID()
        );

        assertNotNull(bookedApt);
        assertNotNull(bookedApt.id());
        assertEquals("CONFIRMED", bookedApt.status());
        assertEquals(bookingDate, bookedApt.appointmentDate(), "Appointment date must match booked date.");
        assertNotNull(bookedApt.queueToken());

        // Verify duplicate booking prevention on the same slot
        assertThrows(Exceptions.ConflictException.class, () -> {
            appointmentService.bookAppointment(
                    patientPrincipal,
                    bookReq,
                    "wf-book-key-duplicate"
            );
        }, "Booking an already booked slot must fail with ConflictException.");

        // Step 2: Doctor consultation - add clinical notes
        AppointmentDtos.ClinicalNoteRequest noteReq = new AppointmentDtos.ClinicalNoteRequest(
                "Persistent productive cough x 5 days",
                "Bilateral wheezing, Temp 100.4 F, SpO2 97%",
                "Acute Bronchitis (J20.9)",
                "Oral antibiotics, hydration, rest",
                "Patient advised to avoid cold allergens. Follow up in 7 days.",
                LocalDate.now().plusDays(7).toString()
        );
        AppointmentDtos.ClinicalNoteResponse savedNote = recordService.addClinicalNote(
                bookedApt.id(),
                noteReq,
                doctorPrincipal
        );

        assertNotNull(savedNote);
        assertEquals("Acute Bronchitis (J20.9)", savedNote.diagnosis());
        assertEquals(bookedApt.id(), savedNote.appointmentId());

        // Step 3: Doctor issues E-Prescription
        PrescriptionDtos.PrescriptionCreateRequest rxReq = new PrescriptionDtos.PrescriptionCreateRequest(
                List.of(
                        new PrescriptionDtos.PrescriptionItemDto(
                                testMedicineId,
                                "Workflow Cefixime 200mg",
                                "200mg",
                                "Twice daily (1-0-1)",
                                5,
                                "Take after meals",
                                10 // Quantity to dispense: 10
                        )
                )
        );
        PrescriptionDtos.PrescriptionResponse createdRx = recordService.createPrescription(
                bookedApt.id(),
                rxReq,
                doctorPrincipal
        );

        assertNotNull(createdRx);
        assertNotNull(createdRx.id());
        assertEquals("ISSUED", createdRx.status());
        assertEquals(1, createdRx.items().size());
        assertEquals(10, createdRx.items().get(0).quantity());

        // Step 4: Doctor marks consultation as completed
        AppointmentDtos.AppointmentResponse updatedApt = appointmentService.updateAppointmentStatus(
                bookedApt.id(),
                "COMPLETED",
                doctorPrincipal
        );
        assertEquals("COMPLETED", updatedApt.status());

        // Step 5: Pharmacist checks dispensing queue
        List<PrescriptionDtos.PrescriptionResponse> queue = recordService.getAllPrescriptions("ISSUED");
        assertTrue(queue.stream().anyMatch(p -> p.id().equals(createdRx.id())), "Prescription must appear in ISSUED queue.");

        // Seed a cache entry to verify invalidation
        cacheService.set("pharmacy:inventory", "mock-cached-inventory", java.time.Duration.ofMinutes(5));
        assertNotNull(cacheService.get("pharmacy:inventory", String.class));

        // Step 6: Pharmacist dispenses prescription
        PrescriptionDtos.PrescriptionResponse dispensedRx = pharmacyService.dispensePrescription(
                createdRx.id(),
                "dispense-key-" + UUID.randomUUID(),
                pharmacistPrincipal
        );

        assertNotNull(dispensedRx);
        assertEquals("DISPENSED", dispensedRx.status());

        // Verify atomic inventory decrement (50 initial - 10 dispensed = 40)
        MedicineDocument updatedMed = medicineRepository.findById(testMedicineId).orElseThrow();
        assertEquals(40, updatedMed.getCurrentStock(), "Inventory stock must be decremented by exactly 10 units.");

        // Verify Redis cache was evicted
        assertNull(cacheService.get("pharmacy:inventory", String.class), "Cache must be invalidated upon successful dispensing.");

        // Step 7: Duplicate dispensing protection
        assertThrows(Exceptions.ConflictException.class, () -> {
            pharmacyService.dispensePrescription(
                    createdRx.id(),
                    null,
                    pharmacistPrincipal
            );
        }, "Attempting to dispense an already-dispensed prescription must throw ConflictException.");

        // Step 8: Patient checks prescription history
        List<PrescriptionDtos.PrescriptionResponse> patientRxs = recordService.getPrescriptionsByPatient(bookedApt.patientId());
        assertFalse(patientRxs.isEmpty());
        PrescriptionDtos.PrescriptionResponse patientRx = patientRxs.stream()
                .filter(p -> p.id().equals(createdRx.id()))
                .findFirst()
                .orElseThrow();
        assertEquals("DISPENSED", patientRx.status());
    }

    @Test
    @DisplayName("Stock Protection: Insufficient stock triggers ConflictException and rolls back previous item decrements")
    void testInsufficientStockRejectionAndRollback() {
        // Create 2 medicines: medA has 20 in stock, medB has only 2 in stock
        String uid = UUID.randomUUID().toString().substring(0, 8);
        String medAId = "med-rollback-a-" + uid;
        String medBId = "med-rollback-b-" + uid;

        medicineRepository.save(new MedicineDocument(medAId, "MED-RBA-" + uid, "Rollback Drug A", "Drug A", "Analgesic", "TABLET", "500mg", 10.0, 20, 5));
        medicineRepository.save(new MedicineDocument(medBId, "MED-RBB-" + uid, "Rollback Drug B", "Drug B", "Antibiotic", "CAPSULE", "250mg", 50.0, 2, 5));

        // Book appointment
        String slotId = "slot-rb-" + UUID.randomUUID();
        slotRepository.save(new DoctorSlotDocument(slotId, testDoctorId, "03:00 PM", "03:30 PM", "AVAILABLE", "OPD-401"));

        AppointmentDtos.AppointmentResponse apt = appointmentService.bookAppointment(
                patientPrincipal,
                new AppointmentDtos.BookAppointmentRequest(slotId, "Fever", "IN_PERSON", bookingDate),
                null
        );

        // Prescription requests 10 of medA (available) and 10 of medB (only 2 available -> conflict!)
        PrescriptionDtos.PrescriptionCreateRequest rxReq = new PrescriptionDtos.PrescriptionCreateRequest(
                List.of(
                        new PrescriptionDtos.PrescriptionItemDto(medAId, "Rollback Drug A", "500mg", "Once", 10, "instructions", 10),
                        new PrescriptionDtos.PrescriptionItemDto(medBId, "Rollback Drug B", "250mg", "Twice", 5, "instructions", 10)
                )
        );
        PrescriptionDtos.PrescriptionResponse rx = recordService.createPrescription(apt.id(), rxReq, doctorPrincipal);

        // Attempt dispensing -> should fail on medB and rollback medA
        Exceptions.ConflictException ex = assertThrows(Exceptions.ConflictException.class, () -> {
            pharmacyService.dispensePrescription(rx.id(), null, pharmacistPrincipal);
        });

        assertTrue(ex.getMessage().contains("Insufficient stock"));

        // Verify medA stock was rolled back to 20
        MedicineDocument currentMedA = medicineRepository.findById(medAId).orElseThrow();
        assertEquals(20, currentMedA.getCurrentStock(), "Med A stock must be rolled back to 20 after multi-item failure.");

        // Verify medB stock remains 2
        MedicineDocument currentMedB = medicineRepository.findById(medBId).orElseThrow();
        assertEquals(2, currentMedB.getCurrentStock(), "Med B stock must remain untouched.");

        // Verify prescription status remains ISSUED
        var currentRx = recordService.getAllPrescriptions("ISSUED").stream().filter(p -> p.id().equals(rx.id())).findFirst();
        assertTrue(currentRx.isPresent());
    }
}
