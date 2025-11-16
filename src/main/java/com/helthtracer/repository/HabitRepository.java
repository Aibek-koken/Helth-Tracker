package com.helthtracer.repository;

import com.helthtracer.model.Habit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HabitRepository extends JpaRepository<Habit, Long> {
    List<Habit> findByUserId(Long userId);

    // ДОБАВИТЬ этот метод (используется в UserStatsController)
    @Query("SELECT COUNT(h) FROM Habit h WHERE h.user.id = :userId")
    int countByUserId(@Param("userId") Long userId);
}