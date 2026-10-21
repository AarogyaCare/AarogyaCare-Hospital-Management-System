package com.aarogya;

import com.aarogya.dto.AuthDtos;
import com.aarogya.dto.PatientDtos;
import com.aarogya.exception.Exceptions;
import com.aarogya.model.PatientDocument;
import com.aarogya.model.UserDocument;
import com.aarogya.repository.PatientRepository;
import com.aarogya.repository.UserRepository;
import com.aarogya.security.UserPrincipal;
import com.aarogya.service.AuthService;
import com.aarogya.controller.PatientController;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class PatientDobAndProfileTests {

    @Autowired
    private AuthService authService;

    @Autowired
    private PatientController patientController;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("DEF-02: Patient registration persists valid submitted DOB (not hardcoded 1990-01-01)")
    void testRegistrationDobPersistence() {
        long ts = System.currentTimeMillis();
        String email = "dob.patient." + ts + "@aarogyacare.org";
        String expectedDob = "1995-07-24";

        AuthDtos.RegisterRequest req = new AuthDtos.RegisterRequest(
                email,
                "Aarogya#2026Secure",
                "DOB Test Patient",
                "+91 98401 11223",
                "patient",
                expectedDob
        );

        AuthDtos.TokenResponse res = authService.register(req);
        assertNotNull(res);
        assertNotNull(res.user().patientProfile());
        assertEquals(expectedDob, res.user().patientProfile().dateOfBirth(),
                "Registration response must return submitted DOB.");

        PatientDocument inDb = patientRepository.findByUserId(res.userId()).orElseThrow();
        assertEquals(expectedDob, inDb.getDateOfBirth(),
                "MongoDB patient record must persist the submitted DOB instead of hardcoded 1990-01-01.");
    }

    @Test
    @DisplayName("DEF-02: Patient registration with missing/null DOB does NOT hardcode placeholder 1990-01-01")
    void testRegistrationMissingDobHandledSafely() {
        long ts = System.currentTimeMillis();
        String email = "nodob.patient." + ts + "@aarogyacare.org";

        // Using 5-arg constructor with null DOB
        AuthDtos.RegisterRequest req = new AuthDtos.RegisterRequest(
                email,
                "Aarogya#2026Secure",
                "No DOB Patient",
                "+91 98401 11224",
                "patient"
        );

        AuthDtos.TokenResponse res = authService.register(req);
        assertNotNull(res);
        assertNotNull(res.user().patientProfile());
        assertNull(res.user().patientProfile().dateOfBirth(),
                "Patient registered without DOB must have null dateOfBirth, never hardcoded 1990-01-01.");

        PatientDocument inDb = patientRepository.findByUserId(res.userId()).orElseThrow();
        assertNull(inDb.getDateOfBirth(),
                "Database record must not store legacy placeholder 1990-01-01 when DOB was not provided.");
    }

    @Test
    @DisplayName("DEF-02: Registration rejects malformed DOB format with HTTP 400 BadRequestException")
    void testRegistrationInvalidDobFormatRejected() {
        long ts = System.currentTimeMillis();
        String email = "badformat.patient." + ts + "@aarogyacare.org";

        AuthDtos.RegisterRequest req = new AuthDtos.RegisterRequest(
                email,
                "Aarogya#2026Secure",
                "Bad Format Patient",
                "+91 98401 11225",
                "patient",
                "24/07/1995" // Non-ISO format
        );

        Exceptions.BadRequestException ex = assertThrows(Exceptions.BadRequestException.class,
                () -> authService.register(req),
                "Non-ISO date format must be rejected with BadRequestException.");
        assertTrue(ex.getMessage().toLowerCase().contains("invalid") || ex.getMessage().toLowerCase().contains("format"),
                "Error message must cite format error.");
    }

    @Test
    @DisplayName("DEF-02: Registration rejects future DOB with HTTP 400 BadRequestException")
    void testRegistrationFutureDobRejected() {
        long ts = System.currentTimeMillis();
        String email = "future.patient." + ts + "@aarogyacare.org";
        String tomorrow = LocalDate.now().plusDays(1).toString();

        AuthDtos.RegisterRequest req = new AuthDtos.RegisterRequest(
                email,
                "Aarogya#2026Secure",
                "Future Patient",
                "+91 98401 11226",
                "patient",
                tomorrow
        );

        Exceptions.BadRequestException ex = assertThrows(Exceptions.BadRequestException.class,
                () -> authService.register(req),
                "Future date of birth must be rejected with BadRequestException.");
        assertTrue(ex.getMessage().toLowerCase().contains("future"),
                "Error message must specify future date cannot be used.");
    }

    @Test
    @DisplayName("DEF-02: Login and getCurrentUserProfile return persisted DOB accurately")
    void testLoginAndProfileDobRetrieval() {
        long ts = System.currentTimeMillis();
        String email = "retrieval.patient." + ts + "@aarogyacare.org";
        String expectedDob = "1988-11-14";

        AuthDtos.RegisterRequest req = new AuthDtos.RegisterRequest(
                email,
                "Aarogya#2026Secure",
                "Retrieval Patient",
                "+91 98401 11227",
                "patient",
                expectedDob
        );
        authService.register(req);

        // Login
        AuthDtos.LoginRequest loginReq = new AuthDtos.LoginRequest(email, "Aarogya#2026Secure");
        AuthDtos.TokenResponse loginRes = authService.login(loginReq);
        assertNotNull(loginRes.user().patientProfile());
        assertEquals(expectedDob, loginRes.user().patientProfile().dateOfBirth(),
                "Login response must include persisted patient DOB.");

        // /api/v1/auth/me equivalent
        UserPrincipal principal = new UserPrincipal(
                loginRes.userId(),
                email,
                "pass",
                "patient",
                "Retrieval Patient",
                true
        );
        AuthDtos.UserDto userDto = authService.getCurrentUserProfile(principal);
        assertNotNull(userDto.patientProfile());
        assertEquals(expectedDob, userDto.patientProfile().dateOfBirth(),
                "getCurrentUserProfile must return persisted DOB.");
    }

    @Test
    @DisplayName("DEF-02: Patient can update their own DOB and demographic details via profile endpoint")
    void testPatientCanUpdateOwnProfileDob() {
        long ts = System.currentTimeMillis();
        String email = "update.patient." + ts + "@aarogyacare.org";
        String initialDob = "1991-04-10";
        String updatedDob = "1991-04-12";

        AuthDtos.RegisterRequest regReq = new AuthDtos.RegisterRequest(
                email,
                "Aarogya#2026Secure",
                "Update Patient",
                "+91 98401 11228",
                "patient",
                initialDob
        );
        AuthDtos.TokenResponse regRes = authService.register(regReq);

        UserPrincipal principal = new UserPrincipal(
                regRes.userId(),
                email,
                "pass",
                "patient",
                "Update Patient",
                true
        );

        PatientDtos.UpdatePatientProfileRequest updateReq = new PatientDtos.UpdatePatientProfileRequest(
                "Updated Name Patient",
                "+91 98401 99999",
                updatedDob,
                "Female",
                "B+",
                "Anna Nagar, Chennai",
                "Penicillin",
                "Asthma",
                "Emergency Kin",
                "+91 98401 88888"
        );

        var updateResponse = patientController.updateMyProfile(updateReq, principal);
        assertNotNull(updateResponse.getBody());
        assertEquals(updatedDob, updateResponse.getBody().dateOfBirth(),
                "Updated profile must reflect new validated DOB.");
        assertEquals("Female", updateResponse.getBody().gender());
        assertEquals("B+", updateResponse.getBody().bloodGroup());

        PatientDocument inDb = patientRepository.findByUserId(regRes.userId()).orElseThrow();
        assertEquals(updatedDob, inDb.getDateOfBirth());
        assertEquals("Female", inDb.getGender());
        assertEquals("B+", inDb.getBloodGroup());
        assertEquals("Anna Nagar, Chennai", inDb.getAddress());

        UserDocument userInDb = userRepository.findById(regRes.userId()).orElseThrow();
        assertEquals("Updated Name Patient", userInDb.getFullName());
        assertEquals("+91 98401 99999", userInDb.getPhone());
    }

    @Test
    @DisplayName("DEF-02 Authorization: Patient is forbidden (HTTP 403) from updating another patient's profile/DOB")
    void testPatientCannotUpdateAnotherPatientDobForbidden() {
        long ts = System.currentTimeMillis();
        // Register Patient A
        String emailA = "patientA." + ts + "@aarogyacare.org";
        AuthDtos.TokenResponse resA = authService.register(new AuthDtos.RegisterRequest(
                emailA, "Aarogya#2026Secure", "Patient A", "+91 98401 00001", "patient", "1990-05-15"
        ));

        // Register Patient B
        String emailB = "patientB." + ts + "@aarogyacare.org";
        AuthDtos.TokenResponse resB = authService.register(new AuthDtos.RegisterRequest(
                emailB, "Aarogya#2026Secure", "Patient B", "+91 98401 00002", "patient", "1992-08-20"
        ));

        PatientDocument patientBDoc = patientRepository.findByUserId(resB.userId()).orElseThrow();

        // Patient A principal tries to update Patient B's document
        UserPrincipal principalA = new UserPrincipal(
                resA.userId(),
                emailA,
                "pass",
                "patient",
                "Patient A",
                true
        );

        PatientDtos.UpdatePatientProfileRequest exploitReq = new PatientDtos.UpdatePatientProfileRequest(
                "Exploited Name", null, "1980-01-01", null, null, null, null, null, null, null
        );

        try {
            org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
                    new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                            principalA, null, principalA.getAuthorities()
                    )
            );

            Exceptions.ForbiddenException ex = assertThrows(Exceptions.ForbiddenException.class,
                    () -> patientController.updatePatientProfile(patientBDoc.getId(), exploitReq, principalA),
                    "Patient must be forbidden from updating another patient's profile.");
            assertTrue(ex.getMessage().toLowerCase().contains("access denied") || ex.getMessage().toLowerCase().contains("own"),
                    "Error message must state patient can only update their own profile.");
        } finally {
            org.springframework.security.core.context.SecurityContextHolder.clearContext();
        }

        // Verify Patient B was not modified
        PatientDocument untouchedB = patientRepository.findById(patientBDoc.getId()).orElseThrow();
        assertEquals("1992-08-20", untouchedB.getDateOfBirth(), "Target patient's DOB must remain untouched.");
    }

    @Test
    @DisplayName("DEF-02: Profile update rejects future or malformed DOB with HTTP 400")
    void testProfileUpdateRejectsInvalidAndFutureDob() {
        long ts = System.currentTimeMillis();
        String email = "valupdate.patient." + ts + "@aarogyacare.org";
        AuthDtos.TokenResponse res = authService.register(new AuthDtos.RegisterRequest(
                email, "Aarogya#2026Secure", "Validation Patient", "+91 98401 00003", "patient", "1994-06-18"
        ));

        UserPrincipal principal = new UserPrincipal(
                res.userId(),
                email,
                "pass",
                "patient",
                "Validation Patient",
                true
        );

        // Future DOB
        PatientDtos.UpdatePatientProfileRequest futureReq = new PatientDtos.UpdatePatientProfileRequest(
                null, null, LocalDate.now().plusDays(5).toString(), null, null, null, null, null, null, null
        );
        assertThrows(Exceptions.BadRequestException.class,
                () -> patientController.updateMyProfile(futureReq, principal),
                "Future DOB in profile update must be rejected with BadRequestException.");

        // Malformed DOB
        PatientDtos.UpdatePatientProfileRequest malformedReq = new PatientDtos.UpdatePatientProfileRequest(
                null, null, "not-a-valid-date", null, null, null, null, null, null, null
        );
        assertThrows(Exceptions.BadRequestException.class,
                () -> patientController.updateMyProfile(malformedReq, principal),
                "Malformed DOB in profile update must be rejected with BadRequestException.");
    }

    @Test
    @DisplayName("DEF-02 IDOR: Patient cannot retrieve another patient's profile by ID or UHID, but self and staff access succeed")
    void testPatientProfileIdorProtection() {
        long ts = System.currentTimeMillis();
        // Register Patient A
        String emailA = "idorA." + ts + "@aarogyacare.org";
        AuthDtos.TokenResponse resA = authService.register(new AuthDtos.RegisterRequest(
                emailA, "Aarogya#2026Secure", "Patient Alpha", "+91 98401 22331", "patient", "1991-03-12"
        ));
        PatientDocument patientADoc = patientRepository.findByUserId(resA.userId()).orElseThrow();

        // Register Patient B
        String emailB = "idorB." + ts + "@aarogyacare.org";
        AuthDtos.TokenResponse resB = authService.register(new AuthDtos.RegisterRequest(
                emailB, "Aarogya#2026Secure", "Patient Beta", "+91 98401 22332", "patient", "1993-07-25"
        ));
        PatientDocument patientBDoc = patientRepository.findByUserId(resB.userId()).orElseThrow();

        UserPrincipal principalA = new UserPrincipal(
                resA.userId(),
                emailA,
                "pass",
                "patient",
                "Patient Alpha",
                true
        );

        UserPrincipal principalDoctor = new UserPrincipal(
                java.util.UUID.randomUUID().toString(),
                "doc." + ts + "@aarogyacare.org",
                "pass",
                "doctor",
                "Dr. Specialist",
                true
        );

        UserPrincipal principalReceptionist = new UserPrincipal(
                java.util.UUID.randomUUID().toString(),
                "recep." + ts + "@aarogyacare.org",
                "pass",
                "receptionist",
                "Front Desk",
                true
        );

        try {
            // 1. Patient A attempting to access Patient B's profile by Patient ID -> Forbidden (HTTP 403)
            org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
                    new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                            principalA, null, principalA.getAuthorities()
                    )
            );
            assertThrows(Exceptions.ForbiddenException.class,
                    () -> patientController.getPatientById(patientBDoc.getId(), principalA),
                    "Patient A must be forbidden from accessing Patient B's profile by patient ID.");

            // 2. Patient A attempting to access Patient B's profile by UHID -> Forbidden (HTTP 403)
            assertThrows(Exceptions.ForbiddenException.class,
                    () -> patientController.getPatientById(patientBDoc.getUhid(), principalA),
                    "Patient A must be forbidden from accessing Patient B's profile by UHID.");

            // 3. Patient A accessing own profile by Patient ID -> Succeeds
            var selfResponseById = patientController.getPatientById(patientADoc.getId(), principalA);
            assertNotNull(selfResponseById.getBody());
            assertEquals("Patient Alpha", selfResponseById.getBody().name());
            assertEquals("1991-03-12", selfResponseById.getBody().dateOfBirth());

            // 4. Patient A accessing own profile by UHID -> Succeeds
            var selfResponseByUhid = patientController.getPatientById(patientADoc.getUhid(), principalA);
            assertNotNull(selfResponseByUhid.getBody());
            assertEquals("Patient Alpha", selfResponseByUhid.getBody().name());

            // 5. Authorized Staff (Doctor) accessing Patient B's profile -> Succeeds
            org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
                    new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                            principalDoctor, null, principalDoctor.getAuthorities()
                    )
            );
            var docAccessResponse = patientController.getPatientById(patientBDoc.getId(), principalDoctor);
            assertNotNull(docAccessResponse.getBody());
            assertEquals("Patient Beta", docAccessResponse.getBody().name());

            // 6. Authorized Staff (Receptionist) accessing Patient B's profile by UHID -> Succeeds
            org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
                    new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                            principalReceptionist, null, principalReceptionist.getAuthorities()
                    )
            );
            var recepAccessResponse = patientController.getPatientById(patientBDoc.getUhid(), principalReceptionist);
            assertNotNull(recepAccessResponse.getBody());
            assertEquals("Patient Beta", recepAccessResponse.getBody().name());
        } finally {
            org.springframework.security.core.context.SecurityContextHolder.clearContext();
        }
    }
}
