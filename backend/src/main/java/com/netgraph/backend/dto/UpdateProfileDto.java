package com.netgraph.backend.dto;

import lombok.Data;

@Data
public class UpdateProfileDto {
    private String displayName;
    private String bio;
    private String avatarUrl;
    private String location;
    private String website;
}
