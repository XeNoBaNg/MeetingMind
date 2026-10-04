package com.meetingmind.meeting.service;

import com.meetingmind.actionitem.dto.ActionItemDto;
import com.meetingmind.actionitem.entity.ActionItemEntity;
import com.meetingmind.actionitem.entity.ActionItemStatus;
import com.meetingmind.ai.agent.drafter.EmailDraft;
import com.meetingmind.ai.agent.extractor.ExtractedActionItem;
import com.meetingmind.ai.agent.extractor.ExtractedActionItemList;
import com.meetingmind.ai.agent.reviewer.ReviewResult;
import com.meetingmind.ai.agent.summarizer.MeetingSummary;
import com.meetingmind.email.dto.EmailDraftDto;
import com.meetingmind.email.entity.EmailDraftEntity;
import com.meetingmind.meeting.dto.MeetingDetailDto;
import com.meetingmind.meeting.dto.MeetingReviewDto;
import com.meetingmind.meeting.dto.MeetingSummaryDto;
import com.meetingmind.meeting.entity.Meeting;
import com.meetingmind.meeting.entity.MeetingReviewEntity;
import com.meetingmind.meeting.entity.MeetingStatus;
import com.meetingmind.meeting.entity.MeetingSummaryEntity;
import com.meetingmind.meeting.repository.MeetingRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.context.ApplicationEventPublisher;
import com.meetingmind.common.exception.ResourceNotFoundException;
import com.meetingmind.meeting.event.MeetingStatusChangedEvent;
import com.meetingmind.user.entity.User;
import java.time.Instant;

@Service
public class MeetingService {

    private final MeetingRepository meetingRepository;
    private final ApplicationEventPublisher eventPublisher;

    public MeetingService(MeetingRepository meetingRepository, ApplicationEventPublisher eventPublisher) {
        this.meetingRepository = meetingRepository;
        this.eventPublisher = eventPublisher;
    }

    // ==========================================
    // User-Facing Operations (Ownership Enforced)
    // ==========================================

    @Transactional
    public Meeting createMeeting(String title, String transcript, User owner) {
        Meeting meeting = new Meeting();
        meeting.setTitle(title);
        meeting.setTranscript(transcript);
        meeting.setOwner(owner);
        meeting.setStatus(MeetingStatus.ANALYZING);
        return meetingRepository.save(meeting);
    }

    @Transactional(readOnly = true)
    public MeetingDetailDto getMeetingDetail(UUID id, User user) {
        verifyMeetingOwnership(id, user);
        return getMeetingDetail(id);
    }

    @Cacheable(value = "meetings", key = "#id")
    @Transactional(readOnly = true)
    public MeetingDetailDto getMeetingDetail(UUID id) {
        Meeting meeting = getMeetingForSystem(id);
        return mapToDetailDto(meeting);
    }

    @Transactional(readOnly = true)
    public List<Meeting> getAllMeetings(User user) {
        return meetingRepository.findAllByOwnerOrderByCreatedAtDesc(user);
    }

