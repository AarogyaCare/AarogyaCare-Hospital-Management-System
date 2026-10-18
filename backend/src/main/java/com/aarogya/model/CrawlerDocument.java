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
}
