package com.meetingmind.mcp.config;

import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.ai.tool.method.MethodToolCallbackProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class McpConfig {

    // In Spring AI M6, we explicitly define a ToolCallbackProvider if auto-discovery isn't picking them up.
    @Bean
    public ToolCallbackProvider meetingMindTools(
            com.meetingmind.mcp.tools.ActionItemTools actionItemTools,
            com.meetingmind.mcp.tools.MeetingTools meetingTools) {
        
        return MethodToolCallbackProvider.builder()
                .toolObjects(actionItemTools, meetingTools)
                .build();
    }
}
