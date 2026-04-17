package com.asterum.scheduler.schedule.domain;

import com.asterum.scheduler.common.exception.BadRequestException;
import com.asterum.scheduler.common.exception.ErrorCode;
import java.time.LocalDate;

public record RecurrenceSpec(
    RecurrenceType type,
    Integer interval,
    SeriesEndType endType,
    LocalDate untilDate,
    Integer count
) {

    public void validate() {
        if (type == null || interval == null || interval < 1 || endType == null) {
            throw new BadRequestException(ErrorCode.INVALID_RECURRENCE_REQUEST);
        }
        if (endType == SeriesEndType.UNTIL_DATE && untilDate == null) {
            throw new BadRequestException(ErrorCode.RECURRENCE_UNTIL_DATE_REQUIRED);
        }
        if (endType == SeriesEndType.COUNT && (count == null || count < 1)) {
            throw new BadRequestException(ErrorCode.RECURRENCE_COUNT_REQUIRED);
        }
    }

    public LocalDate initialHorizon(LocalDate anchorDate) {
        return switch (endType) {
            case NEVER -> anchorDate.plusMonths(6);
            case UNTIL_DATE -> untilDate;
            case COUNT -> anchorDate.plusYears(2);
        };
    }
}
