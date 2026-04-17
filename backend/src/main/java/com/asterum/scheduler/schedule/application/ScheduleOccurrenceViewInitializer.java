package com.asterum.scheduler.schedule.application;

import com.asterum.scheduler.schedule.domain.ScheduleOccurrence;
import org.hibernate.Hibernate;
import org.springframework.stereotype.Component;

@Component
public class ScheduleOccurrenceViewInitializer {

    public ScheduleOccurrence initialize(ScheduleOccurrence occurrence) {
        Hibernate.initialize(occurrence.getSeries());
        Hibernate.initialize(occurrence.getResource());

        Hibernate.initialize(occurrence.getParticipantLinks());
        occurrence.getParticipantLinks().forEach(link -> Hibernate.initialize(link.getParticipant()));

        Hibernate.initialize(occurrence.getTeamLinks());
        occurrence.getTeamLinks().forEach(link -> {
            Hibernate.initialize(link.getTeam());
            Hibernate.initialize(link.getTeam().getMembers());
            link.getTeam().getMembers().forEach(member -> Hibernate.initialize(member.getParticipant()));
        });

        return occurrence;
    }
}
