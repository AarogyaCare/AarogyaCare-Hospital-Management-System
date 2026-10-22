package com.aarogya.controller;

import com.aarogya.service.DoctorService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/doctors")
public class DoctorController {

    private final DoctorService doctorService;

    public DoctorController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllDoctors(
            @RequestParam(required = false, name = "department_id") String departmentId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "50") int limit,
            @RequestParam(required = false, name = "on_call") Boolean onCall) {
        return ResponseEntity.ok(doctorService.getAllDoctors(departmentId, search, limit, onCall));
    }

    public ResponseEntity<Map<String, Object>> getAllDoctors(
            String departmentId,
            String search,
            int limit) {
        return getAllDoctors(departmentId, search, limit, null);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getDoctorById(@PathVariable String id) {
        return ResponseEntity.ok(doctorService.getDoctorById(id));
    }

    @GetMapping("/{id}/slots")
    public ResponseEntity<List<Map<String, Object>>> getDoctorSlots(
            @PathVariable String id,
            @RequestParam(required = false) String date) {
        return ResponseEntity.ok(doctorService.getSlotsByDoctor(id, date));
    }

    @PatchMapping("/{id}/oncall")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> setOnCallStatus(
            @PathVariable String id,
            @RequestBody Map<String, Boolean> body) {
        boolean isOnCall = Boolean.TRUE.equals(body.get("is_on_call"));
        return ResponseEntity.ok(doctorService.toggleOnCall(id, isOnCall));
    }
}
