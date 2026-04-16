package com.asterum.scheduler.schedule.repository;

import com.asterum.scheduler.schedule.domain.ScheduleOccurrenceParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScheduleOccurrenceParticipantRepository extends JpaRepository<ScheduleOccurrenceParticipant, Long> {
}
