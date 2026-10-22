package com.aarogya.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

import java.time.Instant;

public class AppointmentDtos {

    public record BookAppointmentRequest(
        @NotBlank @JsonProperty("slot_id") String slotId,
        @JsonProperty("reason_for_visit") String reasonForVisit,
        @JsonProperty("consultation_mode") String consultationMode,
        @NotBlank @JsonProperty("appointment_date") String appointmentDate,
        @JsonProperty("patient_id") String patientId
    ) {
        public BookAppointmentRequest(String slotId, String reasonForVisit, String consultationMode) {
            this(slotId, reasonForVisit, consultationMode, null, null);
        }

        public BookAppointmentRequest(String slotId, String reasonForVisit, String consultationMode, String appointmentDate) {
            this(slotId, reasonForVisit, consultationMode, appointmentDate, null);
        }
    }

    public record RescheduleAppointmentRequest(
        @NotBlank @JsonProperty("new_slot_id") String newSlotId,
        String reason,
        @JsonProperty("new_appointment_date") String newAppointmentDate
    ) {
        public RescheduleAppointmentRequest(String newSlotId, String reason) {
            this(newSlotId, reason, null);
        }
    }

    public record AppointmentResponse(
        String id,
        @JsonProperty("appointment_number") String appointmentNumber,
        @JsonProperty("patient_id") String patientId,
        @JsonProperty("patient_name") String patientName,
        @JsonProperty("doctor_id") String doctorId,
        @JsonProperty("doctor_name") String doctorName,
        @JsonProperty("department_name") String departmentName,
        @JsonProperty("slot_id") String slotId,
        @JsonProperty("slot_start") String slotStart,
        @JsonProperty("slot_end") String slotEnd,
        String status,
        @JsonProperty("reason_for_visit") String reasonForVisit,
        @JsonProperty("consultation_mode") String consultationMode,
        @JsonProperty("queue_token") String queueToken,
        @JsonProperty("created_at") Instant createdAt,
        @JsonProperty("appointment_date") String appointmentDate,
        @JsonProperty("triage_level") String triageLevel,
        @JsonProperty("vital_signs") String vitalSigns,
        @JsonProperty("triage_notes") String triageNotes,
        @JsonProperty("triaged_by") String triagedBy,
        @JsonProperty("triaged_at") Instant triagedAt,
        @JsonProperty("short_url") String shortUrl
    ) {
        public AppointmentResponse(
            String id,
            String appointmentNumber,
            String patientId,
            String patientName,
            String doctorId,
            String doctorName,
            String departmentName,
            String slotId,
            String slotStart,
            String slotEnd,
            String status,
            String reasonForVisit,
            String consultationMode,
            String queueToken,
            Instant createdAt,
            String appointmentDate,
            String triageLevel,
            String vitalSigns,
            String triageNotes,
            String triagedBy,
            Instant triagedAt
        ) {
            this(id, appointmentNumber, patientId, patientName, doctorId, doctorName, departmentName, slotId, slotStart, slotEnd, status, reasonForVisit, consultationMode, queueToken, createdAt, appointmentDate, triageLevel, vitalSigns, triageNotes, triagedBy, triagedAt, null);
        }
    }

    public record RecordTriageRequest(
        @JsonProperty("triage_level") String triageLevel,
        @JsonProperty("vital_signs") String vitalSigns,
        @JsonProperty("triage_notes") String triageNotes
    ) {}

    public record ClinicalNoteRequest(
        @JsonProperty("chief_complaint") String chiefComplaint,
        @JsonProperty("examination_findings") String examinationFindings,
        String diagnosis,
        @JsonProperty("treatment_plan") String treatmentPlan,
        @JsonProperty("doctor_notes") String doctorNotes,
        @JsonProperty("follow_up_date") String followUpDate
    ) {}

    public record ClinicalNoteResponse(
        String id,
        @JsonProperty("patient_id") String patientId,
        @JsonProperty("appointment_id") String appointmentId,
        @JsonProperty("doctor_id") String doctorId,
        @JsonProperty("chief_complaint") String chiefComplaint,
        @JsonProperty("examination_findings") String examinationFindings,
        String diagnosis,
        @JsonProperty("treatment_plan") String treatmentPlan,
        @JsonProperty("doctor_notes") String doctorNotes,
        @JsonProperty("follow_up_date") String followUpDate,
        @JsonProperty("created_at") Instant createdAt
    ) {}

    public record StatusUpdateRequest(
        @NotBlank String status
    ) {}
}
