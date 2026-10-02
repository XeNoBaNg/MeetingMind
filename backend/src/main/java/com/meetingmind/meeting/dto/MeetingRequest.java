package com.meetingmind.meeting.dto;

public class MeetingRequest {
    private String title;
    private String transcript;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getTranscript() { return transcript; }
    public void setTranscript(String transcript) { this.transcript = transcript; }
}
