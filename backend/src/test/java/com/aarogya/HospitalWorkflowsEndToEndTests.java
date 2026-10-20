package com.aarogya;

import com.aarogya.dto.AppointmentDtos;
import com.aarogya.dto.BillingDtos;
import com.aarogya.dto.LabDtos;
import com.aarogya.dto.PatientDtos;
import com.aarogya.exception.Exceptions;
import com.aarogya.model.DoctorDocument;
import com.aarogya.model.DoctorSlotDocument;
import com.aarogya.model.PatientDocument;
import com.aarogya.repository.DoctorRepository;
import com.aarogya.repository.DoctorSlotRepository;
import com.aarogya.repository.LabOrderRepository;
import com.aarogya.repository.PatientRepository;
import com.aarogya.security.UserPrincipal;
import com.aarogya.service.AppointmentService;
import com.aarogya.service.BillingService;
import com.aarogya.service.LabService;
import com.aarogya.service.PatientRecordService;
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
public class HospitalWorkflowsEndToEndTests {

    @Autowired
    private PatientRecordService patientRecordService;

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private LabService labService;

    @Autowired
    private BillingService billingService;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private DoctorSlotRepository slotRepository;

    @Autowired
    private LabOrderRepository labOrderRepository;

    private UserPrincipal receptionistPrincipal;
    private UserPrincipal nursePrincipal;
    private UserPrincipal doctorPrincipal;
    private UserPrincipal patientPrincipal;
    private UserPrincipal otherPatientPrincipal;
    private UserPrincipal billingStaffPrincipal;

    private String testDoctorId;
    private String testSlotId;
    private String bookingDate;

    @BeforeEach
    void setUp() {
        String testId = UUID.randomUUID().toString().substring(0, 8);
        testDoctorId = "doc-wf-" + testId;
        testSlotId = "slot-wf-" + testId;
        bookingDate = LocalDate.now().plusDays(2).toString();

        String docUserId = "user-doc-" + testId;
        String patUserId = "user-pat-" + testId;
        String otherPatUserId = "user-pat2-" + testId;

        receptionistPrincipal = new UserPrincipal(
                "user-rec-" + testId,
                "reception." + testId + "@test.org",
                "pass",
                "receptionist",
                "Receptionist " + testId,
                true
        );

        nursePrincipal = new UserPrincipal(
                "user-nurse-" + testId,
                "nurse." + testId + "@test.org",
                "pass",
                "nurse",
                "Nurse Priya " + testId,
                true
        );

        doctorPrincipal = new UserPrincipal(
                docUserId,
                "doctor." + testId + "@test.org",
                "pass",
                "doctor",
                "Dr. Specialist " + testId,
                true
        );

        patientPrincipal = new UserPrincipal(
                patUserId,
                "patient." + testId + "@test.org",
                "pass",
                "patient",
                "Patient " + testId,
                true
        );

        otherPatientPrincipal = new UserPrincipal(
                otherPatUserId,
                "other." + testId + "@test.org",
                "pass",
                "patient",
                "Other Patient " + testId,
                true
        );

        billingStaffPrincipal = new UserPrincipal(
                "user-bill-" + testId,
                "billing." + testId + "@test.org",
                "pass",
                "billing_staff",
                "Cashier Manoj " + testId,
                true
        );

        // Provision Doctor and Slot
        doctorRepository.save(new DoctorDocument(
                testDoctorId,
                docUserId,
                "dept-general",
                "MD, Internal Medicine",
                10,
                "OPD-102",
                4.8,
                List.of("General Medicine")
        ));

        slotRepository.save(new DoctorSlotDocument(
                testSlotId,
                testDoctorId,
                "09:00 AM",
                "09:30 AM",
                "AVAILABLE",
                "OPD-102"
        ));
    }

