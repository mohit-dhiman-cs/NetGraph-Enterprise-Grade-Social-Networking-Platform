package com.netgraph.backend.controller;

import com.netgraph.backend.entity.AuditLog;
import com.netgraph.backend.repository.AuditLogRepository;
import com.netgraph.backend.repository.PostRepository;
import com.netgraph.backend.repository.UserRepository;
import com.netgraph.backend.service.AuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin Dashboard", description = "Analytics, moderation, and audit (ADMIN role only)")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository     userRepository;
    private final PostRepository     postRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuditService       auditService;

    // ── Analytics stats ──────────────────────────────────────
    @GetMapping("/stats")
    @Operation(summary = "Platform-wide analytics stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        long totalUsers   = userRepository.count();
        long activeUsers  = userRepository.countActiveUsers();
        long totalPosts   = postRepository.count();
        long auditLast24h = auditLogRepository.countByCreatedAtAfter(LocalDateTime.now().minusHours(24));

        return ResponseEntity.ok(Map.of(
            "totalUsers",    totalUsers,
            "activeUsers",   activeUsers,
            "totalPosts",    totalPosts,
            "inactiveUsers", totalUsers - activeUsers,
            "auditEvents24h", auditLast24h
        ));
    }

    // ── User management ───────────────────────────────────────
    @GetMapping("/users")
    @Operation(summary = "List all users (paginated)")
    public ResponseEntity<?> getAllUsers(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "25") int size) {
        return ResponseEntity.ok(userRepository.findAll(PageRequest.of(page, size)));
    }

    @PutMapping("/users/{id}/deactivate")
    @Operation(summary = "Deactivate (ban) a user account")
    public ResponseEntity<Map<String, String>> deactivateUser(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails admin) {
        userRepository.findById(id).ifPresent(u -> {
            u.setActive(false);
            userRepository.save(u);
            auditService.log(admin.getUsername(), admin.getUsername(),
                "USER_DEACTIVATED", "User", id, "Deactivated by admin", null);
        });
        return ResponseEntity.ok(Map.of("message", "User deactivated"));
    }

    @PutMapping("/users/{id}/reactivate")
    @Operation(summary = "Reactivate a previously banned user")
    public ResponseEntity<Map<String, String>> reactivateUser(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails admin) {
        userRepository.findById(id).ifPresent(u -> {
            u.setActive(true);
            userRepository.save(u);
            auditService.log(admin.getUsername(), admin.getUsername(),
                "USER_REACTIVATED", "User", id, "Reactivated by admin", null);
        });
        return ResponseEntity.ok(Map.of("message", "User reactivated"));
    }

    @PutMapping("/users/{id}/role")
    @Operation(summary = "Change user role (USER ↔ ADMIN)")
    public ResponseEntity<Map<String, String>> changeRole(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails admin) {
        String newRole = body.getOrDefault("role", "USER").toUpperCase();
        userRepository.findById(id).ifPresent(u -> {
            u.setRole(com.netgraph.backend.entity.User.Role.valueOf(newRole));
            userRepository.save(u);
            auditService.log(admin.getUsername(), admin.getUsername(),
                "ROLE_CHANGED", "User", id, "Role set to " + newRole, null);
        });
        return ResponseEntity.ok(Map.of("message", "Role updated to " + newRole));
    }

    @DeleteMapping("/posts/{id}")
    @Operation(summary = "Delete any post (moderation)")
    public ResponseEntity<Map<String, String>> deletePost(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails admin) {
        postRepository.findById(id).ifPresent(p -> {
            auditService.log(admin.getUsername(), admin.getUsername(),
                "POST_DELETED_BY_ADMIN", "Post", id, p.getContent().substring(0, Math.min(80, p.getContent().length())), null);
            postRepository.delete(p);
        });
        return ResponseEntity.ok(Map.of("message", "Post deleted"));
    }

    // ── Audit Logs ────────────────────────────────────────────
    @GetMapping("/audit")
    @Operation(summary = "Full audit log (paginated, newest first)")
    public ResponseEntity<Page<AuditLog>> getAuditLog(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(auditLogRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size)));
    }

    @GetMapping("/audit/recent")
    @Operation(summary = "20 most recent audit events")
    public ResponseEntity<?> getRecentAudit() {
        return ResponseEntity.ok(auditLogRepository.findTop20ByOrderByCreatedAtDesc());
    }

    @GetMapping("/audit/user/{userId}")
    @Operation(summary = "Audit trail for a specific user")
    public ResponseEntity<Page<AuditLog>> getUserAudit(
            @PathVariable String userId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(auditLogRepository.findByActorIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size)));
    }
}
