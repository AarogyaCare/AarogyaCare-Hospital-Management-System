package com.aarogya.controller;

import com.aarogya.dto.AppointmentDtos;
import com.aarogya.dto.PrescriptionDtos;
import com.aarogya.security.UserPrincipal;
import com.aarogya.service.AppointmentService;
import com.aarogya.service.PatientRecordService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final PatientRecordService recordService;

    public AppointmentController(AppointmentService appointmentService, PatientRecordService recordService) {
        this.appointmentService = appointmentService;
        this.recordService = recordService;
    }

    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<List<AppointmentDtos.AppointmentResponse>> getAppointments(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(appointmentService.getAppointments(principal));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AppointmentDtos.AppointmentResponse> getAppointmentById(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(appointmentService.getAppointmentById(id, principal));
    }

    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('PATIENT', 'RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<AppointmentDtos.AppointmentResponse> bookAppointment(
            @Valid @RequestBody AppointmentDtos.BookAppointmentRequest request,
            @RequestHeader(required = false, name = "Idempotency-Key") String idempotencyKey,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(appointmentService.bookAppointment(principal, request, idempotencyKey));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<AppointmentDtos.AppointmentResponse> cancelAppointment(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(appointmentService.cancelAppointment(id, principal));
    }

    @PostMapping("/{id}/reschedule")
    public ResponseEntity<AppointmentDtos.AppointmentResponse> rescheduleAppointment(
            @PathVariable String id,
            @Valid @RequestBody AppointmentDtos.RescheduleAppointmentRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(appointmentService.rescheduleAppointment(id, request.newSlotId(), request.newAppointmentDate(), principal));
    }

    @PatchMapping("/{id}/status")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('DOCTOR', 'NURSE', 'RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<AppointmentDtos.AppointmentResponse> updateStatus(
            @PathVariable String id,
            @Valid @RequestBody AppointmentDtos.StatusUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(appointmentService.updateAppointmentStatus(id, request.status(), principal));
    }

    @GetMapping("/{id}/notes")
    public ResponseEntity<List<AppointmentDtos.ClinicalNoteResponse>> getClinicalNotes(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        // Enforce that caller is authorized to view this appointment
        appointmentService.getAppointmentById(id, principal);
        return ResponseEntity.ok(recordService.getClinicalNotesByAppointment(id));
    }

    @PostMapping("/{id}/notes")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<AppointmentDtos.ClinicalNoteResponse> addClinicalNote(
            @PathVariable String id,
            @Valid @RequestBody AppointmentDtos.ClinicalNoteRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(recordService.addClinicalNote(id, request, principal));
    }

    @GetMapping("/{id}/prescriptions")
    public ResponseEntity<List<PrescriptionDtos.PrescriptionResponse>> getPrescriptions(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        // Enforce that caller is authorized to view this appointment
        appointmentService.getAppointmentById(id, principal);
        return ResponseEntity.ok(recordService.getPrescriptionsByAppointment(id));
    }

    @PostMapping("/{id}/prescriptions")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<PrescriptionDtos.PrescriptionResponse> createPrescription(
            @PathVariable String id,
            @Valid @RequestBody PrescriptionDtos.PrescriptionCreateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(recordService.createPrescription(id, request, principal));
    }

    @PostMapping("/{id}/triage")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('NURSE', 'DOCTOR', 'ADMIN')")
    public ResponseEntity<AppointmentDtos.AppointmentResponse> recordTriage(
            @PathVariable String id,
            @RequestBody AppointmentDtos.RecordTriageRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(appointmentService.recordTriage(id, request, principal));
    }
}
