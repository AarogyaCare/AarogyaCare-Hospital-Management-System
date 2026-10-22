package com.aarogya.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "emergency_requests")
public class EmergencyRequestDocument {

    @Id
    private String id;

    private String patientName;

    @Indexed
    private String patientId;

    @Indexed
    private String doctorId;

    private String doctorName;

    @Indexed
    private String appointmentId;

    private String contactNumber;

    @Indexed
    private String triageLevel; // "RED", "YELLOW", "GREEN"

    private String chiefComplaint;
    private String vitalSigns;
    private String notes;

    @Indexed
    private String status = "INCOMING"; // "INCOMING", "ASSIGNED", "ATTENDING", "STABILIZED", "ADMITTED", "DISCHARGED"

    @Indexed
    private int priorityScore = 1; // 1 for RED, 2 for YELLOW, 3 for GREEN

    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    private String location;
    private String callerName;
    private String emergencyType;

    @Indexed
    private String incidentNumber;

    private boolean isProvisional = false;

    private String assignedDoctorId;
    private String assignedDoctorName;
    private String assignedNurseId;
    private String assignedNurseName;
    private String assignedBay;

    private String disposition; // "ADMITTED", "TRANSFERRED", "DISCHARGED", "DECEASED"
    private String dispositionNotes;
    private String destinationWard;
    private Instant closedAt;
    private String closedBy;

    private List<IncidentTimelineEvent> timeline = new ArrayList<>();
    private List<IncidentIntervention> interventions = new ArrayList<>();

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

    public static class IncidentTimelineEvent {
        private Instant timestamp = Instant.now();
        private String author;
        private String role;
        private String eventType;
        private String description;

        public IncidentTimelineEvent() {}

        public IncidentTimelineEvent(Instant timestamp, String author, String role, String eventType, String description) {
            this.timestamp = timestamp != null ? timestamp : Instant.now();
            this.author = author;
            this.role = role;
            this.eventType = eventType;
            this.description = description;
        }

        public Instant getTimestamp() { return timestamp; }
        public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
        public String getAuthor() { return author; }
        public void setAuthor(String author) { this.author = author; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getEventType() { return eventType; }
        public void setEventType(String eventType) { this.eventType = eventType; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    public static class IncidentIntervention {
        private String id;
        private Instant timestamp = Instant.now();
        private String author;
        private String role;
        private String type; // e.g. "IV_FLUIDS", "MEDICATION", "CPR", "INTUBATION", "WOUND_CARE", "OXYGEN"
        private String notes;
        private String vitalsRecorded;

        public IncidentIntervention() {}

        public IncidentIntervention(String id, Instant timestamp, String author, String role, String type, String notes, String vitalsRecorded) {
            this.id = id;
            this.timestamp = timestamp != null ? timestamp : Instant.now();
            this.author = author;
            this.role = role;
            this.type = type;
            this.notes = notes;
            this.vitalsRecorded = vitalsRecorded;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public Instant getTimestamp() { return timestamp; }
        public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
        public String getAuthor() { return author; }
        public void setAuthor(String author) { this.author = author; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
        public String getVitalsRecorded() { return vitalsRecorded; }
        public void setVitalsRecorded(String vitalsRecorded) { this.vitalsRecorded = vitalsRecorded; }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public String getDoctorId() { return doctorId != null ? doctorId : assignedDoctorId; }
    public void setDoctorId(String doctorId) {
        this.doctorId = doctorId;
        this.assignedDoctorId = doctorId;
    }

    public String getDoctorName() { return doctorName != null ? doctorName : assignedDoctorName; }
    public void setDoctorName(String doctorName) {
        this.doctorName = doctorName;
        this.assignedDoctorName = doctorName;
    }

    public String getAppointmentId() { return appointmentId; }
    public void setAppointmentId(String appointmentId) { this.appointmentId = appointmentId; }

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

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getPriorityScore() { return priorityScore; }
    public void setPriorityScore(int priorityScore) { this.priorityScore = priorityScore; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getCallerName() { return callerName; }
    public void setCallerName(String callerName) { this.callerName = callerName; }

    public String getEmergencyType() { return emergencyType; }
    public void setEmergencyType(String emergencyType) { this.emergencyType = emergencyType; }

    public String getIncidentNumber() { return incidentNumber; }
    public void setIncidentNumber(String incidentNumber) { this.incidentNumber = incidentNumber; }

    public boolean isProvisional() { return isProvisional; }
    public void setProvisional(boolean provisional) { isProvisional = provisional; }

    public String getAssignedDoctorId() { return assignedDoctorId != null ? assignedDoctorId : doctorId; }
    public void setAssignedDoctorId(String assignedDoctorId) {
        this.assignedDoctorId = assignedDoctorId;
        this.doctorId = assignedDoctorId;
    }

    public String getAssignedDoctorName() { return assignedDoctorName != null ? assignedDoctorName : doctorName; }
    public void setAssignedDoctorName(String assignedDoctorName) {
        this.assignedDoctorName = assignedDoctorName;
        this.doctorName = assignedDoctorName;
    }

    public String getAssignedNurseId() { return assignedNurseId; }
    public void setAssignedNurseId(String assignedNurseId) { this.assignedNurseId = assignedNurseId; }

    public String getAssignedNurseName() { return assignedNurseName; }
    public void setAssignedNurseName(String assignedNurseName) { this.assignedNurseName = assignedNurseName; }

    public String getAssignedBay() { return assignedBay; }
    public void setAssignedBay(String assignedBay) { this.assignedBay = assignedBay; }

    public String getDisposition() { return disposition; }
    public void setDisposition(String disposition) { this.disposition = disposition; }

    public String getDispositionNotes() { return dispositionNotes; }
    public void setDispositionNotes(String dispositionNotes) { this.dispositionNotes = dispositionNotes; }

    public String getDestinationWard() { return destinationWard; }
    public void setDestinationWard(String destinationWard) { this.destinationWard = destinationWard; }

    public Instant getClosedAt() { return closedAt; }
    public void setClosedAt(Instant closedAt) { this.closedAt = closedAt; }

    public String getClosedBy() { return closedBy; }
    public void setClosedBy(String closedBy) { this.closedBy = closedBy; }

    public List<IncidentTimelineEvent> getTimeline() { return timeline; }
    public void setTimeline(List<IncidentTimelineEvent> timeline) { this.timeline = timeline; }

    public List<IncidentIntervention> getInterventions() { return interventions; }
    public void setInterventions(List<IncidentIntervention> interventions) { this.interventions = interventions; }
}
