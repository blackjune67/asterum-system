package com.asterum.scheduler.schedule.application;

import com.asterum.scheduler.common.exception.ErrorCode;
import com.asterum.scheduler.common.exception.NotFoundException;
import com.asterum.scheduler.schedule.domain.OccurrenceStatus;
import com.asterum.scheduler.schedule.domain.ScheduleOccurrence;
import com.asterum.scheduler.schedule.infrastructure.persistence.ScheduleOccurrenceRepository;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ScheduleQueryService {

    private final ScheduleOccurrenceRepository scheduleOccurrenceRepository;
    private final ScheduleOccurrenceViewInitializer scheduleOccurrenceViewInitializer;

    public ScheduleQueryService(
        ScheduleOccurrenceRepository scheduleOccurrenceRepository,
        ScheduleOccurrenceViewInitializer scheduleOccurrenceViewInitializer
    ) {
        this.scheduleOccurrenceRepository = scheduleOccurrenceRepository;
        this.scheduleOccurrenceViewInitializer = scheduleOccurrenceViewInitializer;
    }

    public ScheduleOccurrence get(Long id) {
        return scheduleOccurrenceViewInitializer.initialize(
            scheduleOccurrenceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(ErrorCode.SCHEDULE_OCCURRENCE_NOT_FOUND, id))
        );
    }

    public List<ScheduleOccurrence> listMonth(int year, int month) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());

        return scheduleOccurrenceRepository.findByOccurrenceDateBetweenAndStatusOrderByOccurrenceDateAscStartTimeAsc(
            start,
            end,
            OccurrenceStatus.ACTIVE
        ).stream()
            .map(scheduleOccurrenceViewInitializer::initialize)
            .toList();
    }
}
