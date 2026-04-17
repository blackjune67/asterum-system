package com.asterum.scheduler.team.repository;

import com.asterum.scheduler.team.domain.Team;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeamRepository extends JpaRepository<Team, Long> {

    @Override
    @EntityGraph(attributePaths = {"members", "members.participant"})
    List<Team> findAll();

    @EntityGraph(attributePaths = {"members", "members.participant"})
    List<Team> findAllByOrderByNameAsc();
}
