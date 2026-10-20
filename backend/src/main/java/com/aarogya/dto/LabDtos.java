package com.aarogya.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

import java.time.Instant;

public class LabDtos {

    public record CreateLabOrderRequest(
        @NotBlank @JsonProperty("patient_id") String patientId,
        @JsonProperty("appointment_id") String appointmentId,
        @NotBlank @JsonProperty("test_name") String testName,
        @JsonProperty("test_category") String testCategory,
        @JsonProperty("sample_type") String sampleType,
        String urgency
    ) {}

    public record UpdateLabStatusRequest(
        @NotBlank String status,
        @JsonProperty("sample_type") String sampleType,
        @JsonProperty("technician_notes") String technicianNotes
    ) {}

    public record RecordLabResultRequest(
        @NotBlank @JsonProperty("result_value") String resultValue,
        String unit,
        @JsonProperty("reference_range") String referenceRange,
        @JsonProperty("clinical_remarks") String clinicalRemarks,
        @JsonProperty("technician_notes") String technicianNotes
    ) {}

    public record LabOrderResponse(
        String id,
        @JsonProperty("order_number") String orderNumber,
        @JsonProperty("patient_id") String patientId,
        @JsonProperty("patient_name") String patientName,
        @JsonProperty("appointment_id") String appointmentId,
        @JsonProperty("doctor_id") String doctorId,
        @JsonProperty("doctor_name") String doctorName,
        @JsonProperty("test_name") String testName,
        @JsonProperty("test_category") String testCategory,
        @JsonProperty("sample_type") String sampleType,
        String status,
        String urgency,
        @JsonProperty("result_value") String resultValue,
        String unit,
        @JsonProperty("reference_range") String referenceRange,
        @JsonProperty("clinical_remarks") String clinicalRemarks,
        @JsonProperty("technician_notes") String technicianNotes,
        @JsonProperty("performed_by") String performedBy,
        @JsonProperty("reviewed_by") String reviewedBy,
        @JsonProperty("ordered_at") Instant orderedAt,
        @JsonProperty("sample_collected_at") Instant sampleCollectedAt,
        @JsonProperty("completed_at") Instant completedAt,
        @JsonProperty("released_at") Instant releasedAt
    ) {}
}
