package com.netgraph.backend.node;

import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public interface UserNodeRepository extends Neo4jRepository<UserNode, String> {

    @Query("MATCH (u:User {id: $userId})-[:FOLLOWS*2]->(fof:User) " +
           "WHERE NOT (u)-[:FOLLOWS]->(fof) AND fof.id <> $userId " +
           "RETURN fof.id as id, count(*) as mutualCount " +
           "ORDER BY mutualCount DESC LIMIT $limit")
    List<Map<String, Object>> suggestFriends(String userId, int limit);

    @Query("MATCH (start:User {id: $startId}), (end:User {id: $endId}) " +
           "MATCH p = shortestPath((start)-[:FOLLOWS*..6]->(end)) " +
           "RETURN [node in nodes(p) | node.id] AS path")
    List<String> findShortestPath(String startId, String endId);

    @Query("MATCH (u:User {id: $userId})-[:FOLLOWS*0..5]-(connected:User) " +
           "RETURN DISTINCT connected.id")
    List<String> findCommunity(String userId);
}
