package com.netgraph.backend.controller;

import com.netgraph.backend.entity.Post;
import com.netgraph.backend.entity.User;
import com.netgraph.backend.repository.PostRepository;
import com.netgraph.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class FeedIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PostRepository postRepository;

    @BeforeEach
    void setUp() {
        postRepository.deleteAll();
        userRepository.deleteAll();

        User user = User.builder()
            .username("admin")
            .displayName("Admin User")
            .email("admin@netgraph.com")
            .build();
        user = userRepository.save(user);

        Post post = Post.builder()
            .author(user)
            .content("This is an integration test post")
            .build();
        postRepository.save(post);
    }

    @Test
    @WithMockUser(username = "admin")
    void testGetFeed_ReturnsPosts() throws Exception {
        mockMvc.perform(get("/api/posts")
                .param("page", "0")
                .param("size", "10")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray())
            .andExpect(jsonPath("$.content[0].content").value("This is an integration test post"));
    }
}
