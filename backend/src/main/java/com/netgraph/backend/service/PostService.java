package com.netgraph.backend.service;

import com.netgraph.backend.entity.Post;
import com.netgraph.backend.entity.User;
import com.netgraph.backend.repository.PostRepository;
import com.netgraph.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PostService {
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final com.netgraph.backend.graph.SocialGraphEngine graphEngine;

    @Transactional
    public Post createPost(String authorId, String content, String imageUrl) {
        User author = userRepository.findById(authorId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Post post = Post.builder().author(author).content(content).imageUrl(imageUrl).build();
        author.setPostCount(author.getPostCount() + 1);
        userRepository.save(author);
        return postRepository.save(post);
    }

    @Transactional
    public Post likePost(String postId, String userId) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
            
        if (post.getLikedByUserIds().add(userId)) {
            post.setLikeCount(post.getLikeCount() + 1);
            recalculateTrendScore(post);
            
            // Notify post author
            notificationService.createNotification(
                post.getAuthor(),
                user,
                com.netgraph.backend.entity.Notification.NotificationType.LIKE,
                post.getId(),
                user.getDisplayName() + " liked your post."
            );
        }
        return postRepository.save(post);
    }

    @Transactional
    public Post unlikePost(String postId, String userId) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        if (post.getLikedByUserIds().remove(userId)) {
            post.setLikeCount(Math.max(0, post.getLikeCount() - 1));
            recalculateTrendScore(post);
        }
        return postRepository.save(post);
    }

    public List<Post> getPersonalizedFeed(String userId, int limit) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
            
        List<String> followingIds = user.getFollowing().stream()
            .map(User::getId).toList();
            
        if (followingIds.isEmpty()) {
            return postRepository.findAll(PageRequest.of(0, limit)).getContent();
        }

        // 1. Fetch Candidates (Last 100 posts from followed users)
        List<Post> candidates = postRepository.findTop100ByAuthorIdInOrderByCreatedAtDesc(followingIds);
        
        // 2. Get Affinity Data (Community Cluster)
        java.util.Set<String> communityIds = graphEngine.detectCommunity(user);
        
        // 3. Rank via EdgeRank Formula: Score = TrendScore * Affinity
        return candidates.stream()
            .sorted((p1, p2) -> {
                double score1 = calculateEdgeRank(p1, communityIds);
                double score2 = calculateEdgeRank(p2, communityIds);
                return Double.compare(score2, score1);
            })
            .limit(limit)
            .toList();
    }

    private double calculateEdgeRank(Post post, java.util.Set<String> communityIds) {
        double baseScore = post.getTrendScore();
        double affinity = 1.0;
        
        // Boost if in same community
        if (communityIds.contains(post.getAuthor().getId())) {
            affinity += 0.5;
        }
        
        return baseScore * affinity;
    }

    public Page<Post> getFeed(String userId, int page, int size) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        List<String> followingIds = user.getFollowing().stream()
            .map(User::getId).toList();
        if (followingIds.isEmpty()) {
            return postRepository.findAll(PageRequest.of(page, size));
        }
        return postRepository.findFeedForUser(followingIds, PageRequest.of(page, size));
    }

    public List<Post> getTrending() {
        return postRepository.findTop10ByOrderByTrendScoreDesc();
    }

    /**
     * Trend Score Formula:
     * score = (likes * 1.5 + comments * 2.0 + shares * 3.0) / (age_in_hours + 2)^1.5
     * Higher engagement and recency → higher score (similar to Hacker News gravity formula)
     */
    private void recalculateTrendScore(Post post) {
        double engagement = (post.getLikeCount() * 1.5) +
                            (post.getCommentCount() * 2.0) +
                            (post.getShareCount() * 3.0);
        long ageHours = java.time.Duration.between(post.getCreatedAt(),
            java.time.LocalDateTime.now()).toHours();
        post.setTrendScore(engagement / Math.pow(ageHours + 2, 1.5));
    }

    public List<Post> searchPosts(String query) {
        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }
        return postRepository.findByContentContainingIgnoreCaseOrderByCreatedAtDesc(query);
    }
}
