package com.aarogya.repository;

import com.aarogya.model.PrescriptionDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PrescriptionRepository extends MongoRepository<PrescriptionDocument, String> {
    List<PrescriptionDocument> findByPatientId(String patientId);
    Optional<PrescriptionDocument> findByAppointmentId(String appointmentId);
    Optional<PrescriptionDocument> findByPrescriptionNumber(String prescriptionNumber);
}
