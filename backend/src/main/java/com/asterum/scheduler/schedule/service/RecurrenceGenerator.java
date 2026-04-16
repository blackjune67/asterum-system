package com.asterum.scheduler.schedule.service;

import com.asterum.scheduler.schedule.domain.RecurrenceType;
import com.asterum.scheduler.schedule.domain.SeriesEndType;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class RecurrenceGenerator {

    public List<LocalDate> generateDates(
        LocalDate anchorDate,
        RecurrenceType type,
        int interval,
        SeriesEndType endType,
        LocalDate untilDate,
        Integer occurrenceCount,
        LocalDate horizonEnd
    ) {
        List<LocalDate> dates = new ArrayList<>();
        LocalDate current = anchorDate;

        while (!current.isAfter(horizonEnd)) {
            if (endType == SeriesEndType.UNTIL_DATE && untilDate != null && current.isAfter(untilDate)) {
                break;
            }
            if (endType == SeriesEndType.COUNT && occurrenceCount != null && dates.size() >= occurrenceCount) {
                break;
            }

            dates.add(current);
            current = nextDate(current, type, interval);
        }

        return dates;
    }

    public LocalDate nextDate(LocalDate current, RecurrenceType type, int interval) {
        return switch (type) {
            case DAILY -> current.plusDays(interval);
            case WEEKLY -> current.plusWeeks(interval);
            case MONTHLY -> current.plusMonths(interval);
        };
    }
}
