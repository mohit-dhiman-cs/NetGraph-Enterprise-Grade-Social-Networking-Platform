package com.netgraph.backend.repository;

import com.netgraph.backend.entity.Comment;
import com.netgraph.backend.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, String> {
    List<Comment> findByPostOrderByCreatedAtDesc(Post post);
    long countByPost(Post post);
    void deleteByIdAndAuthorId(String id, String authorId);
}
