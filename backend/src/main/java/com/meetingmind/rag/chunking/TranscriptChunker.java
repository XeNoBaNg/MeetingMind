package com.meetingmind.rag.chunking;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.document.Document;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class TranscriptChunker {

    private static final Logger logger = LoggerFactory.getLogger(TranscriptChunker.class);

    // Matches patterns like "Alex: hello", "[Alex]: hello", "Alex (Tech Lead): hello", or "[00:12] Alex: hello"
    private static final Pattern SPEAKER_PATTERN = Pattern.compile(
            "^(?:(?:\\[?\\d{1,2}:\\d{2}(?::\\d{2})?(?:\\s*[APMapm]{2})?\\]?)\\s+)?\\[?([A-Za-z0-9_\\s]{2,35})\\]?:\\s*(.*)$"
    );

    private final ChunkingStrategy strategy;

    public TranscriptChunker() {
        this(ChunkingStrategy.defaultStrategy());
    }

    public TranscriptChunker(ChunkingStrategy strategy) {
        this.strategy = strategy;
    }

    public record Turn(String speaker, String content) {}

    public List<Document> chunkTranscript(UUID meetingId, String meetingTitle, LocalDate meetingDate, String transcript) {
        return chunkTranscript(meetingId, null, meetingTitle, meetingDate, transcript);
    }

    public List<Document> chunkTranscript(UUID meetingId, UUID ownerId, String meetingTitle, LocalDate meetingDate, String transcript) {
        if (transcript == null || transcript.trim().isEmpty()) {
            return List.of();
        }

        List<Turn> turns = parseTurns(transcript);
        if (turns.isEmpty()) {
            return List.of();
        }

        List<Document> documents = new ArrayList<>();
        int i = 0;
        int chunkIndex = 0;

        while (i < turns.size()) {
            StringBuilder chunkContent = new StringBuilder();
            Set<String> speakers = new LinkedHashSet<>();
            int startIndex = i;

            while (i < turns.size()) {
                Turn currentTurn = turns.get(i);
                String turnText = formatTurn(currentTurn);

                // If adding this turn would exceed max target and we already have minimum content, stop
                if (chunkContent.length() > 0 
                        && (chunkContent.length() + turnText.length() > strategy.targetMaxChars())
                        && chunkContent.length() >= strategy.targetMinChars()) {
                    break;
                }

                if (chunkContent.length() > 0) {
                    chunkContent.append("\n\n");
                }
                chunkContent.append(turnText);
                if (currentTurn.speaker() != null && !currentTurn.speaker().isBlank()) {
                    speakers.add(currentTurn.speaker().trim());
                }
                i++;

                // If we've reached a good target size, check if we can end chunk at this speaker turn boundary
                if (chunkContent.length() >= strategy.targetMinChars()) {
                    break;
                }
            }

            String content = chunkContent.toString().trim();
            if (!content.isEmpty()) {
                Map<String, Object> metadata = new HashMap<>();
                metadata.put("meetingId", meetingId.toString());
                if (ownerId != null) {
                    metadata.put("ownerId", ownerId.toString());
                }
                metadata.put("meetingTitle", meetingTitle != null ? meetingTitle : "Untitled Meeting");
                metadata.put("meetingDate", meetingDate != null ? meetingDate.toString() : LocalDate.now().toString());
                metadata.put("chunkIndex", chunkIndex++);
                metadata.put("speakers", new ArrayList<>(speakers));

                documents.add(new Document(content, metadata));
            }

            // Calculate overlap: step back by turns that correspond to ~10-15% of chunk turns
            if (i < turns.size()) {
                int turnsConsumed = i - startIndex;
                int overlapTurns = Math.max(1, (int) Math.round(turnsConsumed * strategy.overlapRatio()));
                if (overlapTurns >= turnsConsumed) {
                    overlapTurns = Math.max(0, turnsConsumed - 1);
                }
                i = i - overlapTurns;
            }
        }

        logger.debug("Chunked transcript for meeting {} into {} chunks", meetingId, documents.size());
        return documents;
    }

    private List<Turn> parseTurns(String transcript) {
        List<Turn> turns = new ArrayList<>();
        String[] lines = transcript.split("\\r?\\n");

        Turn currentTurn = null;
        StringBuilder currentBuffer = new StringBuilder();

        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) {
                continue;
            }

            Matcher matcher = SPEAKER_PATTERN.matcher(trimmed);
            if (matcher.matches()) {
                // Flush previous turn
                if (currentTurn != null) {
                    turns.add(new Turn(currentTurn.speaker(), currentBuffer.toString().trim()));
                    currentBuffer.setLength(0);
                }
                String speaker = matcher.group(1).trim();
                String text = matcher.group(2).trim();
                currentTurn = new Turn(speaker, text);
                currentBuffer.append(text);
            } else {
                if (currentTurn != null) {
                    // Continuation of current speaker
                    if (currentBuffer.length() > 0) {
                        currentBuffer.append(" ");
                    }
                    currentBuffer.append(trimmed);
                } else {
                    // Unassigned text block before any speaker pattern
                    turns.add(new Turn(null, trimmed));
                }
            }
        }

        if (currentTurn != null && currentBuffer.length() > 0) {
            turns.add(new Turn(currentTurn.speaker(), currentBuffer.toString().trim()));
        }

        // If no speaker turns were detected at all, split transcript into paragraphs
        if (turns.isEmpty()) {
            String[] paragraphs = transcript.split("\\r?\\n\\s*\\r?\\n");
            for (String p : paragraphs) {
                String clean = p.trim();
                if (!clean.isEmpty()) {
                    turns.add(new Turn(null, clean));
                }
            }
        }

        return turns;
    }

    private String formatTurn(Turn turn) {
        if (turn.speaker() != null && !turn.speaker().isBlank()) {
            return turn.speaker() + ": " + turn.content();
        }
        return turn.content();
    }
}
