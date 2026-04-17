package com.asterum.scheduler.schedule.domain;

import com.asterum.scheduler.participant.domain.Participant;
import com.asterum.scheduler.team.domain.Team;
import java.util.List;

public record SelectionSnapshot(
    List<Participant> participants,
    List<Team> teams
) {

    public SelectionSnapshot {
        participants = List.copyOf(participants);
        teams = List.copyOf(teams);
    }
}
