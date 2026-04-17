package com.asterum.scheduler.schedule.presentation;

import com.asterum.scheduler.schedule.presentation.request.CreateScheduleRequest;
import com.asterum.scheduler.schedule.presentation.request.RecurrenceRequest;
import com.asterum.scheduler.schedule.presentation.request.ScopeType;
import com.asterum.scheduler.schedule.presentation.request.UpdateScheduleRequest;
import com.asterum.scheduler.schedule.presentation.response.ScheduleResponse;
import com.asterum.scheduler.schedule.presentation.response.ScheduleResponseAssembler;
import com.asterum.scheduler.schedule.application.ScheduleCommandService;
import com.asterum.scheduler.schedule.application.ScheduleQueryService;
import com.asterum.scheduler.schedule.domain.ScheduleOccurrence;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/schedules")
public class ScheduleController {

    private final ScheduleCommandService scheduleCommandService;
    private final ScheduleQueryService scheduleQueryService;
    private final ScheduleResponseAssembler scheduleResponseAssembler;

    public ScheduleController(
        ScheduleCommandService scheduleCommandService,
        ScheduleQueryService scheduleQueryService,
        ScheduleResponseAssembler scheduleResponseAssembler
    ) {
        this.scheduleCommandService = scheduleCommandService;
        this.scheduleQueryService = scheduleQueryService;
        this.scheduleResponseAssembler = scheduleResponseAssembler;
    }

    @GetMapping
    public List<ScheduleResponse> listMonth(@RequestParam int year, @RequestParam int month) {
        return scheduleQueryService.listMonth(year, month).stream()
            .map(scheduleResponseAssembler::toResponse)
            .toList();
    }

    @GetMapping("/{id}")
    public ScheduleResponse get(@PathVariable Long id) {
        return scheduleResponseAssembler.toResponse(scheduleQueryService.get(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ScheduleResponse create(@Valid @RequestBody CreateScheduleRequest request) {
        return scheduleResponseAssembler.toResponse(scheduleCommandService.create(request.toCommand()));
    }

    @PostMapping("/{id}/convert-to-series")
    @ResponseStatus(HttpStatus.CREATED)
    public ScheduleResponse convertToSeries(@PathVariable Long id, @Valid @RequestBody RecurrenceRequest request) {
        return scheduleResponseAssembler.toResponse(scheduleCommandService.convertToSeries(id, request.toCommand()));
    }

    @PutMapping("/{id}")
    public ScheduleResponse update(
        @PathVariable Long id,
        @RequestParam(defaultValue = "THIS") ScopeType scope,
        @Valid @RequestBody UpdateScheduleRequest request
    ) {
        ScheduleOccurrence updated = scheduleCommandService.update(id, scope.toApplicationScope(), request.toCommand());
        return scheduleResponseAssembler.toResponse(updated);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @RequestParam(defaultValue = "THIS") ScopeType scope) {
        scheduleCommandService.delete(id, scope.toApplicationScope());
    }
}
