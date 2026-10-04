package com.meetingmind.meeting.repository;

import com.meetingmind.meeting.entity.Meeting;
import com.meetingmind.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MeetingRepository extends JpaRepository<Meeting, UUID> {
    List<Meeting> findAllByOrderByCreatedAtDesc();
    List<Meeting> findAllByOwnerOrderByCreatedAtDesc(User owner);
    Optional<Meeting> findByIdAndOwner(UUID id, User owner);
}
