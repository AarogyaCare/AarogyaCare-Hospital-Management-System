package com.aarogya;

import com.aarogya.controller.AppointmentController;
import com.aarogya.dto.AppointmentDtos;
import com.aarogya.dto.PatientDtos;
import com.aarogya.exception.Exceptions;
import com.aarogya.model.DoctorDocument;
import com.aarogya.model.DoctorSlotDocument;
import com.aarogya.model.PatientDocument;
import com.aarogya.repository.DoctorRepository;
import com.aarogya.repository.DoctorSlotRepository;
import com.aarogya.repository.PatientRepository;
import com.aarogya.security.UserPrincipal;
import com.aarogya.service.AppointmentService;
import com.aarogya.service.PatientRecordService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class ReceptionistBookingPermissionTests {

    @Autowired
    private AppointmentController appointmentController;

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private PatientRecordService patientRecordService;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private DoctorSlotRepository slotRepository;

    private UserPrincipal receptionistPrincipal;
    private UserPrincipal patientPrincipal;
    private UserPrincipal otherPatientPrincipal;
    private UserPrincipal doctorPrincipal;
    private UserPrincipal nursePrincipal;
    private UserPrincipal pharmacistPrincipal;
    private UserPrincipal billingStaffPrincipal;

    private PatientDtos.PatientResponse registeredPatient;
    private PatientDocument patientDoc;
    private String testDoctorId;
    private String testSlotId;
    private String bookingDate;

    @BeforeEach
    void setUp() {
        String testId = UUID.randomUUID().toString().substring(0, 8);
        testDoctorId = "doc-rec-" + testId;
        testSlotId = "slot-rec-" + testId;
        bookingDate = LocalDate.now().plusDays(3).toString();

        String patUserId = "user-pat-rec-" + testId;
        String otherPatUserId = "user-pat2-rec-" + testId;

        receptionistPrincipal = new UserPrincipal(
                "user-rec-" + testId,
                "reception." + testId + "@test.org",
                "pass",
                "receptionist",
                "FrontDesk Staff " + testId,
                true
        );

        patientPrincipal = new UserPrincipal(
                patUserId,
                "patient." + testId + "@test.org",
                "pass",
                "patient",
                "Self Patient " + testId,
                true
        );

        otherPatientPrincipal = new UserPrincipal(
                otherPatUserId,
                "otherpat." + testId + "@test.org",
                "pass",
                "patient",
                "Other Patient " + testId,
                true
        );

        doctorPrincipal = new UserPrincipal(
                "user-doc-" + testId,
                "dr." + testId + "@test.org",
                "pass",
                "doctor",
                "Dr. Specialist " + testId,
                true
        );

        nursePrincipal = new UserPrincipal(
                "user-nurse-" + testId,
                "nurse." + testId + "@test.org",
                "pass",
                "nurse",
                "Nurse Triage " + testId,
                true
        );

        pharmacistPrincipal = new UserPrincipal(
                "user-pharm-" + testId,
                "pharm." + testId + "@test.org",
                "pass",
                "pharmacist",
                "Pharmacist " + testId,
                true
        );

        billingStaffPrincipal = new UserPrincipal(
                "user-bill-" + testId,
                "billing." + testId + "@test.org",
                "pass",
                "billing_staff",
                "Billing Cashier " + testId,
                true
        );

        // Provision Doctor and Slot
        doctorRepository.save(new DoctorDocument(
                testDoctorId,
                "doc-u-" + testId,
                "dept-general",
                "MD, Internal Medicine",
                12,
                "OPD-301",
                4.9,
                List.of("General Medicine"),
                950.0
        ));

        slotRepository.save(new DoctorSlotDocument(
                testSlotId,
                testDoctorId,
                "10:00 AM",
                "10:30 AM",
                "AVAILABLE",
                "OPD-301"
        ));

        // Register a patient for staff walk-in booking tests
        registeredPatient = patientRecordService.registerPatient(new PatientDtos.CreatePatientRequest(
                "Walkin Patient " + testId,
                "walkin." + testId + "@test.org",
                "+91 98401 55667",
                "1988-11-20",
                "Male",
                "B+ Positive",
                "Anna Nagar, Chennai",
                "None",
                "None",
                null,
                null
        ), receptionistPrincipal);

        // Provision patient profile for self-service patient tests
        patientDoc = new PatientDocument(
                "pat-doc-" + testId,
                patUserId,
                "AC-2026-" + testId,
                "1994-05-15",
                "Female",
                "O+ Positive"
        );
        patientRepository.save(patientDoc);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateAs(UserPrincipal principal) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities())
        );
    }

    @Test
    @DisplayName("DEF-04: Receptionist role can successfully book an appointment for a valid patient")
    void testReceptionistCanBookAppointmentWithValidPatientId() {
        authenticateAs(receptionistPrincipal);

        AppointmentDtos.BookAppointmentRequest req = new AppointmentDtos.BookAppointmentRequest(
                testSlotId,
                "Follow-up Consultation",
                "IN_PERSON",
                bookingDate,
                registeredPatient.id()
        );

        var response = appointmentController.bookAppointment(req, null, receptionistPrincipal);

        assertNotNull(response);
        assertEquals(201, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(registeredPatient.id(), response.getBody().patientId());
        assertEquals(testDoctorId, response.getBody().doctorId());
        assertEquals("CONFIRMED", response.getBody().status());
        assertNotNull(response.getBody().queueToken());
    }

    @Test
    @DisplayName("DEF-04: Receptionist booking without patientId throws BadRequestException (no silent staff booking)")
    void testReceptionistCannotBookWithoutPatientId() {
        authenticateAs(receptionistPrincipal);

        // Missing patientId (null)
        AppointmentDtos.BookAppointmentRequest reqNull = new AppointmentDtos.BookAppointmentRequest(
                testSlotId,
                "Walk-in consultation",
                "IN_PERSON",
                bookingDate,
                null
        );
        Exceptions.BadRequestException exNull = assertThrows(Exceptions.BadRequestException.class,
                () -> appointmentController.bookAppointment(reqNull, null, receptionistPrincipal),
                "Staff booking without patientId must be rejected with BadRequestException.");
        assertTrue(exNull.getMessage().contains("Patient ID is required"));

        // Blank patientId ("")
        AppointmentDtos.BookAppointmentRequest reqBlank = new AppointmentDtos.BookAppointmentRequest(
                testSlotId,
                "Walk-in consultation",
                "IN_PERSON",
                bookingDate,
                "   "
        );
        Exceptions.BadRequestException exBlank = assertThrows(Exceptions.BadRequestException.class,
                () -> appointmentController.bookAppointment(reqBlank, null, receptionistPrincipal),
                "Staff booking with blank patientId must be rejected with BadRequestException.");
        assertTrue(exBlank.getMessage().contains("Patient ID is required"));
    }

    @Test
    @DisplayName("DEF-04: Receptionist booking with nonexistent patientId throws ResourceNotFoundException")
    void testReceptionistCannotBookWithNonExistentPatientId() {
        authenticateAs(receptionistPrincipal);

        AppointmentDtos.BookAppointmentRequest req = new AppointmentDtos.BookAppointmentRequest(
                testSlotId,
                "Walk-in consultation",
                "IN_PERSON",
                bookingDate,
                "nonexistent-patient-id-12345"
        );

        assertThrows(Exceptions.ResourceNotFoundException.class,
                () -> appointmentController.bookAppointment(req, null, receptionistPrincipal),
                "Booking with nonexistent patientId must throw ResourceNotFoundException.");
    }

    @Test
    @DisplayName("DEF-04: Patient booking automatically uses own patient record and prevents spoofing another patientId")
    void testPatientSelfBookingIgnoresPatientIdTampering() {
        authenticateAs(patientPrincipal);

        // Patient attempts to supply registeredPatient.id() (tampering)
        AppointmentDtos.BookAppointmentRequest req = new AppointmentDtos.BookAppointmentRequest(
                testSlotId,
                "Self-service booking",
                "IN_PERSON",
                bookingDate,
                registeredPatient.id() // Attempted spoof
        );

        var response = appointmentController.bookAppointment(req, null, patientPrincipal);

        assertNotNull(response);
        assertEquals(201, response.getStatusCode().value());
        assertNotNull(response.getBody());
        // Must be bound to authenticated patient's own ID, not the spoofed patient ID
        assertEquals(patientDoc.getId(), response.getBody().patientId(),
                "Patient booking must be bound to authenticated patient's own record, ignoring any spoofed patientId.");
    }

    @Test
    @DisplayName("DEF-04: Unauthorized roles (Doctor, Nurse, Pharmacist, Billing) are blocked with AccessDeniedException")
    void testUnauthorizedRolesBlockedFromBooking() {
        AppointmentDtos.BookAppointmentRequest req = new AppointmentDtos.BookAppointmentRequest(
                testSlotId,
                "Opd visit",
                "IN_PERSON",
                bookingDate,
                registeredPatient.id()
        );

        // DOCTOR
        authenticateAs(doctorPrincipal);
        assertThrows(AccessDeniedException.class,
                () -> appointmentController.bookAppointment(req, null, doctorPrincipal),
                "Doctor role must be forbidden from booking appointments.");

        // NURSE
        authenticateAs(nursePrincipal);
        assertThrows(AccessDeniedException.class,
                () -> appointmentController.bookAppointment(req, null, nursePrincipal),
                "Nurse role must be forbidden from booking appointments.");

        // PHARMACIST
        authenticateAs(pharmacistPrincipal);
        assertThrows(AccessDeniedException.class,
                () -> appointmentController.bookAppointment(req, null, pharmacistPrincipal),
                "Pharmacist role must be forbidden from booking appointments.");

        // BILLING_STAFF
        authenticateAs(billingStaffPrincipal);
        assertThrows(AccessDeniedException.class,
                () -> appointmentController.bookAppointment(req, null, billingStaffPrincipal),
                "Billing staff role must be forbidden from booking appointments.");
    }
}
