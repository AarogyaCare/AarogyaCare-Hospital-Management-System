package com.aarogya;

import com.aarogya.dto.SystemDesignDtos;
import com.aarogya.exception.Exceptions;
import com.aarogya.model.CrawlerDocument;
import com.aarogya.repository.CrawlerDocumentRepository;
import com.aarogya.systemdesign.crawler.SafeWebCrawlerService;
import com.aarogya.systemdesign.hashring.ConsistentHashRing;
import com.aarogya.systemdesign.hashring.HashRingCacheRouter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class MedicalKnowledgeConsistentHashTests {

    @Autowired
    private SafeWebCrawlerService crawlerService;

    @Autowired
    private HashRingCacheRouter hashRingRouter;

    @Autowired
    private ConsistentHashRing hashRing;

    @Autowired
    private CrawlerDocumentRepository crawlerRepository;

    @BeforeEach
    void setUp() {
        crawlerService.initializeBaselineGuidelines();
        crawlerService.evictKnowledgeCaches();
    }

    @Test
    @DisplayName("SSRF Shield: Blocks Cloud Metadata, Loopback, Private RFC 1918 subnets and Unapproved Domains")
    void testCrawlerSsrfProtectionExhaustive() {
        // Cloud Metadata IP
        assertThrows(Exceptions.BadRequestException.class, () ->
                crawlerService.validateUrlAndSsrfProtection("http://169.254.169.254/latest/meta-data/"));

        // Loopback / Localhost
        assertThrows(Exceptions.BadRequestException.class, () ->
                crawlerService.validateUrlAndSsrfProtection("http://localhost:8000/api/v1/system-design/telemetry"));
        assertThrows(Exceptions.BadRequestException.class, () ->
                crawlerService.validateUrlAndSsrfProtection("http://127.0.0.1:27017/"));

        // RFC 1918 Private Subnets
        assertThrows(Exceptions.BadRequestException.class, () ->
                crawlerService.validateUrlAndSsrfProtection("http://10.0.0.1/internal-status"));
        assertThrows(Exceptions.BadRequestException.class, () ->
                crawlerService.validateUrlAndSsrfProtection("http://192.168.1.1/router-login"));
        assertThrows(Exceptions.BadRequestException.class, () ->
                crawlerService.validateUrlAndSsrfProtection("http://172.20.0.5/admin"));

        // Unapproved Arbitrary External Domain
        assertThrows(Exceptions.BadRequestException.class, () ->
                crawlerService.validateUrlAndSsrfProtection("https://unapproved-malicious-tracker.com/steal"));

        // Non-HTTP/HTTPS schemes
        assertThrows(Exceptions.BadRequestException.class, () ->
                crawlerService.validateUrlAndSsrfProtection("ftp://who.int/download"));
        assertThrows(Exceptions.BadRequestException.class, () ->
                crawlerService.validateUrlAndSsrfProtection("javascript:alert(1)"));

        // Approved healthcare domains must pass
        assertDoesNotThrow(() ->
                crawlerService.validateUrlAndSsrfProtection("https://who.int/emergencies/diseases/novel-coronavirus-2019"));
        assertDoesNotThrow(() ->
                crawlerService.validateUrlAndSsrfProtection("https://cdc.gov/flu/treatment/index.html"));
        assertDoesNotThrow(() ->
                crawlerService.validateUrlAndSsrfProtection("https://mohfw.gov.in/guidelines/clinical-protocols"));
    }

    @Test
    @DisplayName("Structured Extraction & Preview: Verified sections, bullet points, disclaimer, and safe outlinks")
    void testStructuredResourcePreview() {
        List<CrawlerDocument> docs = crawlerRepository.findAll();
        assertFalse(docs.isEmpty(), "Baseline clinical guidelines must be seeded.");

        CrawlerDocument sample = docs.get(0);
        SystemDesignDtos.ResourcePreviewDto preview = crawlerService.getResourcePreview(sample.getId());

        assertNotNull(preview);
        assertEquals(sample.getId(), preview.id());
        assertNotNull(preview.title());
        assertNotNull(preview.domain());
        assertNotNull(preview.disclaimer());
        assertTrue(preview.disclaimer().contains("Medical Disclaimer"), "Must include required medical disclaimer.");
        assertFalse(preview.sections().isEmpty(), "Must contain readable structured sections.");

        SystemDesignDtos.ArticleSectionDto firstSection = preview.sections().get(0);
        assertNotNull(firstSection.heading());
        assertNotNull(firstSection.content());
        assertNotNull(firstSection.bulletPoints());
    }

    @Test
    @DisplayName("Consistent Hashing: Queries map deterministically to ring nodes, populate cache, and produce cache hits")
    void testConsistentHashingCacheRoutingAndHitMiss() {
        String query = "respiratory";
        String category = "CLINICAL_PROTOCOL";
        String specialty = "INFECTIOUS_DISEASE";

        // Query 1: Cache MISS
        SystemDesignDtos.MedicalKnowledgeSearchResponse resp1 =
                crawlerService.searchMedicalKnowledge(query, category, specialty);

        assertNotNull(resp1);
        assertFalse(resp1.cacheHit(), "First query must be a Cache MISS");
        assertNotNull(resp1.routedCacheNode(), "Must attribute a consistent hash ring node");
        assertTrue(hashRing.getPhysicalNodes().contains(resp1.routedCacheNode()),
                "Target node must belong to consistent hash ring physical nodes: " + hashRing.getPhysicalNodes());

        // Query 2: Repeated identical query -> Cache HIT
        SystemDesignDtos.MedicalKnowledgeSearchResponse resp2 =
                crawlerService.searchMedicalKnowledge(query, category, specialty);

        assertNotNull(resp2);
        assertTrue(resp2.cacheHit(), "Second identical query must be a Cache HIT");
        assertEquals(resp1.routedCacheNode(), resp2.routedCacheNode(), "Must route to the EXACT same hash ring node");
        assertEquals(resp1.cacheKey(), resp2.cacheKey());
        assertEquals(resp1.totalResults(), resp2.totalResults());
    }

    @Test
    @DisplayName("Cache Invalidation & Source Management: Evicts cache on crawl or source mutations")
    void testSourceManagementAndCacheEviction() {
        // Query to populate cache
        SystemDesignDtos.MedicalKnowledgeSearchResponse initial =
                crawlerService.searchMedicalKnowledge("influenza", "ALL", "ALL");
        assertFalse(initial.cacheHit());

        // Second query hits cache
        SystemDesignDtos.MedicalKnowledgeSearchResponse cached =
                crawlerService.searchMedicalKnowledge("influenza", "ALL", "ALL");
        assertTrue(cached.cacheHit());

        // Invalidate cache
        crawlerService.evictKnowledgeCaches();

        // Third query after eviction must be Cache MISS again
        SystemDesignDtos.MedicalKnowledgeSearchResponse postEvict =
                crawlerService.searchMedicalKnowledge("influenza", "ALL", "ALL");
        assertFalse(postEvict.cacheHit(), "Query after cache eviction must be a Cache MISS");
    }

    @Test
    @DisplayName("Approved Sources Registry: Inspects verified public healthcare seeds")
    void testApprovedSourcesRegistry() {
        List<SystemDesignDtos.KnowledgeSourceDto> sources = crawlerService.getApprovedSources();
        assertNotNull(sources);
        assertTrue(sources.size() >= 4, "Must contain at least 4 default approved healthcare sources.");

        boolean hasWho = sources.stream().anyMatch(s -> "who.int".equalsIgnoreCase(s.domain()));
        boolean hasCdc = sources.stream().anyMatch(s -> "cdc.gov".equalsIgnoreCase(s.domain()));
        boolean hasMohfw = sources.stream().anyMatch(s -> "mohfw.gov.in".equalsIgnoreCase(s.domain()));

        assertTrue(hasWho, "Must include who.int as approved source");
        assertTrue(hasCdc, "Must include cdc.gov as approved source");
        assertTrue(hasMohfw, "Must include mohfw.gov.in as approved source");
    }
}
