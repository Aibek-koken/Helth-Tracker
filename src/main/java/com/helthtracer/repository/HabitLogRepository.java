package com.helthtracer.repository;

import com.helthtracer.model.HabitLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface HabitLogRepository extends JpaRepository<HabitLog, Long> {

    @Query("SELECT COUNT(hl) FROM HabitLog hl WHERE hl.habit.user.id = :userId AND hl.date BETWEEN :start AND :end AND hl.status = 'COMPLETED'")
    int countCompletedHabitsThisMonth(@Param("userId") Long userId,
                                      @Param("start") LocalDate start,
                                      @Param("end") LocalDate end);

    // ИСПРАВИТЬ сигнатуру метода - добавить @Param
    @Query("SELECT hl FROM HabitLog hl WHERE hl.habit.user.id = :userId AND hl.date BETWEEN :startDate AND :endDate")
    List<HabitLog> findByHabitUserIdAndDateBetween(@Param("userId") Long userId,
                                                   @Param("startDate") LocalDate startDate,
                                                   @Param("endDate") LocalDate endDate);

    List<HabitLog> findByHabitIdAndDate(Long habitId, LocalDate date);

    void deleteByHabitIdAndDate(Long habitId, LocalDate date);
}