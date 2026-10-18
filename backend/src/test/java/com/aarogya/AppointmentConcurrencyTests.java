package com.aarogya;

import com.aarogya.dto.AppointmentDtos;
import com.aarogya.exception.Exceptions;
import com.aarogya.model.DoctorSlotDocument;
import com.aarogya.repository.DoctorSlotRepository;
import com.aarogya.security.UserPrincipal;
import com.aarogya.service.AppointmentService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

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

    @Test
    @DisplayName("Concurrency Invariant: 8 concurrent contestants booking 1 exclusive slot results in exactly 1 winner and 7 conflicts")
    void testConcurrentBookingsSingleSlotWinner() throws InterruptedException {
        // 1. Provision a dedicated isolated slot for this test
        String uniqueSlotId = "slot-concurrency-" + System.currentTimeMillis();
        DoctorSlotDocument slot = new DoctorSlotDocument(
            uniqueSlotId,
            "doc-concurrency-" + System.currentTimeMillis(),
            "11:00 AM",
            "11:30 AM",
            "AVAILABLE",
            "OPD-102"
        );
        slotRepository.save(slot);

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
                UserPrincipal contestantPrincipal = new UserPrincipal(
                    "user-contestant-" + idx,
                    "contestant" + idx + "@test.org",
                    "pass",
                    "patient",
                    "Contestant " + idx,
                    true
                );

                try {
                    startLatch.await(); // Synchronize all threads to fire simultaneously
                    AppointmentDtos.BookAppointmentRequest req = new AppointmentDtos.BookAppointmentRequest(
                        uniqueSlotId,
                        "Concurrent booking test",
                        "IN_PERSON"
                    );
                    var resp = appointmentService.bookAppointment(contestantPrincipal, req, uniqueSlotId + "-key-" + idx);
                    successCount.incrementAndGet();
                    winners.add(resp);
                } catch (Exceptions.ConflictException ex) {
                    conflictCount.incrementAndGet();
                } catch (Exception ex) {
                    // unexpected error
                } finally {
                    finishLatch.countDown();
                }
            });
        }

        // Fire all threads simultaneously
        startLatch.countDown();
        boolean completed = finishLatch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        assertTrue(completed, "All concurrent booking workers should complete within timeout.");
        assertEquals(1, successCount.get(), "EXACTLY ONE contestant must win the exclusive slot reservation.");
        assertEquals(numContestants - 1, conflictCount.get(), "All other contestants must receive ConflictException (HTTP 409).");
        assertEquals(1, winners.size());

        // Verify slot status in database is BOOKED
        DoctorSlotDocument updatedSlot = slotRepository.findById(uniqueSlotId).orElseThrow();
        assertEquals("BOOKED", updatedSlot.getStatus());

        // 2. Cancellation and Re-availability Invariant
        var winnerApt = winners.get(0);
        UserPrincipal winnerPrincipal = new UserPrincipal(
            winnerApt.patientId(),
            "winner@test.org",
            "pass",
            "patient",
            "Winner",
            true
        );
        appointmentService.cancelAppointment(winnerApt.id(), winnerPrincipal);

        DoctorSlotDocument releasedSlot = slotRepository.findById(uniqueSlotId).orElseThrow();
        assertEquals("AVAILABLE", releasedSlot.getStatus(), "Cancelled appointment must release slot status back to AVAILABLE.");
    }

    @Test
    @DisplayName("Idempotency Invariant: Multiple retries with the same idempotency key return identical response")
    void testSimultaneousIdempotentRetries() {
        String uniqueSlotId = "slot-idempotency-" + System.currentTimeMillis();
        DoctorSlotDocument slot = new DoctorSlotDocument(
            uniqueSlotId,
            "doc-idempotency-" + System.currentTimeMillis(),
            "02:00 PM",
            "02:30 PM",
            "AVAILABLE",
            "OPD-204"
        );
        slotRepository.save(slot);

        UserPrincipal principal = new UserPrincipal(
            "user-idempotent-patient",
            "idempotent@test.org",
            "pass",
            "patient",
            "Idempotent Patient",
            true
        );

        String idempotencyKey = "race-key-" + UUID.randomUUID();
        AppointmentDtos.BookAppointmentRequest req = new AppointmentDtos.BookAppointmentRequest(
            uniqueSlotId,
            "Idempotent visit",
            "IN_PERSON"
        );

        var firstResp = appointmentService.bookAppointment(principal, req, idempotencyKey);
        assertNotNull(firstResp);

        // Immediate retry with exact same idempotency key
        var secondResp = appointmentService.bookAppointment(principal, req, idempotencyKey);
        assertNotNull(secondResp);
        assertEquals(firstResp.id(), secondResp.id(), "Idempotent retry must return the exact same appointment ID.");
        assertEquals(firstResp.appointmentNumber(), secondResp.appointmentNumber());
    }
}
