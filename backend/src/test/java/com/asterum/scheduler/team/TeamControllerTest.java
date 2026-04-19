package com.asterum.scheduler.team;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.asterum.scheduler.participant.infrastructure.persistence.ParticipantRepository;
import com.asterum.scheduler.team.infrastructure.persistence.TeamRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class TeamControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private ParticipantRepository participantRepository;

    private Long visualTeamId;
    private Long cameraManId;

    @BeforeEach
    void setUp() {
        visualTeamId = teamRepository.findAllByOrderByNameAsc().stream()
            .filter(team -> team.getName().equals("영상팀"))
            .map(team -> team.getId())
            .findFirst()
            .orElseThrow();
        cameraManId = participantRepository.findByName("카메라맨A")
            .map(participant -> participant.getId())
            .orElseThrow();
    }

    @Test
    void returnsSeededTeamsWithStaffMembers() throws Exception {
        mockMvc.perform(get("/api/teams"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(3)))
            .andExpect(jsonPath("$[?(@.name=='영상팀')].members[0][?(@.name=='카메라맨A')]").exists())
            .andExpect(jsonPath("$[?(@.name=='영상팀')].memberIds[0]").value(hasItem(cameraManId.intValue())));
    }

    @Test
    void createsUpdatesAndDeletesEmptyTeam() throws Exception {
        String createdBody = mockMvc.perform(post("/api/teams")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "name": "조명팀"
                    }
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name").value("조명팀"))
            .andExpect(jsonPath("$.memberIds", hasSize(0)))
            .andReturn()
            .getResponse()
            .getContentAsString();

        String teamId = com.jayway.jsonpath.JsonPath.read(createdBody, "$.id").toString();

        mockMvc.perform(put("/api/teams/{id}", teamId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "name": "조명운영팀"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("조명운영팀"));

        mockMvc.perform(delete("/api/teams/{id}", teamId))
            .andExpect(status().isNoContent());
    }

    @Test
    void rejectsDeletingTeamWithMembers() throws Exception {
        mockMvc.perform(delete("/api/teams/{id}", visualTeamId))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("TEAM_HAS_MEMBERS"));
    }

    @Test
    void rejectsDeletingTeamReferencedBySchedule() throws Exception {
        String createdBody = mockMvc.perform(post("/api/teams")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "name": "무멤버임시팀"
                    }
                    """))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();

        String teamId = com.jayway.jsonpath.JsonPath.read(createdBody, "$.id").toString();

        mockMvc.perform(post("/api/schedules")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "title": "빈 팀 참조 일정",
                      "date": "2026-04-20",
                      "startTime": "10:00:00",
                      "endTime": "12:00:00",
                      "participantIds": [],
                      "teamIds": [%s]
                    }
                    """.formatted(teamId)))
            .andExpect(status().isCreated());

        mockMvc.perform(delete("/api/teams/{id}", teamId))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("TEAM_IN_USE"));
    }
}
