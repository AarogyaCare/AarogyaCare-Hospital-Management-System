package com.aarogya;

import com.aarogya.controller.DoctorController;
import com.aarogya.dto.BillingDtos;
import com.aarogya.model.AppointmentDocument;
import com.aarogya.model.DoctorDocument;
import com.aarogya.repository.AppointmentRepository;
import com.aarogya.repository.DoctorRepository;
import com.aarogya.security.UserPrincipal;
import com.aarogya.service.BillingService;
import com.aarogya.service.DatabaseSeedService;
import com.aarogya.service.DoctorService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class DoctorFeeAndBillingTests {

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private DoctorService doctorService;

    @Autowired
    private DoctorController doctorController;

    @Autowired
    private DatabaseSeedService seedService;

    @Autowired
    private BillingService billingService;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Test
    @DisplayName("DEF-03: Seeded doctors have explicit, consistent fees matching repository standards")
    void testSeededDoctorsHaveCorrectFees() {
        seedService.seedInitialData();

        DoctorDocument doc1 = doctorRepository.findById("doc-1").orElseThrow();
        assertEquals(1200.0, doc1.getConsultationFee(), 0.001, "Dr. Ramanathan (Cardiology) must have 1200.0 fee.");

        DoctorDocument doc2 = doctorRepository.findById("doc-2").orElseThrow();
        assertEquals(1400.0, doc2.getConsultationFee(), 0.001, "Dr. Ananya (Neurology) must have 1400.0 fee.");

        DoctorDocument doc3 = doctorRepository.findById("doc-3").orElseThrow();
        assertEquals(1100.0, doc3.getConsultationFee(), 0.001, "Dr. Rajesh (Orthopedics) must have 1100.0 fee.");

        DoctorDocument doc4 = doctorRepository.findById("doc-4").orElseThrow();
        assertEquals(1000.0, doc4.getConsultationFee(), 0.001, "Dr. Priya (Pediatrics) must have 1000.0 fee.");
    }

    @Test
    @DisplayName("DEF-03: Doctor API endpoint returns consultation_fee accurately")
    @SuppressWarnings("unchecked")
    void testDoctorApiReturnsConsultationFee() {
        seedService.seedInitialData();

        var resDoc1 = doctorController.getDoctorById("doc-1");
        assertNotNull(resDoc1.getBody());
        assertTrue(resDoc1.getBody().containsKey("consultation_fee"));
        assertEquals(1200.0, ((Number) resDoc1.getBody().get("consultation_fee")).doubleValue(), 0.001);

        var allDocs = doctorController.getAllDoctors(null, null, 50);
        assertNotNull(allDocs.getBody());
        List<Map<String, Object>> items = (List<Map<String, Object>>) allDocs.getBody().get("items");
        assertFalse(items.isEmpty());
        for (Map<String, Object> item : items) {
            assertTrue(item.containsKey("consultation_fee"), "Every doctor in the directory must expose consultation_fee.");
            double fee = ((Number) item.get("consultation_fee")).doubleValue();
            assertTrue(fee > 0.0, "Consultation fee must be positive.");
        }
    }

    @Test
    @DisplayName("DEF-03: Repeated database seeding is idempotent and preserves doctor fees")
    void testSeedingIdempotencyPreservesFees() {
        long initialCount = doctorRepository.count();

        // Run seed multiple times
        seedService.seedInitialData();
        seedService.seedInitialData();

        assertEquals(initialCount, doctorRepository.count(), "Seeding must not duplicate doctor records.");
        DoctorDocument doc1 = doctorRepository.findById("doc-1").orElseThrow();
        assertEquals(1200.0, doc1.getConsultationFee(), 0.001);
        DoctorDocument doc2 = doctorRepository.findById("doc-2").orElseThrow();
        assertEquals(1400.0, doc2.getConsultationFee(), 0.001);
    }

    @Test
    @DisplayName("DEF-03: Custom doctor fee persists and retrieves correctly")
    void testCustomDoctorFeePersistence() {
        String docId = "doc-custom-" + UUID.randomUUID().toString().substring(0, 8);
        DoctorDocument customDoc = new DoctorDocument(
                docId,
                "user-" + docId,
                "dept-cardio",
                "MBBS, MS",
                8,
                "OPD-999",
                4.9,
                List.of("General Surgery"),
                1750.0
        );
        doctorRepository.save(customDoc);

        DoctorDocument retrieved = doctorRepository.findById(docId).orElseThrow();
        assertEquals(1750.0, retrieved.getConsultationFee(), 0.001);

        Map<String, Object> apiRes = doctorService.getDoctorById(docId);
        assertEquals(1750.0, ((Number) apiRes.get("consultation_fee")).doubleValue(), 0.001);
    }

    @Test
    @DisplayName("DEF-03: Consultation fee propagates from doctor into billing invoice creation")
    void testConsultationFeePropagationIntoBilling() {
        seedService.seedInitialData();

        // Create an appointment for doc-2 (fee: 1400.0)
        String aptId = "apt-fee-test-" + UUID.randomUUID().toString().substring(0, 8);
        String aptNumber = "APT-FEE-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 6);
        AppointmentDocument apt = new AppointmentDocument(
                aptId,
                aptNumber,
                "pat-1",
                "doc-2",
                "slot-doc-2-1",
                "Neurology Consultation Review",
                "IN_PERSON",
                "Q-201"
        );
        appointmentRepository.save(apt);

        UserPrincipal billingOfficer = new UserPrincipal("user-b1", "billing@test.org", "pass", "billing", "Billing Officer", true);

        // Request invoice for aptId with CONSULTATION item with unitPrice = 0 (unspecified)
        BillingDtos.InvoiceItemDto consultationItem = new BillingDtos.InvoiceItemDto(
                "Consultation Review",
                "CONSULTATION",
                0.0, // Unspecified: should resolve from doc-2's consultation fee (1400.0)
                1,
                0.0
        );

        BillingDtos.CreateInvoiceRequest req = new BillingDtos.CreateInvoiceRequest(
                "pat-1",
                aptId,
                List.of(consultationItem),
                0.0,
                70.0 // 5% tax on 1400 = 70.0
        );

        BillingDtos.InvoiceResponse invoice = billingService.createInvoice(req, billingOfficer);
        assertNotNull(invoice);
        assertEquals(1, invoice.items().size());
        assertEquals(1400.0, invoice.items().get(0).unitPrice(), 0.001, "Consultation unit price must resolve to doc-2's fee of 1400.0");
        assertEquals(1400.0, invoice.totalAmount(), 0.001, "Total amount should match doctor consultation fee.");
        assertEquals(1470.0, invoice.netPayable(), 0.001, "Net payable should include 1400.0 + 70.0 tax.");
    }
}
