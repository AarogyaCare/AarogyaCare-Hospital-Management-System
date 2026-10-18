package com.aarogya.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "inventory_transactions")
public class InventoryTransactionDocument {

    @Id
    private String id;

    @Indexed
    private String medicineId;

    private String transactionType; // "DISPENSE", "RESTOCK", "AUDIT_ADJUSTMENT"
    private int quantity;
    private int previousStock;
    private int newStock;
    private String referenceId;

    @Indexed
    private String idempotencyKey;

    private String performedBy;
    private Instant createdAt = Instant.now();

    public InventoryTransactionDocument() {}

    public InventoryTransactionDocument(String id, String medicineId, String transactionType, int quantity, int previousStock, int newStock, String referenceId, String idempotencyKey, String performedBy) {
        this.id = id;
        this.medicineId = medicineId;
        this.transactionType = transactionType;
        this.quantity = quantity;
        this.previousStock = previousStock;
        this.newStock = newStock;
        this.referenceId = referenceId;
        this.idempotencyKey = idempotencyKey;
        this.performedBy = performedBy;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getMedicineId() { return medicineId; }
    public void setMedicineId(String medicineId) { this.medicineId = medicineId; }

    public String getTransactionType() { return transactionType; }
    public void setTransactionType(String transactionType) { this.transactionType = transactionType; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public int getPreviousStock() { return previousStock; }
    public void setPreviousStock(int previousStock) { this.previousStock = previousStock; }

    public int getNewStock() { return newStock; }
    public void setNewStock(int newStock) { this.newStock = newStock; }

    public String getReferenceId() { return referenceId; }
    public void setReferenceId(String referenceId) { this.referenceId = referenceId; }

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }

    public String getPerformedBy() { return performedBy; }
    public void setPerformedBy(String performedBy) { this.performedBy = performedBy; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
