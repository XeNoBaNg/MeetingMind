package com.meetingmind.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // CSRF is disabled because this API is designed as a stateless REST service
                // where future authentication (e.g., JWT) will use Authorization headers
                // rather than browser-managed cookies.
                .csrf(csrf -> csrf.disable())
                // Delegate CORS handling to Spring MVC's configuration (such as @CrossOrigin mappings)
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(authorize -> authorize
                        // Public endpoints
                        .requestMatchers("/api/health").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()

                        // Explicitly protected business endpoints
                        .requestMatchers("/api/meetings/**").authenticated()
                        .requestMatchers("/api/action-items/**").authenticated()
                        .requestMatchers("/api/rag/**").authenticated()
                        .requestMatchers("/sse", "/mcp/message").authenticated()

                        // All other endpoints require authentication by default
                        .anyRequest().authenticated()
                )
                // Enable HTTP Basic authentication for development and testing
                .httpBasic(Customizer.withDefaults());

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
