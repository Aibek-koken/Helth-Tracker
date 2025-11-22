package com.helthtracer.repository;

import com.helthtracer.model.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    void findByUsernameShouldReturnUser() {
        // Given
        User user = new User();
        user.setUsername("testuser123"); // Уникальное имя
        user.setEmail("test123@example.com"); // Уникальный email
        user.setPassword("password");
        userRepository.save(user);

        // When
        Optional<User> found = userRepository.findByUsername("testuser123");

        // Then
        assertTrue(found.isPresent());
        assertEquals("testuser123", found.get().getUsername());
    }

    @Test
    void existsByUsernameShouldReturnTrueForExistingUser() {
        // Given
        User user = new User();
        user.setUsername("existinguser456"); // Уникальное имя
        user.setEmail("exist456@example.com"); // Уникальный email
        user.setPassword("password");
        userRepository.save(user);

        // When & Then
        assertTrue(userRepository.existsByUsername("existinguser456"));
        assertFalse(userRepository.existsByUsername("nonexistent"));
    }
}