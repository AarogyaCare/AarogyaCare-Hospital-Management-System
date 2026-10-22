package com.aarogya;

import com.aarogya.dto.EmergencyDtos;
import com.aarogya.exception.Exceptions;
import com.aarogya.security.UserPrincipal;
import com.aarogya.service.EmergencyService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class EmergencyIncidentLifecycleTests {

    @Autowired
    private EmergencyService emergencyService;

    @Test
    @DisplayName("Verify comprehensive emergency incident lifecycle from intake to care team, intervention, and disposition")
    void testFullEmergencyIncidentLifecycle() {
        UserPrincipal receptionist = new UserPrincipal("user-r1", "reception@aarogya.org", "pass", "receptionist", "Receptionist", true);
        UserPrincipal nurse = new UserPrincipal("user-n1", "nurse@aarogya.org", "pass", "nurse", "Trauma Nurse", true);
        UserPrincipal doctor = new UserPrincipal("doc-1", "doctor@aarogya.org", "pass", "doctor", "Emergency Physician", true);

        // 1. Inbound Emergency Intake (Snowflake incident ID, provisional flag, timeline)
        EmergencyDtos.EmergencyCreateRequest intake = new EmergencyDtos.EmergencyCreateRequest(
                "Unidentified Trauma Victim #4",
                null, // No patient ID -> provisional
                "+91 99999 00000",
                "RED",
                "Severe motor vehicle collision, altered sensorium",
                "BP: 75/45, HR: 135, SpO2: 88%"
        );

        var created = emergencyService.createEmergencyRequest(intake, receptionist);
        assertNotNull(created);
        assertNotNull(created.id());
        assertNotNull(created.incidentNumber());
        assertTrue(created.incidentNumber().startsWith("INC-2026-"));
        assertTrue(created.isProvisional());
        assertEquals("RED", created.triageLevel());
        assertEquals(1, created.priorityScore());
        assertEquals("INCOMING", created.status());

        // 2. Fetch detail and check initial timeline
        var detail = emergencyService.getEmergencyDetail(created.id(), nurse);
        assertNotNull(detail);
        assertEquals(created.incidentNumber(), detail.incidentNumber());
        assertFalse(detail.timeline().isEmpty());
        // Code Red should have triggered CODE_RED_ESCALATION alert
        assertTrue(detail.timeline().stream().anyMatch(t -> "CODE_RED_ESCALATION".equals(t.eventType())));

        // 3. Assign Care Team and Bay (Advances status to TRIAGED)
        EmergencyDtos.IncidentAssignRequest assignReq = new EmergencyDtos.IncidentAssignRequest(
                "doc-1",
                "Dr. Priya Swaminathan",
                "user-n1",
                "Nurse Lakshmi",
                "Resuscitation Bay 1"
        );
        var assigned = emergencyService.assignCareTeamAndBay(created.id(), assignReq, receptionist);
        assertEquals("TRIAGED", assigned.status());
        assertEquals("Dr. Priya Swaminathan", assigned.assignedDoctorName());
        assertEquals("Nurse Lakshmi", assigned.assignedNurseName());
        assertEquals("Resuscitation Bay 1", assigned.assignedBay());
        assertTrue(assigned.timeline().stream().anyMatch(t -> "CARE_TEAM_ASSIGNED".equals(t.eventType())));

        // 4. Clinical Intervention (Advances status to STABILIZING, records vitals)
        EmergencyDtos.InterventionRequest interventionReq = new EmergencyDtos.InterventionRequest(
                "IV_RESUSCITATION",
                "Rapid infusion 1000ml Normal Saline, Tranexamic Acid 1g IV administered.",
                "BP: 95/60, HR: 110, SpO2: 95%"
        );
        var stabilized = emergencyService.recordIntervention(created.id(), interventionReq, nurse);
        assertEquals("STABILIZING", stabilized.status());
        assertEquals("BP: 95/60, HR: 110, SpO2: 95%", stabilized.vitalSigns());
        assertEquals(1, stabilized.interventions().size());
        assertEquals("IV_RESUSCITATION", stabilized.interventions().get(0).type());
        assertTrue(stabilized.timeline().stream().anyMatch(t -> "CLINICAL_INTERVENTION".equals(t.eventType())));

        // 5. Clinical Acuity Reassessment (YELLOW as vitals stabilized)
        EmergencyDtos.ReassessRequest reassessReq = new EmergencyDtos.ReassessRequest(
                "YELLOW",
                "Patient hemodynamically stabilized post fluid resuscitation and hemorrhage control.",
                "BP: 105/70, HR: 92, SpO2: 98%"
        );
        var reassessed = emergencyService.reassessAcuity(created.id(), reassessReq, doctor);
        assertEquals("YELLOW", reassessed.triageLevel());
        assertEquals(2, reassessed.priorityScore());
        assertEquals("BP: 105/70, HR: 92, SpO2: 98%", reassessed.vitalSigns());
        assertTrue(reassessed.timeline().stream().anyMatch(t -> "ACUITY_REASSESSED".equals(t.eventType())));

        // 6. Conclude Clinical Disposition (ADMITTED to ICU-2)
        EmergencyDtos.DispositionRequest dispositionReq = new EmergencyDtos.DispositionRequest(
                "ADMITTED",
                "Trauma Intensive Care Unit (TICU-3)",
                "Admitted for urgent exploratory laparotomy and continuous monitoring."
        );
        var concluded = emergencyService.concludeDisposition(created.id(), dispositionReq, doctor);
        assertEquals("ADMITTED", concluded.status());
        assertEquals("ADMITTED", concluded.disposition());
        assertEquals("Trauma Intensive Care Unit (TICU-3)", concluded.destinationWard());
        assertNotNull(concluded.closedAt());
        assertEquals("doctor@aarogya.org", concluded.closedBy());
        assertTrue(concluded.timeline().stream().anyMatch(t -> "DISPOSITION_CONCLUDED".equals(t.eventType())));
    }

    @Test
    @DisplayName("Verify patient role data isolation: patient cannot view another patient's incident")
    void testPatientDataIsolation() {
        UserPrincipal nurse = new UserPrincipal("user-n1", "nurse@aarogya.org", "pass", "nurse", "Trauma Nurse", true);
        UserPrincipal patient1 = new UserPrincipal("pat-1", "patient1@aarogya.org", "pass", "patient", "Patient One", true);
        UserPrincipal patient2 = new UserPrincipal("pat-2", "patient2@aarogya.org", "pass", "patient", "Patient Two", true);

        EmergencyDtos.EmergencyCreateRequest req = new EmergencyDtos.EmergencyCreateRequest(
                "Patient One",
                "pat-1",
                "+91 99999 11111",
                "YELLOW",
                "Acute abdominal pain",
                "BP: 120/80"
        );
        var incident = emergencyService.createEmergencyRequest(req, nurse);

        // Patient 1 (owner) can view their incident
        var patient1View = emergencyService.getEmergencyDetail(incident.id(), patient1);
        assertNotNull(patient1View);
        assertEquals("pat-1", patient1View.patientId());

        // Patient 2 (stranger) is blocked with ForbiddenException
        assertThrows(Exceptions.ForbiddenException.class, () -> {
            emergencyService.getEmergencyDetail(incident.id(), patient2);
        });
    }

    @Test
    @DisplayName("Verify surge statistics calculation reflects active and triage counts")
    void testSurgeStatisticsCalculation() {
        UserPrincipal nurse = new UserPrincipal("user-n1", "nurse@aarogya.org", "pass", "nurse", "Trauma Nurse", true);

        // Intake one red incident
        emergencyService.createEmergencyRequest(
                new EmergencyDtos.EmergencyCreateRequest("Stats Red", null, "123", "RED", "Chest pain", "BP: 80/50"),
                nurse
        );

        var stats = emergencyService.getEmergencySurgeStats();
        assertNotNull(stats);
        assertTrue(stats.activeIncidents() >= 1);
        assertTrue(stats.criticalRedCount() >= 1);
    }
}
