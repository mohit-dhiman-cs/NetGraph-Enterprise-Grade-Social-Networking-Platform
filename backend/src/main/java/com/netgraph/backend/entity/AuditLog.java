package com.netgraph.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_user", columnList = "actor_id"),
    @Index(name = "idx_audit_action", columnList = "action"),
    @Index(name = "idx_audit_created", columnList = "createdAt")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "actor_id")
    private String actorId;

    private String actorUsername;

    @Column(nullable = false, length = 64)
    private String action;      // e.g. "POST_CREATED", "USER_FOLLOWED", "COMMENT_DELETED"

    @Column(length = 64)
    private String entityType;  // e.g. "Post", "User", "Comment"

    private String entityId;

    @Column(columnDefinition = "TEXT")
    private String detail;      // JSON or free text

    private String ipAddress;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
