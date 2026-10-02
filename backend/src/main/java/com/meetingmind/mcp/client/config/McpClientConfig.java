package com.meetingmind.mcp.client.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import io.modelcontextprotocol.client.McpClient;
import io.modelcontextprotocol.client.McpSyncClient;
import io.modelcontextprotocol.client.transport.ServerParameters;
import io.modelcontextprotocol.client.transport.StdioClientTransport;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class McpClientConfig {

    private static final Logger log = LoggerFactory.getLogger(McpClientConfig.class);

    @Bean
    public McpSyncClient calendarMcpClient(CalendarMcpProperties properties) {
        log.info("Initializing Calendar MCP Client with command: {} {}", properties.getCommand(), properties.getArgs());
        
        ServerParameters params = ServerParameters.builder(properties.getCommand())
                .args(properties.getArgs().toArray(new String[0]))
                .build();
                
        StdioClientTransport transport = new StdioClientTransport(params);
        
        McpSyncClient client = McpClient.sync(transport)
                .requestTimeout(Duration.ofSeconds(10))
                .build();
                
        try {
            client.initialize();
            log.info("Calendar MCP Client initialized successfully.");
        } catch (Exception e) {
            log.error("Failed to initialize Calendar MCP Client. It may be offline.", e);
            // We do not rethrow, to allow the application to start and test the fallback behavior.
        }
        
        return client;
    }
}
