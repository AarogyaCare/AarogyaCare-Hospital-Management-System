package com.aarogya.repository;

import com.aarogya.model.InvoiceDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends MongoRepository<InvoiceDocument, String> {
    List<InvoiceDocument> findByPatientId(String patientId);
    Optional<InvoiceDocument> findByAppointmentId(String appointmentId);
    Optional<InvoiceDocument> findByInvoiceNumber(String invoiceNumber);
}
