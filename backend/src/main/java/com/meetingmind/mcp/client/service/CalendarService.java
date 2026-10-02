package com.meetingmind.mcp.client.service;

import com.meetingmind.mcp.client.domain.CalendarAvailability;

public interface CalendarService {
    
    /**
     * Checks calendar availability for a given date and time.
     * 
     * @param date the date to check
     * @param time the time to check
     * @return CalendarAvailability containing the result and status
     */
    CalendarAvailability checkAvailability(String date, String time);
}
