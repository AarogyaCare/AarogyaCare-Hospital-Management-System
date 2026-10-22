package com.aarogya.controller;

import com.aarogya.dto.AppointmentDtos;
import com.aarogya.dto.BillingDtos;
import com.aarogya.dto.PrescriptionDtos;
import com.aarogya.exception.Exceptions;
import com.aarogya.model.PatientDocument;
import com.aarogya.repository.PatientRepository;
import com.aarogya.security.UserPrincipal;
import com.aarogya.service.BillingService;
import com.aarogya.service.PatientRecordService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/patients")
public class PatientController {

    private final PatientRecordService recordService;
    private final BillingService billingService;
    private final PatientRepository patientRepository;
    private final com.aarogya.service.LabService labService;

    public PatientController(
            PatientRecordService recordService,
            BillingService billingService,
            PatientRepository patientRepository,
            com.aarogya.service.LabService labService) {
        this.recordService = recordService;
        this.billingService = billingService;
        this.patientRepository = patientRepository;
        this.labService = labService;
    }

    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('DOCTOR', 'NURSE', 'RECEPTIONIST', 'BILLING_STAFF', 'PHARMACIST', 'ADMIN')")
    public ResponseEntity<List<com.aarogya.dto.PatientDtos.PatientResponse>> searchPatients(
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(recordService.searchPatients(search));
    }

    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('RECEPTIONIST', 'DOCTOR', 'NURSE', 'ADMIN')")
    public ResponseEntity<com.aarogya.dto.PatientDtos.PatientResponse> registerPatient(
            @jakarta.validation.Valid @RequestBody com.aarogya.dto.PatientDtos.CreatePatientRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(recordService.registerPatient(request, principal));
    }

    @GetMapping("/me/profile")
    public ResponseEntity<com.aarogya.dto.PatientDtos.PatientResponse> getMyProfile(
            @AuthenticationPrincipal UserPrincipal principal) {
        String patientId = resolveSelfPatientId(principal);
        return ResponseEntity.ok(recordService.getPatientProfile(patientId));
    }

    @PatchMapping("/me/profile")
    public ResponseEntity<com.aarogya.dto.PatientDtos.PatientResponse> updateMyProfile(
            @jakarta.validation.Valid @RequestBody com.aarogya.dto.PatientDtos.UpdatePatientProfileRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        String patientId = resolveSelfPatientId(principal);
        return ResponseEntity.ok(recordService.updatePatientProfile(patientId, request, principal));
    }

    @GetMapping("/me")
    public ResponseEntity<List<AppointmentDtos.ClinicalNoteResponse>> getMyRecords(
            @AuthenticationPrincipal UserPrincipal principal) {
        String patientId = resolveSelfPatientId(principal);
        return ResponseEntity.ok(recordService.getRecordsByPatient(patientId));
    }

    @GetMapping("/me/prescriptions")
    public ResponseEntity<List<PrescriptionDtos.PrescriptionResponse>> getMyPrescriptions(
            @AuthenticationPrincipal UserPrincipal principal) {
        String patientId = resolveSelfPatientId(principal);
        return ResponseEntity.ok(recordService.getPrescriptionsByPatient(patientId));
    }

    @GetMapping("/me/invoices")
    public ResponseEntity<List<BillingDtos.InvoiceResponse>> getMyInvoices(
            @AuthenticationPrincipal UserPrincipal principal) {
        String patientId = resolveSelfPatientId(principal);
        return ResponseEntity.ok(billingService.getInvoicesByPatient(patientId));
    }

    @GetMapping("/me/lab-orders")
    public ResponseEntity<List<com.aarogya.dto.LabDtos.LabOrderResponse>> getMyLabOrders(
            @AuthenticationPrincipal UserPrincipal principal) {
        String patientId = resolveSelfPatientId(principal);
        return ResponseEntity.ok(labService.getOrdersByPatient(patientId, principal));
    }

    @GetMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('DOCTOR', 'NURSE', 'RECEPTIONIST', 'BILLING_STAFF', 'PHARMACIST', 'ADMIN', 'PATIENT')")
    public ResponseEntity<com.aarogya.dto.PatientDtos.PatientResponse> getPatientById(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        assertCanAccessPatientProfile(id, principal);
        return ResponseEntity.ok(recordService.getPatientProfile(id));
    }

    @PatchMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('PATIENT', 'RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<com.aarogya.dto.PatientDtos.PatientResponse> updatePatientProfile(
            @PathVariable String id,
            @jakarta.validation.Valid @RequestBody com.aarogya.dto.PatientDtos.UpdatePatientProfileRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        assertCanModifyPatientProfile(id, principal);
        return ResponseEntity.ok(recordService.updatePatientProfile(id, request, principal));
    }

    @GetMapping("/{id}/records")
    public ResponseEntity<List<AppointmentDtos.ClinicalNoteResponse>> getPatientRecords(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        assertCanAccessPatientClinicalRecords(id, principal);
        return ResponseEntity.ok(recordService.getRecordsByPatient(id));
    }

    @GetMapping("/{id}/prescriptions")
    public ResponseEntity<List<PrescriptionDtos.PrescriptionResponse>> getPatientPrescriptions(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        assertCanAccessPatientPrescriptions(id, principal);
        return ResponseEntity.ok(recordService.getPrescriptionsByPatient(id));
    }

