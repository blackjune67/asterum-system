package com.asterum.scheduler.schedule.domain;

import com.asterum.scheduler.team.domain.Team;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "schedule_occurrence_teams")
public class ScheduleOccurrenceTeam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "occurrence_id", nullable = false)
    private ScheduleOccurrence occurrence;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    protected ScheduleOccurrenceTeam() {
    }

    public ScheduleOccurrenceTeam(ScheduleOccurrence occurrence, Team team) {
        this.occurrence = occurrence;
        this.team = team;
    }

    public Team getTeam() {
        return team;
    }
}
