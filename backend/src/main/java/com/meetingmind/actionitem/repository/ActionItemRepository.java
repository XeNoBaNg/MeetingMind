package com.meetingmind.actionitem.repository;

import com.meetingmind.actionitem.entity.ActionItemEntity;
import com.meetingmind.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ActionItemRepository extends JpaRepository<ActionItemEntity, UUID> {
    List<ActionItemEntity> findByMeetingId(UUID meetingId);
    List<ActionItemEntity> findByAssignee(String assignee);
    List<ActionItemEntity> findAllByMeeting_Owner(User owner);
    Optional<ActionItemEntity> findByIdAndMeeting_Owner(UUID id, User owner);
}
