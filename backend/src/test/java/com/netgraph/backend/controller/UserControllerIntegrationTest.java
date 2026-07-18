package com.netgraph.backend.controller;

import com.netgraph.backend.entity.User;
import com.netgraph.backend.repository.UserRepository;
import com.netgraph.backend.service.GraphSyncService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class UserControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @MockBean
    private GraphSyncService graphSyncService;

    private User admin;
    private User targetUser;

    @BeforeEach
    void setUp() {

        admin = User.builder()
            .username("admin")
            .displayName("Admin User")
            .email("admin@netgraph.com")
            .build();
        admin = userRepository.save(admin);

        targetUser = User.builder()
            .username("target")
            .displayName("Target User")
            .email("target@netgraph.com")
            .build();
        targetUser = userRepository.save(targetUser);
    }

    @Test
    @WithMockUser(username = "admin")
    void testFollowUser() throws Exception {
        mockMvc.perform(post("/api/users/" + targetUser.getId() + "/follow")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Followed successfully"));
    }

    @Test
    @WithMockUser(username = "admin")
    void testUnfollowUser() throws Exception {
        mockMvc.perform(delete("/api/users/" + targetUser.getId() + "/follow")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Unfollowed successfully"));
    }
}
