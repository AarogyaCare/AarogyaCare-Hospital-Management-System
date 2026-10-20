package com.aarogya.service;

import com.aarogya.dto.LabDtos;
import com.aarogya.exception.Exceptions;
import com.aarogya.model.*;
import com.aarogya.repository.*;
import com.aarogya.security.UserPrincipal;
import com.aarogya.systemdesign.id.UniqueIdGeneratorService;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
public class LabService {

    private final LabOrderRepository labOrderRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final UniqueIdGeneratorService idGenerator;
    private final AuditService auditService;

    public LabService(
            LabOrderRepository labOrderRepository,
            PatientRepository patientRepository,
            UserRepository userRepository,
            DoctorRepository doctorRepository,
            AppointmentRepository appointmentRepository,
            UniqueIdGeneratorService idGenerator,
            AuditService auditService) {
        this.labOrderRepository = labOrderRepository;
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
        this.idGenerator = idGenerator;
        this.auditService = auditService;
    }

    public LabDtos.LabOrderResponse createOrder(LabDtos.CreateLabOrderRequest req, UserPrincipal principal) {
        String patientId = resolvePatientId(req.patientId());
        String doctorId = "";

        if (principal != null && "doctor".equalsIgnoreCase(principal.getRole())) {
            doctorId = doctorRepository.findByUserId(principal.getId())
                    .map(DoctorDocument::getId)
                    .orElse(principal.getId());
        }

        if (req.appointmentId() != null && !req.appointmentId().isBlank()) {
            Optional<AppointmentDocument> apt = appointmentRepository.findById(req.appointmentId());
            if (apt.isPresent() && (doctorId.isBlank())) {
                doctorId = apt.get().getDoctorId();
            }
        }

        String orderNumber = idGenerator.nextPrefixedId("LAB");
        String id = UUID.randomUUID().toString();

        LabOrderDocument doc = new LabOrderDocument(
                id,
                orderNumber,
                patientId,
                req.appointmentId(),
                doctorId,
                req.testName(),
                req.testCategory(),
                req.sampleType(),
                req.urgency()
        );
        labOrderRepository.save(doc);

        auditService.recordEvent(
                principal != null ? principal.getId() : "system",
                principal != null ? principal.getUsername() : "staff",
                "CREATE_LAB_ORDER",
                "LabOrder",
                doc.getId(),
                "Ordered diagnostic test: " + req.testName() + " (" + orderNumber + ")"
        );

        return mapToResponse(doc);
    }

