package com.meetingmind.mcp.client.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
@ConfigurationProperties(prefix = "meetingmind.mcp.client.calendar")
public class CalendarMcpProperties {

    private String command = "node";
    private List<String> args = List.of("../scripts/calendar-mcp-server.js");

    public String getCommand() {
        return command;
    }

    public void setCommand(String command) {
        this.command = command;
    }

    public List<String> getArgs() {
        return args;
    }

    public void setArgs(List<String> args) {
        this.args = args;
    }
}