    @Transactional(readOnly = true)
    public void verifyMeetingOwnership(UUID id, User user) {
        meetingRepository.findByIdAndOwner(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting not found: " + id));
    }

    // ==========================================
    // Internal System Operations (Trusted Pipeline & MCP)
    // ==========================================

    @Transactional(readOnly = true)
    public Meeting getMeetingForSystem(UUID id) {
        return meetingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting not found: " + id));
    }

    @Transactional(readOnly = true)
    public List<Meeting> getAllMeetingsForSystem() {
        return meetingRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public Meeting getMeeting(UUID id) {
        return getMeetingForSystem(id);
    }

    @Transactional(readOnly = true)
    public List<Meeting> getAllMeetings() {
        return getAllMeetingsForSystem();
    }

    @Transactional
    @CacheEvict(value = "meetings", key = "#meetingId")
    public void updateStatus(UUID meetingId, MeetingStatus status) {
        Meeting meeting = getMeetingForSystem(meetingId);
        meeting.setStatus(status);
        meetingRepository.save(meeting);
        eventPublisher.publishEvent(new MeetingStatusChangedEvent(meetingId, status, Instant.now()));
    }

    @Transactional
    @CacheEvict(value = "meetings", key = "#meetingId")
    public void saveSummary(UUID meetingId, MeetingSummary summary) {
        Meeting meeting = getMeetingForSystem(meetingId);
        
        MeetingSummaryEntity entity = new MeetingSummaryEntity();
        entity.setTitle(summary.title());
        entity.setOverview(summary.overview());
        entity.setKeyDecisions(summary.keyDecisions());
        entity.setDiscussionTopics(summary.discussionTopics());
        
        meeting.setSummary(entity);
        meetingRepository.save(meeting);
    }

    @Transactional
    @CacheEvict(value = "meetings", key = "#meetingId")
    public void saveActionItems(UUID meetingId, ExtractedActionItemList actionItems) {
        Meeting meeting = getMeetingForSystem(meetingId);
        
        if (actionItems != null && actionItems.items() != null) {
            for (ExtractedActionItem item : actionItems.items()) {
                ActionItemEntity entity = new ActionItemEntity();
                entity.setDescription(item.description());
                entity.setAssignee(item.assignee());
                entity.setDueDate(item.dueDate());
                entity.setContext(item.context());
                entity.setStatus(ActionItemStatus.OPEN);
                meeting.addActionItem(entity);
            }
        }
        
        meetingRepository.save(meeting);
    }

    @Transactional
    @CacheEvict(value = "meetings", key = "#meetingId")
    public void saveEmailDraft(UUID meetingId, EmailDraft draft) {
        Meeting meeting = getMeetingForSystem(meetingId);
        
        EmailDraftEntity entity = new EmailDraftEntity();
        entity.setSubject(draft.subject());
        entity.setBody(draft.body());
        entity.setRecipientSuggestions(draft.recipientSuggestions());
        entity.setReviewed(false);
        
        meeting.setEmailDraft(entity);
        meetingRepository.save(meeting);
    }

    @Transactional
    @CacheEvict(value = "meetings", key = "#meetingId")
    public void saveReview(UUID meetingId, ReviewResult review) {
        Meeting meeting = getMeetingForSystem(meetingId);
        
        MeetingReviewEntity entity = new MeetingReviewEntity();
        entity.setVerified(review.verified());
        entity.setHallucinatedItems(review.hallucinatedItems());
        entity.setMissedItems(review.missedItems());
        entity.setDateOrAssigneeDiscrepancies(review.dateOrAssigneeDiscrepancies());
        entity.setCommentary(review.commentary());
        
        meeting.setReview(entity);
        meetingRepository.save(meeting);
    }

    public MeetingDetailDto mapToDetailDto(Meeting meeting) {
        MeetingSummaryDto summaryDto = null;
        if (meeting.getSummary() != null) {
            summaryDto = new MeetingSummaryDto(
                meeting.getSummary().getId(),
                meeting.getSummary().getTitle(),
                meeting.getSummary().getOverview(),
                meeting.getSummary().getKeyDecisions() != null ? new java.util.ArrayList<>(meeting.getSummary().getKeyDecisions()) : java.util.List.of(),
                meeting.getSummary().getDiscussionTopics() != null ? new java.util.ArrayList<>(meeting.getSummary().getDiscussionTopics()) : java.util.List.of()
            );
        }

        MeetingReviewDto reviewDto = null;
        if (meeting.getReview() != null) {
            reviewDto = new MeetingReviewDto(
                meeting.getReview().getId(),
                meeting.getReview().isVerified(),
                meeting.getReview().getHallucinatedItems() != null ? new java.util.ArrayList<>(meeting.getReview().getHallucinatedItems()) : java.util.List.of(),
                meeting.getReview().getMissedItems() != null ? new java.util.ArrayList<>(meeting.getReview().getMissedItems()) : java.util.List.of(),
                meeting.getReview().getDateOrAssigneeDiscrepancies() != null ? new java.util.ArrayList<>(meeting.getReview().getDateOrAssigneeDiscrepancies()) : java.util.List.of(),
                meeting.getReview().getCommentary()
            );
        }

        EmailDraftDto emailDraftDto = null;
        if (meeting.getEmailDraft() != null) {
            emailDraftDto = new EmailDraftDto(
                meeting.getEmailDraft().getId(),
                meeting.getEmailDraft().getSubject(),
                meeting.getEmailDraft().getBody(),
                meeting.getEmailDraft().getRecipientSuggestions() != null ? new java.util.ArrayList<>(meeting.getEmailDraft().getRecipientSuggestions()) : java.util.List.of(),
                meeting.getEmailDraft().isReviewed()
            );
        }

        List<ActionItemDto> actionItems = null;
        if (meeting.getActionItems() != null) {
            actionItems = meeting.getActionItems().stream().map(ai -> new ActionItemDto(
                ai.getId(),
                ai.getDescription(),
                ai.getAssignee(),
                ai.getDueDate(),
                ai.getContext(),
                ai.getStatus()
            )).collect(Collectors.toList());
        }

        return new MeetingDetailDto(
            meeting.getId(),
            meeting.getTitle(),
            meeting.getTranscript(),
            meeting.getStatus(),
            meeting.getCreatedAt(),
            meeting.getUpdatedAt(),
            summaryDto,
            reviewDto,
            emailDraftDto,
            actionItems
        );
    }
}
