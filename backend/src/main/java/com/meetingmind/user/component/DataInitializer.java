package com.meetingmind.user.component;

import com.meetingmind.user.repository.UserRepository;
import com.meetingmind.user.service.UserService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer {

    private final UserService userService;
    private final UserRepository userRepository;

    @Value("${meetingmind.security.bootstrap-user.enabled:false}")
    private boolean bootstrapEnabled;

    @Value("${meetingmind.security.bootstrap-user.username:}")
    private String bootstrapUsername;

    @Value("${meetingmind.security.bootstrap-user.password:}")
    private String bootstrapPassword;

    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    public DataInitializer(UserService userService, UserRepository userRepository, org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void initializeData() {
        try {
            jdbcTemplate.execute("ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;");
            System.out.println("Successfully dropped NOT NULL constraint on password_hash");
        } catch (Exception e) {
            System.out.println("Constraint already dropped or error: " + e.getMessage());
        }

        if (bootstrapEnabled && bootstrapUsername != null && !bootstrapUsername.isBlank()
                && bootstrapPassword != null && !bootstrapPassword.isBlank()) {
            if (!userRepository.existsByUsername(bootstrapUsername)) {
                userService.createUser(bootstrapUsername, null, bootstrapPassword);
            }
        }
    }
}
