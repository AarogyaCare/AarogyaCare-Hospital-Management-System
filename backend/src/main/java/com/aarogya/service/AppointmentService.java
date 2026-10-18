package com.aarogya.service;

import com.aarogya.dto.AppointmentDtos;
import com.aarogya.exception.Exceptions;
import com.aarogya.model.*;
import com.aarogya.repository.*;
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
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorSlotRepository slotRepository;
    private final DoctorRepository doctorRepository;
    private final DepartmentRepository departmentRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final IdempotencyRecordRepository idempotencyRepository;
    private final MongoTemplate mongoTemplate;
    private final UniqueIdGeneratorService idGenerator;
    private final AuditService auditService;
    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule())
            .disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            DoctorSlotRepository slotRepository,
            DoctorRepository doctorRepository,
            DepartmentRepository departmentRepository,
            PatientRepository patientRepository,
            UserRepository userRepository,
            IdempotencyRecordRepository idempotencyRepository,
            MongoTemplate mongoTemplate,
            UniqueIdGeneratorService idGenerator,
            AuditService auditService) {
        this.appointmentRepository = appointmentRepository;
        this.slotRepository = slotRepository;
        this.doctorRepository = doctorRepository;
        this.departmentRepository = departmentRepository;
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
        this.idempotencyRepository = idempotencyRepository;
        this.mongoTemplate = mongoTemplate;
        this.idGenerator = idGenerator;
        this.auditService = auditService;
    }

    public AppointmentDtos.AppointmentResponse bookAppointment(UserPrincipal principal, AppointmentDtos.BookAppointmentRequest req, String idempotencyKey) {
        // 1. Check idempotency key if provided
        if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
            Optional<IdempotencyRecordDocument> existing = idempotencyRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) {
                try {
                    return objectMapper.readValue(existing.get().getResponsePayload(), AppointmentDtos.AppointmentResponse.class);
                } catch (Exception ignored) {}
            }
        }

        // 2. Resolve patient profile
        String patientId;
        String patientName = principal.getFullName();
        Optional<PatientDocument> patientOpt = patientRepository.findByUserId(principal.getId());
        if (patientOpt.isPresent()) {
            patientId = patientOpt.get().getId();
        } else {
            // Provision or fallback
            PatientDocument newPatient = new PatientDocument(
                    UUID.randomUUID().toString(),
                    principal.getId(),
                    "AC-2026-" + Math.abs(idGenerator.nextSnowflakeId()),
                    "1990-01-01",
                    "Other",
                    "B+"
            );
            patientRepository.save(newPatient);
            patientId = newPatient.getId();
        }

        // 3. Authoritative Concurrency Protection: Atomic slot reservation via MongoDB findAndModify
        // NOTE: MongoTemplate requires BSON field "_id", not Java property name "id"
        Query slotQuery = Query.query(Criteria.where("_id").is(req.slotId()).and("status").is("AVAILABLE"));
        Update slotUpdate = new Update().set("status", "BOOKED").set("updatedAt", Instant.now());
        DoctorSlotDocument reservedSlot = mongoTemplate.findAndModify(
                slotQuery,
                slotUpdate,
                FindAndModifyOptions.options().returnNew(true),
                DoctorSlotDocument.class
        );

        if (reservedSlot == null) {
            // Slot is either non-existent or already booked by a concurrent transaction
            throw new Exceptions.ConflictException("Doctor slot is already booked or no longer available.");
        }

        // 4. Resolve doctor and department names
        String doctorId = reservedSlot.getDoctorId();
        DoctorDocument doctor = doctorRepository.findById(doctorId).orElse(null);
        String doctorName = "Dr. Specialist";
        String departmentName = "Clinical Services";

        if (doctor != null) {
            UserDocument doctorUser = userRepository.findById(doctor.getUserId()).orElse(null);
            if (doctorUser != null) doctorName = doctorUser.getFullName();
            DepartmentDocument dept = departmentRepository.findById(doctor.getDepartmentId()).orElse(null);
            if (dept != null) departmentName = dept.getName();
        }

        // 5. Create persistent Appointment document
        String appointmentId = UUID.randomUUID().toString();
        String appointmentNumber = idGenerator.nextPrefixedId("APT");
        String queueToken = "Q-" + (100 + (Math.abs(idGenerator.nextSnowflakeId()) % 900));

        AppointmentDocument appointment = new AppointmentDocument(
                appointmentId,
                appointmentNumber,
                patientId,
                doctorId,
                reservedSlot.getId(),
                req.reasonForVisit() != null ? req.reasonForVisit() : "Outpatient clinical consultation",
                req.consultationMode() != null ? req.consultationMode() : "IN_PERSON",
                queueToken
        );
        appointmentRepository.save(appointment);

        AppointmentDtos.AppointmentResponse response = new AppointmentDtos.AppointmentResponse(
                appointment.getId(),
                appointment.getAppointmentNumber(),
                patientId,
                patientName,
                doctorId,
                doctorName,
                departmentName,
                reservedSlot.getId(),
                reservedSlot.getSlotStart(),
                reservedSlot.getSlotEnd(),
                appointment.getStatus(),
                appointment.getReasonForVisit(),
                appointment.getConsultationMode(),
                queueToken,
                appointment.getCreatedAt()
        );

        // 6. Save Idempotency record if key was provided
        if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
            try {
                idempotencyRepository.save(new IdempotencyRecordDocument(
                        UUID.randomUUID().toString(),
                        idempotencyKey,
                        "/api/v1/appointments",
                        201,
                        objectMapper.writeValueAsString(response)
                ));
            } catch (Exception ignored) {}
        }

        // 7. Record Audit Event
        auditService.recordEvent(
                principal.getId(),
                principal.getUsername(),
                "BOOK_APPOINTMENT",
                "Appointment",
                appointmentId,
                "Reserved slot " + reservedSlot.getId() + " with queue token " + queueToken
        );

        return response;
    }

    public AppointmentDtos.AppointmentResponse cancelAppointment(String appointmentId, UserPrincipal principal) {
        AppointmentDocument appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Appointment not found with id: " + appointmentId));

        assertCanModifyAppointment(appointment, principal);

        // State Machine Invariant: Cannot cancel already cancelled or completed appointments
        String currentStatus = appointment.getStatus();
        if ("CANCELLED".equalsIgnoreCase(currentStatus)) {
            throw new Exceptions.ConflictException("Appointment is already cancelled.");
        }
        if ("COMPLETED".equalsIgnoreCase(currentStatus)) {
            throw new Exceptions.ConflictException("Cannot cancel a completed clinical appointment.");
        }

        appointment.setStatus("CANCELLED");
        appointment.setUpdatedAt(Instant.now());
        appointmentRepository.save(appointment);

        // Atomically restore slot status back to AVAILABLE only if previously confirmed/booked
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(appointment.getSlotId())),
                new Update().set("status", "AVAILABLE").set("updatedAt", Instant.now()),
                DoctorSlotDocument.class
        );

        auditService.recordEvent(
                principal != null ? principal.getId() : "system",
                principal != null ? principal.getUsername() : "system",
                "CANCEL_APPOINTMENT",
                "Appointment",
                appointmentId,
                "Cancelled appointment and released slot " + appointment.getSlotId()
        );

        return mapToResponse(appointment);
    }

    public AppointmentDtos.AppointmentResponse rescheduleAppointment(String appointmentId, String newSlotId, UserPrincipal principal) {
        AppointmentDocument appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Appointment not found with id: " + appointmentId));

        assertCanModifyAppointment(appointment, principal);

        // State Machine Invariant: Only CONFIRMED appointments can be rescheduled
        String currentStatus = appointment.getStatus();
        if (!"CONFIRMED".equalsIgnoreCase(currentStatus)) {
            throw new Exceptions.ConflictException("Cannot reschedule an appointment with status: " + currentStatus);
        }

        // Atomically reserve the new slot
        Query newSlotQuery = Query.query(Criteria.where("_id").is(newSlotId).and("status").is("AVAILABLE"));
        Update newSlotUpdate = new Update().set("status", "BOOKED").set("updatedAt", Instant.now());
        DoctorSlotDocument reservedNewSlot = mongoTemplate.findAndModify(
                newSlotQuery,
                newSlotUpdate,
                FindAndModifyOptions.options().returnNew(true),
                DoctorSlotDocument.class
        );

        if (reservedNewSlot == null) {
            throw new Exceptions.ConflictException("Target reschedule slot is not available.");
        }

        // Release old slot
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(appointment.getSlotId())),
                new Update().set("status", "AVAILABLE").set("updatedAt", Instant.now()),
                DoctorSlotDocument.class
        );

        // Update appointment
        appointment.setSlotId(newSlotId);
        appointment.setDoctorId(reservedNewSlot.getDoctorId());
        appointment.setUpdatedAt(Instant.now());
        appointmentRepository.save(appointment);

        return mapToResponse(appointment);
    }

    public List<AppointmentDtos.AppointmentResponse> getAppointments(UserPrincipal principal) {
        List<AppointmentDocument> list;
        String role = principal != null ? principal.getRole() : "patient";

        if ("patient".equalsIgnoreCase(role)) {
            Optional<PatientDocument> p = patientRepository.findByUserId(principal.getId());
            list = p.map(patientDocument -> appointmentRepository.findByPatientId(patientDocument.getId())).orElse(Collections.emptyList());
        } else if ("doctor".equalsIgnoreCase(role)) {
            Optional<DoctorDocument> d = doctorRepository.findByUserId(principal.getId());
            list = d.map(doctorDocument -> appointmentRepository.findByDoctorId(doctorDocument.getId())).orElse(Collections.emptyList());
        } else {
            // Receptionist, Nurse, Admin
            list = appointmentRepository.findAll();
        }

        List<AppointmentDtos.AppointmentResponse> result = new ArrayList<>();
        for (AppointmentDocument apt : list) {
            result.add(mapToResponse(apt));
        }
        return result;
    }

    public AppointmentDtos.AppointmentResponse getAppointmentById(String id) {
        return getAppointmentById(id, null);
    }

    public AppointmentDtos.AppointmentResponse getAppointmentById(String id, UserPrincipal principal) {
        AppointmentDocument appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Appointment not found with id: " + id));
        if (principal != null) {
            assertCanViewAppointment(appointment, principal);
        }
        return mapToResponse(appointment);
    }

    public void assertCanModifyAppointment(AppointmentDocument appointment, UserPrincipal principal) {
        if (principal == null) {
            throw new Exceptions.UnauthorizedException("Authentication required.");
        }
        String role = principal.getRole().toLowerCase();
        if (java.util.Set.of("admin", "receptionist").contains(role)) {
            return;
        }
        if ("patient".equalsIgnoreCase(role)) {
            if (principal.getId().equals(appointment.getPatientId())) {
                return;
            }
            Optional<PatientDocument> p = patientRepository.findByUserId(principal.getId());
            if (p.isPresent() && p.get().getId().equals(appointment.getPatientId())) {
                return;
            }
            Optional<PatientDocument> aptPat = patientRepository.findById(appointment.getPatientId());
            if (aptPat.isPresent() && aptPat.get().getUserId().equals(principal.getId())) {
                return;
            }
            throw new Exceptions.ForbiddenException("Access denied: You may only modify your own appointments.");
        }
        throw new Exceptions.ForbiddenException("Access denied: Insufficient permissions to modify this appointment.");
    }

    public void assertCanViewAppointment(AppointmentDocument appointment, UserPrincipal principal) {
        if (principal == null) {
            throw new Exceptions.UnauthorizedException("Authentication required.");
        }
        String role = principal.getRole().toLowerCase();
        if (java.util.Set.of("admin", "receptionist", "nurse", "doctor").contains(role)) {
            return;
        }
        if ("patient".equalsIgnoreCase(role)) {
            if (principal.getId().equals(appointment.getPatientId())) {
                return;
            }
            Optional<PatientDocument> p = patientRepository.findByUserId(principal.getId());
            if (p.isPresent() && p.get().getId().equals(appointment.getPatientId())) {
                return;
            }
            Optional<PatientDocument> aptPat = patientRepository.findById(appointment.getPatientId());
            if (aptPat.isPresent() && aptPat.get().getUserId().equals(principal.getId())) {
                return;
            }
            throw new Exceptions.ForbiddenException("Access denied: You may only view your own appointments.");
        }
        throw new Exceptions.ForbiddenException("Access denied: Insufficient permissions to view this appointment.");
    }

    private AppointmentDtos.AppointmentResponse mapToResponse(AppointmentDocument apt) {
        DoctorSlotDocument slot = slotRepository.findById(apt.getSlotId()).orElse(null);
        String slotStart = slot != null ? slot.getSlotStart() : "10:00 AM";
        String slotEnd = slot != null ? slot.getSlotEnd() : "10:30 AM";

        String doctorName = "Dr. Specialist";
        String departmentName = "Cardiology";
        DoctorDocument doc = doctorRepository.findById(apt.getDoctorId()).orElse(null);
        if (doc != null) {
            UserDocument u = userRepository.findById(doc.getUserId()).orElse(null);
            if (u != null) doctorName = u.getFullName();
            DepartmentDocument d = departmentRepository.findById(doc.getDepartmentId()).orElse(null);
            if (d != null) departmentName = d.getName();
        }

        String patientName = "Patient";
        PatientDocument pat = patientRepository.findById(apt.getPatientId()).orElse(null);
        if (pat != null) {
            UserDocument pu = userRepository.findById(pat.getUserId()).orElse(null);
            if (pu != null) patientName = pu.getFullName();
        }

        return new AppointmentDtos.AppointmentResponse(
                apt.getId(),
                apt.getAppointmentNumber(),
                apt.getPatientId(),
                patientName,
                apt.getDoctorId(),
                doctorName,
                departmentName,
                apt.getSlotId(),
                slotStart,
                slotEnd,
                apt.getStatus(),
                apt.getReasonForVisit(),
                apt.getConsultationMode(),
                apt.getQueueToken(),
                apt.getCreatedAt()
        );
    }
}
