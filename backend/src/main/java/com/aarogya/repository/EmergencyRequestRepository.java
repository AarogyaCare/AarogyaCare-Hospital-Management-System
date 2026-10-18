package com.aarogya.repository;

import com.aarogya.model.EmergencyRequestDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmergencyRequestRepository extends MongoRepository<EmergencyRequestDocument, String> {
    List<EmergencyRequestDocument> findByStatus(String status);
    List<EmergencyRequestDocument> findAllByOrderByPriorityScoreAscCreatedAtDesc();
}
