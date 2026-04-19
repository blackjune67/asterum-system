package com.asterum.scheduler.participant.infrastructure.persistence;

import com.asterum.scheduler.participant.domain.Participant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ParticipantRepository extends JpaRepository<Participant, Long> {

    List<Participant> findAllByOrderByIdAsc();

    Optional<Participant> findByName(String name);
}
