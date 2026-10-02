package com.meetingmind.meeting.repository;

import com.meetingmind.meeting.entity.MeetingReviewEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface MeetingReviewRepository extends JpaRepository<MeetingReviewEntity, UUID> {
}
