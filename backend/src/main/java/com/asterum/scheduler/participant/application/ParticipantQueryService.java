package com.asterum.scheduler.participant.application;

import com.asterum.scheduler.participant.infrastructure.persistence.ParticipantRepository;
import com.asterum.scheduler.team.domain.Team;
import com.asterum.scheduler.team.infrastructure.persistence.TeamRepository;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ParticipantQueryService {

    private final ParticipantRepository participantRepository;
    private final TeamRepository teamRepository;

    public ParticipantQueryService(ParticipantRepository participantRepository, TeamRepository teamRepository) {
        this.participantRepository = participantRepository;
        this.teamRepository = teamRepository;
    }

    public List<ParticipantView> list() {
        Map<Long, Team> teamsByParticipantId = teamRepository.findAllByOrderByNameAsc()
            .stream()
            .flatMap(team -> team.getMembers().stream()
                .map(member -> Map.entry(member.getParticipant().getId(), team)))
            .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

        return participantRepository.findAllByOrderByIdAsc().stream()
            .map(participant -> ParticipantView.from(participant, teamsByParticipantId.get(participant.getId())))
            .toList();
    }
}
