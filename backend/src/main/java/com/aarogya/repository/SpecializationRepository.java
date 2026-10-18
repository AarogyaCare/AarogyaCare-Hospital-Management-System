package com.aarogya.repository;

import com.aarogya.model.SpecializationDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpecializationRepository extends MongoRepository<SpecializationDocument, String> {
    List<SpecializationDocument> findByDepartmentId(String departmentId);
}
