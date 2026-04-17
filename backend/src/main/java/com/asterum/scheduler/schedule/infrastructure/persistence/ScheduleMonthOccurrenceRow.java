package com.asterum.scheduler.schedule.infrastructure.persistence;

import com.asterum.scheduler.schedule.domain.RecurrenceType;
import com.asterum.scheduler.schedule.domain.SeriesEndType;
import java.time.LocalDate;
import java.time.LocalTime;

public record ScheduleMonthOccurrenceRow(
    Long occurrenceId,
    Long seriesId,
    String title,
    LocalDate occurrenceDate,
    LocalTime startTime,
    LocalTime endTime,
    boolean isException,
    Long resourceId,
    String resourceName,
    String resourceCategory,
    RecurrenceType recurrenceType,
    Integer recurrenceInterval,
    SeriesEndType recurrenceEndType,
    LocalDate recurrenceUntilDate,
    Integer recurrenceCount,
    LocalDate recurrenceAnchorDate
) {
}
