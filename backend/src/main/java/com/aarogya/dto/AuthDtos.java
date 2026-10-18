package com.aarogya.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public class AuthDtos {

    public record LoginRequest(
        @NotBlank @Email String email,
        @NotBlank String password
    ) {}

    public record RegisterRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, message = "Password must be at least 8 characters") String password,
        @NotBlank @JsonProperty("full_name") String fullName,
        String phone,
        String role
    ) {}

    public record StaffCreateRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, message = "Password must be at least 8 characters") String password,
        @NotBlank @JsonProperty("full_name") String fullName,
        @NotBlank String role,
        String phone,
        @JsonProperty("department_id") String departmentId,
        @JsonProperty("room_number") String roomNumber,
        String qualification,
        @JsonProperty("experience_years") Integer experienceYears
    ) {}

    public record PatientProfileDto(
        String id,
        String uhid,
        @JsonProperty("blood_group") String bloodGroup,
        String gender,
        @JsonProperty("date_of_birth") String dateOfBirth
    ) {}

    public record DoctorProfileDto(
        String id,
        @JsonProperty("user_id") String userId,
        @JsonProperty("department_id") String departmentId,
        String qualification,
        @JsonProperty("experience_years") int experienceYears,
        @JsonProperty("room_number") String roomNumber,
        double rating,
        List<String> specializations
    ) {}

    public record UserDto(
        String id,
        String email,
        String role,
        @JsonProperty("full_name") String fullName,
        String phone,
        @JsonProperty("is_active") boolean isActive,
        @JsonProperty("patient_profile") PatientProfileDto patientProfile,
        @JsonProperty("doctor_profile") DoctorProfileDto doctorProfile
    ) {}

    public record TokenResponse(
        @JsonProperty("access_token") String accessToken,
        @JsonProperty("token_type") String tokenType,
        @JsonProperty("user_id") String userId,
        String role,
        String email,
        @JsonProperty("full_name") String fullName,
        UserDto user
    ) {}
}
