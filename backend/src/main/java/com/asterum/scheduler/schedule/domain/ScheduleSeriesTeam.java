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
@Table(name = "schedule_series_teams")
public class ScheduleSeriesTeam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "series_id", nullable = false)
    private ScheduleSeries series;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    protected ScheduleSeriesTeam() {
    }

    public ScheduleSeriesTeam(ScheduleSeries series, Team team) {
        this.series = series;
        this.team = team;
    }

    public Team getTeam() {
        return team;
    }
}
