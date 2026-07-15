package com.netgraph.backend.controller;

import com.netgraph.backend.entity.Post;
import com.netgraph.backend.service.PostService;
import com.netgraph.backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
@Tag(name = "Posts & Feed", description = "Create posts, personalized feed, trending")
@SecurityRequirement(name = "bearerAuth")
public class PostController {

    private final PostService postService;
    private final UserService userService;

    @PostMapping
    @Operation(summary = "Create a new post")
    public ResponseEntity<Post> createPost(@RequestBody Map<String, String> body,
                                            @AuthenticationPrincipal UserDetails userDetails) {
        var me = userService.findByUsername(userDetails.getUsername());
        Post post = postService.createPost(me.getId(), body.get("content"), body.get("imageUrl"));
        return ResponseEntity.ok(post);
    }

    @GetMapping("/feed")
    @Operation(summary = "Get personalized feed (posts from followed users, ranked by trend score)")
    public ResponseEntity<Page<Post>> getFeed(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var me = userService.findByUsername(userDetails.getUsername());
        return ResponseEntity.ok(postService.getFeed(me.getId(), page, size));
    }

    @GetMapping("/edgerank")
    @Operation(summary = "Get advanced EdgeRank feed (Graph-weighted proximity + Engagement)")
    public ResponseEntity<List<Post>> getEdgeRankFeed(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "20") int limit) {
        var me = userService.findByUsername(userDetails.getUsername());
        return ResponseEntity.ok(postService.getPersonalizedFeed(me.getId(), limit));
    }

    @GetMapping("/trending")
    @Operation(summary = "Get top 10 trending posts by engagement-weighted score")
    public ResponseEntity<List<Post>> getTrending() {
        return ResponseEntity.ok(postService.getTrending());
    }

    @PostMapping("/{id}/like")
    @Operation(summary = "Like a post")
    public ResponseEntity<Post> like(@PathVariable String id,
                                     @AuthenticationPrincipal UserDetails userDetails) {
        var me = userService.findByUsername(userDetails.getUsername());
        return ResponseEntity.ok(postService.likePost(id, me.getId()));
    }

    @DeleteMapping("/{id}/like")
    @Operation(summary = "Unlike a post")
    public ResponseEntity<Post> unlike(@PathVariable String id,
                                       @AuthenticationPrincipal UserDetails userDetails) {
        var me = userService.findByUsername(userDetails.getUsername());
        return ResponseEntity.ok(postService.unlikePost(id, me.getId()));
    }

    @GetMapping("/search")
    @Operation(summary = "Search posts by content")
    public ResponseEntity<List<Post>> searchPosts(@RequestParam String q) {
        return ResponseEntity.ok(postService.searchPosts(q));
    }
}
