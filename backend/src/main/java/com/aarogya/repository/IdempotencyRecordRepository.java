package com.aarogya.repository;

import com.aarogya.model.IdempotencyRecordDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IdempotencyRecordRepository extends MongoRepository<IdempotencyRecordDocument, String> {
    Optional<IdempotencyRecordDocument> findByIdempotencyKey(String idempotencyKey);
}
