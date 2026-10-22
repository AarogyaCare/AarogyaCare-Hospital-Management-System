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

import com.aarogya.dto.PrescriptionDtos;
import com.aarogya.model.DoctorDocument;
import com.aarogya.model.PrescriptionDocument;
import com.aarogya.model.UserDocument;
import com.aarogya.repository.DoctorRepository;
import com.aarogya.repository.PrescriptionRepository;
import com.aarogya.repository.PatientRepository;
import com.aarogya.model.PatientDocument;
import com.aarogya.repository.UserRepository;
import com.aarogya.systemdesign.cache.CacheService;

@Service
public class PharmacyService {

    private final MedicineRepository medicineRepository;
    private final InventoryTransactionRepository transactionRepository;
    private final IdempotencyRecordRepository idempotencyRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final CacheService cacheService;
    private final MongoTemplate mongoTemplate;
    private final AuditService auditService;
    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule())
            .disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    public PharmacyService(
            MedicineRepository medicineRepository,
            InventoryTransactionRepository transactionRepository,
            IdempotencyRecordRepository idempotencyRepository,
            PrescriptionRepository prescriptionRepository,
            PatientRepository patientRepository,
            UserRepository userRepository,
            DoctorRepository doctorRepository,
            CacheService cacheService,
            MongoTemplate mongoTemplate,
            AuditService auditService) {
        this.medicineRepository = medicineRepository;
        this.transactionRepository = transactionRepository;
        this.idempotencyRepository = idempotencyRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.cacheService = cacheService;
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

        // Invalidate Redis caches after stock update
        cacheService.evict("pharmacy:inventory");
        cacheService.evict("medicines:all");

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

    public PrescriptionDtos.PrescriptionResponse dispensePrescription(String prescriptionId, String idempotencyKey, UserPrincipal principal) {
        // 1. Idempotency check
        if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
            Optional<IdempotencyRecordDocument> existing = idempotencyRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) {
                try {
                    return objectMapper.readValue(existing.get().getResponsePayload(), PrescriptionDtos.PrescriptionResponse.class);
                } catch (Exception ignored) {}
            }
        }

        PrescriptionDocument rx = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Prescription not found with id: " + prescriptionId));

        if ("DISPENSED".equalsIgnoreCase(rx.getStatus())) {
            throw new Exceptions.ConflictException("Prescription " + rx.getPrescriptionNumber() + " has already been dispensed.");
        }
        if ("CANCELLED".equalsIgnoreCase(rx.getStatus())) {
            throw new Exceptions.ConflictException("Cannot dispense cancelled prescription " + rx.getPrescriptionNumber());
        }

        // 2. Perform atomic stock decrement per medication with rollback support
        record DecrementRecord(String medicineId, int quantity, int previousStock, int newStock) {}
        List<DecrementRecord> executedDecrements = new ArrayList<>();

        for (PrescriptionDocument.PrescriptionItem item : rx.getItems()) {
            int qtyNeeded = item.getQuantity();
            if (qtyNeeded <= 0) continue;

            MedicineDocument targetMed = null;
            if (item.getMedicineId() != null && !item.getMedicineId().isBlank()) {
                targetMed = medicineRepository.findById(item.getMedicineId()).orElse(null);
                if (targetMed == null) {
                    targetMed = medicineRepository.findByCode(item.getMedicineId()).orElse(null);
                }
            }
            if (targetMed == null && item.getMedicineName() != null && !item.getMedicineName().isBlank()) {
                targetMed = medicineRepository.findByNameContainingIgnoreCase(item.getMedicineName()).stream().findFirst().orElse(null);
            }

            if (targetMed != null) {
                Query query = Query.query(Criteria.where("_id").is(targetMed.getId()).and("currentStock").gte(qtyNeeded));
                Update update = new Update().inc("currentStock", -qtyNeeded).set("updatedAt", Instant.now());
                MedicineDocument updated = mongoTemplate.findAndModify(
                        query,
                        update,
                        FindAndModifyOptions.options().returnNew(true),
                        MedicineDocument.class
                );

                if (updated == null) {
                    // Rollback any previous decrements for this prescription
                    for (DecrementRecord dec : executedDecrements) {
                        mongoTemplate.findAndModify(
                                Query.query(Criteria.where("_id").is(dec.medicineId())),
                                new Update().inc("currentStock", dec.quantity()).set("updatedAt", Instant.now()),
                                MedicineDocument.class
                        );
                    }
                    MedicineDocument current = medicineRepository.findById(targetMed.getId()).orElse(targetMed);
                    throw new Exceptions.ConflictException("Insufficient stock for '" + targetMed.getName() + "'. Available: " + current.getCurrentStock() + ", Required: " + qtyNeeded);
                }

                executedDecrements.add(new DecrementRecord(targetMed.getId(), qtyNeeded, updated.getCurrentStock() + qtyNeeded, updated.getCurrentStock()));

                // Persist transaction log
                String txId = UUID.randomUUID().toString();
                InventoryTransactionDocument tx = new InventoryTransactionDocument(
                        txId,
                        targetMed.getId(),
                        "DISPENSE",
                        qtyNeeded,
                        updated.getCurrentStock() + qtyNeeded,
                        updated.getCurrentStock(),
                        rx.getId(),
                        idempotencyKey,
                        principal != null ? principal.getUsername() : "pharmacist"
                );
                transactionRepository.save(tx);
            }
        }

        // 3. Mark prescription as dispensed
        rx.setStatus("DISPENSED");
        rx.setUpdatedAt(Instant.now());
        prescriptionRepository.save(rx);

        // 4. Invalidate caches
        cacheService.evict("pharmacy:inventory");
        cacheService.evict("medicines:all");

        PrescriptionDtos.PrescriptionResponse response = mapPrescriptionToDto(rx);

        // 5. Store idempotency record
        if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
            try {
                idempotencyRepository.save(new IdempotencyRecordDocument(
                        UUID.randomUUID().toString(),
                        idempotencyKey,
                        "/api/v1/pharmacy/prescriptions/" + prescriptionId + "/dispense",
                        200,
                        objectMapper.writeValueAsString(response)
                ));
            } catch (Exception ignored) {}
        }

        if (principal != null) {
            auditService.recordEvent(
                    principal.getId(),
                    principal.getUsername(),
                    "DISPENSE_PRESCRIPTION",
                    "Prescription",
                    rx.getId(),
                    "Dispensed prescription " + rx.getPrescriptionNumber() + " with " + executedDecrements.size() + " stock decrements"
            );
        }

        return response;
    }

    private PrescriptionDtos.PrescriptionResponse mapPrescriptionToDto(PrescriptionDocument rx) {
        String doctorName = "Dr. Specialist";
        DoctorDocument doc = doctorRepository.findById(rx.getDoctorId()).orElse(null);
        if (doc != null) {
            UserDocument u = userRepository.findById(doc.getUserId()).orElse(null);
            if (u != null) doctorName = u.getFullName();
        }

        List<PrescriptionDtos.PrescriptionItemDto> itemDtos = new ArrayList<>();
        for (PrescriptionDocument.PrescriptionItem item : rx.getItems()) {
            itemDtos.add(new PrescriptionDtos.PrescriptionItemDto(
                    item.getMedicineId(),
                    item.getMedicineName(),
                    item.getDosage(),
                    item.getFrequency(),
                    item.getDurationDays(),
                    item.getInstructions(),
                    item.getQuantity()
            ));
        }

        String patientName = "Patient";
        if (rx.getPatientId() != null) {
            PatientDocument p = patientRepository.findById(rx.getPatientId()).orElse(null);
            if (p != null && p.getUserId() != null) {
                UserDocument u = userRepository.findById(p.getUserId()).orElse(null);
                if (u != null && u.getFullName() != null && !u.getFullName().isBlank()) {
                    patientName = u.getFullName();
                }
            }
        }

        return new PrescriptionDtos.PrescriptionResponse(
                rx.getId(),
                rx.getPrescriptionNumber(),
                rx.getPatientId(),
                patientName,
                rx.getAppointmentId(),
                rx.getDoctorId(),
                doctorName,
                rx.getStatus(),
                itemDtos,
                rx.getCreatedAt()
        );
    }
}
