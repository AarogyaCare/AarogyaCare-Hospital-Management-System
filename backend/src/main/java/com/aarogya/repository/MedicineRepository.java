package com.aarogya.repository;

import com.aarogya.model.MedicineDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicineRepository extends MongoRepository<MedicineDocument, String> {
    Optional<MedicineDocument> findByCode(String code);
    List<MedicineDocument> findByNameContainingIgnoreCase(String name);
}
