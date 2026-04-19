package com.asterum.scheduler.participant.presentation.request;

import com.asterum.scheduler.participant.application.command.UpsertParticipantCommand;
import com.asterum.scheduler.participant.domain.ParticipantType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ParticipantRequest(
    @NotBlank String name,
    @NotNull ParticipantType type,
    @NotNull Long teamId
) {
    public UpsertParticipantCommand toCommand() {
        return new UpsertParticipantCommand(name, type, teamId);
    }
}
