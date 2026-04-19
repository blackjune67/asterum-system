package com.asterum.scheduler.participant.presentation.response;

import com.asterum.scheduler.participant.application.ParticipantView;
import com.asterum.scheduler.participant.domain.Participant;
import com.asterum.scheduler.participant.domain.ParticipantType;

public record ParticipantResponse(
    Long id,
    String name,
    ParticipantType type,
    Long teamId,
    String teamName
) {
    public static ParticipantResponse from(Participant participant) {
        return new ParticipantResponse(
            participant.getId(),
            participant.getName(),
            participant.getType(),
            null,
            null
        );
    }

    public static ParticipantResponse from(Participant participant, Long teamId, String teamName) {
        return new ParticipantResponse(
            participant.getId(),
            participant.getName(),
            participant.getType(),
            teamId,
            teamName
        );
    }

    public static ParticipantResponse from(ParticipantView participant) {
        return new ParticipantResponse(
            participant.id(),
            participant.name(),
            participant.type(),
            participant.teamId(),
            participant.teamName()
        );
    }
}
