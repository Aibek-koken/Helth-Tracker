// UserStatsController.java
package com.helthtracer.controller;

import com.helthtracer.repository.HabitRepository;
import com.helthtracer.repository.HabitLogRepository;
import com.helthtracer.repository.SleepSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserStatsController {

    @Autowired
    private HabitRepository habitRepository;

    @Autowired
    private HabitLogRepository habitLogRepository;

    @Autowired
    private SleepSessionRepository sleepSessionRepository;

    @GetMapping("/{userId}/stats")
    public Map<String, Object> getUserStats(@PathVariable Long userId) {
        Map<String, Object> stats = new HashMap<>();

        // Habit statistics
        int totalHabits = habitRepository.countByUserId(userId);
        LocalDate startOfMonth = LocalDate.now().withDayOfMonth(1);
        LocalDate endOfMonth = LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth());

        int completedThisMonth = habitLogRepository.countCompletedHabitsThisMonth(userId, startOfMonth, endOfMonth);
        int totalPossible = totalHabits * LocalDate.now().lengthOfMonth();
        double completionRate = totalPossible > 0 ? (double) completedThisMonth / totalPossible * 100 : 0;
        // Sleep statistics
        Double avgSleep = sleepSessionRepository.findAverageSleepDurationByUserId(userId);
        double averageSleep = avgSleep != null ? avgSleep : 0.0;


        stats.put("totalHabits", totalHabits);
        stats.put("completedThisMonth", completedThisMonth);
        stats.put("completionRate", Math.round(completionRate));
        stats.put("averageSleep", averageSleep);
        stats.put("currentStreak", calculateCurrentStreak(userId));

        return stats;
    }

    private int calculateCurrentStreak(Long userId) {
        // Implementation for calculating current streak
        // This would check consecutive days where all habits were completed
        return 0; // Placeholder
    }
}