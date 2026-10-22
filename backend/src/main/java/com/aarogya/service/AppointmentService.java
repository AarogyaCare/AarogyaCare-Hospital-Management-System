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
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import com.aarogya.util.DateTimeUtils;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.*;
import com.aarogya.systemdesign.shortlink.ShortLinkService;

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
    private final Clock clock;
    private final ZoneId zoneId;
    @Autowired(required = false)
    private ShortLinkService shortLinkService;
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
        this(appointmentRepository, slotRepository, doctorRepository, departmentRepository,
                patientRepository, userRepository, idempotencyRepository, mongoTemplate,
                idGenerator, auditService, Clock.system(ZoneId.of("Asia/Kolkata")), ZoneId.of("Asia/Kolkata"));
    }

    @Autowired
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
            AuditService auditService,
            Clock clock,
            ZoneId zoneId) {
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
        this.clock = clock != null ? clock : Clock.system(ZoneId.of("Asia/Kolkata"));
        this.zoneId = zoneId != null ? zoneId : ZoneId.of("Asia/Kolkata");
    }

    public void setShortLinkService(ShortLinkService shortLinkService) {
        this.shortLinkService = shortLinkService;
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

        if (principal == null) throw new Exceptions.UnauthorizedException("Authentication required.");
        if (req.slotId() == null || req.slotId().isBlank()) {
            throw new Exceptions.BadRequestException("Slot ID is required.");
        }

        // 2. DEF-01 FIX: Read-only slot existence check.
        DoctorSlotDocument reservedSlot = slotRepository.findById(req.slotId())
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Doctor slot not found with id: " + req.slotId()));
        if ("BLOCKED".equalsIgnoreCase(reservedSlot.getStatus()) || "CANCELLED".equalsIgnoreCase(reservedSlot.getStatus())) {
            throw new Exceptions.ConflictException("This doctor slot is permanently blocked or cancelled and cannot be booked.");
        }

        validateAppointmentDateAndSlot(reservedSlot, req.appointmentDate());

        // Resolve patient record; staff can explicitly select a patient, or use authenticated patient profile
        String role = principal.getRole() != null ? principal.getRole().toLowerCase() : "patient";
        String patientId;
        String patientName = principal.getFullName() != null ? principal.getFullName() : "Patient";

        if ("patient".equals(role)) {
            Optional<PatientDocument> p = patientRepository.findByUserId(principal.getId());
            if (p.isPresent()) {
                patientId = p.get().getId();
                Optional<UserDocument> u = userRepository.findById(p.get().getUserId());
                if (u.isPresent()) patientName = u.get().getFullName();
            } else {
                Optional<PatientDocument> byId = patientRepository.findById(principal.getId());
                if (byId.isPresent()) {
                    patientId = byId.get().getId();
                } else {
                    patientId = principal.getId();
                }
            }
        } else if (Set.of("receptionist", "admin").contains(role)) {
            if (req.patientId() == null || req.patientId().isBlank()) {
                throw new Exceptions.BadRequestException("Patient ID is required when booking an appointment as staff.");
            }
            PatientDocument patient = patientRepository.findById(req.patientId())
                    .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Patient record not found with id: " + req.patientId()));
            patientId = patient.getId();
            patientName = userRepository.findById(patient.getUserId()).map(UserDocument::getFullName).orElse("Patient");
        } else if (req.patientId() != null && !req.patientId().isBlank()) {
            PatientDocument patient = patientRepository.findById(req.patientId())
                    .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Patient record not found."));
            patientId = patient.getId();
            patientName = userRepository.findById(patient.getUserId()).map(UserDocument::getFullName).orElse("Patient");
        } else {
            patientId = principal.getId();
        }

        // Early conflict check (non-atomic fast path; real atomicity is the unique index on save)
        if (appointmentRepository.existsByDoctorIdAndSlotIdAndAppointmentDateAndStatusNot(
                reservedSlot.getDoctorId(), reservedSlot.getId(), req.appointmentDate().trim(), "CANCELLED")) {
            throw new Exceptions.ConflictException("This time slot is already booked for the selected date.");
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
        appointment.setAppointmentDate(req.appointmentDate());
        // DEF-01: Save appointment; the compound unique index on (doctorId, slotId, appointmentDate)
        //   (partial: status NOT IN [CANCELLED, NO_SHOW]) enforces atomic concurrency for same-date bookings.
        //   DuplicateKeyException means a concurrent request already saved an active booking for this slot+date.
        try {
            appointmentRepository.save(appointment);
        } catch (DuplicateKeyException ex) {
            // No slot document mutation — slot template status is never changed by booking logic (DEF-01).
            throw new Exceptions.ConflictException("This time slot is already booked for the selected date. Please choose a different date or slot.");
        }

        if (shortLinkService != null) {
            try {
                String targetUrl = "http://localhost:5173/portal/appointments";
                ShortLinkDocument shortDoc = shortLinkService.createShortLink(
                        targetUrl,
                        "APPOINTMENT",
                        appointmentId,
                        60L * 60 * 24 * 30
                );
                String shortUrl = "http://localhost:8000/s/" + shortDoc.getCode();
                appointment.setShortUrl(shortUrl);
                appointmentRepository.save(appointment);
            } catch (Exception ignored) {}
        }

        AppointmentDtos.AppointmentResponse response = mapToResponse(appointment);

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

        // DEF-01 FIX: Slot templates must NOT have their status mutated on cancel.
        //   Availability for a date is derived by querying the appointments collection,
        //   not by the DoctorSlotDocument.status field.  Marking the appointment CANCELLED
        //   above is sufficient; the slot template remains untouched.

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
        return rescheduleAppointment(appointmentId, newSlotId, null, principal);
    }

    public AppointmentDtos.AppointmentResponse rescheduleAppointment(String appointmentId, String newSlotId, String newAppointmentDate, UserPrincipal principal) {
        AppointmentDocument appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Appointment not found with id: " + appointmentId));

        assertCanModifyAppointment(appointment, principal);

        // State Machine Invariant: Only CONFIRMED appointments can be rescheduled
        String currentStatus = appointment.getStatus();
        if (!"CONFIRMED".equalsIgnoreCase(currentStatus) && !"SCHEDULED".equalsIgnoreCase(currentStatus)) {
            throw new Exceptions.ConflictException("Cannot reschedule an appointment with status: " + currentStatus);
        }

        // DEF-01 FIX: Read-only slot existence check for reschedule (same rationale as bookAppointment).
        DoctorSlotDocument reservedNewSlot = slotRepository.findById(newSlotId)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Target reschedule slot not found: " + newSlotId));
        if ("BLOCKED".equalsIgnoreCase(reservedNewSlot.getStatus()) || "CANCELLED".equalsIgnoreCase(reservedNewSlot.getStatus())) {
            throw new Exceptions.ConflictException("Target reschedule slot is permanently blocked or cancelled.");
        }

        String targetDate = (newAppointmentDate != null && !newAppointmentDate.isBlank())
                ? newAppointmentDate.trim()
                : appointment.getAppointmentDate();

        validateAppointmentDateAndSlot(reservedNewSlot, targetDate);

        // Check the new slot isn't already booked on the target appointment date
        if (appointmentRepository.existsByDoctorIdAndSlotIdAndAppointmentDateAndStatusNot(
                reservedNewSlot.getDoctorId(), newSlotId, targetDate, "CANCELLED")) {
            throw new Exceptions.ConflictException("Target reschedule slot is already booked for that date.");
        }
        // Old slot template is NOT modified; cancelling the appointment document is sufficient.

        // Update appointment
        appointment.setSlotId(newSlotId);
        appointment.setDoctorId(reservedNewSlot.getDoctorId());
        appointment.setAppointmentDate(targetDate);
        appointment.setUpdatedAt(Instant.now());
        appointmentRepository.save(appointment);

        auditService.recordEvent(
                principal != null ? principal.getId() : "system",
                principal != null ? principal.getUsername() : "system",
                "RESCHEDULE_APPOINTMENT",
                "Appointment",
                appointmentId,
                "Rescheduled to slot " + newSlotId + " on " + targetDate
        );

        return mapToResponse(appointment);
    }

    public AppointmentDtos.AppointmentResponse updateAppointmentStatus(String appointmentId, String status, UserPrincipal principal) {
        AppointmentDocument appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Appointment not found with id: " + appointmentId));

        if (status != null && !status.isBlank()) {
            appointment.setStatus(status.toUpperCase());
            appointment.setUpdatedAt(Instant.now());
            appointmentRepository.save(appointment);

            auditService.recordEvent(
                    principal != null ? principal.getId() : "system",
                    principal != null ? principal.getUsername() : "system",
                    "UPDATE_APPOINTMENT_STATUS",
                    "Appointment",
                    appointmentId,
                    "Updated status to " + status.toUpperCase()
            );
        }

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
            if (d.isEmpty()) {
                d = doctorRepository.findById(principal.getId());
            }
            if (d.isPresent()) {
                list = appointmentRepository.findByDoctorId(d.get().getId());
            } else {
                // Doctor account might not be mapped to DoctorDocument in test or dev; fallback to all appointments
                list = appointmentRepository.findAll();
            }
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

        String appDate = apt.getAppointmentDate();
        if (appDate == null || appDate.isBlank()) {
            if (apt.getCreatedAt() != null) {
                appDate = apt.getCreatedAt().atZone(zoneId).toLocalDate().toString();
            } else {
                appDate = LocalDate.now(clock).toString();
            }
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
                apt.getCreatedAt(),
                appDate,
                apt.getTriageLevel(),
                apt.getVitalSigns(),
                apt.getTriageNotes(),
                apt.getTriagedBy(),
                apt.getTriagedAt(),
                apt.getShortUrl()
        );
    }

    public AppointmentDtos.AppointmentResponse recordTriage(String appointmentId, AppointmentDtos.RecordTriageRequest req, UserPrincipal principal) {
        AppointmentDocument apt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new Exceptions.NotFoundException("Appointment not found: " + appointmentId));

        if (req.triageLevel() != null && !req.triageLevel().isBlank()) {
            apt.setTriageLevel(req.triageLevel().trim());
        }
        if (req.vitalSigns() != null) {
            apt.setVitalSigns(req.vitalSigns().trim());
        }
        if (req.triageNotes() != null) {
            apt.setTriageNotes(req.triageNotes().trim());
        }
        apt.setTriagedBy(principal != null ? principal.getUsername() : "NURSE");
        apt.setTriagedAt(Instant.now());

        AppointmentDocument saved = appointmentRepository.save(apt);
        return mapToResponse(saved);
    }

    public void validateAppointmentDateAndSlot(DoctorSlotDocument slot, String appointmentDate) {
        if (appointmentDate == null || appointmentDate.isBlank()) {
            throw new Exceptions.BadRequestException("Appointment date is required. Provide a valid future date in YYYY-MM-DD format.");
        }
        LocalDate parsed;
        try {
            parsed = LocalDate.parse(appointmentDate.trim());
        } catch (DateTimeParseException ex) {
            throw new Exceptions.BadRequestException("Invalid appointment date format: " + appointmentDate + ". Expected ISO-8601 date (YYYY-MM-DD).");
        }

        LocalDate today = LocalDate.now(clock);
        if (parsed.isBefore(today)) {
            throw new Exceptions.BadRequestException("Appointment date cannot be in the past.");
        }

        if (parsed.isEqual(today) && slot != null) {
            LocalTime slotTime = DateTimeUtils.parseSlotTime(slot.getSlotStart());
            if (slotTime != null) {
                LocalDateTime slotDateTime = LocalDateTime.of(today, slotTime);
                LocalDateTime currentDateTime = LocalDateTime.now(clock);
                if (!slotDateTime.isAfter(currentDateTime)) {
                    throw new Exceptions.BadRequestException("Selected appointment slot time has already passed.");
                }
            }
        }
    }

    public void validateAppointmentDate(String appointmentDate) {
        validateAppointmentDateAndSlot(null, appointmentDate);
    }
}

