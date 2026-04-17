package com.asterum.scheduler.schedule.domain;

import com.asterum.scheduler.participant.domain.Participant;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "schedule_series_participants")
public class ScheduleSeriesParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "series_id", nullable = false)
    private ScheduleSeries series;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant_id", nullable = false)
    private Participant participant;

    protected ScheduleSeriesParticipant() {
    }

    public ScheduleSeriesParticipant(ScheduleSeries series, Participant participant) {
        this.series = series;
        this.participant = participant;
    }

    public Participant getParticipant() {
        return participant;
    }
}
