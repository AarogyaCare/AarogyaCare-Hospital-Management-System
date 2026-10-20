package com.aarogya.controller;

import com.aarogya.dto.SystemDesignDtos;
import com.aarogya.exception.Exceptions;
import com.aarogya.model.CrawlerDocument;
import com.aarogya.model.ShortLinkDocument;
import com.aarogya.systemdesign.autocomplete.AutocompleteTrieService;
import com.aarogya.systemdesign.crawler.SafeWebCrawlerService;
import com.aarogya.systemdesign.hashring.HashRingCacheRouter;
import com.aarogya.systemdesign.id.UniqueIdGeneratorService;
import com.aarogya.systemdesign.metrics.SystemTelemetryService;
import com.aarogya.systemdesign.ratelimiter.RateLimiterService;
import com.aarogya.systemdesign.shortlink.ShortLinkService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.*;

@RestController
@RequestMapping
public class SystemDesignController {

    private final AutocompleteTrieService trieService;
    private final ShortLinkService shortLinkService;
    private final SafeWebCrawlerService crawlerService;
    private final UniqueIdGeneratorService idGeneratorService;
    private final SystemTelemetryService telemetryService;
    private final HashRingCacheRouter hashRingRouter;
    private final RateLimiterService rateLimiterService;

    @Value("${server.port:8000}")
    private int serverPort;

    public SystemDesignController(
            AutocompleteTrieService trieService,
            ShortLinkService shortLinkService,
            SafeWebCrawlerService crawlerService,
            UniqueIdGeneratorService idGeneratorService,
            SystemTelemetryService telemetryService,
            HashRingCacheRouter hashRingRouter,
            RateLimiterService rateLimiterService) {
        this.trieService = trieService;
        this.shortLinkService = shortLinkService;
        this.crawlerService = crawlerService;
        this.idGeneratorService = idGeneratorService;
        this.telemetryService = telemetryService;
        this.hashRingRouter = hashRingRouter;
        this.rateLimiterService = rateLimiterService;
    }

    // -------------------------------------------------------------------------
    // 1. Autocomplete Prefix Trie
    // -------------------------------------------------------------------------
    @GetMapping("/api/v1/autocomplete")
    public ResponseEntity<SystemDesignDtos.AutocompleteResponse> autocomplete(
            @RequestParam(name = "q") String query,
            @RequestParam(defaultValue = "10") int limit) {
        var matches = trieService.search(query, limit);
        return ResponseEntity.ok(new SystemDesignDtos.AutocompleteResponse(query, matches.size(), matches));
    }

    @GetMapping("/api/v1/autocomplete/stats")
    public ResponseEntity<Map<String, Object>> getAutocompleteStats() {
        return ResponseEntity.ok(trieService.getStats());
    }

