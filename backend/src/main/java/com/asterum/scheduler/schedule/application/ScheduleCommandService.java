package com.asterum.scheduler.schedule.application;

import com.asterum.scheduler.common.exception.BadRequestException;
import com.asterum.scheduler.common.exception.ErrorCode;
import com.asterum.scheduler.common.exception.NotFoundException;
import com.asterum.scheduler.resource.domain.Resource;
import com.asterum.scheduler.schedule.application.command.CreateScheduleCommand;
import com.asterum.scheduler.schedule.application.command.RecurrenceCommand;
import com.asterum.scheduler.schedule.application.command.ScheduleScope;
import com.asterum.scheduler.schedule.application.command.UpdateScheduleCommand;
import com.asterum.scheduler.schedule.domain.OccurrenceStatus;
import com.asterum.scheduler.schedule.domain.RecurrenceSpec;
import com.asterum.scheduler.schedule.domain.ScheduleOccurrence;
import com.asterum.scheduler.schedule.domain.ScheduleSeries;
import com.asterum.scheduler.schedule.domain.SelectionSnapshot;
import com.asterum.scheduler.schedule.domain.SeriesEndType;
import com.asterum.scheduler.schedule.infrastructure.persistence.ScheduleOccurrenceRepository;
import com.asterum.scheduler.schedule.infrastructure.persistence.ScheduleSeriesRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ScheduleCommandService {

    private final ScheduleOccurrenceRepository scheduleOccurrenceRepository;
    private final ScheduleSeriesRepository scheduleSeriesRepository;
    private final SelectionSnapshotResolver selectionSnapshotResolver;
    private final RecurringSeriesMaintenanceService recurringSeriesMaintenanceService;
    private final ScheduleOccurrenceViewInitializer scheduleOccurrenceViewInitializer;

    public ScheduleCommandService(
        ScheduleOccurrenceRepository scheduleOccurrenceRepository,
        ScheduleSeriesRepository scheduleSeriesRepository,
        SelectionSnapshotResolver selectionSnapshotResolver,
        RecurringSeriesMaintenanceService recurringSeriesMaintenanceService,
        ScheduleOccurrenceViewInitializer scheduleOccurrenceViewInitializer
    ) {
        this.scheduleOccurrenceRepository = scheduleOccurrenceRepository;
        this.scheduleSeriesRepository = scheduleSeriesRepository;
        this.selectionSnapshotResolver = selectionSnapshotResolver;
        this.recurringSeriesMaintenanceService = recurringSeriesMaintenanceService;
        this.scheduleOccurrenceViewInitializer = scheduleOccurrenceViewInitializer;
    }

    public ScheduleOccurrence create(CreateScheduleCommand command) {
        SelectionSnapshot selectionSnapshot = selectionSnapshotResolver.resolve(command.participantIds(), command.teamIds());
        Resource resource = selectionSnapshotResolver.lockAndResolveResource(command.resourceId());
        RecurrenceSpec recurrenceSpec = toRecurrenceSpec(command.recurrence());

        if (recurrenceSpec != null) {
            recurrenceSpec.validate();
            ScheduleSeries series = createSeries(
                command.title(),
                command.startTime(),
                command.endTime(),
                resource,
                recurrenceSpec,
                command.date(),
                selectionSnapshot
            );

            ScheduleOccurrence first = recurringSeriesMaintenanceService.materializeOccurrences(
                series,
                recurrenceSpec,
                command.title(),
                command.startTime(),
                command.endTime(),
                resource,
                selectionSnapshot,
                command.date(),
                recurrenceSpec.initialHorizon(command.date()),
                command.date(),
                Set.of()
            );
            return scheduleOccurrenceViewInitializer.initialize(Objects.requireNonNull(first));
        }

        recurringSeriesMaintenanceService.assertNoResourceConflicts(
            resource,
            Set.of(command.date()),
            command.startTime(),
            command.endTime(),
            Set.of()
        );

        ScheduleOccurrence occurrence = new ScheduleOccurrence(
            null,
            command.title(),
            command.date(),
            command.startTime(),
            command.endTime(),
            resource
        );
        recurringSeriesMaintenanceService.attachOccurrenceSelections(occurrence, selectionSnapshot);
        return scheduleOccurrenceViewInitializer.initialize(scheduleOccurrenceRepository.save(occurrence));
    }

    public ScheduleOccurrence convertToSeries(Long id, RecurrenceCommand recurrence) {
        ScheduleOccurrence occurrence = loadOccurrence(id);
        if (occurrence.getSeries() != null) {
            throw new BadRequestException(ErrorCode.RECURRING_SCHEDULE_ALREADY_CONVERTED);
        }

        RecurrenceSpec recurrenceSpec = toRecurrenceSpec(recurrence);
        if (recurrenceSpec == null) {
            throw new BadRequestException(ErrorCode.RECURRENCE_RULE_REQUIRED);
        }
        recurrenceSpec.validate();

        SelectionSnapshot selectionSnapshot = recurringSeriesMaintenanceService.snapshotFromOccurrence(occurrence);
        Resource resource = selectionSnapshotResolver.lockAndResolveResource(occurrence.getResource());

        ScheduleSeries series = createSeries(
            occurrence.getTitle(),
            occurrence.getStartTime(),
            occurrence.getEndTime(),
            resource,
            recurrenceSpec,
            occurrence.getOccurrenceDate(),
            selectionSnapshot
        );

        occurrence.cancel();

        ScheduleOccurrence first = recurringSeriesMaintenanceService.materializeOccurrences(
            series,
            recurrenceSpec,
            occurrence.getTitle(),
            occurrence.getStartTime(),
            occurrence.getEndTime(),
            resource,
            selectionSnapshot,
            occurrence.getOccurrenceDate(),
            recurrenceSpec.initialHorizon(occurrence.getOccurrenceDate()),
            occurrence.getOccurrenceDate(),
            Set.of(occurrence.getId())
        );
        return scheduleOccurrenceViewInitializer.initialize(Objects.requireNonNull(first));
    }

    public ScheduleOccurrence update(Long id, ScheduleScope scope, UpdateScheduleCommand command) {
        ScheduleOccurrence occurrence = loadOccurrence(id);
        return switch (scope) {
            case THIS -> updateThis(occurrence, command);
            case FOLLOWING -> updateFollowing(occurrence, command);
            case ALL -> updateAll(occurrence, command);
        };
    }

    public void delete(Long id, ScheduleScope scope) {
        ScheduleOccurrence occurrence = loadOccurrence(id);
        switch (scope) {
            case THIS -> occurrence.cancel();
            case FOLLOWING -> deleteFollowing(occurrence);
            case ALL -> deleteAll(occurrence);
        }
    }

    private ScheduleOccurrence updateThis(ScheduleOccurrence occurrence, UpdateScheduleCommand command) {
        SelectionSnapshot selectionSnapshot = selectionSnapshotResolver.resolve(command.participantIds(), command.teamIds());
        Resource resource = selectionSnapshotResolver.lockAndResolveResource(command.resourceId());
        LocalDate date = command.date() != null ? command.date() : occurrence.getOccurrenceDate();

        recurringSeriesMaintenanceService.assertNoResourceConflicts(
            resource,
            Set.of(date),
            command.startTime(),
            command.endTime(),
            Set.of(occurrence.getId())
        );

        occurrence.updateSingle(command.title(), date, command.startTime(), command.endTime(), resource);
        recurringSeriesMaintenanceService.replaceOccurrenceSelections(occurrence, selectionSnapshot);
        return scheduleOccurrenceViewInitializer.initialize(occurrence);
    }

    private ScheduleOccurrence updateFollowing(ScheduleOccurrence occurrence, UpdateScheduleCommand command) {
        if (occurrence.getSeries() == null) {
            return updateThis(occurrence, command);
        }

        ScheduleSeries originalSeries = occurrence.getSeries();
        List<ScheduleOccurrence> futureOccurrences = scheduleOccurrenceRepository
            .findBySeriesIdAndStatusOrderByOccurrenceDateAscStartTimeAsc(originalSeries.getId(), OccurrenceStatus.ACTIVE)
            .stream()
            .filter(item -> !item.getOccurrenceDate().isBefore(occurrence.getOccurrenceDate()))
            .toList();

        Integer remainingOccurrenceCount = originalSeries.getEndType() == SeriesEndType.COUNT
            ? futureOccurrences.size()
            : originalSeries.getOccurrenceCount();
        RecurrenceSpec recurrenceSpec = new RecurrenceSpec(
            originalSeries.getRecurrenceType(),
            originalSeries.getIntervalValue(),
            originalSeries.getEndType(),
            originalSeries.getUntilDate(),
            remainingOccurrenceCount
        );

        SelectionSnapshot selectionSnapshot = selectionSnapshotResolver.resolve(command.participantIds(), command.teamIds());
        Resource resource = selectionSnapshotResolver.lockAndResolveResource(command.resourceId());

        ScheduleSeries newSeries = createSeries(
            command.title(),
            command.startTime(),
            command.endTime(),
            resource,
            recurrenceSpec,
            occurrence.getOccurrenceDate(),
            selectionSnapshot
        );

        LocalDate horizonEnd = switch (newSeries.getEndType()) {
            case NEVER -> recurrenceSpec.initialHorizon(occurrence.getOccurrenceDate());
            case UNTIL_DATE -> newSeries.getUntilDate();
            case COUNT -> futureOccurrences.isEmpty()
                ? occurrence.getOccurrenceDate()
                : futureOccurrences.get(futureOccurrences.size() - 1).getOccurrenceDate();
        };

        originalSeries.closeBefore(occurrence.getOccurrenceDate());
        futureOccurrences.forEach(ScheduleOccurrence::cancel);

        ScheduleOccurrence target = recurringSeriesMaintenanceService.materializeOccurrences(
            newSeries,
            recurrenceSpec,
            command.title(),
            command.startTime(),
            command.endTime(),
            resource,
            selectionSnapshot,
            occurrence.getOccurrenceDate(),
            horizonEnd,
            occurrence.getOccurrenceDate(),
            futureOccurrences.stream().map(ScheduleOccurrence::getId).collect(java.util.stream.Collectors.toSet())
        );
        return scheduleOccurrenceViewInitializer.initialize(Objects.requireNonNull(target));
    }

    private ScheduleOccurrence updateAll(ScheduleOccurrence occurrence, UpdateScheduleCommand command) {
        if (occurrence.getSeries() == null) {
            return updateThis(occurrence, command);
        }

        ScheduleSeries series = occurrence.getSeries();
        SelectionSnapshot selectionSnapshot = selectionSnapshotResolver.resolve(command.participantIds(), command.teamIds());
        Resource resource = selectionSnapshotResolver.lockAndResolveResource(command.resourceId());
        List<ScheduleOccurrence> targets = scheduleOccurrenceRepository.findBySeriesIdAndStatusOrderByOccurrenceDateAscStartTimeAsc(
                series.getId(),
                OccurrenceStatus.ACTIVE
            ).stream()
            .filter(item -> !item.isException())
            .toList();

        recurringSeriesMaintenanceService.assertNoResourceConflicts(
            resource,
            targets.stream().map(ScheduleOccurrence::getOccurrenceDate).toList(),
            command.startTime(),
            command.endTime(),
            targets.stream().map(ScheduleOccurrence::getId).collect(java.util.stream.Collectors.toSet())
        );

        series.updateForAll(command.title(), command.startTime(), command.endTime(), resource);
        recurringSeriesMaintenanceService.replaceSeriesSelections(series, selectionSnapshot);
        targets.forEach(item -> {
            item.updateBasic(command.title(), command.startTime(), command.endTime(), resource);
            recurringSeriesMaintenanceService.replaceOccurrenceSelections(item, selectionSnapshot);
        });

        return loadOccurrence(occurrence.getId());
    }

    private void deleteFollowing(ScheduleOccurrence occurrence) {
        if (occurrence.getSeries() == null) {
            occurrence.cancel();
            return;
        }

        ScheduleSeries series = occurrence.getSeries();
        series.closeBefore(occurrence.getOccurrenceDate());
        scheduleOccurrenceRepository.findBySeriesIdAndStatusOrderByOccurrenceDateAscStartTimeAsc(series.getId(), OccurrenceStatus.ACTIVE)
            .stream()
            .filter(item -> !item.getOccurrenceDate().isBefore(occurrence.getOccurrenceDate()))
            .forEach(ScheduleOccurrence::cancel);
    }

    private void deleteAll(ScheduleOccurrence occurrence) {
        if (occurrence.getSeries() == null) {
            occurrence.cancel();
            return;
        }

        ScheduleSeries series = occurrence.getSeries();
        series.deactivate();
        scheduleOccurrenceRepository.findBySeriesIdAndStatusOrderByOccurrenceDateAscStartTimeAsc(series.getId(), OccurrenceStatus.ACTIVE)
            .forEach(ScheduleOccurrence::cancel);
    }

    private ScheduleSeries createSeries(
        String title,
        java.time.LocalTime startTime,
        java.time.LocalTime endTime,
        Resource resource,
        RecurrenceSpec recurrenceSpec,
        java.time.LocalDate anchorDate,
        SelectionSnapshot selectionSnapshot
    ) {
        ScheduleSeries series = scheduleSeriesRepository.save(new ScheduleSeries(
            title,
            startTime,
            endTime,
            resource,
            recurrenceSpec.type(),
            recurrenceSpec.interval(),
            recurrenceSpec.endType(),
            recurrenceSpec.untilDate(),
            recurrenceSpec.count(),
            anchorDate
        ));
        recurringSeriesMaintenanceService.attachSeriesSelections(series, selectionSnapshot);
        return series;
    }

    private ScheduleOccurrence loadOccurrence(Long id) {
        return scheduleOccurrenceViewInitializer.initialize(
            scheduleOccurrenceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(ErrorCode.SCHEDULE_OCCURRENCE_NOT_FOUND, id))
        );
    }

    private RecurrenceSpec toRecurrenceSpec(RecurrenceCommand recurrence) {
        if (recurrence == null || !recurrence.enabled()) {
            return null;
        }
        return new RecurrenceSpec(
            recurrence.type(),
            recurrence.interval(),
            recurrence.endType(),
            recurrence.untilDate(),
            recurrence.count()
        );
    }
}
