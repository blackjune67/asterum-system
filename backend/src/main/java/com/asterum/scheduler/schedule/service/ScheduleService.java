package com.asterum.scheduler.schedule.service;

import com.asterum.scheduler.common.exception.BadRequestException;
import com.asterum.scheduler.common.exception.NotFoundException;
import com.asterum.scheduler.participant.domain.Participant;
import com.asterum.scheduler.participant.dto.ParticipantResponse;
import com.asterum.scheduler.participant.repository.ParticipantRepository;
import com.asterum.scheduler.resource.domain.Resource;
import com.asterum.scheduler.resource.dto.ResourceResponse;
import com.asterum.scheduler.resource.repository.ResourceRepository;
import com.asterum.scheduler.schedule.domain.OccurrenceStatus;
import com.asterum.scheduler.schedule.domain.ScheduleOccurrence;
import com.asterum.scheduler.schedule.domain.ScheduleOccurrenceParticipant;
import com.asterum.scheduler.schedule.domain.ScheduleOccurrenceTeam;
import com.asterum.scheduler.schedule.domain.ScheduleSeries;
import com.asterum.scheduler.schedule.domain.ScheduleSeriesParticipant;
import com.asterum.scheduler.schedule.domain.ScheduleSeriesTeam;
import com.asterum.scheduler.schedule.domain.SeriesEndType;
import com.asterum.scheduler.schedule.dto.CreateScheduleRequest;
import com.asterum.scheduler.schedule.dto.RecurrenceRequest;
import com.asterum.scheduler.schedule.dto.ScheduleResponse;
import com.asterum.scheduler.schedule.dto.ScopeType;
import com.asterum.scheduler.schedule.dto.UpdateScheduleRequest;
import com.asterum.scheduler.schedule.repository.ScheduleOccurrenceRepository;
import com.asterum.scheduler.schedule.repository.ScheduleSeriesRepository;
import com.asterum.scheduler.team.domain.Team;
import com.asterum.scheduler.team.dto.TeamResponse;
import com.asterum.scheduler.team.repository.TeamRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ScheduleService {

    private final ParticipantRepository participantRepository;
    private final TeamRepository teamRepository;
    private final ResourceRepository resourceRepository;
    private final ScheduleSeriesRepository scheduleSeriesRepository;
    private final ScheduleOccurrenceRepository scheduleOccurrenceRepository;
    private final RecurrenceGenerator recurrenceGenerator;

    public ScheduleService(
        ParticipantRepository participantRepository,
        TeamRepository teamRepository,
        ResourceRepository resourceRepository,
        ScheduleSeriesRepository scheduleSeriesRepository,
        ScheduleOccurrenceRepository scheduleOccurrenceRepository,
        RecurrenceGenerator recurrenceGenerator
    ) {
        this.participantRepository = participantRepository;
        this.teamRepository = teamRepository;
        this.resourceRepository = resourceRepository;
        this.scheduleSeriesRepository = scheduleSeriesRepository;
        this.scheduleOccurrenceRepository = scheduleOccurrenceRepository;
        this.recurrenceGenerator = recurrenceGenerator;
    }

    public ScheduleResponse create(CreateScheduleRequest request) {
        validateTimeRange(request.startTime(), request.endTime());
        List<Participant> directParticipants = resolveParticipants(request.participantIds());
        List<Team> teams = resolveTeams(request.teamIds());
        Resource resource = lockAndResolveResource(request.resourceId());
        List<Participant> participantSnapshot = buildParticipantSnapshot(directParticipants, teams);
        RecurrenceRequest recurrence = request.recurrence();

        if (recurrence != null && recurrence.enabled()) {
            validateRecurrence(recurrence);
            ScheduleSeries series = createSeries(
                request.title(),
                request.startTime(),
                request.endTime(),
                resource,
                recurrence,
                request.date(),
                participantSnapshot,
                teams
            );

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

            assertNoResourceConflicts(resource, dates, request.startTime(), request.endTime(), Set.of());
            ScheduleOccurrence first = createOccurrences(series, dates, request.title(), request.startTime(), request.endTime(), resource, participantSnapshot, teams, request.date());
            return toResponse(Objects.requireNonNull(first));
        }

        assertNoResourceConflicts(resource, List.of(request.date()), request.startTime(), request.endTime(), Set.of());
        ScheduleOccurrence occurrence = new ScheduleOccurrence(null, request.title(), request.date(), request.startTime(), request.endTime(), resource);
        attachOccurrenceSelections(occurrence, participantSnapshot, teams);
        return toResponse(scheduleOccurrenceRepository.save(occurrence));
    }

    public ScheduleResponse convertToSeries(Long id, RecurrenceRequest recurrence) {
        ScheduleOccurrence occurrence = loadOccurrence(id);
        if (occurrence.getSeries() != null) {
            throw new BadRequestException("Recurring schedules cannot be converted again");
        }
        if (recurrence == null || !recurrence.enabled()) {
            throw new BadRequestException("A recurrence rule is required");
        }

        validateRecurrence(recurrence);

        List<Participant> participantSnapshot = occurrence.getParticipantLinks().stream()
            .map(ScheduleOccurrenceParticipant::getParticipant)
            .sorted(Comparator.comparing(Participant::getId))
            .toList();
        List<Team> teams = occurrence.getTeamLinks().stream()
            .map(ScheduleOccurrenceTeam::getTeam)
            .sorted(Comparator.comparing(Team::getId))
            .toList();
        Resource resource = lockAndResolveResource(occurrence.getResource());

        ScheduleSeries series = createSeries(
            occurrence.getTitle(),
            occurrence.getStartTime(),
            occurrence.getEndTime(),
            resource,
            recurrence,
            occurrence.getOccurrenceDate(),
            participantSnapshot,
            teams
        );

        LocalDate horizonEnd = initialHorizon(occurrence.getOccurrenceDate(), recurrence);
        List<LocalDate> dates = recurrenceGenerator.generateDates(
            occurrence.getOccurrenceDate(),
            recurrence.type(),
            recurrence.interval(),
            recurrence.endType(),
            recurrence.untilDate(),
            recurrence.count(),
            horizonEnd
        );

        assertNoResourceConflicts(resource, dates, occurrence.getStartTime(), occurrence.getEndTime(), Set.of(occurrence.getId()));
        occurrence.cancel();

        ScheduleOccurrence first = createOccurrences(
            series,
            dates,
            occurrence.getTitle(),
            occurrence.getStartTime(),
            occurrence.getEndTime(),
            resource,
            participantSnapshot,
            teams,
            occurrence.getOccurrenceDate()
        );

        return toResponse(Objects.requireNonNull(first));
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
        List<Participant> directParticipants = resolveParticipants(request.participantIds());
        List<Team> teams = resolveTeams(request.teamIds());
        Resource resource = lockAndResolveResource(request.resourceId());
        List<Participant> participantSnapshot = buildParticipantSnapshot(directParticipants, teams);
        LocalDate date = request.date() != null ? request.date() : occurrence.getOccurrenceDate();

        assertNoResourceConflicts(resource, List.of(date), request.startTime(), request.endTime(), Set.of(occurrence.getId()));
        occurrence.updateSingle(request.title(), date, request.startTime(), request.endTime(), resource);
        replaceOccurrenceSelections(occurrence, participantSnapshot, teams);
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

        List<Participant> directParticipants = resolveParticipants(request.participantIds());
        List<Team> teams = resolveTeams(request.teamIds());
        Resource resource = lockAndResolveResource(request.resourceId());
        List<Participant> participantSnapshot = buildParticipantSnapshot(directParticipants, teams);

        ScheduleSeries newSeries = createSeries(
            request.title(),
            request.startTime(),
            request.endTime(),
            resource,
            new RecurrenceRequest(
                true,
                originalSeries.getRecurrenceType(),
                originalSeries.getIntervalValue(),
                originalEndType,
                originalUntilDate,
                remainingOccurrenceCount
            ),
            occurrence.getOccurrenceDate(),
            participantSnapshot,
            teams
        );

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

        assertNoResourceConflicts(
            resource,
            dates,
            request.startTime(),
            request.endTime(),
            futureOccurrences.stream().map(ScheduleOccurrence::getId).collect(java.util.stream.Collectors.toSet())
        );

        originalSeries.closeBefore(occurrence.getOccurrenceDate());
        futureOccurrences.forEach(ScheduleOccurrence::cancel);

        ScheduleOccurrence target = createOccurrences(
            newSeries,
            dates,
            request.title(),
            request.startTime(),
            request.endTime(),
            resource,
            participantSnapshot,
            teams,
            occurrence.getOccurrenceDate()
        );
        return toResponse(Objects.requireNonNull(target));
    }

    private ScheduleResponse updateAll(ScheduleOccurrence occurrence, UpdateScheduleRequest request) {
        if (occurrence.getSeries() == null) {
            return updateThis(occurrence, request);
        }

        ScheduleSeries series = occurrence.getSeries();
        List<Participant> directParticipants = resolveParticipants(request.participantIds());
        List<Team> teams = resolveTeams(request.teamIds());
        Resource resource = lockAndResolveResource(request.resourceId());
        List<Participant> participantSnapshot = buildParticipantSnapshot(directParticipants, teams);
        List<ScheduleOccurrence> targets = scheduleOccurrenceRepository.findBySeriesIdAndStatusOrderByOccurrenceDateAscStartTimeAsc(
                series.getId(),
                OccurrenceStatus.ACTIVE
            ).stream()
            .filter(item -> !item.isException())
            .toList();

        assertNoResourceConflicts(
            resource,
            targets.stream().map(ScheduleOccurrence::getOccurrenceDate).toList(),
            request.startTime(),
            request.endTime(),
            targets.stream().map(ScheduleOccurrence::getId).collect(java.util.stream.Collectors.toSet())
        );

        series.updateForAll(request.title(), request.startTime(), request.endTime(), resource);
        replaceSeriesSelections(series, participantSnapshot, teams);

        targets.forEach(item -> {
            item.updateBasic(request.title(), request.startTime(), request.endTime(), resource);
            replaceOccurrenceSelections(item, participantSnapshot, teams);
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

        List<Participant> participantSnapshot = series.getParticipantLinks().stream()
            .map(ScheduleSeriesParticipant::getParticipant)
            .sorted(Comparator.comparing(Participant::getId))
            .toList();
        List<Team> teams = series.getTeamLinks().stream()
            .map(ScheduleSeriesTeam::getTeam)
            .sorted(Comparator.comparing(Team::getId))
            .toList();
        Resource resource = lockAndResolveResource(series.getResource());
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

        assertNoResourceConflicts(resource, dates, series.getStartTime(), series.getEndTime(), Set.of());
        createOccurrences(series, dates, series.getTitle(), series.getStartTime(), series.getEndTime(), resource, participantSnapshot, teams, nextDate);
    }

    private ScheduleSeries createSeries(
        String title,
        LocalTime startTime,
        LocalTime endTime,
        Resource resource,
        RecurrenceRequest recurrence,
        LocalDate anchorDate,
        List<Participant> participantSnapshot,
        List<Team> teams
    ) {
        ScheduleSeries series = scheduleSeriesRepository.save(new ScheduleSeries(
            title,
            startTime,
            endTime,
            resource,
            recurrence.type(),
            recurrence.interval(),
            recurrence.endType(),
            recurrence.untilDate(),
            recurrence.count(),
            anchorDate
        ));
        attachSeriesSelections(series, participantSnapshot, teams);
        return series;
    }

    private ScheduleOccurrence createOccurrences(
        ScheduleSeries series,
        List<LocalDate> dates,
        String title,
        LocalTime startTime,
        LocalTime endTime,
        Resource resource,
        List<Participant> participantSnapshot,
        List<Team> teams,
        LocalDate targetDate
    ) {
        ScheduleOccurrence target = null;
        for (LocalDate date : dates) {
            if (series != null
                && scheduleOccurrenceRepository.existsBySeriesIdAndOccurrenceDateAndStartTime(series.getId(), date, startTime)) {
                continue;
            }
            ScheduleOccurrence generated = new ScheduleOccurrence(series, title, date, startTime, endTime, resource);
            attachOccurrenceSelections(generated, participantSnapshot, teams);
            ScheduleOccurrence saved = scheduleOccurrenceRepository.save(generated);
            if (target == null || date.equals(targetDate)) {
                target = saved;
            }
        }
        return target;
    }

    private void attachSeriesSelections(ScheduleSeries series, List<Participant> participants, List<Team> teams) {
        participants.forEach(participant -> series.getParticipantLinks().add(new ScheduleSeriesParticipant(series, participant)));
        teams.forEach(team -> series.getTeamLinks().add(new ScheduleSeriesTeam(series, team)));
    }

    private void replaceSeriesSelections(ScheduleSeries series, List<Participant> participants, List<Team> teams) {
        series.getParticipantLinks().clear();
        series.getTeamLinks().clear();
        attachSeriesSelections(series, participants, teams);
    }

    private void attachOccurrenceSelections(ScheduleOccurrence occurrence, List<Participant> participants, List<Team> teams) {
        participants.forEach(participant -> occurrence.getParticipantLinks().add(new ScheduleOccurrenceParticipant(occurrence, participant)));
        teams.forEach(team -> occurrence.getTeamLinks().add(new ScheduleOccurrenceTeam(occurrence, team)));
    }

    private void replaceOccurrenceSelections(ScheduleOccurrence occurrence, List<Participant> participants, List<Team> teams) {
        occurrence.getParticipantLinks().clear();
        occurrence.getTeamLinks().clear();
        attachOccurrenceSelections(occurrence, participants, teams);
    }

    private void assertNoResourceConflicts(
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
            ScheduleOccurrence conflict = scheduleOccurrenceRepository.findByResourceIdAndOccurrenceDateAndStatus(
                    resource.getId(),
                    date,
                    OccurrenceStatus.ACTIVE
                ).stream()
                .filter(item -> !ignoredOccurrenceIds.contains(item.getId()))
                .filter(item -> overlaps(startTime, endTime, item.getStartTime(), item.getEndTime()))
                .findFirst()
                .orElse(null);

            if (conflict != null) {
                throw new BadRequestException(
                    "Resource collision: %s is already booked on %s %s-%s".formatted(
                        resource.getName(),
                        date,
                        conflict.getStartTime(),
                        conflict.getEndTime()
                    )
                );
            }
        }
    }

    private boolean overlaps(LocalTime startTime, LocalTime endTime, LocalTime otherStart, LocalTime otherEnd) {
        return startTime.isBefore(otherEnd) && otherStart.isBefore(endTime);
    }

    private ScheduleOccurrence loadOccurrence(Long id) {
        return scheduleOccurrenceRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Schedule occurrence %d not found".formatted(id)));
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

    private List<Team> resolveTeams(List<Long> teamIds) {
        List<Long> safeIds = teamIds == null ? List.of() : teamIds;
        List<Team> teams = new ArrayList<>(teamRepository.findAllById(safeIds));
        if (teams.size() != safeIds.stream().distinct().count()) {
            throw new BadRequestException("Some teams do not exist");
        }
        teams.sort(Comparator.comparing(Team::getId));
        return teams;
    }

    private Resource lockAndResolveResource(Long resourceId) {
        if (resourceId == null) {
            return null;
        }
        return resourceRepository.findByIdForUpdate(resourceId)
            .orElseThrow(() -> new BadRequestException("Resource does not exist"));
    }

    private Resource lockAndResolveResource(Resource resource) {
        if (resource == null) {
            return null;
        }
        return lockAndResolveResource(resource.getId());
    }

    private List<Participant> buildParticipantSnapshot(List<Participant> participants, List<Team> teams) {
        LinkedHashMap<Long, Participant> snapshot = new LinkedHashMap<>();
        participants.forEach(participant -> snapshot.put(participant.getId(), participant));
        teams.stream()
            .flatMap(team -> team.getMembers().stream())
            .map(member -> member.getParticipant())
            .forEach(participant -> snapshot.putIfAbsent(participant.getId(), participant));
        return snapshot.values().stream()
            .sorted(Comparator.comparing(Participant::getId))
            .toList();
    }

    private void validateTimeRange(LocalTime startTime, LocalTime endTime) {
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

        List<TeamResponse> teams = occurrence.getTeamLinks().stream()
            .map(ScheduleOccurrenceTeam::getTeam)
            .sorted(Comparator.comparing(Team::getId))
            .map(team -> {
                List<ParticipantResponse> members = team.getMembers().stream()
                    .map(member -> member.getParticipant())
                    .sorted(Comparator.comparing(Participant::getId))
                    .map(participant -> new ParticipantResponse(participant.getId(), participant.getName(), participant.getType()))
                    .toList();
                return new TeamResponse(
                    team.getId(),
                    team.getName(),
                    members.stream().map(ParticipantResponse::id).toList(),
                    members
                );
            })
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

        ResourceResponse resource = occurrence.getResource() == null
            ? null
            : new ResourceResponse(
                occurrence.getResource().getId(),
                occurrence.getResource().getName(),
                occurrence.getResource().getCategory()
            );

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
            teams.stream().map(TeamResponse::id).toList(),
            teams,
            resource,
            recurrence
        );
    }
}
