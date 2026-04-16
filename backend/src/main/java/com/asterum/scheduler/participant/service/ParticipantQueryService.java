package com.asterum.scheduler.participant.service;

import com.asterum.scheduler.participant.dto.ParticipantResponse;
import com.asterum.scheduler.participant.repository.ParticipantRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ParticipantQueryService {

    private final ParticipantRepository participantRepository;

    public ParticipantQueryService(ParticipantRepository participantRepository) {
        this.participantRepository = participantRepository;
    }

    public List<ParticipantResponse> list() {
        return participantRepository.findAll().stream()
            .map(participant -> new ParticipantResponse(
                participant.getId(),
                participant.getName(),
                participant.getType()
            ))
            .toList();
    }
}
