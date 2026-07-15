package com.netgraph.backend.service;

import com.netgraph.backend.entity.Post;
import com.netgraph.backend.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import opennlp.tools.doccat.DoccatFactory;
import opennlp.tools.doccat.DoccatModel;
import opennlp.tools.doccat.DocumentCategorizerME;
import opennlp.tools.doccat.DocumentSample;
import opennlp.tools.doccat.DocumentSampleStream;
import opennlp.tools.util.InputStreamFactory;
import opennlp.tools.util.ObjectStream;
import opennlp.tools.util.PlainTextByLineStream;
import opennlp.tools.util.TrainingParameters;
import jakarta.annotation.PostConstruct;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.io.InputStream;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiService {

    private final PostRepository postRepository;

    @Value("${openai.api.key:}")
    private String openAiKey;

    private DoccatModel sentimentModel;

    @PostConstruct
    public void trainModel() {
        try {
            InputStreamFactory dataIn = () -> getClass().getResourceAsStream("/sentiment_training.txt");
            ObjectStream<String> lineStream = new PlainTextByLineStream(dataIn, "UTF-8");
            ObjectStream<DocumentSample> sampleStream = new DocumentSampleStream(lineStream);

            TrainingParameters params = new TrainingParameters();
            params.put(TrainingParameters.ITERATIONS_PARAM, 100);
            params.put(TrainingParameters.CUTOFF_PARAM, 1);

            this.sentimentModel = DocumentCategorizerME.train("en", sampleStream, params, new DoccatFactory());
            log.info("ML Sentiment Model trained successfully.");
        } catch (Exception e) {
            log.error("Failed to train ML Sentiment Model", e);
            throw new RuntimeException("ML Model initialization failed", e);
        }
    }

    /**
     * Sentiment analysis — ML model scoring.
     * Returns: POSITIVE / NEGATIVE / NEUTRAL + score -1.0..1.0
     */
    public Map<String, Object> analyzeSentiment(String text) {
        if (text == null || text.isBlank()) return Map.of("label", "NEUTRAL", "score", 0.0);

        DocumentCategorizerME myCategorizer = new DocumentCategorizerME(sentimentModel);
        String[] tokens = text.toLowerCase().replaceAll("[^a-z\\s]", "").split("\\s+");
        
        double[] probabilities = myCategorizer.categorize(tokens);
        String category = myCategorizer.getBestCategory(probabilities);
        double prob = probabilities[myCategorizer.getIndex(category)];
        
        double finalScore = category.equals("NEGATIVE") ? -prob : (category.equals("NEUTRAL") ? 0.0 : prob);

        return Map.of("label", category, "score", Math.round(finalScore * 100.0) / 100.0);
    }

    /**
     * Analyze multiple posts at once for the insights dashboard.
     */
    public List<Map<String, Object>> analyzeBatch(List<Post> posts) {
        return posts.stream().map(p -> {
            Map<String, Object> s = analyzeSentiment(p.getContent());
            Map<String, Object> result = new HashMap<>(s);
            result.put("postId",      p.getId());
            result.put("preview",     p.getContent().length() > 60
                        ? p.getContent().substring(0, 60) + "…" : p.getContent());
            result.put("likeCount",   p.getLikeCount());
            result.put("trendScore",  p.getTrendScore());
            return result;
        }).collect(Collectors.toList());
    }

    /**
     * Extract trending hashtags + topics from recent posts.
     */
    public Map<String, Object> getTrendingTopics() {
        List<Post> recent = postRepository.findTop10ByOrderByTrendScoreDesc();
        if (recent.isEmpty()) return Map.of("hashtags", List.of(), "keywords", List.of());

        // Count hashtags
        Map<String, Integer> hashtagCount = new LinkedHashMap<>();
        Pattern hashtagPattern = Pattern.compile("#(\\w+)");
        for (Post p : recent) {
            Matcher m = hashtagPattern.matcher(p.getContent());
            while (m.find()) hashtagCount.merge(m.group(1).toLowerCase(), 1, Integer::sum);
        }

        // Extract top keywords (excluding stopwords)
        Set<String> stopwords = Set.of("the","a","an","is","in","it","of","to","and","or","for","on","at","this","that","are","was","with","be","as","by","from","you","we","i","have","had","but","not","my","our","their","so","do","did","can","will","would","should","could","may","might","has","been","were","he","she","they","me","him","her","us","them","what","which","who","when","where","how","your","its","into","than","more","up","out","if","about","also","just","get","got","all","new","one","some","any","no","yes","very");
        Map<String, Integer> wordCount = new LinkedHashMap<>();
        for (Post p : recent) {
            for (String word : p.getContent().toLowerCase().replaceAll("[^a-z\\s]", "").split("\\s+")) {
                if (word.length() > 3 && !stopwords.contains(word))
                    wordCount.merge(word, 1, Integer::sum);
            }
        }

        List<Map<String, Object>> hashtags = hashtagCount.entrySet().stream()
            .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
            .limit(10).map(e -> Map.<String, Object>of("tag", "#" + e.getKey(), "count", e.getValue()))
            .collect(Collectors.toList());

        List<Map<String, Object>> keywords = wordCount.entrySet().stream()
            .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
            .limit(12).map(e -> Map.<String, Object>of("word", e.getKey(), "count", e.getValue()))
            .collect(Collectors.toList());

        return Map.of("hashtags", hashtags, "keywords", keywords);
    }

    /**
     * Estimate engagement score for a post draft (0-100).
     * Formula based on: length, hashtag usage, emojis, question marks, call-to-action words.
     */
    public Map<String, Object> scoreContent(String content) {
        if (content == null || content.isBlank())
            return Map.of("score", 0, "tips", List.of("Write something to get a score!"));

        double score = 0;
        List<String> tips = new ArrayList<>();

        int len = content.length();
        // Ideal length 100-280 chars
        if (len >= 80 && len <= 280)  { score += 25; }
        else if (len < 30)            { score += 5;  tips.add("💬 Write more — short posts get less engagement."); }
        else if (len > 500)           { score += 15; tips.add("✂️ Try to be more concise — under 280 chars performs best."); }
        else                          { score += 18; }

        // Hashtags (1-3 is optimal)
        long hashCount = content.chars().filter(c -> c == '#').count();
        if (hashCount >= 1 && hashCount <= 3) { score += 20; }
        else if (hashCount == 0)              { score += 5;  tips.add("🏷️ Add 1-3 hashtags to boost discoverability."); }
        else                                  { score += 10; tips.add("🏷️ Too many hashtags look spammy — aim for 1-3."); }

        // Emojis boost engagement
        long emojiCount = content.codePoints().filter(c -> c >= 0x1F300).count();
        if (emojiCount >= 1 && emojiCount <= 3) { score += 15; }
        else if (emojiCount == 0)               { tips.add("😊 Add an emoji to make your post more eye-catching."); }
        else                                    { score += 8; }

        // Question → drives comments
        if (content.contains("?")) { score += 15; }
        else                       { tips.add("❓ Ask a question to spark conversations."); }

        // Call-to-action words
        String lower = content.toLowerCase();
        for (String cta : List.of("share", "comment", "follow", "check", "thoughts", "think", "what do you")) {
            if (lower.contains(cta)) { score += 10; break; }
        }

        // Positive sentiment bonus
        Map<String, Object> sentiment = analyzeSentiment(content);
        if ("POSITIVE".equals(sentiment.get("label"))) score += 10;

        score = Math.min(score, 100);
        if (tips.isEmpty()) tips.add("✅ Great post! You're hitting all the best practices.");

        return Map.of("score", (int) Math.round(score), "tips", tips,
                      "sentiment", sentiment.get("label"));
    }

    /**
     * Generate post ideas based on trending topics on the platform.
     * If OpenAI API key is set, uses GPT-4o-mini; otherwise uses smart templates.
     */
    public List<String> generatePostIdeas(String topic) {
        if (openAiKey != null && !openAiKey.isBlank()) {
            return generateWithOpenAI(topic);
        }
        return generateWithTemplates(topic);
    }

    private List<String> generateWithTemplates(String topic) {
        String t = (topic == null || topic.isBlank()) ? "technology" : topic.trim();
        String cap = t.substring(0, 1).toUpperCase() + t.substring(1);
        return List.of(
            "🚀 Just discovered something fascinating about " + t + " that's changing how I think about everything. What's your take? #" + t.replaceAll("\\s+", "") + " #innovation",
            "💡 The future of " + t + " isn't what most people think. Here's what I've learned after months of exploring this space:",
            "🤔 Hot take: " + cap + " will look completely different in 5 years. Are we ready for what's coming? Share your thoughts below! 👇",
            "✨ 3 things I wish I knew about " + t + " when I started:\n1. ___\n2. ___\n3. ___\nWhat would you add?",
            "📊 Been deep-diving into " + t + " trends and the data is surprising. The patterns that matter most are often the ones we overlook. #" + t.replaceAll("\\s+", "") + " #data"
        );
    }

    private List<String> generateWithOpenAI(String topic) {
        try {
            String prompt = "Generate 5 engaging social media post ideas about: " + topic +
                ". Each should be concise (under 280 chars), include 1-2 hashtags, and have an emoji. Return as JSON array of strings.";

            String body = """
                {
                  "model": "gpt-4o-mini",
                  "messages": [{"role": "user", "content": "%s"}],
                  "max_tokens": 600
                }
                """.formatted(prompt.replace("\"", "\\\""));

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create("https://api.openai.com/v1/chat/completions"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + openAiKey)
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

            HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
            String responseBody = res.body();

            // Extract the content from OpenAI JSON response (simple extraction)
            int start = responseBody.indexOf("\"content\":\"") + 11;
            int end   = responseBody.indexOf("\",", start);
            if (start > 11 && end > start) {
                String content = responseBody.substring(start, end)
                    .replace("\\n", "\n").replace("\\\"", "\"");
                // Parse the JSON array from the content
                log.info("OpenAI response received for topic: {}", topic);
                return List.of(content.split("\",\\s*\""));
            }
            throw new RuntimeException("AI generation returned invalid response format");
        } catch (Exception e) {
            log.error("OpenAI call failed: {}", e.getMessage());
            throw new RuntimeException("AI generation failed", e);
        }
    }
}
