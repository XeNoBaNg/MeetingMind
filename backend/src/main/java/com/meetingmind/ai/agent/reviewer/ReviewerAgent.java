package com.meetingmind.ai.agent.reviewer;

import com.meetingmind.ai.agent.drafter.EmailDraft;
import com.meetingmind.ai.agent.extractor.ExtractedActionItem;
import com.meetingmind.common.exception.AiPipelineException;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ReviewerAgent {

    private final ChatClient chatClient;
    
    @Value("classpath:prompts/reviewer/reviewer-prompt.st")
    private Resource promptTemplate;

    public ReviewerAgent(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    public ReviewResult review(String rawTranscript, List<ExtractedActionItem> actionItems, EmailDraft emailDraft) {
        if (rawTranscript == null || rawTranscript.trim().isEmpty()) {
            throw new AiPipelineException("Transcript cannot be empty");
        }

        try {
            return chatClient.prompt()
                .user(u -> u.text(promptTemplate)
                    .param("rawTranscript", rawTranscript)
                    .param("actionItems", actionItems)
                    .param("emailDraft", emailDraft))
                .call()
                .entity(ReviewResult.class);
        } catch (Exception e) {
            throw new AiPipelineException("Failed to review outputs: " + e.getMessage(), e);
        }
    }
}
