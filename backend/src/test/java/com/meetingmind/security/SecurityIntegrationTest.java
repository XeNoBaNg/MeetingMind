package com.meetingmind.security;

import com.meetingmind.auth.service.JwtService;
import com.meetingmind.user.entity.User;
import com.meetingmind.user.repository.UserRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @BeforeEach
    void setUp() {
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
    void testProtectedEndpoint_WithBasicAuth_Returns401() throws Exception {
        // Verifies HTTP Basic is removed and no longer accepted
        mockMvc.perform(get("/api/meetings")
                        .with(httpBasic("testintegration", "testpassword")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testProtectedEndpoint_WithValidJwt_Returns200() throws Exception {
        String token = jwtService.generateToken("testintegration");

        mockMvc.perform(get("/api/meetings")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void testProtectedEndpoint_WithMalformedJwt_Returns401() throws Exception {
        mockMvc.perform(get("/api/meetings")
                        .header("Authorization", "Bearer malformed.token.value"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testProtectedEndpoint_WithExpiredJwt_Returns401() throws Exception {
        // Create a token expired 1 hour ago
        Date past = new Date(System.currentTimeMillis() - 3600000);
        byte[] keyBytes = "dGhpc2lzYXZlcnlsb25nc2VjcmV0a2V5Zm9ydGVzdGluZ3B1cnBvc2Vzb25seTI1NmJpdHM=".getBytes(StandardCharsets.UTF_8);
        String expiredToken = Jwts.builder()
                .subject("testintegration")
                .issuedAt(new Date(System.currentTimeMillis() - 7200000))
                .expiration(past)
                .signWith(Keys.hmacShaKeyFor(keyBytes))
                .compact();

        mockMvc.perform(get("/api/meetings")
                        .header("Authorization", "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testProtectedEndpoint_WithInvalidSignatureJwt_Returns401() throws Exception {
        byte[] wrongKey = "different-secret-key-for-testing-purposes-must-be-at-least-256-bits!".getBytes(StandardCharsets.UTF_8);
        String forgedToken = Jwts.builder()
                .subject("testintegration")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(Keys.hmacShaKeyFor(wrongKey))
                .compact();

        mockMvc.perform(get("/api/meetings")
                        .header("Authorization", "Bearer " + forgedToken))
                .andExpect(status().isUnauthorized());
    }
}
