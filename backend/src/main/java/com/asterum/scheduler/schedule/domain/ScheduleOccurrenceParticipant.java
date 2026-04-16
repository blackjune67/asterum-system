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
@Table(name = "schedule_occurrence_participants")
public class ScheduleOccurrenceParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "occurrence_id", nullable = false)
    private ScheduleOccurrence occurrence;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant_id", nullable = false)
    private Participant participant;

    protected ScheduleOccurrenceParticipant() {
    }

    public ScheduleOccurrenceParticipant(ScheduleOccurrence occurrence, Participant participant) {
        this.occurrence = occurrence;
        this.participant = participant;
    }

    public Participant getParticipant() {
        return participant;
    }
}
