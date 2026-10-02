package com.meetingmind.ai.agent.summarizer;

import java.util.List;

public record MeetingSummary(
    String title,
    String overview,
    List<String> keyDecisions,
    List<String> discussionTopics
) {}
