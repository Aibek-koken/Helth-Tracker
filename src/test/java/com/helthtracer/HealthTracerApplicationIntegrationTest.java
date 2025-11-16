package com.helthtracer;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)

public class HealthTracerApplicationIntegrationTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Test
    void contextLoads() {
        // Проверяем что Spring контекст загружается корректно
        assertNotNull(applicationContext);
    }

    @Test
    void mainApplicationStarts() {
        // Проверяем что основное приложение запускается
        HealthTracerApplication.main(new String[]{});
        assertNotNull(applicationContext);
    }
}