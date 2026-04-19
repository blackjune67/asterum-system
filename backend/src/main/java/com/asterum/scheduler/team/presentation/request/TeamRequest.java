package com.asterum.scheduler.team.presentation.request;

import com.asterum.scheduler.team.application.command.UpsertTeamCommand;
import jakarta.validation.constraints.NotBlank;

public record TeamRequest(
    @NotBlank String name
) {
    public UpsertTeamCommand toCommand() {
        return new UpsertTeamCommand(name);
    }
}
