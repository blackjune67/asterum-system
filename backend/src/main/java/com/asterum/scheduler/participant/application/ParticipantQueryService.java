package com.asterum.scheduler.participant.application;

import com.asterum.scheduler.participant.domain.Participant;
import com.asterum.scheduler.participant.infrastructure.persistence.ParticipantRepository;
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

    public List<Participant> list() {
        return participantRepository.findAll();
    }
}
