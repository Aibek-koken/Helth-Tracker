package com.helthtracer.controller;

import com.helthtracer.model.Habit;
import com.helthtracer.model.HabitLog;
import com.helthtracer.repository.HabitLogRepository;
import com.helthtracer.repository.HabitRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/habit-logs")
public class HabitLogController {

    @Autowired
    private HabitLogRepository habitLogRepository;

    @Autowired
    private HabitRepository habitRepository;

    // Получить логи за месяц для пользователя
    @GetMapping
    public List<HabitLog> getHabitLogs(
            @RequestParam Long user_id,
            @RequestParam int year,
            @RequestParam int month) {
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        return habitLogRepository.findByHabitUserIdAndDateBetween(user_id, startDate, endDate);
    }

    // Создать или обновить лог
    @PostMapping
    public ResponseEntity<?> createOrUpdateHabitLog(@RequestBody HabitLogRequest request) {
        try {
            Optional<Habit> habit = habitRepository.findById(request.getHabitId());
            if (habit.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Habit not found"));
            }

            // Проверим, существует ли уже лог для этой привычки и даты
            List<HabitLog> existingLogs = habitLogRepository.findByHabitIdAndDate(request.getHabitId(), request.getDate());

            HabitLog habitLog;
            if (existingLogs.isEmpty()) {
                // Создаем новый лог
                habitLog = new HabitLog(habit.get(), request.getDate(), request.getStatus());
            } else {
                // Обновляем существующий лог
                habitLog = existingLogs.get(0);
                habitLog.setStatus(request.getStatus());
            }

            HabitLog savedLog = habitLogRepository.save(habitLog);
            return ResponseEntity.ok(Map.of("success", true, "habitLog", savedLog));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // Удалить лог
    @DeleteMapping
    public ResponseEntity<?> deleteHabitLog(@RequestParam Long habit_id,
                                            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            habitLogRepository.deleteByHabitIdAndDate(habit_id, date);
            return ResponseEntity.ok(Map.of("success", true, "message", "Habit log deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}

// DTO для запроса
class HabitLogRequest {
    private Long habitId;
    private LocalDate date;
    private String status;

    // геттеры и сеттеры
    public Long getHabitId() { return habitId; }
    public void setHabitId(Long habitId) { this.habitId = habitId; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}