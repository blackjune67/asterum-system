package com.asterum.scheduler.schedule.infrastructure.persistence;

import com.asterum.scheduler.schedule.domain.ScheduleSeriesParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScheduleSeriesParticipantRepository extends JpaRepository<ScheduleSeriesParticipant, Long> {

    boolean existsByParticipantId(Long participantId);
}
