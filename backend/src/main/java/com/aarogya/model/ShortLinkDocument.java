package com.aarogya.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "short_links")
public class ShortLinkDocument {

    @Id
    private String id;

    @Indexed(unique = true)
    private String code;

    private String targetUrl;
    private String resourceType;
    private String resourceId;
    private Instant expiresAt;
    private long clickCount = 0;

    @Indexed
    private String status = "ACTIVE"; // "ACTIVE", "REVOKED", "EXPIRED"

    private Instant createdAt = Instant.now();

    public ShortLinkDocument() {}

    public ShortLinkDocument(String id, String code, String targetUrl, String resourceType, String resourceId, Instant expiresAt) {
        this.id = id;
        this.code = code;
        this.targetUrl = targetUrl;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.expiresAt = expiresAt;
        this.status = "ACTIVE";
        this.clickCount = 0;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getTargetUrl() { return targetUrl; }
    public void setTargetUrl(String targetUrl) { this.targetUrl = targetUrl; }

    public String getResourceType() { return resourceType; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }

    public String getResourceId() { return resourceId; }
    public void setResourceId(String resourceId) { this.resourceId = resourceId; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }

    public long getClickCount() { return clickCount; }
    public void setClickCount(long clickCount) { this.clickCount = clickCount; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
