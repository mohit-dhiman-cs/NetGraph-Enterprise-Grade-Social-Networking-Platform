package com.netgraph.backend.dto;

import java.util.Set;

public record GraphData(Set<Node> nodes, Set<Link> links) {
    public record Node(String id, String label, String color) {}
    public record Link(String source, String target) {}
}
