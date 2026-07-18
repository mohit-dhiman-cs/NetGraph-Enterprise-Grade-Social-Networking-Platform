package com.netgraph.backend.controller;

import com.netgraph.backend.service.GraphSyncService;
import com.netgraph.backend.graph.SocialGraphEngine;
import com.netgraph.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class GraphIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @MockBean
    private GraphSyncService graphSyncService;

    @MockBean
    private SocialGraphEngine socialGraphEngine;

    @BeforeEach
    public void setup() {
        if (userRepository.findByUsername("admin").isEmpty()) {
            com.netgraph.backend.entity.User user = com.netgraph.backend.entity.User.builder()
                .username("admin")
                .email("admin@example.com")
                .displayName("Admin User")
                .build();
            userRepository.save(user);
        }
        org.mockito.Mockito.when(socialGraphEngine.suggestFriends(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.anyInt()))
            .thenReturn(java.util.Collections.emptyList());
        org.mockito.Mockito.when(socialGraphEngine.detectCommunity(org.mockito.ArgumentMatchers.any()))
            .thenReturn(java.util.Collections.emptySet());
    }

    @Test
    @WithMockUser(username = "admin")
    void testGetNetwork_ReturnsOk() throws Exception {
        mockMvc.perform(get("/api/graph/my-network")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin")
    void testGetCommunity_ReturnsOk() throws Exception {
        mockMvc.perform(get("/api/graph/stats")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk());
    }
}
