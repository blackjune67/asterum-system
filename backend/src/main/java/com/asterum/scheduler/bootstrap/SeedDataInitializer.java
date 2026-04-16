package com.asterum.scheduler.bootstrap;

import com.asterum.scheduler.participant.domain.Participant;
import com.asterum.scheduler.participant.domain.ParticipantType;
import com.asterum.scheduler.participant.repository.ParticipantRepository;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SeedDataInitializer {

    @Bean
    CommandLineRunner participantSeedRunner(ParticipantRepository participantRepository) {
        return args -> {
            if (participantRepository.count() == 0L) {
                participantRepository.saveAll(List.of(
                    new Participant("하민", ParticipantType.MEMBER),
                    new Participant("노아", ParticipantType.MEMBER),
                    new Participant("디자인팀", ParticipantType.STAFF),
                    new Participant("촬영팀", ParticipantType.STAFF)
                ));
            }
        };
    }
}
