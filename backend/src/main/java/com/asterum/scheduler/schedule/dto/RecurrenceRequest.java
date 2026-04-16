package com.asterum.scheduler.schedule.dto;

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
}
