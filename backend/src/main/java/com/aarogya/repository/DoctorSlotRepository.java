package com.aarogya.repository;

import com.aarogya.model.DoctorSlotDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorSlotRepository extends MongoRepository<DoctorSlotDocument, String> {
    List<DoctorSlotDocument> findByDoctorId(String doctorId);
    List<DoctorSlotDocument> findByDoctorIdAndStatus(String doctorId, String status);
    Optional<DoctorSlotDocument> findByDoctorIdAndSlotStart(String doctorId, String slotStart);
}
