package com.asterum.scheduler.schedule.infrastructure.persistence;

import com.asterum.scheduler.schedule.domain.ScheduleSeries;
import com.asterum.scheduler.schedule.domain.SeriesEndType;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScheduleSeriesRepository extends JpaRepository<ScheduleSeries, Long> {

    List<ScheduleSeries> findByActiveTrueAndEndType(SeriesEndType endType);
}
