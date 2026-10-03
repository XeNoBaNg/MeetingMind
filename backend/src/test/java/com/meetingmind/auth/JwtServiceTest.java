package com.meetingmind.auth;

import com.meetingmind.auth.config.JwtProperties;
import com.meetingmind.auth.service.JwtService;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;
    private JwtProperties jwtProperties;

    @BeforeEach
    void setUp() {
        jwtProperties = new JwtProperties();
        jwtProperties.setSecret("dGhpc2lzYXZlcnlsb25nc2VjcmV0a2V5Zm9ydGVzdGluZ3B1cnBvc2Vzb25seTI1NmJpdHM=");
        jwtProperties.setExpirationMs(3600000L); // 1 hour
        jwtService = new JwtService(jwtProperties);
    }

    @Test
    void generateToken_andExtractUsername_succeeds() {
        String token = jwtService.generateToken("alice");
        assertNotNull(token);
        assertFalse(token.isBlank());

        String username = jwtService.extractUsername(token);
        assertEquals("alice", username);
    }

    @Test
    void validateToken_withMatchingUser_returnsTrue() {
        String token = jwtService.generateToken("alice");
        UserDetails userDetails = new User("alice", "password", Collections.emptyList());

        assertTrue(jwtService.validateToken(token, userDetails));
    }

    @Test
    void validateToken_withDifferentUser_returnsFalse() {
        String token = jwtService.generateToken("alice");
        UserDetails userDetails = new User("bob", "password", Collections.emptyList());

        assertFalse(jwtService.validateToken(token, userDetails));
    }

    @Test
    void extractClaims_fromMalformedToken_throwsJwtException() {
        assertThrows(JwtException.class, () -> jwtService.extractUsername("malformed.jwt.token"));
    }

    @Test
    void jwtProperties_missingSecret_throwsIllegalStateException() {
        JwtProperties emptyProps = new JwtProperties();
        emptyProps.setSecret(null);

        assertThrows(IllegalStateException.class, emptyProps::validate);
    }
}
