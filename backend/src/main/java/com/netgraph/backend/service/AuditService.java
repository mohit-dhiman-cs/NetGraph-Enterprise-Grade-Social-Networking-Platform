package com.netgraph.backend.service;

import com.netgraph.backend.entity.AuditLog;
import com.netgraph.backend.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Fire-and-forget async audit logging. Never throws — we don't want audit to break user flows.
     */
    @Async
    public void log(String actorId, String actorUsername, String action,
                    String entityType, String entityId, String detail, String ip) {
        try {
            AuditLog entry = AuditLog.builder()
                .actorId(actorId)
                .actorUsername(actorUsername)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .detail(detail)
                .ipAddress(ip)
                .build();
            auditLogRepository.save(entry);
        } catch (Exception e) {
            log.error("Audit log failed: {}", e.getMessage());
            throw new RuntimeException("Audit log failed", e);
        }
    }

    // Convenience overload without IP
    @Async
    public void log(String actorId, String actorUsername, String action, String entityType, String entityId) {
        log(actorId, actorUsername, action, entityType, entityId, null, null);
    }
}
