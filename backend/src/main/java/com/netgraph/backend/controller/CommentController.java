package com.netgraph.backend.controller;

import com.netgraph.backend.entity.Comment;
import com.netgraph.backend.entity.Post;
import com.netgraph.backend.entity.User;
import com.netgraph.backend.repository.CommentRepository;
import com.netgraph.backend.repository.PostRepository;
import com.netgraph.backend.service.NotificationService;
import com.netgraph.backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts/{postId}/comments")
@RequiredArgsConstructor
@Tag(name = "Comments", description = "Post comments")
@SecurityRequirement(name = "bearerAuth")
public class CommentController {

    private final CommentRepository commentRepository;
    private final PostRepository    postRepository;
    private final UserService       userService;
    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "Get comments for a post")
    public ResponseEntity<List<Comment>> getComments(@PathVariable String postId) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        return ResponseEntity.ok(commentRepository.findByPostOrderByCreatedAtDesc(post));
    }

    @PostMapping
    @Transactional
    @Operation(summary = "Add a comment to a post")
    public ResponseEntity<Comment> addComment(
            @PathVariable String postId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {

        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        User author = userService.findByUsername(userDetails.getUsername());

        Comment comment = Comment.builder()
            .post(post)
            .author(author)
            .content(body.getOrDefault("content", "").trim())
            .build();

        Comment saved = commentRepository.save(comment);

        // Update post comment count
        post.setCommentCount(post.getCommentCount() + 1);
        postRepository.save(post);

        // Notify post author (if not self-comment)
        if (!post.getAuthor().getId().equals(author.getId())) {
            try {
                notificationService.createNotification(
                    post.getAuthor(), author,
                    com.netgraph.backend.entity.Notification.NotificationType.COMMENT,
                    postId,
                    author.getDisplayName() + " commented on your post."
                );
            } catch (Exception e) {
                throw new RuntimeException("Failed to send comment notification", e);
            }
        }

        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{commentId}")
    @Transactional
    @Operation(summary = "Delete your own comment")
    public ResponseEntity<Void> deleteComment(
            @PathVariable String postId,
            @PathVariable String commentId,
            @AuthenticationPrincipal UserDetails userDetails) {

        User author = userService.findByUsername(userDetails.getUsername());
        commentRepository.deleteByIdAndAuthorId(commentId, author.getId());

        // Decrement post comment count
        postRepository.findById(postId).ifPresent(post -> {
            post.setCommentCount(Math.max(0, post.getCommentCount() - 1));
            postRepository.save(post);
        });

        return ResponseEntity.noContent().build();
    }
}
