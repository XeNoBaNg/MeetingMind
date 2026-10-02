package com.meetingmind.meeting.entity;

import jakarta.persistence.*;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "meeting_reviews")
public class MeetingReviewEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne
    @JoinColumn(name = "meeting_id", nullable = false)
    private Meeting meeting;

    private boolean verified;

    @ElementCollection
    @CollectionTable(name = "meeting_review_hallucinated_items", joinColumns = @JoinColumn(name = "review_id"))
    @Column(name = "item")
    private List<String> hallucinatedItems;

    @ElementCollection
    @CollectionTable(name = "meeting_review_missed_items", joinColumns = @JoinColumn(name = "review_id"))
    @Column(name = "item")
    private List<String> missedItems;

    @ElementCollection
    @CollectionTable(name = "meeting_review_discrepancies", joinColumns = @JoinColumn(name = "review_id"))
    @Column(name = "discrepancy")
    private List<String> dateOrAssigneeDiscrepancies;

    @Column(columnDefinition = "TEXT")
    private String commentary;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    
    public Meeting getMeeting() { return meeting; }
    public void setMeeting(Meeting meeting) { this.meeting = meeting; }
    
    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }
    
    public List<String> getHallucinatedItems() { return hallucinatedItems; }
    public void setHallucinatedItems(List<String> hallucinatedItems) { this.hallucinatedItems = hallucinatedItems; }
    
    public List<String> getMissedItems() { return missedItems; }
    public void setMissedItems(List<String> missedItems) { this.missedItems = missedItems; }
    
    public List<String> getDateOrAssigneeDiscrepancies() { return dateOrAssigneeDiscrepancies; }
    public void setDateOrAssigneeDiscrepancies(List<String> dateOrAssigneeDiscrepancies) { this.dateOrAssigneeDiscrepancies = dateOrAssigneeDiscrepancies; }
    
    public String getCommentary() { return commentary; }
    public void setCommentary(String commentary) { this.commentary = commentary; }
}
