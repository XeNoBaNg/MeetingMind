package com.meetingmind.auth.config;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "meetingmind.security.jwt")
public class JwtProperties {

    private String secret;
    private long expirationMs = 86400000L;

    @PostConstruct
    public void validate() {
        if (secret == null || secret.trim().isEmpty()) {
            throw new IllegalStateException("JWT secret must be configured via 'meetingmind.security.jwt.secret' / JWT_SECRET");
        }
    }

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public long getExpirationMs() {
        return expirationMs;
    }

    public void setExpirationMs(long expirationMs) {
        this.expirationMs = expirationMs;
    }
}
