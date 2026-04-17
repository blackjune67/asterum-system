package com.asterum.scheduler.team.service;

import com.asterum.scheduler.participant.dto.ParticipantResponse;
import com.asterum.scheduler.team.dto.TeamResponse;
import com.asterum.scheduler.team.repository.TeamRepository;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class TeamQueryService {

    private final TeamRepository teamRepository;

    public TeamQueryService(TeamRepository teamRepository) {
        this.teamRepository = teamRepository;
    }

    public List<TeamResponse> list() {
        return teamRepository.findAllByOrderByNameAsc().stream()
            .map(team -> {
                List<ParticipantResponse> members = team.getMembers().stream()
                    .map(member -> member.getParticipant())
                    .sorted(Comparator.comparing(participant -> participant.getId()))
                    .map(participant -> new ParticipantResponse(participant.getId(), participant.getName(), participant.getType()))
                    .toList();
                return new TeamResponse(
                    team.getId(),
                    team.getName(),
                    members.stream().map(ParticipantResponse::id).toList(),
                    members
                );
            })
            .toList();
    }
}
