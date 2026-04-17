package com.asterum.scheduler.schedule.presentation.response;

import com.asterum.scheduler.participant.domain.Participant;
import com.asterum.scheduler.participant.presentation.response.ParticipantResponse;
import com.asterum.scheduler.resource.presentation.response.ResourceResponse;
import com.asterum.scheduler.schedule.domain.ScheduleOccurrence;
import com.asterum.scheduler.schedule.domain.ScheduleOccurrenceParticipant;
import com.asterum.scheduler.schedule.domain.ScheduleOccurrenceTeam;
import com.asterum.scheduler.schedule.domain.ScheduleSeries;
import com.asterum.scheduler.team.domain.Team;
import com.asterum.scheduler.team.presentation.response.TeamResponse;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class ScheduleResponseAssembler {

    public ScheduleResponse toResponse(ScheduleOccurrence occurrence) {
        List<ParticipantResponse> participants = occurrence.getParticipantLinks().stream()
            .map(ScheduleOccurrenceParticipant::getParticipant)
            .sorted(Comparator.comparing(Participant::getId))
            .map(participant -> new ParticipantResponse(participant.getId(), participant.getName(), participant.getType()))
            .toList();

        List<TeamResponse> teams = occurrence.getTeamLinks().stream()
            .map(ScheduleOccurrenceTeam::getTeam)
            .sorted(Comparator.comparing(Team::getId))
            .map(TeamResponse::from)
            .toList();

        ScheduleResponse.RecurrenceSummary recurrence = null;
        if (occurrence.getSeries() != null) {
            ScheduleSeries series = occurrence.getSeries();
            recurrence = new ScheduleResponse.RecurrenceSummary(
                series.getRecurrenceType(),
                series.getIntervalValue(),
                series.getEndType(),
                series.getUntilDate(),
                series.getOccurrenceCount(),
                series.getAnchorDate()
            );
        }

        ResourceResponse resource = occurrence.getResource() == null
            ? null
            : ResourceResponse.from(occurrence.getResource());

        return new ScheduleResponse(
            occurrence.getId(),
            occurrence.getSeries() != null ? occurrence.getSeries().getId() : null,
            occurrence.getTitle(),
            occurrence.getOccurrenceDate(),
            occurrence.getStartTime(),
            occurrence.getEndTime(),
            occurrence.getSeries() != null,
            occurrence.isException(),
            participants.stream().map(ParticipantResponse::id).toList(),
            participants,
            teams.stream().map(TeamResponse::id).toList(),
            teams,
            resource,
            recurrence
        );
    }
}
