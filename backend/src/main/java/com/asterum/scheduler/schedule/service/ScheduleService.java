package com.asterum.scheduler.schedule.service;

import com.asterum.scheduler.common.exception.BadRequestException;
import com.asterum.scheduler.common.exception.NotFoundException;
import com.asterum.scheduler.participant.domain.Participant;
import com.asterum.scheduler.participant.dto.ParticipantResponse;
import com.asterum.scheduler.participant.repository.ParticipantRepository;
import com.asterum.scheduler.schedule.domain.OccurrenceStatus;
import com.asterum.scheduler.schedule.domain.ScheduleOccurrence;
import com.asterum.scheduler.schedule.domain.ScheduleOccurrenceParticipant;
import com.asterum.scheduler.schedule.domain.ScheduleSeries;
import com.asterum.scheduler.schedule.domain.SeriesEndType;
import com.asterum.scheduler.schedule.dto.CreateScheduleRequest;
import com.asterum.scheduler.schedule.dto.RecurrenceRequest;
import com.asterum.scheduler.schedule.dto.ScheduleResponse;
import com.asterum.scheduler.schedule.dto.ScopeType;
import com.asterum.scheduler.schedule.dto.UpdateScheduleRequest;
import com.asterum.scheduler.schedule.repository.ScheduleOccurrenceRepository;
import com.asterum.scheduler.schedule.repository.ScheduleSeriesRepository;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ScheduleService {

    private final ParticipantRepository participantRepository;
    private final ScheduleSeriesRepository scheduleSeriesRepository;
    private final ScheduleOccurrenceRepository scheduleOccurrenceRepository;
    private final RecurrenceGenerator recurrenceGenerator;

    public ScheduleService(
        ParticipantRepository participantRepository,
        ScheduleSeriesRepository scheduleSeriesRepository,
        ScheduleOccurrenceRepository scheduleOccurrenceRepository,
        RecurrenceGenerator recurrenceGenerator
    ) {
        this.participantRepository = participantRepository;
        this.scheduleSeriesRepository = scheduleSeriesRepository;
        this.scheduleOccurrenceRepository = scheduleOccurrenceRepository;
        this.recurrenceGenerator = recurrenceGenerator;
    }

    public ScheduleResponse create(CreateScheduleRequest request) {
        validateTimeRange(request.startTime(), request.endTime());
        List<Participant> participants = resolveParticipants(request.participantIds());
        RecurrenceRequest recurrence = request.recurrence();

        if (recurrence != null && recurrence.enabled()) {
            validateRecurrence(recurrence);
            ScheduleSeries series = scheduleSeriesRepository.save(new ScheduleSeries(
                request.title(),
                request.startTime(),
                request.endTime(),
                recurrence.type(),
                recurrence.interval(),
                recurrence.endType(),
                recurrence.untilDate(),
                recurrence.count(),
                request.date()
            ));

            LocalDate horizonEnd = initialHorizon(request.date(), recurrence);
            List<LocalDate> dates = recurrenceGenerator.generateDates(
                request.date(),
                recurrence.type(),
                recurrence.interval(),
                recurrence.endType(),
                recurrence.untilDate(),
                recurrence.count(),
                horizonEnd
            );

            ScheduleOccurrence first = null;
            for (LocalDate date : dates) {
                ScheduleOccurrence occurrence = new ScheduleOccurrence(series, request.title(), date, request.startTime(), request.endTime());
                attachParticipants(occurrence, participants);
                ScheduleOccurrence saved = scheduleOccurrenceRepository.save(occurrence);
                if (first == null) {
                    first = saved;
                }
            }
            return toResponse(Objects.requireNonNull(first));
        }

        ScheduleOccurrence occurrence = new ScheduleOccurrence(null, request.title(), request.date(), request.startTime(), request.endTime());
        attachParticipants(occurrence, participants);
        return toResponse(scheduleOccurrenceRepository.save(occurrence));
    }

    @Transactional(readOnly = true)
    public ScheduleResponse get(Long id) {
        return toResponse(loadOccurrence(id));
    }

    public List<ScheduleResponse> listMonth(int year, int month) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());

        scheduleSeriesRepository.findByActiveTrueAndEndType(SeriesEndType.NEVER)
            .forEach(series -> ensureHorizon(series, end));

        return scheduleOccurrenceRepository.findByOccurrenceDateBetweenAndStatusOrderByOccurrenceDateAscStartTimeAsc(
                start,
                end,
                OccurrenceStatus.ACTIVE
            ).stream()
            .map(this::toResponse)
            .toList();
    }

    public ScheduleResponse update(Long id, ScopeType scope, UpdateScheduleRequest request) {
        validateTimeRange(request.startTime(), request.endTime());
        ScheduleOccurrence occurrence = loadOccurrence(id);
        return switch (scope) {
            case THIS -> updateThis(occurrence, request);
            case FOLLOWING -> updateFollowing(occurrence, request);
            case ALL -> updateAll(occurrence, request);
        };
    }

    public void delete(Long id, ScopeType scope) {
        ScheduleOccurrence occurrence = loadOccurrence(id);
        switch (scope) {
            case THIS -> occurrence.cancel();
            case FOLLOWING -> deleteFollowing(occurrence);
            case ALL -> deleteAll(occurrence);
        }
    }

    private ScheduleResponse updateThis(ScheduleOccurrence occurrence, UpdateScheduleRequest request) {
        List<Participant> participants = resolveParticipants(request.participantIds());
        LocalDate date = request.date() != null ? request.date() : occurrence.getOccurrenceDate();
        occurrence.updateSingle(request.title(), date, request.startTime(), request.endTime());
        replaceParticipants(occurrence, participants);
        return toResponse(occurrence);
    }

    private ScheduleResponse updateFollowing(ScheduleOccurrence occurrence, UpdateScheduleRequest request) {
        if (occurrence.getSeries() == null) {
            return updateThis(occurrence, request);
        }

        ScheduleSeries originalSeries = occurrence.getSeries();
        List<ScheduleOccurrence> futureOccurrences = scheduleOccurrenceRepository
            .findBySeriesIdAndStatusOrderByOccurrenceDateAscStartTimeAsc(originalSeries.getId(), OccurrenceStatus.ACTIVE)
            .stream()
            .filter(item -> !item.getOccurrenceDate().isBefore(occurrence.getOccurrenceDate()))
            .toList();

        SeriesEndType originalEndType = originalSeries.getEndType();
        LocalDate originalUntilDate = originalSeries.getUntilDate();
        Integer remainingOccurrenceCount = originalEndType == SeriesEndType.COUNT
            ? futureOccurrences.size()
            : originalSeries.getOccurrenceCount();

        originalSeries.closeBefore(occurrence.getOccurrenceDate());
        futureOccurrences.forEach(ScheduleOccurrence::cancel);

        List<Participant> participants = resolveParticipants(request.participantIds());
        ScheduleSeries newSeries = scheduleSeriesRepository.save(new ScheduleSeries(
            request.title(),
            request.startTime(),
            request.endTime(),
            originalSeries.getRecurrenceType(),
            originalSeries.getIntervalValue(),
            originalEndType,
            originalUntilDate,
            remainingOccurrenceCount,
            occurrence.getOccurrenceDate()
        ));

        LocalDate horizonEnd = switch (newSeries.getEndType()) {
            case NEVER -> occurrence.getOccurrenceDate().plusMonths(6);
            case UNTIL_DATE -> newSeries.getUntilDate();
            case COUNT -> futureOccurrences.isEmpty()
                ? occurrence.getOccurrenceDate()
                : futureOccurrences.get(futureOccurrences.size() - 1).getOccurrenceDate();
        };

        List<LocalDate> dates = recurrenceGenerator.generateDates(
            newSeries.getAnchorDate(),
            newSeries.getRecurrenceType(),
            newSeries.getIntervalValue(),
            newSeries.getEndType(),
            newSeries.getUntilDate(),
            newSeries.getOccurrenceCount(),
            horizonEnd
        );

        ScheduleOccurrence target = null;
        for (LocalDate date : dates) {
            ScheduleOccurrence generated = new ScheduleOccurrence(newSeries, request.title(), date, request.startTime(), request.endTime());
            attachParticipants(generated, participants);
            ScheduleOccurrence saved = scheduleOccurrenceRepository.save(generated);
            if (date.equals(occurrence.getOccurrenceDate())) {
                target = saved;
            }
        }
        return toResponse(Objects.requireNonNull(target));
    }

    private ScheduleResponse updateAll(ScheduleOccurrence occurrence, UpdateScheduleRequest request) {
        if (occurrence.getSeries() == null) {
            return updateThis(occurrence, request);
        }

        ScheduleSeries series = occurrence.getSeries();
        List<Participant> participants = resolveParticipants(request.participantIds());
        series.updateForAll(request.title(), request.startTime(), request.endTime());

        scheduleOccurrenceRepository.findBySeriesIdAndStatusOrderByOccurrenceDateAscStartTimeAsc(series.getId(), OccurrenceStatus.ACTIVE)
            .stream()
            .filter(item -> !item.isException())
            .forEach(item -> {
                item.updateBasic(request.title(), request.startTime(), request.endTime());
                replaceParticipants(item, participants);
            });

        return toResponse(loadOccurrence(occurrence.getId()));
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

    private void ensureHorizon(ScheduleSeries series, LocalDate horizonEnd) {
        ScheduleOccurrence last = scheduleOccurrenceRepository.findTopBySeriesIdOrderByOccurrenceDateDescStartTimeDesc(series.getId());
        if (last == null || !last.getOccurrenceDate().isBefore(horizonEnd)) {
            return;
        }

        List<Participant> participants = last.getParticipantLinks().stream()
            .map(ScheduleOccurrenceParticipant::getParticipant)
            .toList();
        LocalDate nextDate = recurrenceGenerator.nextDate(last.getOccurrenceDate(), series.getRecurrenceType(), series.getIntervalValue());

        List<LocalDate> dates = recurrenceGenerator.generateDates(
            nextDate,
            series.getRecurrenceType(),
            series.getIntervalValue(),
            series.getEndType(),
            series.getUntilDate(),
            null,
            horizonEnd
        );

        for (LocalDate date : dates) {
            if (!scheduleOccurrenceRepository.existsBySeriesIdAndOccurrenceDateAndStartTime(series.getId(), date, series.getStartTime())) {
                ScheduleOccurrence generated = new ScheduleOccurrence(series, series.getTitle(), date, series.getStartTime(), series.getEndTime());
                attachParticipants(generated, participants);
                scheduleOccurrenceRepository.save(generated);
            }
        }
    }

    private ScheduleOccurrence loadOccurrence(Long id) {
        return scheduleOccurrenceRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Schedule occurrence %d not found".formatted(id)));
    }

    private void attachParticipants(ScheduleOccurrence occurrence, List<Participant> participants) {
        participants.forEach(participant -> occurrence.getParticipantLinks().add(new ScheduleOccurrenceParticipant(occurrence, participant)));
    }

    private void replaceParticipants(ScheduleOccurrence occurrence, List<Participant> participants) {
        occurrence.getParticipantLinks().clear();
        attachParticipants(occurrence, participants);
    }

    private List<Participant> resolveParticipants(List<Long> participantIds) {
        List<Long> safeIds = participantIds == null ? List.of() : participantIds;
        List<Participant> participants = new ArrayList<>(participantRepository.findAllById(safeIds));
        if (participants.size() != safeIds.stream().distinct().count()) {
            throw new BadRequestException("Some participants do not exist");
        }
        participants.sort(Comparator.comparing(Participant::getId));
        return participants;
    }

    private void validateTimeRange(java.time.LocalTime startTime, java.time.LocalTime endTime) {
        if (!startTime.isBefore(endTime)) {
            throw new BadRequestException("startTime must be before endTime");
        }
    }

    private void validateRecurrence(RecurrenceRequest recurrence) {
        if (recurrence.type() == null || recurrence.interval() == null || recurrence.interval() < 1 || recurrence.endType() == null) {
            throw new BadRequestException("Invalid recurrence request");
        }
        if (recurrence.endType() == SeriesEndType.UNTIL_DATE && recurrence.untilDate() == null) {
            throw new BadRequestException("untilDate is required for UNTIL_DATE");
        }
        if (recurrence.endType() == SeriesEndType.COUNT && (recurrence.count() == null || recurrence.count() < 1)) {
            throw new BadRequestException("count is required for COUNT");
        }
    }

    private LocalDate initialHorizon(LocalDate anchorDate, RecurrenceRequest recurrence) {
        return switch (recurrence.endType()) {
            case NEVER -> anchorDate.plusMonths(6);
            case UNTIL_DATE -> recurrence.untilDate();
            case COUNT -> anchorDate.plusYears(2);
        };
    }

    private ScheduleResponse toResponse(ScheduleOccurrence occurrence) {
        List<ParticipantResponse> participants = occurrence.getParticipantLinks().stream()
            .map(ScheduleOccurrenceParticipant::getParticipant)
            .sorted(Comparator.comparing(Participant::getId))
            .map(participant -> new ParticipantResponse(participant.getId(), participant.getName(), participant.getType()))
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
            recurrence
        );
    }
}
