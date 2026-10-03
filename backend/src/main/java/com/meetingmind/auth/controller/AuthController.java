package com.meetingmind.auth.controller;

import com.meetingmind.auth.dto.LoginRequest;
import com.meetingmind.auth.dto.LoginResponse;
import com.meetingmind.auth.dto.RegisterRequest;
import com.meetingmind.auth.dto.RegisterResponse;
import com.meetingmind.auth.service.JwtService;
import com.meetingmind.user.entity.User;
import com.meetingmind.user.repository.UserRepository;
import com.meetingmind.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    public AuthController(UserService userService,
                          AuthenticationManager authenticationManager,
                          UserRepository userRepository,
                          JwtService jwtService) {
        this.userService = userService;
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        User createdUser = userService.createUser(request.getUsername(), request.getPassword());
        
        RegisterResponse response = new RegisterResponse(
                createdUser.getId(),
                createdUser.getUsername(),
                createdUser.getCreatedAt()
        );
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        
        // Fetch User entity to get the UUID, we know the user exists because authentication succeeded
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new IllegalStateException("User not found after successful authentication"));
        
        String token = jwtService.generateToken(user.getUsername());

        LoginResponse response = new LoginResponse(
                user.getId(),
                user.getUsername(),
                token,
                "Login successful"
        );
        
        return ResponseEntity.ok(response);
    }
}
