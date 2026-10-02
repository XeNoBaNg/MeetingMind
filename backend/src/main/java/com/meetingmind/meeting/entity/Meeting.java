package com.meetingmind.meeting.entity;

import com.meetingmind.actionitem.entity.ActionItemEntity;
import com.meetingmind.email.entity.EmailDraftEntity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "meetings")
public class Meeting {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String transcript;

    @Enumerated(EnumType.STRING)
    private MeetingStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @OneToOne(mappedBy = "meeting", cascade = CascadeType.ALL, orphanRemoval = true)
    private MeetingSummaryEntity summary;

    @OneToOne(mappedBy = "meeting", cascade = CascadeType.ALL, orphanRemoval = true)
    private MeetingReviewEntity review;

    @OneToOne(mappedBy = "meeting", cascade = CascadeType.ALL, orphanRemoval = true)
    private EmailDraftEntity emailDraft;

    @OneToMany(mappedBy = "meeting", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ActionItemEntity> actionItems = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = MeetingStatus.ANALYZING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getTranscript() { return transcript; }
    public void setTranscript(String transcript) { this.transcript = transcript; }
    
    public MeetingStatus getStatus() { return status; }
    public void setStatus(MeetingStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public MeetingSummaryEntity getSummary() { return summary; }
    public void setSummary(MeetingSummaryEntity summary) { 
        this.summary = summary; 
        if (summary != null) summary.setMeeting(this);
    }

    public MeetingReviewEntity getReview() { return review; }
    public void setReview(MeetingReviewEntity review) { 
        this.review = review; 
        if (review != null) review.setMeeting(this);
    }

    public EmailDraftEntity getEmailDraft() { return emailDraft; }
    public void setEmailDraft(EmailDraftEntity emailDraft) { 
        this.emailDraft = emailDraft;
        if (emailDraft != null) emailDraft.setMeeting(this);
    }

    public List<ActionItemEntity> getActionItems() { return actionItems; }
    public void setActionItems(List<ActionItemEntity> actionItems) { 
        this.actionItems.clear();
        if (actionItems != null) {
            actionItems.forEach(this::addActionItem);
        }
    }
    
    public void addActionItem(ActionItemEntity item) {
        actionItems.add(item);
        item.setMeeting(this);
    }
}
