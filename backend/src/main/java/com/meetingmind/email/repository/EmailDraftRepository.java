package com.meetingmind.email.repository;

import com.meetingmind.email.entity.EmailDraftEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailDraftRepository extends JpaRepository<EmailDraftEntity, UUID> {
    Optional<EmailDraftEntity> findByMeetingId(UUID meetingId);
}
