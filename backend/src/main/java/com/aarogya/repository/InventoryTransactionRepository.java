package com.aarogya.repository;

import com.aarogya.model.InventoryTransactionDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryTransactionRepository extends MongoRepository<InventoryTransactionDocument, String> {
    List<InventoryTransactionDocument> findByMedicineId(String medicineId);
    Optional<InventoryTransactionDocument> findByIdempotencyKey(String idempotencyKey);
}
