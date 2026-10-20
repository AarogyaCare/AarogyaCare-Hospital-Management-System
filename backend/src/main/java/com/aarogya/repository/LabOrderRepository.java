package com.aarogya.repository;

import com.aarogya.model.LabOrderDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LabOrderRepository extends MongoRepository<LabOrderDocument, String> {
    List<LabOrderDocument> findByPatientId(String patientId);
    List<LabOrderDocument> findByAppointmentId(String appointmentId);
    List<LabOrderDocument> findByStatus(String status);
    Optional<LabOrderDocument> findByOrderNumber(String orderNumber);
    boolean existsByOrderNumber(String orderNumber);
}
