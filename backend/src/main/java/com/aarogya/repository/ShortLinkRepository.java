package com.aarogya.repository;

import com.aarogya.model.ShortLinkDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ShortLinkRepository extends MongoRepository<ShortLinkDocument, String> {
    Optional<ShortLinkDocument> findByCode(String code);
}
