package com.asterum.scheduler.schedule.repository;

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
    @EntityGraph(attributePaths = {"series", "participantLinks", "participantLinks.participant"})
    Optional<ScheduleOccurrence> findById(Long id);

    @EntityGraph(attributePaths = {"series", "participantLinks", "participantLinks.participant"})
    List<ScheduleOccurrence> findByOccurrenceDateBetweenAndStatusOrderByOccurrenceDateAscStartTimeAsc(
        LocalDate start,
        LocalDate end,
        OccurrenceStatus status
    );

    @EntityGraph(attributePaths = {"series", "participantLinks", "participantLinks.participant"})
    List<ScheduleOccurrence> findBySeriesIdAndStatusOrderByOccurrenceDateAscStartTimeAsc(
        Long seriesId,
        OccurrenceStatus status
    );

    boolean existsBySeriesIdAndOccurrenceDateAndStartTime(Long seriesId, LocalDate date, LocalTime startTime);

    @EntityGraph(attributePaths = {"series"})
    ScheduleOccurrence findTopBySeriesIdOrderByOccurrenceDateDescStartTimeDesc(Long seriesId);
}
