package com.netgraph.backend;

import com.netgraph.backend.entity.User;
import com.netgraph.backend.repository.UserRepository;
import com.netgraph.backend.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class FeedLoadIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider tokenProvider;

    private String testToken;

    @BeforeEach
    public void setup() {
        // Create a test user if not exists
        if (userRepository.findByUsername("testuser").isEmpty()) {
            User user = User.builder()
                .username("testuser")
                .email("testuser@example.com")
                .displayName("Test User")
                .password("testpass")
                .build();
            userRepository.save(user);
        }
        
        // Generate a token for the test user
        testToken = tokenProvider.generateTokenFromUsername("testuser");
    }

    @Test
    public void testGetFeedReturnsOk() throws Exception {
        mockMvc.perform(get("/api/posts/feed")
                .header("Authorization", "Bearer " + testToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").exists());
    }

    @Test
    public void testGetTrendingReturnsOk() throws Exception {
        mockMvc.perform(get("/api/posts/trending")
                .header("Authorization", "Bearer " + testToken))
                .andExpect(status().isOk());
    }
}
