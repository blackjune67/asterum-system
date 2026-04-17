package com.asterum.scheduler.schedule.presentation.request;

import com.asterum.scheduler.schedule.application.command.RecurrenceCommand;
import com.asterum.scheduler.schedule.domain.RecurrenceType;
import com.asterum.scheduler.schedule.domain.SeriesEndType;
import java.time.LocalDate;

public record RecurrenceRequest(
    boolean enabled,
    RecurrenceType type,
    Integer interval,
    SeriesEndType endType,
    LocalDate untilDate,
    Integer count
) {
    public RecurrenceCommand toCommand() {
        return new RecurrenceCommand(enabled, type, interval, endType, untilDate, count);
    }
}
