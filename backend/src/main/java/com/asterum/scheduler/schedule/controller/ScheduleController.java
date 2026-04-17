package com.asterum.scheduler.schedule.controller;

import com.asterum.scheduler.schedule.dto.CreateScheduleRequest;
import com.asterum.scheduler.schedule.dto.RecurrenceRequest;
import com.asterum.scheduler.schedule.dto.ScheduleResponse;
import com.asterum.scheduler.schedule.dto.ScopeType;
import com.asterum.scheduler.schedule.dto.UpdateScheduleRequest;
import com.asterum.scheduler.schedule.service.ScheduleService;
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

    private final ScheduleService scheduleService;

    public ScheduleController(ScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }

    @GetMapping
    public List<ScheduleResponse> listMonth(@RequestParam int year, @RequestParam int month) {
        return scheduleService.listMonth(year, month);
    }

    @GetMapping("/{id}")
    public ScheduleResponse get(@PathVariable Long id) {
        return scheduleService.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ScheduleResponse create(@Valid @RequestBody CreateScheduleRequest request) {
        return scheduleService.create(request);
    }

    @PostMapping("/{id}/convert-to-series")
    @ResponseStatus(HttpStatus.CREATED)
    public ScheduleResponse convertToSeries(@PathVariable Long id, @Valid @RequestBody RecurrenceRequest request) {
        return scheduleService.convertToSeries(id, request);
    }

    @PutMapping("/{id}")
    public ScheduleResponse update(
        @PathVariable Long id,
        @RequestParam(defaultValue = "THIS") ScopeType scope,
        @Valid @RequestBody UpdateScheduleRequest request
    ) {
        return scheduleService.update(id, scope, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @RequestParam(defaultValue = "THIS") ScopeType scope) {
        scheduleService.delete(id, scope);
    }
}
