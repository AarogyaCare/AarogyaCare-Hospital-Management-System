package com.aarogya.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

import java.time.Instant;
import java.util.List;

public class EmergencyDtos {

    public record EmergencyCreateRequest(
        @JsonProperty("patient_name") String patientName,
        @JsonProperty("patient_id") String patientId,
        @JsonProperty("doctor_id") String doctorId,
        @JsonProperty("doctor_name") String doctorName,
        @JsonProperty("contact_number") String contactNumber,
        @JsonProperty("contact_phone") String contactPhone,
        @JsonProperty("triage_level") String triageLevel, // "RED", "YELLOW", "GREEN"
        @JsonProperty("severity_level") String severityLevel,
        @JsonProperty("chief_complaint") String chiefComplaint,
        @JsonProperty("vital_signs") String vitalSigns,
        @JsonProperty("caller_name") String callerName,
        @JsonProperty("location") String location,
        @JsonProperty("emergency_type") String emergencyType,
        @JsonProperty("notes") String notes
    ) {
        public EmergencyCreateRequest(
                String patientName,
                String patientId,
                String contactNumber,
                String triageLevel,
                String chiefComplaint,
                String vitalSigns) {
            this(patientName, patientId, null, null, contactNumber, null, triageLevel, null, chiefComplaint, vitalSigns, null, null, null, null);
        }

        public EmergencyCreateRequest(
                String patientName,
                String patientId,
                String contactNumber,
                String contactPhone,
                String triageLevel,
                String severityLevel,
                String chiefComplaint,
                String vitalSigns,
                String callerName,
                String location,
                String emergencyType,
                String notes) {
            this(patientName, patientId, null, null, contactNumber, contactPhone, triageLevel, severityLevel, chiefComplaint, vitalSigns, callerName, location, emergencyType, notes);
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
        @JsonProperty("created_at") Instant createdAt,
        @JsonProperty("location") String location,
        @JsonProperty("caller_name") String callerName,
        @JsonProperty("emergency_type") String emergencyType,
        @JsonProperty("notes") String notes,
        @JsonProperty("incident_number") String incidentNumber,
        @JsonProperty("is_provisional") boolean isProvisional,
        @JsonProperty("assigned_doctor_name") String assignedDoctorName,
        @JsonProperty("assigned_nurse_name") String assignedNurseName,
        @JsonProperty("assigned_bay") String assignedBay,
        @JsonProperty("disposition") String disposition
    ) {
        public EmergencyResponse(
                String id,
                String patientName,
                String patientId,
                String contactNumber,
                String triageLevel,
                String chiefComplaint,
                String vitalSigns,
                String status,
                int priorityScore,
                Instant createdAt,
                String location,
                String callerName,
                String emergencyType,
                String notes) {
            this(id, patientName, patientId, null, null, null, contactNumber, triageLevel, chiefComplaint, vitalSigns, status, priorityScore, createdAt, location, callerName, emergencyType, notes, null, false, null, null, null, null);
        }

        public EmergencyResponse(
                String id,
                String patientName,
                String patientId,
                String contactNumber,
                String triageLevel,
                String chiefComplaint,
                String vitalSigns,
                String status,
                int priorityScore,
                Instant createdAt) {
            this(id, patientName, patientId, null, null, null, contactNumber, triageLevel, chiefComplaint, vitalSigns, status, priorityScore, createdAt, null, null, null, null, null, false, null, null, null, null);
        }

        public EmergencyResponse(
                String id,
                String patientName,
                String patientId,
                String doctorId,
                String doctorName,
                String appointmentId,
                String contactNumber,
                String triageLevel,
                String chiefComplaint,
                String vitalSigns,
                String status,
                int priorityScore,
                String notes,
                Instant createdAt) {
            this(id, patientName, patientId, doctorId, doctorName, appointmentId, contactNumber, triageLevel, chiefComplaint, vitalSigns, status, priorityScore, createdAt, null, null, null, notes, null, false, doctorName, null, null, null);
        }
    }

    public record IncidentAssignRequest(
        @JsonProperty("doctor_id") String doctorId,
        @JsonProperty("doctor_name") String doctorName,
        @JsonProperty("nurse_id") String nurseId,
        @JsonProperty("nurse_name") String nurseName,
        @JsonProperty("bay") String bay
    ) {}

    public record InterventionRequest(
        @NotBlank @JsonProperty("type") String type,
        @NotBlank @JsonProperty("notes") String notes,
        @JsonProperty("vitals") String vitals
    ) {}

    public record ReassessRequest(
        @NotBlank @JsonProperty("triage_level") String triageLevel,
        @NotBlank @JsonProperty("reason") String reason,
        @JsonProperty("vital_signs") String vitalSigns
    ) {}

    public record DispositionRequest(
        @NotBlank @JsonProperty("disposition") String disposition,
        @JsonProperty("destination_ward") String destinationWard,
        @JsonProperty("notes") String notes
    ) {}

    public record TimelineEventDto(
        @JsonProperty("timestamp") Instant timestamp,
        @JsonProperty("author") String author,
        @JsonProperty("role") String role,
        @JsonProperty("event_type") String eventType,
        @JsonProperty("description") String description
    ) {}

    public record InterventionDto(
        @JsonProperty("id") String id,
        @JsonProperty("timestamp") Instant timestamp,
        @JsonProperty("author") String author,
        @JsonProperty("role") String role,
        @JsonProperty("type") String type,
        @JsonProperty("notes") String notes,
        @JsonProperty("vitals_recorded") String vitalsRecorded
    ) {}

    public record EmergencyDetailResponse(
        String id,
        @JsonProperty("incident_number") String incidentNumber,
        @JsonProperty("patient_name") String patientName,
        @JsonProperty("patient_id") String patientId,
        @JsonProperty("contact_number") String contactNumber,
        @JsonProperty("triage_level") String triageLevel,
        @JsonProperty("chief_complaint") String chiefComplaint,
        @JsonProperty("vital_signs") String vitalSigns,
        String status,
        @JsonProperty("priority_score") int priorityScore,
        @JsonProperty("created_at") Instant createdAt,
        @JsonProperty("updated_at") Instant updatedAt,
        @JsonProperty("location") String location,
        @JsonProperty("caller_name") String callerName,
        @JsonProperty("emergency_type") String emergencyType,
        @JsonProperty("notes") String notes,
        @JsonProperty("is_provisional") boolean isProvisional,
        @JsonProperty("assigned_doctor_id") String assignedDoctorId,
        @JsonProperty("assigned_doctor_name") String assignedDoctorName,
        @JsonProperty("assigned_nurse_id") String assignedNurseId,
        @JsonProperty("assigned_nurse_name") String assignedNurseName,
        @JsonProperty("assigned_bay") String assignedBay,
        @JsonProperty("disposition") String disposition,
        @JsonProperty("disposition_notes") String dispositionNotes,
        @JsonProperty("destination_ward") String destinationWard,
        @JsonProperty("closed_at") Instant closedAt,
        @JsonProperty("closed_by") String closedBy,
        @JsonProperty("timeline") List<TimelineEventDto> timeline,
        @JsonProperty("interventions") List<InterventionDto> interventions
    ) {}

    public record EmergencySurgeStatsResponse(
        @JsonProperty("active_incidents") long activeIncidents,
        @JsonProperty("critical_red_count") long criticalRedCount,
        @JsonProperty("urgent_yellow_count") long urgentYellowCount,
        @JsonProperty("awaiting_triage_count") long awaitingTriageCount,
        @JsonProperty("stabilizing_count") long stabilizingCount,
        @JsonProperty("allocated_bays_count") long allocatedBaysCount
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
