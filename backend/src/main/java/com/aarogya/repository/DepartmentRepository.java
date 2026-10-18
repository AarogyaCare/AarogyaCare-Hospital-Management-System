package com.aarogya.repository;

import com.aarogya.model.DepartmentDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DepartmentRepository extends MongoRepository<DepartmentDocument, String> {
    Optional<DepartmentDocument> findByCode(String code);
}
