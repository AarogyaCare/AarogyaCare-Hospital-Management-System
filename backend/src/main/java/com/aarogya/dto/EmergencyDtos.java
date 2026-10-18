package com.aarogya.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

import java.time.Instant;

public class EmergencyDtos {

    public record EmergencyCreateRequest(
        @NotBlank @JsonProperty("patient_name") String patientName,
        @JsonProperty("patient_id") String patientId,
        @JsonProperty("contact_number") String contactNumber,
        @NotBlank @JsonProperty("triage_level") String triageLevel, // "RED", "YELLOW", "GREEN"
        @NotBlank @JsonProperty("chief_complaint") String chiefComplaint,
        @JsonProperty("vital_signs") String vitalSigns
    ) {}

    public record EmergencyStatusUpdateRequest(
        @NotBlank String status
    ) {}

    public record EmergencyResponse(
        String id,
        @JsonProperty("patient_name") String patientName,
        @JsonProperty("patient_id") String patientId,
        @JsonProperty("contact_number") String contactNumber,
        @JsonProperty("triage_level") String triageLevel,
        @JsonProperty("chief_complaint") String chiefComplaint,
        @JsonProperty("vital_signs") String vitalSigns,
        String status,
        @JsonProperty("priority_score") int priorityScore,
        @JsonProperty("created_at") Instant createdAt
    ) {}
}
