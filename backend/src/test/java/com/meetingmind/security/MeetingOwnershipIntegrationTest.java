package com.meetingmind.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.meetingmind.actionitem.entity.ActionItemEntity;
import com.meetingmind.actionitem.entity.ActionItemStatus;
import com.meetingmind.actionitem.repository.ActionItemRepository;
import com.meetingmind.auth.service.JwtService;
import com.meetingmind.meeting.entity.Meeting;
import com.meetingmind.meeting.entity.MeetingStatus;
import com.meetingmind.meeting.repository.MeetingRepository;
import com.meetingmind.rag.model.MeetingCitation;
import com.meetingmind.rag.model.RagQueryRequest;
import com.meetingmind.rag.service.RagService;
import com.meetingmind.user.entity.User;
import com.meetingmind.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class MeetingOwnershipIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MeetingRepository meetingRepository;

    @Autowired
    private ActionItemRepository actionItemRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private RagService ragService;

    private User userA;
    private User userB;
    private String tokenA;
    private String tokenB;

    @BeforeEach
    void setUp() {
        actionItemRepository.deleteAll();
        meetingRepository.deleteAll();
        userRepository.deleteAll();

        // Create User A
        userA = new User();
        userA.setUsername("alice");
        userA.setPasswordHash(passwordEncoder.encode("passwordA"));
        userA = userRepository.save(userA);
        tokenA = jwtService.generateToken(userA.getUsername());

        // Create User B
        userB = new User();
        userB.setUsername("bob");
        userB.setPasswordHash(passwordEncoder.encode("passwordB"));
        userB = userRepository.save(userB);
        tokenB = jwtService.generateToken(userB.getUsername());
    }

    @AfterEach
    void tearDown() {
        actionItemRepository.deleteAll();
        meetingRepository.deleteAll();
        userRepository.deleteAll();
    }

    // ==========================================
    // 1. Authentication Gate Tests
    // ==========================================

    @Test
    @DisplayName("Unauthenticated requests to protected endpoints return 401 Unauthorized")
    void unauthenticatedRequestsReturn401() throws Exception {
        mockMvc.perform(get("/api/meetings"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/meetings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Test\",\"transcript\":\"Hello\"}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/action-items"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/rag/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"query\":\"roadmap\"}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/meetings/" + UUID.randomUUID() + "/events"))
                .andExpect(status().isUnauthorized());
    }

    // ==========================================
    // 2. Meeting Creation & Ownership Association
    // ==========================================

    @Test
    @DisplayName("Meeting creation associates meeting with authenticated user, ignoring client-supplied ownerId")
    void createMeeting_SetsAuthenticatedUserAsOwner() throws Exception {
        String clientPayload = """
            {
                "title": "Alice's Secret Project",
                "transcript": "Alice discussing sensitive Q4 plans.",
                "ownerId": "00000000-0000-0000-0000-000000000000"
            }
            """;

        String responseJson = mockMvc.perform(post("/api/meetings")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(clientPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").exists())
                .andExpect(jsonPath("$.data.title").value("Alice's Secret Project"))
                .andReturn().getResponse().getContentAsString();

        Map<?, ?> map = objectMapper.readValue(responseJson, Map.class);
        Map<?, ?> data = (Map<?, ?>) map.get("data");
        UUID createdId = UUID.fromString((String) data.get("id"));

        Meeting savedMeeting = meetingRepository.findById(createdId).orElseThrow();
        assertNotNull(savedMeeting.getOwner(), "Created meeting must have an owner");
        assertEquals(userA.getId(), savedMeeting.getOwner().getId(), "Owner must be Alice");
    }

    // ==========================================
    // 3. Meeting List Isolation Tests
    // ==========================================

    @Test
    @DisplayName("Meeting list endpoint returns ONLY the meetings owned by the authenticated caller")
    void listMeetings_EnforcesUserIsolation() throws Exception {
        // Create 2 meetings for Alice
        createMeetingEntity("Alice Meeting 1", "Transcript 1", userA);
        createMeetingEntity("Alice Meeting 2", "Transcript 2", userA);

        // Create 1 meeting for Bob
        createMeetingEntity("Bob Meeting 1", "Transcript B", userB);

        // Alice GET /api/meetings
        mockMvc.perform(get("/api/meetings")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[*].title", containsInAnyOrder("Alice Meeting 1", "Alice Meeting 2")))
                .andExpect(jsonPath("$.data[*].title", not(hasItem("Bob Meeting 1"))));

        // Bob GET /api/meetings
        mockMvc.perform(get("/api/meetings")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].title").value("Bob Meeting 1"))
                .andExpect(jsonPath("$.data[*].title", not(hasItem("Alice Meeting 1"))))
                .andExpect(jsonPath("$.data[*].title", not(hasItem("Alice Meeting 2"))));
    }

    // ==========================================
    // 4. Meeting Read Authorization & IDOR Protection
    // ==========================================

    @Test
    @DisplayName("Retrieving another user's meeting by UUID returns 404 Not Found (preventing resource enumeration)")
    void getMeetingById_PreventsIdorAndEnumeration() throws Exception {
        Meeting meetingA = createMeetingEntity("Alice Private Doc", "Transcript A", userA);
        Meeting meetingB = createMeetingEntity("Bob Financial Review", "Transcript B", userB);

        // Alice accessing her own meeting -> 200 OK
        mockMvc.perform(get("/api/meetings/" + meetingA.getId())
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(meetingA.getId().toString()))
                .andExpect(jsonPath("$.data.title").value("Alice Private Doc"));

        // Alice attempting to access Bob's meeting -> 404 NOT FOUND
        mockMvc.perform(get("/api/meetings/" + meetingB.getId())
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));

        // Bob attempting to access Alice's meeting -> 404 NOT FOUND
        mockMvc.perform(get("/api/meetings/" + meetingA.getId())
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));

        // Non-existent random UUID -> 404 NOT FOUND
        mockMvc.perform(get("/api/meetings/" + UUID.randomUUID())
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ==========================================
    // 5. Action Items Ownership & IDOR Protection
    // ==========================================

    @Test
    @DisplayName("Action items list returns only items from user's meetings; PATCH another's action item returns 404")
    void actionItems_EnforcesOwnershipAndPreventsIdor() throws Exception {
        Meeting meetingA = createMeetingEntity("Alice Sprint", "Transcript A", userA);
        Meeting meetingB = createMeetingEntity("Bob Sprint", "Transcript B", userB);

        ActionItemEntity itemA = createActionItem(meetingA, "Alice Task", "alice", ActionItemStatus.OPEN);
        ActionItemEntity itemB = createActionItem(meetingB, "Bob Task", "bob", ActionItemStatus.OPEN);

        // 1. List isolation
        mockMvc.perform(get("/api/action-items")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].id").value(itemA.getId().toString()))
                .andExpect(jsonPath("$.data[0].description").value("Alice Task"));

        mockMvc.perform(get("/api/action-items")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].id").value(itemB.getId().toString()))
                .andExpect(jsonPath("$.data[0].description").value("Bob Task"));

        // 2. IDOR Protection: Alice attempts to update Bob's action item
        mockMvc.perform(patch("/api/action-items/" + itemB.getId() + "/status")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DONE\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));

        // Verify Bob's action item in DB was NOT modified
        ActionItemEntity unchanged = actionItemRepository.findById(itemB.getId()).orElseThrow();
        assertEquals(ActionItemStatus.OPEN, unchanged.getStatus(), "Bob's action item must remain OPEN");

        // 3. Alice updates her own action item -> 200 OK
        mockMvc.perform(patch("/api/action-items/" + itemA.getId() + "/status")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DONE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("DONE"));

        ActionItemEntity updated = actionItemRepository.findById(itemA.getId()).orElseThrow();
        assertEquals(ActionItemStatus.DONE, updated.getStatus());
    }

    // ==========================================
    // 6. RAG Ownership & IDOR Protection
    // ==========================================

    @Test
    @DisplayName("RAG search and query strictly pass ownerId to retrieval service boundary; indexing another user's meeting returns 404")
    void rag_EnforcesOwnershipBoundaryAndIdorProtection() throws Exception {
        Meeting meetingA = createMeetingEntity("Alice RAG Doc", "Architecture details", userA);
        Meeting meetingB = createMeetingEntity("Bob RAG Doc", "Secret salary numbers", userB);

        // 1. IDOR test: Alice attempts to trigger indexing of Bob's meeting
        mockMvc.perform(post("/api/rag/index/" + meetingB.getId())
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));

        // 2. Mock RAG search behavior scoped by ownerId
        MeetingCitation citationA = new MeetingCitation(
                meetingA.getId(),
                "Alice RAG Doc",
                LocalDate.now(),
                List.of("Alice"),
                "Architecture details excerpt",
                0.95
        );
        when(ragService.searchHistoricalMeetings(any(RagQueryRequest.class), eq(userA.getId())))
                .thenReturn(List.of(citationA));
        when(ragService.searchHistoricalMeetings(any(RagQueryRequest.class), eq(userB.getId())))
                .thenReturn(List.of());

        // Alice searches -> receives only her citations
        mockMvc.perform(post("/api/rag/search")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"query\":\"Architecture\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].meetingTitle").value("Alice RAG Doc"));

        // Bob searches -> receives empty list
        mockMvc.perform(post("/api/rag/search")
                        .header("Authorization", "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"query\":\"Architecture\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    // ==========================================
    // 7. SSE Pre-Connection Ownership Verification
    // ==========================================

    @Test
    @DisplayName("Connecting to SSE stream for another user's meeting is rejected with 404 before stream opens")
    void sse_RejectsUnauthorizedMeetingBeforeEstablishingStream() throws Exception {
        Meeting meetingB = createMeetingEntity("Bob SSE Stream Meeting", "Transcript", userB);

        // Alice attempts to connect to Bob's meeting SSE stream
        mockMvc.perform(get("/api/meetings/" + meetingB.getId() + "/events")
                        .header("Authorization", "Bearer " + tokenA)
                        .accept(MediaType.TEXT_EVENT_STREAM))
                .andExpect(status().isNotFound());

        // Alice connects to her own meeting SSE stream
        Meeting meetingA = createMeetingEntity("Alice SSE Stream Meeting", "Transcript", userA);
        mockMvc.perform(get("/api/meetings/" + meetingA.getId() + "/events")
                        .header("Authorization", "Bearer " + tokenA)
                        .accept(MediaType.TEXT_EVENT_STREAM))
                .andExpect(status().isOk())
                .andExpect(request().asyncStarted());
    }

    // ==========================================
    // Helper Methods
    // ==========================================

    private Meeting createMeetingEntity(String title, String transcript, User owner) {
        Meeting meeting = new Meeting();
        meeting.setTitle(title);
        meeting.setTranscript(transcript);
        meeting.setStatus(MeetingStatus.COMPLETED);
        meeting.setOwner(owner);
        return meetingRepository.save(meeting);
    }

    private ActionItemEntity createActionItem(Meeting meeting, String desc, String assignee, ActionItemStatus status) {
        ActionItemEntity entity = new ActionItemEntity();
        entity.setDescription(desc);
        entity.setAssignee(assignee);
        entity.setStatus(status);
        meeting.addActionItem(entity);
        actionItemRepository.save(entity);
        return entity;
    }
}
