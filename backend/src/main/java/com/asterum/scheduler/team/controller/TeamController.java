package com.asterum.scheduler.team.controller;

import com.asterum.scheduler.team.dto.TeamResponse;
import com.asterum.scheduler.team.service.TeamQueryService;
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
        return teamQueryService.list();
    }
}
