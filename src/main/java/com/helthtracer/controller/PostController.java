package com.helthtracer.controller;

import com.helthtracer.model.Post;
import com.helthtracer.model.User;
import com.helthtracer.repository.CommentRepository;
import com.helthtracer.repository.LikeRepository;
import com.helthtracer.repository.PostRepository;
import com.helthtracer.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LikeRepository likeRepository;

    @Autowired
    private CommentRepository commentRepository;

    // Получить все посты
    @GetMapping
    public List<Post> getAllPosts() {
        return postRepository.findAllByOrderByCreatedAtDesc();
    }

    // Получить посты пользователя
    @GetMapping("/user/{userId}")
    public List<Post> getUserPosts(@PathVariable Long userId) {
        return postRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    // Создать пост
    @PostMapping
    public ResponseEntity<?> createPost(@RequestBody PostRequest request) {
        try {
            Optional<User> user = userRepository.findById(request.getUserId());
            if (user.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "User not found"));
            }

            Post post = new Post();
            post.setUser(user.get());
            post.setTitle(request.getTitle());
            post.setBody(request.getContent());
            post.setTopic(request.getCategory());
            post.setCreatedAt(LocalDateTime.now());
            post.setUpdatedAt(LocalDateTime.now());

            Post savedPost = postRepository.save(post);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("post", savedPost);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // Удалить пост
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(@PathVariable Long id) {
        try {
            if (!postRepository.existsById(id)) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Post not found"));
            }

            postRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Post deleted"));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // Получить статистику поста (лайки, комментарии)
    @GetMapping("/{postId}/stats")
    public ResponseEntity<?> getPostStats(@PathVariable Long postId) {
        try {
            int likeCount = likeRepository.countByPostId(postId);
            int commentCount = commentRepository.countByPostId(postId);

            Map<String, Object> stats = new HashMap<>();
            stats.put("likeCount", likeCount);
            stats.put("commentCount", commentCount);
            stats.put("success", true);

            return ResponseEntity.ok(stats);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}

class PostRequest {
    private Long userId;
    private String title;
    private String content;
    private String category;

    // геттеры и сеттеры
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
}