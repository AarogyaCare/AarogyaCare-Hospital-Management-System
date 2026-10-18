package com.aarogya.service;

import com.aarogya.model.DepartmentDocument;
import com.aarogya.model.SpecializationDocument;
import com.aarogya.repository.DepartmentRepository;
import com.aarogya.repository.SpecializationRepository;
import com.aarogya.systemdesign.cache.CacheService;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final SpecializationRepository specializationRepository;
    private final CacheService cacheService;

    public DepartmentService(DepartmentRepository departmentRepository, SpecializationRepository specializationRepository, CacheService cacheService) {
        this.departmentRepository = departmentRepository;
        this.specializationRepository = specializationRepository;
        this.cacheService = cacheService;
    }

    @SuppressWarnings("unchecked")
    public List<DepartmentDocument> getAllDepartments() {
        String cacheKey = "departments:all";
        List<DepartmentDocument> cached = (List<DepartmentDocument>) cacheService.get(cacheKey, List.class);
        if (cached != null) {
            return cached;
        }

        List<DepartmentDocument> departments = departmentRepository.findAll();
        cacheService.set(cacheKey, departments, Duration.ofHours(1));
        return departments;
    }

    public Optional<DepartmentDocument> getDepartmentById(String id) {
        return departmentRepository.findById(id).or(() -> departmentRepository.findByCode(id.toUpperCase()));
    }

    public List<SpecializationDocument> getSpecializations(String departmentId) {
        if (departmentId != null && !departmentId.isEmpty()) {
            return specializationRepository.findByDepartmentId(departmentId);
        }
        return specializationRepository.findAll();
    }
}
