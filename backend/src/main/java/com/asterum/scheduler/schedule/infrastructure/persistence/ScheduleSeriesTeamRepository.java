package com.asterum.scheduler.schedule.infrastructure.persistence;

import com.asterum.scheduler.schedule.domain.ScheduleSeriesTeam;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScheduleSeriesTeamRepository extends JpaRepository<ScheduleSeriesTeam, Long> {

    boolean existsByTeamId(Long teamId);
}
