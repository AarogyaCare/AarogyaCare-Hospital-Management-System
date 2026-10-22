package com.aarogya.service;

import com.aarogya.dto.EmergencyDtos;
import com.aarogya.exception.Exceptions;
import com.aarogya.model.AppointmentDocument;
import com.aarogya.model.DoctorDocument;
import com.aarogya.model.EmergencyRequestDocument;
import com.aarogya.model.PatientDocument;
import com.aarogya.model.UserDocument;
import com.aarogya.repository.AppointmentRepository;
import com.aarogya.repository.DoctorRepository;
import com.aarogya.repository.EmergencyRequestRepository;
import com.aarogya.repository.PatientRepository;
import com.aarogya.repository.UserRepository;
import com.aarogya.security.UserPrincipal;
import com.aarogya.systemdesign.id.UniqueIdGeneratorService;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class EmergencyService {

    private final EmergencyRequestRepository emergencyRepository;
    private final AuditService auditService;
    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final UniqueIdGeneratorService idGenerator;

    public EmergencyService(
            EmergencyRequestRepository emergencyRepository,
            AuditService auditService,
            DoctorRepository doctorRepository,
            UserRepository userRepository,
            PatientRepository patientRepository,
            AppointmentRepository appointmentRepository,
            UniqueIdGeneratorService idGenerator) {
        this.emergencyRepository = emergencyRepository;
        this.auditService = auditService;
        this.doctorRepository = doctorRepository;
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.appointmentRepository = appointmentRepository;
        this.idGenerator = idGenerator;
    }

    public EmergencyDtos.EmergencyResponse createEmergencyRequest(EmergencyDtos.EmergencyCreateRequest req, UserPrincipal principal) {
        String triageLevel = req.triageLevel() != null ? req.triageLevel().toUpperCase() : "YELLOW";
        String id = UUID.randomUUID().toString();

        // Resolve patient name if patientId is provided and name is not
        String patientName = req.patientName();
        String patientId = req.patientId();
        if (patientId != null && !patientId.isBlank()) {
            PatientDocument patient = patientRepository.findById(patientId).orElse(null);
            if (patient != null && (patientName == null || patientName.isBlank())) {
                UserDocument patientUser = userRepository.findById(patient.getUserId()).orElse(null);
                if (patientUser != null) {
                    patientName = patientUser.getFullName();
                }
            }
        }

        // Resolve doctor name from doctorId
        String doctorId = req.doctorId();
        String doctorName = req.doctorName();
        if (doctorId != null && !doctorId.isBlank()) {
            DoctorDocument doctor = doctorRepository.findById(doctorId).orElse(null);
            if (doctor != null && (doctorName == null || doctorName.isBlank())) {
                UserDocument doctorUser = userRepository.findById(doctor.getUserId()).orElse(null);
                if (doctorUser != null) {
                    doctorName = doctorUser.getFullName();
                }
            }
        }

        EmergencyRequestDocument doc = new EmergencyRequestDocument(
                id,
                patientName != null ? patientName : "Walk-in Patient",
                patientId,
                req.contactNumber(),
                triageLevel,
                req.chiefComplaint(),
                req.vitalSigns()
        );
        doc.setDoctorId(doctorId);
        doc.setDoctorName(doctorName);
        doc.setNotes(req.notes());

        // If a doctor is assigned, create an emergency appointment and mark ASSIGNED
        String appointmentId = null;
        if (doctorId != null && !doctorId.isBlank() && patientId != null && !patientId.isBlank()) {
            appointmentId = createEmergencyAppointment(patientId, doctorId, req.chiefComplaint(), triageLevel);
            doc.setAppointmentId(appointmentId);
            doc.setStatus("ASSIGNED");
        } else {
            doc.setStatus("INCOMING");
        }

        emergencyRepository.save(doc);

        auditService.recordEvent(
                principal != null ? principal.getId() : "emergency-portal",
                principal != null ? principal.getUsername() : "triage@aarogya.org",
                "CREATE_EMERGENCY_REQUEST",
                "EmergencyRequest",
                id,
                "Intake for " + patientName + " with triage level " + triageLevel
        );

        return mapToDto(doc);
    }

    private String createEmergencyAppointment(String patientId, String doctorId, String chiefComplaint, String triageLevel) {
        try {
            String aptNumber = idGenerator.nextPrefixedId("EMG");
            String today = DateTimeFormatter.ofPattern("yyyy-MM-dd")
                    .withZone(ZoneId.systemDefault())
                    .format(Instant.now());

            // Use a unique slotId per emergency to avoid compound index conflicts
            String emergencySlotId = "EMERGENCY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

            AppointmentDocument apt = new AppointmentDocument(
                    UUID.randomUUID().toString(),
                    aptNumber,
                    patientId,
                    doctorId,
                    emergencySlotId,
                    "[EMERGENCY] " + (chiefComplaint != null ? chiefComplaint : "Emergency Intake"),
                    "IN_PERSON",
                    "EMG-" + aptNumber
            );
            apt.setAppointmentDate(today);
            apt.setTriageLevel(triageLevel);
            apt.setStatus("CONFIRMED");
            appointmentRepository.save(apt);
            return apt.getId();
        } catch (Exception e) {
            // If appointment creation fails for any reason, don't fail the emergency request
            return null;
        }
    }

    public List<EmergencyDtos.EmergencyResponse> getEmergencyQueue(String statusFilter) {
        List<EmergencyRequestDocument> docs;
        if (statusFilter != null && !statusFilter.trim().isEmpty() && !statusFilter.equalsIgnoreCase("ALL")) {
            docs = emergencyRepository.findByStatus(statusFilter.toUpperCase());
        } else {
            docs = emergencyRepository.findAllByOrderByPriorityScoreAscCreatedAtDesc();
        }

        List<EmergencyDtos.EmergencyResponse> result = new ArrayList<>();
        for (EmergencyRequestDocument doc : docs) {
            result.add(mapToDto(doc));
        }
        return result;
    }

    public List<EmergencyDtos.EmergencyResponse> getEmergencyQueueForDoctor(String doctorId) {
        List<EmergencyRequestDocument> docs = emergencyRepository.findByDoctorIdAndStatusNot(doctorId, "DISCHARGED");
        List<EmergencyDtos.EmergencyResponse> result = new ArrayList<>();
        for (EmergencyRequestDocument doc : docs) {
            result.add(mapToDto(doc));
        }
        return result;
    }

    public EmergencyDtos.EmergencyResponse updateStatus(String id, String status, UserPrincipal principal) {
        return updateStatus(id, new EmergencyDtos.EmergencyStatusUpdateRequest(status, null, null), principal);
    }

    public EmergencyDtos.EmergencyResponse updateStatus(String id, EmergencyDtos.EmergencyStatusUpdateRequest request, UserPrincipal principal) {
        EmergencyRequestDocument doc = emergencyRepository.findById(id)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Emergency request not found with id: " + id));

        doc.setStatus(request.status().toUpperCase());
        doc.setUpdatedAt(Instant.now());

        // If a doctor is being assigned via status update
        if (request.doctorId() != null && !request.doctorId().isBlank()) {
            String doctorId = request.doctorId();
            doc.setDoctorId(doctorId);
            // Resolve doctor name
            DoctorDocument doctor = doctorRepository.findById(doctorId).orElse(null);
            if (doctor != null) {
                UserDocument doctorUser = userRepository.findById(doctor.getUserId()).orElse(null);
                if (doctorUser != null) {
                    doc.setDoctorName(doctorUser.getFullName());
                }
            }
            // Create appointment if not already created and patient is known
            if (doc.getAppointmentId() == null && doc.getPatientId() != null) {
                String aptId = createEmergencyAppointment(doc.getPatientId(), doctorId, doc.getChiefComplaint(), doc.getTriageLevel());
                doc.setAppointmentId(aptId);
            }
        }
        if (request.doctorNotes() != null && !request.doctorNotes().isBlank()) {
            String existing = doc.getNotes() != null ? doc.getNotes() + "\n" : "";
            doc.setNotes(existing + request.doctorNotes());
        }

        emergencyRepository.save(doc);

        auditService.recordEvent(
                principal != null ? principal.getId() : "nurse",
                principal != null ? principal.getUsername() : "nurse@aarogya.org",
                "UPDATE_EMERGENCY_STATUS",
                "EmergencyRequest",
                id,
                "Status updated to " + request.status()
        );

        return mapToDto(doc);
    }

    private EmergencyDtos.EmergencyResponse mapToDto(EmergencyRequestDocument doc) {
        return new EmergencyDtos.EmergencyResponse(
                doc.getId(),
                doc.getPatientName(),
                doc.getPatientId(),
                doc.getDoctorId(),
                doc.getDoctorName(),
                doc.getAppointmentId(),
                doc.getContactNumber(),
                doc.getTriageLevel(),
                doc.getChiefComplaint(),
                doc.getVitalSigns(),
                doc.getStatus(),
                doc.getPriorityScore(),
                doc.getNotes(),
                doc.getCreatedAt()
        );
    }
}
