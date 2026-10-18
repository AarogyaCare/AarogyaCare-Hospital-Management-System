package com.aarogya.controller;

import com.aarogya.service.DoctorService;
import org.springframework.http.ResponseEntity;
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
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(doctorService.getAllDoctors(departmentId, search, limit));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getDoctorById(@PathVariable String id) {
        return ResponseEntity.ok(doctorService.getDoctorById(id));
    }

    @GetMapping("/{id}/slots")
    public ResponseEntity<List<Map<String, Object>>> getDoctorSlots(@PathVariable String id) {
        return ResponseEntity.ok(doctorService.getSlotsByDoctor(id));
    }
}