    @PostMapping("/api/v1/autocomplete/rebuild")
    public ResponseEntity<Map<String, Object>> rebuildAutocomplete() {
        trieService.rebuildVocabularyFromDatabase();
        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "message", "Vocabulary rebuilt successfully from database.",
                "stats", trieService.getStats()
        ));
    }

    // -------------------------------------------------------------------------
    // 2. URL Shortener & HTTP Redirect Resolution
    // -------------------------------------------------------------------------
    @PostMapping("/api/v1/short-links")
    public ResponseEntity<SystemDesignDtos.ShortLinkResponse> createShortLink(
            @Valid @RequestBody SystemDesignDtos.ShortLinkCreateRequest request,
            HttpServletRequest httpRequest) {
        ShortLinkDocument doc = shortLinkService.createShortLink(
                request.targetUrl(),
                request.resourceType(),
                request.resourceId(),
                request.ttlSeconds()
        );
        String baseUrl = resolveBaseUrl(httpRequest);
        String shortUrl = baseUrl + "/s/" + doc.getCode();
        return ResponseEntity.status(HttpStatus.CREATED).body(new SystemDesignDtos.ShortLinkResponse(
                doc.getId(),
                doc.getCode(),
                shortUrl,
                doc.getTargetUrl(),
                doc.getResourceType(),
                doc.getResourceId(),
                doc.getExpiresAt(),
                doc.getClickCount(),
                doc.getStatus()
        ));
    }

    @GetMapping("/api/v1/short-links/{code}")
    public ResponseEntity<SystemDesignDtos.ShortLinkResponse> resolveShortLinkMetadata(
            @PathVariable String code,
            HttpServletRequest httpRequest) {
        ShortLinkDocument doc = shortLinkService.resolveShortLink(code);
        String baseUrl = resolveBaseUrl(httpRequest);
        String shortUrl = baseUrl + "/s/" + doc.getCode();
        return ResponseEntity.ok(new SystemDesignDtos.ShortLinkResponse(
                doc.getId(),
                doc.getCode(),
                shortUrl,
                doc.getTargetUrl(),
                doc.getResourceType(),
                doc.getResourceId(),
                doc.getExpiresAt(),
                doc.getClickCount(),
                doc.getStatus()
        ));
    }

    /**
     * Resolves short link and executes actual HTTP 302 Foundation Redirect.
     */
    @GetMapping({"/s/{code}", "/api/v1/short-links/{code}/redirect"})
    public ResponseEntity<Void> redirectShortLink(@PathVariable String code) {
        ShortLinkDocument doc = shortLinkService.resolveShortLink(code);
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(doc.getTargetUrl()))
                .build();
    }

    @PostMapping("/api/v1/short-links/{code}/revoke")
    public ResponseEntity<SystemDesignDtos.ShortLinkResponse> revokeShortLink(
            @PathVariable String code,
            HttpServletRequest httpRequest) {
        ShortLinkDocument doc = shortLinkService.revokeShortLink(code);
        String baseUrl = resolveBaseUrl(httpRequest);
        String shortUrl = baseUrl + "/s/" + doc.getCode();
        return ResponseEntity.ok(new SystemDesignDtos.ShortLinkResponse(
                doc.getId(),
                doc.getCode(),
                shortUrl,
                doc.getTargetUrl(),
                doc.getResourceType(),
                doc.getResourceId(),
                doc.getExpiresAt(),
                doc.getClickCount(),
                doc.getStatus()
        ));
    }

    // -------------------------------------------------------------------------
    // 3. Web Crawler
    // -------------------------------------------------------------------------
    @PostMapping("/api/v1/crawler/jobs")
    public ResponseEntity<Map<String, Object>> startCrawlerJob(
            @RequestBody(required = false) SystemDesignDtos.CrawlerJobRequest request) {
        List<String> seeds = request != null ? request.seedUrls() : Collections.emptyList();
        int depth = request != null && request.maxDepth() != null ? request.maxDepth() : 2;
        int pages = request != null && request.maxPages() != null ? request.maxPages() : 10;
        return ResponseEntity.ok(crawlerService.runCrawlJob(seeds, depth, pages));
    }

    @GetMapping("/api/v1/crawler/search")
    public ResponseEntity<List<SystemDesignDtos.CrawlerSearchResult>> searchCrawler(
            @RequestParam(required = false, name = "q") String query) {
        List<CrawlerDocument> docs = crawlerService.searchIndexedDocuments(query);
        List<SystemDesignDtos.CrawlerSearchResult> results = new ArrayList<>();
        for (CrawlerDocument d : docs) {
            results.add(new SystemDesignDtos.CrawlerSearchResult(
                    d.getId(),
                    d.getUrl(),
                    d.getTitle(),
                    d.getDomain(),
                    d.getContentSnippet()
            ));
        }
        return ResponseEntity.ok(results);
    }

    @GetMapping("/api/v1/crawler/stats")
    public ResponseEntity<Map<String, Object>> getCrawlerStats() {
        return ResponseEntity.ok(crawlerService.getCrawlerStats());
    }

    // -------------------------------------------------------------------------
    // 4. Consistent Hash Ring
    // -------------------------------------------------------------------------
    @GetMapping("/api/v1/system-design/hashring/nodes")
    public ResponseEntity<Map<String, Object>> getHashRingNodes() {
        return ResponseEntity.ok(hashRingRouter.getDistributionStats());
    }

    @PostMapping("/api/v1/system-design/hashring/nodes")
    public ResponseEntity<Map<String, Object>> addHashRingNode(
            @RequestParam(required = false) String name,
            @RequestBody(required = false) Map<String, Object> body) {
        String nodeName = name;
        if ((nodeName == null || nodeName.isBlank()) && body != null && body.containsKey("name")) {
            nodeName = String.valueOf(body.get("name"));
        }
        if (nodeName == null || nodeName.isBlank()) {
            throw new Exceptions.BadRequestException("Node name parameter is required.");
        }
        hashRingRouter.addNode(nodeName);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "status", "ADDED",
                "node", nodeName,
                "current_stats", hashRingRouter.getDistributionStats()
        ));
    }

    @DeleteMapping("/api/v1/system-design/hashring/nodes/{name}")
    public ResponseEntity<Map<String, Object>> removeHashRingNode(@PathVariable String name) {
        hashRingRouter.removeNode(name);
        return ResponseEntity.ok(Map.of(
                "status", "REMOVED",
                "node", name,
                "current_stats", hashRingRouter.getDistributionStats()
        ));
    }

    @GetMapping("/api/v1/system-design/hashring/route")
    public ResponseEntity<Map<String, Object>> routeHashRingKey(@RequestParam String key) {
        String targetNode = hashRingRouter.routeKey(key);
        return ResponseEntity.ok(Map.of(
                "key", key,
                "target_node", targetNode,
                "partition_namespace", "part:" + targetNode + ":" + key
        ));
    }

    @PostMapping("/api/v1/system-design/hashring/simulate")
    public ResponseEntity<Map<String, Object>> simulateHashRingRemapping(
            @RequestParam(defaultValue = "redis-cache-c") String nodeToRemove,
            @RequestParam(defaultValue = "1000") int sampleKeyCount) {
        List<String> keys = new ArrayList<>(sampleKeyCount);
        for (int i = 0; i < sampleKeyCount; i++) {
            keys.add("patient-record-cache-" + i);
        }
        return ResponseEntity.ok(hashRingRouter.simulateNodeRemoval(nodeToRemove, keys));
    }

    // -------------------------------------------------------------------------
    // 5. System Telemetry & Unique ID Generator Benchmark
    // -------------------------------------------------------------------------
    @GetMapping("/api/v1/system-design/telemetry")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SystemDesignDtos.SystemTelemetryResponse> getTelemetry() {
        return ResponseEntity.ok(telemetryService.getTelemetry());
    }

    @GetMapping("/api/v1/system-design/ratelimiter/metrics")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getRateLimiterMetrics() {
        return ResponseEntity.ok(rateLimiterService.getMetrics());
    }

    @PostMapping("/api/v1/system-design/ids/benchmark")
    public ResponseEntity<Map<String, Object>> benchmarkIds(
            @RequestParam(required = false, name = "sample_size") Integer sampleSize,
            @RequestBody(required = false) Map<String, Object> body) {
        int count = 10000;
        if (sampleSize != null && sampleSize > 0) {
            count = sampleSize;
        } else if (body != null && body.containsKey("sample_size")) {
            try {
                count = Integer.parseInt(String.valueOf(body.get("sample_size")));
            } catch (Exception ignored) {}
        }
        return ResponseEntity.ok(idGeneratorService.benchmark(count));
    }

    private String resolveBaseUrl(HttpServletRequest request) {
        if (request == null) return "http://localhost:" + serverPort;
        String scheme = request.getScheme();
        String serverName = request.getServerName();
        int port = request.getServerPort();
        if ((scheme.equals("http") && port == 80) || (scheme.equals("https") && port == 443)) {
            return scheme + "://" + serverName;
        }
        return scheme + "://" + serverName + ":" + port;
    }
}
