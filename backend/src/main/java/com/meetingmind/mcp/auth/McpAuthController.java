package com.meetingmind.mcp.auth;

import com.meetingmind.user.entity.User;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;

@RestController
@RequestMapping("/api/mcp")
public class McpAuthController {

    private final McpTokenService mcpTokenService;
    private final com.meetingmind.user.repository.UserRepository userRepository;

    public McpAuthController(McpTokenService mcpTokenService, com.meetingmind.user.repository.UserRepository userRepository) {
        this.mcpTokenService = mcpTokenService;
        this.userRepository = userRepository;
    }
        
    public record AuthorizeRequest(
            String clientId,
            String redirectUri,
            String codeChallenge,
            String scope,
            String state
    ) {}

    @PostMapping("/authorize")
    public ResponseEntity<Map<String, String>> authorize(
            @RequestBody AuthorizeRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        // userDetails represents the user authenticated via the standard browser JWT
        String userId;
        if (userDetails instanceof User user) {
            userId = user.getId().toString();
        } else {
            User dbUser = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            userId = dbUser.getId().toString();
        }

        String authCode = mcpTokenService.generateAuthorizationCode(
                userId,
                request.clientId(),
                request.redirectUri(),
                request.codeChallenge(),
                request.scope()
        );

        String redirectUrl = UriComponentsBuilder.fromUriString(request.redirectUri())
                .queryParam("code", authCode)
                .queryParam("state", request.state())
                .build().toUriString();

        return ResponseEntity.ok(Map.of("redirectUrl", redirectUrl));
    }

    public record TokenRequest(
            String code,
            String code_verifier,
            String client_id,
            String redirect_uri,
            String grant_type
    ) {}

    @PostMapping("/token")
    public ResponseEntity<Map<String, String>> token(@RequestBody TokenRequest request) {
        if (!"authorization_code".equals(request.grant_type())) {
            return ResponseEntity.badRequest().body(Map.of("error", "unsupported_grant_type"));
        }

        try {
            String accessToken = mcpTokenService.exchangeCodeForToken(
                    request.code(),
                    request.code_verifier(),
                    request.client_id(),
                    request.redirect_uri()
            );

            return ResponseEntity.ok(Map.of(
                    "access_token", accessToken,
                    "token_type", "Bearer",
                    "expires_in", String.valueOf(30 * 24 * 60 * 60) // 30 days
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
