package com.meetingmind.meeting;

import com.meetingmind.actionitem.entity.ActionItemEntity;
import com.meetingmind.actionitem.entity.ActionItemStatus;
import com.meetingmind.actionitem.repository.ActionItemRepository;
import com.meetingmind.ai.agent.drafter.DrafterAgent;
import com.meetingmind.ai.agent.extractor.ExtractorAgent;
import com.meetingmind.ai.agent.reviewer.ReviewerAgent;
import com.meetingmind.ai.agent.summarizer.MeetingSummary;
import com.meetingmind.ai.agent.summarizer.SummarizerAgent;
import com.meetingmind.ai.orchestrator.MeetingOrchestrator;
import com.meetingmind.auth.service.JwtService;
import com.meetingmind.config.CacheConfig;
import com.meetingmind.email.entity.EmailDraftEntity;
import com.meetingmind.email.repository.EmailDraftRepository;
import com.meetingmind.meeting.dto.MeetingDetailDto;
import com.meetingmind.meeting.entity.Meeting;
import com.meetingmind.meeting.entity.MeetingReviewEntity;
import com.meetingmind.meeting.entity.MeetingStatus;
import com.meetingmind.meeting.entity.MeetingSummaryEntity;
import com.meetingmind.meeting.repository.MeetingRepository;
import com.meetingmind.meeting.repository.MeetingReviewRepository;
import com.meetingmind.meeting.repository.MeetingSummaryRepository;
import com.meetingmind.meeting.service.MeetingService;
import com.meetingmind.rag.service.RagService;
import com.meetingmind.user.entity.User;
import com.meetingmind.user.repository.UserRepository;
import com.meetingmind.user.service.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class MeetingDeleteIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private MeetingService meetingService;

    @Autowired
    private MeetingRepository meetingRepository;

    @Autowired
    private MeetingSummaryRepository meetingSummaryRepository;

    @Autowired
    private MeetingReviewRepository meetingReviewRepository;

    @Autowired
    private EmailDraftRepository emailDraftRepository;

    @Autowired
    private ActionItemRepository actionItemRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private CacheManager cacheManager;

    @Autowired
    private MeetingOrchestrator meetingOrchestrator;

    @SpyBean
    private RagService ragService;

    @MockBean
    private SummarizerAgent summarizerAgent;

    @MockBean
    private ExtractorAgent extractorAgent;

    @MockBean
    private DrafterAgent drafterAgent;

    @MockBean
    private ReviewerAgent reviewerAgent;

    private User ownerUser;
    private User otherUser;
    private String ownerToken;
    private String otherToken;

    @BeforeEach
    void setUp() {
        actionItemRepository.deleteAll();
        meetingRepository.deleteAll();
        userRepository.deleteAll();

        Cache cache = cacheManager.getCache(CacheConfig.MEETINGS_CACHE);
        if (cache != null) {
            cache.clear();
        }

        ownerUser = userService.createUser("delete_owner", "owner@delete.com", "password123");
        otherUser = userService.createUser("delete_other", "other@delete.com", "password123");

        ownerToken = jwtService.generateToken(ownerUser.getUsername());
        otherToken = jwtService.generateToken(otherUser.getUsername());
    }

    @AfterEach
    void tearDown() {
        actionItemRepository.deleteAll();
        meetingRepository.deleteAll();
        userRepository.deleteAll();

        Cache cache = cacheManager.getCache(CacheConfig.MEETINGS_CACHE);
        if (cache != null) {
            cache.clear();
        }
    }

    private Meeting createCompleteMeeting(User owner) {
        Meeting meeting = new Meeting();
        meeting.setTitle("Complete Meeting for Deletion Test");
        meeting.setTranscript("Alex: We must finalize the API migration by next Friday.");
        meeting.setOwner(owner);
        meeting.setStatus(MeetingStatus.COMPLETED);

        // Summary
        MeetingSummaryEntity summary = new MeetingSummaryEntity();
        summary.setTitle("Executive Summary");
        summary.setOverview("Discussed API migration.");
        summary.setKeyDecisions(List.of("Migrate to v2 API"));
        summary.setDiscussionTopics(List.of("Migration", "Testing"));
        meeting.setSummary(summary);

        // Review
        MeetingReviewEntity review = new MeetingReviewEntity();
        review.setVerified(true);
        review.setHallucinatedItems(List.of());
        review.setMissedItems(List.of());
        review.setDateOrAssigneeDiscrepancies(List.of());
        review.setCommentary("All items verified.");
        meeting.setReview(review);

        // Email Draft
        EmailDraftEntity draft = new EmailDraftEntity();
        draft.setSubject("Follow-up: API Migration");
        draft.setBody("Hi team, please find the migration details.");
        draft.setRecipientSuggestions(List.of("team@meetingmind.com"));
        draft.setReviewed(true);
        meeting.setEmailDraft(draft);

        // Action Items
        ActionItemEntity actionItem = new ActionItemEntity();
        actionItem.setDescription("Finalize API migration");
        actionItem.setAssignee("Alex");
        actionItem.setDueDate("Next Friday");
        actionItem.setStatus(ActionItemStatus.OPEN);
        meeting.addActionItem(actionItem);

        return meetingRepository.save(meeting);
    }

    @Test
    @DisplayName("Owner can delete their own meeting with 204 No Content and cascades all records")
    void ownerCanDeleteTheirOwnMeetingAndCascades() throws Exception {
        Meeting meeting = createCompleteMeeting(ownerUser);
        UUID meetingId = meeting.getId();
        UUID summaryId = meeting.getSummary().getId();
        UUID reviewId = meeting.getReview().getId();
        UUID draftId = meeting.getEmailDraft().getId();
        UUID actionItemId = meeting.getActionItems().get(0).getId();

        mockMvc.perform(delete("/api/meetings/{id}", meetingId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isNoContent());

        // Verify meeting itself is removed
        assertFalse(meetingRepository.findById(meetingId).isPresent(), "Meeting must be removed from DB");

        // Verify all associated child records are removed
        assertFalse(meetingSummaryRepository.findById(summaryId).isPresent(), "MeetingSummary must be removed");
        assertFalse(meetingReviewRepository.findById(reviewId).isPresent(), "MeetingReview must be removed");
        assertFalse(emailDraftRepository.findById(draftId).isPresent(), "EmailDraft must be removed");
        assertFalse(actionItemRepository.findById(actionItemId).isPresent(), "ActionItem must be removed");

        // Verify RAG index cleanup was invoked for this meeting
        verify(ragService, atLeastOnce()).deleteMeetingIndex(meetingId);
    }

    @Test
    @DisplayName("Unauthenticated deletion is rejected with 401 Unauthorized")
    void unauthenticatedDeletionIsRejected() throws Exception {
        Meeting meeting = createCompleteMeeting(ownerUser);
        UUID meetingId = meeting.getId();

        mockMvc.perform(delete("/api/meetings/{id}", meetingId))
                .andExpect(status().isUnauthorized());

        assertTrue(meetingRepository.findById(meetingId).isPresent(), "Meeting must not be deleted");
    }

    @Test
    @DisplayName("User A cannot delete User B's meeting; returns 404 Not Found")
    void userCannotDeleteAnotherUsersMeeting() throws Exception {
        Meeting meeting = createCompleteMeeting(ownerUser);
        UUID meetingId = meeting.getId();

        mockMvc.perform(delete("/api/meetings/{id}", meetingId)
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());

        assertTrue(meetingRepository.findById(meetingId).isPresent(), "Meeting must not be deleted by non-owner");
    }

    @Test
    @DisplayName("Deleting nonexistent meeting returns 404 Not Found")
    void deleteNonexistentMeetingReturns404() throws Exception {
        UUID nonexistentId = UUID.randomUUID();

        mockMvc.perform(delete("/api/meetings/{id}", nonexistentId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Redis cache entry for meeting is invalidated on deletion")
    void redisCacheInvalidatedOnDeletion() throws Exception {
        Meeting meeting = createCompleteMeeting(ownerUser);
        UUID meetingId = meeting.getId();

        Cache cache = cacheManager.getCache(CacheConfig.MEETINGS_CACHE);
        assertNotNull(cache);

        // Populate cache
        MeetingDetailDto detail = meetingService.getMeetingDetail(meetingId);
        assertNotNull(detail);
        assertNotNull(cache.get(meetingId), "Meeting must be cached initially");

        // Delete meeting
        meetingService.deleteMeeting(meetingId, ownerUser);

        // Verify cache entry is evicted
        assertNull(cache.get(meetingId), "Meeting cache must be evicted upon deletion");
    }

    @Test
    @DisplayName("Pending Kafka / Async event handles deleted meeting safely without recreating records")
    void pendingAsyncHandlesDeletedMeetingSafely() {
        UUID nonexistentId = UUID.randomUUID();

        // Simulate async orchestrator processing a meeting that was deleted before message was consumed
        assertDoesNotThrow(() -> {
            meetingOrchestrator.processMeeting(nonexistentId).join();
        });

        // Ensure meeting was not created or resurrected
        assertFalse(meetingRepository.findById(nonexistentId).isPresent());
    }

    @Test
    @DisplayName("In-progress analysis aborts safely when meeting is deleted midway")
    void inProgressAnalysisAbortsSafelyWhenMeetingDeleted() {
        Meeting meeting = createCompleteMeeting(ownerUser);
        UUID meetingId = meeting.getId();

        // Setup summarizer mock to delete the meeting midway during analysis
        when(summarizerAgent.summarize(anyString())).thenAnswer(invocation -> {
            // Meeting gets deleted from DB while summarizer is executing!
            meetingService.deleteMeetingForSystem(meetingId);
            return new MeetingSummary("Test", "Overview", List.of(), List.of());
        });

        // Run orchestrator
        assertDoesNotThrow(() -> {
            meetingOrchestrator.processMeeting(meetingId).join();
        });

        // Verify meeting remains deleted and was not resurrected
        assertFalse(meetingRepository.findById(meetingId).isPresent());
    }
}
