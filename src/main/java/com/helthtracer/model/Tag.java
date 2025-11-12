package com.helthtracer.model;

import jakarta.persistence.*;

@Entity // класс-сущность (Entity) — отображается на таблицу в БД
@Table(name = "tags")
public class Tag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // соответствует SERIAL
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String name;

    public Tag() {}

    public Tag(String name) {
        this.name = name;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
