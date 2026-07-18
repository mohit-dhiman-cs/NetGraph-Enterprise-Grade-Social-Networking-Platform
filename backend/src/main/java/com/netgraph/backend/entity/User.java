package com.netgraph.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.io.Serializable;

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_user_username", columnList = "username"),
    @Index(name = "idx_user_email", columnList = "email")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @NotBlank
    @Column(unique = true, nullable = false)
    private String username;

    @Email @NotBlank
    @Column(unique = true, nullable = false)
    private String email;

    @JsonIgnore
    @Column(nullable = true)
    private String password;

    private String displayName;
    private String bio;
    private String avatarUrl;
    private String location;
    private String website;

    @Builder.Default
    private String provider = "local";

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Role role = Role.USER;

    @Builder.Default
    private boolean active = true;

    @Builder.Default
    private int followerCount = 0;

    @Builder.Default
    private int followingCount = 0;

    @Builder.Default
    private int postCount = 0;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // Graph adjacency list — who this user follows
    @JsonIgnore
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "user_follows",
        joinColumns = @JoinColumn(name = "follower_id"),
        inverseJoinColumns = @JoinColumn(name = "following_id")
    )
    @Builder.Default
    private Set<User> following = new HashSet<>();

    // Reverse edge — who follows this user
    @JsonIgnore
    @ManyToMany(mappedBy = "following", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<User> followers = new HashSet<>();

    public enum Role {
        USER, ADMIN, MODERATOR
    }
}
