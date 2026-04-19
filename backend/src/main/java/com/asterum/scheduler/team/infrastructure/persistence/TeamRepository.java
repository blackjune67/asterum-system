package com.asterum.scheduler.team.infrastructure.persistence;

import com.asterum.scheduler.team.domain.Team;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface TeamRepository extends JpaRepository<Team, Long> {

    @Override
    @EntityGraph(attributePaths = {"members", "members.participant"})
    List<Team> findAll();

    @Override
    @EntityGraph(attributePaths = {"members", "members.participant"})
    Optional<Team> findById(Long id);

    @EntityGraph(attributePaths = {"members", "members.participant"})
    List<Team> findAllByOrderByNameAsc();

    Optional<Team> findByName(String name);

    @EntityGraph(attributePaths = {"members", "members.participant"})
    @Query("""
        select team
        from Team team
        join team.members member
        where member.participant.id = :participantId
        """)
    Optional<Team> findByParticipantId(Long participantId);
}
