package com.aarogya.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public class SystemDesignDtos {

    public record ShortLinkCreateRequest(
        @NotBlank @JsonProperty("target_url") String targetUrl,
        @JsonProperty("resource_type") String resourceType,
        @JsonProperty("resource_id") String resourceId,
        @JsonProperty("ttl_seconds") Long ttlSeconds
    ) {}

    public record ShortLinkResponse(
        String id,
        String code,
        @JsonProperty("short_url") String shortUrl,
        @JsonProperty("target_url") String targetUrl,
        @JsonProperty("resource_type") String resourceType,
        @JsonProperty("resource_id") String resourceId,
        @JsonProperty("expires_at") Instant expiresAt,
        @JsonProperty("click_count") long clickCount,
        String status
    ) {}

    public record CrawlerJobRequest(
        @JsonProperty("seed_urls") List<String> seedUrls,
        @JsonProperty("max_depth") Integer maxDepth,
        @JsonProperty("max_pages") Integer maxPages
    ) {}

    public record CrawlerJobResponse(
        @JsonProperty("job_id") String jobId,
        String status,
        @JsonProperty("pages_crawled") int pagesCrawled,
        @JsonProperty("documents_indexed") int documentsIndexed,
        @JsonProperty("ssrf_blocked_count") int ssrfBlockedCount
    ) {}

    public record CrawlerSearchResult(
        String id,
        String url,
        String title,
        String domain,
        @JsonProperty("content_snippet") String contentSnippet
    ) {}

    public record CrawlerStatsResponse(
        @JsonProperty("total_documents") long totalDocuments,
        @JsonProperty("domains_covered") long domainsCovered,
        @JsonProperty("deduplicated_count") long deduplicatedCount
    ) {}

    public record AutocompleteSuggestion(
        String text,
        String type, // "DOCTOR", "DEPARTMENT", "MEDICINE"
        String id,
        Map<String, Object> metadata
    ) {}

    public record AutocompleteResponse(
        String query,
        @JsonProperty("total_matches") int totalMatches,
        List<AutocompleteSuggestion> suggestions
    ) {}

    public record AutocompleteStatsResponse(
        @JsonProperty("total_terms") int totalTerms,
        @JsonProperty("trie_nodes") int trieNodes,
        @JsonProperty("keystroke_reduction_percent") double keystrokeReductionPercent
    ) {}

    public record IdBenchmarkRequest(
        @JsonProperty("sample_size") Integer sampleSize
    ) {}

    public record IdBenchmarkResponse(
        @JsonProperty("sample_size") int sampleSize,
        @JsonProperty("elapsed_ms") double elapsedMs,
        @JsonProperty("ids_per_second") double idsPerSecond,
        @JsonProperty("collisions_detected") int collisionsDetected,
        @JsonProperty("sample_ids") List<String> sampleIds
    ) {}

    public record SystemTelemetryResponse(
        @JsonProperty("uptime_seconds") long uptimeSeconds,
        @JsonProperty("memory_used_mb") double memoryUsedMb,
        @JsonProperty("total_memory_mb") double totalMemoryMb,
        @JsonProperty("mongodb_status") String mongodbStatus,
        @JsonProperty("redis_status") String redisStatus,
        @JsonProperty("cache_hit_ratio") double cacheHitRatio,
        @JsonProperty("cache_hits") long cacheHits,
        @JsonProperty("cache_misses") long cacheMisses,
        @JsonProperty("rate_limiter_active_buckets") int rateLimiterActiveBuckets,
        @JsonProperty("rate_limiter_rejections") long rateLimiterRejections,
        @JsonProperty("crawler_indexed_documents") long crawlerIndexedDocuments,
        @JsonProperty("autocomplete_trie_nodes") int autocompleteTrieNodes,
        @JsonProperty("consistent_hash_ring_nodes") int consistentHashRingNodes,
        @JsonProperty("consistent_hash_ring_vnodes") int consistentHashRingVnodes
    ) {}
}
