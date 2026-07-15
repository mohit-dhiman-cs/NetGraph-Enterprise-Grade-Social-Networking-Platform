package com.netgraph.backend.controller;

import com.netgraph.backend.dto.UserSummaryDto;
import com.netgraph.backend.entity.User;
import com.netgraph.backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users & Graph", description = "User profiles, follow graph, BFS/DFS operations")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<User> getMe(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userService.findByUsername(userDetails.getUsername()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID")
    public ResponseEntity<UserSummaryDto> getUser(@PathVariable String id,
                                                   @AuthenticationPrincipal UserDetails userDetails) {
        User current = userService.findByUsername(userDetails.getUsername());
        User target = userService.findById(id);
        return ResponseEntity.ok(userService.toSummaryDto(target, current));
    }

    @PostMapping("/{id}/follow")
    @Operation(summary = "Follow a user (adds directed edge to social graph)")
    public ResponseEntity<Map<String, String>> follow(@PathVariable String id,
                                                       @AuthenticationPrincipal UserDetails userDetails) {
        User me = userService.findByUsername(userDetails.getUsername());
        userService.follow(me.getId(), id);
        return ResponseEntity.ok(Map.of("message", "Followed successfully"));
    }

    @DeleteMapping("/{id}/follow")
    @Operation(summary = "Unfollow a user (removes directed edge from social graph)")
    public ResponseEntity<Map<String, String>> unfollow(@PathVariable String id,
                                                         @AuthenticationPrincipal UserDetails userDetails) {
        User me = userService.findByUsername(userDetails.getUsername());
        userService.unfollow(me.getId(), id);
        return ResponseEntity.ok(Map.of("message", "Unfollowed successfully"));
    }

    @GetMapping("/suggestions")
    @Operation(summary = "BFS: Get friend suggestions ranked by mutual connection count")
    public ResponseEntity<List<UserSummaryDto>> getSuggestions(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "10") int limit) {
        User me = userService.findByUsername(userDetails.getUsername());
        return ResponseEntity.ok(userService.getSuggestedUsers(me.getId(), limit));
    }

    @GetMapping("/path")
    @Operation(summary = "BFS: Shortest connection path between two users (like LinkedIn degrees)")
    public ResponseEntity<Map<String, Object>> getPath(@RequestParam String targetId,
                                                        @AuthenticationPrincipal UserDetails userDetails) {
        User me = userService.findByUsername(userDetails.getUsername());
        List<String> path = userService.getShortestPath(me.getId(), targetId);
        return ResponseEntity.ok(Map.of("path", path, "degrees", path.isEmpty() ? -1 : path.size() - 1));
    }

    @GetMapping("/community-size")
    @Operation(summary = "DFS: Detect the size of the connected community around a user")
    public ResponseEntity<Map<String, Object>> getCommunity(@RequestParam String userId) {
        int size = userService.getCommunitySize(userId);
        return ResponseEntity.ok(Map.of("userId", userId, "communitySize", size));
    }

    @GetMapping("/search")
    @Operation(summary = "Search users by username or display name")
    public ResponseEntity<List<UserSummaryDto>> search(@RequestParam String q,
                                                        @AuthenticationPrincipal UserDetails userDetails) {
        User me = userService.findByUsername(userDetails.getUsername());
        return ResponseEntity.ok(userService.search(q, me.getId()));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update current user profile")
    public ResponseEntity<User> updateProfile(@RequestBody com.netgraph.backend.dto.UpdateProfileDto dto,
                                              @AuthenticationPrincipal UserDetails userDetails) {
        User me = userService.findByUsername(userDetails.getUsername());
        return ResponseEntity.ok(userService.updateProfile(me.getId(), dto));
    }
}
