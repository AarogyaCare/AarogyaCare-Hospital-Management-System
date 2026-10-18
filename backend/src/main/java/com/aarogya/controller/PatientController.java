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

    public PatientController(
            PatientRecordService recordService,
            BillingService billingService,
            PatientRepository patientRepository) {
        this.recordService = recordService;
        this.billingService = billingService;
        this.patientRepository = patientRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<List<AppointmentDtos.ClinicalNoteResponse>> getMyRecords(
            @AuthenticationPrincipal UserPrincipal principal) {
        String patientId = resolveSelfPatientId(principal);
        return ResponseEntity.ok(recordService.getRecordsByPatient(patientId));
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
}
