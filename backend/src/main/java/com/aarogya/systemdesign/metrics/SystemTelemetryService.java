package com.aarogya.systemdesign.metrics;

import com.aarogya.dto.SystemDesignDtos;
import com.aarogya.repository.CrawlerDocumentRepository;
import com.aarogya.systemdesign.autocomplete.AutocompleteTrieService;
import com.aarogya.systemdesign.cache.CacheService;
import com.aarogya.systemdesign.hashring.ConsistentHashRing;
import com.aarogya.systemdesign.ratelimiter.RateLimiterService;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.lang.management.ManagementFactory;

@Service
public class SystemTelemetryService {

    private final MongoTemplate mongoTemplate;
    private final RedisTemplate<String, Object> redisTemplate;
    private final CacheService cacheService;
    private final RateLimiterService rateLimiterService;
    private final CrawlerDocumentRepository crawlerRepository;
    private final AutocompleteTrieService trieService;
    private final ConsistentHashRing hashRing;

    public SystemTelemetryService(
            MongoTemplate mongoTemplate,
            RedisTemplate<String, Object> redisTemplate,
            CacheService cacheService,
            RateLimiterService rateLimiterService,
            CrawlerDocumentRepository crawlerRepository,
            AutocompleteTrieService trieService,
            ConsistentHashRing hashRing) {
        this.mongoTemplate = mongoTemplate;
        this.redisTemplate = redisTemplate;
        this.cacheService = cacheService;
        this.rateLimiterService = rateLimiterService;
        this.crawlerRepository = crawlerRepository;
        this.trieService = trieService;
        this.hashRing = hashRing;
    }

    public SystemDesignDtos.SystemTelemetryResponse getTelemetry() {
        long uptime = ManagementFactory.getRuntimeMXBean().getUptime() / 1000;
        Runtime rt = Runtime.getRuntime();
        double totalMb = rt.totalMemory() / (1024.0 * 1024.0);
        double freeMb = rt.freeMemory() / (1024.0 * 1024.0);
        double usedMb = totalMb - freeMb;

        String mongoStatus;
        try {
            mongoTemplate.getDb().runCommand(new org.bson.Document("ping", 1));
            mongoStatus = "HEALTHY";
        } catch (Exception e) {
            mongoStatus = "DEGRADED: " + e.getMessage();
        }

        String redisStatus;
        try {
            RedisConnection connection = redisTemplate.getConnectionFactory().getConnection();
            String ping = connection.ping();
            redisStatus = "PONG".equalsIgnoreCase(ping) ? "HEALTHY" : "CONNECTED";
            connection.close();
        } catch (Exception e) {
            redisStatus = "DEGRADED: " + e.getMessage();
        }

        return new SystemDesignDtos.SystemTelemetryResponse(
            uptime,
            Math.round(usedMb * 100.0) / 100.0,
            Math.round(totalMb * 100.0) / 100.0,
            mongoStatus,
            redisStatus,
            Math.round(cacheService.getHitRatio() * 1000.0) / 1000.0,
            cacheService.getCacheHits(),
            cacheService.getCacheMisses(),
            rateLimiterService.getActiveBucketCount(),
            rateLimiterService.getTotalRejections(),
            crawlerRepository.count(),
            (Integer) trieService.getStats().get("trie_nodes"),
            hashRing.getPhysicalNodeCount(),
            hashRing.getTotalVnodeCount()
        );
    }
}
