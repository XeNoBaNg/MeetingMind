package com.meetingmind.actionitem.service;

import com.meetingmind.actionitem.dto.ActionItemResponseDto;
import com.meetingmind.actionitem.dto.WorkloadResponseDto;
import com.meetingmind.actionitem.entity.ActionItemEntity;
import com.meetingmind.actionitem.entity.ActionItemStatus;
import com.meetingmind.actionitem.repository.ActionItemRepository;
import com.meetingmind.common.exception.ResourceNotFoundException;
import com.meetingmind.user.entity.User;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ActionItemService {

    private final ActionItemRepository actionItemRepository;

    public ActionItemService(ActionItemRepository actionItemRepository) {
        this.actionItemRepository = actionItemRepository;
    }

    // ==========================================
    // User-Facing Operations (Ownership Enforced)
    // ==========================================

    @Transactional(readOnly = true)
    public List<ActionItemResponseDto> getAllActionItems(User user) {
        return actionItemRepository.findAllByMeeting_Owner(user).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = "meetings", key = "#result.meetingId()")
    public ActionItemResponseDto updateStatus(UUID id, ActionItemStatus status, User user) {
        ActionItemEntity entity = actionItemRepository.findByIdAndMeeting_Owner(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Action item not found: " + id));
        
        entity.setStatus(status);
        ActionItemEntity updated = actionItemRepository.save(entity);
        return mapToDto(updated);
    }

    // ==========================================
    // Internal System Operations (Trusted Pipeline & MCP)
    // ==========================================

    @Transactional(readOnly = true)
    public List<ActionItemResponseDto> getAllActionItemsForSystem() {
        return actionItemRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ActionItemResponseDto> getAllActionItems() {
        return getAllActionItemsForSystem();
    }

    @Transactional
    @CacheEvict(value = "meetings", key = "#result.meetingId()")
    public ActionItemResponseDto updateStatusForSystem(UUID id, ActionItemStatus status) {
        ActionItemEntity entity = actionItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Action item not found: " + id));
        
        entity.setStatus(status);
        ActionItemEntity updated = actionItemRepository.save(entity);
        return mapToDto(updated);
    }

    @Transactional
    @CacheEvict(value = "meetings", key = "#result.meetingId()")
    public ActionItemResponseDto updateStatus(UUID id, ActionItemStatus status) {
        return updateStatusForSystem(id, status);
    }

    @Transactional(readOnly = true)
    public WorkloadResponseDto getWorkloadForAssigneeForSystem(String assignee) {
        List<ActionItemEntity> items = actionItemRepository.findByAssignee(assignee);
        long openCount = items.stream().filter(item -> item.getStatus() == ActionItemStatus.OPEN).count();
        long doneCount = items.stream().filter(item -> item.getStatus() == ActionItemStatus.DONE).count();
        List<ActionItemResponseDto> openItems = items.stream()
                .filter(item -> item.getStatus() == ActionItemStatus.OPEN)
                .map(this::mapToDto)
                .collect(Collectors.toList());
        
        return new WorkloadResponseDto(assignee, openCount, doneCount, openItems);
    }

    @Transactional(readOnly = true)
    public WorkloadResponseDto getWorkloadForAssignee(String assignee) {
        return getWorkloadForAssigneeForSystem(assignee);
    }

    private ActionItemResponseDto mapToDto(ActionItemEntity entity) {
        return new ActionItemResponseDto(
                entity.getId(),
                entity.getDescription(),
                entity.getAssignee(),
                entity.getDueDate(),
                entity.getContext(),
                entity.getStatus(),
                entity.getMeeting().getId(),
                entity.getMeeting().getTitle()
        );
    }
}
