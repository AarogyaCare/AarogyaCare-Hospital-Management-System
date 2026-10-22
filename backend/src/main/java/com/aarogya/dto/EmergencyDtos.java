package com.aarogya.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

import java.time.Instant;

public class EmergencyDtos {

    public record EmergencyCreateRequest(
        @NotBlank @JsonProperty("patient_name") String patientName,
        @JsonProperty("patient_id") String patientId,
        @JsonProperty("doctor_id") String doctorId,
        @JsonProperty("doctor_name") String doctorName,
        @JsonProperty("contact_number") String contactNumber,
        @NotBlank @JsonProperty("triage_level") String triageLevel, // "RED", "YELLOW", "GREEN"
        @NotBlank @JsonProperty("chief_complaint") String chiefComplaint,
        @JsonProperty("vital_signs") String vitalSigns,
        String notes
    ) {
        public EmergencyCreateRequest(String patientName, String patientId, String contactNumber, String triageLevel, String chiefComplaint, String vitalSigns) {
            this(patientName, patientId, null, null, contactNumber, triageLevel, chiefComplaint, vitalSigns, null);
        }
    }

    public record EmergencyStatusUpdateRequest(
        @NotBlank String status,
        @JsonProperty("doctor_id") String doctorId,
        @JsonProperty("doctor_notes") String doctorNotes
    ) {}

    public record EmergencyResponse(
        String id,
        @JsonProperty("patient_name") String patientName,
        @JsonProperty("patient_id") String patientId,
        @JsonProperty("doctor_id") String doctorId,
        @JsonProperty("doctor_name") String doctorName,
        @JsonProperty("appointment_id") String appointmentId,
        @JsonProperty("contact_number") String contactNumber,
        @JsonProperty("triage_level") String triageLevel,
        @JsonProperty("chief_complaint") String chiefComplaint,
        @JsonProperty("vital_signs") String vitalSigns,
        String status,
        @JsonProperty("priority_score") int priorityScore,
        String notes,
        @JsonProperty("created_at") Instant createdAt
    ) {}

    public record OnCallDoctorResponse(
        @JsonProperty("doctor_id") String doctorId,
        @JsonProperty("doctor_name") String doctorName,
        String department,
        String qualification,
        String status,
        @JsonProperty("updated_at") Instant updatedAt
    ) {}
}