    @Test
    @DisplayName("Complete Patient Registration, Walk-in Queueing & Unique Token Issuance")
    void testReceptionWalkinAndTokenWorkflow() {
        // 1. Receptionist registers a new walk-in patient
        String randomSuffix = UUID.randomUUID().toString().substring(0, 8);
        PatientDtos.CreatePatientRequest createReq = new PatientDtos.CreatePatientRequest(
                "Sundar Pichai",
                "sundar." + randomSuffix + "@test.org",
                "+91 98401 11223",
                "1972-06-10",
                "Male",
                "O+ Positive",
                "Adyar, Chennai",
                "None",
                "None",
                "Anjali",
                "+91 98401 11224"
        );
        PatientDtos.PatientResponse registeredPatient = patientRecordService.registerPatient(createReq, receptionistPrincipal);
        assertNotNull(registeredPatient.id());
        assertNotNull(registeredPatient.uhid());
        assertTrue(registeredPatient.uhid().startsWith("AC-"));
        assertEquals("Sundar Pichai", registeredPatient.name());

        // 2. Receptionist books walk-in appointment directly with patientId
        AppointmentDtos.BookAppointmentRequest bookReq = new AppointmentDtos.BookAppointmentRequest(
                testSlotId,
                "Walk-in Routine Physical Checkup",
                "IN_PERSON",
                bookingDate,
                registeredPatient.id()
        );
        AppointmentDtos.AppointmentResponse bookedApt = appointmentService.bookAppointment(receptionistPrincipal, bookReq, "idemp-rec-" + UUID.randomUUID());

        assertNotNull(bookedApt);
        assertEquals(registeredPatient.id(), bookedApt.patientId());
        assertEquals(testDoctorId, bookedApt.doctorId());
        assertNotNull(bookedApt.queueToken());
        assertEquals("CONFIRMED", bookedApt.status());
    }

    @Test
    @DisplayName("Nurse Triage Persistence: Vitals, Acuity Level, Staff Attribution & Timestamps")
    void testNurseTriagePersistenceWorkflow() {
        // 1. Register patient and book appointment
        String randomSuffix = UUID.randomUUID().toString().substring(0, 8);
        PatientDtos.PatientResponse patient = patientRecordService.registerPatient(new PatientDtos.CreatePatientRequest(
                "Triage Patient", "triage." + randomSuffix + "@test.org", "+91 98402 33445", "1985-04-12", "Female", "B+ Positive",
                "T. Nagar, Chennai", "Sulfa", "Asthma", null, null
        ), receptionistPrincipal);

        AppointmentDtos.BookAppointmentRequest bookReq = new AppointmentDtos.BookAppointmentRequest(
                testSlotId, "Sudden Palpitations", "IN_PERSON", bookingDate, patient.id()
        );
        AppointmentDtos.AppointmentResponse apt = appointmentService.bookAppointment(receptionistPrincipal, bookReq, "idemp-apt-" + UUID.randomUUID());

        // 2. Nurse records triage vitals and observations
        String vitalsStr = "BP: 135/88 mmHg | SpO2: 97% | HR: 86 bpm | Temp: 99.1°F | RR: 18/min";
        AppointmentDtos.RecordTriageRequest triageReq = new AppointmentDtos.RecordTriageRequest(
                "ESI-2",
                vitalsStr,
                "Patient alert, mild diaphoresis, peripheral pulses intact."
        );
        AppointmentDtos.AppointmentResponse triagedApt = appointmentService.recordTriage(apt.id(), triageReq, nursePrincipal);

        // 3. Verify triage persistence
        assertEquals("ESI-2", triagedApt.triageLevel());
        assertEquals(vitalsStr, triagedApt.vitalSigns());
        assertEquals("Patient alert, mild diaphoresis, peripheral pulses intact.", triagedApt.triageNotes());
        assertEquals(nursePrincipal.getUsername(), triagedApt.triagedBy());
        assertNotNull(triagedApt.triagedAt());

        // 4. Verify doctor retrieving appointment sees the triage vitals
        AppointmentDtos.AppointmentResponse doctorView = appointmentService.getAppointmentById(apt.id(), doctorPrincipal);
        assertEquals("ESI-2", doctorView.triageLevel());
        assertEquals(vitalsStr, doctorView.vitalSigns());
        assertEquals(nursePrincipal.getUsername(), doctorView.triagedBy());
    }

