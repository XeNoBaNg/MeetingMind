package com.meetingmind.ai.agent.summarizer;

import com.meetingmind.common.exception.AiPipelineException;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

@Component
public class SummarizerAgent {

    private final ChatClient chatClient;
    
    @Value("classpath:prompts/summarizer/summarizer-prompt.st")
    private Resource promptTemplate;

    public SummarizerAgent(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    public MeetingSummary summarize(String transcript) {
        if (transcript == null || transcript.trim().isEmpty()) {
            throw new AiPipelineException("Transcript cannot be empty");
        }

        try {
            return chatClient.prompt()
                .user(u -> u.text(promptTemplate).param("transcript", transcript))
                .call()
                .entity(MeetingSummary.class);
        } catch (Exception e) {
            throw new AiPipelineException("Failed to summarize transcript: " + e.getMessage(), e);
        }
    }
}
