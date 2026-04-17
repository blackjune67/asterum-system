package com.asterum.scheduler.participant.presentation.response;

import com.asterum.scheduler.participant.domain.Participant;
import com.asterum.scheduler.participant.domain.ParticipantType;

public record ParticipantResponse(
    Long id,
    String name,
    ParticipantType type
) {
    public static ParticipantResponse from(Participant participant) {
        return new ParticipantResponse(
            participant.getId(),
            participant.getName(),
            participant.getType()
        );
    }
}
