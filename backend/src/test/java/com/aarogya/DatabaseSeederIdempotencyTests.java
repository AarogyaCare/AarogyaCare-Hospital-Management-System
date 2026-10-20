package com.aarogya;

import com.aarogya.model.AppointmentDocument;
import com.aarogya.model.InvoiceDocument;
import com.aarogya.model.LabOrderDocument;
import com.aarogya.model.MedicineDocument;
import com.aarogya.repository.*;
import com.aarogya.service.DatabaseSeedService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class DatabaseSeederIdempotencyTests {

    @Autowired
    private DatabaseSeedService seedService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private MedicineRepository medicineRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private LabOrderRepository labOrderRepository;

    @Test
    @DisplayName("Verify database seeding is idempotent and maintains valid entity relationships")
    void testSeederIdempotencyAndRelationships() {
        // Record initial counts
        long initialUsers = userRepository.count();
        long initialDoctors = doctorRepository.count();
        long initialPatients = patientRepository.count();
        long initialAppointments = appointmentRepository.count();
        long initialMedicines = medicineRepository.count();
        long initialInvoices = invoiceRepository.count();
        long initialPayments = paymentRepository.count();
        long initialLabs = labOrderRepository.count();

        MedicineDocument med1Before = medicineRepository.findById("med-1").orElseThrow();
        int stockBefore = med1Before.getCurrentStock();

        // Re-execute seeding multiple times
        seedService.seedInitialData();
        seedService.seedInitialData();

        // Verify counts remain identical (no duplicate records created)
        assertEquals(initialUsers, userRepository.count(), "User count should remain unchanged after repeated seeding");
        assertEquals(initialDoctors, doctorRepository.count(), "Doctor count should remain unchanged after repeated seeding");
        assertEquals(initialPatients, patientRepository.count(), "Patient count should remain unchanged after repeated seeding");
        assertEquals(initialAppointments, appointmentRepository.count(), "Appointment count should remain unchanged after repeated seeding");
        assertEquals(initialMedicines, medicineRepository.count(), "Medicine count should remain unchanged after repeated seeding");
        assertEquals(initialInvoices, invoiceRepository.count(), "Invoice count should remain unchanged after repeated seeding");
        assertEquals(initialPayments, paymentRepository.count(), "Payment count should remain unchanged after repeated seeding");
        assertEquals(initialLabs, labOrderRepository.count(), "Lab order count should remain unchanged after repeated seeding");

        // Verify inventory was never decremented
        MedicineDocument med1After = medicineRepository.findById("med-1").orElseThrow();
        assertEquals(stockBefore, med1After.getCurrentStock(), "Inventory stock must never be decremented by seeding");

        // Verify relationships and statuses
        AppointmentDocument apt = appointmentRepository.findById("apt-seed-1").orElseThrow();
        assertEquals("pat-1", apt.getPatientId());
        assertEquals("doc-1", apt.getDoctorId());
        assertEquals("CONFIRMED", apt.getStatus());
        assertNotNull(apt.getTriageLevel(), "Seeded appointment must have triage data");
        assertNotNull(apt.getVitalSigns(), "Seeded appointment must have vital signs");

        InvoiceDocument inv1 = invoiceRepository.findById("inv-seed-1").orElseThrow();
        assertEquals("pat-1", inv1.getPatientId());
        assertEquals("apt-seed-1", inv1.getAppointmentId());
        assertEquals("PAID", inv1.getStatus());

        var payments = paymentRepository.findByInvoiceId("inv-seed-1");
        assertFalse(payments.isEmpty(), "Paid invoice should have associated payment record");
        assertEquals("SUCCESS", payments.get(0).getStatus());

        LabOrderDocument lab1 = labOrderRepository.findById("lab-seed-1").orElseThrow();
        assertEquals("pat-1", lab1.getPatientId());
        assertEquals("COMPLETED", lab1.getStatus());
        assertNotNull(lab1.getResultValue());
        assertNotNull(lab1.getReleasedAt());
    }
}
