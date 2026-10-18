package com.aarogya.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "invoices")
public class InvoiceDocument {

    @Id
    private String id;

    @Indexed(unique = true)
    private String invoiceNumber;

    @Indexed
    private String patientId;

    @Indexed
    private String appointmentId;

    private double totalAmount;
    private double discountAmount;
    private double taxAmount;
    private double netPayable;

    @Indexed
    private String status = "PENDING"; // "PENDING", "PAID", "CANCELLED", "REFUNDED"

    private List<InvoiceItem> items = new ArrayList<>();
    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    public static class InvoiceItem {
        private String description;
        private String itemType; // "CONSULTATION", "PHARMACY", "DIAGNOSTICS"
        private double unitPrice;
        private int quantity;
        private double total;

        public InvoiceItem() {}

        public InvoiceItem(String description, String itemType, double unitPrice, int quantity, double total) {
            this.description = description;
            this.itemType = itemType;
            this.unitPrice = unitPrice;
            this.quantity = quantity;
            this.total = total;
        }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public String getItemType() { return itemType; }
        public void setItemType(String itemType) { this.itemType = itemType; }

        public double getUnitPrice() { return unitPrice; }
        public void setUnitPrice(double unitPrice) { this.unitPrice = unitPrice; }

        public int getQuantity() { return quantity; }
        public void setQuantity(int quantity) { this.quantity = quantity; }

        public double getTotal() { return total; }
        public void setTotal(double total) { this.total = total; }
    }

    public InvoiceDocument() {}

    public InvoiceDocument(String id, String invoiceNumber, String patientId, String appointmentId, double totalAmount, double discountAmount, double taxAmount, double netPayable, List<InvoiceItem> items) {
        this.id = id;
        this.invoiceNumber = invoiceNumber;
        this.patientId = patientId;
        this.appointmentId = appointmentId;
        this.totalAmount = totalAmount;
        this.discountAmount = discountAmount;
        this.taxAmount = taxAmount;
        this.netPayable = netPayable;
        this.status = "PENDING";
        this.items = items != null ? items : new ArrayList<>();
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public String getAppointmentId() { return appointmentId; }
    public void setAppointmentId(String appointmentId) { this.appointmentId = appointmentId; }

    public double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(double totalAmount) { this.totalAmount = totalAmount; }

    public double getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(double discountAmount) { this.discountAmount = discountAmount; }

    public double getTaxAmount() { return taxAmount; }
    public void setTaxAmount(double taxAmount) { this.taxAmount = taxAmount; }

    public double getNetPayable() { return netPayable; }
    public void setNetPayable(double netPayable) { this.netPayable = netPayable; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public List<InvoiceItem> getItems() { return items; }
    public void setItems(List<InvoiceItem> items) { this.items = items; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
