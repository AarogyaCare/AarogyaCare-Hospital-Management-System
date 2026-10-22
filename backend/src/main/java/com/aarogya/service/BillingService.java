package com.aarogya.service;

import com.aarogya.dto.BillingDtos;
import com.aarogya.exception.Exceptions;
import com.aarogya.model.IdempotencyRecordDocument;
import com.aarogya.model.InvoiceDocument;
import com.aarogya.model.PatientDocument;
import com.aarogya.model.PaymentDocument;
import com.aarogya.repository.IdempotencyRecordRepository;
import com.aarogya.repository.InvoiceRepository;
import com.aarogya.repository.PatientRepository;
import com.aarogya.repository.PaymentRepository;
import com.aarogya.repository.UserRepository;
import com.aarogya.model.UserDocument;
import com.aarogya.repository.AppointmentRepository;
import com.aarogya.repository.DoctorRepository;
import com.aarogya.model.DoctorDocument;
import com.aarogya.security.UserPrincipal;
import com.aarogya.systemdesign.id.UniqueIdGeneratorService;
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
public class BillingService {

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final IdempotencyRecordRepository idempotencyRepository;
    private final MongoTemplate mongoTemplate;
    private final UniqueIdGeneratorService idGenerator;
    private final AuditService auditService;
    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule())
            .disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    public BillingService(
            InvoiceRepository invoiceRepository,
            PaymentRepository paymentRepository,
            PatientRepository patientRepository,
            UserRepository userRepository,
            IdempotencyRecordRepository idempotencyRepository,
            MongoTemplate mongoTemplate,
            UniqueIdGeneratorService idGenerator,
            AuditService auditService,
            AppointmentRepository appointmentRepository,
            DoctorRepository doctorRepository) {
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
        this.idempotencyRepository = idempotencyRepository;
        this.mongoTemplate = mongoTemplate;
        this.idGenerator = idGenerator;
        this.auditService = auditService;
        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
    }

    public BillingDtos.InvoiceResponse createInvoice(BillingDtos.CreateInvoiceRequest req, UserPrincipal principal) {
        double subtotal = 0.0;
        List<InvoiceDocument.InvoiceItem> items = new ArrayList<>();
        for (BillingDtos.InvoiceItemDto item : req.items()) {
            double unitPrice = item.unitPrice();
            if ("CONSULTATION".equalsIgnoreCase(item.itemType()) && unitPrice <= 0.0 && req.appointmentId() != null) {
                unitPrice = resolveConsultationFeeForAppointment(req.appointmentId());
            }
            int quantity = item.quantity() > 0 ? item.quantity() : 1;
            double total = unitPrice * quantity;
            subtotal += total;
            items.add(new InvoiceDocument.InvoiceItem(
                    item.description(),
                    item.itemType(),
                    unitPrice,
                    quantity,
                    total
            ));
        }

        double netPayable = Math.max(0.0, subtotal - req.discountAmount() + req.taxAmount());
        String invoiceNumber = idGenerator.nextPrefixedId("INV");

        InvoiceDocument doc = new InvoiceDocument(
                UUID.randomUUID().toString(),
                invoiceNumber,
                req.patientId(),
                req.appointmentId(),
                subtotal,
                req.discountAmount(),
                req.taxAmount(),
                netPayable,
                items
        );
        invoiceRepository.save(doc);

        auditService.recordEvent(
                principal != null ? principal.getId() : "system",
                principal != null ? principal.getUsername() : "billing@aarogya.org",
                "CREATE_INVOICE",
                "Invoice",
                doc.getId(),
                "Created invoice " + invoiceNumber + " for amount ₹" + netPayable
        );

        return mapInvoiceToDto(doc);
    }

    public List<BillingDtos.InvoiceResponse> getInvoicesByPatient(String patientIdOrUhid) {
        String patientId = resolvePatientId(patientIdOrUhid);
        List<InvoiceDocument> list = invoiceRepository.findByPatientId(patientId);
        List<BillingDtos.InvoiceResponse> result = new ArrayList<>();
        for (InvoiceDocument doc : list) {
            result.add(mapInvoiceToDto(doc));
        }
        return result;
    }

    public List<BillingDtos.InvoiceResponse> getAllInvoices() {
        List<InvoiceDocument> list = invoiceRepository.findAll();
        List<BillingDtos.InvoiceResponse> result = new ArrayList<>();
        for (InvoiceDocument doc : list) {
            result.add(mapInvoiceToDto(doc));
        }
        return result;
    }

    public BillingDtos.InvoiceResponse getInvoiceById(String id) {
        return getInvoiceById(id, null);
    }

    public BillingDtos.InvoiceResponse getInvoiceById(String id, UserPrincipal principal) {
        InvoiceDocument doc = invoiceRepository.findById(id)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Invoice not found with id: " + id));
        if (principal != null && "patient".equalsIgnoreCase(principal.getRole())) {
            Optional<PatientDocument> p = patientRepository.findByUserId(principal.getId());
            if (p.isEmpty() || !p.get().getId().equals(doc.getPatientId())) {
                throw new Exceptions.ForbiddenException("Access denied: You may only view your own invoices.");
            }
        }
        return mapInvoiceToDto(doc);
    }

    public BillingDtos.PaymentResponse simulatePayment(BillingDtos.SimulatePaymentRequest req, String headerIdempotencyKey, UserPrincipal principal) {
        String effectiveKey = (req.idempotencyKey() != null && !req.idempotencyKey().trim().isEmpty())
                ? req.idempotencyKey().trim()
                : (headerIdempotencyKey != null && !headerIdempotencyKey.trim().isEmpty())
                ? headerIdempotencyKey.trim()
                : "pay-key-" + req.invoiceId();

        // 1. Invoice Existence & Ownership Check (checked first to prevent unauthorized idempotency snooping)
        InvoiceDocument invoice = invoiceRepository.findById(req.invoiceId())
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Invoice not found with id: " + req.invoiceId()));

        if (principal != null && "patient".equalsIgnoreCase(principal.getRole())) {
            Optional<PatientDocument> p = patientRepository.findByUserId(principal.getId());
            if (p.isEmpty() || !p.get().getId().equals(invoice.getPatientId())) {
                throw new Exceptions.ForbiddenException("Access denied: You may only settle your own invoices.");
            }
        }

        // 2. Idempotency Check: if request was already processed with this key, return original result
        Optional<IdempotencyRecordDocument> existing = idempotencyRepository.findByIdempotencyKey(effectiveKey);
        if (existing.isPresent()) {
            try {
                BillingDtos.PaymentResponse cached = objectMapper.readValue(existing.get().getResponsePayload(), BillingDtos.PaymentResponse.class);
                if (cached.invoiceId().equals(req.invoiceId())) {
                    return cached;
                }
            } catch (Exception ignored) {}
        }

        Optional<PaymentDocument> existingPayment = paymentRepository.findByIdempotencyKey(effectiveKey);
        if (existingPayment.isPresent()) {
            PaymentDocument p = existingPayment.get();
            if (p.getInvoiceId().equals(req.invoiceId())) {
                return new BillingDtos.PaymentResponse(
                    p.getId(),
                    p.getInvoiceId(),
                    p.getAmount(),
                    p.getPaymentMethod(),
                    p.getTransactionReference(),
                    p.getStatus(),
                    p.getCreatedAt()
                );
            }
            throw new Exceptions.ConflictException("Idempotency key has already been used for another transaction.");
        }

        // Invariant 2: Validate payment amount against net payable
        if (req.amount() < invoice.getNetPayable()) {
            throw new Exceptions.BadRequestException("Payment amount ₹" + req.amount() + " is insufficient. Outstanding net payable is ₹" + invoice.getNetPayable());
        }

        // Invariant 3: Prevent paying an already paid invoice
        if ("PAID".equalsIgnoreCase(invoice.getStatus())) {
            throw new Exceptions.ConflictException("Invoice " + req.invoiceId() + " has already been paid.");
        }

        // Invariant 4: Atomic transition from PENDING to PAID (concurrency race safety)
        // NOTE: MongoTemplate Criteria must use "_id" (BSON field) not "id" (Java field) for @Id fields
        Query query = Query.query(Criteria.where("_id").is(req.invoiceId()).and("status").is("PENDING"));
        Update update = new Update().set("status", "PAID").set("updatedAt", Instant.now());
        InvoiceDocument updated = mongoTemplate.findAndModify(query, update, FindAndModifyOptions.options().returnNew(true), InvoiceDocument.class);

        if (updated == null) {
            InvoiceDocument check = invoiceRepository.findById(req.invoiceId()).orElse(null);
            if (check != null && "PAID".equalsIgnoreCase(check.getStatus())) {
                throw new Exceptions.ConflictException("Invoice " + req.invoiceId() + " has already been paid.");
            }
            throw new Exceptions.ConflictException("Unable to process payment: invoice status is not PENDING.");
        }

        String paymentId = UUID.randomUUID().toString();
        String txRef = "TXN-" + System.currentTimeMillis() + "-" + Math.abs(idGenerator.nextSnowflakeId());
        PaymentDocument payment = new PaymentDocument(
                paymentId,
                req.invoiceId(),
                req.amount(),
                req.paymentMethod() != null ? req.paymentMethod() : "UPI",
                txRef,
                effectiveKey,
                "SUCCESS"
        );
        paymentRepository.save(payment);

        BillingDtos.PaymentResponse response = new BillingDtos.PaymentResponse(
                payment.getId(),
                payment.getInvoiceId(),
                payment.getAmount(),
                payment.getPaymentMethod(),
                payment.getTransactionReference(),
                payment.getStatus(),
                payment.getCreatedAt()
        );

        // Store idempotency record
        try {
            idempotencyRepository.save(new IdempotencyRecordDocument(
                    UUID.randomUUID().toString(),
                    effectiveKey,
                    "/api/v1/billing/payments/simulate",
                    200,
                    objectMapper.writeValueAsString(response)
            ));
        } catch (Exception ignored) {}

        auditService.recordEvent(
                principal != null ? principal.getId() : "system",
                principal != null ? principal.getUsername() : "payment@aarogya.org",
                "SIMULATE_PAYMENT",
                "Payment",
                paymentId,
                "Processed payment " + txRef + " of ₹" + req.amount() + " for invoice " + req.invoiceId()
        );

        return response;
    }

    private String resolvePatientId(String patientIdOrUhid) {
        if (patientIdOrUhid.startsWith("AC-")) {
            return patientRepository.findByUhid(patientIdOrUhid)
                    .map(PatientDocument::getId)
                    .orElse(patientIdOrUhid);
        }
        return patientIdOrUhid;
    }

    private BillingDtos.InvoiceResponse mapInvoiceToDto(InvoiceDocument doc) {
        List<BillingDtos.InvoiceItemDto> itemDtos = new ArrayList<>();
        for (InvoiceDocument.InvoiceItem item : doc.getItems()) {
            itemDtos.add(new BillingDtos.InvoiceItemDto(
                    item.getDescription(),
                    item.getItemType(),
                    item.getUnitPrice(),
                    item.getQuantity(),
                    item.getTotal()
            ));
        }

        String patientName = "Patient";
        if (doc.getPatientId() != null) {
            PatientDocument p = patientRepository.findById(doc.getPatientId()).orElse(null);
            if (p != null && p.getUserId() != null) {
                UserDocument u = userRepository.findById(p.getUserId()).orElse(null);
                if (u != null && u.getFullName() != null && !u.getFullName().isBlank()) {
                    patientName = u.getFullName();
                }
            }
        }

        return new BillingDtos.InvoiceResponse(
                doc.getId(),
                doc.getInvoiceNumber(),
                doc.getPatientId(),
                patientName,
                doc.getAppointmentId(),
                doc.getTotalAmount(),
                doc.getDiscountAmount(),
                doc.getTaxAmount(),
                doc.getNetPayable(),
                doc.getStatus(),
                itemDtos,
                doc.getCreatedAt()
        );
    }

    private double resolveConsultationFeeForAppointment(String appointmentId) {
        if (appointmentId == null || appointmentId.isBlank()) return 800.0;
        return appointmentRepository.findById(appointmentId)
                .flatMap(apt -> doctorRepository.findById(apt.getDoctorId()))
                .map(DoctorDocument::getConsultationFee)
                .orElse(800.0);
    }
}