    @Test
    @DisplayName("Laboratory Complete Lifecycle: Order -> Status Transitions -> Result Entry -> Release Authorization")
    void testLaboratoryCompleteWorkflow() {
        // 1. Create Patient using patientPrincipal credentials
        PatientDtos.PatientResponse patient = patientRecordService.registerPatient(new PatientDtos.CreatePatientRequest(
                patientPrincipal.getFullName(), patientPrincipal.getUsername(), "+91 98403 44556", "1992-09-20", "Male", "A+ Positive",
                "Velachery, Chennai", "None", "None", null, null
        ), receptionistPrincipal);

        UserPrincipal actualPatientPrincipal = new UserPrincipal(
                patient.userId(),
                patient.email(),
                "pass",
                "patient",
                patient.name(),
                true
        );

        // 2. Doctor orders diagnostic laboratory investigation
        LabDtos.CreateLabOrderRequest orderReq = new LabDtos.CreateLabOrderRequest(
                patient.id(),
                "apt-dummy-123",
                "Complete Blood Count (CBC)",
                "Hematology",
                "Blood",
                "ROUTINE"
        );
        LabDtos.LabOrderResponse order = labService.createOrder(orderReq, doctorPrincipal);

        assertNotNull(order.id());
        assertNotNull(order.orderNumber());
        assertEquals("ORDERED", order.status());
        assertNull(order.resultValue()); // Result NOT fabricated before actual test entry

        // 3. Patient views their lab orders: should be EMPTY because test results are not yet released
        List<LabDtos.LabOrderResponse> patientViewBeforeRelease = labService.getOrdersByPatient(patient.id(), actualPatientPrincipal);
        assertTrue(patientViewBeforeRelease.isEmpty(), "Unreleased/pending lab orders must not be visible to patients");

        // 4. Lab Technician collects sample and moves to analysis
        labService.updateOrderStatus(order.id(), new LabDtos.UpdateLabStatusRequest("SAMPLE_COLLECTED", "Blood", "Sample received in EDTA tube"), nursePrincipal);
        labService.updateOrderStatus(order.id(), new LabDtos.UpdateLabStatusRequest("IN_ANALYSIS", "Blood", "Processing in automated analyzer"), nursePrincipal);

        // 5. Pathologist enters verified laboratory results
        LabDtos.RecordLabResultRequest resultReq = new LabDtos.RecordLabResultRequest(
                "14.5",
                "g/dL",
                "13.0 - 17.0 g/dL",
                "Hemoglobin normal. Platelet count 250,000/uL. Normal morphology.",
                "Verified by hematology lab"
        );
        LabDtos.LabOrderResponse completedOrder = labService.recordResult(order.id(), resultReq, doctorPrincipal);

        assertEquals("COMPLETED", completedOrder.status());
        assertEquals("14.5", completedOrder.resultValue());
        assertEquals("g/dL", completedOrder.unit());
        assertEquals("13.0 - 17.0 g/dL", completedOrder.referenceRange());
        assertNotNull(completedOrder.completedAt());
        assertEquals(doctorPrincipal.getFullName(), completedOrder.reviewedBy());

        // 6. Patient now views lab orders: COMPLETED released result IS visible
        List<LabDtos.LabOrderResponse> patientViewAfterRelease = labService.getOrdersByPatient(patient.id(), actualPatientPrincipal);
        assertEquals(1, patientViewAfterRelease.size());
        assertEquals("14.5", patientViewAfterRelease.get(0).resultValue());
        assertEquals("COMPLETED", patientViewAfterRelease.get(0).status());
    }

