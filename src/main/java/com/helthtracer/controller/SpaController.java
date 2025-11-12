package com.helthtracer.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaController {

    // Handle SPA routes by forwarding to index.html
    @RequestMapping(value = {
            "/main", "/posts", "/profile",
            "/tracker", "/community", "/settings"
    })
    public String forward() {
        return "forward:/main.html";
    }
}