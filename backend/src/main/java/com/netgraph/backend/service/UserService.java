package com.netgraph.backend.service;

import com.netgraph.backend.dto.UserSummaryDto;
import com.netgraph.backend.entity.User;
import com.netgraph.backend.graph.SocialGraphEngine;
import com.netgraph.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.Cacheable;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final SocialGraphEngine graphEngine;
    private final NotificationService notificationService;
    private final GraphSyncService graphSyncService;

    @Cacheable(value = "users", key = "#id")
    public User findById(String id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));
    }

    @Transactional
    public User processOAuthUser(String email, String name, String picture) {
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setUsername(email.split("@")[0]);
            newUser.setDisplayName(name);
            newUser.setAvatarUrl(picture);
            newUser.setProvider("google");
            newUser.setPassword(java.util.UUID.randomUUID().toString()); // Dummy password for OAuth users
            return newUser;
        });

        user.setDisplayName(name);
        user.setAvatarUrl(picture);
        User saved = userRepository.save(user);
        
        // Sync to Neo4j. Since this method is @Transactional, failures here will rollback the Postgres save.
        graphSyncService.syncUser(saved);
        return saved;
    }

    @Transactional
    public void follow(String followerId, String targetId) {
        if (followerId.equals(targetId)) throw new IllegalArgumentException("Cannot follow yourself.");
        User follower = findById(followerId);
        User target = findById(targetId);
        if (follower.getFollowing().add(target)) {
            follower.setFollowingCount(follower.getFollowingCount() + 1);
            target.setFollowerCount(target.getFollowerCount() + 1);
            userRepository.save(follower);
            userRepository.save(target);

            // Sync to Neo4j
            graphSyncService.syncFollow(followerId, targetId);

            // Notify target user
            notificationService.createNotification(
                target,
                follower,
                com.netgraph.backend.entity.Notification.NotificationType.FOLLOW,
                follower.getId(),
                follower.getDisplayName() + " started following you."
            );
        }
    }

    @Transactional
    public void unfollow(String followerId, String targetId) {
        User follower = findById(followerId);
        User target = findById(targetId);
        if (follower.getFollowing().remove(target)) {
            follower.setFollowingCount(Math.max(0, follower.getFollowingCount() - 1));
            target.setFollowerCount(Math.max(0, target.getFollowerCount() - 1));
            userRepository.save(follower);
            userRepository.save(target);
            
            // Sync to Neo4j
            graphSyncService.syncUnfollow(followerId, targetId);
        }
    }

    /** BFS friend suggestions — graded by mutual connection count */
    @Transactional(readOnly = true)
    public List<UserSummaryDto> getSuggestedUsers(String userId, int limit) {
        User user = findById(userId);
        List<SocialGraphEngine.ScoredUser> suggestions = graphEngine.suggestFriends(user, limit);
        return suggestions.stream()
            .map(s -> toSummaryDto(s.user(), user))
            .toList();
    }

    /** BFS shortest path between two users */
    @Transactional(readOnly = true)
    public List<String> getShortestPath(String sourceId, String targetId) {
        User source = findById(sourceId);
        User target = findById(targetId);
        return graphEngine.shortestPath(source, target, 6);
    }

    /** DFS community detection */
    @Transactional(readOnly = true)
    public int getCommunitySize(String userId) {
        User user = findById(userId);
        return graphEngine.detectCommunity(user).size();
    }

    @Transactional(readOnly = true)
    public List<UserSummaryDto> search(String query, String currentUserId) {
        User currentUser = findById(currentUserId);
        return userRepository.searchUsers(query).stream()
            .map(u -> toSummaryDto(u, currentUser))
            .toList();
    }

    public UserSummaryDto toSummaryDto(User u, User currentUser) {
        boolean isFollowing = currentUser.getFollowing().stream()
            .anyMatch(f -> f.getId().equals(u.getId()));
        return new UserSummaryDto(u.getId(), u.getUsername(), u.getDisplayName(), u.getAvatarUrl(),
            u.getFollowerCount(), u.getFollowingCount(), u.getPostCount(), u.getBio(), u.getLocation(), u.getWebsite(), isFollowing);
    }
    
    @Transactional
    public User updateProfile(String userId, com.netgraph.backend.dto.UpdateProfileDto dto) {
        User user = findById(userId);
        if (dto.getDisplayName() != null) user.setDisplayName(dto.getDisplayName());
        if (dto.getBio() != null) user.setBio(dto.getBio());
        if (dto.getAvatarUrl() != null) user.setAvatarUrl(dto.getAvatarUrl());
        if (dto.getLocation() != null) user.setLocation(dto.getLocation());
        if (dto.getWebsite() != null) user.setWebsite(dto.getWebsite());
        return userRepository.save(user);
    }
}
