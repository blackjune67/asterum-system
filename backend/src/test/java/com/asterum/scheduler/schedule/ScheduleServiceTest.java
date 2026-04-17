package com.asterum.scheduler.schedule;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.asterum.scheduler.common.exception.BadRequestException;
import com.asterum.scheduler.participant.repository.ParticipantRepository;
import com.asterum.scheduler.resource.repository.ResourceRepository;
import com.asterum.scheduler.schedule.domain.RecurrenceType;
import com.asterum.scheduler.schedule.domain.SeriesEndType;
import com.asterum.scheduler.schedule.dto.CreateScheduleRequest;
import com.asterum.scheduler.schedule.dto.RecurrenceRequest;
import com.asterum.scheduler.schedule.dto.ScopeType;
import com.asterum.scheduler.schedule.dto.ScheduleResponse;
import com.asterum.scheduler.schedule.dto.UpdateScheduleRequest;
import com.asterum.scheduler.schedule.repository.ScheduleOccurrenceRepository;
import com.asterum.scheduler.schedule.repository.ScheduleSeriesRepository;
import com.asterum.scheduler.schedule.service.ScheduleService;
import com.asterum.scheduler.team.domain.Team;
import com.asterum.scheduler.team.domain.TeamMember;
import com.asterum.scheduler.team.repository.TeamRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class ScheduleServiceTest {

    @Autowired
    private ScheduleService scheduleService;

    @Autowired
    private ScheduleOccurrenceRepository scheduleOccurrenceRepository;

    @Autowired
    private ScheduleSeriesRepository scheduleSeriesRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private ParticipantRepository participantRepository;

    @BeforeEach
    void cleanSchedules() {
        scheduleOccurrenceRepository.deleteAll();
        scheduleSeriesRepository.deleteAll();
    }

    @Test
    void createsOneTimeSchedule() {
        ScheduleResponse response = scheduleService.create(new CreateScheduleRequest(
            "단건 촬영",
            LocalDate.of(2026, 4, 20),
            LocalTime.of(10, 0),
            LocalTime.of(12, 0),
            List.of(1L, 3L),
            null,
            null,
            null
        ));

        assertThat(response.isRecurring()).isFalse();
        assertThat(response.participantIds()).containsExactly(1L, 3L);
    }

    @Test
    void supportsFullCrudForOneTimeSchedule() {
        ScheduleResponse created = scheduleService.create(new CreateScheduleRequest(
            "MVP1 단건 일정",
            LocalDate.of(2026, 4, 16),
            LocalTime.of(14, 0),
            LocalTime.of(16, 0),
            List.of(1L, 4L),
            null,
            null,
            null
        ));

        ScheduleResponse loaded = scheduleService.get(created.id());
        assertThat(loaded.title()).isEqualTo("MVP1 단건 일정");
        assertThat(loaded.date()).isEqualTo(LocalDate.of(2026, 4, 16));
        assertThat(loaded.participantIds()).containsExactly(1L, 4L);

        ScheduleResponse updated = scheduleService.update(created.id(), ScopeType.THIS, new UpdateScheduleRequest(
            "수정된 단건 일정",
            LocalDate.of(2026, 4, 17),
            LocalTime.of(15, 0),
            LocalTime.of(17, 0),
            List.of(2L, 3L),
            null,
            null
        ));

        assertThat(updated.title()).isEqualTo("수정된 단건 일정");
        assertThat(updated.date()).isEqualTo(LocalDate.of(2026, 4, 17));
        assertThat(updated.participantIds()).containsExactly(2L, 3L);

        scheduleService.delete(created.id(), ScopeType.THIS);

        assertThat(scheduleService.listMonth(2026, 4)).isEmpty();
    }

    @Test
    void createsDailyRecurringScheduleUntilSpecificDate() {
        scheduleService.create(new CreateScheduleRequest(
            "매일 촬영",
            LocalDate.of(2026, 4, 20),
            LocalTime.of(8, 0),
            LocalTime.of(9, 0),
            List.of(1L, 2L),
            null,
            null,
            new RecurrenceRequest(true, RecurrenceType.DAILY, 1, SeriesEndType.UNTIL_DATE, LocalDate.of(2026, 4, 22), null)
        ));

        assertThat(scheduleService.listMonth(2026, 4)).extracting(ScheduleResponse::date, ScheduleResponse::isRecurring)
            .containsExactly(
                org.assertj.core.groups.Tuple.tuple(LocalDate.of(2026, 4, 20), true),
                org.assertj.core.groups.Tuple.tuple(LocalDate.of(2026, 4, 21), true),
                org.assertj.core.groups.Tuple.tuple(LocalDate.of(2026, 4, 22), true)
            );
    }

    @Test
    void createsMonthlyRecurringScheduleWithoutEndAndExtendsHorizon() {
        scheduleService.create(new CreateScheduleRequest(
            "무기한 월간 촬영",
            LocalDate.of(2026, 4, 5),
            LocalTime.of(10, 0),
            LocalTime.of(12, 0),
            List.of(1L),
            null,
            null,
            new RecurrenceRequest(true, RecurrenceType.MONTHLY, 1, SeriesEndType.NEVER, null, null)
        ));

        assertThat(scheduleService.listMonth(2026, 4)).extracting(ScheduleResponse::date)
            .containsExactly(LocalDate.of(2026, 4, 5));

        assertThat(scheduleService.listMonth(2026, 8)).extracting(ScheduleResponse::date)
            .containsExactly(LocalDate.of(2026, 8, 5));
    }

    @Test
    void convertsOneTimeScheduleIntoRecurringSeries() {
        ScheduleResponse created = scheduleService.create(new CreateScheduleRequest(
            "전환 대상 일정",
            LocalDate.of(2026, 4, 20),
            LocalTime.of(10, 0),
            LocalTime.of(12, 0),
            List.of(1L, 3L),
            null,
            null,
            null
        ));

        ScheduleResponse converted = scheduleService.convertToSeries(
            created.id(),
            new RecurrenceRequest(true, RecurrenceType.WEEKLY, 1, SeriesEndType.COUNT, null, 3)
        );

        assertThat(converted.seriesId()).isNotNull();
        assertThat(converted.isRecurring()).isTrue();
        assertThat(converted.date()).isEqualTo(LocalDate.of(2026, 4, 20));
        assertThat(converted.recurrence()).isNotNull();
        assertThat(converted.recurrence().anchorDate()).isEqualTo(LocalDate.of(2026, 4, 20));
        assertThat(converted.participantIds()).containsExactly(1L, 3L);

        assertThat(scheduleService.listMonth(2026, 4)).extracting(ScheduleResponse::date, ScheduleResponse::title)
            .containsExactly(
                org.assertj.core.groups.Tuple.tuple(LocalDate.of(2026, 4, 20), "전환 대상 일정"),
                org.assertj.core.groups.Tuple.tuple(LocalDate.of(2026, 4, 27), "전환 대상 일정")
            );

        assertThat(scheduleService.listMonth(2026, 5)).extracting(ScheduleResponse::date)
            .containsExactly(LocalDate.of(2026, 5, 4));
    }

    @Test
    void expandsTeamSelectionIntoParticipantSnapshotAndKeepsSelectedTeams() {
        Long teamId = teamRepository.findAll().stream()
            .filter(team -> team.getName().equals("퍼포먼스팀"))
            .map(Team::getId)
            .findFirst()
            .orElseThrow();
        Long resourceId = resourceRepository.findAll().stream()
            .filter(resource -> resource.getName().equals("메인 스튜디오"))
            .map(resource -> resource.getId())
            .findFirst()
            .orElseThrow();

        ScheduleResponse created = scheduleService.create(new CreateScheduleRequest(
            "팀 촬영",
            LocalDate.of(2026, 4, 18),
            LocalTime.of(10, 0),
            LocalTime.of(12, 0),
            List.of(5L),
            List.of(teamId),
            resourceId,
            null
        ));

        assertThat(created.teamIds()).containsExactly(teamId);
        assertThat(created.resource()).isNotNull();
        assertThat(created.resource().name()).isEqualTo("메인 스튜디오");
        assertThat(created.participantIds()).containsExactly(1L, 2L, 3L, 5L);
    }

    @Test
    void keepsRecurringTeamSnapshotStableWhenTeamMembershipChangesLater() {
        Team performanceTeam = teamRepository.findAll().stream()
            .filter(team -> team.getName().equals("퍼포먼스팀"))
            .findFirst()
            .orElseThrow();

        scheduleService.create(new CreateScheduleRequest(
            "무기한 팀 일정",
            LocalDate.of(2026, 4, 10),
            LocalTime.of(10, 0),
            LocalTime.of(12, 0),
            List.of(),
            List.of(performanceTeam.getId()),
            null,
            new RecurrenceRequest(true, RecurrenceType.MONTHLY, 1, SeriesEndType.NEVER, null, null)
        ));

        performanceTeam.addMember(new TeamMember(
            performanceTeam,
            participantRepository.findById(5L).orElseThrow()
        ));

        ScheduleResponse augustOccurrence = scheduleService.listMonth(2026, 8).get(0);

        assertThat(augustOccurrence.teamIds()).containsExactly(performanceTeam.getId());
        assertThat(augustOccurrence.participantIds()).containsExactly(1L, 2L, 3L);
    }

    @Test
    void rejectsResourceCollisionForOverlappingSchedules() {
        Long resourceId = resourceRepository.findAll().stream()
            .filter(resource -> resource.getName().equals("메인 스튜디오"))
            .map(resource -> resource.getId())
            .findFirst()
            .orElseThrow();

        scheduleService.create(new CreateScheduleRequest(
            "리소스 선점",
            LocalDate.of(2026, 4, 20),
            LocalTime.of(10, 0),
            LocalTime.of(12, 0),
            List.of(1L),
            null,
            resourceId,
            null
        ));

        assertThatThrownBy(() -> scheduleService.create(new CreateScheduleRequest(
            "충돌 일정",
            LocalDate.of(2026, 4, 20),
            LocalTime.of(11, 0),
            LocalTime.of(13, 0),
            List.of(2L),
            null,
            resourceId,
            null
        )))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Resource collision");
    }

    @Test
    void updatesSingleRecurringOccurrenceAsException() {
        scheduleService.create(new CreateScheduleRequest(
            "주간 촬영",
            LocalDate.of(2026, 4, 20),
            LocalTime.of(10, 0),
            LocalTime.of(12, 0),
            List.of(1L),
            null,
            null,
            new RecurrenceRequest(true, RecurrenceType.WEEKLY, 1, SeriesEndType.COUNT, null, 3)
        ));

        ScheduleResponse target = scheduleService.listMonth(2026, 4).stream()
            .filter(item -> item.date().equals(LocalDate.of(2026, 4, 27)))
            .findFirst()
            .orElseThrow();

        ScheduleResponse updated = scheduleService.update(target.id(), ScopeType.THIS, new UpdateScheduleRequest(
            "변경된 촬영",
            LocalDate.of(2026, 4, 28),
            LocalTime.of(11, 0),
            LocalTime.of(13, 0),
            List.of(2L),
            null,
            null
        ));

        assertThat(updated.isException()).isTrue();
        assertThat(updated.date()).isEqualTo(LocalDate.of(2026, 4, 28));
        assertThat(updated.participantIds()).containsExactly(2L);
    }

    @Test
    void deletesFollowingRecurringOccurrences() {
        scheduleService.create(new CreateScheduleRequest(
            "주간 안무",
            LocalDate.of(2026, 4, 20),
            LocalTime.of(9, 0),
            LocalTime.of(10, 0),
            List.of(1L),
            null,
            null,
            new RecurrenceRequest(true, RecurrenceType.WEEKLY, 1, SeriesEndType.COUNT, null, 4)
        ));

        ScheduleResponse target = scheduleService.listMonth(2026, 4).stream()
            .filter(item -> item.date().equals(LocalDate.of(2026, 4, 27)))
            .findFirst()
            .orElseThrow();

        scheduleService.delete(target.id(), ScopeType.FOLLOWING);

        assertThat(scheduleService.listMonth(2026, 4)).extracting(ScheduleResponse::date)
            .containsExactly(LocalDate.of(2026, 4, 20));
    }

    @Test
    void updatesFollowingRecurringOccurrencesWithNewSeries() {
        scheduleService.create(new CreateScheduleRequest(
            "Weekly shoot",
            LocalDate.of(2026, 4, 20),
            LocalTime.of(10, 0),
            LocalTime.of(12, 0),
            List.of(1L),
            null,
            null,
            new RecurrenceRequest(true, RecurrenceType.WEEKLY, 1, SeriesEndType.COUNT, null, 4)
        ));

        ScheduleResponse target = scheduleService.listMonth(2026, 4).stream()
            .filter(item -> item.date().equals(LocalDate.of(2026, 4, 27)))
            .findFirst()
            .orElseThrow();

        ScheduleResponse updated = scheduleService.update(target.id(), ScopeType.FOLLOWING, new UpdateScheduleRequest(
            "Updated shoot",
            LocalDate.of(2026, 4, 27),
            LocalTime.of(11, 0),
            LocalTime.of(13, 0),
            List.of(2L, 3L),
            null,
            null
        ));

        assertThat(updated.date()).isEqualTo(LocalDate.of(2026, 4, 27));
        assertThat(updated.title()).isEqualTo("Updated shoot");
        assertThat(updated.participantIds()).containsExactly(2L, 3L);

        assertThat(scheduleService.listMonth(2026, 4)).extracting(ScheduleResponse::date, ScheduleResponse::title)
            .containsExactly(
                org.assertj.core.groups.Tuple.tuple(LocalDate.of(2026, 4, 20), "Weekly shoot"),
                org.assertj.core.groups.Tuple.tuple(LocalDate.of(2026, 4, 27), "Updated shoot")
            );

        assertThat(scheduleService.listMonth(2026, 5)).extracting(ScheduleResponse::date, ScheduleResponse::title)
            .containsExactly(
                org.assertj.core.groups.Tuple.tuple(LocalDate.of(2026, 5, 4), "Updated shoot"),
                org.assertj.core.groups.Tuple.tuple(LocalDate.of(2026, 5, 11), "Updated shoot")
            );
    }

    @Test
    void updatesAllRecurringOccurrences() {
        scheduleService.create(new CreateScheduleRequest(
            "전체 수정 전",
            LocalDate.of(2026, 4, 20),
            LocalTime.of(10, 0),
            LocalTime.of(12, 0),
            List.of(1L),
            null,
            null,
            new RecurrenceRequest(true, RecurrenceType.WEEKLY, 1, SeriesEndType.COUNT, null, 3)
        ));

        ScheduleResponse target = scheduleService.listMonth(2026, 4).get(0);

        scheduleService.update(target.id(), ScopeType.ALL, new UpdateScheduleRequest(
            "전체 수정 후",
            target.date(),
            LocalTime.of(13, 0),
            LocalTime.of(15, 0),
            List.of(2L, 4L),
            null,
            null
        ));

        assertThat(scheduleService.listMonth(2026, 4)).extracting(
            ScheduleResponse::title,
            ScheduleResponse::startTime,
            ScheduleResponse::endTime,
            ScheduleResponse::participantIds
        ).containsExactly(
            org.assertj.core.groups.Tuple.tuple("전체 수정 후", LocalTime.of(13, 0), LocalTime.of(15, 0), List.of(2L, 4L)),
            org.assertj.core.groups.Tuple.tuple("전체 수정 후", LocalTime.of(13, 0), LocalTime.of(15, 0), List.of(2L, 4L))
        );

        assertThat(scheduleService.listMonth(2026, 5)).extracting(ScheduleResponse::title)
            .containsExactly("전체 수정 후");
    }

    @Test
    void deletesAllRecurringOccurrences() {
        scheduleService.create(new CreateScheduleRequest(
            "전체 삭제 대상",
            LocalDate.of(2026, 4, 20),
            LocalTime.of(10, 0),
            LocalTime.of(12, 0),
            List.of(1L),
            null,
            null,
            new RecurrenceRequest(true, RecurrenceType.WEEKLY, 1, SeriesEndType.COUNT, null, 4)
        ));

        ScheduleResponse target = scheduleService.listMonth(2026, 4).get(0);

        scheduleService.delete(target.id(), ScopeType.ALL);

        assertThat(scheduleService.listMonth(2026, 4)).isEmpty();
        assertThat(scheduleService.listMonth(2026, 5)).isEmpty();
    }
}
