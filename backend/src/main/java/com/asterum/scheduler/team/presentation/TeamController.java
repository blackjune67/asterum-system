package com.asterum.scheduler.team.presentation;

import com.asterum.scheduler.team.presentation.response.TeamResponse;
import com.asterum.scheduler.team.application.TeamQueryService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/teams")
public class TeamController {

    private final TeamQueryService teamQueryService;

    public TeamController(TeamQueryService teamQueryService) {
        this.teamQueryService = teamQueryService;
    }

    @GetMapping
    public List<TeamResponse> list() {
        return teamQueryService.list().stream()
            .map(TeamResponse::from)
            .toList();
    }
}
