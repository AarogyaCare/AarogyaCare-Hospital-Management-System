package com.aarogya;

import com.aarogya.controller.LabController;
import com.aarogya.controller.PatientController;
import com.aarogya.dto.LabDtos;
import com.aarogya.dto.PatientDtos;
import com.aarogya.exception.Exceptions;
import com.aarogya.model.DoctorDocument;
import com.aarogya.model.PatientDocument;
import com.aarogya.repository.DoctorRepository;
import com.aarogya.repository.LabOrderRepository;
import com.aarogya.repository.PatientRepository;
import com.aarogya.security.UserPrincipal;
import com.aarogya.service.LabService;
import com.aarogya.service.PatientRecordService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class LabWorkflowAndTraceabilityTests {

    @Autowired
    private LabController labController;

    @Autowired
    private PatientController patientController;

    @Autowired
    private LabService labService;

    @Autowired
    private PatientRecordService patientRecordService;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private LabOrderRepository labOrderRepository;

    private UserPrincipal doctorPrincipal;
    private UserPrincipal patientAPrincipal;
    private UserPrincipal patientBPrincipal;
    private UserPrincipal receptionistPrincipal;

    private PatientDtos.PatientResponse patientA;
    private PatientDtos.PatientResponse patientB;
    private String testDoctorId;

    @BeforeEach
    void setUp() {
        String testId = UUID.randomUUID().toString().substring(0, 8);
        testDoctorId = "doc-lab-" + testId;

        doctorPrincipal = new UserPrincipal(
                "user-doc-lab-" + testId,
                "dr.lab." + testId + "@aarogyacare.org",
                "pass",
                "doctor",
                "Dr. Pathologist " + testId,
                true
        );

        receptionistPrincipal = new UserPrincipal(
                "user-rec-lab-" + testId,
                "rec.lab." + testId + "@aarogyacare.org",
                "pass",
                "receptionist",
                "FrontDesk Staff " + testId,
                true
        );

        // Register Patient A
        patientA = patientRecordService.registerPatient(new PatientDtos.CreatePatientRequest(
                "Patient Alpha " + testId,
                "alpha." + testId + "@test.org",
                "+91 98401 99001",
                "1990-01-01",
                "Male",
                "O+ Positive",
                "Chennai",
                null,
                null,
                null,
                null
        ), receptionistPrincipal);

        patientAPrincipal = new UserPrincipal(
                patientRepository.findById(patientA.id()).orElseThrow().getUserId(),
                "alpha." + testId + "@test.org",
                "pass",
                "patient",
                "Patient Alpha " + testId,
                true
        );

        // Register Patient B
        patientB = patientRecordService.registerPatient(new PatientDtos.CreatePatientRequest(
                "Patient Beta " + testId,
                "beta." + testId + "@test.org",
                "+91 98401 99002",
                "1992-02-02",
                "Female",
                "A+ Positive",
                "Chennai",
                null,
                null,
                null,
                null
        ), receptionistPrincipal);

        patientBPrincipal = new UserPrincipal(
                patientRepository.findById(patientB.id()).orElseThrow().getUserId(),
                "beta." + testId + "@test.org",
                "pass",
                "patient",
                "Patient Beta " + testId,
                true
        );

        // Provision Doctor Document
        doctorRepository.save(new DoctorDocument(
                testDoctorId,
                doctorPrincipal.getId(),
                "dept-pathology",
                "MD, Clinical Pathology",
                15,
                "LAB-101",
                4.9,
                List.of("Hematology", "Biochemistry"),
                800.0
        ));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateAs(UserPrincipal principal) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities())
        );
    }

    @Test
    @DisplayName("DEF-05: Doctor creates structured lab order with patient, clinician, test, category, and urgency")
    void testDoctorCreatesStructuredLabOrder() {
        authenticateAs(doctorPrincipal);

        LabDtos.CreateLabOrderRequest req = new LabDtos.CreateLabOrderRequest(
                patientA.id(),
                "apt-test-123",
                "Complete Blood Count (CBC)",
                "Hematology",
                "Whole Blood (EDTA)",
                "ROUTINE"
        );

        var response = labController.createOrder(req, doctorPrincipal);

        assertNotNull(response);
        assertEquals(201, response.getStatusCode().value());
        LabDtos.LabOrderResponse order = response.getBody();
        assertNotNull(order);
        assertNotNull(order.id());
        assertTrue(order.orderNumber().startsWith("LAB"));
        assertEquals(patientA.id(), order.patientId());
        assertEquals("Complete Blood Count (CBC)", order.testName());
        assertEquals("Hematology", order.testCategory());
        assertEquals("Whole Blood (EDTA)", order.sampleType());
        assertEquals("ROUTINE", order.urgency());
        assertEquals("ORDERED", order.status());
        assertEquals(testDoctorId, order.doctorId());
    }

    @Test
    @DisplayName("DEF-05: Lab staff updates order status and records structured results with reference range")
    void testRecordLabResultAndTraceability() {
        authenticateAs(doctorPrincipal);

        // 1. Create order
        LabDtos.CreateLabOrderRequest req = new LabDtos.CreateLabOrderRequest(
                patientA.id(),
                "apt-test-456",
                "Serum Creatinine",
                "Biochemistry",
                "Serum",
                "URGENT"
        );
        LabDtos.LabOrderResponse order = labController.createOrder(req, doctorPrincipal).getBody();
        assertNotNull(order);

        // 2. Update status to SAMPLE_COLLECTED
        var statusUpdate = new LabDtos.UpdateLabStatusRequest("SAMPLE_COLLECTED", "Serum", "Sample drawn at OPD");
        var updatedStatus = labController.updateStatus(order.id(), statusUpdate, doctorPrincipal).getBody();
        assertNotNull(updatedStatus);
        assertEquals("SAMPLE_COLLECTED", updatedStatus.status());

        // 3. Record diagnostic result
        var resultReq = new LabDtos.RecordLabResultRequest(
                "1.1",
                "mg/dL",
                "0.7 - 1.3 mg/dL",
                "Renal profile within normal physiological limits.",
                "Processed on Cobas Analyzer"
        );
        var completedOrder = labController.recordResult(order.id(), resultReq, doctorPrincipal).getBody();
        assertNotNull(completedOrder);
        assertEquals("COMPLETED", completedOrder.status());
        assertEquals("1.1", completedOrder.resultValue());
        assertEquals("mg/dL", completedOrder.unit());
        assertEquals("0.7 - 1.3 mg/dL", completedOrder.referenceRange());
        assertEquals("Renal profile within normal physiological limits.", completedOrder.clinicalRemarks());
        assertNotNull(completedOrder.completedAt());
        assertNotNull(completedOrder.releasedAt());
    }

    @Test
    @DisplayName("DEF-05: Patient can view own completed results, but pending/unreleased results remain restricted")
    void testPatientAccessToOwnLabResults() {
        authenticateAs(doctorPrincipal);

        // Order 1: Completed
        LabDtos.LabOrderResponse orderCompleted = labController.createOrder(new LabDtos.CreateLabOrderRequest(
                patientA.id(), null, "Fasting Blood Sugar", "Biochemistry", "Plasma", "ROUTINE"
        ), doctorPrincipal).getBody();
        assertNotNull(orderCompleted);
        labController.recordResult(orderCompleted.id(), new LabDtos.RecordLabResultRequest(
                "95", "mg/dL", "70 - 99 mg/dL", "Normal fasting glucose", null
        ), doctorPrincipal);

        // Order 2: In progress (SAMPLE_COLLECTED, not completed)
        LabDtos.LabOrderResponse orderPending = labController.createOrder(new LabDtos.CreateLabOrderRequest(
                patientA.id(), null, "Lipid Profile", "Biochemistry", "Serum", "ROUTINE"
        ), doctorPrincipal).getBody();
        assertNotNull(orderPending);

        // Now authenticate as Patient A
        authenticateAs(patientAPrincipal);

        // 1. Patient A views own completed order by ID -> succeeds
        var pOrder = labController.getOrderById(orderCompleted.id(), patientAPrincipal).getBody();
        assertNotNull(pOrder);
        assertEquals("95", pOrder.resultValue());

        // 2. Patient A attempting to view pending unreleased order by ID -> ForbiddenException
        assertThrows(Exceptions.ForbiddenException.class,
                () -> labController.getOrderById(orderPending.id(), patientAPrincipal),
                "Pending unreleased lab order must not be visible to patient before release.");

        // 3. Patient A views list of own orders -> only returns completed results
        var ownOrders = patientController.getMyLabOrders(patientAPrincipal).getBody();
        assertNotNull(ownOrders);
        assertTrue(ownOrders.stream().allMatch(o -> "COMPLETED".equals(o.status())),
                "Patient list must only include completed/released lab orders.");
        assertTrue(ownOrders.stream().anyMatch(o -> o.id().equals(orderCompleted.id())));
        assertFalse(ownOrders.stream().anyMatch(o -> o.id().equals(orderPending.id())));
    }

    @Test
    @DisplayName("DEF-05 IDOR Protection: Patient cannot access another patient's lab orders by ID or patient ID")
    void testCrossPatientLabOrderAccessDenied() {
        authenticateAs(doctorPrincipal);

        // Create and complete order for Patient B
        LabDtos.LabOrderResponse orderB = labController.createOrder(new LabDtos.CreateLabOrderRequest(
                patientB.id(), null, "Thyroid Stimulating Hormone (TSH)", "Endocrinology", "Serum", "ROUTINE"
        ), doctorPrincipal).getBody();
        assertNotNull(orderB);
        labController.recordResult(orderB.id(), new LabDtos.RecordLabResultRequest(
                "2.4", "uIU/mL", "0.4 - 4.0 uIU/mL", "Euthyroid", null
        ), doctorPrincipal);

        // Authenticate as Patient A
        authenticateAs(patientAPrincipal);

        // 1. Patient A attempting to get Patient B's order by ID -> ForbiddenException (HTTP 403)
        assertThrows(Exceptions.ForbiddenException.class,
                () -> labController.getOrderById(orderB.id(), patientAPrincipal),
                "Patient A must not be allowed to access Patient B's lab order by ID.");

        // 2. Patient A attempting to query Patient B's lab orders via /patients/{id}/lab-orders -> ForbiddenException
        assertThrows(Exceptions.ForbiddenException.class,
                () -> patientController.getPatientLabOrders(patientB.id(), patientAPrincipal),
                "Patient A must not be allowed to query Patient B's lab orders list.");
    }

    @Test
    @DisplayName("DEF-05: Unauthorized roles cannot create lab orders")
    void testUnauthorizedRolesBlockedFromCreatingLabOrders() {
        LabDtos.CreateLabOrderRequest req = new LabDtos.CreateLabOrderRequest(
                patientA.id(), null, "Urine Routine", "Clinical Pathology", "Urine", "ROUTINE"
        );

        // Patient attempting to create lab order -> AccessDeniedException
        authenticateAs(patientAPrincipal);
        assertThrows(AccessDeniedException.class,
                () -> labController.createOrder(req, patientAPrincipal),
                "Patient must not be permitted to create lab orders.");

        // Receptionist attempting to create lab order -> AccessDeniedException
        authenticateAs(receptionistPrincipal);
        assertThrows(AccessDeniedException.class,
                () -> labController.createOrder(req, receptionistPrincipal),
                "Receptionist must not be permitted to create lab orders.");
    }
}