    @Test
    @DisplayName("Billing: Billable Invoice Generation, Amount Validation, Duplicate Protection & Ownership Control")
    void testBillingInvoiceAndPaymentWorkflow() {
        // 1. Create Patient using patientPrincipal credentials
        PatientDtos.PatientResponse patient = patientRecordService.registerPatient(new PatientDtos.CreatePatientRequest(
                patientPrincipal.getFullName(), patientPrincipal.getUsername(), "+91 98404 55667", "1980-01-15", "Female", "AB+ Positive",
                "Anna Nagar, Chennai", "None", "None", null, null
        ), receptionistPrincipal);

        UserPrincipal actualPatientPrincipal = new UserPrincipal(
                patient.userId(),
                patient.email(),
                "pass",
                "patient",
                patient.name(),
                true
        );

        // Register other patient for authorization check
        PatientDtos.PatientResponse otherPatient = patientRecordService.registerPatient(new PatientDtos.CreatePatientRequest(
                otherPatientPrincipal.getFullName(), otherPatientPrincipal.getUsername(), "+91 98404 99999", "1982-02-20", "Male", "O+ Positive",
                "Mylapore, Chennai", "None", "None", null, null
        ), receptionistPrincipal);

        UserPrincipal actualOtherPatientPrincipal = new UserPrincipal(
                otherPatient.userId(),
                otherPatient.email(),
                "pass",
                "patient",
                otherPatient.name(),
                true
        );

        // 2. Authorized billing staff creates itemized invoice for billable services
        BillingDtos.CreateInvoiceRequest invReq = new BillingDtos.CreateInvoiceRequest(
                patient.id(),
                "apt-bill-999",
                List.of(
                        new BillingDtos.InvoiceItemDto("Specialist OPD Consultation", "CONSULTATION", 500.0, 1, 500.0),
                        new BillingDtos.InvoiceItemDto("Automated CBC Profile", "LABORATORY", 350.0, 1, 350.0)
                ),
                50.0, // discount
                25.0  // tax
        );
        BillingDtos.InvoiceResponse invoice = billingService.createInvoice(invReq, billingStaffPrincipal);

        // Subtotal = 500 + 350 = 850. Net = 850 - 50 + 25 = 825.
        assertEquals(850.0, invoice.totalAmount());
        assertEquals(825.0, invoice.netPayable());
        assertEquals("PENDING", invoice.status());

        // 3. Prevent underpayment: Paying less than net payable must be rejected
        BillingDtos.SimulatePaymentRequest underpaymentReq = new BillingDtos.SimulatePaymentRequest(
                invoice.id(),
                500.0, // insufficient amount
                "Cash Desk",
                "idemp-under-" + UUID.randomUUID()
        );
        assertThrows(Exceptions.BadRequestException.class, () ->
                billingService.simulatePayment(underpaymentReq, null, billingStaffPrincipal)
        );

        // 4. Unauthorized patient ownership check: Other patient cannot settle this invoice
        BillingDtos.SimulatePaymentRequest validPayReq = new BillingDtos.SimulatePaymentRequest(
                invoice.id(),
                825.0,
                "Cash Desk",
                "idemp-pay-" + UUID.randomUUID()
        );
        assertThrows(Exceptions.ForbiddenException.class, () ->
                billingService.simulatePayment(validPayReq, null, actualOtherPatientPrincipal)
        );

        // 5. Successful payment settlement by authorized staff
        BillingDtos.PaymentResponse payment = billingService.simulatePayment(validPayReq, null, billingStaffPrincipal);
        assertEquals("SUCCESS", payment.status());
        assertEquals(825.0, payment.amount());

        // 6. Verify invoice status updated to PAID
        BillingDtos.InvoiceResponse paidInvoice = billingService.getInvoiceById(invoice.id());
        assertEquals("PAID", paidInvoice.status());

        // 7. Duplicate Payment Protection: Paying an already paid invoice must be rejected
        assertThrows(Exceptions.ConflictException.class, () ->
                billingService.simulatePayment(new BillingDtos.SimulatePaymentRequest(
                        invoice.id(),
                        825.0,
                        "POS Terminal",
                        "idemp-dup-" + UUID.randomUUID()
                ), null, billingStaffPrincipal)
        );
    }
}
