package com.netgraph.backend.service;

import com.netgraph.backend.dto.AuthDtos;
import com.netgraph.backend.entity.User;
import com.netgraph.backend.entity.PasswordResetToken;
import com.netgraph.backend.repository.PasswordResetTokenRepository;
import com.netgraph.backend.repository.UserRepository;
import com.netgraph.backend.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final GraphSyncService graphSyncService;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;

    @Transactional
    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest req) {
        if (userRepository.existsByUsername(req.username()))
            throw new IllegalArgumentException("Username already taken.");
        if (userRepository.existsByEmail(req.email()))
            throw new IllegalArgumentException("Email already registered.");

        User user = User.builder()
            .username(req.username())
            .email(req.email())
            .password(passwordEncoder.encode(req.password()))
            .displayName(req.displayName() != null ? req.displayName() : req.username())
            .role(User.Role.USER)
            .build();
            
        user = userRepository.save(user);
        System.out.println("User saved with ID: " + user.getId());
        
        // Sync to Neo4j — failures MUST bubble up to rollback the Postgres transaction
        graphSyncService.syncUser(user);

        try {
            Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.username(), req.password())
            );
            String token = jwtTokenProvider.generateToken(auth);
            return new AuthDtos.AuthResponse(token, user.getId(), user.getUsername(),
                user.getDisplayName(), user.getRole().name());
        } catch (Exception e) {
            System.err.println("Authentication failed after registration: " + e.getMessage());
            throw e;
        }
    }

    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest req) {
        Authentication auth = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(req.username(), req.password())
        );
        String token = jwtTokenProvider.generateToken(auth);
        User user = userRepository.findByUsername(req.username())
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return new AuthDtos.AuthResponse(token, user.getId(), user.getUsername(),
            user.getDisplayName(), user.getRole().name());
    }

    @Transactional
    public void forgotPassword(AuthDtos.ForgotPasswordRequest req) {
        User user = userRepository.findByEmail(req.email())
            .orElseThrow(() -> new IllegalArgumentException("No user found with that email"));
            
        tokenRepository.deleteByUserId(user.getId());
        
        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setToken(UUID.randomUUID().toString());
        token.setExpiryDate(LocalDateTime.now().plusHours(1));
        tokenRepository.save(token);
        
        emailService.sendPasswordResetEmail(user.getEmail(), token.getToken());
    }

    @Transactional
    public void resetPassword(AuthDtos.ResetPasswordRequest req) {
        PasswordResetToken token = tokenRepository.findByToken(req.token())
            .orElseThrow(() -> new IllegalArgumentException("Invalid token"));
            
        if (token.isExpired()) {
            tokenRepository.delete(token);
            throw new IllegalArgumentException("Token has expired");
        }
        
        User user = token.getUser();
        user.setPassword(passwordEncoder.encode(req.newPassword()));
        userRepository.save(user);
        
        tokenRepository.delete(token);
    }
}
