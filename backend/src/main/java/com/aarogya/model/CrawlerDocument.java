package com.aarogya.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "crawler_documents")
public class CrawlerDocument {

    @Id
    private String id;

    @Indexed(unique = true)
    private String url;

    private String title;

    @Indexed
    private String domain;

    private String contentSnippet;

    @Indexed
    private String contentHash;

    private int statusCode = 200;
    private Instant indexedAt = Instant.now();

    private String fullText;
    private String category = "GENERAL"; // GENERAL, PREVENTION, SYMPTOMS, CLINICAL_PROTOCOL, PUBLIC_HEALTH
    private String specialty = "GENERAL_MEDICINE"; // CARDIOLOGY, INFECTIOUS_DISEASE, PULMONOLOGY, GENERAL_MEDICINE, etc.
    private String sourceName; // e.g. "World Health Organization", "CDC"
    private String publishedDate;
    private String contentStatus = "ACTIVE"; // ACTIVE, REVIEW_PENDING, STALE
    private java.util.List<ArticleSection> sections = new java.util.ArrayList<>();
    private java.util.List<String> safeOutlinks = new java.util.ArrayList<>();

    public static class ArticleSection {
        private String heading;
        private String content;
        private java.util.List<String> bulletPoints = new java.util.ArrayList<>();

        public ArticleSection() {}

        public ArticleSection(String heading, String content, java.util.List<String> bulletPoints) {
            this.heading = heading;
            this.content = content;
            if (bulletPoints != null) {
                this.bulletPoints = bulletPoints;
            }
        }

        public String getHeading() { return heading; }
        public void setHeading(String heading) { this.heading = heading; }

        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }

        public java.util.List<String> getBulletPoints() { return bulletPoints; }
        public void setBulletPoints(java.util.List<String> bulletPoints) { this.bulletPoints = bulletPoints; }
    }

    public CrawlerDocument() {}

    public CrawlerDocument(String id, String url, String title, String domain, String contentSnippet, String contentHash, int statusCode) {
        this.id = id;
        this.url = url;
        this.title = title;
        this.domain = domain;
        this.contentSnippet = contentSnippet;
        this.contentHash = contentHash;
        this.statusCode = statusCode;
        this.indexedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDomain() { return domain; }
    public void setDomain(String domain) { this.domain = domain; }

    public String getContentSnippet() { return contentSnippet; }
    public void setContentSnippet(String contentSnippet) { this.contentSnippet = contentSnippet; }

    public String getContentHash() { return contentHash; }
    public void setContentHash(String contentHash) { this.contentHash = contentHash; }

    public int getStatusCode() { return statusCode; }
    public void setStatusCode(int statusCode) { this.statusCode = statusCode; }

    public Instant getIndexedAt() { return indexedAt; }
    public void setIndexedAt(Instant indexedAt) { this.indexedAt = indexedAt; }

    public String getFullText() { return fullText; }
    public void setFullText(String fullText) { this.fullText = fullText; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getSpecialty() { return specialty; }
    public void setSpecialty(String specialty) { this.specialty = specialty; }

    public String getSourceName() { return sourceName; }
    public void setSourceName(String sourceName) { this.sourceName = sourceName; }

    public String getPublishedDate() { return publishedDate; }
    public void setPublishedDate(String publishedDate) { this.publishedDate = publishedDate; }

    public String getContentStatus() { return contentStatus; }
    public void setContentStatus(String contentStatus) { this.contentStatus = contentStatus; }

    public java.util.List<ArticleSection> getSections() { return sections; }
    public void setSections(java.util.List<ArticleSection> sections) { this.sections = sections; }

    public java.util.List<String> getSafeOutlinks() { return safeOutlinks; }
    public void setSafeOutlinks(java.util.List<String> safeOutlinks) { this.safeOutlinks = safeOutlinks; }
}
