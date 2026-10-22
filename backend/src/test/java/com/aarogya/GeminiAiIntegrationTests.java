package com.aarogya;

import com.aarogya.dto.AiDtos;
import com.aarogya.service.GeminiAiService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class GeminiAiIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private GeminiAiService geminiAiService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("AI status endpoint should be publicly accessible and return unconfigured when no key is set")
    void testAiStatusEndpointPublic() throws Exception {
        mockMvc.perform(get("/api/v1/ai/status"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.model").value("gemini-3.5-flash"))
            .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    @DisplayName("AI chat endpoint without authentication should be rejected with 401/403")
    void testAiChatRequiresAuthentication() throws Exception {
        AiDtos.ChatRequest request = new AiDtos.ChatRequest("How do I book an appointment?");

        mockMvc.perform(post("/api/v1/ai/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "patient@aarogyacare.org", roles = {"PATIENT"})
    @DisplayName("AI chat endpoint when authenticated with blank message should return unprocessable entity (422)")
    void testAiChatValidationBlankMessage() throws Exception {
        AiDtos.ChatRequest request = new AiDtos.ChatRequest("");

        mockMvc.perform(post("/api/v1/ai/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isUnprocessableEntity());
    }

    @Test
    @WithMockUser(username = "patient@aarogyacare.org", roles = {"PATIENT"})
    @DisplayName("AI chat endpoint when authenticated but unconfigured returns graceful error without crashing")
    void testAiChatGracefulUnconfiguredResponse() throws Exception {
        AiDtos.ChatRequest request = new AiDtos.ChatRequest("What are hospital visiting hours?");

        mockMvc.perform(post("/api/v1/ai/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error").isNotEmpty());
    }

    @Test
    @DisplayName("GeminiAiService validates maximum message length directly")
    void testServiceRejectsExcessiveLength() {
        String longMessage = "A".repeat(2500);
        AiDtos.ChatResponse response = geminiAiService.chat(longMessage, "user-123", "PATIENT");
        assertThat(response.success()).isFalse();
        assertThat(response.error()).contains("exceeds the 2000 character limit");
    }

    @Test
    @DisplayName("GeminiAiService returns false for isConfigured when placeholder key is used")
    void testIsConfiguredBehavior() {
        // In local test context without real GEMINI_API_KEY set
        assertThat(geminiAiService.isConfigured()).isFalse();
        AiDtos.StatusResponse status = geminiAiService.getStatus();
        assertThat(status.configured()).isFalse();
        assertThat(status.model()).isEqualTo("gemini-3.5-flash");
    }
}
