package com.asterum.scheduler.team.presentation;

import com.asterum.scheduler.team.application.TeamCommandService;
import com.asterum.scheduler.team.presentation.response.TeamResponse;
import com.asterum.scheduler.team.application.TeamQueryService;
import com.asterum.scheduler.team.presentation.request.TeamRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/teams")
public class TeamController {

    private final TeamQueryService teamQueryService;
    private final TeamCommandService teamCommandService;

    public TeamController(TeamQueryService teamQueryService, TeamCommandService teamCommandService) {
        this.teamQueryService = teamQueryService;
        this.teamCommandService = teamCommandService;
    }

    @GetMapping
    public List<TeamResponse> list() {
        return teamQueryService.list().stream()
            .map(TeamResponse::from)
            .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TeamResponse create(@Valid @RequestBody TeamRequest request) {
        return TeamResponse.from(teamCommandService.create(request.toCommand()));
    }

    @PutMapping("/{id}")
    public TeamResponse update(@PathVariable Long id, @Valid @RequestBody TeamRequest request) {
        return TeamResponse.from(teamCommandService.update(id, request.toCommand()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        teamCommandService.delete(id);
    }
}
