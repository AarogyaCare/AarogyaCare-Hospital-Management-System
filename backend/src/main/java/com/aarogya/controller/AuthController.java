package com.aarogya.controller;

import com.aarogya.dto.AuthDtos;
import com.aarogya.security.UserPrincipal;
import com.aarogya.service.AuthService;
import com.aarogya.systemdesign.ratelimiter.RateLimiterService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final RateLimiterService rateLimiterService;

    public AuthController(AuthService authService, RateLimiterService rateLimiterService) {
        this.authService = authService;
        this.rateLimiterService = rateLimiterService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthDtos.TokenResponse> login(
            @Valid @RequestBody AuthDtos.LoginRequest request,
            HttpServletRequest httpRequest) {
        String clientIp = httpRequest.getRemoteAddr();
        var limitCheck = rateLimiterService.tryAcquire(clientIp, "auth");
        if (!limitCheck.allowed()) {
            throw new com.aarogya.exception.Exceptions.RateLimitExceededException(
                "Authentication rate limit exceeded. Please retry after " + limitCheck.retryAfterSeconds() + " seconds.",
                limitCheck.retryAfterSeconds()
            );
        }

        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthDtos.TokenResponse> register(
            @Valid @RequestBody AuthDtos.RegisterRequest request,
            HttpServletRequest httpRequest) {
        String clientIp = httpRequest.getRemoteAddr();
        var limitCheck = rateLimiterService.tryAcquire(clientIp, "auth");
        if (!limitCheck.allowed()) {
            throw new com.aarogya.exception.Exceptions.RateLimitExceededException(
                "Registration rate limit exceeded. Please retry after " + limitCheck.retryAfterSeconds() + " seconds.",
                limitCheck.retryAfterSeconds()
            );
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/staff")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AuthDtos.UserDto> createStaff(
            @Valid @RequestBody AuthDtos.StaffCreateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.createStaffUser(request, principal));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthDtos.UserDto> getCurrentUser(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(authService.getCurrentUserProfile(principal));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(@AuthenticationPrincipal UserPrincipal principal) {
        String email = principal != null ? principal.getUsername() : "guest";
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "message", "Session for user '" + email + "' has been successfully terminated."
        ));
    }
}
