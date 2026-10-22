package com.aarogya.controller;

import com.aarogya.dto.AiDtos;
import com.aarogya.security.UserPrincipal;
import com.aarogya.service.GeminiAiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ai")
@Tag(name = "Medora AI Assistant", description = "Endpoints for the Gemini-powered intelligent healthcare assistant")
public class AiController {

    private final GeminiAiService geminiAiService;

    public AiController(GeminiAiService geminiAiService) {
        this.geminiAiService = geminiAiService;
    }

    @GetMapping("/status")
    @Operation(summary = "Check Medora AI service configuration and model status")
    public ResponseEntity<AiDtos.StatusResponse> getStatus() {
        return ResponseEntity.ok(geminiAiService.getStatus());
    }

    @PostMapping("/chat")
    @Operation(summary = "Send a message to Medora AI assistant")
    public ResponseEntity<AiDtos.ChatResponse> chat(
            @Valid @RequestBody AiDtos.ChatRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        String userId = (principal != null) ? principal.getId() : "ANONYMOUS";
        String role = (principal != null) ? principal.getRole() : "GUEST";
        AiDtos.ChatResponse response = geminiAiService.chat(request.message(), userId, role);
        return ResponseEntity.ok(response);
    }
}
