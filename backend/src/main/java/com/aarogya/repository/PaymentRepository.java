package com.aarogya.repository;

import com.aarogya.model.PaymentDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends MongoRepository<PaymentDocument, String> {
    List<PaymentDocument> findByInvoiceId(String invoiceId);
    Optional<PaymentDocument> findByIdempotencyKey(String idempotencyKey);
}
