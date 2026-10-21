package com.meetingmind.mcp;

import com.meetingmind.mcp.tools.MeetingTools;
import com.meetingmind.meeting.entity.Meeting;
import com.meetingmind.meeting.entity.MeetingStatus;
import com.meetingmind.meeting.repository.MeetingRepository;
import com.meetingmind.user.entity.User;
import com.meetingmind.user.repository.UserRepository;
import com.meetingmind.user.service.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.ActiveProfiles;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class McpDeleteMeetingTest {

    @Autowired
    private MeetingTools meetingTools;

    @Autowired
    private MeetingRepository meetingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private UserDetailsService userDetailsService;

    private User userA;
    private User userB;

    @BeforeEach
    void setUp() {
        meetingRepository.deleteAll();
        userRepository.deleteAll();

        userA = userService.createUser("mcp_user_a", "mcpa@test.com", "password123");
        userB = userService.createUser("mcp_user_b", "mcpb@test.com", "password123");
    }

    @AfterEach
    void tearDown() {
        meetingRepository.deleteAll();
        userRepository.deleteAll();
        SecurityContextHolder.clearContext();
    }

    private Meeting createMeeting(String title, User owner) {
        Meeting meeting = new Meeting();
        meeting.setTitle(title);
        meeting.setTranscript("Transcript for " + title);
        meeting.setOwner(owner);
        meeting.setStatus(MeetingStatus.COMPLETED);
        return meetingRepository.save(meeting);
    }

    private void authenticateAs(User user) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        UsernamePasswordAuthenticationToken token = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(token);
    }

    @Test
    @DisplayName("MCP delete_meeting requires explicit confirmation")
    void deleteMeetingRequiresExplicitConfirmation() {
        authenticateAs(userA);
        Meeting meeting = createMeeting("Meeting To Confirm", userA);
        UUID meetingId = meeting.getId();

        // 1. Calling with confirm = null
        MeetingTools.DeleteMeetingResult resultNull = meetingTools.delete_meeting(meetingId.toString(), null);
        assertFalse(resultNull.success(), "Must reject deletion when confirm is null");
        assertTrue(resultNull.message().contains("Confirmation required"), "Message must specify confirmation required");
        assertTrue(meetingRepository.findById(meetingId).isPresent(), "Meeting must not be deleted");

        // 2. Calling with confirm = false
        MeetingTools.DeleteMeetingResult resultFalse = meetingTools.delete_meeting(meetingId.toString(), false);
        assertFalse(resultFalse.success(), "Must reject deletion when confirm is false");
        assertTrue(resultFalse.message().contains("Confirmation required"), "Message must specify confirmation required");
        assertTrue(meetingRepository.findById(meetingId).isPresent(), "Meeting must not be deleted");
    }

    @Test
    @DisplayName("MCP delete_meeting succeeds for authenticated owner when confirm is true")
    void deleteMeetingSucceedsForAuthenticatedOwner() {
        authenticateAs(userA);
        Meeting meeting = createMeeting("Meeting Owner Delete", userA);
        UUID meetingId = meeting.getId();

        MeetingTools.DeleteMeetingResult result = meetingTools.delete_meeting(meetingId.toString(), true);
        assertTrue(result.success(), "Deletion must succeed when owner confirms");
        assertTrue(result.message().contains("successfully and permanently deleted"));
        assertFalse(meetingRepository.findById(meetingId).isPresent(), "Meeting must be permanently deleted from repository");
    }

    @Test
    @DisplayName("MCP delete_meeting prevents deleting another user's meeting")
    void deleteMeetingRejectsOtherUsersMeeting() {
        // Meeting owned by userA
        Meeting meeting = createMeeting("User A Private Meeting", userA);
        UUID meetingId = meeting.getId();

        // Authenticate as userB
        authenticateAs(userB);

        MeetingTools.DeleteMeetingResult result = meetingTools.delete_meeting(meetingId.toString(), true);
        assertFalse(result.success(), "User B must not be able to delete User A's meeting");
        assertTrue(result.message().contains("not found or access denied"));
        assertTrue(meetingRepository.findById(meetingId).isPresent(), "Meeting must remain intact");
    }

    @Test
    @DisplayName("MCP delete_meeting rejects unauthenticated requests")
    void deleteMeetingRejectsUnauthenticated() {
        SecurityContextHolder.clearContext();
        Meeting meeting = createMeeting("Unauthenticated Test Meeting", userA);
        UUID meetingId = meeting.getId();

        MeetingTools.DeleteMeetingResult result = meetingTools.delete_meeting(meetingId.toString(), true);
        assertFalse(result.success(), "Unauthenticated deletion must fail");
        assertTrue(result.message().contains("Authentication required"));
        assertTrue(meetingRepository.findById(meetingId).isPresent(), "Meeting must remain intact");
    }
}
