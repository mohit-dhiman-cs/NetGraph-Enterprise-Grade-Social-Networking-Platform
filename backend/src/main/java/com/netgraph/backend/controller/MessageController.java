package com.netgraph.backend.controller;

import com.netgraph.backend.entity.Message;
import com.netgraph.backend.repository.MessageRepository;
import com.netgraph.backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
@Tag(name = "Real-Time Messaging", description = "WebSocket chat + REST message history")
@SecurityRequirement(name = "bearerAuth")
public class MessageController {

    private final MessageRepository messageRepository;
    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping("/conversation/{userId}")
    @Operation(summary = "Get chat history between current user and another user")
    public ResponseEntity<List<Message>> getConversation(@PathVariable String userId,
                                                          @AuthenticationPrincipal UserDetails userDetails) {
        var me = userService.findByUsername(userDetails.getUsername());
        return ResponseEntity.ok(messageRepository.findConversation(me.getId(), userId));
    }

    /** WebSocket endpoint: client sends to /app/chat.send */
    @MessageMapping("/chat.send")
    public void handleMessage(@Payload Map<String, String> payload) {
        String senderId   = payload.get("senderId");
        String receiverId = payload.get("receiverId");
        String content    = payload.get("content");

        var sender   = userService.findById(senderId);
        var receiver = userService.findById(receiverId);

        Message saved = messageRepository.save(
            Message.builder().sender(sender).receiver(receiver).content(content).build()
        );
        // Push to receiver's private queue
        messagingTemplate.convertAndSendToUser(receiverId, "/queue/messages", saved);
        // Confirm delivery to sender
        messagingTemplate.convertAndSendToUser(senderId, "/queue/messages", saved);
    }

    /** WebSocket: typing indicator */
    @MessageMapping("/chat.typing")
    public void typingIndicator(@Payload Map<String, String> payload) {
        String receiverId = payload.get("receiverId");
        messagingTemplate.convertAndSendToUser(receiverId, "/queue/typing",
            Map.of("from", payload.get("senderId"), "typing", payload.get("typing")));
    }
}
