package com.asterum.scheduler.team.application;

import com.asterum.scheduler.common.exception.BadRequestException;
import com.asterum.scheduler.common.exception.ErrorCode;
import com.asterum.scheduler.common.exception.NotFoundException;
import com.asterum.scheduler.schedule.infrastructure.persistence.ScheduleOccurrenceTeamRepository;
import com.asterum.scheduler.schedule.infrastructure.persistence.ScheduleSeriesTeamRepository;
import com.asterum.scheduler.team.application.command.UpsertTeamCommand;
import com.asterum.scheduler.team.domain.Team;
import com.asterum.scheduler.team.infrastructure.persistence.TeamRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class TeamCommandService {

    private final TeamRepository teamRepository;
    private final ScheduleOccurrenceTeamRepository scheduleOccurrenceTeamRepository;
    private final ScheduleSeriesTeamRepository scheduleSeriesTeamRepository;

    public TeamCommandService(
        TeamRepository teamRepository,
        ScheduleOccurrenceTeamRepository scheduleOccurrenceTeamRepository,
        ScheduleSeriesTeamRepository scheduleSeriesTeamRepository
    ) {
        this.teamRepository = teamRepository;
        this.scheduleOccurrenceTeamRepository = scheduleOccurrenceTeamRepository;
        this.scheduleSeriesTeamRepository = scheduleSeriesTeamRepository;
    }

    public Team create(UpsertTeamCommand command) {
        String normalizedName = normalizeName(command.name());
        validateUniqueName(normalizedName, null);
        return teamRepository.save(new Team(normalizedName));
    }

    public Team update(Long id, UpsertTeamCommand command) {
        Team team = teamRepository.findById(id)
            .orElseThrow(() -> new NotFoundException(ErrorCode.TEAM_NOT_FOUND, id));
        String normalizedName = normalizeName(command.name());
        validateUniqueName(normalizedName, id);
        team.rename(normalizedName);
        return team;
    }

    public void delete(Long id) {
        Team team = teamRepository.findById(id)
            .orElseThrow(() -> new NotFoundException(ErrorCode.TEAM_NOT_FOUND, id));
        if (!team.getMembers().isEmpty()) {
            throw new BadRequestException(ErrorCode.TEAM_HAS_MEMBERS);
        }
        if (scheduleOccurrenceTeamRepository.existsByTeamId(id)
            || scheduleSeriesTeamRepository.existsByTeamId(id)) {
            throw new BadRequestException(ErrorCode.TEAM_IN_USE);
        }
        teamRepository.delete(team);
    }

    private void validateUniqueName(String name, Long currentTeamId) {
        teamRepository.findByName(name)
            .filter(existing -> !existing.getId().equals(currentTeamId))
            .ifPresent(existing -> {
                throw new BadRequestException(ErrorCode.TEAM_NAME_DUPLICATE, name);
            });
    }

    private String normalizeName(String name) {
        return name == null ? null : name.trim();
    }
}
