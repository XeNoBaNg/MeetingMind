package com.meetingmind.meeting.entity;

import jakarta.persistence.*;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "meeting_summaries")
public class MeetingSummaryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne
    @JoinColumn(name = "meeting_id", nullable = false)
    private Meeting meeting;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String overview;

    @ElementCollection
    @CollectionTable(name = "meeting_key_decisions", joinColumns = @JoinColumn(name = "summary_id"))
    @Column(name = "decision")
    private List<String> keyDecisions;

    @ElementCollection
    @CollectionTable(name = "meeting_discussion_topics", joinColumns = @JoinColumn(name = "summary_id"))
    @Column(name = "topic")
    private List<String> discussionTopics;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Meeting getMeeting() {
        return meeting;
    }

    public void setMeeting(Meeting meeting) {
        this.meeting = meeting;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getOverview() {
        return overview;
    }

    public void setOverview(String overview) {
        this.overview = overview;
    }

    public List<String> getKeyDecisions() {
        return keyDecisions;
    }

    public void setKeyDecisions(List<String> keyDecisions) {
        this.keyDecisions = keyDecisions;
    }

    public List<String> getDiscussionTopics() {
        return discussionTopics;
    }

    public void setDiscussionTopics(List<String> discussionTopics) {
        this.discussionTopics = discussionTopics;
    }
}
