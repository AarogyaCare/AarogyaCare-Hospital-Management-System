package com.aarogya;

import com.aarogya.exception.Exceptions;
import com.aarogya.model.ShortLinkDocument;
import com.aarogya.systemdesign.autocomplete.AutocompleteTrieService;
import com.aarogya.systemdesign.cache.CacheService;
import com.aarogya.systemdesign.crawler.SafeWebCrawlerService;
import com.aarogya.systemdesign.hashring.ConsistentHashRing;
import com.aarogya.systemdesign.id.UniqueIdGeneratorService;
import com.aarogya.systemdesign.ratelimiter.RateLimiterService;
import com.aarogya.systemdesign.shortlink.ShortLinkService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class SystemDesignComponentsTests {

    @Autowired
    private UniqueIdGeneratorService idGeneratorService;

    @Autowired
    private RateLimiterService rateLimiterService;

    @Autowired
    private CacheService cacheService;

    @Autowired
    private ConsistentHashRing hashRing;

    @Autowired
    private ShortLinkService shortLinkService;

    @Autowired
    private SafeWebCrawlerService crawlerService;

    @Autowired
    private AutocompleteTrieService autocompleteService;

    @Test
    @DisplayName("Component A: Unique ID Generator - 10,000 IDs with 0 collisions and high throughput")
    void testUniqueIdGeneratorBenchmark() {
        Map<String, Object> results = idGeneratorService.benchmark(10000);
        assertNotNull(results);
        assertEquals(0, results.get("collisions_detected"), "Collision count must be EXACTLY ZERO.");
        assertTrue(((Number) results.get("ids_per_second")).doubleValue() > 1000.0, "Throughput must exceed 1,000 IDs/sec.");
    }

    @Test
    @DisplayName("Component B: Rate Limiter - Token bucket exhaustion and emergency bypass")
    void testRateLimiterExhaustionAndEmergencyBypass() {
        String clientIp = "192.168.1.100";

        // Exhaust auth bucket (capacity: 20)
        RateLimiterService.RateLimitResult lastResult = null;
        for (int i = 0; i < 25; i++) {
            lastResult = rateLimiterService.tryAcquire(clientIp, "auth");
        }

        assertNotNull(lastResult);
        assertFalse(lastResult.allowed(), "Requests exceeding capacity must be rejected.");
        assertTrue(lastResult.retryAfterSeconds() >= 1, "Retry-After must provide retry guidance.");

        // Emergency tier has distinct high capacity and priority bypass
        RateLimiterService.RateLimitResult emergencyResult = rateLimiterService.tryAcquire(clientIp, "emergency");
        assertTrue(emergencyResult.allowed(), "Emergency request must not be blocked by auth rate limits.");
    }

    @Test
    @DisplayName("Component C: Key-Value Store - Redis cache-aside, TTL, and cache invalidation")
    void testKeyValueStoreCacheAside() {
        String testKey = "cache:test:" + System.currentTimeMillis();
        String testValue = "AarogyaCachedData";

        cacheService.set(testKey, testValue, Duration.ofMinutes(5));
        String fetched = cacheService.get(testKey, String.class);
        assertEquals(testValue, fetched);

        // Evict
        cacheService.evict(testKey);
        String afterEvict = cacheService.get(testKey, String.class);
        assertNull(afterEvict, "Evicted key must return null.");
    }

    @Test
    @DisplayName("Component D: Consistent Hashing Ring - 150 vnodes and key remapping measurement")
    void testConsistentHashingRemapping() {
        assertEquals(3, hashRing.getPhysicalNodeCount());
        assertEquals(450, hashRing.getTotalVnodeCount()); // 3 * 150 = 450 vnodes

        List<String> sampleKeys = new ArrayList<>();
        for (int i = 0; i < 1000; i++) {
            sampleKeys.add("cache-key-patient-" + i);
        }

        Map<String, Object> sim = hashRing.simulateNodeRemoval("redis-cache-c", sampleKeys);
        assertNotNull(sim);
        double remapped = (Double) sim.get("remapped_percent");
        // For 3 nodes, removing 1 node should re-map approximately 1/3 (~33%) of keys
        assertTrue(remapped >= 20.0 && remapped <= 45.0, "Remapping should be close to 1/N (~33.3%). Actual: " + remapped + "%");
    }

    @Test
    @DisplayName("Component E: URL Shortener - Base62 creation, resolution, expiry, and open redirect protection")
    void testUrlShortenerAndOpenRedirectGuard() {
        // Valid creation
        ShortLinkDocument link = shortLinkService.createShortLink(
            "https://aarogyacare.org/portal/appointments/101",
            "Appointment",
            "101",
            3600L
        );
        assertNotNull(link);
        assertEquals(6, link.getCode().length(), "Short code must be 6 characters Base62.");

        // Resolve
        ShortLinkDocument resolved = shortLinkService.resolveShortLink(link.getCode());
        assertEquals(link.getTargetUrl(), resolved.getTargetUrl());
        assertEquals(1, resolved.getClickCount());

        // Revoke
        shortLinkService.revokeShortLink(link.getCode());
        assertThrows(Exceptions.ForbiddenException.class, () -> shortLinkService.resolveShortLink(link.getCode()));

        // Open redirect protection: Reject javascript: scheme
        assertThrows(Exceptions.BadRequestException.class, () ->
            shortLinkService.createShortLink("javascript:alert('xss')", "test", "1", 3600L));
    }

    @Test
    @DisplayName("Component F: Web Crawler - SSRF protection blocks cloud metadata, localhost, and private subnets")
    void testCrawlerSsrfProtection() {
        // AWS/Cloud metadata IP must be blocked
        assertThrows(Exceptions.BadRequestException.class, () ->
            crawlerService.validateUrlAndSsrfProtection("http://169.254.169.254/latest/meta-data/"));

        // Localhost and loopback must be strictly blocked
        assertThrows(Exceptions.BadRequestException.class, () ->
            crawlerService.validateUrlAndSsrfProtection("http://localhost:8000/api/v1/system-design/telemetry"));
        assertThrows(Exceptions.BadRequestException.class, () ->
            crawlerService.validateUrlAndSsrfProtection("http://127.0.0.1:27017/"));

        // Private RFC 1918 subnets must be blocked
        assertThrows(Exceptions.BadRequestException.class, () ->
            crawlerService.validateUrlAndSsrfProtection("http://192.168.1.1/admin"));
        assertThrows(Exceptions.BadRequestException.class, () ->
            crawlerService.validateUrlAndSsrfProtection("http://10.0.0.1/status"));

        // Unapproved arbitrary external domain must be blocked
        assertThrows(Exceptions.BadRequestException.class, () ->
            crawlerService.validateUrlAndSsrfProtection("https://unapproved-malicious-site.com/hack"));

        // Approved healthcare domain passes validation
        assertDoesNotThrow(() ->
            crawlerService.validateUrlAndSsrfProtection("https://who.int/emergencies/diseases/novel-coronavirus-2019"));
    }

    @Test
    @DisplayName("Component G: Autocomplete Prefix Trie - Prefix query matching and metrics")
    void testAutocompletePrefixTrie() {
        // Query for "cardio"
        var results = autocompleteService.search("cardio", 10);
        assertFalse(results.isEmpty(), "Prefix 'cardio' should return matches.");
        assertTrue(results.stream().anyMatch(s -> s.text().toLowerCase().contains("cardiology")));

        // Query for "dolo" or "paracet"
        var medResults = autocompleteService.search("paracet", 10);
        assertFalse(medResults.isEmpty());
        assertTrue(medResults.stream().anyMatch(s -> s.text().toLowerCase().contains("paracetamol")));

        // Query for doctor "raman"
        var docResults = autocompleteService.search("raman", 10);
        assertFalse(docResults.isEmpty());
        assertTrue(docResults.stream().anyMatch(s -> s.text().toLowerCase().contains("ramanathan")));

        // Verify stats
        Map<String, Object> stats = autocompleteService.getStats();
        assertTrue((Integer) stats.get("total_terms") > 0);
        assertEquals(90.0, stats.get("keystroke_reduction_percent"));
    }
}
