package com.asterum.scheduler.schedule.application.command;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record UpdateScheduleCommand(
    String title,
    LocalDate date,
    LocalTime startTime,
    LocalTime endTime,
    List<Long> participantIds,
    List<Long> teamIds,
    Long resourceId
) {
}
