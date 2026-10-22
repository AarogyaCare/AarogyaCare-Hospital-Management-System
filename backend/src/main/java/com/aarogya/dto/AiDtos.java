package com.aarogya.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AiDtos {

    public record ChatRequest(
        @NotBlank(message = "Message cannot be empty")
        @Size(max = 2000, message = "Message must not exceed 2000 characters")
        String message
    ) {}

    public record ChatResponse(
        String reply,
        boolean success,
        String error,
        @JsonProperty("model_used") String modelUsed
    ) {
        public static ChatResponse ok(String reply, String model) {
            return new ChatResponse(reply, true, null, model);
        }

        public static ChatResponse error(String error) {
            return new ChatResponse(null, false, error, null);
        }
    }

    public record StatusResponse(
        boolean configured,
        String model,
        String message
    ) {}
}
