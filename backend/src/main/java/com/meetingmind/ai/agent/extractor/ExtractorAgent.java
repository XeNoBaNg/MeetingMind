package com.meetingmind.ai.agent.extractor;

import com.meetingmind.ai.agent.summarizer.MeetingSummary;
import com.meetingmind.common.exception.AiPipelineException;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

@Component
public class ExtractorAgent {

    private final ChatClient chatClient;
    
    @Value("classpath:prompts/extractor/extractor-prompt.st")
    private Resource promptTemplate;

    public ExtractorAgent(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    public ExtractedActionItemList extract(String transcript, MeetingSummary summary) {
        if (transcript == null || transcript.trim().isEmpty()) {
            throw new AiPipelineException("Transcript cannot be empty");
        }
        if (summary == null) {
            throw new AiPipelineException("MeetingSummary cannot be null");
        }

        try {
            return chatClient.prompt()
                .user(u -> u.text(promptTemplate)
                    .param("transcript", transcript)
                    .param("summary", summary))
                .call()
                .entity(ExtractedActionItemList.class);
        } catch (Exception e) {
            throw new AiPipelineException("Failed to extract action items: " + e.getMessage(), e);
        }
    }
}
