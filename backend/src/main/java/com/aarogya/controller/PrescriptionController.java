package com.aarogya.controller;

import com.aarogya.dto.PrescriptionDtos;
import com.aarogya.security.UserPrincipal;
import com.aarogya.service.PatientRecordService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/prescriptions")
public class PrescriptionController {

    private final PatientRecordService recordService;

    public PrescriptionController(PatientRecordService recordService) {
        this.recordService = recordService;
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<PrescriptionDtos.PrescriptionResponse> updateStatus(
            @PathVariable String id,
            @RequestBody PrescriptionDtos.PrescriptionStatusUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(recordService.updatePrescriptionStatus(id, request.status(), principal));
    }
}
