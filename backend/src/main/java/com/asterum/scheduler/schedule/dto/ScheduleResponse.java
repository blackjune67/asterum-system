package com.asterum.scheduler.schedule.dto;

import com.asterum.scheduler.participant.dto.ParticipantResponse;
import com.asterum.scheduler.schedule.domain.RecurrenceType;
import com.asterum.scheduler.schedule.domain.SeriesEndType;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record ScheduleResponse(
    Long id,
    Long seriesId,
    String title,
    LocalDate date,
    LocalTime startTime,
    LocalTime endTime,
    boolean isRecurring,
    boolean isException,
    List<Long> participantIds,
    List<ParticipantResponse> participants,
    RecurrenceSummary recurrence
) {
    public record RecurrenceSummary(
        RecurrenceType type,
        Integer interval,
        SeriesEndType endType,
        LocalDate untilDate,
        Integer count,
        LocalDate anchorDate
    ) {
    }
}
