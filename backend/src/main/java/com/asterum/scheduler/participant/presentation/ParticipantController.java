package com.asterum.scheduler.participant.presentation;

import com.asterum.scheduler.participant.application.ParticipantCommandService;
import com.asterum.scheduler.participant.presentation.response.ParticipantResponse;
import com.asterum.scheduler.participant.application.ParticipantQueryService;
import com.asterum.scheduler.participant.presentation.request.ParticipantRequest;
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
@RequestMapping("/api/participants")
public class ParticipantController {

    private final ParticipantQueryService participantQueryService;
    private final ParticipantCommandService participantCommandService;

    public ParticipantController(
        ParticipantQueryService participantQueryService,
        ParticipantCommandService participantCommandService
    ) {
        this.participantQueryService = participantQueryService;
        this.participantCommandService = participantCommandService;
    }

    @GetMapping
    public List<ParticipantResponse> list() {
        return participantQueryService.list().stream()
            .map(ParticipantResponse::from)
            .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ParticipantResponse create(@Valid @RequestBody ParticipantRequest request) {
        return ParticipantResponse.from(participantCommandService.create(request.toCommand()));
    }

    @PutMapping("/{id}")
    public ParticipantResponse update(@PathVariable Long id, @Valid @RequestBody ParticipantRequest request) {
        return ParticipantResponse.from(participantCommandService.update(id, request.toCommand()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        participantCommandService.delete(id);
    }
}
