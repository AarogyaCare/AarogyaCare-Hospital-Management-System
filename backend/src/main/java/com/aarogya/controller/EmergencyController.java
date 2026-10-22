package com.aarogya.controller;

import com.aarogya.dto.EmergencyDtos;
import com.aarogya.security.UserPrincipal;
import com.aarogya.service.EmergencyService;
import com.aarogya.systemdesign.ratelimiter.RateLimiterService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/emergency")
public class EmergencyController {

    private final EmergencyService emergencyService;
    private final RateLimiterService rateLimiterService;

    public EmergencyController(EmergencyService emergencyService, RateLimiterService rateLimiterService) {
        this.emergencyService = emergencyService;
        this.rateLimiterService = rateLimiterService;
    }

    @GetMapping("/requests")
    @PreAuthorize("hasAnyRole('NURSE', 'DOCTOR', 'ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<List<EmergencyDtos.EmergencyResponse>> getEmergencyQueue(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(emergencyService.getEmergencyQueue(status));
    }

    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'NURSE')")
    public ResponseEntity<List<EmergencyDtos.EmergencyResponse>> getDoctorEmergencyQueue(
            @PathVariable String doctorId) {
        return ResponseEntity.ok(emergencyService.getEmergencyQueueForDoctor(doctorId));
    }

    @PostMapping("/requests")
    public ResponseEntity<EmergencyDtos.EmergencyResponse> createEmergencyRequest(
            @Valid @RequestBody EmergencyDtos.EmergencyCreateRequest request,
            HttpServletRequest httpRequest,
            @AuthenticationPrincipal UserPrincipal principal) {
        // High priority emergency rate limit check (emergency intake bypass policy)
        String clientIp = httpRequest.getRemoteAddr();
        rateLimiterService.tryAcquire(clientIp, "emergency");

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(emergencyService.createEmergencyRequest(request, principal));
    }

    @PatchMapping("/requests/{id}/status")
    @PreAuthorize("hasAnyRole('NURSE', 'DOCTOR', 'ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<EmergencyDtos.EmergencyResponse> updateStatus(
            @PathVariable String id,
            @Valid @RequestBody EmergencyDtos.EmergencyStatusUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(emergencyService.updateStatus(id, request, principal));
    }

    @GetMapping("/requests/{id}")
    @PreAuthorize("hasAnyRole('NURSE', 'DOCTOR', 'ADMIN', 'RECEPTIONIST', 'PATIENT')")
    public ResponseEntity<EmergencyDtos.EmergencyDetailResponse> getEmergencyDetail(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(emergencyService.getEmergencyDetail(id, principal));
    }

    @PatchMapping("/requests/{id}/assign")
    @PreAuthorize("hasAnyRole('NURSE', 'DOCTOR', 'ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<EmergencyDtos.EmergencyDetailResponse> assignCareTeamAndBay(
            @PathVariable String id,
            @Valid @RequestBody EmergencyDtos.IncidentAssignRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(emergencyService.assignCareTeamAndBay(id, request, principal));
    }

    @PostMapping("/requests/{id}/interventions")
    @PreAuthorize("hasAnyRole('NURSE', 'DOCTOR')")
    public ResponseEntity<EmergencyDtos.EmergencyDetailResponse> recordIntervention(
            @PathVariable String id,
            @Valid @RequestBody EmergencyDtos.InterventionRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(emergencyService.recordIntervention(id, request, principal));
    }

    @PatchMapping("/requests/{id}/reassess")
    @PreAuthorize("hasAnyRole('NURSE', 'DOCTOR')")
    public ResponseEntity<EmergencyDtos.EmergencyDetailResponse> reassessAcuity(
            @PathVariable String id,
            @Valid @RequestBody EmergencyDtos.ReassessRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(emergencyService.reassessAcuity(id, request, principal));
    }

    @PostMapping("/requests/{id}/disposition")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<EmergencyDtos.EmergencyDetailResponse> concludeDisposition(
            @PathVariable String id,
            @Valid @RequestBody EmergencyDtos.DispositionRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(emergencyService.concludeDisposition(id, request, principal));
    }

    @GetMapping("/patient/active")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<EmergencyDtos.EmergencyDetailResponse> getActivePatientEmergency(
            @AuthenticationPrincipal UserPrincipal principal) {
        EmergencyDtos.EmergencyDetailResponse res = emergencyService.getActivePatientEmergency(principal.getId());
        if (res == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(res);
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('NURSE', 'DOCTOR', 'ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<EmergencyDtos.EmergencySurgeStatsResponse> getEmergencySurgeStats() {
        return ResponseEntity.ok(emergencyService.getEmergencySurgeStats());
    }
}
