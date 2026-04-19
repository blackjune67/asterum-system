package com.asterum.scheduler.participant.application;

import com.asterum.scheduler.common.exception.BadRequestException;
import com.asterum.scheduler.common.exception.ErrorCode;
import com.asterum.scheduler.common.exception.NotFoundException;
import com.asterum.scheduler.participant.application.command.UpsertParticipantCommand;
import com.asterum.scheduler.participant.domain.Participant;
import com.asterum.scheduler.participant.domain.ParticipantType;
import com.asterum.scheduler.participant.infrastructure.persistence.ParticipantRepository;
import com.asterum.scheduler.schedule.infrastructure.persistence.ScheduleOccurrenceParticipantRepository;
import com.asterum.scheduler.schedule.infrastructure.persistence.ScheduleSeriesParticipantRepository;
import com.asterum.scheduler.team.domain.Team;
import com.asterum.scheduler.team.infrastructure.persistence.TeamRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ParticipantCommandService {

    private final ParticipantRepository participantRepository;
    private final TeamRepository teamRepository;
    private final ScheduleOccurrenceParticipantRepository scheduleOccurrenceParticipantRepository;
    private final ScheduleSeriesParticipantRepository scheduleSeriesParticipantRepository;

    public ParticipantCommandService(
        ParticipantRepository participantRepository,
        TeamRepository teamRepository,
        ScheduleOccurrenceParticipantRepository scheduleOccurrenceParticipantRepository,
        ScheduleSeriesParticipantRepository scheduleSeriesParticipantRepository
    ) {
        this.participantRepository = participantRepository;
        this.teamRepository = teamRepository;
        this.scheduleOccurrenceParticipantRepository = scheduleOccurrenceParticipantRepository;
        this.scheduleSeriesParticipantRepository = scheduleSeriesParticipantRepository;
    }

    public ParticipantView create(UpsertParticipantCommand command) {
        validateStaffCommand(command);
        String normalizedName = normalizeName(command.name());
        validateUniqueName(normalizedName, null);

        Team team = requireTeam(command.teamId());
        Participant participant = participantRepository.save(new Participant(normalizedName, command.type()));
        team.addMember(participant);
        return ParticipantView.from(participant, team);
    }

    public ParticipantView update(Long id, UpsertParticipantCommand command) {
        validateStaffCommand(command);

        Participant participant = participantRepository.findById(id)
            .orElseThrow(() -> new NotFoundException(ErrorCode.PARTICIPANT_NOT_FOUND, id));
        if (participant.getType() != ParticipantType.STAFF) {
            throw new BadRequestException(ErrorCode.STAFF_TYPE_REQUIRED);
        }

        String normalizedName = normalizeName(command.name());
        validateUniqueName(normalizedName, participant.getId());

        Team currentTeam = requireStaffTeam(participant.getId());
        Team targetTeam = requireTeam(command.teamId());

        participant.rename(normalizedName);
        if (!currentTeam.getId().equals(targetTeam.getId())) {
            currentTeam.removeMember(participant.getId());
            targetTeam.addMember(participant);
        }

        return ParticipantView.from(participant, targetTeam);
    }

    public void delete(Long id) {
        Participant participant = participantRepository.findById(id)
            .orElseThrow(() -> new NotFoundException(ErrorCode.PARTICIPANT_NOT_FOUND, id));
        if (participant.getType() != ParticipantType.STAFF) {
            throw new BadRequestException(ErrorCode.STAFF_TYPE_REQUIRED);
        }
        if (scheduleOccurrenceParticipantRepository.existsByParticipantId(id)
            || scheduleSeriesParticipantRepository.existsByParticipantId(id)) {
            throw new BadRequestException(ErrorCode.PARTICIPANT_IN_USE);
        }

        Team currentTeam = requireStaffTeam(id);
        currentTeam.removeMember(id);
        participantRepository.delete(participant);
    }

    private void validateStaffCommand(UpsertParticipantCommand command) {
        if (command.type() != ParticipantType.STAFF) {
            throw new BadRequestException(ErrorCode.STAFF_TYPE_REQUIRED);
        }
        if (command.teamId() == null) {
            throw new BadRequestException(ErrorCode.STAFF_TEAM_REQUIRED);
        }
    }

    private void validateUniqueName(String name, Long currentParticipantId) {
        participantRepository.findByName(name)
            .filter(existing -> !existing.getId().equals(currentParticipantId))
            .ifPresent(existing -> {
                throw new BadRequestException(ErrorCode.PARTICIPANT_NAME_DUPLICATE, name);
            });
    }

    private Team requireTeam(Long teamId) {
        return teamRepository.findById(teamId)
            .orElseThrow(() -> new NotFoundException(ErrorCode.TEAM_NOT_FOUND, teamId));
    }

    private Team requireStaffTeam(Long participantId) {
        return teamRepository.findByParticipantId(participantId)
            .orElseThrow(() -> new BadRequestException(ErrorCode.STAFF_TEAM_REQUIRED));
    }

    private String normalizeName(String name) {
        return name == null ? null : name.trim();
    }
}
