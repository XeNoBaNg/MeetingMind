package com.meetingmind.auth.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class RegisterResponse {

    private UUID id;
    private String username;
    private LocalDateTime createdAt;

    public RegisterResponse() {
    }

    public RegisterResponse(UUID id, String username, LocalDateTime createdAt) {
        this.id = id;
        this.username = username;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
