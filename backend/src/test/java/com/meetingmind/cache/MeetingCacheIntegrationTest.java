package com.meetingmind.cache;

import com.meetingmind.actionitem.entity.ActionItemStatus;
import com.meetingmind.actionitem.service.ActionItemService;
import com.meetingmind.ai.agent.drafter.DrafterAgent;
import com.meetingmind.ai.agent.extractor.ExtractorAgent;
import com.meetingmind.ai.agent.reviewer.ReviewerAgent;
import com.meetingmind.ai.agent.summarizer.MeetingSummary;
import com.meetingmind.ai.agent.summarizer.SummarizerAgent;
import com.meetingmind.config.CacheConfig;
import com.meetingmind.meeting.dto.MeetingDetailDto;
import com.meetingmind.meeting.entity.Meeting;
import com.meetingmind.meeting.entity.MeetingStatus;
import com.meetingmind.meeting.repository.MeetingRepository;
import com.meetingmind.meeting.service.MeetingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
public class MeetingCacheIntegrationTest {

    @Autowired
    private MeetingService meetingService;

    @Autowired
    private MeetingRepository meetingRepository;

    @Autowired
    private ActionItemService actionItemService;

    @Autowired
    private CacheManager cacheManager;

    @MockBean
    private SummarizerAgent summarizerAgent;

    @MockBean
    private ExtractorAgent extractorAgent;

    @MockBean
    private DrafterAgent drafterAgent;

    @MockBean
    private ReviewerAgent reviewerAgent;

    private Meeting testMeeting;
    private UUID meetingId;

    @BeforeEach
    void setUp() {
        Cache cache = cacheManager.getCache(CacheConfig.MEETINGS_CACHE);
        if (cache != null) {
            cache.clear();
        }

        testMeeting = new Meeting();
        testMeeting.setTitle("Architecture Review Cache Test");
        testMeeting.setTranscript("Discussing Redis caching and performance.");
        testMeeting.setStatus(MeetingStatus.ANALYZING);
        testMeeting = meetingRepository.save(testMeeting);
        meetingId = testMeeting.getId();
    }

    @Test
    @DisplayName("Verify cache miss on first call, cache hit on second call")
    void testCacheHitBehavior() {
        Cache cache = cacheManager.getCache(CacheConfig.MEETINGS_CACHE);
        assertNotNull(cache, "Meetings cache must exist");

        // 1. Initial state: cache is empty for this meeting
        assertNull(cache.get(meetingId), "Meeting should not be in cache initially");

        // 2. First call: cache miss, populates Redis cache
        MeetingDetailDto firstCallResult = meetingService.getMeetingDetail(meetingId);
        assertNotNull(firstCallResult);
        assertEquals(meetingId, firstCallResult.id());
        assertEquals("Architecture Review Cache Test", firstCallResult.title());

        // 3. Cache should now contain the meeting
        Cache.ValueWrapper cachedWrapper = cache.get(meetingId);
        assertNotNull(cachedWrapper, "Meeting should be cached after first retrieval");
        Object cachedValue = cachedWrapper.get();
        assertNotNull(cachedValue);
        assertTrue(cachedValue instanceof MeetingDetailDto, "Cached value should be deserialized as MeetingDetailDto");

        // 4. Second call: cache hit
        MeetingDetailDto secondCallResult = meetingService.getMeetingDetail(meetingId);
        assertNotNull(secondCallResult);
        assertEquals(firstCallResult.id(), secondCallResult.id());
        assertEquals(firstCallResult.title(), secondCallResult.title());
    }

    @Test
    @DisplayName("Verify cache eviction when meeting status is updated")
    void testCacheEvictionOnUpdateStatus() {
        Cache cache = cacheManager.getCache(CacheConfig.MEETINGS_CACHE);
        assertNotNull(cache);

        // Populate cache
        meetingService.getMeetingDetail(meetingId);
        assertNotNull(cache.get(meetingId), "Meeting must be cached");

        // Update status -> Should trigger @CacheEvict
        meetingService.updateStatus(meetingId, MeetingStatus.COMPLETED);

        // Verify cache eviction
        assertNull(cache.get(meetingId), "Cache should be evicted after updateStatus");

        // Next call should fetch updated entity from database and re-cache
        MeetingDetailDto refreshed = meetingService.getMeetingDetail(meetingId);
        assertEquals(MeetingStatus.COMPLETED, refreshed.status());
        assertNotNull(cache.get(meetingId), "Cache should be re-populated with updated status");
    }

    @Test
    @DisplayName("Verify cache eviction when meeting summary is saved")
    void testCacheEvictionOnSaveSummary() {
        Cache cache = cacheManager.getCache(CacheConfig.MEETINGS_CACHE);
        assertNotNull(cache);

        // Populate cache
        meetingService.getMeetingDetail(meetingId);
        assertNotNull(cache.get(meetingId), "Meeting must be cached");

        // Save summary -> Should trigger @CacheEvict
        MeetingSummary summary = new MeetingSummary(
                "Executive Summary",
                "High level overview of caching",
                List.of("Use Redis for caching", "Use 1-hour TTL"),
                List.of("Performance", "Eviction")
        );
        meetingService.saveSummary(meetingId, summary);

        // Verify cache eviction
        assertNull(cache.get(meetingId), "Cache should be evicted after saveSummary");

        // Next call should fetch updated entity from database and re-cache
        MeetingDetailDto refreshed = meetingService.getMeetingDetail(meetingId);
        assertNotNull(refreshed.summary());
        assertEquals("Executive Summary", refreshed.summary().title());
        assertNotNull(cache.get(meetingId), "Cache should be re-populated with summary");
    }

    @Test
    @DisplayName("Verify cache eviction when action item status is updated")
    void testCacheEvictionOnActionItemStatusUpdate() {
        Cache cache = cacheManager.getCache(CacheConfig.MEETINGS_CACHE);
        assertNotNull(cache);

        // Save action items to meeting
        com.meetingmind.ai.agent.extractor.ExtractedActionItemList items = new com.meetingmind.ai.agent.extractor.ExtractedActionItemList(
                List.of(new com.meetingmind.ai.agent.extractor.ExtractedActionItem(
                        "Setup Redis cache", "Backend Lead", "Tomorrow", "High priority"
                ))
        );
        meetingService.saveActionItems(meetingId, items);

        // Fetch meeting details to populate cache
        MeetingDetailDto cachedMeeting = meetingService.getMeetingDetail(meetingId);
        assertNotNull(cache.get(meetingId), "Meeting should be cached");
        assertEquals(1, cachedMeeting.actionItems().size());
        UUID actionItemId = cachedMeeting.actionItems().get(0).id();
        assertEquals(ActionItemStatus.OPEN, cachedMeeting.actionItems().get(0).status());

        // Update action item status to DONE -> should evict meeting from cache
        actionItemService.updateStatus(actionItemId, ActionItemStatus.DONE);

        // Verify cache eviction
        assertNull(cache.get(meetingId), "Cache should be evicted when action item status changes");

        // Next call should re-cache with updated DONE status
        MeetingDetailDto refreshed = meetingService.getMeetingDetail(meetingId);
        assertEquals(ActionItemStatus.DONE, refreshed.actionItems().get(0).status());
        assertNotNull(cache.get(meetingId), "Cache should be re-populated with updated action item");
    }
}
