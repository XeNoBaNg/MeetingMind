package com.meetingmind.auth.security;

import com.meetingmind.user.entity.User;
import com.meetingmind.user.repository.UserRepository;
import com.meetingmind.user.service.UserService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Component
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final UserService userService;
    private final StringRedisTemplate redisTemplate;

    @Value("${meetingmind.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public OAuth2LoginSuccessHandler(UserRepository userRepository, UserService userService, StringRedisTemplate redisTemplate) {
        this.userRepository = userRepository;
        this.userService = userService;
        this.redisTemplate = redisTemplate;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        String providerId = null;
        String email = null;

        if (authentication.getPrincipal() instanceof OidcUser oidcUser) {
            providerId = oidcUser.getSubject();
            email = oidcUser.getEmail();
        } else if (authentication.getPrincipal() instanceof OAuth2User oauth2User) {
            providerId = oauth2User.getAttribute("sub");
            email = oauth2User.getAttribute("email");
        }

        if (providerId == null) {
            getRedirectStrategy().sendRedirect(request, response, frontendUrl + "/login?error=oauth2_missing_id");
            return;
        }

        Optional<User> userOpt = userRepository.findByProviderId(providerId);
        User user;

        if (userOpt.isPresent()) {
            user = userOpt.get();
        } else {
            // New Google account, check if email matches an existing local account
            if (email != null) {
                Optional<User> emailMatch = userRepository.findByEmail(email);
                if (emailMatch.isPresent()) {
                    // Account Linking: Link the Google Provider ID to the existing account
                    user = emailMatch.get();
                    user.setAuthProvider(com.meetingmind.user.entity.AuthProvider.GOOGLE);
                    user.setProviderId(providerId);
                    userRepository.save(user);
                } else {
                    // Safe to create brand new user
                    user = userService.createOAuthUser(email, providerId);
                }
            } else {
                // No email provided by Google (rare), just create
                user = userService.createOAuthUser(null, providerId);
            }
        }

        // Generate one-time exchange code
        String exchangeCode = UUID.randomUUID().toString();
        
        // Store in Redis with 5 minutes TTL
        redisTemplate.opsForValue().set("oauth_exchange:" + exchangeCode, user.getId().toString(), 5, TimeUnit.MINUTES);

        // Redirect to frontend
        String targetUrl = frontendUrl + "/oauth-callback?code=" + exchangeCode;
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
