package com.meetingmind.auth.dto;

import java.util.UUID;

public class LoginResponse {

    private UUID id;
    private String username;
    private String token;
    private String message;

    public LoginResponse() {
    }

    public LoginResponse(UUID id, String username, String token, String message) {
        this.id = id;
        this.username = username;
        this.token = token;
        this.message = message;
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

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
