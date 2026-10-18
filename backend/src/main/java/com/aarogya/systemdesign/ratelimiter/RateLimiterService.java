package com.aarogya.systemdesign.ratelimiter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Distributed Token Bucket Rate Limiter with atomic Redis Lua script execution
 * and graceful fallback to bounded local in-memory token buckets.
 */
@Service
public class RateLimiterService {

    private static final Logger logger = LoggerFactory.getLogger(RateLimiterService.class);

    private final StringRedisTemplate redisTemplate;
    private final RedisScript<List> tokenBucketScript;

    private final ConcurrentHashMap<String, LocalTokenBucket> localBuckets = new ConcurrentHashMap<>();
    private final AtomicLong allowedRequests = new AtomicLong(0L);
    private final AtomicLong totalRejections = new AtomicLong(0L);
    private final AtomicLong redisFailures = new AtomicLong(0L);
    private final AtomicLong fallbackEvents = new AtomicLong(0L);

    public record RateLimitResult(boolean allowed, long retryAfterSeconds, double remainingTokens) {}

    private static final String LUA_TOKEN_BUCKET =
            "local key = KEYS[1]\n" +
            "local capacity = tonumber(ARGV[1])\n" +
            "local refill_rate = tonumber(ARGV[2])\n" +
            "local now = tonumber(ARGV[3])\n" +
            "local requested = tonumber(ARGV[4]) or 1.0\n" +
            "\n" +
            "local data = redis.call('HMGET', key, 'tokens', 'last_refill')\n" +
            "local tokens = tonumber(data[1])\n" +
            "local last_refill = tonumber(data[2])\n" +
            "\n" +
            "if not tokens or not last_refill then\n" +
            "    tokens = capacity\n" +
            "    last_refill = now\n" +
            "else\n" +
            "    local elapsed = math.max(0, (now - last_refill) / 1000.0)\n" +
            "    tokens = math.min(capacity, tokens + (elapsed * refill_rate))\n" +
            "    last_refill = now\n" +
            "end\n" +
            "\n" +
            "local allowed = 0\n" +
            "local retry_after = 0\n" +
            "\n" +
            "if tokens >= requested then\n" +
            "    allowed = 1\n" +
            "    tokens = tokens - requested\n" +
            "else\n" +
            "    allowed = 0\n" +
            "    local missing = requested - tokens\n" +
            "    retry_after = math.ceil(missing / refill_rate)\n" +
            "    if retry_after < 1 then retry_after = 1 end\n" +
            "end\n" +
            "\n" +
            "redis.call('HMSET', key, 'tokens', tostring(tokens), 'last_refill', tostring(last_refill))\n" +
            "redis.call('EXPIRE', key, 3600)\n" +
            "\n" +
            "return { allowed, retry_after, tostring(tokens) }";

    public RateLimiterService(@Autowired(required = false) StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
        DefaultRedisScript<List> script = new DefaultRedisScript<>();
        script.setScriptText(LUA_TOKEN_BUCKET);
        script.setResultType(List.class);
        this.tokenBucketScript = script;
    }

    public RateLimitResult tryAcquire(String clientKey, String tier) {
        int capacity;
        double refillRate; // tokens per second

        switch (tier.toLowerCase()) {
            case "auth" -> {
                capacity = 20;
                refillRate = 2.0;
            }
            case "emergency" -> {
                // Priority emergency intake policy: high capacity, rapid refill, never starved
                capacity = 500;
                refillRate = 50.0;
            }
            case "search", "autocomplete" -> {
                capacity = 60;
                refillRate = 15.0;
            }
            default -> {
                capacity = 100;
                refillRate = 10.0;
            }
        }

        String safeClient = sanitizeKey(clientKey);
        String redisKey = "rl:" + tier.toLowerCase() + ":" + safeClient;

        // 1. Try atomic Redis token bucket
        if (redisTemplate != null) {
            try {
                List<?> result = redisTemplate.execute(
                        tokenBucketScript,
                        Collections.singletonList(redisKey),
                        String.valueOf(capacity),
                        String.valueOf(refillRate),
                        String.valueOf(System.currentTimeMillis()),
                        "1.0"
                );

                if (result != null && result.size() >= 3) {
                    long allowed = ((Number) result.get(0)).longValue();
                    long retryAfter = ((Number) result.get(1)).longValue();
                    double remaining = Double.parseDouble(result.get(2).toString());

                    if (allowed == 1) {
                        allowedRequests.incrementAndGet();
                        return new RateLimitResult(true, 0, remaining);
                    } else {
                        totalRejections.incrementAndGet();
                        return new RateLimitResult(false, Math.max(1, retryAfter), remaining);
                    }
                }
            } catch (Exception ex) {
                redisFailures.incrementAndGet();
                fallbackEvents.incrementAndGet();
                logger.warn("Redis rate limiter execution failed for key: {}. Falling back to memory: {}", redisKey, ex.getMessage());
            }
        } else {
            fallbackEvents.incrementAndGet();
        }

        // 2. Graceful fallback to thread-safe local memory bucket
        return checkLocalBucket(safeClient + ":" + tier, capacity, refillRate);
    }

    private RateLimitResult checkLocalBucket(String key, int capacity, double refillRate) {
        LocalTokenBucket bucket = localBuckets.computeIfAbsent(key, k -> new LocalTokenBucket(capacity, refillRate));
        synchronized (bucket) {
            long now = System.currentTimeMillis();
            double elapsedSeconds = (now - bucket.lastRefillTimestamp) / 1000.0;
            bucket.tokens = Math.min(bucket.capacity, bucket.tokens + (elapsedSeconds * bucket.refillRate));
            bucket.lastRefillTimestamp = now;

            if (bucket.tokens >= 1.0) {
                bucket.tokens -= 1.0;
                allowedRequests.incrementAndGet();
                return new RateLimitResult(true, 0, bucket.tokens);
            } else {
                totalRejections.incrementAndGet();
                double missingTokens = 1.0 - bucket.tokens;
                long retryAfter = (long) Math.ceil(missingTokens / bucket.refillRate);
                return new RateLimitResult(false, Math.max(1, retryAfter), bucket.tokens);
            }
        }
    }

    public int getActiveBucketCount() {
        return localBuckets.size();
    }

    public long getAllowedRequests() {
        return allowedRequests.get();
    }

    public long getTotalRejections() {
        return totalRejections.get();
    }

    public long getRedisFailures() {
        return redisFailures.get();
    }

    public long getFallbackEvents() {
        return fallbackEvents.get();
    }

    public Map<String, Object> getMetrics() {
        Map<String, Object> m = new HashMap<>();
        m.put("allowed_requests", allowedRequests.get());
        m.put("total_rejections", totalRejections.get());
        m.put("redis_failures", redisFailures.get());
        m.put("fallback_events", fallbackEvents.get());
        m.put("local_active_buckets", localBuckets.size());
        m.put("backend_engine", redisTemplate != null ? "REDIS_LUA" : "MEMORY_FALLBACK");
        return m;
    }

    private String sanitizeKey(String key) {
        if (key == null || key.trim().isEmpty()) {
            return "unknown";
        }
        return key.trim().replaceAll("[^a-zA-Z0-9_.-]", "_");
    }

    private static class LocalTokenBucket {
        final int capacity;
        final double refillRate;
        double tokens;
        long lastRefillTimestamp;

        LocalTokenBucket(int capacity, double refillRate) {
            this.capacity = capacity;
            this.refillRate = refillRate;
            this.tokens = capacity;
            this.lastRefillTimestamp = System.currentTimeMillis();
        }
    }
}
