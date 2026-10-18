package com.aarogya.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "clinical_records")
public class ClinicalRecordDocument {

    @Id
    private String id;

    @Indexed
    private String patientId;

    @Indexed
    private String appointmentId;

    @Indexed
    private String doctorId;

    private String chiefComplaint;
    private String examinationFindings;
    private String diagnosis;
    private String treatmentPlan;
    private String doctorNotes;
    private String followUpDate;
    private Instant createdAt = Instant.now();

    public ClinicalRecordDocument() {}

    public ClinicalRecordDocument(String id, String patientId, String appointmentId, String doctorId, String chiefComplaint, String examinationFindings, String diagnosis, String treatmentPlan, String doctorNotes, String followUpDate) {
        this.id = id;
        this.patientId = patientId;
        this.appointmentId = appointmentId;
        this.doctorId = doctorId;
        this.chiefComplaint = chiefComplaint;
        this.examinationFindings = examinationFindings;
        this.diagnosis = diagnosis;
        this.treatmentPlan = treatmentPlan;
        this.doctorNotes = doctorNotes;
        this.followUpDate = followUpDate;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public String getAppointmentId() { return appointmentId; }
    public void setAppointmentId(String appointmentId) { this.appointmentId = appointmentId; }

    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }

    public String getChiefComplaint() { return chiefComplaint; }
    public void setChiefComplaint(String chiefComplaint) { this.chiefComplaint = chiefComplaint; }

    public String getExaminationFindings() { return examinationFindings; }
    public void setExaminationFindings(String examinationFindings) { this.examinationFindings = examinationFindings; }

    public String getDiagnosis() { return diagnosis; }
    public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }

    public String getTreatmentPlan() { return treatmentPlan; }
    public void setTreatmentPlan(String treatmentPlan) { this.treatmentPlan = treatmentPlan; }

    public String getDoctorNotes() { return doctorNotes; }
    public void setDoctorNotes(String doctorNotes) { this.doctorNotes = doctorNotes; }

    public String getFollowUpDate() { return followUpDate; }
    public void setFollowUpDate(String followUpDate) { this.followUpDate = followUpDate; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
