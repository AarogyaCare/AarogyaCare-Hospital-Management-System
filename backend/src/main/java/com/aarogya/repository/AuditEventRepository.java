package com.aarogya.repository;

import com.aarogya.model.AuditEventDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditEventRepository extends MongoRepository<AuditEventDocument, String> {
    List<AuditEventDocument> findByUserId(String userId);
    List<AuditEventDocument> findAllByOrderByTimestampDesc();
}
