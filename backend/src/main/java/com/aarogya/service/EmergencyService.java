package com.aarogya.service;

import com.aarogya.dto.EmergencyDtos;
import com.aarogya.exception.Exceptions;
import com.aarogya.model.EmergencyRequestDocument;
import com.aarogya.repository.EmergencyRequestRepository;
import com.aarogya.security.UserPrincipal;
import com.aarogya.systemdesign.id.UniqueIdGeneratorService;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class EmergencyService {

    private final EmergencyRequestRepository emergencyRepository;
    private final AuditService auditService;
    private final UniqueIdGeneratorService idGenerator;

    public EmergencyService(EmergencyRequestRepository emergencyRepository,
                            AuditService auditService,
                            UniqueIdGeneratorService idGenerator) {
        this.emergencyRepository = emergencyRepository;
        this.auditService = auditService;
        this.idGenerator = idGenerator;
    }

    private static final Set<String> VALID_STATUSES = Set.of(
            "INCOMING", "TRIAGED", "STABILIZING", "ADMITTED", "TRANSFERRED", "DISCHARGED", "CANCELLED", "DECEASED"
    );

    public EmergencyDtos.EmergencyResponse createEmergencyRequest(EmergencyDtos.EmergencyCreateRequest req, UserPrincipal principal) {
        String triageLevel = resolveTriageLevel(req);
        String patientName = resolvePatientName(req);
        String contactNumber = req.contactNumber() != null ? req.contactNumber()
                : (req.contactPhone() != null ? req.contactPhone() : "N/A");
        String chiefComplaint = resolveChiefComplaint(req);
        String id = UUID.randomUUID().toString();
        String incidentNumber = "INC-2026-" + String.format("%06d", Math.abs(idGenerator.nextSnowflakeId() % 1000000L));

        EmergencyRequestDocument doc = new EmergencyRequestDocument(
                id,
                patientName,
                req.patientId(),
                contactNumber,
                triageLevel,
                chiefComplaint,
                req.vitalSigns()
        );
        doc.setLocation(req.location());
        doc.setCallerName(req.callerName());
        doc.setEmergencyType(req.emergencyType());
        doc.setNotes(req.notes());
        doc.setIncidentNumber(incidentNumber);

        boolean isProvisional = (req.patientId() == null || req.patientId().isBlank())
                || patientName.toLowerCase().contains("unidentified")
                || (req.callerName() != null && req.callerName().toLowerCase().contains("trauma"));
        doc.setProvisional(isProvisional);

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
        if (req.patientName() != null && !req.patientName().isBlank()) {
            return req.patientName().trim();
        }
        if (req.callerName() != null && !req.callerName().isBlank()) {
            return "Trauma Intake (" + req.callerName().trim() + ")";
        }
        return "Unidentified Emergency Patient";
    }

    private String resolveChiefComplaint(EmergencyDtos.EmergencyCreateRequest req) {
        if (req.chiefComplaint() != null && !req.chiefComplaint().isBlank()) {
            return req.chiefComplaint().trim();
        }
        StringBuilder sb = new StringBuilder();
        if (req.emergencyType() != null && !req.emergencyType().isBlank()) {
            sb.append(req.emergencyType().trim());
        }
        if (req.notes() != null && !req.notes().isBlank()) {
            if (sb.length() > 0) sb.append(" - ");
            sb.append(req.notes().trim());
        }
        return sb.length() > 0 ? sb.toString() : "Acute emergency intake";
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

    public EmergencyDtos.EmergencyDetailResponse getEmergencyDetail(String id, UserPrincipal principal) {
        EmergencyRequestDocument doc = emergencyRepository.findById(id)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Emergency incident not found with id: " + id));

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
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Emergency incident not found with id: " + id));

        String author = principal != null ? principal.getUsername() : "coordinator@aarogya.org";
        String role = principal != null ? principal.getRole() : "COORDINATOR";

        StringBuilder changes = new StringBuilder();
        if (req.doctorId() != null) {
            doc.setAssignedDoctorId(req.doctorId());
            doc.setAssignedDoctorName(req.doctorName() != null ? req.doctorName() : req.doctorId());
            changes.append("Doctor: ").append(doc.getAssignedDoctorName()).append(". ");
        }
        if (req.nurseId() != null) {
            doc.setAssignedNurseId(req.nurseId());
            doc.setAssignedNurseName(req.nurseName() != null ? req.nurseName() : req.nurseId());
            changes.append("Nurse: ").append(doc.getAssignedNurseName()).append(". ");
        }
        if (req.bay() != null && !req.bay().isBlank()) {
            doc.setAssignedBay(req.bay().trim());
            changes.append("Bay: ").append(doc.getAssignedBay()).append(". ");
        }

        if ("INCOMING".equalsIgnoreCase(doc.getStatus())) {
            doc.setStatus("TRIAGED");
        }
        doc.setUpdatedAt(Instant.now());

        doc.getTimeline().add(new EmergencyRequestDocument.IncidentTimelineEvent(
                Instant.now(),
                author,
                role,
                "CARE_TEAM_ASSIGNED",
                "Care team and bay updated. " + changes.toString().trim()
        ));

        emergencyRepository.save(doc);

        auditService.recordEvent(
                principal != null ? principal.getId() : "coordinator",
                author,
                "ASSIGN_EMERGENCY_RESOURCES",
                "EmergencyRequest",
                id,
                "Assigned resources: " + changes
        );

        return mapToDetailDto(doc);
    }

    public EmergencyDtos.EmergencyDetailResponse recordIntervention(String id, EmergencyDtos.InterventionRequest req, UserPrincipal principal) {
        EmergencyRequestDocument doc = emergencyRepository.findById(id)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Emergency incident not found with id: " + id));

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

        auditService.recordEvent(
                principal != null ? principal.getId() : "nurse",
                author,
                "RECORD_EMERGENCY_INTERVENTION",
                "EmergencyRequest",
                id,
                "Administered " + req.type() + " by " + author
        );

        return mapToDetailDto(doc);
    }

    public EmergencyDtos.EmergencyDetailResponse reassessAcuity(String id, EmergencyDtos.ReassessRequest req, UserPrincipal principal) {
        EmergencyRequestDocument doc = emergencyRepository.findById(id)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Emergency incident not found with id: " + id));

        String oldLevel = doc.getTriageLevel();
        String newLevel = req.triageLevel().trim().toUpperCase();
        if (!Set.of("RED", "YELLOW", "GREEN").contains(newLevel)) {
            throw new Exceptions.BadRequestException("Invalid triage acuity level: " + newLevel + ". Must be RED, YELLOW, or GREEN.");
        }

        doc.setTriageLevel(newLevel);
        if (req.vitalSigns() != null && !req.vitalSigns().isBlank()) {
            doc.setVitalSigns(req.vitalSigns());
        }
        doc.setUpdatedAt(Instant.now());

        String author = principal != null ? principal.getUsername() : "nurse@aarogya.org";
        String role = principal != null ? principal.getRole() : "CLINICIAN";

        doc.getTimeline().add(new EmergencyRequestDocument.IncidentTimelineEvent(
                Instant.now(),
                author,
                role,
                "ACUITY_REASSESSED",
                "Acuity adjusted from " + oldLevel + " to " + newLevel + ". Reason: " + req.reason()
        ));

        emergencyRepository.save(doc);

        auditService.recordEvent(
                principal != null ? principal.getId() : "nurse",
                author,
                "REASSESS_EMERGENCY_ACUITY",
                "EmergencyRequest",
                id,
                "Acuity shifted from " + oldLevel + " to " + newLevel + " (" + req.reason() + ")"
        );

        return mapToDetailDto(doc);
    }

    public EmergencyDtos.EmergencyDetailResponse concludeDisposition(String id, EmergencyDtos.DispositionRequest req, UserPrincipal principal) {
        EmergencyRequestDocument doc = emergencyRepository.findById(id)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Emergency incident not found with id: " + id));

        String disp = req.disposition().trim().toUpperCase();
        if (!Set.of("ADMITTED", "TRANSFERRED", "DISCHARGED", "DECEASED").contains(disp)) {
            throw new Exceptions.BadRequestException("Invalid disposition: " + disp + ". Allowed: ADMITTED, TRANSFERRED, DISCHARGED, DECEASED");
        }

        String author = principal != null ? principal.getUsername() : "doctor@aarogya.org";
        String role = principal != null ? principal.getRole() : "DOCTOR";

        doc.setDisposition(disp);
        doc.setStatus(disp);
        doc.setDestinationWard(req.destinationWard());
        doc.setDispositionNotes(req.notes());
        doc.setClosedAt(Instant.now());
        doc.setClosedBy(author);
        doc.setUpdatedAt(Instant.now());

        doc.getTimeline().add(new EmergencyRequestDocument.IncidentTimelineEvent(
                Instant.now(),
                author,
                role,
                "DISPOSITION_CONCLUDED",
                "Incident disposition finalized as " + disp + (req.destinationWard() != null ? " (" + req.destinationWard() + ")" : "") + ". " + (req.notes() != null ? req.notes() : "")
        ));

        emergencyRepository.save(doc);

        auditService.recordEvent(
                principal != null ? principal.getId() : "doctor",
                author,
                "CONCLUDE_EMERGENCY_DISPOSITION",
                "EmergencyRequest",
                id,
                "Disposition finalized: " + disp + " by " + author
        );

        return mapToDetailDto(doc);
    }

    public EmergencyDtos.EmergencyDetailResponse getActivePatientEmergency(String patientId) {
        if (patientId == null || patientId.isBlank()) {
            throw new Exceptions.BadRequestException("Patient ID is required");
        }
        List<EmergencyRequestDocument> list = emergencyRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
        for (EmergencyRequestDocument doc : list) {
            if (!Set.of("DISCHARGED", "CANCELLED", "DECEASED").contains(doc.getStatus().toUpperCase())) {
                return mapToDetailDto(doc);
            }
        }
        return null;
    }

    public EmergencyDtos.EmergencySurgeStatsResponse getEmergencySurgeStats() {
        List<EmergencyRequestDocument> all = emergencyRepository.findAll();
        long active = 0;
        long red = 0;
        long yellow = 0;
        long incoming = 0;
        long stabilizing = 0;
        long allocatedBays = 0;

        Set<String> terminal = Set.of("DISCHARGED", "CANCELLED", "DECEASED");

        for (EmergencyRequestDocument doc : all) {
            String st = doc.getStatus() != null ? doc.getStatus().toUpperCase() : "INCOMING";
            if (!terminal.contains(st)) {
                active++;
                if ("RED".equalsIgnoreCase(doc.getTriageLevel())) red++;
                if ("YELLOW".equalsIgnoreCase(doc.getTriageLevel())) yellow++;
                if ("INCOMING".equalsIgnoreCase(st)) incoming++;
                if ("STABILIZING".equalsIgnoreCase(st)) stabilizing++;
                if (doc.getAssignedBay() != null && !doc.getAssignedBay().isBlank()) allocatedBays++;
            }
        }

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
        if (status == null || !VALID_STATUSES.contains(status.trim().toUpperCase())) {
            throw new Exceptions.BadRequestException("Invalid emergency status: " + status + ". Allowed: " + VALID_STATUSES);
        }

        EmergencyRequestDocument doc = emergencyRepository.findById(id)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Emergency request not found with id: " + id));

        String upperStatus = status.trim().toUpperCase();
        doc.setStatus(upperStatus);
        doc.setUpdatedAt(Instant.now());

        String author = principal != null ? principal.getUsername() : "nurse@aarogya.org";
        String role = principal != null ? principal.getRole() : "STAFF";

        doc.getTimeline().add(new EmergencyRequestDocument.IncidentTimelineEvent(
                Instant.now(),
                author,
                role,
                "STATUS_UPDATED",
                "Status advanced to " + upperStatus
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

    private EmergencyDtos.EmergencyResponse mapToDto(EmergencyRequestDocument doc) {
        return new EmergencyDtos.EmergencyResponse(
                doc.getId(),
                doc.getPatientName(),
                doc.getPatientId(),
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
