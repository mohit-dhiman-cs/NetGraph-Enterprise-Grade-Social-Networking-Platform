package com.netgraph.backend.repository;

import com.netgraph.backend.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, String> {

    Page<Post> findByAuthorIdOrderByCreatedAtDesc(String authorId, Pageable pageable);

    // Personalized feed: posts from users you follow, ranked by recency + engagement
    @EntityGraph(attributePaths = {"author"})
    @Query("SELECT p FROM Post p WHERE p.author.id IN :followingIds ORDER BY p.trendScore DESC, p.createdAt DESC")
    Page<Post> findFeedForUser(@Param("followingIds") List<String> followingIds, Pageable pageable);

    // Trending posts — top 10 by trend score
    List<Post> findTop10ByOrderByTrendScoreDesc();

    // Candidate fetching for personalized algorithm
    @EntityGraph(attributePaths = {"author"})
    List<Post> findTop100ByAuthorIdInOrderByCreatedAtDesc(List<String> authorIds);

    // Global Search
    List<Post> findByContentContainingIgnoreCaseOrderByCreatedAtDesc(String keyword);
}
