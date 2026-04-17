package com.asterum.scheduler.bootstrap;

import com.asterum.scheduler.participant.domain.Participant;
import com.asterum.scheduler.participant.domain.ParticipantType;
import com.asterum.scheduler.participant.infrastructure.persistence.ParticipantRepository;
import com.asterum.scheduler.resource.domain.Resource;
import com.asterum.scheduler.resource.infrastructure.persistence.ResourceRepository;
import com.asterum.scheduler.team.domain.Team;
import com.asterum.scheduler.team.domain.TeamMember;
import com.asterum.scheduler.team.infrastructure.persistence.TeamRepository;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SeedDataInitializer {

    @Bean
    CommandLineRunner participantSeedRunner(
        ParticipantRepository participantRepository,
        TeamRepository teamRepository,
        ResourceRepository resourceRepository
    ) {
        return args -> {
            if (participantRepository.count() == 0L) {
                List<Participant> participants = participantRepository.saveAll(List.of(
                    new Participant("예준", ParticipantType.MEMBER),
                    new Participant("노아", ParticipantType.MEMBER),
                    new Participant("은호", ParticipantType.MEMBER),
                    new Participant("밤비", ParticipantType.MEMBER),
                    new Participant("하민", ParticipantType.MEMBER),
                    new Participant("기술팀", ParticipantType.STAFF),
                    new Participant("디자인팀", ParticipantType.STAFF),
                    new Participant("촬영팀", ParticipantType.STAFF)
                ));

                Team performanceTeam = new Team("안무팀");
                performanceTeam.addMember(new TeamMember(performanceTeam, participants.get(0)));
                performanceTeam.addMember(new TeamMember(performanceTeam, participants.get(1)));
                performanceTeam.addMember(new TeamMember(performanceTeam, participants.get(2)));

                Team visualTeam = new Team("영상팀");
                visualTeam.addMember(new TeamMember(visualTeam, participants.get(3)));
                visualTeam.addMember(new TeamMember(visualTeam, participants.get(4)));

                Team productionTeam = new Team("프로덕션팀");
                productionTeam.addMember(new TeamMember(productionTeam, participants.get(5)));
                productionTeam.addMember(new TeamMember(productionTeam, participants.get(7)));

                teamRepository.saveAll(List.of(performanceTeam, visualTeam, productionTeam));
            }

            if (resourceRepository.count() == 0L) {
                resourceRepository.saveAll(List.of(
                    new Resource("메인 스튜디오", "STUDIO"),
                    new Resource("B 세트장", "SET"),
                    new Resource("회의실 A", "ROOM")
                ));
            }
        };
    }
}
