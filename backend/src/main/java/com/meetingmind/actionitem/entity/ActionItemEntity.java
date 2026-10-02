package com.meetingmind.actionitem.entity;

import com.meetingmind.meeting.entity.Meeting;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "action_items")
public class ActionItemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meeting_id", nullable = false)
    private Meeting meeting;

    private String description;
    private String assignee;
    
    // Keeping dueDate as String as requested
    private String dueDate;
    
    @Column(columnDefinition = "TEXT")
    private String context;

    @Enumerated(EnumType.STRING)
    private ActionItemStatus status;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    
    public Meeting getMeeting() { return meeting; }
    public void setMeeting(Meeting meeting) { this.meeting = meeting; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getAssignee() { return assignee; }
    public void setAssignee(String assignee) { this.assignee = assignee; }
    
    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }
    
    public String getContext() { return context; }
    public void setContext(String context) { this.context = context; }
    
    public ActionItemStatus getStatus() { return status; }
    public void setStatus(ActionItemStatus status) { this.status = status; }
}
