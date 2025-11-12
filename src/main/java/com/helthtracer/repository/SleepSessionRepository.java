package com.helthtracer.repository;

import com.helthtracer.model.SleepSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SleepSessionRepository extends JpaRepository<SleepSession, Long> {
    List<SleepSession> findByUserId(Long userId);
}