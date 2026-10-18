package com.aarogya.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "prescriptions")
public class PrescriptionDocument {

    @Id
    private String id;

    @Indexed(unique = true)
    private String prescriptionNumber;

    @Indexed
    private String patientId;

    @Indexed
    private String appointmentId;

    @Indexed
    private String doctorId;

    @Indexed
    private String status = "ISSUED"; // "ISSUED", "DISPENSED", "PARTIALLY_DISPENSED", "CANCELLED"

    private List<PrescriptionItem> items = new ArrayList<>();
    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    public static class PrescriptionItem {
        private String medicineId;
        private String medicineName;
        private String dosage;
        private String frequency;
        private int durationDays;
        private String instructions;
        private int quantity;

        public PrescriptionItem() {}

        public PrescriptionItem(String medicineId, String medicineName, String dosage, String frequency, int durationDays, String instructions, int quantity) {
            this.medicineId = medicineId;
            this.medicineName = medicineName;
            this.dosage = dosage;
            this.frequency = frequency;
            this.durationDays = durationDays;
            this.instructions = instructions;
            this.quantity = quantity;
        }

        public String getMedicineId() { return medicineId; }
        public void setMedicineId(String medicineId) { this.medicineId = medicineId; }

        public String getMedicineName() { return medicineName; }
        public void setMedicineName(String medicineName) { this.medicineName = medicineName; }

        public String getDosage() { return dosage; }
        public void setDosage(String dosage) { this.dosage = dosage; }

        public String getFrequency() { return frequency; }
        public void setFrequency(String frequency) { this.frequency = frequency; }

        public int getDurationDays() { return durationDays; }
        public void setDurationDays(int durationDays) { this.durationDays = durationDays; }

        public String getInstructions() { return instructions; }
        public void setInstructions(String instructions) { this.instructions = instructions; }

        public int getQuantity() { return quantity; }
        public void setQuantity(int quantity) { this.quantity = quantity; }
    }

    public PrescriptionDocument() {}

    public PrescriptionDocument(String id, String prescriptionNumber, String patientId, String appointmentId, String doctorId, List<PrescriptionItem> items) {
        this.id = id;
        this.prescriptionNumber = prescriptionNumber;
        this.patientId = patientId;
        this.appointmentId = appointmentId;
        this.doctorId = doctorId;
        this.status = "ISSUED";
        this.items = items != null ? items : new ArrayList<>();
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPrescriptionNumber() { return prescriptionNumber; }
    public void setPrescriptionNumber(String prescriptionNumber) { this.prescriptionNumber = prescriptionNumber; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public String getAppointmentId() { return appointmentId; }
    public void setAppointmentId(String appointmentId) { this.appointmentId = appointmentId; }

    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public List<PrescriptionItem> getItems() { return items; }
    public void setItems(List<PrescriptionItem> items) { this.items = items; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
