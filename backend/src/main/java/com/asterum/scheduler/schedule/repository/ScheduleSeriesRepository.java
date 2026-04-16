package com.asterum.scheduler.schedule.repository;

import com.asterum.scheduler.schedule.domain.ScheduleSeries;
import com.asterum.scheduler.schedule.domain.SeriesEndType;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScheduleSeriesRepository extends JpaRepository<ScheduleSeries, Long> {

    List<ScheduleSeries> findByActiveTrueAndEndType(SeriesEndType endType);
}
