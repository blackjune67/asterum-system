package com.asterum.scheduler.participant.dto;

import com.asterum.scheduler.participant.domain.ParticipantType;

public record ParticipantResponse(
    Long id,
    String name,
    ParticipantType type
) {
}
