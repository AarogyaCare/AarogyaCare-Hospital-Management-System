package com.aarogya.service;

import com.aarogya.dto.AiDtos;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GeminiAiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiAiService.class);

    private static final String SYSTEM_INSTRUCTION = """
        You are Medora AI, an intelligent, empathetic, and professional virtual assistant for the Medora Hospital Management System located in Chennai, Tamil Nadu.

        Your core responsibilities:
        1. Hospital Navigation: Guide users on how to book appointments, locate departments (Cardiology, Neurology, Robotic Orthopedics, Oncology, Nephrology, Trauma), check visiting hours, download digital discharge summaries and medical records, and view/pay invoices.
        2. Healthcare & Triage Education: Provide general, evidence-based healthcare FAQs and explain clinical preparation (e.g., fasting before blood glucose or lipid panel tests).
        3. Emergency Guidance: If a user describes acute, life-threatening symptoms (e.g., severe chest pain, sudden numbness/paralysis, difficulty breathing, major trauma), immediately instruct them to dial the Medora 24/7 Emergency Hotline at 1066 or visit the emergency trauma center.
        4. System Architecture: If asked about Medora's technology, explain the System Design components: Token Bucket Rate Limiting, Consistent Hashing ring, LSM Key-Value store, Snowflake unique ID generation, Base62 URL shortener, and Web Crawler.

        Strict Medical Safety & Privacy Boundaries:
        - NEVER diagnose medical conditions or interpret clinical test values definitively.
        - NEVER prescribe or recommend specific drug dosages.
        - Always include a concise clinical disclaimer that your responses are informational and do not replace professional medical evaluation by a licensed physician.
        - NEVER fabricate or expose personal patient data, confidential records, or internal passwords.
        - Keep answers concise, clear, reassuring, and well-structured with bullet points where appropriate.
        """;

    @Value("${GEMINI_API_KEY:${aarogya.ai.gemini.api-key:}}")
    private String apiKey;

    @Value("${GEMINI_MODEL:${aarogya.ai.gemini.model:gemini-2.5-flash}}")
    private String modelName;

    @Value("${aarogya.ai.gemini.timeout-seconds:30}")
    private int timeoutSeconds;

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final Map<String, UserRateBucket> rateLimiters = new ConcurrentHashMap<>();

    public GeminiAiService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.trim().isBlank() && !apiKey.trim().equals("your_gemini_api_key_here");
    }

    public AiDtos.StatusResponse getStatus() {
        boolean configured = isConfigured();
        String activeModel = resolveModelName();
        String message = configured
            ? "Medora AI is operational and ready to assist."
            : "Medora AI is currently unconfigured. Set the GEMINI_API_KEY environment variable to enable.";
        return new AiDtos.StatusResponse(configured, activeModel, message);
    }

    private String resolveModelName() {
        if (modelName == null || modelName.isBlank() || modelName.equalsIgnoreCase("gemini-2.5-flash")) {
            return "gemini-3.5-flash";
        }
        return modelName.trim();
    }

    public AiDtos.ChatResponse chat(String userMessage, String userIdentifier, String role) {
        if (userMessage == null || userMessage.trim().isBlank()) {
            return AiDtos.ChatResponse.error("Message cannot be empty.");
        }

        String sanitized = userMessage.trim();
        if (sanitized.length() > 2000) {
            return AiDtos.ChatResponse.error("Message length exceeds the 2000 character limit.");
        }

        if (!isConfigured()) {
            return AiDtos.ChatResponse.error(
                "Medora AI is currently unconfigured. Please configure the GEMINI_API_KEY environment variable on the server."
            );
        }

        // Apply sliding rate limiting (25 messages per minute per user/role)
        String rateKey = (userIdentifier != null && !userIdentifier.isBlank()) ? userIdentifier : "ANONYMOUS";
        if (!allowRequest(rateKey)) {
            return AiDtos.ChatResponse.error(
                "You have sent several messages in a short time. Please wait a moment before sending another query."
            );
        }

        String activeModel = resolveModelName();

        try {
            return executeGeminiCall(sanitized, activeModel);
        } catch (java.net.http.HttpTimeoutException timeoutEx) {
            log.warn("Gemini API request timed out after {} seconds.", timeoutSeconds);
            return AiDtos.ChatResponse.error(
                "Medora AI took too long to respond. Please try asking again."
            );
        } catch (Exception ex) {
            log.error("Error communicating with Gemini API: {}", ex.getMessage());
            return AiDtos.ChatResponse.error(
                "An unexpected network error occurred while communicating with Medora AI."
            );
        }
    }

    private AiDtos.ChatResponse executeGeminiCall(String sanitized, String activeModel) throws Exception {
        String encodedKey = URLEncoder.encode(apiKey.trim(), StandardCharsets.UTF_8);
        String url = String.format(
            "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
            activeModel, encodedKey
        );

        Map<String, Object> requestPayload = Map.of(
            "system_instruction", Map.of(
                "parts", List.of(Map.of("text", SYSTEM_INSTRUCTION))
            ),
            "contents", List.of(
                Map.of(
                    "role", "user",
                    "parts", List.of(Map.of("text", sanitized))
                )
            ),
            "generationConfig", Map.of(
                "maxOutputTokens", 800,
                "temperature", 0.7,
                "topP", 0.95
            )
        );

        String requestBodyJson = objectMapper.writeValueAsString(requestPayload);

        HttpRequest httpRequest = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .header("Content-Type", "application/json")
            .header("Accept", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(requestBodyJson))
            .timeout(Duration.ofSeconds(Math.max(5, timeoutSeconds)))
            .build();

        HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
        int statusCode = response.statusCode();

        if (statusCode == 200) {
            return parseGeminiResponse(response.body(), activeModel);
        }

        // Graceful fallback to gemini-3.5-flash if selected model returned 404/503
        if ((statusCode == 404 || statusCode == 503) && !activeModel.equals("gemini-3.5-flash")) {
            log.warn("Model {} returned HTTP {}. Retrying with fallback model gemini-3.5-flash...", activeModel, statusCode);
            return executeGeminiCall(sanitized, "gemini-3.5-flash");
        }

        if (statusCode == 429) {
            log.warn("Gemini API rate limit / quota exceeded (HTTP 429).");
            return AiDtos.ChatResponse.error(
                "Medora AI is currently receiving high demand. Please try again in a few moments."
            );
        }

        if (statusCode == 400 || statusCode == 403) {
            log.error("Gemini API authentication/request failure with HTTP status code: {}", statusCode);
            return AiDtos.ChatResponse.error(
                "Unable to authenticate with the AI service. Please verify the server GEMINI_API_KEY configuration."
            );
        }

        log.error("Gemini API returned unexpected HTTP status: {}", statusCode);
        return AiDtos.ChatResponse.error(
            "The AI service encountered an unexpected error. Please try again shortly."
        );
    }

    private AiDtos.ChatResponse parseGeminiResponse(String responseJson, String model) {
        try {
            JsonNode root = objectMapper.readTree(responseJson);
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                JsonNode parts = candidates.get(0).path("content").path("parts");
                if (parts.isArray() && !parts.isEmpty()) {
                    String replyText = parts.get(0).path("text").asText();
                    if (replyText != null && !replyText.isBlank()) {
                        return AiDtos.ChatResponse.ok(replyText.trim(), model);
                    }
                }
            }
            return AiDtos.ChatResponse.error("Medora AI returned an empty response. Please rephrase your query.");
        } catch (Exception ex) {
            log.error("Failed to parse Gemini API JSON response: {}", ex.getMessage());
            return AiDtos.ChatResponse.error("Failed to interpret the AI response format.");
        }
    }

    private boolean allowRequest(String userKey) {
        long now = System.currentTimeMillis();
        UserRateBucket bucket = rateLimiters.computeIfAbsent(userKey, k -> new UserRateBucket(now));
        synchronized (bucket) {
            if (now - bucket.windowStartMs > 60_000L) {
                bucket.count = 0;
                bucket.windowStartMs = now;
            }
            if (bucket.count >= 25) {
                return false;
            }
            bucket.count++;
            return true;
        }
    }

    private static class UserRateBucket {
        int count;
        long windowStartMs;

        UserRateBucket(long now) {
            this.count = 0;
            this.windowStartMs = now;
        }
    }
}
