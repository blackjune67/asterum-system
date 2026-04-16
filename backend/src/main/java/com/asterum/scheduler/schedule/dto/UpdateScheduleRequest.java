package com.asterum.scheduler.schedule.dto;

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
    List<Long> participantIds
) {
}
