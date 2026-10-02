package com.meetingmind.rag.model;

public record RagQueryRequest(
        String query,
        Integer topK,
        Double minSimilarity
) {
    public RagQueryRequest {
        if (query == null || query.trim().isEmpty()) {
            throw new IllegalArgumentException("Query cannot be null or blank");
        }
        if (topK == null || topK <= 0) {
            topK = 4;
        }
        if (minSimilarity == null || minSimilarity < 0.0) {
            minSimilarity = 0.15;
        }
    }
}
