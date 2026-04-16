package com.asterum.scheduler.schedule;

import static org.assertj.core.api.Assertions.assertThat;

import com.asterum.scheduler.schedule.domain.RecurrenceType;
import com.asterum.scheduler.schedule.domain.SeriesEndType;
import com.asterum.scheduler.schedule.dto.CreateScheduleRequest;
import com.asterum.scheduler.schedule.dto.RecurrenceRequest;
import com.asterum.scheduler.schedule.dto.ScopeType;
import com.asterum.scheduler.schedule.dto.ScheduleResponse;
import com.asterum.scheduler.schedule.dto.UpdateScheduleRequest;
import com.asterum.scheduler.schedule.repository.ScheduleOccurrenceRepository;
import com.asterum.scheduler.schedule.repository.ScheduleSeriesRepository;
import com.asterum.scheduler.schedule.service.ScheduleService;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class ScheduleServiceTest {

    @Autowired
    private ScheduleService scheduleService;

    @Autowired
    private ScheduleOccurrenceRepository scheduleOccurrenceRepository;

    @Autowired
    private ScheduleSeriesRepository scheduleSeriesRepository;

    @BeforeEach
    void cleanSchedules() {
        scheduleOccurrenceRepository.deleteAll();
        scheduleSeriesRepository.deleteAll();
    }

    @Test
    void createsOneTimeSchedule() {
        ScheduleResponse response = scheduleService.create(new CreateScheduleRequest(
            "단건 촬영",
            LocalDate.of(2026, 4, 20),
            LocalTime.of(10, 0),
            LocalTime.of(12, 0),
            List.of(1L, 3L),
            null
        ));

        assertThat(response.isRecurring()).isFalse();
        assertThat(response.participantIds()).containsExactly(1L, 3L);
    }

    @Test
    void updatesSingleRecurringOccurrenceAsException() {
        scheduleService.create(new CreateScheduleRequest(
            "주간 촬영",
            LocalDate.of(2026, 4, 20),
            LocalTime.of(10, 0),
            LocalTime.of(12, 0),
            List.of(1L),
            new RecurrenceRequest(true, RecurrenceType.WEEKLY, 1, SeriesEndType.COUNT, null, 3)
        ));

        ScheduleResponse target = scheduleService.listMonth(2026, 4).stream()
            .filter(item -> item.date().equals(LocalDate.of(2026, 4, 27)))
            .findFirst()
            .orElseThrow();

        ScheduleResponse updated = scheduleService.update(target.id(), ScopeType.THIS, new UpdateScheduleRequest(
            "변경된 촬영",
            LocalDate.of(2026, 4, 28),
            LocalTime.of(11, 0),
            LocalTime.of(13, 0),
            List.of(2L)
        ));

        assertThat(updated.isException()).isTrue();
        assertThat(updated.date()).isEqualTo(LocalDate.of(2026, 4, 28));
        assertThat(updated.participantIds()).containsExactly(2L);
    }

    @Test
    void deletesFollowingRecurringOccurrences() {
        scheduleService.create(new CreateScheduleRequest(
            "주간 안무",
            LocalDate.of(2026, 4, 20),
            LocalTime.of(9, 0),
            LocalTime.of(10, 0),
            List.of(1L),
            new RecurrenceRequest(true, RecurrenceType.WEEKLY, 1, SeriesEndType.COUNT, null, 4)
        ));

        ScheduleResponse target = scheduleService.listMonth(2026, 4).stream()
            .filter(item -> item.date().equals(LocalDate.of(2026, 4, 27)))
            .findFirst()
            .orElseThrow();

        scheduleService.delete(target.id(), ScopeType.FOLLOWING);

        assertThat(scheduleService.listMonth(2026, 4)).extracting(ScheduleResponse::date)
            .containsExactly(LocalDate.of(2026, 4, 20));
    }

    @Test
    void updatesFollowingRecurringOccurrencesWithNewSeries() {
        scheduleService.create(new CreateScheduleRequest(
            "Weekly shoot",
            LocalDate.of(2026, 4, 20),
            LocalTime.of(10, 0),
            LocalTime.of(12, 0),
            List.of(1L),
            new RecurrenceRequest(true, RecurrenceType.WEEKLY, 1, SeriesEndType.COUNT, null, 4)
        ));

        ScheduleResponse target = scheduleService.listMonth(2026, 4).stream()
            .filter(item -> item.date().equals(LocalDate.of(2026, 4, 27)))
            .findFirst()
            .orElseThrow();

        ScheduleResponse updated = scheduleService.update(target.id(), ScopeType.FOLLOWING, new UpdateScheduleRequest(
            "Updated shoot",
            LocalDate.of(2026, 4, 27),
            LocalTime.of(11, 0),
            LocalTime.of(13, 0),
            List.of(2L, 3L)
        ));

        assertThat(updated.date()).isEqualTo(LocalDate.of(2026, 4, 27));
        assertThat(updated.title()).isEqualTo("Updated shoot");
        assertThat(updated.participantIds()).containsExactly(2L, 3L);

        assertThat(scheduleService.listMonth(2026, 4)).extracting(ScheduleResponse::date, ScheduleResponse::title)
            .containsExactly(
                org.assertj.core.groups.Tuple.tuple(LocalDate.of(2026, 4, 20), "Weekly shoot"),
                org.assertj.core.groups.Tuple.tuple(LocalDate.of(2026, 4, 27), "Updated shoot")
            );

        assertThat(scheduleService.listMonth(2026, 5)).extracting(ScheduleResponse::date, ScheduleResponse::title)
            .containsExactly(
                org.assertj.core.groups.Tuple.tuple(LocalDate.of(2026, 5, 4), "Updated shoot"),
                org.assertj.core.groups.Tuple.tuple(LocalDate.of(2026, 5, 11), "Updated shoot")
            );
    }
}
