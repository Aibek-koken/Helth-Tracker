package com.helthtracer.controller;

import com.helthtracer.model.Habit;
import com.helthtracer.model.User;
import com.helthtracer.repository.HabitRepository;
import com.helthtracer.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/habits")
public class HabitController {

    @Autowired
    private HabitRepository habitRepository;

    @Autowired // ДОБАВИТЬ эту зависимость
    private UserRepository userRepository;


    @GetMapping
    public List<Habit> getAllHabits() {
        return habitRepository.findAll();
    }

    @GetMapping("/user/{userId}")
    public List<Habit> getUserHabits(@PathVariable Long userId) {
        return habitRepository.findByUserId(userId);
    }
    @PostMapping
    public Habit createHabit(@RequestBody Habit habit) {
        // Проверяем, что пользователь установлен
        if (habit.getUser() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User is required");
        }

        // Дополнительная проверка, что пользователь существует
        User user = userRepository.findById(habit.getUser().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        habit.setUser(user);
        return habitRepository.save(habit);
    }

    @PutMapping("/{id}")
    public Habit updateHabit(@PathVariable Long id, @RequestBody Habit habit) {
        habit.setId(id);
        return habitRepository.save(habit);
    }

    @DeleteMapping("/{id}")
    public void deleteHabit(@PathVariable Long id) {
        habitRepository.deleteById(id);
    }
}