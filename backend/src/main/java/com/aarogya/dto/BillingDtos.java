package com.aarogya.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.time.Instant;
import java.util.List;

public class BillingDtos {

    public record InvoiceItemDto(
        String description,
        @JsonProperty("item_type") String itemType,
        @JsonProperty("unit_price") double unitPrice,
        int quantity,
        double total
    ) {}

    public record CreateInvoiceRequest(
        @NotBlank @JsonProperty("patient_id") String patientId,
        @JsonProperty("appointment_id") String appointmentId,
        @NotEmpty List<InvoiceItemDto> items,
        @JsonProperty("discount_amount") double discountAmount,
        @JsonProperty("tax_amount") double taxAmount
    ) {}

    public record InvoiceResponse(
        String id,
        @JsonProperty("invoice_number") String invoiceNumber,
        @JsonProperty("patient_id") String patientId,
        @JsonProperty("appointment_id") String appointmentId,
        @JsonProperty("total_amount") double totalAmount,
        @JsonProperty("discount_amount") double discountAmount,
        @JsonProperty("tax_amount") double taxAmount,
        @JsonProperty("net_payable") double netPayable,
        String status,
        List<InvoiceItemDto> items,
        @JsonProperty("created_at") Instant createdAt
    ) {}

    public record SimulatePaymentRequest(
        @NotBlank @JsonProperty("invoice_id") String invoiceId,
        @Min(1) double amount,
        @JsonProperty("payment_method") String paymentMethod,
        @JsonProperty("idempotency_key") String idempotencyKey
    ) {}

    public record PaymentResponse(
        String id,
        @JsonProperty("invoice_id") String invoiceId,
        double amount,
        @JsonProperty("payment_method") String paymentMethod,
        @JsonProperty("transaction_reference") String transactionReference,
        String status,
        @JsonProperty("created_at") Instant createdAt
    ) {}
}
