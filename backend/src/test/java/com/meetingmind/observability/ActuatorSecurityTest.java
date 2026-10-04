package com.meetingmind.observability;

import com.meetingmind.auth.service.JwtService;
import com.meetingmind.user.entity.User;
import com.meetingmind.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ActuatorSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private String validToken;

    @BeforeEach
    void setUp() {
        User user = new User();
        user.setUsername("actuatortestuser");
        user.setPasswordHash(passwordEncoder.encode("secretpassword"));
        userRepository.save(user);

        validToken = jwtService.generateToken("actuatortestuser");
    }

    @AfterEach
    void tearDown() {
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("1. GET /actuator/health is publicly accessible and returns status")
    void healthEndpointIsPublic() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").exists());
    }

    @Test
    @DisplayName("2. GET /actuator/health/liveness is publicly accessible")
    void livenessProbeIsPublic() throws Exception {
        mockMvc.perform(get("/actuator/health/liveness"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    @DisplayName("3. GET /actuator/health/readiness is publicly accessible")
    void readinessProbeIsPublic() throws Exception {
        mockMvc.perform(get("/actuator/health/readiness"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    @DisplayName("4. GET /actuator/prometheus is protected and returns 401 without JWT")
    void prometheusEndpointRequiresAuth() throws Exception {
        mockMvc.perform(get("/actuator/prometheus"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("5. GET /actuator/prometheus returns 200 with valid JWT")
    void prometheusEndpointAccessibleWithAuth() throws Exception {
        mockMvc.perform(get("/actuator/prometheus")
                        .header("Authorization", "Bearer " + validToken))
                .andDo(org.springframework.test.web.servlet.result.MockMvcResultHandlers.print())
                .andExpect(status().isOk());
    }
}
