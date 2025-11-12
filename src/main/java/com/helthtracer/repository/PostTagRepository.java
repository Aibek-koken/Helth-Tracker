package com.helthtracer.repository;

import com.helthtracer.model.PostTag;
import com.helthtracer.model.PostTagId; // составной ключ
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PostTagRepository extends JpaRepository<PostTag, PostTagId> {
    void deleteByPostId(Long postId);
}