package com.helthtracer.controller;

import com.helthtracer.model.Like;
import com.helthtracer.model.Post;
import com.helthtracer.model.User;
import com.helthtracer.repository.LikeRepository;
import com.helthtracer.repository.PostRepository;
import com.helthtracer.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/likes")
public class LikeController {

    @Autowired
    private LikeRepository likeRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> toggleLike(@RequestBody LikeRequest request) {
        try {
            Optional<Post> post = postRepository.findById(request.getPostId());
            Optional<User> user = userRepository.findById(request.getUserId());

            if (post.isEmpty() || user.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Post or User not found"));
            }

            Optional<Like> existingLike = likeRepository.findByPostIdAndUserId(request.getPostId(), request.getUserId());

            if (existingLike.isPresent()) {
                // Удалить лайк
                likeRepository.delete(existingLike.get());
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("liked", false);
                response.put("message", "Like removed");
                return ResponseEntity.ok(response);
            } else {
                // Добавить лайк
                Like like = new Like(post.get(), user.get());
                likeRepository.save(like);

                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("liked", true);
                response.put("message", "Post liked");
                return ResponseEntity.ok(response);
            }

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // Проверить, лайкнул ли пользователь пост
    @GetMapping("/check")
    public ResponseEntity<?> checkLike(@RequestParam Long postId, @RequestParam Long userId) {
        try {
            boolean isLiked = likeRepository.existsByPostIdAndUserId(postId, userId);
            return ResponseEntity.ok(Map.of("success", true, "liked", isLiked));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}

class LikeRequest {
    private Long postId;
    private Long userId;

    public Long getPostId() { return postId; }
    public void setPostId(Long postId) { this.postId = postId; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
}