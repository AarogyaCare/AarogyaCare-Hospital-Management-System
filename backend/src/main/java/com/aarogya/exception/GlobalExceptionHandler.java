package com.aarogya.exception;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exceptions.ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(Exceptions.ResourceNotFoundException ex) {
        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(Exceptions.ConflictException.class)
    public ResponseEntity<Map<String, Object>> handleConflict(Exceptions.ConflictException ex) {
        return buildResponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(Exceptions.BadRequestException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(Exceptions.BadRequestException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(Exceptions.UnauthorizedException.class)
    public ResponseEntity<Map<String, Object>> handleUnauthorized(Exceptions.UnauthorizedException ex) {
        return buildResponse(HttpStatus.UNAUTHORIZED, ex.getMessage());
    }

    @ExceptionHandler(Exceptions.ForbiddenException.class)
    public ResponseEntity<Map<String, Object>> handleForbidden(Exceptions.ForbiddenException ex) {
        return buildResponse(HttpStatus.FORBIDDEN, ex.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        return buildResponse(HttpStatus.FORBIDDEN, "Access denied: insufficient operational role permissions.");
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException ex) {
        return buildResponse(HttpStatus.UNAUTHORIZED, "Invalid authentication credentials.");
    }

    @ExceptionHandler(Exceptions.RateLimitExceededException.class)
    public ResponseEntity<Map<String, Object>> handleRateLimit(Exceptions.RateLimitExceededException ex) {
        HttpHeaders headers = new HttpHeaders();
        headers.add("Retry-After", String.valueOf(ex.getRetryAfterSeconds()));
        Map<String, Object> body = new HashMap<>();
        body.put("status", "error");
        body.put("code", HttpStatus.TOO_MANY_REQUESTS.value());
        body.put("message", ex.getMessage());
        body.put("retry_after", ex.getRetryAfterSeconds());
        body.put("timestamp", Instant.now().toString());
        return new ResponseEntity<>(body, headers, HttpStatus.TOO_MANY_REQUESTS);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(error.getField(), error.getDefaultMessage());
        }
        Map<String, Object> body = new HashMap<>();
        body.put("status", "error");
        body.put("code", HttpStatus.UNPROCESSABLE_ENTITY.value());
        body.put("message", "Validation failed for request payload.");
        body.put("errors", fieldErrors);
        body.put("timestamp", Instant.now().toString());
        return new ResponseEntity<>(body, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneralException(Exception ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("status", "error");
        body.put("code", HttpStatus.INTERNAL_SERVER_ERROR.value());
        body.put("message", "An unexpected system error occurred. Please contact hospital administrator.");
        body.put("detail", ex.getMessage());
        body.put("timestamp", Instant.now().toString());
        return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private ResponseEntity<Map<String, Object>> buildResponse(HttpStatus status, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("status", "error");
        body.put("code", status.value());
        body.put("message", message);
        body.put("timestamp", Instant.now().toString());
        return new ResponseEntity<>(body, status);
    }
}
