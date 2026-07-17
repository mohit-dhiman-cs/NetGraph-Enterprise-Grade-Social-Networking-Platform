package com.netgraph.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Arrays;

@RestController
public class TestController {
    @Autowired
    private ApplicationContext context;
    
    @GetMapping("/test-beans")
    public String testBeans() {
        boolean hasClientRegRepo = context.containsBean("clientRegistrationRepository");
        return "Has ClientRegistrationRepository: " + hasClientRegRepo;
    }
}
