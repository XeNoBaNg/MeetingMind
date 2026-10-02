package com.meetingmind.user.repository;

import com.meetingmind.user.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

import org.springframework.test.context.ActiveProfiles;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    void testSaveAndFindByUsername() {
        User user = new User();
        user.setUsername("testuser");
        user.setPasswordHash("hash");
        userRepository.saveAndFlush(user);

        Optional<User> found = userRepository.findByUsername("testuser");
        assertThat(found).isPresent();
        assertThat(found.get().getUsername()).isEqualTo("testuser");
    }

    @Test
    void testExistsByUsername() {
        User user = new User();
        user.setUsername("testuser2");
        user.setPasswordHash("hash");
        userRepository.saveAndFlush(user);

        assertThat(userRepository.existsByUsername("testuser2")).isTrue();
        assertThat(userRepository.existsByUsername("nonexistent")).isFalse();
    }
}
