package com.meetingmind.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.meetingmind.mcp.auth.McpTokenService;
import com.meetingmind.user.entity.User;
import com.meetingmind.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class McpAuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private McpTokenService mcpTokenService;

    private User testUser;
    
    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        testUser = new User();
        testUser.setUsername("mcpuser");
        testUser.setPasswordHash(passwordEncoder.encode("password"));
        testUser = userRepository.save(testUser);
    }

    @Test
    @WithMockUser(username = "mcpuser")
    void testValidAuthorizationAndTokenExchange() throws Exception {
        // 1. Authorize (consent)
        Map<String, String> authReq = Map.of(
            "clientId", "mcp-test-client",
            "redirectUri", "http://localhost/callback",
            "codeChallenge", "test-challenge",
            "scope", "all",
            "state", "test-state"
        );

        MvcResult result = mockMvc.perform(post("/api/mcp/authorize")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(authReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.redirectUrl").exists())
            .andReturn();

        String redirectUrl = objectMapper.readTree(result.getResponse().getContentAsString()).get("redirectUrl").asText();
        assertTrue(redirectUrl.startsWith("http://localhost/callback"));
        assertTrue(redirectUrl.contains("state=test-state"));
        
        // Extract code from redirectUrl
        String code = redirectUrl.split("code=")[1].split("&")[0];

        // 2. Token exchange
        Map<String, String> tokenReq = Map.of(
            "grant_type", "authorization_code",
            "client_id", "mcp-test-client",
            "redirect_uri", "http://localhost/callback",
            "code", code,
            "code_verifier", "wrong-verifier" // We don't have real S256 here, but in our mocked valid PKCE test we will. Wait, test-challenge is not a valid SHA-256 base64.
        );
        // The token exchange will fail because "wrong-verifier" doesn't hash to "test-challenge".
        mockMvc.perform(post("/api/mcp/token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(tokenReq)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("Invalid PKCE code_verifier."));
    }

    @Test
    @WithMockUser(username = "mcpuser")
    void testValidPkceFlow() throws Exception {
        // "test" -> SHA256 -> base64url is "n4bQgYhMfWWaL-qgxVrQFaO_TxsrC4Is0V1sFbDwCgg"
        String verifier = "test";
        String challenge = "n4bQgYhMfWWaL-qgxVrQFaO_TxsrC4Is0V1sFbDwCgg";

        Map<String, String> authReq = Map.of(
            "clientId", "client1",
            "redirectUri", "http://callback",
            "codeChallenge", challenge,
            "scope", "all",
            "state", "state1"
        );

        MvcResult result = mockMvc.perform(post("/api/mcp/authorize")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(authReq)))
            .andExpect(status().isOk())
            .andReturn();

        String url = objectMapper.readTree(result.getResponse().getContentAsString()).get("redirectUrl").asText();
        String code = url.split("code=")[1].split("&")[0];

        Map<String, String> tokenReq = Map.of(
            "grant_type", "authorization_code",
            "client_id", "client1",
            "redirect_uri", "http://callback",
            "code", code,
            "code_verifier", verifier
        );

        MvcResult tokenResult = mockMvc.perform(post("/api/mcp/token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(tokenReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.access_token").exists())
            .andReturn();
            
        String accessToken = objectMapper.readTree(tokenResult.getResponse().getContentAsString()).get("access_token").asText();
        
        // 3. Test MCP Token validation and identity extraction
        // Assuming /api/meetings requires auth
        mockMvc.perform(get("/api/meetings")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "mcpuser")
    void testConcurrentAuthorizationCodeReplay() throws Exception {
        String verifier = "test";
        String challenge = "n4bQgYhMfWWaL-qgxVrQFaO_TxsrC4Is0V1sFbDwCgg";

        String code = mcpTokenService.generateAuthorizationCode(testUser.getId().toString(), "client1", "http://callback", challenge, "all");
        
        int numThreads = 10;
        ExecutorService executor = Executors.newFixedThreadPool(numThreads);
        CountDownLatch latch = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(numThreads);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failCount = new AtomicInteger(0);

        for (int i = 0; i < numThreads; i++) {
            executor.submit(() -> {
                try {
                    latch.await();
                    Map<String, String> tokenReq = Map.of(
                        "grant_type", "authorization_code",
                        "client_id", "client1",
                        "redirect_uri", "http://callback",
                        "code", code,
                        "code_verifier", verifier
                    );
                    mockMvc.perform(post("/api/mcp/token")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(tokenReq)))
                        .andDo(result -> {
                            if (result.getResponse().getStatus() == 200) {
                                successCount.incrementAndGet();
                            } else {
                                failCount.incrementAndGet();
                            }
                        });
                } catch (Exception e) {
                    failCount.incrementAndGet();
                } finally {
                    done.countDown();
                }
            });
        }
        
        latch.countDown();
        done.await();
        
        assertEquals(1, successCount.get(), "Only one token exchange should succeed");
        assertEquals(9, failCount.get(), "Nine token exchanges should fail");
    }
}
