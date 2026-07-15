package com.netgraph.backend.graph;

import com.netgraph.backend.entity.User;
import com.netgraph.backend.node.UserNodeRepository;
import com.netgraph.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.Cacheable;

import java.util.*;

/**
 * NetGraph Social Graph Engine
 * Powered by Neo4j Native Graph Traversals.
 */
@Component
@Transactional(readOnly = true)
@RequiredArgsConstructor
@lombok.extern.slf4j.Slf4j
public class SocialGraphEngine {

    private final UserNodeRepository userNodeRepository;
    private final UserRepository userRepository;

    /**
     * Neo4j Native Shortest Path Algorithm
     */
    public List<String> shortestPath(User source, User target, int maxDepth) {
        try {
            return userNodeRepository.findShortestPath(source.getId(), target.getId());
        } catch (Exception e) {
            log.warn("Neo4j shortestPath failed: {}", e.getMessage());
            throw new RuntimeException("Social graph engine failed", e);
        }
    }

    /**
     * Neo4j Cypher Friend Recommendations (2-hop mutual scoring)
     */
    @Cacheable(value = "friendSuggestions", key = "#user.id")
    public List<ScoredUser> suggestFriends(User user, int limit) {
        try {
            List<Map<String, Object>> rawResults = userNodeRepository.suggestFriends(user.getId(), limit);
            
            List<ScoredUser> suggestions = new ArrayList<>();
            for (Map<String, Object> row : rawResults) {
                String id = (String) row.get("id");
                Number score = (Number) row.get("mutualCount");
                userRepository.findById(id).ifPresent(u -> 
                    suggestions.add(new ScoredUser(u, score.intValue()))
                );
            }
            return suggestions;
        } catch (Exception e) {
            log.warn("Neo4j suggestFriends failed: {}", e.getMessage());
            throw new RuntimeException("Social graph engine failed", e);
        }
    }

    /**
     * Neo4j Reachability Analysis for Community Detection
     */
    public Set<String> detectCommunity(User startUser) {
        try {
            return new HashSet<>(userNodeRepository.findCommunity(startUser.getId()));
        } catch (Exception e) {
            log.warn("Neo4j detectCommunity failed: {}", e.getMessage());
            throw new RuntimeException("Social graph engine failed", e);
        }
    }

    public record ScoredUser(User user, int score) implements java.io.Serializable {}
}
