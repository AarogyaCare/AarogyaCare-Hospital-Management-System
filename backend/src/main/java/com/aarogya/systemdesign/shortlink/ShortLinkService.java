package com.aarogya.systemdesign.shortlink;

import com.aarogya.exception.Exceptions;
import com.aarogya.model.ShortLinkDocument;
import com.aarogya.repository.ShortLinkRepository;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
public class ShortLinkService {

    private static final String BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final int CODE_LENGTH = 6;
    private final ShortLinkRepository shortLinkRepository;
    private final SecureRandom random = new SecureRandom();

    public ShortLinkService(ShortLinkRepository shortLinkRepository) {
        this.shortLinkRepository = shortLinkRepository;
    }

    public ShortLinkDocument createShortLink(String targetUrl, String resourceType, String resourceId, Long ttlSeconds) {
        validateDestinationUrl(targetUrl);

        String code = generateUniqueCode();
        Instant expiresAt = ttlSeconds != null && ttlSeconds > 0
                ? Instant.now().plus(ttlSeconds, ChronoUnit.SECONDS)
                : Instant.now().plus(30, ChronoUnit.DAYS);

        ShortLinkDocument doc = new ShortLinkDocument(
                UUID.randomUUID().toString(),
                code,
                targetUrl,
                resourceType,
                resourceId,
                expiresAt
        );

        return shortLinkRepository.save(doc);
    }

    public ShortLinkDocument resolveShortLink(String code) {
        ShortLinkDocument doc = shortLinkRepository.findByCode(code)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Short link not found for code: " + code));

        if ("REVOKED".equalsIgnoreCase(doc.getStatus())) {
            throw new Exceptions.ForbiddenException("This short link has been revoked by system administrator.");
        }

        if (doc.getExpiresAt() != null && doc.getExpiresAt().isBefore(Instant.now())) {
            doc.setStatus("EXPIRED");
            shortLinkRepository.save(doc);
            throw new Exceptions.BadRequestException("This short link has expired.");
        }

        doc.setClickCount(doc.getClickCount() + 1);
        return shortLinkRepository.save(doc);
    }

    public ShortLinkDocument revokeShortLink(String code) {
        ShortLinkDocument doc = shortLinkRepository.findByCode(code)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Short link not found for code: " + code));

        doc.setStatus("REVOKED");
        return shortLinkRepository.save(doc);
    }

    private void validateDestinationUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            throw new Exceptions.BadRequestException("Target URL cannot be empty.");
        }

        String lower = url.trim().toLowerCase();
        if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("file:") || lower.startsWith("vbscript:")) {
            throw new Exceptions.BadRequestException("Open redirect protection: Invalid or unsafe URL scheme detected.");
        }

        try {
            URI uri = URI.create(url.trim());
            String scheme = uri.getScheme();
            if (scheme == null || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) {
                throw new Exceptions.BadRequestException("Open redirect protection: Target URL must use HTTP or HTTPS protocol.");
            }
            if (uri.getUserInfo() != null) {
                throw new Exceptions.BadRequestException("Open redirect protection: Embedded user credentials in target URL are prohibited.");
            }
            String host = uri.getHost();
            if (host == null || host.trim().isEmpty()) {
                throw new Exceptions.BadRequestException("Target URL does not contain a valid destination host.");
            }
            if ("169.254.169.254".equals(host.trim()) || "metadata.google.internal".equalsIgnoreCase(host.trim())) {
                throw new Exceptions.BadRequestException("Open redirect protection: Targets pointing to cloud metadata services are prohibited.");
            }
        } catch (IllegalArgumentException ex) {
            throw new Exceptions.BadRequestException("Target URL format is invalid: " + ex.getMessage());
        }
    }

    private String generateUniqueCode() {
        for (int attempt = 0; attempt < 10; attempt++) {
            StringBuilder sb = new StringBuilder(CODE_LENGTH);
            for (int i = 0; i < CODE_LENGTH; i++) {
                sb.append(BASE62.charAt(random.nextInt(BASE62.length())));
            }
            String code = sb.toString();
            if (shortLinkRepository.findByCode(code).isEmpty()) {
                return code;
            }
        }
        return UUID.randomUUID().toString().substring(0, CODE_LENGTH);
    }
}
