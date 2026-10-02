package com.meetingmind.ai.agent.drafter;

import java.util.List;

public record EmailDraft(
    String subject,
    String body,
    List<String> recipientSuggestions
) {}
