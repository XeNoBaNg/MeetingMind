package com.meetingmind.user.service;

import com.meetingmind.common.exception.UserAlreadyExistsException;
import com.meetingmind.user.entity.User;
import com.meetingmind.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public User createUser(String username, String email, String rawPassword) {
        if (email != null) {
            java.util.Optional<User> existingUserOpt = userRepository.findByEmail(email);
            if (existingUserOpt.isPresent()) {
                User existingUser = existingUserOpt.get();
                // If account exists but has no password (e.g. from Google OAuth), let them claim it
                if (existingUser.getPasswordHash() == null || existingUser.getPasswordHash().isEmpty()) {
                    
                    // Allow them to choose a new username if it's different from the auto-generated one
                    if (!existingUser.getUsername().equals(username)) {
                        if (userRepository.existsByUsername(username)) {
                            throw new UserAlreadyExistsException("Username '" + username + "' is already taken.");
                        }
                        existingUser.setUsername(username);
                    }
                    
                    existingUser.setPasswordHash(passwordEncoder.encode(rawPassword));
                    // Now they can log in manually or with Google
                    existingUser.setAuthProvider(com.meetingmind.user.entity.AuthProvider.LOCAL); 
                    return userRepository.save(existingUser);
                } else {
                    throw new UserAlreadyExistsException("User with email '" + email + "' already exists.");
                }
            }
        }

        if (userRepository.existsByUsername(username)) {
            throw new UserAlreadyExistsException("User with username '" + username + "' already exists.");
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setAuthProvider(com.meetingmind.user.entity.AuthProvider.LOCAL);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));

        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new com.meetingmind.common.exception.ResourceNotFoundException("User not found: " + username));
    }

    @Transactional
    public User createOAuthUser(String email, String providerId) {
        String baseUsername = email != null && email.contains("@") 
                ? email.substring(0, email.indexOf("@")) 
                : "user";
        
        String username = baseUsername;
        int suffix = 1;
        while (userRepository.existsByUsername(username)) {
            username = baseUsername + "_" + suffix++;
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setAuthProvider(com.meetingmind.user.entity.AuthProvider.GOOGLE);
        user.setProviderId(providerId);

        return userRepository.save(user);
    }
}
