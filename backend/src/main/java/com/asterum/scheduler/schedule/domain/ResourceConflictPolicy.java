package com.asterum.scheduler.schedule.domain;

import com.asterum.scheduler.common.exception.BadRequestException;
import com.asterum.scheduler.common.exception.ErrorCode;
import com.asterum.scheduler.resource.domain.Resource;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class ResourceConflictPolicy {

    public void assertNoConflict(
        Resource resource,
        LocalDate date,
        LocalTime startTime,
        LocalTime endTime,
        Set<Long> ignoredOccurrenceIds,
        List<ScheduleOccurrence> candidates
    ) {
        if (resource == null) {
            return;
        }

        ScheduleOccurrence conflict = candidates.stream()
            .filter(item -> !ignoredOccurrenceIds.contains(item.getId()))
            .filter(item -> overlaps(startTime, endTime, item.getStartTime(), item.getEndTime()))
            .findFirst()
            .orElse(null);

        if (conflict != null) {
            throw new BadRequestException(
                ErrorCode.RESOURCE_COLLISION,
                resource.getName(),
                date,
                conflict.getStartTime(),
                conflict.getEndTime()
            );
        }
    }

    private boolean overlaps(LocalTime startTime, LocalTime endTime, LocalTime otherStart, LocalTime otherEnd) {
        return startTime.isBefore(otherEnd) && otherStart.isBefore(endTime);
    }
}
