package com.asterum.scheduler.schedule.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "schedule_occurrences")
public class ScheduleOccurrence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "series_id")
    private ScheduleSeries series;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false)
    private LocalDate occurrenceDate;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OccurrenceStatus status;

    @Column(nullable = false)
    private boolean isException;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "occurrence", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ScheduleOccurrenceParticipant> participantLinks = new ArrayList<>();

    protected ScheduleOccurrence() {
    }

    public ScheduleOccurrence(
        ScheduleSeries series,
        String title,
        LocalDate occurrenceDate,
        LocalTime startTime,
        LocalTime endTime
    ) {
        this.series = series;
        this.title = title;
        this.occurrenceDate = occurrenceDate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.status = OccurrenceStatus.ACTIVE;
        this.isException = false;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public ScheduleSeries getSeries() {
        return series;
    }

    public String getTitle() {
        return title;
    }

    public LocalDate getOccurrenceDate() {
        return occurrenceDate;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public OccurrenceStatus getStatus() {
        return status;
    }

    public boolean isException() {
        return isException;
    }

    public List<ScheduleOccurrenceParticipant> getParticipantLinks() {
        return participantLinks;
    }

    public void updateSingle(String title, LocalDate date, LocalTime startTime, LocalTime endTime) {
        this.title = title;
        this.occurrenceDate = date;
        this.startTime = startTime;
        this.endTime = endTime;
        this.isException = true;
        this.updatedAt = LocalDateTime.now();
    }

    public void updateBasic(String title, LocalTime startTime, LocalTime endTime) {
        this.title = title;
        this.startTime = startTime;
        this.endTime = endTime;
        this.updatedAt = LocalDateTime.now();
    }

    public void cancel() {
        this.status = OccurrenceStatus.CANCELLED;
        this.updatedAt = LocalDateTime.now();
    }
}
