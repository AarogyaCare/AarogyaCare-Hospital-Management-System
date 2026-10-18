package com.aarogya.service;

import com.aarogya.dto.AppointmentDtos;
import com.aarogya.dto.PrescriptionDtos;
import com.aarogya.exception.Exceptions;
import com.aarogya.model.*;
import com.aarogya.repository.*;
import com.aarogya.security.UserPrincipal;
import com.aarogya.systemdesign.id.UniqueIdGeneratorService;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
public class PatientRecordService {

    private final ClinicalRecordRepository recordRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final UniqueIdGeneratorService idGenerator;
    private final AuditService auditService;

    public PatientRecordService(
            ClinicalRecordRepository recordRepository,
            PrescriptionRepository prescriptionRepository,
            AppointmentRepository appointmentRepository,
            PatientRepository patientRepository,
            DoctorRepository doctorRepository,
            UserRepository userRepository,
            UniqueIdGeneratorService idGenerator,
            AuditService auditService) {
        this.recordRepository = recordRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.userRepository = userRepository;
        this.idGenerator = idGenerator;
        this.auditService = auditService;
    }

    public List<AppointmentDtos.ClinicalNoteResponse> getRecordsByPatient(String patientIdOrUhid) {
        String patientId = resolvePatientId(patientIdOrUhid);
        List<ClinicalRecordDocument> records = recordRepository.findByPatientId(patientId);
        List<AppointmentDtos.ClinicalNoteResponse> result = new ArrayList<>();
        for (ClinicalRecordDocument r : records) {
            result.add(new AppointmentDtos.ClinicalNoteResponse(
                    r.getId(),
                    r.getPatientId(),
                    r.getAppointmentId(),
                    r.getDoctorId(),
                    r.getChiefComplaint(),
                    r.getExaminationFindings(),
                    r.getDiagnosis(),
                    r.getTreatmentPlan(),
                    r.getDoctorNotes(),
                    r.getFollowUpDate(),
                    r.getCreatedAt()
            ));
        }
        return result;
    }

    public AppointmentDtos.ClinicalNoteResponse addClinicalNote(String appointmentId, AppointmentDtos.ClinicalNoteRequest req, UserPrincipal principal) {
        AppointmentDocument apt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Appointment not found with id: " + appointmentId));

        ClinicalRecordDocument record = new ClinicalRecordDocument(
                UUID.randomUUID().toString(),
                apt.getPatientId(),
                appointmentId,
                apt.getDoctorId(),
                req.chiefComplaint(),
                req.examinationFindings(),
                req.diagnosis(),
                req.treatmentPlan(),
                req.doctorNotes(),
                req.followUpDate()
        );
        recordRepository.save(record);

        apt.setStatus("COMPLETED");
        apt.setUpdatedAt(Instant.now());
        appointmentRepository.save(apt);

        auditService.recordEvent(
                principal.getId(),
                principal.getUsername(),
                "ADD_CLINICAL_NOTE",
                "ClinicalRecord",
                record.getId(),
                "Documented clinical consultation for appointment " + appointmentId
        );

        return new AppointmentDtos.ClinicalNoteResponse(
                record.getId(),
                record.getPatientId(),
                record.getAppointmentId(),
                record.getDoctorId(),
                record.getChiefComplaint(),
                record.getExaminationFindings(),
                record.getDiagnosis(),
                record.getTreatmentPlan(),
                record.getDoctorNotes(),
                record.getFollowUpDate(),
                record.getCreatedAt()
        );
    }

    public List<AppointmentDtos.ClinicalNoteResponse> getClinicalNotesByAppointment(String appointmentId) {
        Optional<ClinicalRecordDocument> opt = recordRepository.findByAppointmentId(appointmentId);
        if (opt.isEmpty()) return Collections.emptyList();
        ClinicalRecordDocument r = opt.get();
        return List.of(new AppointmentDtos.ClinicalNoteResponse(
                r.getId(),
                r.getPatientId(),
                r.getAppointmentId(),
                r.getDoctorId(),
                r.getChiefComplaint(),
                r.getExaminationFindings(),
                r.getDiagnosis(),
                r.getTreatmentPlan(),
                r.getDoctorNotes(),
                r.getFollowUpDate(),
                r.getCreatedAt()
        ));
    }

