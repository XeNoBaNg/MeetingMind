package com.meetingmind.auth.dto;

import jakarta.validation.constraints.NotBlank;

public class OAuthExchangeRequest {
    
    @NotBlank(message = "Code is required")
    private String code;

    public OAuthExchangeRequest() {}

    public OAuthExchangeRequest(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}
