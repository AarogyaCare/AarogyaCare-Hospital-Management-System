package com.aarogya.repository;

import com.aarogya.model.PatientDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PatientRepository extends MongoRepository<PatientDocument, String> {
    Optional<PatientDocument> findByUserId(String userId);
    Optional<PatientDocument> findByUhid(String uhid);
    boolean existsByUhid(String uhid);
}
