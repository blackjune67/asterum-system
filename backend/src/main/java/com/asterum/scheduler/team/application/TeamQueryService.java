package com.asterum.scheduler.team.application;

import com.asterum.scheduler.team.domain.Team;
import com.asterum.scheduler.team.infrastructure.persistence.TeamRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class TeamQueryService {

    private final TeamRepository teamRepository;

    public TeamQueryService(TeamRepository teamRepository) {
        this.teamRepository = teamRepository;
    }

    public List<Team> list() {
        return teamRepository.findAllByOrderByNameAsc();
    }
}
