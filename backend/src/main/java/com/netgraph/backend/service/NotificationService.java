package com.netgraph.backend.service;

import com.netgraph.backend.entity.Notification;
import com.netgraph.backend.entity.User;
import com.netgraph.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void createNotification(User recipient, User sender, Notification.NotificationType type, String targetId, String content) {
        // Don't notify if recipient is the same as sender
        if (sender != null && recipient.getId().equals(sender.getId())) return;

        Notification notification = Notification.builder()
            .recipient(recipient)
            .sender(sender)
            .type(type)
            .targetId(targetId)
            .content(content)
            .build();

        notificationRepository.save(notification);

        // Send real-time via WebSocket
        // This targets /user/{username}/queue/notifications
        messagingTemplate.convertAndSendToUser(
            recipient.getUsername(),
            "/queue/notifications",
            notification
        );
    }
}
