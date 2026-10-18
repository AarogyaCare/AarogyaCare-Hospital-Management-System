package com.aarogya.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotEmpty;

import java.time.Instant;
import java.util.List;

public class PrescriptionDtos {

    public record PrescriptionItemDto(
        @JsonProperty("medicine_id") String medicineId,
        @JsonProperty("medicine_name") String medicineName,
        String dosage,
        String frequency,
        @JsonProperty("duration_days") int durationDays,
        String instructions,
        int quantity
    ) {}

    public record PrescriptionCreateRequest(
        @NotEmpty List<PrescriptionItemDto> items
    ) {}

    public record PrescriptionStatusUpdateRequest(
        String status
    ) {}

    public record PrescriptionResponse(
        String id,
        @JsonProperty("prescription_number") String prescriptionNumber,
        @JsonProperty("patient_id") String patientId,
        @JsonProperty("appointment_id") String appointmentId,
        @JsonProperty("doctor_id") String doctorId,
        @JsonProperty("doctor_name") String doctorName,
        String status,
        List<PrescriptionItemDto> items,
        @JsonProperty("created_at") Instant createdAt
    ) {}
}
