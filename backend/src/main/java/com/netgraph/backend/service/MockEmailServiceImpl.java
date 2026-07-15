package com.netgraph.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class MockEmailServiceImpl implements EmailService {

    @Value("${frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        String resetUrl = frontendUrl + "/reset-password?token=" + resetToken;
        
        log.info("========================================================================");
        log.info("📧 MOCK EMAIL SENT");
        log.info("TO: {}", toEmail);
        log.info("SUBJECT: Password Reset Request");
        log.info("BODY: You have requested to reset your password. Click the link below:");
        log.info(resetUrl);
        log.info("========================================================================");
    }
}
