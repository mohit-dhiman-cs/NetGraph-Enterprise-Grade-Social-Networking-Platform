package com.netgraph.backend.service;

import com.netgraph.backend.entity.Post;
import com.netgraph.backend.entity.User;
import com.netgraph.backend.repository.PostRepository;
import com.netgraph.backend.repository.UserRepository;
import com.netgraph.backend.graph.SocialGraphEngine;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PostServiceTest {

    @Mock
    private PostRepository postRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private SocialGraphEngine graphEngine;

    @InjectMocks
    private PostService postService;

    @Test
    void createPost_Success() {
        User author = new User();
        author.setId("userA");
        author.setPostCount(0);

        when(userRepository.findById("userA")).thenReturn(Optional.of(author));
        when(postRepository.save(any(Post.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Post post = postService.createPost("userA", "Hello World", null);

        assertEquals("Hello World", post.getContent());
        assertEquals(author, post.getAuthor());
        assertEquals(1, author.getPostCount());
        verify(userRepository, times(1)).save(author);
        verify(postRepository, times(1)).save(any(Post.class));
    }
}
