package com.meetingmind.ai.orchestrator;

import com.meetingmind.ai.agent.drafter.EmailDraft;
import com.meetingmind.ai.agent.extractor.ExtractedActionItemList;
import com.meetingmind.ai.agent.reviewer.ReviewResult;
import com.meetingmind.ai.agent.summarizer.MeetingSummary;

public record PipelineResult(
    MeetingSummary summary,
    ExtractedActionItemList actionItems,
    EmailDraft emailDraft,
    ReviewResult reviewResult
) {}
