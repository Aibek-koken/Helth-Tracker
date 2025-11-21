package com.helthtracer.repository;

import com.helthtracer.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findByUserId(Long userId);
    List<Post> findByTopic(String topic);

    // Добавляем методы для сортировки
    List<Post> findAllByOrderByCreatedAtDesc();
    List<Post> findByUserIdOrderByCreatedAtDesc(Long userId);

    // Подсчет постов пользователя
    @Query("SELECT COUNT(p) FROM Post p WHERE p.user.id = :userId")
    int countByUserId(@Param("userId") Long userId);
}