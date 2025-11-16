package com.helthtracer.repository;

import com.helthtracer.model.SleepSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SleepSessionRepository extends JpaRepository<SleepSession, Long> {

    // Исправленный запрос для PostgreSQL
    @Query(value = "SELECT AVG(EXTRACT(EPOCH FROM (end_time - start_time))/3600) FROM sleep_sessions WHERE user_id = :userId", nativeQuery = true)
    Double findAverageSleepDurationByUserId(@Param("userId") Long userId);

    List<SleepSession> findByUserIdOrderByStartTimeDesc(Long userId);
}