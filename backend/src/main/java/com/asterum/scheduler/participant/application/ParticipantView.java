package com.asterum.scheduler.participant.application;

import com.asterum.scheduler.participant.domain.Participant;
import com.asterum.scheduler.participant.domain.ParticipantType;
import com.asterum.scheduler.team.domain.Team;

public record ParticipantView(
    Long id,
    String name,
    ParticipantType type,
    Long teamId,
    String teamName
) {
    public static ParticipantView from(Participant participant, Team team) {
        return new ParticipantView(
            participant.getId(),
            participant.getName(),
            participant.getType(),
            team == null ? null : team.getId(),
            team == null ? null : team.getName()
        );
    }
}
