package com.asterum.scheduler.schedule.infrastructure.persistence;

import com.asterum.scheduler.schedule.domain.ScheduleOccurrenceParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScheduleOccurrenceParticipantRepository extends JpaRepository<ScheduleOccurrenceParticipant, Long> {

    boolean existsByParticipantId(Long participantId);
}
