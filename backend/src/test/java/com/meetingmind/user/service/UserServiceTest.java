package com.meetingmind.user.service;

import com.meetingmind.common.exception.UserAlreadyExistsException;
import com.meetingmind.user.entity.User;
import com.meetingmind.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, passwordEncoder);
    }

    @Test
    void createUser_WithNewUsername_SavesEncodedPassword() {
        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(passwordEncoder.encode("rawpass")).thenReturn("encodedpass");
        
        User savedUser = new User();
        savedUser.setUsername("newuser");
        savedUser.setPasswordHash("encodedpass");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        User result = userService.createUser("newuser", "rawpass");

        assertThat(result.getUsername()).isEqualTo("newuser");
        assertThat(result.getPasswordHash()).isEqualTo("encodedpass");

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        
        User capturedUser = userCaptor.getValue();
        assertThat(capturedUser.getUsername()).isEqualTo("newuser");
        assertThat(capturedUser.getPasswordHash()).isEqualTo("encodedpass");
        assertThat(capturedUser.getPasswordHash()).isNotEqualTo("rawpass"); // Raw password is not saved
    }

    @Test
    void createUser_WithExistingUsername_ThrowsException() {
        when(userRepository.existsByUsername("existinguser")).thenReturn(true);

        assertThatThrownBy(() -> userService.createUser("existinguser", "rawpass"))
                .isInstanceOf(UserAlreadyExistsException.class)
                .hasMessageContaining("already exists");

        verify(userRepository, never()).save(any(User.class));
    }
}
