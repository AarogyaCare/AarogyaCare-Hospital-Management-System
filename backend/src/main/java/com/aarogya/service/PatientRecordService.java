package com.aarogya.service;

import com.aarogya.dto.AppointmentDtos;
import com.aarogya.dto.PatientDtos;
import com.aarogya.dto.PrescriptionDtos;
import com.aarogya.exception.Exceptions;
import com.aarogya.model.*;
import com.aarogya.repository.*;
import com.aarogya.security.UserPrincipal;
import com.aarogya.systemdesign.id.UniqueIdGeneratorService;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.*;

@Service
public class PatientRecordService {

    private final ClinicalRecordRepository recordRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final MedicineRepository medicineRepository;
    private final UniqueIdGeneratorService idGenerator;
    private final AuditService auditService;

    public PatientRecordService(
            ClinicalRecordRepository recordRepository,
            PrescriptionRepository prescriptionRepository,
            AppointmentRepository appointmentRepository,
            PatientRepository patientRepository,
            DoctorRepository doctorRepository,
            UserRepository userRepository,
            MedicineRepository medicineRepository,
            UniqueIdGeneratorService idGenerator,
            AuditService auditService) {
        this.recordRepository = recordRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.userRepository = userRepository;
        this.medicineRepository = medicineRepository;
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

        if (req == null || req.items() == null || req.items().isEmpty()) {
            throw new Exceptions.BadRequestException("Prescription must contain at least one medication item.");
        }

        List<PrescriptionDocument.PrescriptionItem> items = new ArrayList<>();
        for (PrescriptionDtos.PrescriptionItemDto item : req.items()) {
            String medId = item.medicineId();
            String medName = item.medicineName();
            MedicineDocument med = null;

            if (medId != null && !medId.isBlank()) {
                med = medicineRepository.findById(medId).orElse(null);
                if (med == null) {
                    med = medicineRepository.findByCode(medId).orElse(null);
                }
            }
            if (med == null && medName != null && !medName.isBlank()) {
                med = medicineRepository.findByNameContainingIgnoreCase(medName).stream().findFirst().orElse(null);
            }

            if (med != null) {
                medId = med.getId();
                medName = med.getName();
            } else if (medName == null || medName.isBlank()) {
                throw new Exceptions.BadRequestException("Medication name is required.");
            }

            int qty = item.quantity();
            if (qty <= 0) {
                qty = item.durationDays() > 0 ? item.durationDays() : 10;
            }

            items.add(new PrescriptionDocument.PrescriptionItem(
                    medId != null ? medId : "med-custom-" + UUID.randomUUID(),
                    medName,
                    item.dosage() != null ? item.dosage() : "1 unit",
                    item.frequency() != null ? item.frequency() : "Once daily",
                    item.durationDays() > 0 ? item.durationDays() : 7,
                    item.instructions() != null ? item.instructions() : "Take as directed",
                    qty
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

    public List<PrescriptionDtos.PrescriptionResponse> getAllPrescriptions(String status) {
        List<PrescriptionDocument> docs;
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            docs = prescriptionRepository.findAll().stream()
                    .filter(p -> status.equalsIgnoreCase(p.getStatus()))
                    .sorted(Comparator.comparing(PrescriptionDocument::getCreatedAt).reversed())
                    .toList();
        } else {
            docs = prescriptionRepository.findAll().stream()
                    .sorted(Comparator.comparing(PrescriptionDocument::getCreatedAt).reversed())
                    .toList();
        }
        return docs.stream().map(this::mapPrescriptionToDto).toList();
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

    public String resolvePatientId(String patientIdOrUhid) {
        if (patientIdOrUhid == null || patientIdOrUhid.isBlank()) return "";
        if (patientIdOrUhid.startsWith("AC-")) {
            return patientRepository.findByUhid(patientIdOrUhid)
                    .map(PatientDocument::getId)
                    .orElse(patientIdOrUhid);
        }
        Optional<PatientDocument> byUser = patientRepository.findByUserId(patientIdOrUhid);
        if (byUser.isPresent()) {
            return byUser.get().getId();
        }
        Optional<PatientDocument> byUhid = patientRepository.findByUhid(patientIdOrUhid);
        if (byUhid.isPresent()) {
            return byUhid.get().getId();
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

    public List<PatientDtos.PatientResponse> searchPatients(String query) {
        List<PatientDocument> all = patientRepository.findAll();
        if (query == null || query.isBlank()) {
            return all.stream().map(this::mapPatientToDto).toList();
        }
        String q = query.trim().toLowerCase();
        return all.stream()
                .filter(p -> {
                    if (p.getUhid() != null && p.getUhid().toLowerCase().contains(q)) return true;
                    if (p.getId() != null && p.getId().toLowerCase().contains(q)) return true;
                    UserDocument u = userRepository.findById(p.getUserId()).orElse(null);
                    if (u != null) {
                        return (u.getFullName() != null && u.getFullName().toLowerCase().contains(q))
                                || (u.getPhone() != null && u.getPhone().contains(q))
                                || (u.getEmail() != null && u.getEmail().toLowerCase().contains(q));
                    }
                    return false;
                })
                .map(this::mapPatientToDto)
                .toList();
    }

    public PatientDtos.PatientResponse getPatientProfile(String idOrUhid) {
        String patientId = resolvePatientId(idOrUhid);
        PatientDocument p = patientRepository.findById(patientId)
                .or(() -> patientRepository.findByUhid(idOrUhid))
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Patient not found: " + idOrUhid));
        return mapPatientToDto(p);
    }

    public PatientDtos.PatientResponse registerPatient(PatientDtos.CreatePatientRequest req, UserPrincipal principal) {
        String patientName = req.name() != null ? req.name().trim() : "New Patient";
        String email = req.email() != null && !req.email().isBlank()
                ? req.email().trim().toLowerCase()
                : "patient." + UUID.randomUUID().toString().substring(0, 8) + "@aarogya.local";
        String phone = req.phone() != null ? req.phone().trim() : "+91 98400 00000";

        // Check if user exists or create new
        Optional<UserDocument> existingUser = userRepository.findByEmail(email);
        UserDocument user;
        if (existingUser.isPresent()) {
            user = existingUser.get();
            Optional<PatientDocument> existingPatient = patientRepository.findByUserId(user.getId());
            if (existingPatient.isPresent()) {
                return mapPatientToDto(existingPatient.get());
            }
        } else {
            String userId = "user-pat-" + UUID.randomUUID().toString().substring(0, 8);
            user = new UserDocument(
                    userId,
                    email,
                    "$2a$10$e8w8eXn3V1C.1gQ.q9d/e.6Wz3/Y6Y6z8bO1T9T9T9T9T9T9T9T9T",
                    patientName,
                    "patient",
                    phone
            );
            userRepository.save(user);
        }

        String uhid;
        int attempts = 0;
        do {
            long snowflake = Math.abs(idGenerator.nextSnowflakeId());
            long val = (snowflake + (attempts * 7919L)) % 1000000L;
            uhid = "AC-" + LocalDate.now().getYear() + "-" + String.format("%06d", Math.abs(val));
            attempts++;
        } while (patientRepository.existsByUhid(uhid) && attempts < 20);
        String patientId = "pat-" + UUID.randomUUID().toString().substring(0, 8);

        String validatedDob = null;
        if (req.dateOfBirth() != null && !req.dateOfBirth().isBlank()) {
            try {
                LocalDate parsed = LocalDate.parse(req.dateOfBirth().trim());
                if (parsed.isAfter(LocalDate.now())) {
                    throw new Exceptions.BadRequestException("Date of birth cannot be in the future.");
                }
                validatedDob = parsed.toString();
            } catch (DateTimeParseException ex) {
                throw new Exceptions.BadRequestException("Invalid date of birth format: " + req.dateOfBirth() + ". Expected ISO-8601 date (YYYY-MM-DD).");
            }
        }

        PatientDocument patient = new PatientDocument(
                patientId,
                user.getId(),
                uhid,
                validatedDob,
                req.gender() != null && !req.gender().isBlank() ? req.gender() : "Other",
                req.bloodGroup() != null && !req.bloodGroup().isBlank() ? req.bloodGroup() : "Unknown"
        );
        patient.setAddress(req.address() != null ? req.address() : "Chennai, Tamil Nadu");
        patient.setAllergies(req.allergies() != null ? req.allergies() : "None reported");
        patient.setChronicConditions(req.chronicConditions() != null ? req.chronicConditions() : "None reported");
        patient.setEmergencyContactName(req.emergencyContactName());
        patient.setEmergencyContactPhone(req.emergencyContactPhone());

        patientRepository.save(patient);

        auditService.recordEvent(
                principal != null ? principal.getId() : "system",
                principal != null ? principal.getUsername() : "receptionist",
                "REGISTER_PATIENT",
                "Patient",
                patient.getId(),
                "Registered new patient " + patientName + " with UHID " + uhid
        );

        return mapPatientToDto(patient);
    }

    public PatientDtos.PatientResponse updatePatientProfile(String patientIdOrUhid, PatientDtos.UpdatePatientProfileRequest req, UserPrincipal principal) {
        String patientId = resolvePatientId(patientIdOrUhid);
        PatientDocument patient = patientRepository.findById(patientId)
                .or(() -> patientRepository.findByUhid(patientIdOrUhid))
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Patient not found: " + patientIdOrUhid));

        if (req.dateOfBirth() != null && !req.dateOfBirth().isBlank()) {
            try {
                LocalDate parsed = LocalDate.parse(req.dateOfBirth().trim());
                if (parsed.isAfter(LocalDate.now())) {
                    throw new Exceptions.BadRequestException("Date of birth cannot be in the future.");
                }
                patient.setDateOfBirth(parsed.toString());
            } catch (DateTimeParseException ex) {
                throw new Exceptions.BadRequestException("Invalid date of birth format: " + req.dateOfBirth() + ". Expected ISO-8601 date (YYYY-MM-DD).");
            }
        }

        if (req.gender() != null && !req.gender().isBlank()) {
            patient.setGender(req.gender().trim());
        }
        if (req.bloodGroup() != null && !req.bloodGroup().isBlank()) {
            patient.setBloodGroup(req.bloodGroup().trim());
        }
        if (req.address() != null) {
            patient.setAddress(req.address().trim());
        }
        if (req.allergies() != null) {
            patient.setAllergies(req.allergies().trim());
        }
        if (req.chronicConditions() != null) {
            patient.setChronicConditions(req.chronicConditions().trim());
        }
        if (req.emergencyContactName() != null) {
            patient.setEmergencyContactName(req.emergencyContactName().trim());
        }
        if (req.emergencyContactPhone() != null) {
            patient.setEmergencyContactPhone(req.emergencyContactPhone().trim());
        }

        if (patient.getUserId() != null) {
            userRepository.findById(patient.getUserId()).ifPresent(user -> {
                boolean userModified = false;
                if (req.name() != null && !req.name().isBlank()) {
                    user.setFullName(req.name().trim());
                    userModified = true;
                }
                if (req.phone() != null && !req.phone().isBlank()) {
                    user.setPhone(req.phone().trim());
                    userModified = true;
                }
                if (userModified) {
                    userRepository.save(user);
                }
            });
        }

        patientRepository.save(patient);

        auditService.recordEvent(
                principal != null ? principal.getId() : "system",
                principal != null ? principal.getUsername() : "system",
                "UPDATE_PATIENT_PROFILE",
                "Patient",
                patient.getId(),
                "Updated profile for patient " + patient.getId()
        );

        return mapPatientToDto(patient);
    }

    private PatientDtos.PatientResponse mapPatientToDto(PatientDocument p) {
        String name = "Patient";
        String email = "";
        String phone = "";

        UserDocument u = userRepository.findById(p.getUserId()).orElse(null);
        if (u != null) {
            name = u.getFullName();
            email = u.getEmail();
            phone = u.getPhone();
        }

        return new PatientDtos.PatientResponse(
                p.getId(),
                p.getUserId(),
                p.getUhid(),
                name,
                email,
                phone,
                p.getDateOfBirth(),
                p.getGender(),
                p.getBloodGroup(),
                p.getAddress(),
                p.getAllergies(),
                p.getChronicConditions(),
                p.getEmergencyContactName(),
                p.getEmergencyContactPhone(),
                p.getCreatedAt()
        );
    }
}
