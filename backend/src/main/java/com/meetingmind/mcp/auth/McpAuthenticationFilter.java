package com.meetingmind.mcp.auth;

import com.meetingmind.user.entity.User;
import com.meetingmind.user.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

@Component
public class McpAuthenticationFilter extends OncePerRequestFilter {

    private final McpTokenService mcpTokenService;
    private final UserRepository userRepository;
    private final UserDetailsService userDetailsService;

    public McpAuthenticationFilter(McpTokenService mcpTokenService, UserRepository userRepository, UserDetailsService userDetailsService) {
        this.mcpTokenService = mcpTokenService;
        this.userRepository = userRepository;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        final String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String token = authHeader.substring(7).trim();
        System.out.println("MCP Filter: Received token: " + token);
        
        McpTokenService.McpTokenDetails details = mcpTokenService.validateAccessToken(token);
        if (details != null) {
            System.out.println("MCP Filter: Token valid, userId=" + details.userId());
            try {
                UUID userId = UUID.fromString(details.userId());
                Optional<User> userOpt = userRepository.findById(userId);
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
                    System.out.println("MCP Filter: User details loaded: " + userDetails.getUsername());
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    System.out.println("MCP Filter: Context set!");
                } else {
                    System.out.println("MCP Filter: User not found in DB");
                }
            } catch (Exception e) {
                System.out.println("MCP Filter: Exception: " + e.getMessage());
                e.printStackTrace();
            }
        } else {
            System.out.println("MCP Filter: Token INVALID in Redis");
        }

        filterChain.doFilter(request, response);
    }
}
