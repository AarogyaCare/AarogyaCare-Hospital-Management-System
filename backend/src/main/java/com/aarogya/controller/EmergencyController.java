package com.aarogya.controller;

import com.aarogya.dto.EmergencyDtos;
import com.aarogya.security.UserPrincipal;
import com.aarogya.service.EmergencyService;
import com.aarogya.systemdesign.ratelimiter.RateLimiterService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('NURSE', 'DOCTOR', 'ADMIN')")
    public ResponseEntity<List<EmergencyDtos.EmergencyResponse>> getEmergencyQueue(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(emergencyService.getEmergencyQueue(status));
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
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('NURSE', 'DOCTOR', 'ADMIN')")
    public ResponseEntity<EmergencyDtos.EmergencyResponse> updateStatus(
            @PathVariable String id,
            @Valid @RequestBody EmergencyDtos.EmergencyStatusUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(emergencyService.updateStatus(id, request.status(), principal));
    }
}
