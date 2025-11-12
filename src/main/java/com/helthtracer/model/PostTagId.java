package com.helthtracer.model;

import java.io.Serializable;
import java.util.Objects;

public class PostTagId implements Serializable {

    private Long post;
    private Long tag;

    public PostTagId() {}

    public PostTagId(Long post, Long tag) {
        this.post = post;
        this.tag = tag;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof PostTagId that)) return false;
        return Objects.equals(post, that.post) && Objects.equals(tag, that.tag);
    }

    @Override
    public int hashCode() {
        return Objects.hash(post, tag);
    }
}
