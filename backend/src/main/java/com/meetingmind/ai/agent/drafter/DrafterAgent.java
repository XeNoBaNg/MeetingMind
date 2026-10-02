package com.meetingmind.ai.agent.drafter;

import com.meetingmind.ai.agent.extractor.ExtractedActionItem;
import com.meetingmind.ai.agent.summarizer.MeetingSummary;
import com.meetingmind.common.exception.AiPipelineException;
import com.meetingmind.mcp.client.domain.CalendarAvailability;
import com.meetingmind.mcp.client.domain.CalendarAvailabilityRequest;
import com.meetingmind.mcp.client.service.CalendarService;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.model.function.FunctionCallback;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.ai.retry.NonTransientAiException;

import java.util.List;

@Component
public class DrafterAgent {

    private final ChatClient chatClient;
    
    @Value("classpath:prompts/drafter/drafter-prompt.st")
    private Resource promptTemplate;

    public DrafterAgent(ChatClient.Builder chatClientBuilder, CalendarService calendarService) {
        this.chatClient = chatClientBuilder
            .defaultFunctions(FunctionCallback.builder()
                .function("checkCalendarAvailability", (CalendarAvailabilityRequest req) -> calendarService.checkAvailability(req.date(), req.time()))
                .description("Checks calendar availability for a given date and time.")
                .inputType(CalendarAvailabilityRequest.class)
                .build())
            .build();
    }

    public EmailDraft draft(MeetingSummary summary, List<ExtractedActionItem> actionItems) {
        if (summary == null) {
            throw new AiPipelineException("MeetingSummary cannot be null");
        }
        if (actionItems == null) {
            throw new AiPipelineException("Action items cannot be null");
        }

        try {
            return chatClient.prompt()
                .user(u -> u.text(promptTemplate)
                    .param("summary", summary)
                    .param("actionItems", actionItems))
                .call()
                .entity(EmailDraft.class);
        } catch (NonTransientAiException e) {
            String msg = e.getMessage();
            if (msg != null && msg.contains("failed_generation") && msg.contains("tool_use_failed")) {
                try {
                    // Extract the JSON part after "400 - "
                    int jsonStart = msg.indexOf("{");
                    if (jsonStart != -1) {
                        String errorJson = msg.substring(jsonStart);
                        ObjectMapper mapper = new ObjectMapper();
                        JsonNode root = mapper.readTree(errorJson);
                        String failedGenStr = root.path("error").path("failed_generation").asText();
                        if (failedGenStr != null && !failedGenStr.isEmpty()) {
                            JsonNode failedGenNode = mapper.readTree(failedGenStr);
                            JsonNode argsNode = failedGenNode.path("arguments");
                            
                            // Sometimes arguments is a stringified JSON, sometimes it's an object
                            String argumentsStr = argsNode.isTextual() ? argsNode.asText() : argsNode.toString();
                            return mapper.readValue(argumentsStr, EmailDraft.class);
                        }
                    }
                } catch (Exception parseEx) {
                    // Fallthrough to the original exception if parsing fails
                }
            }
            throw new AiPipelineException("Failed to draft email: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new AiPipelineException("Failed to draft email: " + e.getMessage(), e);
        }
    }
}
