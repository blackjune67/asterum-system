package com.asterum.scheduler.schedule.application;

import com.asterum.scheduler.participant.domain.ParticipantType;
import com.asterum.scheduler.schedule.domain.RecurrenceType;
import com.asterum.scheduler.schedule.domain.SeriesEndType;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record ScheduleMonthView(
    Long id,
    Long seriesId,
    String title,
    LocalDate date,
    LocalTime startTime,
    LocalTime endTime,
    boolean isRecurring,
    boolean isException,
    List<ParticipantView> participants,
    List<TeamView> teams,
    ResourceView resource,
    RecurrenceView recurrence
) {
    public record ParticipantView(
        Long id,
        String name,
        ParticipantType type
    ) {
    }

    public record TeamView(
        Long id,
        String name,
        List<ParticipantView> members
    ) {
    }

    public record ResourceView(
        Long id,
        String name,
        String category
    ) {
    }

    public record RecurrenceView(
        RecurrenceType type,
        Integer interval,
        SeriesEndType endType,
        LocalDate untilDate,
        Integer count,
        LocalDate anchorDate
    ) {
    }
}
