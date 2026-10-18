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
}
