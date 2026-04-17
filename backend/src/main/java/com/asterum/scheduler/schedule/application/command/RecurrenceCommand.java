package com.asterum.scheduler.schedule.application.command;

import com.asterum.scheduler.schedule.domain.RecurrenceType;
import com.asterum.scheduler.schedule.domain.SeriesEndType;
import java.time.LocalDate;

public record RecurrenceCommand(
    boolean enabled,
    RecurrenceType type,
    Integer interval,
    SeriesEndType endType,
    LocalDate untilDate,
    Integer count
) {
}
