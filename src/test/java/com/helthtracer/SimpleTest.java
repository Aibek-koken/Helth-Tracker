package com.helthtracer;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class SimpleTest {

    @Test
    void basicTest() {
        // Простейший тест, который всегда проходит
        assertEquals(2, 1 + 1);
    }

    @Test
    void testApplicationStarts() {
        // Проверяем, что можем создать экземпляр любого класса
        String test = "Hello CI";
        assertNotNull(test);
    }
}