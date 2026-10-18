package com.aarogya.service;

import com.aarogya.model.AuditEventDocument;
import com.aarogya.repository.AuditEventRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class AuditService {

    private final AuditEventRepository auditRepository;

    public AuditService(AuditEventRepository auditRepository) {
        this.auditRepository = auditRepository;
    }

    @Async
    public void recordEvent(String userId, String userEmail, String action, String resourceType, String resourceId, String details) {
        try {
            AuditEventDocument event = new AuditEventDocument(
                    UUID.randomUUID().toString(),
                    userId,
                    userEmail,
                    action,
                    resourceType,
                    resourceId,
                    "127.0.0.1",
                    details
            );
            auditRepository.save(event);
        } catch (Exception ignored) {}
    }

    public List<AuditEventDocument> getAllAuditEvents() {
        return auditRepository.findAllByOrderByTimestampDesc();
    }
}
