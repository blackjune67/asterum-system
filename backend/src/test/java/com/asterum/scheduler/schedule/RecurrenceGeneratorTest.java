package com.asterum.scheduler.schedule;

import static org.assertj.core.api.Assertions.assertThat;

import com.asterum.scheduler.schedule.domain.RecurrenceType;
import com.asterum.scheduler.schedule.domain.SeriesEndType;
import com.asterum.scheduler.schedule.service.RecurrenceGenerator;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class RecurrenceGeneratorTest {

    private final RecurrenceGenerator generator = new RecurrenceGenerator();

    @Test
    void generatesWeeklyOccurrencesByCount() {
        assertThat(generator.generateDates(
            LocalDate.of(2026, 4, 20),
            RecurrenceType.WEEKLY,
            1,
            SeriesEndType.COUNT,
            null,
            3,
            LocalDate.of(2026, 12, 31)
        )).containsExactly(
            LocalDate.of(2026, 4, 20),
            LocalDate.of(2026, 4, 27),
            LocalDate.of(2026, 5, 4)
        );
    }

    @Test
    void clipsNeverEndingRecurrenceAtHorizon() {
        assertThat(generator.generateDates(
            LocalDate.of(2026, 4, 1),
            RecurrenceType.MONTHLY,
            1,
            SeriesEndType.NEVER,
            null,
            null,
            LocalDate.of(2026, 6, 30)
        )).containsExactly(
            LocalDate.of(2026, 4, 1),
            LocalDate.of(2026, 5, 1),
            LocalDate.of(2026, 6, 1)
        );
    }
}
