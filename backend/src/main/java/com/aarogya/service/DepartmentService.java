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

    private static final String DEPARTMENT_LIST_CACHE_KEY = "departments:all";
    private static final String DEPARTMENT_DETAIL_CACHE_PREFIX = "departments:detail:";
    private static final String SPECIALIZATION_CACHE_PREFIX = "specializations:department:";
    private static final String ALL_SPECIALIZATIONS_CACHE_KEY = "specializations:all";

    private static final Duration DEPARTMENT_CACHE_TTL = Duration.ofHours(1);
    private static final Duration SPECIALIZATION_CACHE_TTL = Duration.ofMinutes(30);

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
        List<DepartmentDocument> cached = (List<DepartmentDocument>) cacheService.get(DEPARTMENT_LIST_CACHE_KEY, List.class);
        if (cached != null) {
            return cached;
        }

        List<DepartmentDocument> departments = departmentRepository.findAll();
        cacheService.set(DEPARTMENT_LIST_CACHE_KEY, departments, DEPARTMENT_CACHE_TTL);
        return departments;
    }

    public Optional<DepartmentDocument> getDepartmentById(String id) {
        if (id == null || id.isBlank()) {
            return Optional.empty();
        }

        String cacheKey = DEPARTMENT_DETAIL_CACHE_PREFIX + id.trim().toLowerCase();
        DepartmentDocument cached = cacheService.get(cacheKey, DepartmentDocument.class);

        if (cached != null) {
            return Optional.of(cached);
        }

        Optional<DepartmentDocument> department = departmentRepository.findById(id)
                .or(() -> departmentRepository.findByCode(id.toUpperCase()));

        department.ifPresent(value -> cacheService.set(cacheKey, value, DEPARTMENT_CACHE_TTL));
        return department;
    }

    @SuppressWarnings("unchecked")
    public List<SpecializationDocument> getSpecializations(String departmentId) {
        if (departmentId != null && !departmentId.isBlank()) {
            String normalizedDepartmentId = departmentId.trim();
            String cacheKey = SPECIALIZATION_CACHE_PREFIX + normalizedDepartmentId;

            List<SpecializationDocument> cached = (List<SpecializationDocument>) cacheService.get(cacheKey, List.class);
            if (cached != null) {
                return cached;
            }

            List<SpecializationDocument> specializations = specializationRepository.findByDepartmentId(normalizedDepartmentId);
            cacheService.set(cacheKey, specializations, SPECIALIZATION_CACHE_TTL);
            return specializations;
        }

        List<SpecializationDocument> cached = (List<SpecializationDocument>) cacheService.get(ALL_SPECIALIZATIONS_CACHE_KEY, List.class);
        if (cached != null) {
            return cached;
        }

        List<SpecializationDocument> specializations = specializationRepository.findAll();
        cacheService.set(ALL_SPECIALIZATIONS_CACHE_KEY, specializations, SPECIALIZATION_CACHE_TTL);
        return specializations;
    }

    public void evictDepartmentCache(String departmentId) {
        cacheService.evict(DEPARTMENT_LIST_CACHE_KEY);

        if (departmentId != null && !departmentId.isBlank()) {
            cacheService.evict(DEPARTMENT_DETAIL_CACHE_PREFIX + departmentId.trim().toLowerCase());
        }
    }

    public void evictSpecializationCache(String departmentId) {
        cacheService.evict(ALL_SPECIALIZATIONS_CACHE_KEY);

        if (departmentId != null && !departmentId.isBlank()) {
            cacheService.evict(SPECIALIZATION_CACHE_PREFIX + departmentId.trim());
        }
    }
}
