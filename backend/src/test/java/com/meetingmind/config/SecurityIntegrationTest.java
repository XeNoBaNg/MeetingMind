package com.meetingmind.config;

import com.meetingmind.auth.service.JwtService;
import com.meetingmind.meeting.service.MeetingService;
import com.meetingmind.meeting.service.MeetingSseService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Collections;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @MockBean
    private MeetingService meetingService;

    @MockBean
    private MeetingSseService meetingSseService;

    @Test
    @DisplayName("a. GET /api/health returns 200 OK without authentication")
    void publicHealthEndpointReturns200WithoutAuth() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("b. Protected API endpoint returns 401 Unauthorized without authentication")
    void protectedMeetingsEndpointReturns401WithoutAuth() throws Exception {
        mockMvc.perform(get("/api/meetings"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("c. Protected API endpoint is accessible with valid JWT")
    void protectedMeetingsEndpointReturns200WithJwt() throws Exception {
        when(meetingService.getAllMeetings()).thenReturn(Collections.emptyList());
        String token = jwtService.generateToken("devuser");

        mockMvc.perform(get("/api/meetings")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("d. GET /api/meetings/{id}/events returns 401 Unauthorized without authentication")
    void sseEndpointReturns401WithoutAuth() throws Exception {
        UUID meetingId = UUID.randomUUID();

        mockMvc.perform(get("/api/meetings/{id}/events", meetingId)
                        .accept(MediaType.TEXT_EVENT_STREAM))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("e. Authenticated SSE access reaches the endpoint successfully with JWT")
    void sseEndpointSucceedsWithJwt() throws Exception {
        UUID meetingId = UUID.randomUUID();
        when(meetingSseService.subscribe(any(UUID.class))).thenReturn(new SseEmitter());
        String token = jwtService.generateToken("devuser");

        mockMvc.perform(get("/api/meetings/{id}/events", meetingId)
                        .header("Authorization", "Bearer " + token)
                        .accept(MediaType.TEXT_EVENT_STREAM))
                .andExpect(status().isOk())
                .andExpect(request().asyncStarted());
    }
}
