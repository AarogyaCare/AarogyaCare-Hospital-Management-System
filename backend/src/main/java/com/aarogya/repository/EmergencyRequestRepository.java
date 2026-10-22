package com.aarogya.repository;

import com.aarogya.model.EmergencyRequestDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmergencyRequestRepository extends MongoRepository<EmergencyRequestDocument, String> {
    List<EmergencyRequestDocument> findByStatus(String status);
    List<EmergencyRequestDocument> findAllByOrderByPriorityScoreAscCreatedAtDesc();
    List<EmergencyRequestDocument> findByDoctorIdAndStatusNot(String doctorId, String status);
    List<EmergencyRequestDocument> findByDoctorId(String doctorId);
    List<EmergencyRequestDocument> findByPatientIdOrderByCreatedAtDesc(String patientId);
    Optional<EmergencyRequestDocument> findByIncidentNumber(String incidentNumber);
}
