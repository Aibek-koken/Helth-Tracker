package com.helthtracer.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.helthtracer.model.Habit;
import com.helthtracer.model.User;
import com.helthtracer.repository.HabitRepository;
import com.helthtracer.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class HabitControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private HabitRepository habitRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private User testUser;

    @BeforeEach
    void setUp() {
        // Очищаем базу перед каждым тестом
        habitRepository.deleteAll();
        userRepository.deleteAll();

        // Создаем тестового пользователя с уникальными данными
        testUser = new User();
        testUser.setUsername("habituser" + System.currentTimeMillis()); // Уникальное имя
        testUser.setEmail("habit" + System.currentTimeMillis() + "@example.com");
        testUser.setPassword("password");
        testUser = userRepository.save(testUser);
    }

    @Test
    void createHabitsShouldReturnCreateHabit() throws Exception {
        // Создаем тестового пользователя
        User testUser = new User();
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setPassword("password");
        User savedUser = userRepository.save(testUser);

        // Создаем JSON для привычки с объектом пользователя
        String habitJson = """
        {
            "title": "Morning Exercise",
            "description": "Daily morning workout", 
            "frequency": "DAILY",
            "user": {
                "id": %d
            }
        }
        """.formatted(savedUser.getId());

        mockMvc.perform(post("/api/habits")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(habitJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Morning Exercise"))
                .andExpect(jsonPath("$.frequency").value("DAILY"));
    }


    @Test
    void getUserHabitsShouldReturnHabitsList() throws Exception {
        // Создаем тестового пользователя
        User testUser = new User();
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setPassword("password");
        User savedUser = userRepository.save(testUser);

        // Создаем привычку для пользователя
        Habit habit = new Habit();
        habit.setTitle("Test Habit");
        habit.setUser(savedUser); // Устанавливаем пользователя!
        habitRepository.save(habit);

        mockMvc.perform(get("/api/habits/user/" + savedUser.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Test Habit")); // Исправлено значение
    }
}