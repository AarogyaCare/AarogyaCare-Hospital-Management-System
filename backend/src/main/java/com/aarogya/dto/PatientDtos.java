package com.aarogya.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

import java.time.Instant;

public class PatientDtos {

    public record CreatePatientRequest(
        @NotBlank String name,
        String email,
        String phone,
        @JsonProperty("date_of_birth") String dateOfBirth,
        String gender,
        @JsonProperty("blood_group") String bloodGroup,
        String address,
        String allergies,
        @JsonProperty("chronic_conditions") String chronicConditions,
        @JsonProperty("emergency_contact_name") String emergencyContactName,
        @JsonProperty("emergency_contact_phone") String emergencyContactPhone
    ) {}

    public record PatientResponse(
        String id,
        @JsonProperty("user_id") String userId,
        String uhid,
        String name,
        String email,
        String phone,
        @JsonProperty("date_of_birth") String dateOfBirth,
        String gender,
        @JsonProperty("blood_group") String bloodGroup,
        String address,
        String allergies,
        @JsonProperty("chronic_conditions") String chronicConditions,
        @JsonProperty("emergency_contact_name") String emergencyContactName,
        @JsonProperty("emergency_contact_phone") String emergencyContactPhone,
        @JsonProperty("created_at") Instant createdAt
    ) {}
}
