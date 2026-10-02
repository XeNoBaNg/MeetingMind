package com.meetingmind.mcp.client.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.meetingmind.mcp.client.domain.CalendarAvailability;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import io.modelcontextprotocol.client.McpSyncClient;
import io.modelcontextprotocol.spec.McpSchema;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class McpCalendarServiceImpl implements CalendarService {

    private static final Logger log = LoggerFactory.getLogger(McpCalendarServiceImpl.class);
    
    private final McpSyncClient mcpClient;
    private final ObjectMapper objectMapper;

    public McpCalendarServiceImpl(McpSyncClient mcpClient, ObjectMapper objectMapper) {
        this.mcpClient = mcpClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public CalendarAvailability checkAvailability(String date, String time) {
        log.info("Checking calendar availability for {} {}", date, time);
        try {
            McpSchema.CallToolRequest request = new McpSchema.CallToolRequest("check_availability", Map.of(
                "date", date != null ? date : "",
                "time", time != null ? time : ""
            ));
            
            McpSchema.CallToolResult result = mcpClient.callTool(request);
            
            if (result.content() != null && !result.content().isEmpty()) {
                String text = ((McpSchema.TextContent) result.content().get(0)).text();
                JsonNode json = objectMapper.readTree(text);
                
                boolean isAvailable = json.has("isAvailable") && json.get("isAvailable").asBoolean();
                String reason = json.has("reason") ? json.get("reason").asText() : "";
                
                return new CalendarAvailability(isAvailable, reason, true);
            }
            
            return new CalendarAvailability(false, "No response from Calendar MCP server", true);
            
        } catch (Exception e) {
            log.warn("Failed to check calendar availability. Calendar MCP server may be unreachable: {}", e.getMessage());
            return new CalendarAvailability(false, "Calendar service is temporarily unavailable", false);
        }
    }
}
