package com.asterum.scheduler.schedule.presentation.request;

import com.asterum.scheduler.schedule.application.command.UpdateScheduleCommand;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record UpdateScheduleRequest(
    @NotBlank String title,
    LocalDate date,
    @NotNull LocalTime startTime,
    @NotNull LocalTime endTime,
    List<Long> participantIds,
    List<Long> teamIds,
    Long resourceId
) {
    public UpdateScheduleCommand toCommand() {
        return new UpdateScheduleCommand(
            title,
            date,
            startTime,
            endTime,
            participantIds,
            teamIds,
            resourceId
        );
    }
}
