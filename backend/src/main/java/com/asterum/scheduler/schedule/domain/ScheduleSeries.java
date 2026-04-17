package com.asterum.scheduler.schedule.domain;

import com.asterum.scheduler.resource.domain.Resource;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "schedule_series")
public class ScheduleSeries {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @ManyToOne
    @JoinColumn(name = "resource_id")
    private Resource resource;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RecurrenceType recurrenceType;

    @Column(nullable = false)
    private Integer intervalValue;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SeriesEndType endType;

    private LocalDate untilDate;

    private Integer occurrenceCount;

    @Column(nullable = false)
    private LocalDate anchorDate;

    @Column(nullable = false)
    private boolean active;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "series", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ScheduleSeriesParticipant> participantLinks = new ArrayList<>();

    @OneToMany(mappedBy = "series", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ScheduleSeriesTeam> teamLinks = new ArrayList<>();

    protected ScheduleSeries() {
    }

    public ScheduleSeries(
        String title,
        LocalTime startTime,
        LocalTime endTime,
        Resource resource,
        RecurrenceType recurrenceType,
        Integer intervalValue,
        SeriesEndType endType,
        LocalDate untilDate,
        Integer occurrenceCount,
        LocalDate anchorDate
    ) {
        this.title = title;
        this.startTime = startTime;
        this.endTime = endTime;
        this.resource = resource;
        this.recurrenceType = recurrenceType;
        this.intervalValue = intervalValue;
        this.endType = endType;
        this.untilDate = untilDate;
        this.occurrenceCount = occurrenceCount;
        this.anchorDate = anchorDate;
        this.active = true;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public Resource getResource() {
        return resource;
    }

    public RecurrenceType getRecurrenceType() {
        return recurrenceType;
    }

    public Integer getIntervalValue() {
        return intervalValue;
    }

    public SeriesEndType getEndType() {
        return endType;
    }

    public LocalDate getUntilDate() {
        return untilDate;
    }

    public Integer getOccurrenceCount() {
        return occurrenceCount;
    }

    public LocalDate getAnchorDate() {
        return anchorDate;
    }

    public boolean isActive() {
        return active;
    }

    public List<ScheduleSeriesParticipant> getParticipantLinks() {
        return participantLinks;
    }

    public List<ScheduleSeriesTeam> getTeamLinks() {
        return teamLinks;
    }

    public void updateForAll(String title, LocalTime startTime, LocalTime endTime, Resource resource) {
        this.title = title;
        this.startTime = startTime;
        this.endTime = endTime;
        this.resource = resource;
        this.updatedAt = LocalDateTime.now();
    }

    public void closeBefore(LocalDate date) {
        this.endType = SeriesEndType.UNTIL_DATE;
        this.untilDate = date.minusDays(1);
        this.occurrenceCount = null;
        this.updatedAt = LocalDateTime.now();
    }

    public void deactivate() {
        this.active = false;
        this.updatedAt = LocalDateTime.now();
    }
}
