package com.asterum.scheduler.schedule.infrastructure.persistence;

import com.asterum.scheduler.participant.domain.ParticipantType;

public record ScheduleMonthParticipantRow(
    Long occurrenceId,
    Long participantId,
    String participantName,
    ParticipantType participantType
) {
}
