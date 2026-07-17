package com.netgraph.backend.controller;

import com.netgraph.backend.service.GraphSyncService;
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

@SpringBootTest
@AutoConfigureMockMvc
public class GraphIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private GraphSyncService graphSyncService;

    @Test
    @WithMockUser(username = "admin")
    void testGetNetwork_ReturnsOk() throws Exception {
        mockMvc.perform(get("/api/graph/network")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin")
    void testGetCommunity_ReturnsOk() throws Exception {
        mockMvc.perform(get("/api/graph/community")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk());
    }
}
