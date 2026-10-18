package com.aarogya.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

import java.time.Instant;

public class AppointmentDtos {

    public record BookAppointmentRequest(
        @NotBlank @JsonProperty("slot_id") String slotId,
        @JsonProperty("reason_for_visit") String reasonForVisit,
        @JsonProperty("consultation_mode") String consultationMode
    ) {}

    public record RescheduleAppointmentRequest(
        @NotBlank @JsonProperty("new_slot_id") String newSlotId,
        String reason
    ) {}

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
        @JsonProperty("created_at") Instant createdAt
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
}
