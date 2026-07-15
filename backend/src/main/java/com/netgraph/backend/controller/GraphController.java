package com.netgraph.backend.controller;

import com.netgraph.backend.dto.GraphData;
import com.netgraph.backend.entity.User;
import com.netgraph.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@RestController
@RequestMapping("/api/graph")
@RequiredArgsConstructor
public class GraphController {

    private final UserService userService;

    /** Full 2-degree network for force-graph visualization */
    @GetMapping("/my-network")
    @Transactional(readOnly = true)
    public ResponseEntity<GraphData> getMyNetwork(@AuthenticationPrincipal UserDetails userDetails) {
        User me = userService.findByUsername(userDetails.getUsername());
        Set<GraphData.Node> nodes = new HashSet<>();
        Set<GraphData.Link> links = new HashSet<>();

        nodes.add(new GraphData.Node(me.getId(), me.getDisplayName(), "#3b82f6"));

        for (User friend : me.getFollowing()) {
            nodes.add(new GraphData.Node(friend.getId(), friend.getDisplayName(), "#10b981"));
            links.add(new GraphData.Link(me.getId(), friend.getId()));
            for (User fof : friend.getFollowing()) {
                nodes.add(new GraphData.Node(fof.getId(), fof.getDisplayName(), "#94a3b8"));
                links.add(new GraphData.Link(friend.getId(), fof.getId()));
            }
        }

        return ResponseEntity.ok(new GraphData(nodes, links));
    }

    /**
     * BFS shortest path — returns path IDs + a display-name map so the
     * frontend can render real names instead of raw UUIDs.
     */
    @GetMapping("/path")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getPath(
            @RequestParam String targetId,
            @AuthenticationPrincipal UserDetails userDetails) {

        User me = userService.findByUsername(userDetails.getUsername());
        List<String> path = userService.getShortestPath(me.getId(), targetId);

        // Build id → {displayName, username} map for each node in path
        Map<String, Map<String, String>> userMap = new LinkedHashMap<>();
        for (String id : path) {
            try {
                User u = userService.findById(id);
                userMap.put(id, Map.of(
                    "displayName", u.getDisplayName(),
                    "username",    u.getUsername()
                ));
            } catch (Exception e) {
                throw new RuntimeException("Failed to fetch path node", e);
            }
        }

        return ResponseEntity.ok(Map.of(
            "path",    path,
            "degrees", path.isEmpty() ? -1 : path.size() - 1,
            "users",   userMap
        ));
    }

    /** Community stats for the stats cards */
    @GetMapping("/stats")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getStats(@AuthenticationPrincipal UserDetails userDetails) {
        User me = userService.findByUsername(userDetails.getUsername());
        int communitySize = userService.getCommunitySize(me.getId());

        // Compute influence score: followers + (following who follow back)
        long followers  = me.getFollowerCount();
        long following  = me.getFollowingCount();
        double influence = followers * 1.5 + following * 0.5;

        return ResponseEntity.ok(Map.of(
            "communitySize",   communitySize,
            "followerCount",   followers,
            "followingCount",  following,
            "influenceScore",  Math.round(influence * 10.0) / 10.0
        ));
    }
}
