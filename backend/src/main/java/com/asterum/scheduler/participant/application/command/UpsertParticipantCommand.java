package com.asterum.scheduler.participant.application.command;

import com.asterum.scheduler.participant.domain.ParticipantType;

public record UpsertParticipantCommand(
    String name,
    ParticipantType type,
    Long teamId
) {
}
