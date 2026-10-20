package com.aarogya.controller;

import com.aarogya.dto.PrescriptionDtos;
import com.aarogya.security.UserPrincipal;
import com.aarogya.service.PatientRecordService;
import com.aarogya.service.PharmacyService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/prescriptions")
public class PrescriptionController {

    private final PatientRecordService recordService;
    private final PharmacyService pharmacyService;

    public PrescriptionController(PatientRecordService recordService, PharmacyService pharmacyService) {
        this.recordService = recordService;
        this.pharmacyService = pharmacyService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('DOCTOR', 'PHARMACIST', 'NURSE', 'ADMIN')")
    public ResponseEntity<List<PrescriptionDtos.PrescriptionResponse>> getAllPrescriptions(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(recordService.getAllPrescriptions(status));
    }

    @PostMapping("/{id}/dispense")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ResponseEntity<PrescriptionDtos.PrescriptionResponse> dispensePrescription(
            @PathVariable String id,
            @RequestHeader(required = false, name = "Idempotency-Key") String idempotencyKey,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(pharmacyService.dispensePrescription(id, idempotencyKey, principal));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ResponseEntity<PrescriptionDtos.PrescriptionResponse> updateStatus(
            @PathVariable String id,
            @RequestBody PrescriptionDtos.PrescriptionStatusUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(recordService.updatePrescriptionStatus(id, request.status(), principal));
    }
}
