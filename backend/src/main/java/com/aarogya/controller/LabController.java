package com.aarogya.controller;

import com.aarogya.dto.LabDtos;
import com.aarogya.security.UserPrincipal;
import com.aarogya.service.LabService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/lab")
public class LabController {

    private final LabService labService;

    public LabController(LabService labService) {
        this.labService = labService;
    }

    @GetMapping("/orders")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE', 'ADMIN')")
    public ResponseEntity<List<LabDtos.LabOrderResponse>> getOrders(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(labService.getOrders(status));
    }

    @PostMapping("/orders")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE', 'ADMIN')")
    public ResponseEntity<LabDtos.LabOrderResponse> createOrder(
            @Valid @RequestBody LabDtos.CreateLabOrderRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(labService.createOrder(request, principal));
    }

    @GetMapping("/orders/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE', 'ADMIN', 'PATIENT')")
    public ResponseEntity<LabDtos.LabOrderResponse> getOrderById(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(labService.getOrderById(id, principal));
    }

    @GetMapping("/patients/{patientId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE', 'ADMIN', 'PATIENT')")
    public ResponseEntity<List<LabDtos.LabOrderResponse>> getOrdersByPatient(
            @PathVariable String patientId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(labService.getOrdersByPatient(patientId, principal));
    }

    @PatchMapping("/orders/{id}/status")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE', 'ADMIN')")
    public ResponseEntity<LabDtos.LabOrderResponse> updateStatus(
            @PathVariable String id,
            @Valid @RequestBody LabDtos.UpdateLabStatusRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(labService.updateOrderStatus(id, request, principal));
    }

    @PostMapping("/orders/{id}/results")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE', 'ADMIN')")
    public ResponseEntity<LabDtos.LabOrderResponse> recordResult(
            @PathVariable String id,
            @Valid @RequestBody LabDtos.RecordLabResultRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(labService.recordResult(id, request, principal));
    }
}
