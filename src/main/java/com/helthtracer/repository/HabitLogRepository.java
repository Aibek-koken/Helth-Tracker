package com.helthtracer.repository;

import com.helthtracer.model.HabitLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface HabitLogRepository extends JpaRepository<HabitLog, Long> {
    List<HabitLog> findByHabitId(Long habitId);

    // Найти все логи привычек пользователя за период
    @Query("SELECT hl FROM HabitLog hl WHERE hl.habit.user.id = :userId AND hl.date BETWEEN :startDate AND :endDate")
    List<HabitLog> findByHabitUserIdAndDateBetween(@Param("userId") Long userId,
                                                   @Param("startDate") LocalDate startDate,
                                                   @Param("endDate") LocalDate endDate);

    // Найти лог по привычке и дате
    @Query("SELECT hl FROM HabitLog hl WHERE hl.habit.id = :habitId AND hl.date = :date")
    List<HabitLog> findByHabitIdAndDate(@Param("habitId") Long habitId, @Param("date") LocalDate date);

    // Удалить лог по привычке и дате
    @Modifying
    @Transactional
    @Query("DELETE FROM HabitLog hl WHERE hl.habit.id = :habitId AND hl.date = :date")
    void deleteByHabitIdAndDate(@Param("habitId") Long habitId, @Param("date") LocalDate date);
}