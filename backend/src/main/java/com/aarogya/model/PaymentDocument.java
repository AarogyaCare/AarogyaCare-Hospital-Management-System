package com.aarogya.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "payments")
public class PaymentDocument {

    @Id
    private String id;

    @Indexed
    private String invoiceId;

    private double amount;
    private String paymentMethod; // "UPI", "CARD", "CASH", "INSURANCE"
    private String transactionReference;

    @Indexed(unique = true)
    private String idempotencyKey;

    private String status = "SUCCESS"; // "SUCCESS", "FAILED"
    private Instant createdAt = Instant.now();

    public PaymentDocument() {}

    public PaymentDocument(String id, String invoiceId, double amount, String paymentMethod, String transactionReference, String idempotencyKey, String status) {
        this.id = id;
        this.invoiceId = invoiceId;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.transactionReference = transactionReference;
        this.idempotencyKey = idempotencyKey;
        this.status = status;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getInvoiceId() { return invoiceId; }
    public void setInvoiceId(String invoiceId) { this.invoiceId = invoiceId; }

    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getTransactionReference() { return transactionReference; }
    public void setTransactionReference(String transactionReference) { this.transactionReference = transactionReference; }

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
