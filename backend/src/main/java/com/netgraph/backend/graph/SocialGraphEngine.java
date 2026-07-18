package com.netgraph.backend.graph;

import com.netgraph.backend.entity.User;
import com.netgraph.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.neo4j.driver.Driver;
import org.neo4j.driver.Session;
import org.neo4j.driver.Record;
import org.neo4j.driver.Result;
import org.springframework.stereotype.Component;
import org.springframework.cache.annotation.Cacheable;

import java.util.*;

/**
 * NetGraph Social Graph Engine
 * Powered by Neo4j Native Graph Traversals.
 */
@Component
@RequiredArgsConstructor
@lombok.extern.slf4j.Slf4j
public class SocialGraphEngine {

    private final Driver neo4jDriver;
    private final UserRepository userRepository;

    /**
     * Neo4j Native Shortest Path Algorithm
     */
    public List<String> shortestPath(User source, User target, int maxDepth) {
        try (Session session = neo4jDriver.session()) {
            Result result = session.run("MATCH (start:User {id: $startId}), (end:User {id: $endId}) " +
                            "MATCH p = shortestPath((start)-[:FOLLOWS*..6]->(end)) " +
                            "RETURN [node in nodes(p) | node.id] AS path",
                    org.neo4j.driver.Values.parameters(
                            "startId", source.getId(),
                            "endId", target.getId()
                    ));
            if (result.hasNext()) {
                Record record = result.next();
                return record.get("path").asList(org.neo4j.driver.Value::asString);
            }
            return Collections.emptyList();
        } catch (Exception e) {
            log.warn("Neo4j shortestPath failed: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Neo4j Cypher Friend Recommendations (2-hop mutual scoring)
     */
    @Cacheable(value = "friendSuggestions", key = "#user.id")
    public List<ScoredUser> suggestFriends(User user, int limit) {
        try (Session session = neo4jDriver.session()) {
            Result result = session.run("MATCH (u:User {id: $userId})-[:FOLLOWS*2]->(fof:User) " +
                            "WHERE NOT (u)-[:FOLLOWS]->(fof) AND fof.id <> $userId " +
                            "RETURN fof.id as id, count(*) as mutualCount " +
                            "ORDER BY mutualCount DESC LIMIT $limit",
                    org.neo4j.driver.Values.parameters(
                            "userId", user.getId(),
                            "limit", limit
                    ));
            
            List<ScoredUser> suggestions = new ArrayList<>();
            while (result.hasNext()) {
                Record record = result.next();
                String id = record.get("id").asString();
                int score = record.get("mutualCount").asInt();
                userRepository.findById(id).ifPresent(u -> 
                    suggestions.add(new ScoredUser(u, score))
                );
            }
            return suggestions;
        } catch (Exception e) {
            log.warn("Neo4j suggestFriends failed: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Neo4j Reachability Analysis for Community Detection
     */
    public Set<String> detectCommunity(User startUser) {
        try (Session session = neo4jDriver.session()) {
            Result result = session.run("MATCH (u:User {id: $userId})-[:FOLLOWS*0..5]-(connected:User) " +
                            "RETURN DISTINCT connected.id as id",
                    org.neo4j.driver.Values.parameters(
                            "userId", startUser.getId()
                    ));
            Set<String> community = new HashSet<>();
            while (result.hasNext()) {
                community.add(result.next().get("id").asString());
            }
            return community;
        } catch (Exception e) {
            log.warn("Neo4j detectCommunity failed: {}", e.getMessage());
            return Collections.emptySet();
        }
    }

    public record ScoredUser(User user, int score) implements java.io.Serializable {}
}
