package com.meetingmind.mcp.client.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.meetingmind.mcp.client.domain.CalendarAvailability;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import io.modelcontextprotocol.client.McpSyncClient;
import io.modelcontextprotocol.spec.McpSchema;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class McpCalendarServiceImplTest {

    @Mock
    private McpSyncClient mcpSyncClient;

    private ObjectMapper objectMapper;
    private McpCalendarServiceImpl calendarService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        objectMapper = new ObjectMapper();
        calendarService = new McpCalendarServiceImpl(mcpSyncClient, objectMapper);
    }

    @Test
    void testCheckAvailability_Success() {
        // Arrange
        String jsonResponse = "{\"isAvailable\": true, \"reason\": \"Time is available.\"}";
        McpSchema.CallToolResult result = new McpSchema.CallToolResult(List.of(new McpSchema.TextContent(jsonResponse)), false);
        
        when(mcpSyncClient.callTool(any(McpSchema.CallToolRequest.class))).thenReturn(result);

        // Act
        CalendarAvailability availability = calendarService.checkAvailability("Friday", "4:00 PM");

        // Assert
        assertTrue(availability.isAvailable());
        assertEquals("Time is available.", availability.reason());
        assertTrue(availability.serverReachable());
        verify(mcpSyncClient, times(1)).callTool(any(McpSchema.CallToolRequest.class));
    }

    @Test
    void testCheckAvailability_Conflict() {
        // Arrange
        String jsonResponse = "{\"isAvailable\": false, \"reason\": \"Conflict: Busy.\"}";
        McpSchema.CallToolResult result = new McpSchema.CallToolResult(List.of(new McpSchema.TextContent(jsonResponse)), false);
        
        when(mcpSyncClient.callTool(any(McpSchema.CallToolRequest.class))).thenReturn(result);

        // Act
        CalendarAvailability availability = calendarService.checkAvailability("Friday", "2:00 PM");

        // Assert
        assertFalse(availability.isAvailable());
        assertEquals("Conflict: Busy.", availability.reason());
        assertTrue(availability.serverReachable());
    }

    @Test
    void testCheckAvailability_Exception_Fallback() {
        // Arrange
        when(mcpSyncClient.callTool(any(McpSchema.CallToolRequest.class))).thenThrow(new RuntimeException("Connection refused"));

        // Act
        CalendarAvailability availability = calendarService.checkAvailability("Friday", "2:00 PM");

        // Assert
        assertFalse(availability.isAvailable());
        assertEquals("Calendar service is temporarily unavailable", availability.reason());
        assertFalse(availability.serverReachable());
    }
}
