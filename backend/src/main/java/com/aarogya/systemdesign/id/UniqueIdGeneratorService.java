package com.aarogya.systemdesign.id;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

/**
 * 64-bit Monotonic Snowflake Identifier Generator.
 *
 * Bit Layout:
 * - 1 sign bit (always 0)
 * - 41 bits timestamp delta from custom epoch (milliseconds, ~69.7 years capacity)
 * - 5 bits worker node identifier (0 to 31 nodes)
 * - 12 bits sequence counter (0 to 4095 IDs per millisecond = 4,096,000 IDs/sec/worker)
 *
 * Epoch: 2026-01-01T00:00:00Z (1767225600000 ms)
 */
@Service
public class UniqueIdGeneratorService {

    public static final long CUSTOM_EPOCH = 1767225600000L;
    public static final long WORKER_ID_BITS = 5L;
    public static final long SEQUENCE_BITS = 12L;
    public static final long MAX_WORKER_ID = ~(-1L << WORKER_ID_BITS); // 31
    public static final long MAX_SEQUENCE = ~(-1L << SEQUENCE_BITS);   // 4095

    private static final long WORKER_ID_SHIFT = SEQUENCE_BITS;
    private static final long TIMESTAMP_LEFT_SHIFT = SEQUENCE_BITS + WORKER_ID_BITS;

    private final long workerId;
    private final AtomicLong sequence = new AtomicLong(0L);
    private final AtomicLong lastTimestamp = new AtomicLong(-1L);

    public UniqueIdGeneratorService(@Value("${aarogya.snowflake.worker-id:1}") long workerId) {
        if (workerId < 0 || workerId > MAX_WORKER_ID) {
            throw new IllegalArgumentException(String.format("Worker ID must be between 0 and %d (inclusive), received: %d", MAX_WORKER_ID, workerId));
        }
        this.workerId = workerId;
    }

    /**
     * Generates a 64-bit monotonically increasing Snowflake identifier.
     */
    public synchronized long nextSnowflakeId() {
        long currentTimestamp = timeGen();
        long last = lastTimestamp.get();

        if (currentTimestamp < last) {
            long offset = last - currentTimestamp;
            if (offset <= 5) {
                // Small backward clock drift: wait until clock catches up
                currentTimestamp = tilNextMillis(last);
            } else {
                throw new IllegalStateException(String.format("System clock moved backwards by %d ms. Refusing to generate ID to avoid collisions.", offset));
            }
        }

        if (currentTimestamp == last) {
            long seq = sequence.incrementAndGet() & MAX_SEQUENCE;
            if (seq == 0) {
                // Sequence overflow in the current millisecond: wait for next millisecond
                currentTimestamp = tilNextMillis(last);
                sequence.set(0L);
            }
        } else {
            sequence.set(0L);
        }

        lastTimestamp.set(currentTimestamp);

        return ((currentTimestamp - CUSTOM_EPOCH) << TIMESTAMP_LEFT_SHIFT)
                | (workerId << WORKER_ID_SHIFT)
                | sequence.get();
    }

    /**
     * Generates a prefixed readable identifier, e.g. for patient UHID, prescriptions, invoices.
     */
    public String nextPrefixedId(String prefix) {
        String cleanPrefix = prefix != null ? prefix.toUpperCase() : "AC";
        return String.format("%s-%d-%s", cleanPrefix, Instant.now().getEpochSecond(), UUID.randomUUID().toString().substring(0, 8).toUpperCase());
    }

    /**
     * Generates standard RFC 4122 v4 UUID string.
     */
    public String nextUuid() {
        return UUID.randomUUID().toString();
    }

    public long getWorkerId() {
        return workerId;
    }

    public long getCustomEpoch() {
        return CUSTOM_EPOCH;
    }

    /**
     * Executes high-throughput benchmark measuring latency, throughput, and zero-collision invariant.
     */
    public Map<String, Object> benchmark(int sampleSize) {
        int count = Math.max(100, Math.min(sampleSize, 100000));
        Set<Long> uniqueSet = new HashSet<>(count);
        List<Long> sampleIds = new ArrayList<>(10);

        long startTime = System.nanoTime();
        for (int i = 0; i < count; i++) {
            long snowflake = nextSnowflakeId();
            uniqueSet.add(snowflake);
            if (i < 10) {
                sampleIds.add(snowflake);
            }
        }
        long elapsedNanos = System.nanoTime() - startTime;
        double elapsedMs = elapsedNanos / 1_000_000.0;
        double idsPerSecond = (count / (double) elapsedNanos) * 1_000_000_000.0;
        int collisions = count - uniqueSet.size();

        Map<String, Object> results = new HashMap<>();
        results.put("sample_size", count);
        results.put("elapsed_ms", Math.round(elapsedMs * 100.0) / 100.0);
        results.put("ids_per_second", Math.round(idsPerSecond));
        results.put("collisions_detected", collisions);
        results.put("worker_id", workerId);
        results.put("epoch_timestamp", CUSTOM_EPOCH);
        results.put("sample_ids", sampleIds);
        results.put("status", collisions == 0 ? "PASSED (0 Collisions)" : "FAILED");
        return results;
    }

    private long tilNextMillis(long lastTimestamp) {
        long timestamp = timeGen();
        while (timestamp <= lastTimestamp) {
            timestamp = timeGen();
        }
        return timestamp;
    }

    private long timeGen() {
        return System.currentTimeMillis();
    }
}