    @GetMapping("/{id}/invoices")
    public ResponseEntity<List<BillingDtos.InvoiceResponse>> getPatientInvoices(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        assertCanAccessPatientInvoices(id, principal);
        return ResponseEntity.ok(billingService.getInvoicesByPatient(id));
    }

    @GetMapping("/{id}/lab-orders")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('DOCTOR', 'NURSE', 'ADMIN', 'PATIENT')")
    public ResponseEntity<List<com.aarogya.dto.LabDtos.LabOrderResponse>> getPatientLabOrders(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(labService.getOrdersByPatient(id, principal));
    }

    private String resolveSelfPatientId(UserPrincipal principal) {
        if (principal == null) {
            throw new Exceptions.UnauthorizedException("Authentication required.");
        }
        return patientRepository.findByUserId(principal.getId())
                .map(PatientDocument::getId)
                .orElse(principal.getId());
    }

    private void assertCanAccessPatientClinicalRecords(String targetPatientIdOrUhid, UserPrincipal principal) {
        if (principal == null) {
            throw new Exceptions.UnauthorizedException("Authentication required.");
        }
        String role = principal.getRole().toLowerCase();

        // Doctors, Nurses, and Admins can access clinical records for any patient
        if (Set.of("doctor", "nurse", "admin").contains(role)) {
            return;
        }

        // Patients can only access their own records
        if ("patient".equalsIgnoreCase(role)) {
            if (isSelfPatient(targetPatientIdOrUhid, principal)) {
                return;
            }
            throw new Exceptions.ForbiddenException("Access denied: You may only access your own clinical records.");
        }

        // Other roles (receptionist, pharmacist, billing_staff) are strictly forbidden from clinical consultation notes
        throw new Exceptions.ForbiddenException("Access denied: Role '" + principal.getRole() + "' is not permitted to view clinical consultation notes.");
    }

    private void assertCanAccessPatientPrescriptions(String targetPatientIdOrUhid, UserPrincipal principal) {
        if (principal == null) {
            throw new Exceptions.UnauthorizedException("Authentication required.");
        }
        String role = principal.getRole().toLowerCase();

        if (Set.of("doctor", "nurse", "pharmacist", "admin").contains(role)) {
            return;
        }

        if ("patient".equalsIgnoreCase(role)) {
            if (isSelfPatient(targetPatientIdOrUhid, principal)) {
                return;
            }
            throw new Exceptions.ForbiddenException("Access denied: You may only access your own prescriptions.");
        }

        throw new Exceptions.ForbiddenException("Access denied: Role '" + principal.getRole() + "' is not permitted to view prescriptions.");
    }

    private void assertCanAccessPatientInvoices(String targetPatientIdOrUhid, UserPrincipal principal) {
        if (principal == null) {
            throw new Exceptions.UnauthorizedException("Authentication required.");
        }
        String role = principal.getRole().toLowerCase();

        if (Set.of("billing_staff", "receptionist", "admin").contains(role)) {
            return;
        }

        if ("patient".equalsIgnoreCase(role)) {
            if (isSelfPatient(targetPatientIdOrUhid, principal)) {
                return;
            }
            throw new Exceptions.ForbiddenException("Access denied: You may only access your own invoices.");
        }

        throw new Exceptions.ForbiddenException("Access denied: Role '" + principal.getRole() + "' is not permitted to view invoices.");
    }

    private boolean isSelfPatient(String targetPatientIdOrUhid, UserPrincipal principal) {
        if (targetPatientIdOrUhid.equals(principal.getId())) {
            return true;
        }
        Optional<PatientDocument> p = patientRepository.findByUserId(principal.getId());
        if (p.isPresent()) {
            return targetPatientIdOrUhid.equals(p.get().getId()) || targetPatientIdOrUhid.equalsIgnoreCase(p.get().getUhid());
        }
        return false;
    }

    private void assertCanModifyPatientProfile(String targetPatientIdOrUhid, UserPrincipal principal) {
        if (principal == null) {
            throw new Exceptions.UnauthorizedException("Authentication required.");
        }
        String role = principal.getRole() != null ? principal.getRole().toLowerCase() : "";
        if (Set.of("admin", "receptionist").contains(role)) {
            return;
        }
        if ("patient".equals(role)) {
            if (isSelfPatient(targetPatientIdOrUhid, principal)) {
                return;
            }
            throw new Exceptions.ForbiddenException("Access denied: You may only update your own patient profile.");
        }
        throw new Exceptions.ForbiddenException("Access denied: Role '" + principal.getRole() + "' is not permitted to update patient profiles.");
    }
    private void assertCanAccessPatientProfile(String targetPatientIdOrUhid, UserPrincipal principal) {
        if (principal == null) {
            throw new Exceptions.UnauthorizedException("Authentication required.");
        }
        String role = principal.getRole() != null ? principal.getRole().toLowerCase() : "";
        if (Set.of("doctor", "nurse", "receptionist", "billing_staff", "admin").contains(role)) {
            return;
        }
        if ("patient".equals(role)) {
            if (isSelfPatient(targetPatientIdOrUhid, principal)) {
                return;
            }
            throw new Exceptions.ForbiddenException("Access denied: You may only view your own patient profile.");
        }
        throw new Exceptions.ForbiddenException("Access denied: Role '" + principal.getRole() + "' is not permitted to view patient profiles.");
    }
}
