package com.meetingmind.email.dto;

import java.util.List;
import java.util.UUID;

public record EmailDraftDto(
    UUID id,
    String subject,
    String body,
    List<String> recipientSuggestions,
    boolean reviewed
) {}
