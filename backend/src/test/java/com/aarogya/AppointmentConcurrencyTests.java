package com.aarogya;

import com.aarogya.dto.AppointmentDtos;
import com.aarogya.exception.Exceptions;
import com.aarogya.model.DoctorSlotDocument;
import com.aarogya.repository.AppointmentRepository;
import com.aarogya.repository.DoctorSlotRepository;
import com.aarogya.security.UserPrincipal;
import com.aarogya.service.AppointmentService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class AppointmentConcurrencyTests {

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private DoctorSlotRepository slotRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    // ─── Helper ────────────────────────────────────────────────────────────────

    /** Creates and persists a fresh AVAILABLE slot with a unique ID. */
    private DoctorSlotDocument createSlot(String slotId, String doctorId, String slotStart) {
        DoctorSlotDocument slot = new DoctorSlotDocument(
            slotId, doctorId, slotStart, slotStart.replace("00 AM", "30 AM").replace("00 PM", "30 PM"),
            "AVAILABLE", "OPD-TEST"
        );
        return slotRepository.save(slot);
    }

    private UserPrincipal patient(String id, String name) {
        return new UserPrincipal(id, name.toLowerCase().replace(" ", "") + "@test.org",
                "pass", "patient", name, true);
    }

    private String tomorrow() {
        return LocalDate.now().plusDays(1).toString();
    }

    private String dayAfterTomorrow() {
        return LocalDate.now().plusDays(2).toString();
    }

    // ─── EXISTING TEST 1 (updated assertions for DEF-01) ───────────────────────

    @Test
    @DisplayName("DEF-01 Concurrency: 8 threads book 1 slot on the same date → exactly 1 wins, 7 conflict")
    void testConcurrentBookingsSingleSlotWinner() throws InterruptedException {
        // Provision isolated slot – unique IDs prevent interference with seeded data
        long ts = System.currentTimeMillis();
        String uniqueSlotId = "slot-concurrency-" + ts;
        String uniqueDoctorId = "doc-concurrency-" + ts;
        createSlot(uniqueSlotId, uniqueDoctorId, "11:00 AM");

        String bookingDate = tomorrow();
        int numContestants = 8;
        ExecutorService executor = Executors.newFixedThreadPool(numContestants);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch finishLatch = new CountDownLatch(numContestants);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger conflictCount = new AtomicInteger(0);
        List<AppointmentDtos.AppointmentResponse> winners = Collections.synchronizedList(new ArrayList<>());

        for (int i = 0; i < numContestants; i++) {
            final int idx = i;
            executor.submit(() -> {
                UserPrincipal p = patient("user-contestant-" + idx + "-" + ts, "Contestant " + idx);
                try {
                    startLatch.await();
                    AppointmentDtos.BookAppointmentRequest req =
                        new AppointmentDtos.BookAppointmentRequest(uniqueSlotId, "Concurrent booking test", "IN_PERSON", bookingDate);
                    var resp = appointmentService.bookAppointment(p, req, uniqueSlotId + "-key-" + idx);
                    successCount.incrementAndGet();
                    winners.add(resp);
                } catch (Exceptions.ConflictException ex) {
                    conflictCount.incrementAndGet();
                } catch (Exception ex) {
                    // unexpected – leave counters as-is so assertions catch the failure
                } finally {
                    finishLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        assertTrue(finishLatch.await(15, TimeUnit.SECONDS), "All booking workers must complete within timeout.");
        executor.shutdown();

        assertEquals(1, successCount.get(), "EXACTLY ONE contestant must win the exclusive slot/date reservation.");
        assertEquals(numContestants - 1, conflictCount.get(), "All other contestants must receive ConflictException (HTTP 409).");
        assertEquals(1, winners.size());

        // DEF-01 FIX: slot template status must remain AVAILABLE – it is never mutated for booking
        DoctorSlotDocument slotAfter = slotRepository.findById(uniqueSlotId).orElseThrow();
        assertEquals("AVAILABLE", slotAfter.getStatus(),
            "DEF-01: DoctorSlotDocument.status must stay AVAILABLE after booking; availability is tracked in the appointments collection.");
    }

    // ─── EXISTING TEST 2 (unchanged semantics) ─────────────────────────────────

    @Test
    @DisplayName("Idempotency Invariant: multiple retries with the same idempotency key return identical response")
    void testSimultaneousIdempotentRetries() {
        long ts = System.currentTimeMillis();
        String uniqueSlotId = "slot-idempotency-" + ts;
        createSlot(uniqueSlotId, "doc-idempotency-" + ts, "02:00 PM");

        UserPrincipal principal = patient("user-idempotent-" + ts, "Idempotent Patient");
        String idempotencyKey = "race-key-" + UUID.randomUUID();
        AppointmentDtos.BookAppointmentRequest req =
            new AppointmentDtos.BookAppointmentRequest(uniqueSlotId, "Idempotent visit", "IN_PERSON", tomorrow());

        var firstResp = appointmentService.bookAppointment(principal, req, idempotencyKey);
        assertNotNull(firstResp);

        var secondResp = appointmentService.bookAppointment(principal, req, idempotencyKey);
        assertNotNull(secondResp);
        assertEquals(firstResp.id(), secondResp.id(), "Idempotent retry must return the exact same appointment ID.");
        assertEquals(firstResp.appointmentNumber(), secondResp.appointmentNumber());
    }

    // ─── NEW REGRESSION TEST 1 ──────────────────────────────────────────────────

    @Test
    @DisplayName("DEF-01: Same slot booked on two DIFFERENT dates → both bookings succeed")
    void testSameSlotDifferentDatesAllSucceed() {
        long ts = System.currentTimeMillis();
        String uniqueSlotId = "slot-diff-dates-" + ts;
        createSlot(uniqueSlotId, "doc-diff-dates-" + ts, "09:00 AM");

        UserPrincipal patientA = patient("user-diff-a-" + ts, "Patient Alpha");
        UserPrincipal patientB = patient("user-diff-b-" + ts, "Patient Beta");

        AppointmentDtos.BookAppointmentRequest reqDay1 =
            new AppointmentDtos.BookAppointmentRequest(uniqueSlotId, "Day+1 visit", "IN_PERSON", tomorrow());
        AppointmentDtos.BookAppointmentRequest reqDay2 =
            new AppointmentDtos.BookAppointmentRequest(uniqueSlotId, "Day+2 visit", "IN_PERSON", dayAfterTomorrow());

        var resp1 = appointmentService.bookAppointment(patientA, reqDay1, null);
        var resp2 = appointmentService.bookAppointment(patientB, reqDay2, null);

        assertNotNull(resp1, "Booking on day+1 must succeed.");
        assertNotNull(resp2, "Booking on day+2 must succeed — different date, same slot template.");
        assertNotEquals(resp1.id(), resp2.id(), "Each booking must produce a distinct appointment document.");
        assertEquals(tomorrow(), resp1.appointmentDate());
        assertEquals(dayAfterTomorrow(), resp2.appointmentDate());

        // Slot template must remain AVAILABLE (untouched)
        DoctorSlotDocument slot = slotRepository.findById(uniqueSlotId).orElseThrow();
        assertEquals("AVAILABLE", slot.getStatus(),
            "Slot template must remain AVAILABLE after booking two different dates.");
    }

    // ─── NEW REGRESSION TEST 2 ──────────────────────────────────────────────────

    @Test
    @DisplayName("DEF-01 Date validation: past date is rejected with BadRequestException (HTTP 400)")
    void testPastDateRejectedWith400() {
        long ts = System.currentTimeMillis();
        String uniqueSlotId = "slot-past-" + ts;
        createSlot(uniqueSlotId, "doc-past-" + ts, "10:00 AM");

        UserPrincipal principal = patient("user-past-" + ts, "Past Tester");
        String yesterday = LocalDate.now().minusDays(1).toString();

        AppointmentDtos.BookAppointmentRequest req =
            new AppointmentDtos.BookAppointmentRequest(uniqueSlotId, "Past date test", "IN_PERSON", yesterday);

        Exceptions.BadRequestException ex = assertThrows(Exceptions.BadRequestException.class,
            () -> appointmentService.bookAppointment(principal, req, null),
            "A past appointment date must be rejected with BadRequestException.");
        assertTrue(ex.getMessage().toLowerCase().contains("past"),
            "Error message must mention 'past'. Actual: " + ex.getMessage());
    }

    // ─── NEW REGRESSION TEST 3 ──────────────────────────────────────────────────

    @Test
    @DisplayName("DEF-01 Date validation: malformed date string is rejected with BadRequestException (HTTP 400)")
    void testMalformedDateRejectedWith400() {
        long ts = System.currentTimeMillis();
        String uniqueSlotId = "slot-malformed-" + ts;
        createSlot(uniqueSlotId, "doc-malformed-" + ts, "01:00 PM");

        UserPrincipal principal = patient("user-malformed-" + ts, "Malform Tester");

        AppointmentDtos.BookAppointmentRequest req =
            new AppointmentDtos.BookAppointmentRequest(uniqueSlotId, "Malformed date test", "IN_PERSON", "not-a-date");

        Exceptions.BadRequestException ex = assertThrows(Exceptions.BadRequestException.class,
            () -> appointmentService.bookAppointment(principal, req, null),
            "A malformed appointment date must be rejected with BadRequestException.");
        assertTrue(ex.getMessage().toLowerCase().contains("invalid") || ex.getMessage().toLowerCase().contains("format"),
            "Error message must mention format issue. Actual: " + ex.getMessage());
    }

    // ─── NEW REGRESSION TEST 4 ──────────────────────────────────────────────────

    @Test
    @DisplayName("DEF-01 Date validation: null/missing appointment_date is rejected with BadRequestException (HTTP 400)")
    void testMissingDateRejectedWith400() {
        long ts = System.currentTimeMillis();
        String uniqueSlotId = "slot-nulldate-" + ts;
        createSlot(uniqueSlotId, "doc-nulldate-" + ts, "03:00 PM");

        UserPrincipal principal = patient("user-nulldate-" + ts, "Null Date Tester");

        // Use the 3-arg compact constructor which leaves appointmentDate as null
        AppointmentDtos.BookAppointmentRequest req =
            new AppointmentDtos.BookAppointmentRequest(uniqueSlotId, "Null date test", "IN_PERSON");

        Exceptions.BadRequestException ex = assertThrows(Exceptions.BadRequestException.class,
            () -> appointmentService.bookAppointment(principal, req, null),
            "A null appointment date must be rejected with BadRequestException.");
        assertTrue(ex.getMessage().toLowerCase().contains("required") || ex.getMessage().toLowerCase().contains("date"),
            "Error message must indicate the date is required. Actual: " + ex.getMessage());
    }

    // ─── NEW REGRESSION TEST 5 ──────────────────────────────────────────────────

    @Test
    @DisplayName("DEF-01 Cancellation: cancel + rebook same slot/date succeeds; slot template status is never mutated")
    void testCancelAndRebookSameSlotAndDate() {
        long ts = System.currentTimeMillis();
        String uniqueSlotId = "slot-cancelrebook-" + ts;
        createSlot(uniqueSlotId, "doc-cancelrebook-" + ts, "04:00 PM");

        String bookingDate = tomorrow();
        UserPrincipal original = patient("user-original-" + ts, "Original Patient");
        UserPrincipal rebooker = patient("user-rebooker-" + ts, "Rebooker Patient");

        // Step 1: initial booking succeeds
        AppointmentDtos.BookAppointmentRequest req =
            new AppointmentDtos.BookAppointmentRequest(uniqueSlotId, "Initial booking", "IN_PERSON", bookingDate);
        var firstBooking = appointmentService.bookAppointment(original, req, null);
        assertNotNull(firstBooking, "Initial booking must succeed.");

        // Step 2: second booking for same slot/date must conflict
        assertThrows(Exceptions.ConflictException.class,
            () -> appointmentService.bookAppointment(rebooker, req, null),
            "Booking the same slot/date while it is CONFIRMED must conflict.");

        // Step 3: cancel the original
        appointmentService.cancelAppointment(firstBooking.id(), original);

        // Step 4: slot template must still be AVAILABLE (not mutated by cancel)
        DoctorSlotDocument slotAfterCancel = slotRepository.findById(uniqueSlotId).orElseThrow();
        assertEquals("AVAILABLE", slotAfterCancel.getStatus(),
            "DEF-01: cancellation must NOT reset slot template status — it was never changed.");

        // Step 5: rebook same slot/date now succeeds (CANCELLED appointment does not block)
        var rebooking = appointmentService.bookAppointment(rebooker, req, null);
        assertNotNull(rebooking, "Rebooking the same slot/date after cancellation must succeed.");
        assertNotEquals(firstBooking.id(), rebooking.id(),
            "Rebooked appointment must be a new document.");
        assertEquals(bookingDate, rebooking.appointmentDate());
    }

    // ─── NEW REGRESSION TEST 6 ──────────────────────────────────────────────────

    @Test
    @DisplayName("DEF-01: Booking a BLOCKED slot is rejected with ConflictException")
    void testBlockedSlotCannotBeBooked() {
        long ts = System.currentTimeMillis();
        String uniqueSlotId = "slot-blocked-" + ts;
        DoctorSlotDocument blocked = new DoctorSlotDocument(
            uniqueSlotId, "doc-blocked-" + ts, "05:00 PM", "05:30 PM", "BLOCKED", "OPD-BLOCK"
        );
        slotRepository.save(blocked);

        UserPrincipal principal = patient("user-blocked-" + ts, "Blocked Tester");
        AppointmentDtos.BookAppointmentRequest req =
            new AppointmentDtos.BookAppointmentRequest(uniqueSlotId, "Blocked slot test", "IN_PERSON", tomorrow());

        assertThrows(Exceptions.ConflictException.class,
            () -> appointmentService.bookAppointment(principal, req, null),
            "Booking a BLOCKED slot must be rejected with ConflictException.");
    }

    // ─── NEW REGRESSION TEST 7 ──────────────────────────────────────────────────

    @Test
    @DisplayName("DEF-01: Completed appointment prevents duplicate booking for the same slot and date")
    void testCompletedAppointmentPreventsDuplicateBooking() {
        long ts = System.currentTimeMillis();
        String uniqueSlotId = "slot-completed-" + ts;
        String uniqueDoctorId = "doc-completed-" + ts;
        createSlot(uniqueSlotId, uniqueDoctorId, "06:00 PM");

        String bookingDate = tomorrow();
        UserPrincipal patient1 = patient("user-comp-1-" + ts, "Patient One");
        UserPrincipal patient2 = patient("user-comp-2-" + ts, "Patient Two");
        UserPrincipal doctorPrincipal = new UserPrincipal("user-doc-" + ts, "doc" + ts + "@test.org", "pass", "doctor", "Dr. Specialist", true);

        AppointmentDtos.BookAppointmentRequest req =
            new AppointmentDtos.BookAppointmentRequest(uniqueSlotId, "Consultation", "IN_PERSON", bookingDate);
        var booking = appointmentService.bookAppointment(patient1, req, null);
        assertNotNull(booking);

        // Mark appointment as COMPLETED
        appointmentService.updateAppointmentStatus(booking.id(), "COMPLETED", doctorPrincipal);

        // Attempting to book the same slot and date must fail with ConflictException
        Exceptions.ConflictException ex = assertThrows(Exceptions.ConflictException.class,
            () -> appointmentService.bookAppointment(patient2, req, null),
            "Completed appointment must prevent re-booking the same slot and date.");
        assertNotNull(ex.getMessage());
    }
}
