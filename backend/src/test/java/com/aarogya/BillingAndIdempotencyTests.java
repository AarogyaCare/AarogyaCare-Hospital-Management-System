package com.aarogya;

import com.aarogya.dto.BillingDtos;
import com.aarogya.model.InvoiceDocument;
import com.aarogya.repository.InvoiceRepository;
import com.aarogya.security.UserPrincipal;
import com.aarogya.service.BillingService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class BillingAndIdempotencyTests {

    @Autowired
    private BillingService billingService;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Test
    @DisplayName("Verify invoice creation with correct net payable calculation and status PENDING")
    void testCreateInvoice() {
        UserPrincipal billingOfficer = new UserPrincipal("user-b1", "billing@test.org", "pass", "billing", "Billing Officer", true);

        BillingDtos.InvoiceItemDto item1 = new BillingDtos.InvoiceItemDto("Consultation", "CONSULTATION", 500.0, 1, 500.0);
        BillingDtos.InvoiceItemDto item2 = new BillingDtos.InvoiceItemDto("ECG", "DIAGNOSTICS", 300.0, 1, 300.0);

        BillingDtos.CreateInvoiceRequest req = new BillingDtos.CreateInvoiceRequest(
            "pat-test-1",
            "apt-test-1",
            List.of(item1, item2),
            50.0,  // discount
            40.0   // tax
        );

        var invoice = billingService.createInvoice(req, billingOfficer);
        assertNotNull(invoice);
        assertNotNull(invoice.invoiceNumber());
        assertEquals(800.0, invoice.totalAmount());
        assertEquals(50.0, invoice.discountAmount());
        assertEquals(40.0, invoice.taxAmount());
        assertEquals(790.0, invoice.netPayable());
        assertEquals("PENDING", invoice.status());
    }

    @Test
    @DisplayName("Verify simulated payment updates invoice status to PAID and enforces idempotency")
    void testPaymentSimulationAndIdempotency() {
        UserPrincipal cashier = new UserPrincipal("user-c1", "cashier@test.org", "pass", "billing", "Cashier", true);

        BillingDtos.InvoiceItemDto item = new BillingDtos.InvoiceItemDto("Consultation", "CONSULTATION", 600.0, 1, 600.0);
        BillingDtos.CreateInvoiceRequest invReq = new BillingDtos.CreateInvoiceRequest(
            "pat-test-2",
            "apt-test-2",
            List.of(item),
            0.0,
            30.0
        );
        var inv = billingService.createInvoice(invReq, cashier);

        String idempotencyKey = "pay-key-" + UUID.randomUUID();
        BillingDtos.SimulatePaymentRequest payReq = new BillingDtos.SimulatePaymentRequest(
            inv.id(),
            630.0,
            "UPI",
            idempotencyKey
        );

        var firstPayment = billingService.simulatePayment(payReq, idempotencyKey, cashier);
        assertNotNull(firstPayment);
        assertEquals("SUCCESS", firstPayment.status());
        assertNotNull(firstPayment.transactionReference());

        // Verify invoice is marked PAID
        InvoiceDocument updatedInv = invoiceRepository.findById(inv.id()).orElseThrow();
        assertEquals("PAID", updatedInv.getStatus());

        // Retrying payment with exact same idempotency key
        var secondPayment = billingService.simulatePayment(payReq, idempotencyKey, cashier);
        assertNotNull(secondPayment);
        assertEquals(firstPayment.id(), secondPayment.id(), "Idempotent payment retry must return exact same payment ID.");
        assertEquals(firstPayment.transactionReference(), secondPayment.transactionReference());
    }

    @Test
    @DisplayName("Billing Invariant: Paying an already PAID invoice with a new key throws ConflictException")
    void testDoublePaymentWithDifferentKeyThrowsConflict() {
        UserPrincipal cashier = new UserPrincipal("user-c2", "cashier2@test.org", "pass", "billing", "Cashier", true);
        BillingDtos.InvoiceItemDto item = new BillingDtos.InvoiceItemDto("Consultation", "CONSULTATION", 400.0, 1, 400.0);
        BillingDtos.CreateInvoiceRequest invReq = new BillingDtos.CreateInvoiceRequest(
            "pat-test-double-pay",
            "apt-test-double-pay",
            List.of(item),
            0.0,
            0.0
        );
        var inv = billingService.createInvoice(invReq, cashier);

        // 1st payment succeeds
        String keyFirst = "key-first-" + UUID.randomUUID();
        String keySecond = "key-second-" + UUID.randomUUID();
        var p1 = billingService.simulatePayment(
            new BillingDtos.SimulatePaymentRequest(inv.id(), 400.0, "CARD", keyFirst),
            keyFirst,
            cashier
        );
        assertEquals("SUCCESS", p1.status(), "First payment must succeed.");

        // Verify invoice is now PAID
        InvoiceDocument invDb = invoiceRepository.findById(inv.id()).orElseThrow();
        assertEquals("PAID", invDb.getStatus(), "Invoice must be PAID after first payment.");

        // 2nd payment with different idempotency key must be rejected with ConflictException
        assertThrows(com.aarogya.exception.Exceptions.ConflictException.class, () ->
            billingService.simulatePayment(
                new BillingDtos.SimulatePaymentRequest(inv.id(), 400.0, "CARD", keySecond),
                keySecond,
                cashier
            )
        );
    }

    @Test
    @DisplayName("Billing Invariant: Payment amount less than net payable throws BadRequestException")
    void testUnderpaymentThrowsBadRequest() {
        UserPrincipal cashier = new UserPrincipal("user-c3", "cashier3@test.org", "pass", "billing", "Cashier", true);
        BillingDtos.InvoiceItemDto item = new BillingDtos.InvoiceItemDto("Surgery", "PROCEDURE", 5000.0, 1, 5000.0);
        BillingDtos.CreateInvoiceRequest invReq = new BillingDtos.CreateInvoiceRequest(
            "pat-test-underpay",
            "apt-test-underpay",
            List.of(item),
            0.0,
            0.0
        );
        var inv = billingService.createInvoice(invReq, cashier);

        // Attempting to pay only 2000.0 against 5000.0 net payable
        assertThrows(com.aarogya.exception.Exceptions.BadRequestException.class, () ->
            billingService.simulatePayment(
                new BillingDtos.SimulatePaymentRequest(inv.id(), 2000.0, "CASH", "key-underpay"),
                "key-underpay",
                cashier
            )
        );
    }
}

