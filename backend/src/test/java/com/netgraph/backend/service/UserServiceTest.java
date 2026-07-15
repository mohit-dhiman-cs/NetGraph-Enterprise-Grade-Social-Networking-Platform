package com.netgraph.backend.service;

import com.netgraph.backend.entity.User;
import com.netgraph.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private GraphSyncService graphSyncService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private UserService userService;

    @Test
    void followUser_Success() {
        User userA = new User();
        userA.setId("userA");
        userA.setDisplayName("User A");
        User userB = new User();
        userB.setId("userB");

        when(userRepository.findById("userA")).thenReturn(Optional.of(userA));
        when(userRepository.findById("userB")).thenReturn(Optional.of(userB));
        
        // Mock Neo4j sync
        doNothing().when(graphSyncService).syncFollow("userA", "userB");
        
        when(userRepository.save(userA)).thenReturn(userA);
        when(userRepository.save(userB)).thenReturn(userB);

        userService.follow("userA", "userB");

        assertTrue(userA.getFollowing().contains(userB));
        assertEquals(1, userB.getFollowerCount());
        verify(graphSyncService, times(1)).syncFollow("userA", "userB");
    }

    @Test
    void followUser_AlreadyFollowing_DoesNotFail() {
        User userA = new User();
        userA.setId("userA");
        User userB = new User();
        userB.setId("userB");
        userA.getFollowing().add(userB); // Already following

        when(userRepository.findById("userA")).thenReturn(Optional.of(userA));
        when(userRepository.findById("userB")).thenReturn(Optional.of(userB));

        userService.follow("userA", "userB");
        
        // If already following, it just ignores the add, and doesn't call graphSyncService
        verify(graphSyncService, never()).syncFollow("userA", "userB");
    }
}
