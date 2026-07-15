package com.netgraph.backend.service;

import com.netgraph.backend.entity.User;
import com.netgraph.backend.node.UserNode;
import com.netgraph.backend.node.UserNodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@lombok.extern.slf4j.Slf4j
public class GraphSyncService {

    private final UserNodeRepository userNodeRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void syncUser(User user) {
        try {
            UserNode node = UserNode.builder()
                .id(user.getId())
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .build();
            userNodeRepository.save(node);
        } catch (Exception e) {
            log.error("Failed to sync user to Neo4j: {}", e.getMessage());
            throw new RuntimeException("Neo4j sync failed", e);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void syncFollow(String followerId, String followingId) {
        try {
            UserNode follower = userNodeRepository.findById(followerId).orElse(null);
            UserNode following = userNodeRepository.findById(followingId).orElse(null);
            
            if (follower != null && following != null) {
                follower.getFollowing().add(following);
                userNodeRepository.save(follower);
            }
        } catch (Exception e) {
            log.error("Failed to sync follow to Neo4j: {}", e.getMessage());
            throw new RuntimeException("Neo4j sync failed", e);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void syncUnfollow(String followerId, String followingId) {
        try {
            UserNode follower = userNodeRepository.findById(followerId).orElse(null);
            if (follower != null) {
                follower.getFollowing().removeIf(node -> node.getId().equals(followingId));
                userNodeRepository.save(follower);
            }
        } catch (Exception e) {
            log.error("Failed to sync unfollow to Neo4j: {}", e.getMessage());
            throw new RuntimeException("Neo4j sync failed", e);
        }
    }
}
