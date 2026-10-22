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
import java.util.*;

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

    private static final Set<String> VALID_STATUSES = Set.of(
            "INCOMING", "ASSIGNED", "ATTENDING", "TRIAGED", "STABILIZING", "STABILIZED", "ADMITTED", "TRANSFERRED", "DISCHARGED", "CANCELLED", "DECEASED"
    );

    public EmergencyDtos.EmergencyResponse createEmergencyRequest(EmergencyDtos.EmergencyCreateRequest req, UserPrincipal principal) {
        String triageLevel = resolveTriageLevel(req);
        String patientName = resolvePatientName(req);
        String contactNumber = req.contactNumber() != null ? req.contactNumber()
                : (req.contactPhone() != null ? req.contactPhone() : "N/A");
        String chiefComplaint = resolveChiefComplaint(req);
        String id = UUID.randomUUID().toString();
        String incidentNumber = "INC-2026-" + String.format("%06d", Math.abs(idGenerator.nextSnowflakeId() % 1000000L));

        // Resolve patient name if patientId is provided and name is not
        String patientId = req.patientId();
        if (patientId != null && !patientId.isBlank()) {
            PatientDocument patient = patientRepository.findById(patientId).orElse(null);
            if (patient != null && (patientName == null || patientName.isBlank() || "Walk-In Emergency Patient".equals(patientName))) {
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
                patientName,
                patientId,
                contactNumber,
                triageLevel,
                chiefComplaint,
                req.vitalSigns()
        );
        doc.setLocation(req.location() != null ? req.location() : "Main Emergency Intake Bay");
        doc.setCallerName(req.callerName() != null ? req.callerName() : patientName);
        doc.setEmergencyType(req.emergencyType() != null ? req.emergencyType() : "ACUTE_CARE");
        doc.setNotes(req.notes());
        doc.setIncidentNumber(incidentNumber);

        boolean isProvisional = (patientId == null || patientId.isBlank())
                || patientName.toLowerCase().contains("unidentified")
                || (req.callerName() != null && req.callerName().toLowerCase().contains("trauma"));
        doc.setProvisional(isProvisional);
        doc.setDoctorId(doctorId);
        doc.setDoctorName(doctorName);

        String authorName = principal != null ? principal.getUsername() : "portal@aarogya.org";
        String roleName = principal != null ? principal.getRole() : "PUBLIC";

        doc.getTimeline().add(new EmergencyRequestDocument.IncidentTimelineEvent(
                Instant.now(),
                authorName,
                roleName,
                "INCIDENT_INTAKE",
                "Incident " + incidentNumber + " logged for " + patientName + " [" + triageLevel + "] - " + chiefComplaint + (isProvisional ? " (Provisional Patient)" : "")
        ));

        if ("RED".equalsIgnoreCase(triageLevel)) {
            doc.getTimeline().add(new EmergencyRequestDocument.IncidentTimelineEvent(
                    Instant.now(),
                    "System Sentinel",
                    "ALERT",
                    "CODE_RED_ESCALATION",
                    "Critical Acuity ESI-1 Flagged. Immediate resuscitation bay & trauma team activation initiated."
            ));
        }

        // If doctorId is provided directly, assign doctor & create appointment
        if (doctorId != null && !doctorId.isBlank() && patientId != null && !patientId.isBlank()) {
            String appointmentId = createEmergencyAppointment(patientId, doctorId, chiefComplaint, triageLevel);
            doc.setAppointmentId(appointmentId);
            doc.setStatus("ASSIGNED");
            doc.getTimeline().add(new EmergencyRequestDocument.IncidentTimelineEvent(
                    Instant.now(),
                    authorName,
                    roleName,
                    "DOCTOR_ASSIGNMENT",
                    "Assigned to on-call doctor " + doctorName + " with emergency token bypass"
            ));
        } else {
            doc.setStatus("INCOMING");
        }

        emergencyRepository.save(doc);

        auditService.recordEvent(
                principal != null ? principal.getId() : "emergency-portal",
                authorName,
                "CREATE_EMERGENCY_REQUEST",
                "EmergencyRequest",
                id,
                "Intake for " + patientName + " [" + triageLevel + "] incident " + incidentNumber
        );

        return mapToDto(doc);
    }

    private String createEmergencyAppointment(String patientId, String doctorId, String chiefComplaint, String triageLevel) {
        try {
            String aptNumber = idGenerator.nextPrefixedId("EMG");
            String today = DateTimeFormatter.ofPattern("yyyy-MM-dd")
                    .withZone(ZoneId.systemDefault())
                    .format(Instant.now());

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

    public EmergencyDtos.EmergencyDetailResponse getEmergencyDetail(String id, UserPrincipal principal) {
        EmergencyRequestDocument doc = emergencyRepository.findById(id)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Emergency incident not found: " + id));

        // Patient role data isolation
        if (principal != null && "patient".equalsIgnoreCase(principal.getRole())) {
            if (doc.getPatientId() != null && !doc.getPatientId().equals(principal.getId())) {
                throw new Exceptions.ForbiddenException("Access denied: You are not authorized to view other patients' emergency records");
            }
        }

        return mapToDetailDto(doc);
    }

    public EmergencyDtos.EmergencyDetailResponse assignCareTeamAndBay(String id, EmergencyDtos.IncidentAssignRequest req, UserPrincipal principal) {
        EmergencyRequestDocument doc = emergencyRepository.findById(id)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Emergency incident not found: " + id));

        String author = principal != null ? principal.getUsername() : "system";
        String role = principal != null ? principal.getRole() : "STAFF";

        if (req.doctorId() != null) {
            doc.setAssignedDoctorId(req.doctorId());
            doc.setDoctorId(req.doctorId());
        }
        if (req.doctorName() != null) {
            doc.setAssignedDoctorName(req.doctorName());
            doc.setDoctorName(req.doctorName());
        }
        if (req.nurseId() != null) doc.setAssignedNurseId(req.nurseId());
        if (req.nurseName() != null) doc.setAssignedNurseName(req.nurseName());
        if (req.bay() != null) doc.setAssignedBay(req.bay());

        if ("INCOMING".equalsIgnoreCase(doc.getStatus())) {
            doc.setStatus("TRIAGED");
        }
        doc.setUpdatedAt(Instant.now());

        doc.getTimeline().add(new EmergencyRequestDocument.IncidentTimelineEvent(
                Instant.now(),
                author,
                role,
                "CARE_TEAM_ASSIGNED",
                "Allocated to Bay [" + doc.getAssignedBay() + "], Doctor: " + doc.getAssignedDoctorName() + ", Nurse: " + doc.getAssignedNurseName()
        ));

        emergencyRepository.save(doc);
        return mapToDetailDto(doc);
    }

    public EmergencyDtos.EmergencyDetailResponse recordIntervention(String id, EmergencyDtos.InterventionRequest req, UserPrincipal principal) {
        EmergencyRequestDocument doc = emergencyRepository.findById(id)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Emergency incident not found: " + id));

        String author = principal != null ? principal.getUsername() : "nurse@aarogya.org";
        String role = principal != null ? principal.getRole() : "NURSE";
        String interId = UUID.randomUUID().toString();

        EmergencyRequestDocument.IncidentIntervention intervention = new EmergencyRequestDocument.IncidentIntervention(
                interId,
                Instant.now(),
                author,
                role,
                req.type(),
                req.notes(),
                req.vitals()
        );
        doc.getInterventions().add(intervention);

        if (req.vitals() != null && !req.vitals().isBlank()) {
            doc.setVitalSigns(req.vitals());
        }

        if ("INCOMING".equalsIgnoreCase(doc.getStatus()) || "TRIAGED".equalsIgnoreCase(doc.getStatus())) {
            doc.setStatus("STABILIZING");
        }
        doc.setUpdatedAt(Instant.now());

        doc.getTimeline().add(new EmergencyRequestDocument.IncidentTimelineEvent(
                Instant.now(),
                author,
                role,
                "CLINICAL_INTERVENTION",
                "Clinical action [" + req.type() + "]: " + req.notes() + (req.vitals() != null ? " (Vitals: " + req.vitals() + ")" : "")
        ));

        emergencyRepository.save(doc);
        return mapToDetailDto(doc);
    }

    public EmergencyDtos.EmergencyDetailResponse reassessAcuity(String id, EmergencyDtos.ReassessRequest req, UserPrincipal principal) {
        EmergencyRequestDocument doc = emergencyRepository.findById(id)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Emergency incident not found: " + id));

        String oldLevel = doc.getTriageLevel();
        String newLevel = req.triageLevel().toUpperCase();
        doc.setTriageLevel(newLevel);
        if (req.vitalSigns() != null && !req.vitalSigns().isBlank()) {
            doc.setVitalSigns(req.vitalSigns());
        }
        doc.setUpdatedAt(Instant.now());

        String author = principal != null ? principal.getUsername() : "nurse@aarogya.org";
        String role = principal != null ? principal.getRole() : "NURSE";

        doc.getTimeline().add(new EmergencyRequestDocument.IncidentTimelineEvent(
                Instant.now(),
                author,
                role,
                "ACUITY_REASSESSED",
                "Acuity adjusted from " + oldLevel + " -> " + newLevel + ". Reason: " + req.reason()
        ));

        emergencyRepository.save(doc);
        return mapToDetailDto(doc);
    }

    public EmergencyDtos.EmergencyDetailResponse concludeDisposition(String id, EmergencyDtos.DispositionRequest req, UserPrincipal principal) {
        EmergencyRequestDocument doc = emergencyRepository.findById(id)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Emergency incident not found: " + id));

        String disp = req.disposition().toUpperCase();
        doc.setDisposition(disp);
        doc.setDispositionNotes(req.notes());
        doc.setDestinationWard(req.destinationWard());
        doc.setClosedAt(Instant.now());
        doc.setClosedBy(principal != null ? principal.getUsername() : "doctor@aarogya.org");

        if ("ADMITTED".equalsIgnoreCase(disp)) doc.setStatus("ADMITTED");
        else if ("TRANSFERRED".equalsIgnoreCase(disp)) doc.setStatus("TRANSFERRED");
        else if ("DECEASED".equalsIgnoreCase(disp)) doc.setStatus("DECEASED");
        else doc.setStatus("DISCHARGED");

        doc.setUpdatedAt(Instant.now());

        String author = principal != null ? principal.getUsername() : "doctor@aarogya.org";
        String role = principal != null ? principal.getRole() : "DOCTOR";

        doc.getTimeline().add(new EmergencyRequestDocument.IncidentTimelineEvent(
                Instant.now(),
                author,
                role,
                "DISPOSITION_CONCLUDED",
                "Case final disposition: " + disp + (req.destinationWard() != null ? " to " + req.destinationWard() : "") + ". Notes: " + req.notes()
        ));

        emergencyRepository.save(doc);
        return mapToDetailDto(doc);
    }

    public EmergencyDtos.EmergencyDetailResponse getActivePatientEmergency(String patientUserId) {
        PatientDocument patient = patientRepository.findByUserId(patientUserId).orElse(null);
        if (patient == null) {
            return null;
        }
        List<EmergencyRequestDocument> activeList = emergencyRepository.findByPatientIdOrderByCreatedAtDesc(patient.getId());
        if (activeList.isEmpty()) {
            return null;
        }
        EmergencyRequestDocument latest = activeList.get(0);
        if ("DISCHARGED".equalsIgnoreCase(latest.getStatus()) || "CANCELLED".equalsIgnoreCase(latest.getStatus())) {
            return null;
        }
        return mapToDetailDto(latest);
    }

    public EmergencyDtos.EmergencySurgeStatsResponse getEmergencySurgeStats() {
        List<EmergencyRequestDocument> all = emergencyRepository.findAll();
        long active = all.stream().filter(d -> !"DISCHARGED".equalsIgnoreCase(d.getStatus()) && !"CANCELLED".equalsIgnoreCase(d.getStatus())).count();
        long red = all.stream().filter(d -> "RED".equalsIgnoreCase(d.getTriageLevel()) && !"DISCHARGED".equalsIgnoreCase(d.getStatus())).count();
        long yellow = all.stream().filter(d -> "YELLOW".equalsIgnoreCase(d.getTriageLevel()) && !"DISCHARGED".equalsIgnoreCase(d.getStatus())).count();
        long incoming = all.stream().filter(d -> "INCOMING".equalsIgnoreCase(d.getStatus()) || "ASSIGNED".equalsIgnoreCase(d.getStatus())).count();
        long stabilizing = all.stream().filter(d -> "STABILIZING".equalsIgnoreCase(d.getStatus()) || "ATTENDING".equalsIgnoreCase(d.getStatus())).count();
        long allocatedBays = all.stream().filter(d -> d.getAssignedBay() != null && !d.getAssignedBay().isBlank()).count();

        return new EmergencyDtos.EmergencySurgeStatsResponse(
                active,
                red,
                yellow,
                incoming,
                stabilizing,
                allocatedBays
        );
    }

    public EmergencyDtos.EmergencyResponse updateStatus(String id, String status, UserPrincipal principal) {
        return updateStatus(id, new EmergencyDtos.EmergencyStatusUpdateRequest(status, null, null), principal);
    }

    public EmergencyDtos.EmergencyResponse updateStatus(String id, EmergencyDtos.EmergencyStatusUpdateRequest request, UserPrincipal principal) {
        if (request.status() == null || !VALID_STATUSES.contains(request.status().trim().toUpperCase())) {
            throw new Exceptions.BadRequestException("Invalid emergency status: " + request.status() + ". Allowed: " + VALID_STATUSES);
        }

        EmergencyRequestDocument doc = emergencyRepository.findById(id)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Emergency request not found with id: " + id));

        String upperStatus = request.status().trim().toUpperCase();
        doc.setStatus(upperStatus);
        doc.setUpdatedAt(Instant.now());

        if (request.doctorId() != null && !request.doctorId().isBlank()) {
            String doctorId = request.doctorId();
            doc.setDoctorId(doctorId);
            DoctorDocument doctor = doctorRepository.findById(doctorId).orElse(null);
            if (doctor != null) {
                UserDocument doctorUser = userRepository.findById(doctor.getUserId()).orElse(null);
                if (doctorUser != null) {
                    doc.setDoctorName(doctorUser.getFullName());
                }
            }
            if (doc.getAppointmentId() == null && doc.getPatientId() != null) {
                String aptId = createEmergencyAppointment(doc.getPatientId(), doctorId, doc.getChiefComplaint(), doc.getTriageLevel());
                doc.setAppointmentId(aptId);
            }
        }
        if (request.doctorNotes() != null && !request.doctorNotes().isBlank()) {
            String existing = doc.getNotes() != null ? doc.getNotes() + "\n" : "";
            doc.setNotes(existing + request.doctorNotes());
        }

        String author = principal != null ? principal.getUsername() : "nurse@aarogya.org";
        String role = principal != null ? principal.getRole() : "STAFF";
        doc.getTimeline().add(new EmergencyRequestDocument.IncidentTimelineEvent(
                Instant.now(),
                author,
                role,
                "STATUS_UPDATED",
                "Status advanced to " + upperStatus + (request.doctorNotes() != null ? " with note: " + request.doctorNotes() : "")
        ));

        emergencyRepository.save(doc);

        auditService.recordEvent(
                principal != null ? principal.getId() : "nurse",
                author,
                "UPDATE_EMERGENCY_STATUS",
                "EmergencyRequest",
                id,
                "Status updated to " + upperStatus
        );

        return mapToDto(doc);
    }

    private String resolveTriageLevel(EmergencyDtos.EmergencyCreateRequest req) {
        if (req.triageLevel() != null && !req.triageLevel().isBlank()) {
            return req.triageLevel().trim().toUpperCase();
        }
        if (req.severityLevel() != null && !req.severityLevel().isBlank()) {
            String sev = req.severityLevel().trim().toUpperCase();
            if (sev.contains("CRIT") || sev.contains("RED") || sev.contains("STAT")) return "RED";
            if (sev.contains("URG") || sev.contains("YELLOW")) return "YELLOW";
            return "GREEN";
        }
        if (req.emergencyType() != null && req.emergencyType().toUpperCase().contains("RED")) {
            return "RED";
        }
        return "YELLOW";
    }

    private String resolvePatientName(EmergencyDtos.EmergencyCreateRequest req) {
        if (req.patientName() != null && !req.patientName().isBlank()) return req.patientName();
        if (req.callerName() != null && !req.callerName().isBlank()) return req.callerName();
        return "Walk-In Emergency Patient";
    }

    private String resolveChiefComplaint(EmergencyDtos.EmergencyCreateRequest req) {
        if (req.chiefComplaint() != null && !req.chiefComplaint().isBlank()) return req.chiefComplaint();
        if (req.emergencyType() != null && !req.emergencyType().isBlank()) return "Reported Incident: " + req.emergencyType();
        return "Acute distress reported at triage desk";
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
                doc.getCreatedAt(),
                doc.getLocation(),
                doc.getCallerName(),
                doc.getEmergencyType(),
                doc.getNotes(),
                doc.getIncidentNumber(),
                doc.isProvisional(),
                doc.getAssignedDoctorName(),
                doc.getAssignedNurseName(),
                doc.getAssignedBay(),
                doc.getDisposition()
        );
    }

    private EmergencyDtos.EmergencyDetailResponse mapToDetailDto(EmergencyRequestDocument doc) {
        List<EmergencyDtos.TimelineEventDto> timelineDtos = new ArrayList<>();
        if (doc.getTimeline() != null) {
            for (var t : doc.getTimeline()) {
                timelineDtos.add(new EmergencyDtos.TimelineEventDto(
                        t.getTimestamp(),
                        t.getAuthor(),
                        t.getRole(),
                        t.getEventType(),
                        t.getDescription()
                ));
            }
        }
        List<EmergencyDtos.InterventionDto> interventionDtos = new ArrayList<>();
        if (doc.getInterventions() != null) {
            for (var i : doc.getInterventions()) {
                interventionDtos.add(new EmergencyDtos.InterventionDto(
                        i.getId(),
                        i.getTimestamp(),
                        i.getAuthor(),
                        i.getRole(),
                        i.getType(),
                        i.getNotes(),
                        i.getVitalsRecorded()
                ));
            }
        }

        return new EmergencyDtos.EmergencyDetailResponse(
                doc.getId(),
                doc.getIncidentNumber(),
                doc.getPatientName(),
                doc.getPatientId(),
                doc.getContactNumber(),
                doc.getTriageLevel(),
                doc.getChiefComplaint(),
                doc.getVitalSigns(),
                doc.getStatus(),
                doc.getPriorityScore(),
                doc.getCreatedAt(),
                doc.getUpdatedAt(),
                doc.getLocation(),
                doc.getCallerName(),
                doc.getEmergencyType(),
                doc.getNotes(),
                doc.isProvisional(),
                doc.getAssignedDoctorId(),
                doc.getAssignedDoctorName(),
                doc.getAssignedNurseId(),
                doc.getAssignedNurseName(),
                doc.getAssignedBay(),
                doc.getDisposition(),
                doc.getDispositionNotes(),
                doc.getDestinationWard(),
                doc.getClosedAt(),
                doc.getClosedBy(),
                timelineDtos,
                interventionDtos
        );
    }
}
