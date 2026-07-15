package com.netgraph.backend.node;

import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;
import org.springframework.data.neo4j.core.schema.Relationship;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Node("User")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserNode {

    @Id
    private String id; // Matches the JPA User ID

    private String username;
    private String displayName;

    @Relationship(type = "FOLLOWS", direction = Relationship.Direction.OUTGOING)
    @Builder.Default
    private Set<UserNode> following = new HashSet<>();
}
