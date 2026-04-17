package com.asterum.scheduler.schedule.presentation.request;

import com.asterum.scheduler.schedule.application.command.CreateScheduleCommand;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record CreateScheduleRequest(
    @NotBlank String title,
    @NotNull LocalDate date,
    @NotNull LocalTime startTime,
    @NotNull LocalTime endTime,
    List<Long> participantIds,
    List<Long> teamIds,
    Long resourceId,
    RecurrenceRequest recurrence
) {
    public CreateScheduleCommand toCommand() {
        return new CreateScheduleCommand(
            title,
            date,
            startTime,
            endTime,
            participantIds,
            teamIds,
            resourceId,
            recurrence == null ? null : recurrence.toCommand()
        );
    }
}
