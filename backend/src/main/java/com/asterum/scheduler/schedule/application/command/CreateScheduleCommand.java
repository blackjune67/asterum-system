package com.asterum.scheduler.schedule.application.command;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record CreateScheduleCommand(
    String title,
    LocalDate date,
    LocalTime startTime,
    LocalTime endTime,
    List<Long> participantIds,
    List<Long> teamIds,
    Long resourceId,
    RecurrenceCommand recurrence
) {
}
