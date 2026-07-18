package com.netgraph.backend.service;

import com.netgraph.backend.entity.User;
import lombok.RequiredArgsConstructor;
import org.neo4j.driver.Driver;
import org.neo4j.driver.Session;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@lombok.extern.slf4j.Slf4j
public class GraphSyncService {

    private final Driver neo4jDriver;

    public void syncUser(User user) {
        try (Session session = neo4jDriver.session()) {
            session.run("MERGE (u:User {id: $id}) SET u.username = $username, u.displayName = $displayName",
                    org.neo4j.driver.Values.parameters(
                            "id", user.getId(),
                            "username", user.getUsername(),
                            "displayName", user.getDisplayName()
                    ));
        } catch (Exception e) {
            log.error("Failed to sync user to Neo4j: {}", e.getMessage());
            throw new RuntimeException("Failed to sync user to Neo4j", e);
        }
    }

    public void syncFollow(String followerId, String followingId) {
        try (Session session = neo4jDriver.session()) {
            session.run("MATCH (f:User {id: $followerId}), (t:User {id: $followingId}) " +
                            "MERGE (f)-[:FOLLOWS]->(t)",
                    org.neo4j.driver.Values.parameters(
                            "followerId", followerId,
                            "followingId", followingId
                    ));
        } catch (Exception e) {
            log.error("Failed to sync follow to Neo4j: {}", e.getMessage());
            throw new RuntimeException("Failed to sync follow to Neo4j", e);
        }
    }

    public void syncUnfollow(String followerId, String followingId) {
        try (Session session = neo4jDriver.session()) {
            session.run("MATCH (f:User {id: $followerId})-[r:FOLLOWS]->(t:User {id: $followingId}) " +
                            "DELETE r",
                    org.neo4j.driver.Values.parameters(
                            "followerId", followerId,
                            "followingId", followingId
                    ));
        } catch (Exception e) {
            log.error("Failed to sync unfollow to Neo4j: {}", e.getMessage());
            throw new RuntimeException("Failed to sync unfollow to Neo4j", e);
        }
    }
}
