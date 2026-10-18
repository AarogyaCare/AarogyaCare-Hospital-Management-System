package com.aarogya.service;

import com.aarogya.dto.EmergencyDtos;
import com.aarogya.exception.Exceptions;
import com.aarogya.model.EmergencyRequestDocument;
import com.aarogya.repository.EmergencyRequestRepository;
import com.aarogya.security.UserPrincipal;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class EmergencyService {

    private final EmergencyRequestRepository emergencyRepository;
    private final AuditService auditService;

    public EmergencyService(EmergencyRequestRepository emergencyRepository, AuditService auditService) {
        this.emergencyRepository = emergencyRepository;
        this.auditService = auditService;
    }

    public EmergencyDtos.EmergencyResponse createEmergencyRequest(EmergencyDtos.EmergencyCreateRequest req, UserPrincipal principal) {
        String triageLevel = req.triageLevel() != null ? req.triageLevel().toUpperCase() : "YELLOW";
        String id = UUID.randomUUID().toString();

        EmergencyRequestDocument doc = new EmergencyRequestDocument(
                id,
                req.patientName(),
                req.patientId(),
                req.contactNumber(),
                triageLevel,
                req.chiefComplaint(),
                req.vitalSigns()
        );
        emergencyRepository.save(doc);

        auditService.recordEvent(
                principal != null ? principal.getId() : "emergency-portal",
                principal != null ? principal.getUsername() : "triage@aarogya.org",
                "CREATE_EMERGENCY_REQUEST",
                "EmergencyRequest",
                id,
                "Intake for " + req.patientName() + " with triage level " + triageLevel
        );

        return mapToDto(doc);
    }

    public List<EmergencyDtos.EmergencyResponse> getEmergencyQueue(String statusFilter) {
        List<EmergencyRequestDocument> docs;
        if (statusFilter != null && !statusFilter.trim().isEmpty() && !statusFilter.equalsIgnoreCase("ALL")) {
            docs = emergencyRepository.findByStatus(statusFilter.toUpperCase());
        } else {
            docs = emergencyRepository.findAllByOrderByPriorityScoreAscCreatedAtDesc();
        }

        List<EmergencyDtos.EmergencyResponse> result = new ArrayList<>();
        for (EmergencyRequestDocument doc : docs) {
            result.add(mapToDto(doc));
        }
        return result;
    }

    public EmergencyDtos.EmergencyResponse updateStatus(String id, String status, UserPrincipal principal) {
        EmergencyRequestDocument doc = emergencyRepository.findById(id)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Emergency request not found with id: " + id));

        doc.setStatus(status.toUpperCase());
        doc.setUpdatedAt(Instant.now());
        emergencyRepository.save(doc);

        auditService.recordEvent(
                principal != null ? principal.getId() : "nurse",
                principal != null ? principal.getUsername() : "nurse@aarogya.org",
                "UPDATE_EMERGENCY_STATUS",
                "EmergencyRequest",
                id,
                "Status updated to " + status
        );

        return mapToDto(doc);
    }

    private EmergencyDtos.EmergencyResponse mapToDto(EmergencyRequestDocument doc) {
        return new EmergencyDtos.EmergencyResponse(
                doc.getId(),
                doc.getPatientName(),
                doc.getPatientId(),
                doc.getContactNumber(),
                doc.getTriageLevel(),
                doc.getChiefComplaint(),
                doc.getVitalSigns(),
                doc.getStatus(),
                doc.getPriorityScore(),
                doc.getCreatedAt()
        );
    }
}
