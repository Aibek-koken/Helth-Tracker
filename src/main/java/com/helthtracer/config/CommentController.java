package com.helthtracer.config;

import com.helthtracer.model.Comment;
import com.helthtracer.model.Post;
import com.helthtracer.model.User;
import com.helthtracer.repository.CommentRepository;
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
@RequestMapping("/api/comments")
public class CommentController {

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    // Получить комментарии поста
    @GetMapping("/post/{postId}")
    public List<Comment> getPostComments(@PathVariable Long postId) {
        return commentRepository.findByPostIdOrderByCreatedAtDesc(postId);
    }

    // Добавить комментарий
    @PostMapping
    public ResponseEntity<?> addComment(@RequestBody CommentRequest request) {
        try {
            Optional<Post> post = postRepository.findById(request.getPostId());
            Optional<User> user = userRepository.findById(request.getUserId());

            if (post.isEmpty() || user.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Post or User not found"));
            }

            Comment comment = new Comment(post.get(), user.get(), request.getContent());
            comment.setCreatedAt(LocalDateTime.now());

            Comment savedComment = commentRepository.save(comment);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("comment", savedComment);
            response.put("message", "Comment added");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // Удалить комментарий
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteComment(@PathVariable Long id) {
        try {
            if (!commentRepository.existsById(id)) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Comment not found"));
            }

            commentRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Comment deleted"));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}

class CommentRequest {
    private Long postId;
    private Long userId;
    private String content;

    public Long getPostId() { return postId; }
    public void setPostId(Long postId) { this.postId = postId; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}