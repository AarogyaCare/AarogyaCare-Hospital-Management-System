package com.aarogya.service;

import com.aarogya.dto.PharmacyDtos;
import com.aarogya.exception.Exceptions;
import com.aarogya.model.IdempotencyRecordDocument;
import com.aarogya.model.InventoryTransactionDocument;
import com.aarogya.model.MedicineDocument;
import com.aarogya.repository.IdempotencyRecordRepository;
import com.aarogya.repository.InventoryTransactionRepository;
import com.aarogya.repository.MedicineRepository;
import com.aarogya.security.UserPrincipal;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
public class PharmacyService {

    private final MedicineRepository medicineRepository;
    private final InventoryTransactionRepository transactionRepository;
    private final IdempotencyRecordRepository idempotencyRepository;
    private final MongoTemplate mongoTemplate;
    private final AuditService auditService;
    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule())
            .disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    public PharmacyService(
            MedicineRepository medicineRepository,
            InventoryTransactionRepository transactionRepository,
            IdempotencyRecordRepository idempotencyRepository,
            MongoTemplate mongoTemplate,
            AuditService auditService) {
        this.medicineRepository = medicineRepository;
        this.transactionRepository = transactionRepository;
        this.idempotencyRepository = idempotencyRepository;
        this.mongoTemplate = mongoTemplate;
        this.auditService = auditService;
    }

    public List<PharmacyDtos.MedicineResponse> getAllMedicines() {
        List<MedicineDocument> list = medicineRepository.findAll();
        List<PharmacyDtos.MedicineResponse> result = new ArrayList<>();
        for (MedicineDocument m : list) {
            result.add(new PharmacyDtos.MedicineResponse(
                    m.getId(),
                    m.getCode(),
                    m.getName(),
                    m.getBrandName(),
                    m.getCategory(),
                    m.getDosageForm(),
                    m.getStrength(),
                    m.getUnitPrice(),
                    m.getCurrentStock(),
                    m.getMinimumThreshold(),
                    m.getCurrentStock() <= m.getMinimumThreshold()
            ));
        }
        return result;
    }

    public List<PharmacyDtos.InventoryItemResponse> getInventory() {
        List<MedicineDocument> list = medicineRepository.findAll();
        List<PharmacyDtos.InventoryItemResponse> result = new ArrayList<>();
        for (MedicineDocument m : list) {
            String status = m.getCurrentStock() <= 0 ? "OUT_OF_STOCK"
                    : m.getCurrentStock() <= m.getMinimumThreshold() ? "LOW_STOCK"
                    : "OPTIMAL";

            result.add(new PharmacyDtos.InventoryItemResponse(
                    m.getId(),
                    m.getCode(),
                    m.getName(),
                    m.getBrandName(),
                    m.getCategory(),
                    m.getDosageForm(),
                    m.getStrength(),
                    m.getUnitPrice(),
                    m.getCurrentStock(),
                    m.getMinimumThreshold(),
                    status
            ));
        }
        return result;
    }

    public PharmacyDtos.StockAdjustmentResponse adjustStock(PharmacyDtos.StockAdjustmentRequest req, String idempotencyKey, UserPrincipal principal) {
        // 1. Check idempotency record
        if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
            Optional<IdempotencyRecordDocument> existing = idempotencyRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) {
                try {
                    return objectMapper.readValue(existing.get().getResponsePayload(), PharmacyDtos.StockAdjustmentResponse.class);
                } catch (Exception ignored) {}
            }
        }

        String type = req.adjustmentType().toUpperCase();
        int qty = req.quantity();
        int previousStock;
        int newStock;

        if ("DISPENSE".equals(type)) {
            // Authoritative Atomic Stock Decrement: currentStock >= quantity
            // NOTE: MongoTemplate requires BSON field "_id" for @Id fields
            Query query = Query.query(Criteria.where("_id").is(req.medicineId()).and("currentStock").gte(qty));
            Update update = new Update().inc("currentStock", -qty).set("updatedAt", Instant.now());
            MedicineDocument updated = mongoTemplate.findAndModify(
                    query,
                    update,
                    FindAndModifyOptions.options().returnNew(true),
                    MedicineDocument.class
            );

            if (updated == null) {
                MedicineDocument med = medicineRepository.findById(req.medicineId())
                        .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Medicine not found with id: " + req.medicineId()));
                throw new Exceptions.ConflictException("Insufficient pharmacy inventory for '" + med.getName() + "'. Available: " + med.getCurrentStock() + ", Requested: " + qty);
            }

            previousStock = updated.getCurrentStock() + qty;
            newStock = updated.getCurrentStock();
        } else if ("RESTOCK".equals(type)) {
            Query query = Query.query(Criteria.where("_id").is(req.medicineId()));
            Update update = new Update().inc("currentStock", qty).set("updatedAt", Instant.now());
            MedicineDocument updated = mongoTemplate.findAndModify(
                    query,
                    update,
                    FindAndModifyOptions.options().returnNew(true),
                    MedicineDocument.class
            );

            if (updated == null) {
                throw new Exceptions.ResourceNotFoundException("Medicine not found with id: " + req.medicineId());
            }

            previousStock = updated.getCurrentStock() - qty;
            newStock = updated.getCurrentStock();
        } else {
            // Audit adjustment
            MedicineDocument med = medicineRepository.findById(req.medicineId())
                    .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Medicine not found with id: " + req.medicineId()));
            previousStock = med.getCurrentStock();
            newStock = qty;
            med.setCurrentStock(newStock);
            med.setUpdatedAt(Instant.now());
            medicineRepository.save(med);
        }

        // Persist durable inventory transaction
        String txId = UUID.randomUUID().toString();
        InventoryTransactionDocument tx = new InventoryTransactionDocument(
                txId,
                req.medicineId(),
                type,
                qty,
                previousStock,
                newStock,
                req.referenceId(),
                idempotencyKey,
                principal != null ? principal.getUsername() : "system"
        );
        transactionRepository.save(tx);

        PharmacyDtos.StockAdjustmentResponse response = new PharmacyDtos.StockAdjustmentResponse(
                txId,
                req.medicineId(),
                previousStock,
                newStock,
                "SUCCESS"
        );

        // Save idempotency key record
        if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
            try {
                idempotencyRepository.save(new IdempotencyRecordDocument(
                        UUID.randomUUID().toString(),
                        idempotencyKey,
                        "/api/v1/pharmacy/stock-adjustments",
                        200,
                        objectMapper.writeValueAsString(response)
                ));
            } catch (Exception ignored) {}
        }

        if (principal != null) {
            auditService.recordEvent(
                    principal.getId(),
                    principal.getUsername(),
                    "ADJUST_STOCK",
                    "Medicine",
                    req.medicineId(),
                    type + " quantity: " + qty + " | Previous: " + previousStock + " | New: " + newStock
            );
        }

        return response;
    }
}
