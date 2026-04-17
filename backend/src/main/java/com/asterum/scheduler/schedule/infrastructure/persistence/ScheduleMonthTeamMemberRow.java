package com.asterum.scheduler.schedule.infrastructure.persistence;

import com.asterum.scheduler.participant.domain.ParticipantType;

public record ScheduleMonthTeamMemberRow(
    Long occurrenceId,
    Long teamId,
    String teamName,
    Long memberParticipantId,
    String memberParticipantName,
    ParticipantType memberParticipantType
) {
}
