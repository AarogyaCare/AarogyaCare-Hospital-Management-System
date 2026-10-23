package com.aarogya.service;

import com.aarogya.dto.PharmacyDtos;
import com.aarogya.dto.PrescriptionDtos;
import com.aarogya.exception.Exceptions;
import com.aarogya.model.DoctorDocument;
import com.aarogya.model.IdempotencyRecordDocument;
import com.aarogya.model.InventoryTransactionDocument;
import com.aarogya.model.MedicineDocument;
import com.aarogya.model.PatientDocument;
import com.aarogya.model.PrescriptionDocument;
import com.aarogya.model.UserDocument;
import com.aarogya.repository.DoctorRepository;
import com.aarogya.repository.IdempotencyRecordRepository;
import com.aarogya.repository.InventoryTransactionRepository;
import com.aarogya.repository.MedicineRepository;
import com.aarogya.repository.PatientRepository;
import com.aarogya.repository.PrescriptionRepository;
import com.aarogya.repository.UserRepository;
import com.aarogya.security.UserPrincipal;
import com.aarogya.systemdesign.cache.CacheService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class PharmacyService {

    private static final String ALL_MEDICINES_CACHE_KEY = "medicines:all";
    private static final String PHARMACY_INVENTORY_CACHE_KEY = "pharmacy:inventory";

    private static final Duration MEDICINES_CACHE_TTL = Duration.ofMinutes(30);
    private static final Duration INVENTORY_CACHE_TTL = Duration.ofMinutes(2);

    private static final String STATUS_OUT_OF_STOCK = "OUT_OF_STOCK";
    private static final String STATUS_LOW_STOCK = "LOW_STOCK";
    private static final String STATUS_OPTIMAL = "OPTIMAL";

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
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

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
        return cacheService.getOrLoad(
                ALL_MEDICINES_CACHE_KEY,
                MEDICINES_CACHE_TTL,
                new TypeReference<List<PharmacyDtos.MedicineResponse>>() {},
                this::loadAllMedicines
        );
    }

    private List<PharmacyDtos.MedicineResponse> loadAllMedicines() {
        List<MedicineDocument> medicines = medicineRepository.findAll();
        List<PharmacyDtos.MedicineResponse> result = new ArrayList<>();

        for (MedicineDocument medicine : medicines) {
            result.add(new PharmacyDtos.MedicineResponse(
                    medicine.getId(),
                    medicine.getCode(),
                    medicine.getName(),
                    medicine.getBrandName(),
                    medicine.getCategory(),
                    medicine.getDosageForm(),
                    medicine.getStrength(),
                    medicine.getUnitPrice(),
                    medicine.getCurrentStock(),
                    medicine.getMinimumThreshold(),
                    medicine.getCurrentStock() <= medicine.getMinimumThreshold()
            ));
        }

        return result;
    }

    public List<PharmacyDtos.InventoryItemResponse> getInventory() {
        return cacheService.getOrLoad(
                PHARMACY_INVENTORY_CACHE_KEY,
                INVENTORY_CACHE_TTL,
                new TypeReference<List<PharmacyDtos.InventoryItemResponse>>() {},
                this::loadInventory
        );
    }

    private List<PharmacyDtos.InventoryItemResponse> loadInventory() {
        List<MedicineDocument> medicines = medicineRepository.findAll();
        List<PharmacyDtos.InventoryItemResponse> result = new ArrayList<>();

        for (MedicineDocument medicine : medicines) {
            String status = medicine.getCurrentStock() <= 0
                    ? STATUS_OUT_OF_STOCK
                    : medicine.getCurrentStock() <= medicine.getMinimumThreshold()
                    ? STATUS_LOW_STOCK
                    : STATUS_OPTIMAL;

            result.add(new PharmacyDtos.InventoryItemResponse(
                    medicine.getId(),
                    medicine.getCode(),
                    medicine.getName(),
                    medicine.getBrandName(),
                    medicine.getCategory(),
                    medicine.getDosageForm(),
                    medicine.getStrength(),
                    medicine.getUnitPrice(),
                    medicine.getCurrentStock(),
                    medicine.getMinimumThreshold(),
                    status
            ));
        }

        return result;
    }

    public PharmacyDtos.StockAdjustmentResponse adjustStock(
            PharmacyDtos.StockAdjustmentRequest req,
            String idempotencyKey,
            UserPrincipal principal) {

        if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
            Optional<IdempotencyRecordDocument> existing =
                    idempotencyRepository.findByIdempotencyKey(idempotencyKey);

            if (existing.isPresent()) {
                try {
                    return objectMapper.readValue(
                            existing.get().getResponsePayload(),
                            PharmacyDtos.StockAdjustmentResponse.class
                    );
                } catch (Exception ignored) {
                }
            }
        }

        String type = req.adjustmentType().toUpperCase();
        int qty = req.quantity();
        int previousStock;
        int newStock;

        if ("DISPENSE".equals(type)) {
            Query query = Query.query(
                    Criteria.where("_id")
                            .is(req.medicineId())
                            .and("currentStock")
                            .gte(qty)
            );

            Update update = new Update()
                    .inc("currentStock", -qty)
                    .set("updatedAt", Instant.now());

            MedicineDocument updated = mongoTemplate.findAndModify(
                    query,
                    update,
                    FindAndModifyOptions.options().returnNew(true),
                    MedicineDocument.class
            );

            if (updated == null) {
                MedicineDocument medicine = medicineRepository.findById(req.medicineId())
                        .orElseThrow(() ->
                                new Exceptions.ResourceNotFoundException(
                                        "Medicine not found with id: " + req.medicineId()
                                ));

                throw new Exceptions.ConflictException(
                        "Insufficient pharmacy inventory for '" + medicine.getName()
                                + "'. Available: " + medicine.getCurrentStock()
                                + ", Requested: " + qty
                );
            }

            previousStock = updated.getCurrentStock() + qty;
            newStock = updated.getCurrentStock();

        } else if ("RESTOCK".equals(type)) {
            Query query = Query.query(
                    Criteria.where("_id").is(req.medicineId())
            );

            Update update = new Update()
                    .inc("currentStock", qty)
                    .set("updatedAt", Instant.now());

            MedicineDocument updated = mongoTemplate.findAndModify(
                    query,
                    update,
                    FindAndModifyOptions.options().returnNew(true),
                    MedicineDocument.class
            );

            if (updated == null) {
                throw new Exceptions.ResourceNotFoundException(
                        "Medicine not found with id: " + req.medicineId()
                );
            }

            previousStock = updated.getCurrentStock() - qty;
            newStock = updated.getCurrentStock();

        } else {
            MedicineDocument medicine = medicineRepository.findById(req.medicineId())
                    .orElseThrow(() ->
                            new Exceptions.ResourceNotFoundException(
                                    "Medicine not found with id: " + req.medicineId()
                            ));

            previousStock = medicine.getCurrentStock();
            newStock = qty;

            medicine.setCurrentStock(newStock);
            medicine.setUpdatedAt(Instant.now());

            medicineRepository.save(medicine);
        }

        String txId = UUID.randomUUID().toString();

        InventoryTransactionDocument transaction = new InventoryTransactionDocument(
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

        transactionRepository.save(transaction);

        PharmacyDtos.StockAdjustmentResponse response =
                new PharmacyDtos.StockAdjustmentResponse(
                        txId,
                        req.medicineId(),
                        previousStock,
                        newStock,
                        "SUCCESS"
                );

        if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
            try {
                idempotencyRepository.save(
                        new IdempotencyRecordDocument(
                                UUID.randomUUID().toString(),
                                idempotencyKey,
                                "/api/v1/pharmacy/stock-adjustments",
                                200,
                                objectMapper.writeValueAsString(response)
                        )
                );
            } catch (Exception ignored) {
            }
        }

        invalidateMedicineCaches();

        if (principal != null) {
            auditService.recordEvent(
                    principal.getId(),
                    principal.getUsername(),
                    "ADJUST_STOCK",
                    "Medicine",
                    req.medicineId(),
                    type + " quantity: " + qty
                            + " | Previous: " + previousStock
                            + " | New: " + newStock
            );
        }

        return response;
    }

    public PrescriptionDtos.PrescriptionResponse dispensePrescription(
            String prescriptionId,
            String idempotencyKey,
            UserPrincipal principal) {

        if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
            Optional<IdempotencyRecordDocument> existing =
                    idempotencyRepository.findByIdempotencyKey(idempotencyKey);

            if (existing.isPresent()) {
                try {
                    return objectMapper.readValue(
                            existing.get().getResponsePayload(),
                            PrescriptionDtos.PrescriptionResponse.class
                    );
                } catch (Exception ignored) {
                }
            }
        }

        PrescriptionDocument prescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() ->
                        new Exceptions.ResourceNotFoundException(
                                "Prescription not found with id: " + prescriptionId
                        ));

        if ("DISPENSED".equalsIgnoreCase(prescription.getStatus())) {
            throw new Exceptions.ConflictException(
                    "Prescription " + prescription.getPrescriptionNumber()
                            + " has already been dispensed."
            );
        }

        if ("CANCELLED".equalsIgnoreCase(prescription.getStatus())) {
            throw new Exceptions.ConflictException(
                    "Cannot dispense cancelled prescription "
                            + prescription.getPrescriptionNumber()
            );
        }

        record DecrementRecord(
                String medicineId,
                int quantity,
                int previousStock,
                int newStock) {
        }

        List<DecrementRecord> executedDecrements = new ArrayList<>();

        for (PrescriptionDocument.PrescriptionItem item : prescription.getItems()) {
            int qtyNeeded = item.getQuantity();

            if (qtyNeeded <= 0) {
                continue;
            }

            MedicineDocument targetMedicine = null;

            if (item.getMedicineId() != null && !item.getMedicineId().isBlank()) {
                targetMedicine = medicineRepository.findById(item.getMedicineId()).orElse(null);

                if (targetMedicine == null) {
                    targetMedicine = medicineRepository.findByCode(item.getMedicineId()).orElse(null);
                }
            }

            if (targetMedicine == null
                    && item.getMedicineName() != null
                    && !item.getMedicineName().isBlank()) {

                targetMedicine = medicineRepository
                        .findByNameContainingIgnoreCase(item.getMedicineName())
                        .stream()
                        .findFirst()
                        .orElse(null);
            }

            if (targetMedicine != null) {
                Query query = Query.query(
                        Criteria.where("_id")
                                .is(targetMedicine.getId())
                                .and("currentStock")
                                .gte(qtyNeeded)
                );

                Update update = new Update()
                        .inc("currentStock", -qtyNeeded)
                        .set("updatedAt", Instant.now());

                MedicineDocument updated = mongoTemplate.findAndModify(
                        query,
                        update,
                        FindAndModifyOptions.options().returnNew(true),
                        MedicineDocument.class
                );

                if (updated == null) {
                    for (DecrementRecord decrement : executedDecrements) {
                        mongoTemplate.findAndModify(
                                Query.query(
                                        Criteria.where("_id").is(decrement.medicineId())
                                ),
                                new Update()
                                        .inc("currentStock", decrement.quantity())
                                        .set("updatedAt", Instant.now()),
                                MedicineDocument.class
                        );
                    }

                    MedicineDocument currentMedicine = medicineRepository
                            .findById(targetMedicine.getId())
                            .orElse(targetMedicine);

                    throw new Exceptions.ConflictException(
                            "Insufficient stock for '" + targetMedicine.getName()
                                    + "'. Available: " + currentMedicine.getCurrentStock()
                                    + ", Required: " + qtyNeeded
                    );
                }

                executedDecrements.add(
                        new DecrementRecord(
                                targetMedicine.getId(),
                                qtyNeeded,
                                updated.getCurrentStock() + qtyNeeded,
                                updated.getCurrentStock()
                        )
                );

                String txId = UUID.randomUUID().toString();

                InventoryTransactionDocument transaction =
                        new InventoryTransactionDocument(
                                txId,
                                targetMedicine.getId(),
                                "DISPENSE",
                                qtyNeeded,
                                updated.getCurrentStock() + qtyNeeded,
                                updated.getCurrentStock(),
                                prescription.getId(),
                                idempotencyKey,
                                principal != null ? principal.getUsername() : "pharmacist"
                        );

                transactionRepository.save(transaction);
            }
        }

        prescription.setStatus("DISPENSED");
        prescription.setUpdatedAt(Instant.now());

        prescriptionRepository.save(prescription);

        invalidateMedicineCaches();

        PrescriptionDtos.PrescriptionResponse response =
                mapPrescriptionToDto(prescription);

        if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
            try {
                idempotencyRepository.save(
                        new IdempotencyRecordDocument(
                                UUID.randomUUID().toString(),
                                idempotencyKey,
                                "/api/v1/pharmacy/prescriptions/"
                                        + prescriptionId + "/dispense",
                                200,
                                objectMapper.writeValueAsString(response)
                        )
                );
            } catch (Exception ignored) {
            }
        }

        if (principal != null) {
            auditService.recordEvent(
                    principal.getId(),
                    principal.getUsername(),
                    "DISPENSE_PRESCRIPTION",
                    "Prescription",
                    prescription.getId(),
                    "Dispensed prescription "
                            + prescription.getPrescriptionNumber()
                            + " with " + executedDecrements.size()
                            + " stock decrements"
            );
        }

        return response;
    }

    private void invalidateMedicineCaches() {
        cacheService.evict(PHARMACY_INVENTORY_CACHE_KEY);
        cacheService.evict(ALL_MEDICINES_CACHE_KEY);
    }

    private PrescriptionDtos.PrescriptionResponse mapPrescriptionToDto(
            PrescriptionDocument prescription) {

        String doctorName = "Dr. Specialist";

        DoctorDocument doctor = doctorRepository
                .findById(prescription.getDoctorId())
                .orElse(null);

        if (doctor != null) {
            UserDocument doctorUser = userRepository
                    .findById(doctor.getUserId())
                    .orElse(null);

            if (doctorUser != null) {
                doctorName = doctorUser.getFullName();
            }
        }

        List<PrescriptionDtos.PrescriptionItemDto> itemDtos = new ArrayList<>();

        for (PrescriptionDocument.PrescriptionItem item : prescription.getItems()) {
            itemDtos.add(
                    new PrescriptionDtos.PrescriptionItemDto(
                            item.getMedicineId(),
                            item.getMedicineName(),
                            item.getDosage(),
                            item.getFrequency(),
                            item.getDurationDays(),
                            item.getInstructions(),
                            item.getQuantity()
                    )
            );
        }

        String patientName = "Patient";

        if (prescription.getPatientId() != null) {
            PatientDocument patient = patientRepository
                    .findById(prescription.getPatientId())
                    .orElse(null);

            if (patient != null && patient.getUserId() != null) {
                UserDocument patientUser = userRepository
                        .findById(patient.getUserId())
                        .orElse(null);

                if (patientUser != null
                        && patientUser.getFullName() != null
                        && !patientUser.getFullName().isBlank()) {

                    patientName = patientUser.getFullName();
                }
            }
        }

        return new PrescriptionDtos.PrescriptionResponse(
                prescription.getId(),
                prescription.getPrescriptionNumber(),
                prescription.getPatientId(),
                patientName,
                prescription.getAppointmentId(),
                prescription.getDoctorId(),
                doctorName,
                prescription.getStatus(),
                itemDtos,
                prescription.getCreatedAt()
        );
    }
}
