package com.aarogya.controller;

import com.aarogya.dto.BillingDtos;
import com.aarogya.security.UserPrincipal;
import com.aarogya.service.BillingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/billing")
public class BillingController {

    private final BillingService billingService;

    public BillingController(BillingService billingService) {
        this.billingService = billingService;
    }

    @GetMapping("/invoices")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('BILLING_STAFF', 'RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<List<BillingDtos.InvoiceResponse>> getAllInvoices() {
        return ResponseEntity.ok(billingService.getAllInvoices());
    }

    @GetMapping("/invoices/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('PATIENT', 'BILLING_STAFF', 'RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<BillingDtos.InvoiceResponse> getInvoiceById(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(billingService.getInvoiceById(id, principal));
    }

    @PostMapping("/invoices")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('BILLING_STAFF', 'RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<BillingDtos.InvoiceResponse> createInvoice(
            @Valid @RequestBody BillingDtos.CreateInvoiceRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(billingService.createInvoice(request, principal));
    }

    @PostMapping("/payments/simulate")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('PATIENT', 'BILLING_STAFF', 'RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<BillingDtos.PaymentResponse> simulatePayment(
            @Valid @RequestBody BillingDtos.SimulatePaymentRequest request,
            @RequestHeader(required = false, name = "Idempotency-Key") String headerIdempotencyKey,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(billingService.simulatePayment(request, headerIdempotencyKey, principal));
    }
}
