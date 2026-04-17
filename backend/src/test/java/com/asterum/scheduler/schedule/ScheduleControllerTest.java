package com.asterum.scheduler.schedule;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.asterum.scheduler.schedule.repository.ScheduleOccurrenceRepository;
import com.asterum.scheduler.schedule.repository.ScheduleSeriesRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class ScheduleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ScheduleOccurrenceRepository scheduleOccurrenceRepository;

    @Autowired
    private ScheduleSeriesRepository scheduleSeriesRepository;

    @BeforeEach
    void cleanSchedules() {
        scheduleOccurrenceRepository.deleteAll();
        scheduleSeriesRepository.deleteAll();
    }

    @Test
    void createsRecurringScheduleAndListsMonth() throws Exception {
        mockMvc.perform(post("/api/schedules")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "title": "주간 리허설",
                      "date": "2026-04-20",
                      "startTime": "10:00:00",
                      "endTime": "12:00:00",
                      "participantIds": [1, 3],
                      "recurrence": {
                        "enabled": true,
                        "type": "WEEKLY",
                        "interval": 1,
                        "endType": "COUNT",
                        "count": 3
                      }
                    }
                    """))
            .andExpect(status().isCreated());

        mockMvc.perform(get("/api/schedules?year=2026&month=4"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    void supportsOneTimeScheduleCrudThroughApi() throws Exception {
        String createdBody = mockMvc.perform(post("/api/schedules")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "title": "단건 API 일정",
                      "date": "2026-04-18",
                      "startTime": "13:00:00",
                      "endTime": "14:00:00",
                      "participantIds": [1, 4]
                    }
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.title").value("단건 API 일정"))
            .andReturn()
            .getResponse()
            .getContentAsString();

        String id = com.jayway.jsonpath.JsonPath.read(createdBody, "$.id").toString();

        mockMvc.perform(get("/api/schedules/{id}", id))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.participantIds", hasSize(2)));

        mockMvc.perform(put("/api/schedules/{id}", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "title": "수정된 API 일정",
                      "date": "2026-04-19",
                      "startTime": "15:00:00",
                      "endTime": "16:00:00",
                      "participantIds": [2]
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.title").value("수정된 API 일정"))
            .andExpect(jsonPath("$.date").value("2026-04-19"));

        mockMvc.perform(delete("/api/schedules/{id}", id))
            .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/schedules?year=2026&month=4"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void supportsRecurringScopesThroughApi() throws Exception {
        String createdBody = mockMvc.perform(post("/api/schedules")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "title": "범위 테스트 일정",
                      "date": "2026-04-20",
                      "startTime": "10:00:00",
                      "endTime": "12:00:00",
                      "participantIds": [1],
                      "recurrence": {
                        "enabled": true,
                        "type": "WEEKLY",
                        "interval": 1,
                        "endType": "COUNT",
                        "count": 3
                      }
                    }
                    """))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();

        String id = com.jayway.jsonpath.JsonPath.read(createdBody, "$.id").toString();

        mockMvc.perform(put("/api/schedules/{id}?scope=ALL", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "title": "전체 반영 일정",
                      "date": "2026-04-20",
                      "startTime": "11:00:00",
                      "endTime": "13:00:00",
                      "participantIds": [2, 3]
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.title").value("전체 반영 일정"));

        mockMvc.perform(get("/api/schedules?year=2026&month=4"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)))
            .andExpect(jsonPath("$[0].title").value("전체 반영 일정"))
            .andExpect(jsonPath("$[1].title").value("전체 반영 일정"));

        mockMvc.perform(delete("/api/schedules/{id}?scope=ALL", id))
            .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/schedules?year=2026&month=4"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void convertsOneTimeScheduleToRecurringSeriesThroughApi() throws Exception {
        String createdBody = mockMvc.perform(post("/api/schedules")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "title": "전환 API 일정",
                      "date": "2026-04-20",
                      "startTime": "10:00:00",
                      "endTime": "12:00:00",
                      "participantIds": [1, 3]
                    }
                    """))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();

        String id = com.jayway.jsonpath.JsonPath.read(createdBody, "$.id").toString();

        mockMvc.perform(post("/api/schedules/{id}/convert-to-series", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "enabled": true,
                      "type": "WEEKLY",
                      "interval": 1,
                      "endType": "COUNT",
                      "count": 3
                    }
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.seriesId").isNumber())
            .andExpect(jsonPath("$.recurrence.type").value("WEEKLY"))
            .andExpect(jsonPath("$.recurrence.anchorDate").value("2026-04-20"));

        mockMvc.perform(get("/api/schedules?year=2026&month=4"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)));
    }
}
