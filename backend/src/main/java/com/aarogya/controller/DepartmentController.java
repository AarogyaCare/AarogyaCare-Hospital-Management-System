package com.aarogya.controller;

import com.aarogya.model.DepartmentDocument;
import com.aarogya.model.SpecializationDocument;
import com.aarogya.service.DepartmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class DepartmentController {

    private final DepartmentService departmentService;

    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    @GetMapping("/departments")
    public ResponseEntity<List<DepartmentDocument>> getAllDepartments() {
        return ResponseEntity.ok(departmentService.getAllDepartments());
    }

    @GetMapping("/departments/{id}")
    public ResponseEntity<DepartmentDocument> getDepartmentById(@PathVariable String id) {
        return departmentService.getDepartmentById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/specializations")
    public ResponseEntity<List<SpecializationDocument>> getSpecializations(
            @RequestParam(required = false, name = "department_id") String departmentId) {
        return ResponseEntity.ok(departmentService.getSpecializations(departmentId));
    }
}
