package com.meetingmind.actionitem.repository;

import com.meetingmind.actionitem.entity.ActionItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ActionItemRepository extends JpaRepository<ActionItemEntity, UUID> {
    List<ActionItemEntity> findByMeetingId(UUID meetingId);
    List<ActionItemEntity> findByAssignee(String assignee);
}