    public List<PrescriptionDtos.PrescriptionResponse> getPrescriptionsByPatient(String patientIdOrUhid) {
        String patientId = resolvePatientId(patientIdOrUhid);
        List<PrescriptionDocument> docs = prescriptionRepository.findByPatientId(patientId);
        List<PrescriptionDtos.PrescriptionResponse> result = new ArrayList<>();
        for (PrescriptionDocument doc : docs) {
            result.add(mapPrescriptionToDto(doc));
        }
        return result;
    }

    public PrescriptionDtos.PrescriptionResponse createPrescription(String appointmentId, PrescriptionDtos.PrescriptionCreateRequest req, UserPrincipal principal) {
        AppointmentDocument apt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Appointment not found with id: " + appointmentId));

        List<PrescriptionDocument.PrescriptionItem> items = new ArrayList<>();
        for (PrescriptionDtos.PrescriptionItemDto item : req.items()) {
            items.add(new PrescriptionDocument.PrescriptionItem(
                    item.medicineId(),
                    item.medicineName(),
                    item.dosage(),
                    item.frequency(),
                    item.durationDays(),
                    item.instructions(),
                    item.quantity()
            ));
        }

        String rxNumber = idGenerator.nextPrefixedId("RX");
        PrescriptionDocument rx = new PrescriptionDocument(
                UUID.randomUUID().toString(),
                rxNumber,
                apt.getPatientId(),
                appointmentId,
                apt.getDoctorId(),
                items
        );
        prescriptionRepository.save(rx);

        auditService.recordEvent(
                principal.getId(),
                principal.getUsername(),
                "CREATE_PRESCRIPTION",
                "Prescription",
                rx.getId(),
                "Created electronic prescription " + rxNumber + " with " + items.size() + " items"
        );

        return mapPrescriptionToDto(rx);
    }

    public List<PrescriptionDtos.PrescriptionResponse> getPrescriptionsByAppointment(String appointmentId) {
        Optional<PrescriptionDocument> rxOpt = prescriptionRepository.findByAppointmentId(appointmentId);
        if (rxOpt.isEmpty()) return Collections.emptyList();
        return List.of(mapPrescriptionToDto(rxOpt.get()));
    }

    public PrescriptionDtos.PrescriptionResponse updatePrescriptionStatus(String prescriptionId, String status, UserPrincipal principal) {
        PrescriptionDocument rx = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Prescription not found with id: " + prescriptionId));

        rx.setStatus(status.toUpperCase());
        rx.setUpdatedAt(Instant.now());
        prescriptionRepository.save(rx);

        auditService.recordEvent(
                principal.getId(),
                principal.getUsername(),
                "UPDATE_PRESCRIPTION_STATUS",
                "Prescription",
                prescriptionId,
                "Updated prescription status to " + status
        );

        return mapPrescriptionToDto(rx);
    }

    private String resolvePatientId(String patientIdOrUhid) {
        if (patientIdOrUhid.startsWith("AC-")) {
            return patientRepository.findByUhid(patientIdOrUhid)
                    .map(PatientDocument::getId)
                    .orElse(patientIdOrUhid);
        }
        return patientIdOrUhid;
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

        return new PrescriptionDtos.PrescriptionResponse(
                rx.getId(),
                rx.getPrescriptionNumber(),
                rx.getPatientId(),
                rx.getAppointmentId(),
                rx.getDoctorId(),
                doctorName,
                rx.getStatus(),
                itemDtos,
                rx.getCreatedAt()
        );
    }
}
