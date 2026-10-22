package com.aarogya;

import com.aarogya.dto.EmergencyDtos;
import com.aarogya.security.UserPrincipal;
import com.aarogya.service.EmergencyService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class EmergencyWorkflowTests {

    @Autowired
    private EmergencyService emergencyService;

    @Test
    @DisplayName("Verify emergency request intake sets correct priority score and status updates")
    void testEmergencyIntakeAndStatusProgression() {
        UserPrincipal nurse = new UserPrincipal("user-n1", "nurse@test.org", "pass", "nurse", "Triage Nurse", true);

        // 1. Intake RED priority patient
        EmergencyDtos.EmergencyCreateRequest redReq = new EmergencyDtos.EmergencyCreateRequest(
            "Emergency Patient Red",
            null,
            "+91 99999 88888",
            "RED",
            "Severe polytrauma, hypotension",
            "BP: 70/40, HR: 140, SpO2: 86%"
        );

        var redDoc = emergencyService.createEmergencyRequest(redReq, nurse);
        assertNotNull(redDoc);
        assertEquals("RED", redDoc.triageLevel());
        assertEquals(1, redDoc.priorityScore());
        assertEquals("INCOMING", redDoc.status());

        // 2. Status progression: INCOMING -> TRIAGED -> STABILIZING -> ADMITTED
        var triaged = emergencyService.updateStatus(redDoc.id(), "TRIAGED", nurse);
        assertEquals("TRIAGED", triaged.status());

        var stabilizing = emergencyService.updateStatus(redDoc.id(), "STABILIZING", nurse);
        assertEquals("STABILIZING", stabilizing.status());

        var admitted = emergencyService.updateStatus(redDoc.id(), "ADMITTED", nurse);
        assertEquals("ADMITTED", admitted.status());

        // 3. Queue retrieval verifies ordering
        List<EmergencyDtos.EmergencyResponse> queue = emergencyService.getEmergencyQueue(null);
        assertFalse(queue.isEmpty());
        // Verify priority ordering: first items have lowest priority score (1 = RED)
        assertTrue(queue.get(0).priorityScore() <= queue.get(queue.size() - 1).priorityScore());
    }

    @Test
    @DisplayName("Verify Reception Front Desk Code Red trauma alert intake succeeds and resolves to RED priority")
    void testFrontDeskCodeRedDispatchAndAcuityMapping() {
        UserPrincipal receptionist = new UserPrincipal("user-r1", "reception@test.org", "pass", "receptionist", "Front Desk Receptionist", true);

        EmergencyDtos.EmergencyCreateRequest frontDeskAlert = new EmergencyDtos.EmergencyCreateRequest(
                null,
                null,
                null,
                "+91 44 2829 0000",
                null,
                "CRITICAL",
                null,
                null,
                "Reception Front Desk",
                "Medora Main Entrance Bay",
                "TRAUMA_CODE_RED",
                "Inbound code red trauma alert triggered by front desk receptionist."
        );

        var response = emergencyService.createEmergencyRequest(frontDeskAlert, receptionist);
        assertNotNull(response);
        assertNotNull(response.id());
        assertTrue(response.patientName().contains("Reception Front Desk"));
        assertEquals("RED", response.triageLevel());
        assertEquals(1, response.priorityScore());
        assertEquals("Medora Main Entrance Bay", response.location());
        assertEquals("TRAUMA_CODE_RED", response.emergencyType());
        assertEquals("INCOMING", response.status());
    }

    @Test
    @DisplayName("Verify invalid emergency status update is rejected with BadRequestException")
    void testInvalidStatusRejection() {
        UserPrincipal nurse = new UserPrincipal("user-n1", "nurse@test.org", "pass", "nurse", "Triage Nurse", true);

        EmergencyDtos.EmergencyCreateRequest req = new EmergencyDtos.EmergencyCreateRequest(
                "Test Patient",
                null,
                "+91 99999 77777",
                "YELLOW",
                "Severe abdominal pain",
                "BP: 130/85"
        );
        var created = emergencyService.createEmergencyRequest(req, nurse);

        assertThrows(com.aarogya.exception.Exceptions.BadRequestException.class, () -> {
            emergencyService.updateStatus(created.id(), "NON_EXISTENT_STATUS", nurse);
        });
    }

    @Test
    @DisplayName("Verify triage acuity levels map correctly: RED=1, YELLOW=2, GREEN=3")
    void testAcuityLevelsPriorityScores() {
        UserPrincipal nurse = new UserPrincipal("user-n1", "nurse@test.org", "pass", "nurse", "Triage Nurse", true);

        var red = emergencyService.createEmergencyRequest(
                new EmergencyDtos.EmergencyCreateRequest("Red Patient", null, "111", "RED", "Cardiac", null), nurse);
        var yellow = emergencyService.createEmergencyRequest(
                new EmergencyDtos.EmergencyCreateRequest("Yellow Patient", null, "222", "YELLOW", "Fracture", null), nurse);
        var green = emergencyService.createEmergencyRequest(
                new EmergencyDtos.EmergencyCreateRequest("Green Patient", null, "333", "GREEN", "Laceration", null), nurse);

        assertEquals(1, red.priorityScore());
        assertEquals(2, yellow.priorityScore());
        assertEquals(3, green.priorityScore());
    }
}