    public List<LabDtos.LabOrderResponse> getOrders(String status) {
        List<LabOrderDocument> list;
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            list = labOrderRepository.findByStatus(status.toUpperCase());
        } else {
            list = labOrderRepository.findAll();
        }
        list.sort(Comparator.comparing(LabOrderDocument::getOrderedAt).reversed());
        return list.stream().map(this::mapToResponse).toList();
    }

    public LabDtos.LabOrderResponse getOrderById(String id, UserPrincipal principal) {
        LabOrderDocument doc = labOrderRepository.findById(id)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Lab order not found with id: " + id));

        if (principal != null && "patient".equalsIgnoreCase(principal.getRole())) {
            assertPatientCanAccessLabOrder(doc, principal);
        }

        return mapToResponse(doc);
    }

    public List<LabDtos.LabOrderResponse> getOrdersByPatient(String patientIdOrUhid, UserPrincipal principal) {
        String patientId = resolvePatientId(patientIdOrUhid);

        if (principal != null && "patient".equalsIgnoreCase(principal.getRole())) {
            String selfId = patientRepository.findByUserId(principal.getId())
                    .map(PatientDocument::getId)
                    .orElse(principal.getId());
            if (!selfId.equals(patientId)) {
                throw new Exceptions.ForbiddenException("Access denied: You may only view your own lab orders.");
            }
        }

        List<LabOrderDocument> list = labOrderRepository.findByPatientId(patientId);

        // Patients may only view completed/released results
        if (principal != null && "patient".equalsIgnoreCase(principal.getRole())) {
            list = list.stream()
                    .filter(o -> "COMPLETED".equalsIgnoreCase(o.getStatus()))
                    .toList();
        }

        return list.stream()
                .sorted(Comparator.comparing(LabOrderDocument::getOrderedAt).reversed())
                .map(this::mapToResponse)
                .toList();
    }

    public LabDtos.LabOrderResponse updateOrderStatus(String id, LabDtos.UpdateLabStatusRequest req, UserPrincipal principal) {
        LabOrderDocument doc = labOrderRepository.findById(id)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Lab order not found with id: " + id));

        String newStatus = req.status().toUpperCase();
        doc.setStatus(newStatus);
        if (req.sampleType() != null && !req.sampleType().isBlank()) {
            doc.setSampleType(req.sampleType());
        }
        if (req.technicianNotes() != null && !req.technicianNotes().isBlank()) {
            doc.setTechnicianNotes(req.technicianNotes());
        }
        if ("SAMPLE_COLLECTED".equals(newStatus) && doc.getSampleCollectedAt() == null) {
            doc.setSampleCollectedAt(Instant.now());
        }
        doc.setUpdatedAt(Instant.now());
        labOrderRepository.save(doc);

        auditService.recordEvent(
                principal != null ? principal.getId() : "system",
                principal != null ? principal.getUsername() : "technician",
                "UPDATE_LAB_STATUS",
                "LabOrder",
                doc.getId(),
                "Updated status to " + newStatus
        );

        return mapToResponse(doc);
    }

    public LabDtos.LabOrderResponse recordResult(String id, LabDtos.RecordLabResultRequest req, UserPrincipal principal) {
        LabOrderDocument doc = labOrderRepository.findById(id)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Lab order not found with id: " + id));

        if (req.resultValue() == null || req.resultValue().isBlank()) {
            throw new Exceptions.BadRequestException("Laboratory result value cannot be blank.");
        }

        doc.setResultValue(req.resultValue());
        doc.setUnit(req.unit());
        doc.setReferenceRange(req.referenceRange());
        doc.setClinicalRemarks(req.clinicalRemarks());
        doc.setTechnicianNotes(req.technicianNotes());
        doc.setStatus("COMPLETED");
        doc.setCompletedAt(Instant.now());
        doc.setReleasedAt(Instant.now());
        doc.setPerformedBy(principal != null ? principal.getUsername() : "lab_technician");
        doc.setReviewedBy(principal != null ? principal.getFullName() : "Clinical Pathologist");
        doc.setUpdatedAt(Instant.now());

        labOrderRepository.save(doc);

        auditService.recordEvent(
                principal != null ? principal.getId() : "system",
                principal != null ? principal.getUsername() : "technician",
                "RECORD_LAB_RESULT",
                "LabOrder",
                doc.getId(),
                "Recorded lab result for " + doc.getOrderNumber() + ": " + req.resultValue() + " " + (req.unit() != null ? req.unit() : "")
        );

        return mapToResponse(doc);
    }

    private void assertPatientCanAccessLabOrder(LabOrderDocument doc, UserPrincipal principal) {
        String selfId = patientRepository.findByUserId(principal.getId())
                .map(PatientDocument::getId)
                .orElse(principal.getId());

        if (!selfId.equals(doc.getPatientId())) {
            throw new Exceptions.ForbiddenException("Access denied: You may only view your own laboratory results.");
        }
        if (!"COMPLETED".equalsIgnoreCase(doc.getStatus())) {
            throw new Exceptions.ForbiddenException("Laboratory result is pending processing and has not been released.");
        }
    }

    private String resolvePatientId(String patientIdOrUhid) {
        if (patientIdOrUhid == null || patientIdOrUhid.isBlank()) return "";
        if (patientIdOrUhid.startsWith("AC-")) {
            return patientRepository.findByUhid(patientIdOrUhid)
                    .map(PatientDocument::getId)
                    .orElse(patientIdOrUhid);
        }
        return patientRepository.findByUserId(patientIdOrUhid)
                .map(PatientDocument::getId)
                .orElse(patientIdOrUhid);
    }

    private LabDtos.LabOrderResponse mapToResponse(LabOrderDocument doc) {
        String patientName = "Patient";
        PatientDocument p = patientRepository.findById(doc.getPatientId()).orElse(null);
        if (p != null) {
            UserDocument u = userRepository.findById(p.getUserId()).orElse(null);
            if (u != null) patientName = u.getFullName();
        }

        String doctorName = "Dr. Attending";
        if (doc.getDoctorId() != null && !doc.getDoctorId().isBlank()) {
            DoctorDocument d = doctorRepository.findById(doc.getDoctorId()).orElse(null);
            if (d != null) {
                UserDocument du = userRepository.findById(d.getUserId()).orElse(null);
                if (du != null) doctorName = du.getFullName();
            }
        }

        return new LabDtos.LabOrderResponse(
                doc.getId(),
                doc.getOrderNumber(),
                doc.getPatientId(),
                patientName,
                doc.getAppointmentId(),
                doc.getDoctorId(),
                doctorName,
                doc.getTestName(),
                doc.getTestCategory(),
                doc.getSampleType(),
                doc.getStatus(),
                doc.getUrgency(),
                doc.getResultValue(),
                doc.getUnit(),
                doc.getReferenceRange(),
                doc.getClinicalRemarks(),
                doc.getTechnicianNotes(),
                doc.getPerformedBy(),
                doc.getReviewedBy(),
                doc.getOrderedAt(),
                doc.getSampleCollectedAt(),
                doc.getCompletedAt(),
                doc.getReleasedAt()
        );
    }
}
