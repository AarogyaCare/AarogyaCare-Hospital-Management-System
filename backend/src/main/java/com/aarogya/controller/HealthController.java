package com.aarogya.controller;

import com.aarogya.dto.SystemDesignDtos;
import com.aarogya.systemdesign.metrics.SystemTelemetryService;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
public class HealthController {

    private final MongoTemplate mongoTemplate;
    private final RedisTemplate<String, Object> redisTemplate;
    private final SystemTelemetryService telemetryService;

    public HealthController(
            MongoTemplate mongoTemplate,
            RedisTemplate<String, Object> redisTemplate,
            SystemTelemetryService telemetryService) {
        this.mongoTemplate = mongoTemplate;
        this.redisTemplate = redisTemplate;
        this.telemetryService = telemetryService;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> livenessProbe() {
        return ResponseEntity.ok(Map.of(
            "status", "healthy",
            "service", "aarogya-backend-spring-boot",
            "version", "1.0.0",
            "timestamp", Instant.now().toString()
        ));
    }

    @GetMapping("/health/ready")
    public ResponseEntity<Map<String, Object>> readinessProbe() {
        boolean mongoReady = false;
        try {
            mongoTemplate.getDb().runCommand(new org.bson.Document("ping", 1));
            mongoReady = true;
        } catch (Exception ignored) {}

        boolean redisReady = false;
        try {
            RedisConnection connection = redisTemplate.getConnectionFactory().getConnection();
            redisReady = "PONG".equalsIgnoreCase(connection.ping());
            connection.close();
        } catch (Exception ignored) {}

        Map<String, Object> body = new HashMap<>();
        body.put("status", mongoReady ? "ready" : "degraded");
        body.put("database_mongodb", mongoReady ? "UP" : "DOWN");
        body.put("cache_redis", redisReady ? "UP" : "DEGRADED");
        body.put("timestamp", Instant.now().toString());

        HttpStatus status = mongoReady ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
        return new ResponseEntity<>(body, status);
    }

    @GetMapping("/health/components")
    public ResponseEntity<SystemDesignDtos.SystemTelemetryResponse> componentsTelemetry() {
        return ResponseEntity.ok(telemetryService.getTelemetry());
    }
}
