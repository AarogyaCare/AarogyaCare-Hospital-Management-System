package com.aarogya.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "lab_orders")
public class LabOrderDocument {

    @Id
    private String id;

    @Indexed(unique = true)
    private String orderNumber;

    @Indexed
    private String patientId;

    @Indexed
    private String appointmentId;

    @Indexed
    private String doctorId;

    private String testName;
    private String testCategory; // e.g. "BIOCHEMISTRY", "HEMATOLOGY", "MICROBIOLOGY", "PATHOLOGY"
    private String sampleType;   // e.g. "BLOOD", "SERUM", "URINE", "SWAB"

    @Indexed
    private String status = "ORDERED"; // "ORDERED", "SAMPLE_COLLECTED", "PROCESSING", "COMPLETED", "CANCELLED"

    private String urgency = "ROUTINE"; // "ROUTINE", "STAT"
    private String resultValue;
    private String unit;
    private String referenceRange;
    private String clinicalRemarks;
    private String technicianNotes;
    private String performedBy;
    private String reviewedBy;

    private Instant orderedAt = Instant.now();
    private Instant sampleCollectedAt;
    private Instant completedAt;
    private Instant releasedAt;
    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    public LabOrderDocument() {}

    public LabOrderDocument(
            String id,
            String orderNumber,
            String patientId,
            String appointmentId,
            String doctorId,
            String testName,
            String testCategory,
            String sampleType,
            String urgency) {
        this.id = id;
        this.orderNumber = orderNumber;
        this.patientId = patientId;
        this.appointmentId = appointmentId;
        this.doctorId = doctorId;
        this.testName = testName;
        this.testCategory = testCategory != null ? testCategory : "GENERAL";
        this.sampleType = sampleType != null ? sampleType : "BLOOD";
        this.urgency = urgency != null ? urgency : "ROUTINE";
        this.status = "ORDERED";
        this.orderedAt = Instant.now();
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public String getAppointmentId() { return appointmentId; }
    public void setAppointmentId(String appointmentId) { this.appointmentId = appointmentId; }

    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }

    public String getTestName() { return testName; }
    public void setTestName(String testName) { this.testName = testName; }

    public String getTestCategory() { return testCategory; }
    public void setTestCategory(String testCategory) { this.testCategory = testCategory; }

    public String getSampleType() { return sampleType; }
    public void setSampleType(String sampleType) { this.sampleType = sampleType; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getUrgency() { return urgency; }
    public void setUrgency(String urgency) { this.urgency = urgency; }

    public String getResultValue() { return resultValue; }
    public void setResultValue(String resultValue) { this.resultValue = resultValue; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public String getReferenceRange() { return referenceRange; }
    public void setReferenceRange(String referenceRange) { this.referenceRange = referenceRange; }

    public String getClinicalRemarks() { return clinicalRemarks; }
    public void setClinicalRemarks(String clinicalRemarks) { this.clinicalRemarks = clinicalRemarks; }

    public String getTechnicianNotes() { return technicianNotes; }
    public void setTechnicianNotes(String technicianNotes) { this.technicianNotes = technicianNotes; }

    public String getPerformedBy() { return performedBy; }
    public void setPerformedBy(String performedBy) { this.performedBy = performedBy; }

    public String getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; }

    public Instant getOrderedAt() { return orderedAt; }
    public void setOrderedAt(Instant orderedAt) { this.orderedAt = orderedAt; }

    public Instant getSampleCollectedAt() { return sampleCollectedAt; }
    public void setSampleCollectedAt(Instant sampleCollectedAt) { this.sampleCollectedAt = sampleCollectedAt; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }

    public Instant getReleasedAt() { return releasedAt; }
    public void setReleasedAt(Instant releasedAt) { this.releasedAt = releasedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
