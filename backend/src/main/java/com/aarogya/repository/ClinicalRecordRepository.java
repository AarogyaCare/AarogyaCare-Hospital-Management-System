package com.aarogya.repository;

import com.aarogya.model.ClinicalRecordDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClinicalRecordRepository extends MongoRepository<ClinicalRecordDocument, String> {
    List<ClinicalRecordDocument> findByPatientId(String patientId);
    Optional<ClinicalRecordDocument> findByAppointmentId(String appointmentId);
}
