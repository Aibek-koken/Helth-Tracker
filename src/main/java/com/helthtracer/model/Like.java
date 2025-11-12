package com.helthtracer.model;

import jakarta.persistence.*;

@Entity
@Table(
        name = "likes",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"post_id", "user_id"})
        }
)
public class Like {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 🔗 связь с постом
    @ManyToOne
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    // 🔗 связь с пользователем
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // ⚙️ Конструкторы
    public Like() {}

    public Like(Post post, User user) {
        this.post = post;
        this.user = user;
    }

    // ⚙️ Getters / Setters
    public Long getId() {
        return id;
    }

    public Post getPost() {
        return post;
    }

    public void setPost(Post post) {
        this.post = post;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}
