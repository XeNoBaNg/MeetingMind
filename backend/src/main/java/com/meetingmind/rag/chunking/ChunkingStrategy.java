package com.meetingmind.rag.chunking;

public record ChunkingStrategy(
        int targetMinChars,
        int targetMaxChars,
        double overlapRatio,
        boolean preserveSpeakerTurns
) {
    public static ChunkingStrategy defaultStrategy() {
        // ~400 to ~800 tokens corresponds roughly to 1600 - 3200 characters in English
        return new ChunkingStrategy(1500, 3000, 0.15, true);
    }
}
