package com.netgraph.backend.dto;

public record UserSummaryDto(
    String id,
    String username,
    String displayName,
    String avatarUrl,
    int followerCount,
    int followingCount,
    int postCount,
    String bio,
    String location,
    String website,
    boolean isFollowing
) {}
