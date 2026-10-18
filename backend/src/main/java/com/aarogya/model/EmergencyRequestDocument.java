package com.aarogya.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "emergency_requests")
public class EmergencyRequestDocument {

    @Id
    private String id;

    private String patientName;

    @Indexed
    private String patientId;

    private String contactNumber;

    @Indexed
    private String triageLevel; // "RED", "YELLOW", "GREEN"

    private String chiefComplaint;
    private String vitalSigns;

    @Indexed
    private String status = "INCOMING"; // "INCOMING", "TRIAGED", "STABILIZING", "ADMITTED", "DISCHARGED"

    @Indexed
    private int priorityScore = 1; // 1 for RED, 2 for YELLOW, 3 for GREEN

    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    public EmergencyRequestDocument() {}

    public EmergencyRequestDocument(String id, String patientName, String patientId, String contactNumber, String triageLevel, String chiefComplaint, String vitalSigns) {
        this.id = id;
        this.patientName = patientName;
        this.patientId = patientId;
        this.contactNumber = contactNumber;
        this.triageLevel = triageLevel;
        this.chiefComplaint = chiefComplaint;
        this.vitalSigns = vitalSigns;
        this.status = "INCOMING";
        this.priorityScore = "RED".equalsIgnoreCase(triageLevel) ? 1 : "YELLOW".equalsIgnoreCase(triageLevel) ? 2 : 3;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }

    public String getTriageLevel() { return triageLevel; }
    public void setTriageLevel(String triageLevel) {
        this.triageLevel = triageLevel;
        this.priorityScore = "RED".equalsIgnoreCase(triageLevel) ? 1 : "YELLOW".equalsIgnoreCase(triageLevel) ? 2 : 3;
    }

    public String getChiefComplaint() { return chiefComplaint; }
    public void setChiefComplaint(String chiefComplaint) { this.chiefComplaint = chiefComplaint; }

    public String getVitalSigns() { return vitalSigns; }
    public void setVitalSigns(String vitalSigns) { this.vitalSigns = vitalSigns; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getPriorityScore() { return priorityScore; }
    public void setPriorityScore(int priorityScore) { this.priorityScore = priorityScore; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
