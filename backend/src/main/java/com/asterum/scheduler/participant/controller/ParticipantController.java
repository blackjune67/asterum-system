package com.asterum.scheduler.participant.controller;

import com.asterum.scheduler.participant.dto.ParticipantResponse;
import com.asterum.scheduler.participant.service.ParticipantQueryService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/participants")
public class ParticipantController {

    private final ParticipantQueryService participantQueryService;

    public ParticipantController(ParticipantQueryService participantQueryService) {
        this.participantQueryService = participantQueryService;
    }

    @GetMapping
    public List<ParticipantResponse> list() {
        return participantQueryService.list();
    }
}
