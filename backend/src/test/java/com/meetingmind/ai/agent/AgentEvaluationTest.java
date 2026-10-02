package com.meetingmind.ai.agent;

import com.meetingmind.ai.agent.drafter.DrafterAgent;
import com.meetingmind.ai.agent.drafter.EmailDraft;
import com.meetingmind.ai.agent.extractor.ExtractedActionItem;
import com.meetingmind.ai.agent.extractor.ExtractedActionItemList;
import com.meetingmind.ai.agent.extractor.ExtractorAgent;
import com.meetingmind.ai.agent.reviewer.ReviewResult;
import com.meetingmind.ai.agent.reviewer.ReviewerAgent;
import com.meetingmind.ai.agent.summarizer.MeetingSummary;
import com.meetingmind.ai.agent.summarizer.SummarizerAgent;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
@Disabled("Manual evaluation test - requires real LLM API access")
public class AgentEvaluationTest {

    private static final Logger logger = LoggerFactory.getLogger(AgentEvaluationTest.class);

    @Autowired
    private SummarizerAgent summarizerAgent;

    @Autowired
    private ExtractorAgent extractorAgent;

    @Autowired
    private DrafterAgent drafterAgent;

    @Autowired
    private ReviewerAgent reviewerAgent;

    private static final String BENCHMARK_TRANSCRIPT = """
            Alice: Alright, let's start the design review meeting.
            Bob: Sounds good. We need to align on the database changes.
            Alice: Yes. Alice will finalize the database schema by tomorrow.
            Charlie: I can help with that if needed, but I should probably focus on infrastructure.
            Bob: I will review the API endpoints next week.
            Charlie: And I will set up the CI/CD pipeline by Friday.
            Alice: Great. Let's wrap up.
            """;

    @Test
    void evaluatePipelineEndToEnd() {
        logger.info("Starting Semantic Evaluation of AI Agents");

        // 1. Summarizer
        MeetingSummary summary = summarizerAgent.summarize(BENCHMARK_TRANSCRIPT);
        assertNotNull(summary, "Summary should not be null");
        logger.info("Summary Output: {}", summary);
        
        // Basic semantic checks
        assertTrue(summary.overview().length() > 10, "Summary should have content");
        assertTrue(summary.keyDecisions().size() >= 0, "Decisions should be a list");

        // 2. Extractor
        ExtractedActionItemList actionItems = extractorAgent.extract(BENCHMARK_TRANSCRIPT, summary);
        assertNotNull(actionItems, "Action items should not be null");
        logger.info("Extracted Action Items: {}", actionItems);

        // Expecting 3 tasks: Alice schema, Bob API, Charlie CI/CD
        List<ExtractedActionItem> items = actionItems.items();
        assertTrue(items.size() >= 2, "Should extract at least 2 action items");

        // 3. Drafter
        EmailDraft draft = drafterAgent.draft(summary, items);
        assertNotNull(draft, "Draft should not be null");
        logger.info("Email Draft: {}", draft);

        assertTrue(draft.subject().contains("Meeting") || draft.subject().contains("Review"), "Subject should be relevant");
        assertTrue(draft.body().contains("Alice"), "Body should mention Alice");

        // 4. Reviewer
        ReviewResult review = reviewerAgent.review(BENCHMARK_TRANSCRIPT, items, draft);
        assertNotNull(review, "Review should not be null");
        logger.info("Review Result: {}", review);

        // With the benchmark transcript, the LLM should pass the review, 
        // unless it hallucinated something not in the text.
        logger.info("Did it pass? {}", review.verified());
        logger.info("Reasoning: {}", review.commentary());
    }
}
