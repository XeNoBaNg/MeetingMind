package com.meetingmind.security;

import com.meetingmind.user.entity.User;
import com.meetingmind.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test") // Assuming test profile configures Testcontainers or H2 correctly
class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        // We set up a real user in the DB to test the CustomUserDetailsService
        User user = new User();
        user.setUsername("testintegration");
        user.setPasswordHash(passwordEncoder.encode("testpassword"));
        userRepository.save(user);
    }
    
    @AfterEach
    void tearDown() {
        userRepository.deleteAll();
    }

    @Test
    void testHealthEndpoint_IsPublic() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk());
    }

    @Test
    void testProtectedEndpoint_WithoutCredentials_Returns401() throws Exception {
        mockMvc.perform(get("/api/meetings"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testProtectedEndpoint_WithValidDatabaseCredentials_Returns200() throws Exception {
        mockMvc.perform(get("/api/meetings")
                        .with(httpBasic("testintegration", "testpassword")))
                .andExpect(status().isOk());
    }

    @Test
    void testProtectedEndpoint_WithInvalidPassword_Returns401() throws Exception {
        mockMvc.perform(get("/api/meetings")
                        .with(httpBasic("testintegration", "wrongpassword")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testProtectedEndpoint_WithNonexistentUser_Returns401() throws Exception {
        mockMvc.perform(get("/api/meetings")
                        .with(httpBasic("nonexistent", "password")))
                .andExpect(status().isUnauthorized());
    }
}
