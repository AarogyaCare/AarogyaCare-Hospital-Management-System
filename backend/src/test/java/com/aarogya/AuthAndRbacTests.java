package com.aarogya;

import com.aarogya.dto.AuthDtos;
import com.aarogya.security.JwtTokenProvider;
import com.aarogya.security.UserPrincipal;
import com.aarogya.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class AuthAndRbacTests {

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @BeforeEach
    void setUp() {
        // Database is automatically seeded by DatabaseSeedService
    }

    @Test
    @DisplayName("Verify master demo accounts authenticate and issue valid JWT tokens")
    void testMasterAccountsAuthentication() {
        String[] demoEmails = {
            "admin@aarogyacare.org",
            "dr.ramanathan@aarogyacare.org",
            "receptionist@aarogyacare.org",
            "nurse@aarogyacare.org",
            "pharmacist@aarogyacare.org",
            "billing@aarogyacare.org",
            "patient.rajendran@aarogyacare.org"
        };

        for (String email : demoEmails) {
            AuthDtos.LoginRequest req = new AuthDtos.LoginRequest(email, "Aarogya#2026Secure");
            AuthDtos.TokenResponse res = authService.login(req);

            assertNotNull(res);
            assertNotNull(res.accessToken());
            assertEquals("bearer", res.tokenType());
            assertEquals(email, res.email());
            assertTrue(tokenProvider.validateToken(res.accessToken()));
            assertEquals(email, tokenProvider.getEmailFromToken(res.accessToken()));
        }
    }

    @Test
    @DisplayName("Verify failed authentication with invalid password throws UnauthorizedException")
    void testInvalidPasswordThrows() {
        AuthDtos.LoginRequest req = new AuthDtos.LoginRequest("admin@aarogyacare.org", "WrongPassword123!");
        assertThrows(Exception.class, () -> authService.login(req));
    }

    @Test
    @DisplayName("Verify patient registration auto-provisions UHID profile and prevents duplicate emails")
    void testPatientRegistrationAndDuplicateEmailPrevention() {
        String uniqueEmail = "new.patient." + System.currentTimeMillis() + "@aarogyacare.org";
        AuthDtos.RegisterRequest req = new AuthDtos.RegisterRequest(
            uniqueEmail,
            "Aarogya#2026Secure",
            "Test Patient",
            "+91 91234 56789",
            "patient"
        );

        AuthDtos.TokenResponse res = authService.register(req);
        assertNotNull(res);
        assertNotNull(res.accessToken());
        assertEquals("patient", res.role());
        assertNotNull(res.user().patientProfile());
        assertNotNull(res.user().patientProfile().uhid());
        assertTrue(res.user().patientProfile().uhid().startsWith("AC-2026-"));

        // Attempt duplicate registration
        assertThrows(Exception.class, () -> authService.register(req));
    }

    @Test
    @DisplayName("Security Invariant: Public registration cannot escalate to privileged roles (defaults to patient)")
    void testPublicRegistrationPrivilegeEscalationPrevention() {
        String uniqueEmail = "hacker.attempt." + System.currentTimeMillis() + "@aarogyacare.org";
        AuthDtos.RegisterRequest req = new AuthDtos.RegisterRequest(
            uniqueEmail,
            "Aarogya#2026Secure",
            "Malicious Actor",
            "+91 99999 88888",
            "admin" // Attempting to request admin role
        );

        AuthDtos.TokenResponse res = authService.register(req);
        assertNotNull(res);
        assertEquals("patient", res.role(), "Public registration must force role to 'patient' regardless of requested role.");
    }

    @Test
    @DisplayName("Staff Provisioning: Administrative staff onboarding creates privileged accounts correctly")
    void testStaffUserCreationByAdmin() {
        UserPrincipal adminPrincipal = new UserPrincipal(
            "admin-id",
            "admin@aarogyacare.org",
            "pass",
            "admin",
            "System Admin",
            true
        );

        String uniqueEmail = "dr.newstaff." + System.currentTimeMillis() + "@aarogyacare.org";
        AuthDtos.StaffCreateRequest staffReq = new AuthDtos.StaffCreateRequest(
            uniqueEmail,
            "Aarogya#2026Secure",
            "Dr. New Staff",
            "doctor",
            "+91 98888 77777",
            "dep-general-medicine",
            "Room 101",
            "MBBS, MD",
            5
        );

        AuthDtos.UserDto res = authService.createStaffUser(staffReq, adminPrincipal);
        assertNotNull(res);
        assertEquals("doctor", res.role());
        assertEquals("Dr. New Staff", res.fullName());
    }
}

