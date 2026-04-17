package com.asterum.scheduler.schedule.application;

import com.asterum.scheduler.common.exception.BadRequestException;
import com.asterum.scheduler.common.exception.ErrorCode;
import com.asterum.scheduler.participant.domain.Participant;
import com.asterum.scheduler.participant.infrastructure.persistence.ParticipantRepository;
import com.asterum.scheduler.resource.domain.Resource;
import com.asterum.scheduler.resource.infrastructure.persistence.ResourceRepository;
import com.asterum.scheduler.schedule.domain.SelectionSnapshot;
import com.asterum.scheduler.team.domain.Team;
import com.asterum.scheduler.team.infrastructure.persistence.TeamRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class SelectionSnapshotResolver {

    private final ParticipantRepository participantRepository;
    private final TeamRepository teamRepository;
    private final ResourceRepository resourceRepository;

    public SelectionSnapshotResolver(
        ParticipantRepository participantRepository,
        TeamRepository teamRepository,
        ResourceRepository resourceRepository
    ) {
        this.participantRepository = participantRepository;
        this.teamRepository = teamRepository;
        this.resourceRepository = resourceRepository;
    }

    public SelectionSnapshot resolve(List<Long> participantIds, List<Long> teamIds) {
        List<Participant> directParticipants = resolveParticipants(participantIds);
        List<Team> teams = resolveTeams(teamIds);

        LinkedHashMap<Long, Participant> snapshot = new LinkedHashMap<>();
        directParticipants.forEach(participant -> snapshot.put(participant.getId(), participant));
        teams.stream()
            .flatMap(team -> team.getMembers().stream())
            .map(member -> member.getParticipant())
            .forEach(participant -> snapshot.putIfAbsent(participant.getId(), participant));

        return new SelectionSnapshot(
            snapshot.values().stream()
                .sorted(Comparator.comparing(Participant::getId))
                .toList(),
            teams
        );
    }

    public SelectionSnapshot fromOccurrenceSelection(
        List<Participant> participants,
        List<Team> teams
    ) {
        return new SelectionSnapshot(
            participants.stream().sorted(Comparator.comparing(Participant::getId)).toList(),
            teams.stream().sorted(Comparator.comparing(Team::getId)).toList()
        );
    }

    public Resource lockAndResolveResource(Long resourceId) {
        if (resourceId == null) {
            return null;
        }
        return resourceRepository.findByIdForUpdate(resourceId)
            .orElseThrow(() -> new BadRequestException(ErrorCode.RESOURCE_NOT_FOUND));
    }

    public Resource lockAndResolveResource(Resource resource) {
        if (resource == null) {
            return null;
        }
        return lockAndResolveResource(resource.getId());
    }

    private List<Participant> resolveParticipants(List<Long> participantIds) {
        List<Long> safeIds = participantIds == null ? List.of() : participantIds;
        List<Participant> participants = new ArrayList<>(participantRepository.findAllById(safeIds));
        if (participants.size() != safeIds.stream().distinct().count()) {
            throw new BadRequestException(ErrorCode.PARTICIPANTS_NOT_FOUND);
        }
        participants.sort(Comparator.comparing(Participant::getId));
        return participants;
    }

    private List<Team> resolveTeams(List<Long> teamIds) {
        List<Long> safeIds = teamIds == null ? List.of() : teamIds;
        List<Team> teams = new ArrayList<>(teamRepository.findAllById(safeIds));
        if (teams.size() != safeIds.stream().distinct().count()) {
            throw new BadRequestException(ErrorCode.TEAMS_NOT_FOUND);
        }
        teams.sort(Comparator.comparing(Team::getId));
        return teams;
    }
}
