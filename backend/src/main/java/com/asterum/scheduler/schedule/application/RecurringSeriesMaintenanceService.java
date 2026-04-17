package com.asterum.scheduler.schedule.application;

import com.asterum.scheduler.participant.domain.Participant;
import com.asterum.scheduler.resource.domain.Resource;
import com.asterum.scheduler.schedule.domain.OccurrenceStatus;
import com.asterum.scheduler.schedule.domain.RecurrenceSpec;
import com.asterum.scheduler.schedule.domain.ResourceConflictPolicy;
import com.asterum.scheduler.schedule.domain.ScheduleOccurrence;
import com.asterum.scheduler.schedule.domain.ScheduleOccurrenceParticipant;
import com.asterum.scheduler.schedule.domain.ScheduleOccurrenceTeam;
import com.asterum.scheduler.schedule.domain.ScheduleSeries;
import com.asterum.scheduler.schedule.domain.ScheduleSeriesParticipant;
import com.asterum.scheduler.schedule.domain.ScheduleSeriesTeam;
import com.asterum.scheduler.schedule.domain.SelectionSnapshot;
import com.asterum.scheduler.schedule.infrastructure.persistence.ScheduleOccurrenceRepository;
import com.asterum.scheduler.schedule.domain.RecurrenceGenerator;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class RecurringSeriesMaintenanceService {

    private final ScheduleOccurrenceRepository scheduleOccurrenceRepository;
    private final RecurrenceGenerator recurrenceGenerator;
    private final ResourceConflictPolicy resourceConflictPolicy;

    public RecurringSeriesMaintenanceService(
        ScheduleOccurrenceRepository scheduleOccurrenceRepository,
        RecurrenceGenerator recurrenceGenerator,
        ResourceConflictPolicy resourceConflictPolicy
    ) {
        this.scheduleOccurrenceRepository = scheduleOccurrenceRepository;
        this.recurrenceGenerator = recurrenceGenerator;
        this.resourceConflictPolicy = resourceConflictPolicy;
    }

    public ScheduleOccurrence materializeOccurrences(
        ScheduleSeries series,
        RecurrenceSpec recurrenceSpec,
        String title,
        LocalTime startTime,
        LocalTime endTime,
        Resource resource,
        SelectionSnapshot selectionSnapshot,
        LocalDate anchorDate,
        LocalDate horizonEnd,
        LocalDate targetDate,
        Set<Long> ignoredOccurrenceIds
    ) {
        List<LocalDate> dates = recurrenceGenerator.generateDates(
            anchorDate,
            recurrenceSpec.type(),
            recurrenceSpec.interval(),
            recurrenceSpec.endType(),
            recurrenceSpec.untilDate(),
            recurrenceSpec.count(),
            horizonEnd
        );

        assertNoResourceConflicts(resource, dates, startTime, endTime, ignoredOccurrenceIds);
        return createOccurrences(series, dates, title, startTime, endTime, resource, selectionSnapshot, targetDate);
    }

    public void assertNoResourceConflicts(
        Resource resource,
        Collection<LocalDate> dates,
        LocalTime startTime,
        LocalTime endTime,
        Set<Long> ignoredOccurrenceIds
    ) {
        if (resource == null) {
            return;
        }

        for (LocalDate date : new LinkedHashSet<>(dates)) {
            resourceConflictPolicy.assertNoConflict(
                resource,
                date,
                startTime,
                endTime,
                ignoredOccurrenceIds,
                scheduleOccurrenceRepository.findByResourceIdAndOccurrenceDateAndStatus(
                    resource.getId(),
                    date,
                    OccurrenceStatus.ACTIVE
                )
            );
        }
    }

    public void attachSeriesSelections(ScheduleSeries series, SelectionSnapshot selectionSnapshot) {
        selectionSnapshot.participants()
            .forEach(participant -> series.getParticipantLinks().add(new ScheduleSeriesParticipant(series, participant)));
        selectionSnapshot.teams()
            .forEach(team -> series.getTeamLinks().add(new ScheduleSeriesTeam(series, team)));
    }

    public void replaceSeriesSelections(ScheduleSeries series, SelectionSnapshot selectionSnapshot) {
        series.getParticipantLinks().clear();
        series.getTeamLinks().clear();
        attachSeriesSelections(series, selectionSnapshot);
    }

    public void attachOccurrenceSelections(ScheduleOccurrence occurrence, SelectionSnapshot selectionSnapshot) {
        selectionSnapshot.participants()
            .forEach(participant -> occurrence.getParticipantLinks().add(new ScheduleOccurrenceParticipant(occurrence, participant)));
        selectionSnapshot.teams()
            .forEach(team -> occurrence.getTeamLinks().add(new ScheduleOccurrenceTeam(occurrence, team)));
    }

    public void replaceOccurrenceSelections(ScheduleOccurrence occurrence, SelectionSnapshot selectionSnapshot) {
        occurrence.getParticipantLinks().clear();
        occurrence.getTeamLinks().clear();
        attachOccurrenceSelections(occurrence, selectionSnapshot);
    }

    public SelectionSnapshot snapshotFromSeries(ScheduleSeries series) {
        return new SelectionSnapshot(
            series.getParticipantLinks().stream()
                .map(ScheduleSeriesParticipant::getParticipant)
                .sorted(java.util.Comparator.comparing(Participant::getId))
                .toList(),
            series.getTeamLinks().stream()
                .map(ScheduleSeriesTeam::getTeam)
                .sorted(java.util.Comparator.comparing(team -> team.getId()))
                .toList()
        );
    }

    public SelectionSnapshot snapshotFromOccurrence(ScheduleOccurrence occurrence) {
        return new SelectionSnapshot(
            occurrence.getParticipantLinks().stream()
                .map(ScheduleOccurrenceParticipant::getParticipant)
                .sorted(java.util.Comparator.comparing(Participant::getId))
                .toList(),
            occurrence.getTeamLinks().stream()
                .map(ScheduleOccurrenceTeam::getTeam)
                .sorted(java.util.Comparator.comparing(team -> team.getId()))
                .toList()
        );
    }

    private ScheduleOccurrence createOccurrences(
        ScheduleSeries series,
        List<LocalDate> dates,
        String title,
        LocalTime startTime,
        LocalTime endTime,
        Resource resource,
        SelectionSnapshot selectionSnapshot,
        LocalDate targetDate
    ) {
        ScheduleOccurrence target = null;
        for (LocalDate date : dates) {
            if (series != null
                && scheduleOccurrenceRepository.existsBySeriesIdAndOccurrenceDateAndStartTime(series.getId(), date, startTime)) {
                continue;
            }
            ScheduleOccurrence generated = new ScheduleOccurrence(series, title, date, startTime, endTime, resource);
            attachOccurrenceSelections(generated, selectionSnapshot);
            ScheduleOccurrence saved = scheduleOccurrenceRepository.save(generated);
            if (target == null || date.equals(targetDate)) {
                target = saved;
            }
        }
        return target;
    }

}
