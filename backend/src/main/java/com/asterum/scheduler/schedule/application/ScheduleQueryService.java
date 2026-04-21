package com.asterum.scheduler.schedule.application;

import com.asterum.scheduler.common.exception.ErrorCode;
import com.asterum.scheduler.common.exception.NotFoundException;
import com.asterum.scheduler.schedule.domain.OccurrenceStatus;
import com.asterum.scheduler.schedule.domain.RecurrenceGenerator;
import com.asterum.scheduler.schedule.domain.RecurrenceSpec;
import com.asterum.scheduler.schedule.domain.ScheduleSeries;
import com.asterum.scheduler.schedule.domain.ScheduleOccurrence;
import com.asterum.scheduler.schedule.infrastructure.persistence.ScheduleOccurrenceRepository;
import com.asterum.scheduler.schedule.infrastructure.persistence.ScheduleMonthOccurrenceRow;
import com.asterum.scheduler.schedule.infrastructure.persistence.ScheduleMonthParticipantRow;
import com.asterum.scheduler.schedule.infrastructure.persistence.ScheduleMonthReadRepository;
import com.asterum.scheduler.schedule.infrastructure.persistence.ScheduleSeriesRepository;
import com.asterum.scheduler.schedule.infrastructure.persistence.ScheduleMonthTeamMemberRow;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ScheduleQueryService {

    private final ScheduleOccurrenceRepository scheduleOccurrenceRepository;
    private final ScheduleMonthReadRepository scheduleMonthReadRepository;
    private final ScheduleOccurrenceViewInitializer scheduleOccurrenceViewInitializer;
    private final ScheduleSeriesRepository scheduleSeriesRepository;
    private final RecurringSeriesMaintenanceService recurringSeriesMaintenanceService;
    private final RecurrenceGenerator recurrenceGenerator;

    public ScheduleQueryService(
        ScheduleOccurrenceRepository scheduleOccurrenceRepository,
        ScheduleMonthReadRepository scheduleMonthReadRepository,
        ScheduleOccurrenceViewInitializer scheduleOccurrenceViewInitializer,
        ScheduleSeriesRepository scheduleSeriesRepository,
        RecurringSeriesMaintenanceService recurringSeriesMaintenanceService,
        RecurrenceGenerator recurrenceGenerator
    ) {
        this.scheduleOccurrenceRepository = scheduleOccurrenceRepository;
        this.scheduleMonthReadRepository = scheduleMonthReadRepository;
        this.scheduleOccurrenceViewInitializer = scheduleOccurrenceViewInitializer;
        this.scheduleSeriesRepository = scheduleSeriesRepository;
        this.recurringSeriesMaintenanceService = recurringSeriesMaintenanceService;
        this.recurrenceGenerator = recurrenceGenerator;
    }

    @Transactional(readOnly = true)
    public ScheduleOccurrence get(Long id) {
        return scheduleOccurrenceViewInitializer.initialize(
            scheduleOccurrenceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(ErrorCode.SCHEDULE_OCCURRENCE_NOT_FOUND, id))
        );
    }

    @Transactional
    public List<ScheduleMonthView> listMonth(int year, int month) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
        materializeOccurrencesForRequestedRange(end);
        List<ScheduleMonthOccurrenceRow> occurrenceRows = scheduleMonthReadRepository.findMonthOccurrences(
            start,
            end,
            OccurrenceStatus.ACTIVE
        );
        if (occurrenceRows.isEmpty()) {
            return List.of();
        }

        Map<Long, MonthScheduleResponseBuilder> builders = new LinkedHashMap<>();
        occurrenceRows.forEach(row -> builders.put(row.occurrenceId(), MonthScheduleResponseBuilder.from(row)));

        List<Long> occurrenceIds = new ArrayList<>(builders.keySet());
        scheduleMonthReadRepository.findParticipants(occurrenceIds)
            .forEach(row -> builders.get(row.occurrenceId()).addParticipant(row));
        scheduleMonthReadRepository.findTeamMembers(occurrenceIds)
            .forEach(row -> builders.get(row.occurrenceId()).addTeamMember(row));

        return builders.values().stream()
            .map(MonthScheduleResponseBuilder::build)
            .toList();
    }

    private void materializeOccurrencesForRequestedRange(LocalDate requestedEnd) {
        scheduleSeriesRepository.findByActiveTrueAndAnchorDateLessThanEqual(requestedEnd)
            .forEach(series -> materializeSeriesThrough(series, requestedEnd));
    }

    private void materializeSeriesThrough(ScheduleSeries series, LocalDate requestedEnd) {
        RecurrenceSpec recurrenceSpec = new RecurrenceSpec(
            series.getRecurrenceType(),
            series.getIntervalValue(),
            series.getEndType(),
            series.getUntilDate(),
            series.getOccurrenceCount()
        );

        LocalDate materializationEnd = switch (series.getEndType()) {
            case NEVER -> requestedEnd;
            case UNTIL_DATE, COUNT -> requestedEnd.isBefore(recurrenceSpec.initialHorizon(series.getAnchorDate()))
                ? requestedEnd
                : recurrenceSpec.initialHorizon(series.getAnchorDate());
        };

        if (materializationEnd.isBefore(series.getAnchorDate())) {
            return;
        }

        ScheduleOccurrence latest = scheduleOccurrenceRepository.findTopBySeriesIdOrderByOccurrenceDateDescStartTimeDesc(series.getId());
        LocalDate nextDate = latest == null
            ? series.getAnchorDate()
            : recurrenceGenerator.nextDate(
                latest.getOccurrenceDate(),
                series.getRecurrenceType(),
                series.getIntervalValue()
            );
        if (nextDate.isAfter(materializationEnd)) {
            return;
        }

        recurringSeriesMaintenanceService.materializeOccurrences(
            series,
            recurrenceSpec,
            series.getTitle(),
            series.getStartTime(),
            series.getEndTime(),
            series.getResource(),
            recurringSeriesMaintenanceService.snapshotFromSeries(series),
            nextDate,
            materializationEnd,
            nextDate,
            Set.of()
        );
    }

    private static final class MonthScheduleResponseBuilder {

        private final Long occurrenceId;
        private final Long seriesId;
        private final String title;
        private final LocalDate occurrenceDate;
        private final java.time.LocalTime startTime;
        private final java.time.LocalTime endTime;
        private final boolean recurring;
        private final boolean exception;
        private final ScheduleMonthView.ResourceView resource;
        private final ScheduleMonthView.RecurrenceView recurrence;
        private final List<Long> participantIds = new ArrayList<>();
        private final List<ScheduleMonthView.ParticipantView> participants = new ArrayList<>();
        private final Map<Long, TeamBuilder> teamsById = new LinkedHashMap<>();

        private MonthScheduleResponseBuilder(
            Long occurrenceId,
            Long seriesId,
            String title,
            LocalDate occurrenceDate,
            java.time.LocalTime startTime,
            java.time.LocalTime endTime,
            boolean recurring,
            boolean exception,
            ScheduleMonthView.ResourceView resource,
            ScheduleMonthView.RecurrenceView recurrence
        ) {
            this.occurrenceId = occurrenceId;
            this.seriesId = seriesId;
            this.title = title;
            this.occurrenceDate = occurrenceDate;
            this.startTime = startTime;
            this.endTime = endTime;
            this.recurring = recurring;
            this.exception = exception;
            this.resource = resource;
            this.recurrence = recurrence;
        }

        private static MonthScheduleResponseBuilder from(ScheduleMonthOccurrenceRow row) {
            ScheduleMonthView.ResourceView resource = row.resourceId() == null
                ? null
                : new ScheduleMonthView.ResourceView(row.resourceId(), row.resourceName(), row.resourceCategory());
            ScheduleMonthView.RecurrenceView recurrence = row.seriesId() == null
                ? null
                : new ScheduleMonthView.RecurrenceView(
                    row.recurrenceType(),
                    row.recurrenceInterval(),
                    row.recurrenceEndType(),
                    row.recurrenceUntilDate(),
                    row.recurrenceCount(),
                    row.recurrenceAnchorDate()
                );

            return new MonthScheduleResponseBuilder(
                row.occurrenceId(),
                row.seriesId(),
                row.title(),
                row.occurrenceDate(),
                row.startTime(),
                row.endTime(),
                row.seriesId() != null,
                row.isException(),
                resource,
                recurrence
            );
        }

        private void addParticipant(ScheduleMonthParticipantRow row) {
            participantIds.add(row.participantId());
            participants.add(new ScheduleMonthView.ParticipantView(
                row.participantId(),
                row.participantName(),
                row.participantType()
            ));
        }

        private void addTeamMember(ScheduleMonthTeamMemberRow row) {
            TeamBuilder teamBuilder = teamsById.computeIfAbsent(
                row.teamId(),
                ignored -> new TeamBuilder(row.teamId(), row.teamName())
            );
            if (row.memberParticipantId() != null) {
                teamBuilder.addMember(row.memberParticipantId(), row.memberParticipantName(), row.memberParticipantType());
            }
        }

        private ScheduleMonthView build() {
            List<ScheduleMonthView.TeamView> teams = teamsById.values().stream()
                .map(TeamBuilder::build)
                .toList();

            return new ScheduleMonthView(
                occurrenceId,
                seriesId,
                title,
                occurrenceDate,
                startTime,
                endTime,
                recurring,
                exception,
                participants,
                teams,
                resource,
                recurrence
            );
        }
    }

    private static final class TeamBuilder {

        private final Long teamId;
        private final String teamName;
        private final List<ScheduleMonthView.ParticipantView> members = new ArrayList<>();

        private TeamBuilder(Long teamId, String teamName) {
            this.teamId = teamId;
            this.teamName = teamName;
        }

        private void addMember(Long participantId, String participantName, com.asterum.scheduler.participant.domain.ParticipantType participantType) {
            members.add(new ScheduleMonthView.ParticipantView(participantId, participantName, participantType));
        }

        private ScheduleMonthView.TeamView build() {
            return new ScheduleMonthView.TeamView(teamId, teamName, members);
        }
    }
}
