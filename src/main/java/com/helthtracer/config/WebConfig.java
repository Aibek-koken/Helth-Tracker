package com.helthtracer.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
// d
    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // Redirect root to login page
        registry.addViewController("/").setViewName("forward:/landing.html");

        // For SPA routing - redirect to index.html
        registry.addViewController("/main").setViewName("forward:/main.html");
        registry.addViewController("/posts").setViewName("forward:/posts.html");
        registry.addViewController("/profile").setViewName("forward:/profile.html");
    }
}