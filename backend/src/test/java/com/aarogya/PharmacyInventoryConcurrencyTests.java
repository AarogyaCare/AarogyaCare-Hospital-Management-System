package com.aarogya;

import com.aarogya.dto.PharmacyDtos;
import com.aarogya.exception.Exceptions;
import com.aarogya.model.MedicineDocument;
import com.aarogya.repository.MedicineRepository;
import com.aarogya.security.UserPrincipal;
import com.aarogya.service.PharmacyService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class PharmacyInventoryConcurrencyTests {

    @Autowired
    private PharmacyService pharmacyService;

    @Autowired
    private MedicineRepository medicineRepository;

    @Test
    @DisplayName("Concurrency Invariant: Atomic stock decrement prevents negative inventory under simultaneous requests")
    void testConcurrentInventoryDecrementNoNegativeStock() throws InterruptedException {
        // 1. Create dedicated medicine with exactly 10 units of stock
        String testMedId = "med-test-concurrency-" + System.currentTimeMillis();
        MedicineDocument med = new MedicineDocument(
            testMedId,
            "MED-TEST-" + System.currentTimeMillis(),
            "Concurrent Test Medicine",
            "TestBrand",
            "Analgesic",
            "TABLET",
            "500mg",
            50.0,
            10, // Stock: 10 units
            5
        );
        medicineRepository.save(med);

        // 2. Fire 10 concurrent threads each requesting 2 units (Total requested: 20 units, Stock: 10)
        int numThreads = 10;
        int qtyPerRequest = 2;
        ExecutorService executor = Executors.newFixedThreadPool(numThreads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch finishLatch = new CountDownLatch(numThreads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger conflictCount = new AtomicInteger(0);

        UserPrincipal pharmacist = new UserPrincipal(
            "user-pharmacist-test",
            "pharmacist.test@aarogya.org",
            "pass",
            "pharmacist",
            "Test Pharmacist",
            true
        );

        for (int i = 0; i < numThreads; i++) {
            final int idx = i;
            executor.submit(() -> {
                try {
                    startLatch.await(); // Simultaneous burst
                    PharmacyDtos.StockAdjustmentRequest req = new PharmacyDtos.StockAdjustmentRequest(
                        testMedId,
                        "DISPENSE",
                        qtyPerRequest,
                        "rx-ref-" + idx
                    );
                    pharmacyService.adjustStock(req, "dispense-key-" + testMedId + "-" + idx, pharmacist);
                    successCount.incrementAndGet();
                } catch (Exceptions.ConflictException ex) {
                    conflictCount.incrementAndGet();
                } catch (Exception ex) {
                    // unexpected error
                } finally {
                    finishLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        boolean completed = finishLatch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        assertTrue(completed, "All dispensing workers should complete within timeout.");
        assertEquals(5, successCount.get(), "Exactly 5 requests should succeed (5 * 2 = 10 units).");
        assertEquals(5, conflictCount.get(), "Remaining 5 requests must fail with ConflictException.");

        // 3. Invariant Verification: Stock must be EXACTLY 0 and never negative
        MedicineDocument updatedMed = medicineRepository.findById(testMedId).orElseThrow();
        assertEquals(0, updatedMed.getCurrentStock(), "Inventory stock must be exactly 0, never negative.");
    }

    @Test
    @DisplayName("Idempotency Invariant: Duplicate dispensing with same key returns cached transaction without double decrement")
    void testDispensingIdempotency() {
        String testMedId = "med-idempotent-" + System.currentTimeMillis();
        MedicineDocument med = new MedicineDocument(
            testMedId,
            "MED-IDEM-" + System.currentTimeMillis(),
            "Idempotency Test Medicine",
            "TestBrand",
            "Antibiotic",
            "CAPSULE",
            "250mg",
            40.0,
            20,
            5
        );
        medicineRepository.save(med);

        UserPrincipal pharmacist = new UserPrincipal(
            "user-pharmacist-test",
            "pharmacist.test@aarogya.org",
            "pass",
            "pharmacist",
            "Test Pharmacist",
            true
        );

        String idempotencyKey = "rx-dispense-" + UUID.randomUUID();
        PharmacyDtos.StockAdjustmentRequest req = new PharmacyDtos.StockAdjustmentRequest(
            testMedId,
            "DISPENSE",
            5,
            "rx-ref-1"
        );

        var firstResp = pharmacyService.adjustStock(req, idempotencyKey, pharmacist);
        assertNotNull(firstResp);
        assertEquals(15, firstResp.newStock());

        // Duplicate call with exact same idempotency key
        var secondResp = pharmacyService.adjustStock(req, idempotencyKey, pharmacist);
        assertNotNull(secondResp);
        assertEquals(firstResp.transactionId(), secondResp.transactionId());
        assertEquals(15, secondResp.newStock());

        // Stock must have decremented only ONCE (20 - 5 = 15)
        MedicineDocument finalMed = medicineRepository.findById(testMedId).orElseThrow();
        assertEquals(15, finalMed.getCurrentStock());
    }
}
