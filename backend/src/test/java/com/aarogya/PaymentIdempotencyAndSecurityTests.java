package com.aarogya;

import com.aarogya.controller.BillingController;
import com.aarogya.dto.BillingDtos;
import com.aarogya.dto.PatientDtos;
import com.aarogya.exception.Exceptions;
import com.aarogya.model.InvoiceDocument;
import com.aarogya.model.PaymentDocument;
import com.aarogya.repository.InvoiceRepository;
import com.aarogya.repository.PatientRepository;
import com.aarogya.repository.PaymentRepository;
import com.aarogya.security.UserPrincipal;
import com.aarogya.service.BillingService;
import com.aarogya.service.PatientRecordService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class PaymentIdempotencyAndSecurityTests {

    @Autowired
    private BillingController billingController;

    @Autowired
    private BillingService billingService;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private PatientRecordService patientRecordService;

    private UserPrincipal billingOfficer;
    private UserPrincipal patientAPrincipal;
    private UserPrincipal patientBPrincipal;
    private PatientDtos.PatientResponse patientA;
    private PatientDtos.PatientResponse patientB;

    @BeforeEach
    void setUp() {
        String testId = UUID.randomUUID().toString().substring(0, 8);

        billingOfficer = new UserPrincipal(
                "user-bill-" + testId,
                "billing." + testId + "@aarogyacare.org",
                "pass",
                "billing_staff",
                "Billing Cashier " + testId,
                true
        );

        // Register Patient A
        patientA = patientRecordService.registerPatient(new PatientDtos.CreatePatientRequest(
                "Pay Patient Alpha " + testId,
                "pay.alpha." + testId + "@test.org",
                "+91 98401 77001",
                "1985-05-05",
                "Male",
                "B+ Positive",
                "Chennai",
                null, null, null, null
        ), billingOfficer);

        patientAPrincipal = new UserPrincipal(
                patientRepository.findById(patientA.id()).orElseThrow().getUserId(),
                "pay.alpha." + testId + "@test.org",
                "pass",
                "patient",
                "Pay Patient Alpha " + testId,
                true
        );

        // Register Patient B
        patientB = patientRecordService.registerPatient(new PatientDtos.CreatePatientRequest(
                "Pay Patient Beta " + testId,
                "pay.beta." + testId + "@test.org",
                "+91 98401 77002",
                "1987-07-07",
                "Female",
                "O+ Positive",
                "Chennai",
                null, null, null, null
        ), billingOfficer);

        patientBPrincipal = new UserPrincipal(
                patientRepository.findById(patientB.id()).orElseThrow().getUserId(),
                "pay.beta." + testId + "@test.org",
                "pass",
                "patient",
                "Pay Patient Beta " + testId,
                true
        );
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

    private BillingDtos.InvoiceResponse createTestInvoice(String patientId, double amount) {
        BillingDtos.InvoiceItemDto item = new BillingDtos.InvoiceItemDto(
                "Diagnostic Consultation", "CONSULTATION", amount, 1, amount
        );
        return billingService.createInvoice(new BillingDtos.CreateInvoiceRequest(
                patientId, "apt-idem-" + UUID.randomUUID().toString().substring(0, 6),
                List.of(item), 0.0, 0.0
        ), billingOfficer);
    }

    @Test
    @DisplayName("DEF-06: Payment retry with exact same idempotency key returns original result without duplicate payment")
    void testPaymentRetryReusesSameIdempotencyKey() {
        authenticateAs(patientAPrincipal);

        BillingDtos.InvoiceResponse invoice = createTestInvoice(patientA.id(), 1200.0);
        String sharedKey = "idem-pay-" + UUID.randomUUID();

        // Initial payment attempt
        BillingDtos.SimulatePaymentRequest payReq = new BillingDtos.SimulatePaymentRequest(
                invoice.id(), 1200.0, "UPI", sharedKey
        );

        long paymentsBefore = paymentRepository.findAll().stream()
                .filter(p -> p.getInvoiceId().equals(invoice.id()))
                .count();

        var firstPayment = billingController.simulatePayment(payReq, sharedKey, patientAPrincipal).getBody();
        assertNotNull(firstPayment);
        assertEquals("SUCCESS", firstPayment.status());
        assertNotNull(firstPayment.transactionReference());

        long paymentsAfterFirst = paymentRepository.findAll().stream()
                .filter(p -> p.getInvoiceId().equals(invoice.id()))
                .count();
        assertEquals(paymentsBefore + 1, paymentsAfterFirst, "Initial payment must create exactly one payment record.");

        // Simulated client retry after network uncertainty (same idempotency key)
        var secondPayment = billingController.simulatePayment(payReq, sharedKey, patientAPrincipal).getBody();
        assertNotNull(secondPayment);
        assertEquals(firstPayment.id(), secondPayment.id(), "Retry with same key must return original payment ID.");
        assertEquals(firstPayment.transactionReference(), secondPayment.transactionReference(), "Transaction reference must match.");

        long paymentsAfterRetry = paymentRepository.findAll().stream()
                .filter(p -> p.getInvoiceId().equals(invoice.id()))
                .count();
        assertEquals(paymentsAfterFirst, paymentsAfterRetry, "Retry with same key must NOT create any duplicate payment records.");

        // Invoice status remains PAID
        InvoiceDocument invDb = invoiceRepository.findById(invoice.id()).orElseThrow();
        assertEquals("PAID", invDb.getStatus());
    }

    @Test
    @DisplayName("DEF-06: Submitting payment with new key on already PAID invoice throws ConflictException")
    void testPaymentWithDifferentKeyOnPaidInvoiceThrowsConflict() {
        authenticateAs(patientAPrincipal);

        BillingDtos.InvoiceResponse invoice = createTestInvoice(patientA.id(), 800.0);
        String initialKey = "idem-key-orig-" + UUID.randomUUID();

        // Pay successfully
        billingController.simulatePayment(
                new BillingDtos.SimulatePaymentRequest(invoice.id(), 800.0, "CARD", initialKey),
                initialKey,
                patientAPrincipal
        );

        // Attempt second payment with DIFFERENT key -> must throw ConflictException
        String newKey = "idem-key-second-" + UUID.randomUUID();
        assertThrows(Exceptions.ConflictException.class,
                () -> billingController.simulatePayment(
                        new BillingDtos.SimulatePaymentRequest(invoice.id(), 800.0, "CARD", newKey),
                        newKey,
                        patientAPrincipal
                ),
                "Paying an already PAID invoice with a new key must be rejected with ConflictException.");
    }

    @Test
    @DisplayName("DEF-06 Security: Attacker cannot replay another patient's idempotency key to bypass invoice ownership")
    void testCrossPatientIdempotencyReplayBlocked() {
        // Patient A pays their invoice
        authenticateAs(patientAPrincipal);
        BillingDtos.InvoiceResponse invoiceA = createTestInvoice(patientA.id(), 500.0);
        String keyA = "shared-secret-key-" + UUID.randomUUID();

        var paymentA = billingController.simulatePayment(
                new BillingDtos.SimulatePaymentRequest(invoiceA.id(), 500.0, "UPI", keyA),
                keyA,
                patientAPrincipal
        ).getBody();
        assertNotNull(paymentA);

        // Now Patient B creates their own unpaid invoice
        authenticateAs(patientBPrincipal);
        BillingDtos.InvoiceResponse invoiceB = createTestInvoice(patientB.id(), 500.0);

        // Attack 1: Patient B attempts to settle invoiceB by reusing Patient A's idempotency key (keyA)
        assertThrows(Exceptions.ConflictException.class,
                () -> billingController.simulatePayment(
                        new BillingDtos.SimulatePaymentRequest(invoiceB.id(), 500.0, "UPI", keyA),
                        keyA,
                        patientBPrincipal
                ),
                "Replaying another transaction's idempotency key on a different invoice must throw ConflictException.");

        // Attack 2: Patient B attempts to settle Patient A's invoice directly (invoiceA) using keyA -> ForbiddenException
        assertThrows(Exceptions.ForbiddenException.class,
                () -> billingController.simulatePayment(
                        new BillingDtos.SimulatePaymentRequest(invoiceA.id(), 500.0, "UPI", keyA),
                        keyA,
                        patientBPrincipal
                ),
                "Patient B must be forbidden from accessing or settling Patient A's invoice, even with the same idempotency key.");
    }
}
