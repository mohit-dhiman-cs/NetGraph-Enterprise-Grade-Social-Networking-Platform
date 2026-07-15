package com.netgraph.backend.controller;

import com.netgraph.backend.entity.Post;
import com.netgraph.backend.repository.PostRepository;
import com.netgraph.backend.service.AiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Tag(name = "AI & Intelligence", description = "Sentiment analysis, post scoring, topic insights")
@SecurityRequirement(name = "bearerAuth")
public class AiController {

    private final AiService     aiService;
    private final PostRepository postRepository;

    /** Analyze sentiment of any text */
    @PostMapping("/sentiment")
    @Operation(summary = "Analyze text sentiment (POSITIVE / NEUTRAL / NEGATIVE)")
    public ResponseEntity<Map<String, Object>> sentiment(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(aiService.analyzeSentiment(body.getOrDefault("text", "")));
    }

    /** Score a post draft for engagement potential */
    @PostMapping("/score")
    @Operation(summary = "Score a post draft 0-100 with improvement tips")
    public ResponseEntity<Map<String, Object>> score(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(aiService.scoreContent(body.getOrDefault("content", "")));
    }

    /** Trending topics + hashtags extracted from platform posts */
    @GetMapping("/trending-topics")
    @Operation(summary = "Get trending keywords and hashtags from recent posts")
    public ResponseEntity<Map<String, Object>> trendingTopics() {
        return ResponseEntity.ok(aiService.getTrendingTopics());
    }

    /** Generate post ideas for a topic */
    @GetMapping("/generate")
    @Operation(summary = "Generate post ideas for a given topic")
    public ResponseEntity<List<String>> generate(@RequestParam(defaultValue = "") String topic) {
        return ResponseEntity.ok(aiService.generatePostIdeas(topic));
    }

    /** Sentiment dashboard — analyze top trending posts */
    @GetMapping("/sentiment-dashboard")
    @Operation(summary = "Sentiment analysis of trending posts for the dashboard")
    public ResponseEntity<List<Map<String, Object>>> sentimentDashboard() {
        List<Post> trending = postRepository.findTop10ByOrderByTrendScoreDesc();
        return ResponseEntity.ok(aiService.analyzeBatch(trending));
    }

    /** Analyze all recent posts from a specific timeframe */
    @GetMapping("/insights")
    @Operation(summary = "Platform-wide AI insights")
    public ResponseEntity<Map<String, Object>> insights() {
        List<Post> posts   = postRepository.findTop10ByOrderByTrendScoreDesc();
        long positive      = posts.stream().filter(p -> "POSITIVE".equals(aiService.analyzeSentiment(p.getContent()).get("label"))).count();
        long negative      = posts.stream().filter(p -> "NEGATIVE".equals(aiService.analyzeSentiment(p.getContent()).get("label"))).count();
        long neutral       = posts.size() - positive - negative;

        return ResponseEntity.ok(Map.of(
            "totalAnalyzed", posts.size(),
            "positive",  positive,
            "negative",  negative,
            "neutral",   neutral,
            "topics",    aiService.getTrendingTopics(),
            "healthScore", posts.isEmpty() ? 100 : (int)(positive * 100.0 / posts.size())
        ));
    }
}
