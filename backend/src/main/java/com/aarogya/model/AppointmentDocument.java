package com.aarogya.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "appointments")
@CompoundIndexes({
    @CompoundIndex(name = "doctor_slot_date_unique", def = "{'doctorId': 1, 'slotId': 1, 'appointmentDate': 1}", unique = true, partialFilter = "{'appointmentDate': {'$type': 'string'}}")
})
public class AppointmentDocument {

    @Id
    private String id;

    @Indexed(unique = true)
    private String appointmentNumber;

    @Indexed
    private String patientId;

    @Indexed
    private String doctorId;

    @Indexed
    private String slotId;

    @Indexed
    private String status = "SCHEDULED"; // "SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"

    private String reasonForVisit;
    private String consultationMode = "IN_PERSON"; // "IN_PERSON", "TELECONSULT"
    private String appointmentDate;
    private String queueToken;
    private Instant checkedInAt;
    private String triageLevel;
    private String vitalSigns;
    private String triageNotes;
    private String triagedBy;
    private Instant triagedAt;
    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    public AppointmentDocument() {}

    public AppointmentDocument(String id, String appointmentNumber, String patientId, String doctorId, String slotId, String reasonForVisit, String consultationMode, String queueToken) {
        this.id = id;
        this.appointmentNumber = appointmentNumber;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.slotId = slotId;
        this.status = "CONFIRMED";
        this.reasonForVisit = reasonForVisit;
        this.consultationMode = consultationMode != null ? consultationMode : "IN_PERSON";
        this.queueToken = queueToken;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAppointmentNumber() { return appointmentNumber; }
    public void setAppointmentNumber(String appointmentNumber) { this.appointmentNumber = appointmentNumber; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }

    public String getSlotId() { return slotId; }
    public void setSlotId(String slotId) { this.slotId = slotId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getReasonForVisit() { return reasonForVisit; }
    public void setReasonForVisit(String reasonForVisit) { this.reasonForVisit = reasonForVisit; }

    public String getConsultationMode() { return consultationMode; }
    public void setConsultationMode(String consultationMode) { this.consultationMode = consultationMode; }

    public String getAppointmentDate() { return appointmentDate; }
    public void setAppointmentDate(String appointmentDate) { this.appointmentDate = appointmentDate; }

    public String getQueueToken() { return queueToken; }
    public void setQueueToken(String queueToken) { this.queueToken = queueToken; }

    public Instant getCheckedInAt() { return checkedInAt; }
    public void setCheckedInAt(Instant checkedInAt) { this.checkedInAt = checkedInAt; }

    public String getTriageLevel() { return triageLevel; }
    public void setTriageLevel(String triageLevel) { this.triageLevel = triageLevel; }

    public String getVitalSigns() { return vitalSigns; }
    public void setVitalSigns(String vitalSigns) { this.vitalSigns = vitalSigns; }

    public String getTriageNotes() { return triageNotes; }
    public void setTriageNotes(String triageNotes) { this.triageNotes = triageNotes; }

    public String getTriagedBy() { return triagedBy; }
    public void setTriagedBy(String triagedBy) { this.triagedBy = triagedBy; }

    public Instant getTriagedAt() { return triagedAt; }
    public void setTriagedAt(Instant triagedAt) { this.triagedAt = triagedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
