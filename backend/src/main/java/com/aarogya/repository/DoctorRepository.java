package com.aarogya.repository;

import com.aarogya.model.DoctorDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorRepository extends MongoRepository<DoctorDocument, String> {
    Optional<DoctorDocument> findByUserId(String userId);
    List<DoctorDocument> findByDepartmentId(String departmentId);
    List<DoctorDocument> findByIsOnCall(boolean isOnCall);
}
