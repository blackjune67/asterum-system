package com.asterum.scheduler.schedule.presentation.response;

import com.asterum.scheduler.participant.presentation.response.ParticipantResponse;
import com.asterum.scheduler.resource.presentation.response.ResourceResponse;
import com.asterum.scheduler.schedule.domain.RecurrenceType;
import com.asterum.scheduler.schedule.domain.SeriesEndType;
import com.asterum.scheduler.team.presentation.response.TeamResponse;
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
    List<Long> teamIds,
    List<TeamResponse> teams,
    ResourceResponse resource,
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
