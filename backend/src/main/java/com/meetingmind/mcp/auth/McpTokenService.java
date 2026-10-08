package com.meetingmind.mcp.auth;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;
import java.util.UUID;

@Service
public class McpTokenService {

    private final StringRedisTemplate redisTemplate;
    private final SecureRandom secureRandom = new SecureRandom();

    private static final String AUTH_CODE_PREFIX = "mcp:auth_code:";
    private static final String ACCESS_TOKEN_PREFIX = "mcp:access_token:";
    private static final Duration AUTH_CODE_TTL = Duration.ofMinutes(1);
    private static final Duration ACCESS_TOKEN_TTL = Duration.ofDays(30);

    public McpTokenService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public String generateAuthorizationCode(String userId, String clientId, String redirectUri, String codeChallenge, String scopes) {
        String code = generateOpaqueToken();
        String key = AUTH_CODE_PREFIX + code;
        
        // Store metadata as a hash or JSON. We can use hash operations.
        redisTemplate.opsForHash().put(key, "userId", userId);
        redisTemplate.opsForHash().put(key, "clientId", clientId);
        redisTemplate.opsForHash().put(key, "redirectUri", redirectUri);
        redisTemplate.opsForHash().put(key, "codeChallenge", codeChallenge);
        redisTemplate.opsForHash().put(key, "scopes", scopes);
        redisTemplate.expire(key, AUTH_CODE_TTL);
        
        return code;
    }

    public String exchangeCodeForToken(String code, String codeVerifier, String clientId, String redirectUri) {
        String key = AUTH_CODE_PREFIX + code;
        
        // Atomically remove and return (not standard in Spring Data Redis Hash, but we can verify then delete, or use a Lua script for strict atomicity)
        // Since we need to read fields, let's use MULTI/EXEC or just get then delete (which isn't strictly atomic for concurrent identical requests, but we can rename key or use Lua).
        // For simplicity and standard safety, we'll get then delete. If multiple concurrent requests hit, only one should succeed.
        // A better approach is to rename the key to a temporary key, then read. If rename fails, it was already consumed.
        
        String tempKey = key + ":consumed:" + UUID.randomUUID().toString();
        Boolean renamed = false;
        try {
            redisTemplate.rename(key, tempKey);
            renamed = true;
        } catch (Exception e) {
            // Rename fails if key does not exist.
            throw new IllegalArgumentException("Invalid or expired authorization code.");
        }

        if (!renamed) {
            throw new IllegalArgumentException("Invalid or expired authorization code.");
        }

        String storedUserId = (String) redisTemplate.opsForHash().get(tempKey, "userId");
        String storedClientId = (String) redisTemplate.opsForHash().get(tempKey, "clientId");
        String storedRedirectUri = (String) redisTemplate.opsForHash().get(tempKey, "redirectUri");
        String storedCodeChallenge = (String) redisTemplate.opsForHash().get(tempKey, "codeChallenge");
        String storedScopes = (String) redisTemplate.opsForHash().get(tempKey, "scopes");
        
        // Delete the temp key to ensure single-use
        redisTemplate.delete(tempKey);

        if (!clientId.equals(storedClientId) || !redirectUri.equals(storedRedirectUri)) {
            throw new IllegalArgumentException("Client ID or Redirect URI mismatch.");
        }

        // Validate PKCE code_verifier against stored codeChallenge (S256)
        if (!validateCodeChallenge(codeVerifier, storedCodeChallenge)) {
            throw new IllegalArgumentException("Invalid PKCE code_verifier.");
        }

        // Generate access token
        String accessToken = generateOpaqueToken();
        String tokenKey = ACCESS_TOKEN_PREFIX + accessToken;
        
        redisTemplate.opsForHash().put(tokenKey, "userId", storedUserId);
        redisTemplate.opsForHash().put(tokenKey, "scopes", storedScopes);
        redisTemplate.expire(tokenKey, ACCESS_TOKEN_TTL);
        
        return accessToken;
    }

    public McpTokenDetails validateAccessToken(String token) {
        String tokenKey = ACCESS_TOKEN_PREFIX + token;
        Boolean exists = redisTemplate.hasKey(tokenKey);
        if (Boolean.FALSE.equals(exists)) {
            return null;
        }
        
        String userId = (String) redisTemplate.opsForHash().get(tokenKey, "userId");
        String scopes = (String) redisTemplate.opsForHash().get(tokenKey, "scopes");
        
        return new McpTokenDetails(userId, scopes);
    }

    private boolean validateCodeChallenge(String verifier, String challenge) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(verifier.getBytes());
            String computedChallenge = Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
            return challenge.equals(computedChallenge);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    private String generateOpaqueToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
    
    public record McpTokenDetails(String userId, String scopes) {}
}
