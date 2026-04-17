package com.asterum.scheduler.schedule.infrastructure.persistence;

import com.asterum.scheduler.schedule.domain.OccurrenceStatus;
import jakarta.persistence.EntityManager;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Repository;

@Repository
public class ScheduleMonthReadRepository {

    private final EntityManager entityManager;

    public ScheduleMonthReadRepository(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    public List<ScheduleMonthOccurrenceRow> findMonthOccurrences(LocalDate start, LocalDate end, OccurrenceStatus status) {
        return entityManager.createQuery(
            """
                select new com.asterum.scheduler.schedule.infrastructure.persistence.ScheduleMonthOccurrenceRow(
                    occurrence.id,
                    series.id,
                    occurrence.title,
                    occurrence.occurrenceDate,
                    occurrence.startTime,
                    occurrence.endTime,
                    occurrence.isException,
                    resource.id,
                    resource.name,
                    resource.category,
                    series.recurrenceType,
                    series.intervalValue,
                    series.endType,
                    series.untilDate,
                    series.occurrenceCount,
                    series.anchorDate
                )
                from ScheduleOccurrence occurrence
                left join occurrence.series series
                left join occurrence.resource resource
                where occurrence.occurrenceDate between :start and :end
                  and occurrence.status = :status
                order by occurrence.occurrenceDate asc, occurrence.startTime asc
            """,
            ScheduleMonthOccurrenceRow.class
        )
            .setParameter("start", start)
            .setParameter("end", end)
            .setParameter("status", status)
            .getResultList();
    }

    public List<ScheduleMonthParticipantRow> findParticipants(List<Long> occurrenceIds) {
        if (occurrenceIds.isEmpty()) {
            return List.of();
        }

        return entityManager.createQuery(
            """
                select new com.asterum.scheduler.schedule.infrastructure.persistence.ScheduleMonthParticipantRow(
                    link.occurrence.id,
                    participant.id,
                    participant.name,
                    participant.type
                )
                from ScheduleOccurrenceParticipant link
                join link.participant participant
                where link.occurrence.id in :occurrenceIds
                order by link.occurrence.id asc, participant.id asc
            """,
            ScheduleMonthParticipantRow.class
        )
            .setParameter("occurrenceIds", occurrenceIds)
            .getResultList();
    }

    public List<ScheduleMonthTeamMemberRow> findTeamMembers(List<Long> occurrenceIds) {
        if (occurrenceIds.isEmpty()) {
            return List.of();
        }

        return entityManager.createQuery(
            """
                select new com.asterum.scheduler.schedule.infrastructure.persistence.ScheduleMonthTeamMemberRow(
                    link.occurrence.id,
                    team.id,
                    team.name,
                    memberParticipant.id,
                    memberParticipant.name,
                    memberParticipant.type
                )
                from ScheduleOccurrenceTeam link
                join link.team team
                left join team.members member
                left join member.participant memberParticipant
                where link.occurrence.id in :occurrenceIds
                order by link.occurrence.id asc, team.id asc, memberParticipant.id asc
            """,
            ScheduleMonthTeamMemberRow.class
        )
            .setParameter("occurrenceIds", occurrenceIds)
            .getResultList();
    }
}
