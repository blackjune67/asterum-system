package com.asterum.scheduler.team.presentation.response;

import com.asterum.scheduler.participant.presentation.response.ParticipantResponse;
import com.asterum.scheduler.team.domain.Team;
import java.util.List;

public record TeamResponse(
    Long id,
    String name,
    List<Long> memberIds,
    List<ParticipantResponse> members
) {
    public static TeamResponse from(Team team) {
        List<ParticipantResponse> members = team.getMembers().stream()
            .map(member -> member.getParticipant())
            .sorted(java.util.Comparator.comparing(participant -> participant.getId()))
            .map(ParticipantResponse::from)
            .toList();

        return new TeamResponse(
            team.getId(),
            team.getName(),
            members.stream().map(ParticipantResponse::id).toList(),
            members
        );
    }
}
