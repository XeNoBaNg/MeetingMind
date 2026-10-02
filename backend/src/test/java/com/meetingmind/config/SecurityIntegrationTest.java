package com.meetingmind.config;

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
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

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
                .andExpect(status().isUnauthorized())
                .andExpect(header().exists("WWW-Authenticate"));
    }

    @Test
    @DisplayName("c. Protected API endpoint is accessible with valid development Basic Auth")
    void protectedMeetingsEndpointReturns200WithBasicAuth() throws Exception {
        when(meetingService.getAllMeetings()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/meetings")
                        .with(httpBasic("devuser", "devpassword")))
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
    @DisplayName("e. Authenticated SSE access reaches the endpoint successfully")
    void sseEndpointSucceedsWithBasicAuth() throws Exception {
        UUID meetingId = UUID.randomUUID();
        when(meetingSseService.subscribe(any(UUID.class))).thenReturn(new SseEmitter());

        mockMvc.perform(get("/api/meetings/{id}/events", meetingId)
                        .with(httpBasic("devuser", "devpassword"))
                        .accept(MediaType.TEXT_EVENT_STREAM))
                .andExpect(status().isOk())
                .andExpect(request().asyncStarted());
    }
}
