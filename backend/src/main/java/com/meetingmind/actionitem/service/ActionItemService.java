package com.meetingmind.actionitem.service;

import com.meetingmind.actionitem.dto.ActionItemResponseDto;
import com.meetingmind.actionitem.entity.ActionItemEntity;
import com.meetingmind.actionitem.entity.ActionItemStatus;
import com.meetingmind.actionitem.repository.ActionItemRepository;
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

    @Transactional(readOnly = true)
    public List<ActionItemResponseDto> getAllActionItems() {
        return actionItemRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = "meetings", key = "#result.meetingId()")
    public ActionItemResponseDto updateStatus(UUID id, ActionItemStatus status) {
        ActionItemEntity entity = actionItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Action Item not found"));
        
        entity.setStatus(status);
        ActionItemEntity updated = actionItemRepository.save(entity);
        return mapToDto(updated);
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
    @Transactional(readOnly = true)
    public com.meetingmind.actionitem.dto.WorkloadResponseDto getWorkloadForAssignee(String assignee) {
        List<ActionItemEntity> items = actionItemRepository.findByAssignee(assignee);
        long openCount = items.stream().filter(item -> item.getStatus() == ActionItemStatus.OPEN).count();
        long doneCount = items.stream().filter(item -> item.getStatus() == ActionItemStatus.DONE).count();
        List<ActionItemResponseDto> openItems = items.stream()
                .filter(item -> item.getStatus() == ActionItemStatus.OPEN)
                .map(this::mapToDto)
                .collect(Collectors.toList());
        
        return new com.meetingmind.actionitem.dto.WorkloadResponseDto(assignee, openCount, doneCount, openItems);
    }
}
