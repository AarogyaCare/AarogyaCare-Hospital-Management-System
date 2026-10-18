package com.aarogya.repository;

import com.aarogya.model.AppointmentDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends MongoRepository<AppointmentDocument, String> {
    List<AppointmentDocument> findByPatientId(String patientId);
    List<AppointmentDocument> findByDoctorId(String doctorId);
    Optional<AppointmentDocument> findBySlotId(String slotId);
    Optional<AppointmentDocument> findByAppointmentNumber(String appointmentNumber);
}
