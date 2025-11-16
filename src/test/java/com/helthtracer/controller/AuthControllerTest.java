package com.helthtracer.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.helthtracer.model.User;
import com.helthtracer.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        // Очищаем базу перед каждым тестом
        userRepository.deleteAll();
    }

    @Test
    void loginWithValidCredentialsShouldReturnSuccess() throws Exception {
        // Сначала создаем тестового пользователя с уникальными данными
        User user = new User();
        user.setUsername("uniqueuser");
        user.setEmail("unique@example.com");
        user.setPassword("password123");
        userRepository.save(user);

        // Тестируем логин
        String loginRequest = "{\"username\":\"uniqueuser\",\"password\":\"password123\"}";

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginRequest))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.user.username").value("uniqueuser"));
    }

    @Test
    void loginWithInvalidCredentialsShouldReturnError() throws Exception {
        String loginRequest = "{\"username\":\"nonexistent\",\"password\":\"wrongpass\"}";

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginRequest))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }
}