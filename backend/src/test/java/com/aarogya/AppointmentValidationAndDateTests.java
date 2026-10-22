package com.aarogya;

import com.aarogya.dto.AppointmentDtos;
import com.aarogya.exception.Exceptions;
import com.aarogya.model.DoctorSlotDocument;
import com.aarogya.repository.AppointmentRepository;
import com.aarogya.repository.DoctorSlotRepository;
import com.aarogya.security.UserPrincipal;
import com.aarogya.service.AppointmentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class AppointmentValidationAndDateTests {

    @Autowired
    private DoctorSlotRepository slotRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private org.springframework.data.mongodb.core.MongoTemplate mongoTemplate;

    @Autowired
    private com.aarogya.repository.DoctorRepository doctorRepository;

    @Autowired
    private com.aarogya.repository.DepartmentRepository departmentRepository;

    @Autowired
    private com.aarogya.repository.PatientRepository patientRepository;

    @Autowired
    private com.aarogya.repository.UserRepository userRepository;

    @Autowired
    private com.aarogya.repository.IdempotencyRecordRepository idempotencyRepository;

    @Autowired
    private com.aarogya.systemdesign.id.UniqueIdGeneratorService idGenerator;

    @Autowired
    private com.aarogya.service.AuditService auditService;

    private static final ZoneId HOSPITAL_ZONE = ZoneId.of("Asia/Kolkata");

    // Controllable fixed clock set to 2026-10-22 14:00 (02:00 PM) in Asia/Kolkata
    private Clock fixedClock;
    private AppointmentService appointmentServiceWithFixedClock;

    @BeforeEach
    void setUp() {
        LocalDateTime fixedLdt = LocalDateTime.of(2026, 10, 22, 14, 0);
        Instant fixedInstant = fixedLdt.atZone(HOSPITAL_ZONE).toInstant();
        fixedClock = Clock.fixed(fixedInstant, HOSPITAL_ZONE);

        appointmentServiceWithFixedClock = new AppointmentService(
                appointmentRepository,
                slotRepository,
                doctorRepository,
                departmentRepository,
                patientRepository,
                userRepository,
                idempotencyRepository,
                mongoTemplate,
                idGenerator,
                auditService,
                fixedClock,
                HOSPITAL_ZONE
        );
    }

    private DoctorSlotDocument createSlot(String slotId, String doctorId, String slotStart, String slotEnd) {
        DoctorSlotDocument slot = new DoctorSlotDocument(
                slotId, doctorId, slotStart, slotEnd, "AVAILABLE", "OPD-TEST"
        );
        return slotRepository.save(slot);
    }

    private UserPrincipal patient(String id, String name) {
        return new UserPrincipal(id, name.toLowerCase().replace(" ", "") + "@test.org",
                "pass", "patient", name, true);
    }

    @Test
    @DisplayName("Rule 1: Past date is rejected with BadRequestException (HTTP 400)")
    void testPastDateRejectedWith400() {
        String ts = UUID.randomUUID().toString().substring(0, 8);
        String slotId = "slot-past-" + ts;
        createSlot(slotId, "doc-past-" + ts, "03:00 PM", "03:30 PM");

        UserPrincipal principal = patient("user-past-" + ts, "Past User");
        AppointmentDtos.BookAppointmentRequest req =
                new AppointmentDtos.BookAppointmentRequest(slotId, "Routine checkup", "IN_PERSON", "2026-10-21");

        Exceptions.BadRequestException ex = assertThrows(Exceptions.BadRequestException.class,
                () -> appointmentServiceWithFixedClock.bookAppointment(principal, req, null));
        assertTrue(ex.getMessage().toLowerCase().contains("past"),
                "Message must mention past. Actual: " + ex.getMessage());
    }

    @Test
    @DisplayName("Rule 2 & 3: Today with a past time (10:00 AM at 14:00) is rejected with HTTP 400")
    void testTodayWithPastTimeRejectedWith400() {
        String ts = UUID.randomUUID().toString().substring(0, 8);
        String slotId = "slot-today-past-" + ts;
        createSlot(slotId, "doc-today-past-" + ts, "10:00 AM", "10:30 AM");

        UserPrincipal principal = patient("user-today-past-" + ts, "Past Time User");
        AppointmentDtos.BookAppointmentRequest req =
                new AppointmentDtos.BookAppointmentRequest(slotId, "Routine checkup", "IN_PERSON", "2026-10-22");

        Exceptions.BadRequestException ex = assertThrows(Exceptions.BadRequestException.class,
                () -> appointmentServiceWithFixedClock.bookAppointment(principal, req, null));
        assertTrue(ex.getMessage().toLowerCase().contains("passed"),
                "Message must indicate time has passed. Actual: " + ex.getMessage());
    }

    @Test
    @DisplayName("Rule 2: Today with a future time (03:00 PM at 14:00) succeeds")
    void testTodayWithFutureTimeSucceeds() {
        String ts = UUID.randomUUID().toString().substring(0, 8);
        String slotId = "slot-today-future-" + ts;
        createSlot(slotId, "doc-today-future-" + ts, "03:00 PM", "03:30 PM");

        UserPrincipal principal = patient("user-today-future-" + ts, "Future Time User");
        AppointmentDtos.BookAppointmentRequest req =
                new AppointmentDtos.BookAppointmentRequest(slotId, "Routine checkup", "IN_PERSON", "2026-10-22");

        var response = appointmentServiceWithFixedClock.bookAppointment(principal, req, null);
        assertNotNull(response);
        assertEquals("CONFIRMED", response.status());
        assertEquals("2026-10-22", response.appointmentDate());
    }

    @Test
    @DisplayName("Rule 4: Future date with morning time succeeds even if that time would be past today")
    void testFutureDateWithSameTimeOfDaySucceeds() {
        String ts = UUID.randomUUID().toString().substring(0, 8);
        String slotId = "slot-fut-date-" + ts;
        createSlot(slotId, "doc-fut-date-" + ts, "09:00 AM", "09:30 AM");

        UserPrincipal principal = patient("user-fut-date-" + ts, "Future Date User");
        AppointmentDtos.BookAppointmentRequest req =
                new AppointmentDtos.BookAppointmentRequest(slotId, "Routine checkup", "IN_PERSON", "2026-10-23");

        var response = appointmentServiceWithFixedClock.bookAppointment(principal, req, null);
        assertNotNull(response);
        assertEquals("CONFIRMED", response.status());
        assertEquals("2026-10-23", response.appointmentDate());
    }

    @Test
    @DisplayName("Rule 5: The same doctor can be booked at two DIFFERENT time slots on the SAME date")
    void testTwoDifferentSlotsOnSameDateSucceed() {
        String ts = UUID.randomUUID().toString().substring(0, 8);
        String doctorId = "doc-same-day-" + ts;
        String slot1 = "slot-1-" + ts;
        String slot2 = "slot-2-" + ts;
        createSlot(slot1, doctorId, "02:30 PM", "03:00 PM");
        createSlot(slot2, doctorId, "03:00 PM", "03:30 PM");

        UserPrincipal patient1 = patient("user-p1-" + ts, "Patient One");
        UserPrincipal patient2 = patient("user-p2-" + ts, "Patient Two");

        var resp1 = appointmentServiceWithFixedClock.bookAppointment(
                patient1, new AppointmentDtos.BookAppointmentRequest(slot1, "Visit 1", "IN_PERSON", "2026-10-22"), null);
        var resp2 = appointmentServiceWithFixedClock.bookAppointment(
                patient2, new AppointmentDtos.BookAppointmentRequest(slot2, "Visit 2", "IN_PERSON", "2026-10-22"), null);

        assertNotNull(resp1);
        assertNotNull(resp2);
        assertNotEquals(resp1.id(), resp2.id());
        assertEquals("2026-10-22", resp1.appointmentDate());
        assertEquals("2026-10-22", resp2.appointmentDate());
    }

    @Test
    @DisplayName("Rule 6: The same doctor can be booked at the SAME time slot on DIFFERENT dates")
    void testSameSlotOnTwoDifferentDatesSucceed() {
        String ts = UUID.randomUUID().toString().substring(0, 8);
        String doctorId = "doc-diff-dates-" + ts;
        String slotId = "slot-shared-" + ts;
        createSlot(slotId, doctorId, "10:00 AM", "10:30 AM");

        UserPrincipal patient1 = patient("user-d1-" + ts, "Patient D1");
        UserPrincipal patient2 = patient("user-d2-" + ts, "Patient D2");

        var resp1 = appointmentServiceWithFixedClock.bookAppointment(
                patient1, new AppointmentDtos.BookAppointmentRequest(slotId, "Visit Day 1", "IN_PERSON", "2026-10-23"), null);
        var resp2 = appointmentServiceWithFixedClock.bookAppointment(
                patient2, new AppointmentDtos.BookAppointmentRequest(slotId, "Visit Day 2", "IN_PERSON", "2026-10-24"), null);

        assertNotNull(resp1);
        assertNotNull(resp2);
        assertEquals("2026-10-23", resp1.appointmentDate());
        assertEquals("2026-10-24", resp2.appointmentDate());
    }

    @Test
    @DisplayName("Rule 7: The same doctor cannot be booked twice for the same date and slot (ConflictException HTTP 409)")
    void testSameDoctorAndSameSlotRequestedTwiceFailsWith409() {
        String ts = UUID.randomUUID().toString().substring(0, 8);
        String slotId = "slot-dup-" + ts;
        createSlot(slotId, "doc-dup-" + ts, "11:00 AM", "11:30 AM");

        UserPrincipal p1 = patient("user-dup-1-" + ts, "Patient Dup 1");
        UserPrincipal p2 = patient("user-dup-2-" + ts, "Patient Dup 2");

        AppointmentDtos.BookAppointmentRequest req =
                new AppointmentDtos.BookAppointmentRequest(slotId, "Dup visit", "IN_PERSON", "2026-10-25");

        var resp = appointmentServiceWithFixedClock.bookAppointment(p1, req, null);
        assertNotNull(resp);

        Exceptions.ConflictException ex = assertThrows(Exceptions.ConflictException.class,
                () -> appointmentServiceWithFixedClock.bookAppointment(p2, req, null));
        assertTrue(ex.getMessage().toLowerCase().contains("already booked"),
                "Message must indicate slot is already booked. Actual: " + ex.getMessage());
    }

    @Test
    @DisplayName("Rule 8: Appointments for different doctors at the exact same date and time do not conflict")
    void testDifferentDoctorsSameDateTimeSucceed() {
        String ts = UUID.randomUUID().toString().substring(0, 8);
        String slotDocA = "slot-doc-a-" + ts;
        String slotDocB = "slot-doc-b-" + ts;
        createSlot(slotDocA, "doc-a-" + ts, "02:30 PM", "03:00 PM");
        createSlot(slotDocB, "doc-b-" + ts, "02:30 PM", "03:00 PM");

        UserPrincipal p1 = patient("user-diff-doc-1-" + ts, "Patient 1");
        UserPrincipal p2 = patient("user-diff-doc-2-" + ts, "Patient 2");

        var respA = appointmentServiceWithFixedClock.bookAppointment(
                p1, new AppointmentDtos.BookAppointmentRequest(slotDocA, "Cardio check", "IN_PERSON", "2026-10-25"), null);
        var respB = appointmentServiceWithFixedClock.bookAppointment(
                p2, new AppointmentDtos.BookAppointmentRequest(slotDocB, "Neuro check", "IN_PERSON", "2026-10-25"), null);

        assertNotNull(respA);
        assertNotNull(respB);
        assertEquals("2026-10-25", respA.appointmentDate());
        assertEquals("2026-10-25", respB.appointmentDate());
    }

    @Test
    @DisplayName("Rule Concurrency: 2 concurrent requests for the exact same slot & date → 1 wins, 1 conflicts")
    void testTwoConcurrentRequestsForSameSlot() throws InterruptedException {
        String ts = UUID.randomUUID().toString().substring(0, 8);
        String slotId = "slot-conc-" + ts;
        createSlot(slotId, "doc-conc-" + ts, "03:00 PM", "03:30 PM");

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(2);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger conflictCount = new AtomicInteger(0);

        for (int i = 0; i < 2; i++) {
            final int idx = i;
            executor.submit(() -> {
                UserPrincipal p = patient("user-c-" + idx + "-" + ts, "Contestant " + idx);
                try {
                    startLatch.await();
                    appointmentServiceWithFixedClock.bookAppointment(
                            p,
                            new AppointmentDtos.BookAppointmentRequest(slotId, "Race", "IN_PERSON", "2026-10-26"),
                            null
                    );
                    successCount.incrementAndGet();
                } catch (Exceptions.ConflictException ex) {
                    conflictCount.incrementAndGet();
                } catch (Exception ignored) {
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        assertTrue(doneLatch.await(5, TimeUnit.SECONDS));
        executor.shutdown();

        assertEquals(1, successCount.get(), "Exactly one concurrent booking request must succeed.");
        assertEquals(1, conflictCount.get(), "The second concurrent booking request must receive ConflictException (409).");
    }

    @Test
    @DisplayName("Timezone boundary: Clock in Asia/Kolkata evaluates date transition correctly")
    void testConfiguredTimezoneBoundary() {
        // 2026-10-22 18:35:00 UTC corresponds to 2026-10-23 00:05:00 in Asia/Kolkata (+05:30)
        Instant midnightBoundary = Instant.parse("2026-10-22T18:35:00Z");
        Clock boundaryClock = Clock.fixed(midnightBoundary, HOSPITAL_ZONE);

        AppointmentService serviceAtMidnight = new AppointmentService(
                appointmentRepository,
                slotRepository,
                doctorRepository,
                departmentRepository,
                patientRepository,
                userRepository,
                idempotencyRepository,
                mongoTemplate,
                idGenerator,
                auditService,
                boundaryClock,
                HOSPITAL_ZONE
        );

        String ts = UUID.randomUUID().toString().substring(0, 8);
        String slotId = "slot-tz-" + ts;
        createSlot(slotId, "doc-tz-" + ts, "09:00 AM", "09:30 AM");

        UserPrincipal principal = patient("user-tz-" + ts, "TZ User");

        // 2026-10-22 is now in the past in Asia/Kolkata (where it is already 2026-10-23)
        Exceptions.BadRequestException ex = assertThrows(Exceptions.BadRequestException.class, () ->
                serviceAtMidnight.bookAppointment(
                        principal,
                        new AppointmentDtos.BookAppointmentRequest(slotId, "TZ test", "IN_PERSON", "2026-10-22"),
                        null
                )
        );
        assertTrue(ex.getMessage().toLowerCase().contains("past"));

        // 2026-10-23 morning (09:00 AM) is valid future slot on current hospital day
        var response = serviceAtMidnight.bookAppointment(
                principal,
                new AppointmentDtos.BookAppointmentRequest(slotId, "TZ test", "IN_PERSON", "2026-10-23"),
                null
        );
        assertNotNull(response);
        assertEquals("2026-10-23", response.appointmentDate());
    }
}
