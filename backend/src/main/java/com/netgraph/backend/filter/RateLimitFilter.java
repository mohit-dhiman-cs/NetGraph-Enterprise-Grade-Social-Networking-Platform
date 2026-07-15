package com.netgraph.backend.filter;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simple in-memory rate limiter using Bucket4j.
 * Per-IP: 200 requests / 60s for general endpoints.
 * Auth endpoints (/api/auth/**) are stricter: 15 requests / 60s.
 */
@Component
@Order(1)
public class RateLimitFilter implements Filter {

    // Token-bucket cache — one bucket per IP
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    private Bucket bucket(String ip, boolean strict) {
        return buckets.computeIfAbsent(ip + (strict ? "_strict" : "_general"), k -> {
            long capacity  = strict ? 15 : 200;
            Duration refill = Duration.ofMinutes(1);
            Bandwidth limit = Bandwidth.builder()
                .capacity(capacity)
                .refillGreedy(capacity, refill)
                .build();
            return Bucket.builder().addLimit(limit).build();
        });
    }

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest  request  = (HttpServletRequest)  req;
        HttpServletResponse response = (HttpServletResponse) res;

        String ip   = resolveIp(request);
        String path = request.getRequestURI();
        boolean strict = path.startsWith("/api/auth/");

        Bucket b = bucket(ip, strict);
        if (b.tryConsume(1)) {
            response.setHeader("X-RateLimit-Remaining", String.valueOf(b.getAvailableTokens()));
            chain.doFilter(req, res);
        } else {
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Too many requests. Please slow down.\",\"status\":429}");
        }
    }

    private String resolveIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        return (xff != null && !xff.isBlank()) ? xff.split(",")[0].trim() : req.getRemoteAddr();
    }
}
