package com.asterum.scheduler.schedule.infrastructure.persistence;

import com.asterum.scheduler.schedule.domain.OccurrenceStatus;
import com.asterum.scheduler.schedule.domain.ScheduleOccurrence;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScheduleOccurrenceRepository extends JpaRepository<ScheduleOccurrence, Long> {

    @Override
    @EntityGraph(attributePaths = {"series", "resource"})
    Optional<ScheduleOccurrence> findById(Long id);

    @EntityGraph(attributePaths = {"series", "resource"})
    List<ScheduleOccurrence> findByOccurrenceDateBetweenAndStatusOrderByOccurrenceDateAscStartTimeAsc(
        LocalDate start,
        LocalDate end,
        OccurrenceStatus status
    );

    @EntityGraph(attributePaths = {"series", "resource"})
    List<ScheduleOccurrence> findBySeriesIdAndStatusOrderByOccurrenceDateAscStartTimeAsc(
        Long seriesId,
        OccurrenceStatus status
    );

    @EntityGraph(attributePaths = {"resource"})
    List<ScheduleOccurrence> findByResourceIdAndOccurrenceDateAndStatus(Long resourceId, LocalDate occurrenceDate, OccurrenceStatus status);

    boolean existsBySeriesIdAndOccurrenceDateAndStartTime(Long seriesId, LocalDate date, LocalTime startTime);

    @EntityGraph(attributePaths = {"series", "resource"})
    Optional<ScheduleOccurrence> findBySeriesIdAndOccurrenceDateAndStartTime(Long seriesId, LocalDate date, LocalTime startTime);

    @EntityGraph(attributePaths = {"series", "series.resource"})
    ScheduleOccurrence findTopBySeriesIdOrderByOccurrenceDateDescStartTimeDesc(Long seriesId);
}
