package com.aarogya.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "idempotency_records")
public class IdempotencyRecordDocument {

    @Id
    private String id;

    @Indexed(unique = true)
    private String idempotencyKey;

    private String requestPath;
    private int responseStatus;
    private String responsePayload;
    private Instant createdAt = Instant.now();

    public IdempotencyRecordDocument() {}

    public IdempotencyRecordDocument(String id, String idempotencyKey, String requestPath, int responseStatus, String responsePayload) {
        this.id = id;
        this.idempotencyKey = idempotencyKey;
        this.requestPath = requestPath;
        this.responseStatus = responseStatus;
        this.responsePayload = responsePayload;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }

    public String getRequestPath() { return requestPath; }
    public void setRequestPath(String requestPath) { this.requestPath = requestPath; }

    public int getResponseStatus() { return responseStatus; }
    public void setResponseStatus(int responseStatus) { this.responseStatus = responseStatus; }

    public String getResponsePayload() { return responsePayload; }
    public void setResponsePayload(String responsePayload) { this.responsePayload = responsePayload; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
